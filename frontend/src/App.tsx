import { useEffect, useRef, useState } from "react";
import { PhaseCanvas } from "./components/PhaseCanvas";
import { Citations } from "./components/Citations";
import { ReportView } from "./components/ReportView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { CliTerminal } from "./components/CliTerminal";
import {
  PastAnalysis,
  type PastAnalysisData,
} from "./components/PastAnalysis";
import { ShieldLogo } from "./components/ShieldLogo";
import { SystemStatusModal } from "./components/SystemStatusModal";
import {
  FileText,
  Terminal,
  History,
  Activity,
  Brain,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { downloadConsultantPDF } from "./utils/reportExportPDF";
import { STREAM_ENDPOINT } from "./config";
import type {
  AssessmentRequest,
  CISOBrief,
  PhaseEvent,
  ResultEvent,
  ErrorEvent,
  Citation,
} from "./types/api";
import {
  buildReportExportPayload,
  clampScore,
} from "./utils/assessmentMetrics";

type PhaseStatus = "pending" | "active" | "completed" | "error";
type StepStatus = "pending" | "active" | "completed" | "error" | "skipped";
type LogStatus = "active" | "completed" | "error" | "info" | "warning";

interface PhaseStep {
  id: string;
  message: string;
  detail: string;
  status: StepStatus;
  optional?: boolean;
  sources?: string[];
}

interface Phase {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  steps: PhaseStep[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  status: LogStatus;
}

interface PastAnalysisEntry extends PastAnalysisData {
  assessment?: CISOBrief;
}

const PHASE_DEFINITIONS: Record<
  "phase_1" | "phase_2" | "phase_3" | "phase_4",
  { name: string; description: string }
> = {
  phase_1: {
    name: "Entity Resolution",
    description:
      "Identifying the product, vendor, and website from your input",
  },
  phase_2: {
    name: "Software Classification",
    description: "Categorizing the software using AI and industry taxonomies",
  },
  phase_3: {
    name: "Security Data Gathering",
    description: "Collecting security intelligence from 15+ trusted sources",
  },
  phase_4: {
    name: "AI Analysis & Brief Generation",
    description:
      "Synthesizing findings into a CISO-ready security assessment",
  },
};

const PHASE_ORDER = Object.keys(PHASE_DEFINITIONS) as Array<
  keyof typeof PHASE_DEFINITIONS
>;

const HISTORY_STORAGE_KEY = "withsecure-past-analyses";
const DEFAULT_CACHE_TTL = 24;

function createInitialPhases(): Phase[] {
  return PHASE_ORDER.map((id) => ({
    id,
    name: PHASE_DEFINITIONS[id].name,
    description: PHASE_DEFINITIONS[id].description,
    status: "pending",
    progress: 0,
    steps: [],
  }));
}

function sanitizeStepId(phaseId: string, step?: string) {
  if (!step) {
    return `${phaseId}-progress`;
  }
  const normalized = step
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${phaseId}-${normalized || "step"}`;
}

function cleanMessage(message: string): string {
  return message.replace(/^[─├└│\s]+/, "").trim();
}

function mergeDetails(existing: string, messages: string[]): string {
  if (!messages.length) {
    return existing;
  }
  const lines = existing
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  for (const message of messages) {
    if (!lines.includes(message)) {
      lines.push(message);
    }
  }
  return lines.join("\n");
}

function computeProgress(
  steps: PhaseStep[],
  completedOverride = false,
): number {
  if (completedOverride) {
    return 100;
  }
  if (steps.length === 0) {
    return 10;
  }
  const completed = steps.filter((step) => step.status === "completed").length;
  const active = steps.some((step) => step.status === "active") ? 1 : 0;
  const total = Math.max(steps.length, 4);
  return Math.min(
    100,
    Math.round(((completed + active * 0.5) / total) * 100),
  );
}

function isImportantMessage(message: string): boolean {
  if (!message || typeof message !== "string") {
    return false;
  }
  const trimmed = message.trim();
  const skipPatterns = [
    /^─+$/,
    /^\s*$/,
    /^Step \d+\/\d+:/i,
    /^└─/,
    /^├─/,
    /^│/,
    /^▸.*Starting/i,
    /Initializing\.\.\./i,
    /Resolving entity\.\.\./i,
    /Classifying software\.\.\./i,
    /Gathering security data\.\.\./i,
    /Generating report\.\.\./i,
    /Loaded from cache$/i,
    /Retrieved from cache$/i,
    /Entity Resolved$/i,
    /Classification Complete$/i,
    /Data Gathering Complete$/i,
    /Brief Complete$/i,
    /PHASE \d+:/i,
    /Running.*classification/i,
    /Invoking LLM/i,
    /Analyzing input format/i,
    /Checking against.*categories/i,
  ];
  if (skipPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }
  const includePatterns = [
    /Product Name:/i,
    /Vendor Name:/i,
    /Category:/i,
    /Confidence:/i,
    /Reasoning:/i,
    /Rationale:/i,
    /Trust Score:/i,
    /Risk Score:/i,
    /Found \d+/i,
    /\d+ CVEs/i,
    /\d+ alternatives/i,
    /\d+ breaches/i,
    /\d+ incidents/i,
    /SOC 2/i,
    /ISO \d+/i,
    /GDPR/i,
    /HIPAA/i,
    /Compliance:/i,
    /Encryption/i,
    /SUCCESSFULLY/i,
    /\[OK\]/,
    /\[FAILED\]/,
    /\[WARNING\]/,
    /⚠/,
    /Version:/i,
    /Website:/i,
  ];
  return includePatterns.some((pattern) => pattern.test(trimmed));
}

function parseSSEMessage(
  data: string,
): { event: string; data: any } | null {
  try {
    const lines = data.split("\n");
    let event = "message";
    let jsonData = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.substring(6).trim();
      } else if (line.startsWith("data:")) {
        jsonData = line.substring(5).trim();
      }
    }
    if (jsonData) {
      return { event, data: JSON.parse(jsonData) };
    }
  } catch (err) {
    console.error("Error parsing SSE message:", err);
  }
  return null;
}

function detectInputPayload(input: string): {
  payload: AssessmentRequest;
  displayQuery: string;
} {
  const trimmed = input.trim();
  const payload: AssessmentRequest = {
    cache_ttl: DEFAULT_CACHE_TTL,
  };
  let displayQuery = trimmed;

  const isSha1 = /^[a-f0-9]{40}$/i.test(trimmed);
  const isUrl = /^https?:\/\/\S+/i.test(trimmed);

  if (isSha1) {
    payload.sha1 = trimmed;
    payload.product = trimmed;
  } else if (isUrl) {
    payload.url = trimmed;
    payload.product = trimmed;
  } else {
    payload.product = trimmed;
  }

  return { payload, displayQuery };
}

function getTimestamp(date: Date = new Date()): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function calculateComplianceScore(compliance: CISOBrief["compliance"]): number {
  if (!compliance) {
    return 0;
  }
  const metrics: number[] = [];
  if (compliance.soc2_status) {
    metrics.push(
      /(compliant|certified|attested|yes)/i.test(compliance.soc2_status)
        ? 1
        : 0,
    );
  }
  metrics.push(compliance.iso_certifications?.length ? 1 : 0);
  metrics.push(compliance.gdpr_compliant ? 1 : 0);
  metrics.push(compliance.ccpa_compliant ? 1 : 0);
  metrics.push(compliance.hipaa_compliant ? 1 : 0);
  const total = metrics.length || 1;
  return Math.round((metrics.reduce((sum, value) => sum + value, 0) / total) * 100);
}

function calculateVendorScore(
  vendor: CISOBrief["vendor_reputation"],
): number {
  if (!vendor) {
    return 0;
  }
  let score = 40;
  if (vendor.security_page_found) {
    score += 20;
  }
  if (vendor.security_contact) {
    score += 10;
  }
  if (vendor.claimed_certifications?.length) {
    score += 10;
  }
  score += Math.min(20, (vendor.security_advisories_found ?? 0) * 2);
  return clampScore(score);
}

function calculateDataHandlingScore(
  dataHandling: CISOBrief["data_handling"],
): number {
  if (!dataHandling) {
    return 0;
  }
  let score = 40;
  if (dataHandling.encryption_claimed) {
    score += 20;
  }
  if (dataHandling.tos_url) {
    score += 10;
  }
  if (dataHandling.privacy_policy_url) {
    score += 10;
  }
  if (dataHandling.dpa_url) {
    score += 5;
  }
  if (dataHandling.data_retention) {
    score += 5;
  }
  if (dataHandling.data_location) {
    score += 5;
  }
  return clampScore(score);
}

function calculateIncidentScore(
  incidents: CISOBrief["incidents"],
): number {
  if (!incidents) {
    return 0;
  }
  let score = 80;
  if (incidents.breach_count && incidents.breach_count > 0) {
    score -= Math.min(60, incidents.breach_count * 15);
  }
  return clampScore(score);
}

function buildPhaseSummarySteps(
  phaseId: keyof typeof PHASE_DEFINITIONS,
  assessment: CISOBrief,
): PhaseStep[] {
  switch (phaseId) {
    case "phase_1":
      return [
        {
          id: `${phaseId}-entity`,
          message: "Entity resolved",
          detail: `${assessment.entity.product_name} · ${assessment.entity.vendor_name}`,
          status: "completed",
        },
        {
          id: `${phaseId}-input-type`,
          message: "Input type",
          detail: `Detected as ${assessment.entity.input_type}${
            assessment.entity.confidence
              ? ` · confidence ${assessment.entity.confidence}`
              : ""
          }`,
          status: "completed",
        },
        assessment.entity.website
          ? {
              id: `${phaseId}-website`,
              message: "Website",
              detail: assessment.entity.website,
              status: "completed" as const,
            }
          : null,
      ].filter(Boolean) as PhaseStep[];
    case "phase_2":
      return [
        {
          id: `${phaseId}-category`,
          message: "Primary category",
          detail: assessment.taxonomy.primary_category,
          status: "completed",
        },
        {
          id: `${phaseId}-categories`,
          message: "Secondary categories",
          detail:
            assessment.taxonomy.secondary_categories?.join(", ") ||
            "None identified",
          status: "completed",
        },
      ];
    case "phase_3":
      return [
        {
          id: `${phaseId}-cves`,
          message: "CVE coverage",
          detail: `Total ${assessment.cve_summary.total_cves} · Critical ${assessment.cve_summary.critical_count} · High ${assessment.cve_summary.high_count}`,
          status: "completed",
        },
        {
          id: `${phaseId}-incidents`,
          message: "Incident history",
          detail: `${assessment.incidents.breach_count} breaches and ${assessment.incidents.incidents.length} incidents referenced`,
          status: "completed",
        },
        {
          id: `${phaseId}-compliance`,
          message: "Vendor compliance sources",
          detail: `Sources: ${assessment.cve_summary.citation || "N/A"}`,
          status: "completed",
        },
      ];
    case "phase_4":
      return [
        {
          id: `${phaseId}-scores`,
          message: "Trust & risk scores",
          detail: `Trust ${clampScore(assessment.trust_score)} · Risk ${clampScore(assessment.risk_score)}`,
          status: "completed",
        },
        {
          id: `${phaseId}-summary`,
          message: "Assessment summary",
          detail: assessment.rationale || "Rationale not provided",
          status: "completed",
        },
        {
          id: `${phaseId}-alternatives`,
          message: "Safer alternatives",
          detail:
            assessment.safer_alternatives.length > 0
              ? assessment.safer_alternatives
                  .map(
                    (alt) =>
                      `${alt.product_name}${
                        alt.vendor_name ? ` (${alt.vendor_name})` : ""
                      }`,
                  )
                  .join(", ")
              : "No alternatives recommended",
          status: "completed",
        },
      ];
  }
}

function createPhasesFromAssessment(assessment: CISOBrief): Phase[] {
  return PHASE_ORDER.map((phaseId) => ({
    id: phaseId,
    name: PHASE_DEFINITIONS[phaseId].name,
    description: PHASE_DEFINITIONS[phaseId].description,
    status: "completed",
    progress: 100,
    steps: buildPhaseSummarySteps(phaseId, assessment),
  }));
}

function buildSummaryLogs(assessment: CISOBrief): LogEntry[] {
  const entries: LogEntry[] = [];
  const now = new Date();
  const push = (
    nodeId: string,
    nodeLabel: string,
    message: string,
    status: LogStatus = "completed",
  ) => {
    entries.push({
      id: `${nodeId}-${entries.length}`,
      timestamp: getTimestamp(now),
      nodeId,
      nodeLabel,
      message,
      status,
    });
  };
  push(
    "phase_1",
    PHASE_DEFINITIONS.phase_1.name,
    `Resolved entity: ${assessment.entity.product_name} (${assessment.entity.vendor_name})`,
  );
  if (assessment.entity.website) {
    push(
      "phase_1",
      PHASE_DEFINITIONS.phase_1.name,
      `Website: ${assessment.entity.website}`,
    );
  }
  push(
    "phase_2",
    PHASE_DEFINITIONS.phase_2.name,
    `Primary category: ${assessment.taxonomy.primary_category}`,
  );
  push(
    "phase_3",
    PHASE_DEFINITIONS.phase_3.name,
    `Total CVEs analysed: ${assessment.cve_summary.total_cves}`,
  );
  push(
    "phase_4",
    PHASE_DEFINITIONS.phase_4.name,
    `Trust score ${clampScore(assessment.trust_score)} · Risk score ${clampScore(assessment.risk_score)}`,
  );
  push("complete", "Assessment Complete", "Assessment loaded from history");
  return entries;
}

function createAnalysisId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadHistory(): PastAnalysisEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as PastAnalysisEntry[];
  } catch {
    return [];
  }
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [input, setInput] = useState("");
  const [phases, setPhases] = useState<Phase[]>(() => createInitialPhases());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const [assessment, setAssessment] = useState<CISOBrief | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [cliTerminalOpen, setCliTerminalOpen] = useState(false);
  const [pastAnalysisOpen, setPastAnalysisOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [pastAnalyses, setPastAnalyses] = useState<PastAnalysisEntry[]>(
    () => loadHistory(),
  );

  const controllerRef = useRef<AbortController | null>(null);

  const reportReady = Boolean(assessment);
  const completedPhases = phases.filter(
    (phase) => phase.status === "completed",
  ).length;
  const totalPhases = phases.length || PHASE_ORDER.length;

  useEffect(() => {
    document.title = "CISO Security Assessor";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(pastAnalyses.slice(0, 15)),
    );
  }, [pastAnalyses]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const addLog = (
    nodeId: string,
    nodeLabel: string,
    message: string,
    status: LogStatus = "info",
  ) => {
    const cleaned = cleanMessage(message);
    if (!cleaned) {
      return;
    }
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId,
        nodeLabel,
        message: cleaned,
        status,
      },
    ]);
  };

  const updatePhasesWithEvent = (event: PhaseEvent) => {
    const phaseId = event.phase as keyof typeof PHASE_DEFINITIONS;
    if (!PHASE_ORDER.includes(phaseId)) {
      if (event.phase === "cache") {
        addLog("cache", "Cache", "Assessment retrieved from cache", "completed");
      }
      return;
    }

    const cleanedMessages =
      (event.messages || []).map(cleanMessage).filter(Boolean);

    setPhases((prev) => {
      const snapshot = prev.length ? prev : createInitialPhases();
      return snapshot.map((phase) => {
        if (phase.id === phaseId) {
          const stepId = sanitizeStepId(phaseId, event.step);
          const nextSteps = [...phase.steps];
          const existingIndex = nextSteps.findIndex(
            (step) => step.id === stepId,
          );

          if (existingIndex >= 0) {
            const current = nextSteps[existingIndex];
            nextSteps[existingIndex] = {
              ...current,
              detail: mergeDetails(current.detail, cleanedMessages),
              status: "active",
            };
            return {
              ...phase,
              status: "active",
              steps: nextSteps.map((step, idx) =>
                idx < existingIndex ? { ...step, status: "completed" } : step,
              ),
              progress: computeProgress(nextSteps),
            };
          }

          const completedSteps = nextSteps.map((step) =>
            step.status === "active" ? { ...step, status: "completed" } : step,
          );
          const newStep: PhaseStep = {
            id: stepId,
            message:
              event.step ||
              event.phase_name ||
              PHASE_DEFINITIONS[phaseId].name,
            detail:
              cleanedMessages.length > 0
                ? cleanedMessages.join("\n")
                : event.step || "Processing...",
            status: "active",
          };
          const updatedSteps = [...completedSteps, newStep];

          return {
            ...phase,
            status: "active",
            steps: updatedSteps,
            progress: computeProgress(updatedSteps),
          };
        }

        const currentIndex = PHASE_ORDER.indexOf(phaseId);
        const phaseIndex = PHASE_ORDER.indexOf(
          phase.id as keyof typeof PHASE_DEFINITIONS,
        );
        if (phaseIndex >= 0 && phaseIndex < currentIndex) {
          return {
            ...phase,
            status: "completed",
            progress: 100,
            steps: phase.steps.map((step) => ({
              ...step,
              status: step.status === "error" ? "error" : "completed",
            })),
          };
        }
        return phase;
      });
    });

    if (cleanedMessages.length) {
      const phaseName =
        event.phase_name || PHASE_DEFINITIONS[phaseId].name;
      cleanedMessages.forEach((message) => {
        let status: LogStatus = "info";
        if (message.match(/\[FAILED\]|\[ERROR\]/i)) {
          status = "error";
        } else if (message.match(/\[WARNING\]|⚠/i)) {
          status = "warning";
        } else if (message.match(/\[OK\]|complete/i)) {
          status = "completed";
        } else if (message.match(/analyzing|processing/i)) {
          status = "active";
        }
        if (isImportantMessage(message)) {
          addLog(phaseId, phaseName, message, status);
        }
      });
    }
  };

  const persistAssessment = (brief: CISOBrief) => {
    const entry: PastAnalysisEntry = {
      id: createAnalysisId(),
      product: brief.entity.product_name,
      vendor: brief.entity.vendor_name,
      timestamp: new Date().toISOString(),
      status: "completed",
      trustScore: clampScore(brief.trust_score),
      criticalCVEs: Math.max(0, brief.cve_summary.critical_count),
      assessment: brief,
    };

    setPastAnalyses((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(
            item.product === entry.product &&
            item.vendor === entry.vendor
          ),
      );
      return [entry, ...filtered].slice(0, 10);
    });
  };

  const handleResultEvent = (resultEvent: ResultEvent) => {
    if (!resultEvent.success || !resultEvent.assessment) {
      const message =
        "Assessment failed to produce a result. Please try again.";
      setError(message);
      addLog("error", "Error", message, "error");
      setIsProcessing(false);
      return;
    }

    const brief = resultEvent.assessment;
    setAssessment(brief);
    setCitations(brief.all_citations || []);
    setPhases(createPhasesFromAssessment(brief));
    setLogs((prev) => {
      const base = prev.length ? prev : buildSummaryLogs(brief);
      return [
        ...base,
        {
          id: `log-${++logIdCounter.current}`,
          timestamp: getTimestamp(),
          nodeId: "complete",
          nodeLabel: "Assessment Complete",
          message: "Assessment completed successfully",
          status: "completed",
        },
      ];
    });
    addLog(
      "complete",
      "Assessment Complete",
      "Assessment completed successfully",
      "completed",
    );
    setIsProcessing(false);
    setError(null);
    persistAssessment(brief);
  };

  const handleErrorEvent = (errorEvent: ErrorEvent) => {
    const message =
      errorEvent.error ||
      errorEvent.errors?.join("; ") ||
      "Assessment failed";
    setError(message);
    addLog("error", "Error", message, "error");
    setPhases((prev) =>
      prev.map((phase) =>
        phase.status === "active"
          ? { ...phase, status: "error", progress: 0 }
          : phase,
      ),
    );
    setIsProcessing(false);
  };

  const handleSSE = (event: string, data: any) => {
    switch (event) {
      case "phase":
        updatePhasesWithEvent(data as PhaseEvent);
        break;
      case "result":
        handleResultEvent(data as ResultEvent);
        break;
      case "error":
        handleErrorEvent(data as ErrorEvent);
        break;
      default:
        break;
    }
  };

  const connectToStreamingAPI = async (
    request: AssessmentRequest,
    controller: AbortController,
  ) => {
    try {
      const response = await fetch(STREAM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const chunk of parts) {
          if (!chunk.trim()) {
            continue;
          }
          const parsed = parseSSEMessage(chunk);
          if (parsed) {
            handleSSE(parsed.event, parsed.data);
          }
        }
      }
      setIsProcessing(false);
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? null
          : err instanceof Error
            ? err.message
            : "Unknown error occurred";
      if (message) {
        setError(message);
        addLog("error", "Error", message, "error");
      }
      setIsProcessing(false);
    }
  };

  const startAssessment = (
    rawInput: string,
    overrides?: Partial<AssessmentRequest>,
  ) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return;
    }

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const { payload, displayQuery } = detectInputPayload(trimmed);
    const requestPayload = { ...payload, ...overrides };

    setInput("");
    setCurrentQuery(displayQuery);
    setShowReport(false);
    setAssessment(null);
    setCitations([]);
    setError(null);
    setIsProcessing(true);
    setPhases(createInitialPhases());
    setLogs([]);

    addLog("phase_1", PHASE_DEFINITIONS.phase_1.name, "Starting assessment...", "active");

    connectToStreamingAPI(requestPayload, controller);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startAssessment(input);
  };

  const handleRerunAnalysis = () => {
    if (!currentQuery) {
      return;
    }
    startAssessment(currentQuery, { no_cache: true });
  };

  const handleClearAnalysis = () => {
    controllerRef.current?.abort();
    setPhases(createInitialPhases());
    setLogs([]);
    setAssessment(null);
    setCitations([]);
    setCurrentQuery("");
    setShowReport(false);
    setError(null);
    setIsProcessing(false);
  };

  const handleDownloadPDF = () => {
    if (!assessment) {
      return;
    }
    const exportPayload = buildReportExportPayload(
      assessment,
      currentQuery,
    );
    downloadConsultantPDF(exportPayload);
  };

  const handleSelectAnalysis = (analysis: PastAnalysisEntry) => {
    setPastAnalysisOpen(false);
    if (analysis.assessment) {
      setAssessment(analysis.assessment);
      setPhases(createPhasesFromAssessment(analysis.assessment));
      setLogs(buildSummaryLogs(analysis.assessment));
      setCitations(analysis.assessment.all_citations || []);
      setCurrentQuery(analysis.product);
      setShowReport(false);
      setError(null);
      setIsProcessing(false);
      return;
    }
    startAssessment(analysis.product);
  };

  return (
    <>
      {showWelcome && (
        <WelcomeScreen onEnter={() => setShowWelcome(false)} />
      )}

      <div
        className="h-screen flex flex-col bg-black"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="border-b border-slate-800 bg-black shadow-lg shadow-slate-900/50">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="w-full flex items-center gap-2 md:gap-4 px-2 md:px-6 py-2.5">
              <div className="flex items-center flex-shrink-0">
                <ShieldLogo className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Enter product, vendor, URL, or SHA1 to assess (e.g., 'Okta', 'https://example.com', or 'd131dd02c5e6ee...')"
                  disabled={isProcessing}
                  aria-disabled={isProcessing}
                  className={`w-full px-3 md:px-4 py-2 pr-10 md:pr-12 bg-gradient-to-r from-slate-900 to-slate-800 border text-slate-200 placeholder-slate-500 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-base transition-all ${
                    !input.trim()
                      ? "border-slate-600 shadow-[0_0_15px_rgba(148,163,184,0.3)] animate-pulse-glow"
                      : "border-slate-700"
                  } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed transition-all"
                >
                  <Brain className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isProcessing && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="relative">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-ping" />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">
                        Processing
                      </div>
                      <div
                        className="text-xs text-slate-300"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        {completedPhases} / {totalPhases}
                      </div>
                    </div>
                  </div>
                )}
                {!isProcessing && phases.length > 0 && reportReady && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full" />
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">
                        Complete
                      </div>
                      <div
                        className="text-xs text-slate-300"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        Ready
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {error && (
              <div className="px-2 md:px-6 pb-2">
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/30 border border-red-500/30 rounded-sm px-3 py-2 font-mono">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="w-full h-full flex flex-col">
            <div className="px-4 md:px-6 py-3 border-b border-slate-800 bg-black flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPastAnalysisOpen(true)}
                  className="p-1.5 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
                  title="Past Analyses"
                >
                  <History className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setSystemStatusOpen(true)}
                  className="flex items-center gap-2 px-1.5 md:px-3 py-1.5 bg-gradient-to-r from-slate-900/80 to-slate-800/60 hover:from-slate-800/80 hover:to-slate-700/60 border border-slate-800 hover:border-slate-700 rounded-sm transition-all group"
                  title="System Status"
                >
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <span className="hidden md:inline text-xs text-slate-400 group-hover:text-slate-300 uppercase tracking-wide font-mono transition-colors">
                    All Systems Operational
                  </span>
                  <CheckCircle2 className="hidden md:block w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </button>
              </div>
              <div className="flex-1 flex justify-center md:justify-end md:mr-4">
                {reportReady && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="relative flex items-center gap-2 px-4 py-2 rounded-sm overflow-hidden font-mono text-sm group transition-all duration-300 hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%)",
                      boxShadow:
                        "0 0 0 1px rgba(148, 163, 184, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div
                        className="absolute inset-0 animate-pulse"
                        style={{
                          boxShadow:
                            "0 0 15px 2px rgba(148, 163, 184, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)",
                        }}
                      />
                    </div>
                    <div className="relative flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-900 group-hover:text-black transition-colors" />
                      <span className="text-slate-900 group-hover:text-black tracking-wide">
                        Report
                      </span>
                    </div>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivityLogOpen(true)}
                  className="p-1.5 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
                  title="Activity Log"
                >
                  <Activity className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => setCliTerminalOpen(true)}
                  className="p-1.5 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
                  title="CLI Terminal"
                >
                  <Terminal className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <PhaseCanvas
                phases={phases}
                reportReady={reportReady}
                onViewReport={() => setShowReport(true)}
                onRerunAnalysis={handleRerunAnalysis}
                onClearAnalysis={handleClearAnalysis}
                onDownloadPDF={handleDownloadPDF}
                currentQuery={currentQuery}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>

        <Citations
          isProcessing={isProcessing}
          logs={logs}
          citations={citations}
          isOpen={activityLogOpen}
          onClose={() => setActivityLogOpen(false)}
        />

        {showReport && assessment && (
          <ReportView
            assessment={assessment}
            onClose={() => setShowReport(false)}
          />
        )}

        <CliTerminal
          isOpen={cliTerminalOpen}
          onClose={() => setCliTerminalOpen(false)}
          logs={logs}
        />

        <PastAnalysis
          isOpen={pastAnalysisOpen}
          analyses={pastAnalyses}
          onClose={() => setPastAnalysisOpen(false)}
          onSelectAnalysis={handleSelectAnalysis}
        />

        <SystemStatusModal
          isOpen={systemStatusOpen}
          onClose={() => setSystemStatusOpen(false)}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 15px rgba(148,163,184,0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(148,163,184,0.6);
          }
          100% {
            box-shadow: 0 0 15px rgba(148,163,184,0.3);
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 1.5s infinite;
        }
      `}</style>
    </>
  );
}
