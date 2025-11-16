import { useState, useRef, useEffect } from "react";
import { PhaseCanvas } from "./components/PhaseCanvas";
import { Citations } from "./components/Citations";
import { ReportView } from "./components/ReportView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { CliTerminal } from "./components/CliTerminal";
import { PastAnalysis } from "./components/PastAnalysis";
import { ShieldLogo } from "./components/ShieldLogo";
import { SystemStatusModal } from "./components/SystemStatusModal";
import {
  Send,
  Shield,
  FileText,
  Terminal,
  History,
  Activity,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { downloadConsultantPDF } from "./utils/reportExportPDF";

interface Step {
  id: string;
  message: string;
  detail: string;
  optional?: boolean;
  sources?: string[];
  status?:
    | "pending"
    | "active"
    | "completed"
    | "error"
    | "skipped";
  duration?: number;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  progress?: number;
  steps: Step[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  status: "active" | "completed" | "error" | "info";
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [input, setInput] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const [showReport, setShowReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [cliTerminalOpen, setCliTerminalOpen] = useState(false);
  const [pastAnalysisOpen, setPastAnalysisOpen] =
    useState(false);
  const [systemStatusOpen, setSystemStatusOpen] =
    useState(false);

  // Set document title
  useEffect(() => {
    document.title = "CISO Security Assessor";
  }, []);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input;
    setInput("");
    setCurrentQuery(query);
    setShowReport(false);
    setReportReady(false);
    setIsProcessing(true);

    simulateProcessing(query);
  };

  const simulateProcessing = (query: string) => {
    // Clear previous state
    setPhases([]);
    setLogs([]);
    setIsProcessing(true);

    // Initialize all 4 phases with pending status
    const initialPhases: Phase[] = [
      {
        id: "phase_1",
        name: "Entity Resolution",
        description:
          "Identifying the product, vendor, and website from your input",
        status: "pending",
        progress: 0,
        steps: [
          {
            id: "detect_input",
            message: "Analyzing input type (SHA1/URL/Name)",
            detail: "Determining the best resolution strategy",
            status: "pending",
          },
          {
            id: "search_entity",
            message:
              "Searching security databases and web sources",
            detail:
              "Querying VirusTotal, Tavily, and other sources",
            status: "pending",
            sources: ["VirusTotal", "Tavily"],
          },
          {
            id: "resolve_fields",
            message:
              "Filling missing product and vendor details",
            detail: "Ensuring complete entity information",
            status: "pending",
          },
          {
            id: "validate_entity",
            message: "Validating entity identification",
            detail: "Confirming we have enough data to proceed",
            status: "pending",
          },
        ],
      },
      {
        id: "phase_2",
        name: "Software Classification",
        description:
          "Categorizing the software using AI and industry taxonomies",
        status: "pending",
        progress: 0,
        steps: [
          {
            id: "analyze_product",
            message: "Analyzing product characteristics",
            detail: "Understanding product type and purpose",
            status: "pending",
          },
          {
            id: "match_categories",
            message: "Matching against 868 Gartner categories",
            detail: "Finding primary and secondary categories",
            status: "pending",
          },
          {
            id: "assign_taxonomy",
            message: "Assigning software taxonomy",
            detail:
              "Classification complete with confidence level",
            status: "pending",
          },
        ],
      },
      {
        id: "phase_3",
        name: "Security Data Gathering",
        description:
          "Collecting security intelligence from 15+ trusted sources",
        status: "pending",
        progress: 0,
        steps: [
          {
            id: "version_detection",
            message: "Detecting latest product version",
            detail: "Required for accurate CVE matching",
            optional: true,
            status: "pending",
          },
          {
            id: "vulnerability_scan",
            message: "Scanning vulnerability databases",
            detail: "Checking NVD, GitHub Advisories, US-CERT",
            status: "pending",
            sources: ["NVD", "GitHub Advisories", "US-CERT"],
          },
          {
            id: "vendor_compliance",
            message: "Analyzing vendor compliance posture",
            detail:
              "Checking security pages, ToS, Privacy Policy, FedRAMP",
            status: "pending",
            sources: [
              "Security Page",
              "ToS",
              "Privacy Policy",
              "DPA",
              "FedRAMP",
            ],
          },
          {
            id: "breach_incidents",
            message: "Checking breach and incident history",
            detail: "Querying HaveIBeenPwned and security news",
            status: "pending",
            sources: ["HaveIBeenPwned", "Security News"],
          },
          {
            id: "threat_intel",
            message: "Gathering threat intelligence",
            detail:
              "Checking malware databases and threat feeds",
            status: "pending",
            sources: [
              "MalwareBazaar",
              "URLhaus",
              "AlienVault OTX",
            ],
          },
          {
            id: "company_info",
            message:
              "Collecting company and domain information",
            detail: "WHOIS lookup and company background",
            status: "pending",
            sources: ["WHOIS", "Company Database"],
          },
          {
            id: "alternatives",
            message: "Finding alternative products",
            detail: "Searching G2 and AlternativeTo databases",
            status: "pending",
            sources: ["G2", "AlternativeTo"],
          },
        ],
      },
      {
        id: "phase_4",
        name: "AI Analysis & Brief Generation",
        description:
          "Synthesizing findings into a CISO-ready security assessment",
        status: "pending",
        progress: 0,
        steps: [
          {
            id: "analyze_security",
            message: "Analyzing security posture with AI",
            detail:
              "Evaluating CVE severity, trends, and vendor transparency",
            status: "pending",
          },
          {
            id: "calculate_scores",
            message: "Calculating trust and risk scores",
            detail:
              "Scoring based on vulnerabilities, breaches, and compliance",
            status: "pending",
          },
          {
            id: "extract_alternatives",
            message: "Identifying safer alternatives",
            detail: "Using AI to recommend comparable products",
            status: "pending",
          },
          {
            id: "build_citations",
            message: "Compiling source citations",
            detail:
              "Labeling vendor-stated vs independent sources",
            status: "pending",
          },
          {
            id: "generate_brief",
            message: "Generating final CISO brief",
            detail:
              "Creating structured assessment with rationale",
            status: "pending",
          },
        ],
      },
    ];

    setPhases(initialPhases);

    // Phase 1: Entity Resolution
    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_1"
            ? { ...p, status: "active" as const, progress: 10 }
            : p,
        ),
      );
      addLog(
        "phase_1",
        "Entity Resolution",
        "Starting entity resolution...",
      );
    }, 500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_1"
            ? {
                ...p,
                progress: 25,
                steps: p.steps.map((s, i) =>
                  i === 0
                    ? {
                        ...s,
                        status: "active" as const,
                        duration: 234,
                      }
                    : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_1",
        "Entity Resolution",
        "Analyzing input type...",
      );
    }, 1000);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_1"
            ? {
                ...p,
                progress: 50,
                steps: p.steps.map((s, i) =>
                  i === 0
                    ? { ...s, status: "completed" as const }
                    : i === 1
                      ? { ...s, status: "active" as const }
                      : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_1",
        "Entity Resolution",
        "Searching security databases...",
      );
    }, 1500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_1"
            ? {
                ...p,
                progress: 75,
                steps: p.steps.map((s, i) =>
                  i <= 1
                    ? {
                        ...s,
                        status: "completed" as const,
                        duration: 456,
                      }
                    : i === 2
                      ? { ...s, status: "active" as const }
                      : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_1",
        "Entity Resolution",
        "Resolving product details...",
      );
    }, 2000);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_1"
            ? {
                ...p,
                progress: 100,
                status: "completed" as const,
                steps: p.steps.map((s) => ({
                  ...s,
                  status: "completed" as const,
                  duration:
                    Math.floor(Math.random() * 500) + 200,
                })),
              }
            : p,
        ),
      );
      addLog(
        "phase_1",
        "Entity Resolution",
        "Entity resolved successfully",
      );
    }, 2500);

    // Phase 2: Software Classification
    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_2"
            ? { ...p, status: "active" as const, progress: 15 }
            : p,
        ),
      );
      addLog(
        "phase_2",
        "Software Classification",
        "Starting software classification...",
      );
    }, 3000);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_2"
            ? {
                ...p,
                progress: 50,
                steps: p.steps.map((s, i) =>
                  i === 0
                    ? { ...s, status: "active" as const }
                    : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_2",
        "Software Classification",
        "Analyzing product characteristics...",
      );
    }, 3500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_2"
            ? {
                ...p,
                progress: 100,
                status: "completed" as const,
                steps: p.steps.map((s) => ({
                  ...s,
                  status: "completed" as const,
                  duration:
                    Math.floor(Math.random() * 400) + 150,
                })),
              }
            : p,
        ),
      );
      addLog(
        "phase_2",
        "Software Classification",
        "Classification complete",
      );
    }, 4500);

    // Phase 3: Security Data Gathering
    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_3"
            ? { ...p, status: "active" as const, progress: 10 }
            : p,
        ),
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Collecting security intelligence...",
      );
    }, 5000);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_3"
            ? {
                ...p,
                progress: 30,
                steps: p.steps.map((s, i) =>
                  i === 1
                    ? { ...s, status: "active" as const }
                    : i === 0
                      ? { ...s, status: "skipped" as const }
                      : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Scanning vulnerability databases...",
      );
    }, 5500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_3"
            ? {
                ...p,
                progress: 50,
                steps: p.steps.map((s, i) =>
                  i <= 1
                    ? i === 0
                      ? { ...s, status: "skipped" as const }
                      : {
                          ...s,
                          status: "completed" as const,
                          duration: 890,
                        }
                    : i === 2
                      ? { ...s, status: "active" as const }
                      : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Analyzing vendor compliance...",
      );
    }, 6500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_3"
            ? {
                ...p,
                progress: 80,
                steps: p.steps.map((s, i) => {
                  if (i === 0)
                    return { ...s, status: "skipped" as const };
                  if (i <= 4)
                    return {
                      ...s,
                      status: "completed" as const,
                      duration:
                        Math.floor(Math.random() * 600) + 300,
                    };
                  if (i === 5)
                    return { ...s, status: "active" as const };
                  return s;
                }),
              }
            : p,
        ),
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Collecting company information...",
      );
    }, 7500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_3"
            ? {
                ...p,
                progress: 100,
                status: "completed" as const,
                steps: p.steps.map((s, i) =>
                  i === 0
                    ? { ...s, status: "skipped" as const }
                    : {
                        ...s,
                        status: "completed" as const,
                        duration:
                          Math.floor(Math.random() * 700) + 250,
                      },
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Data collection complete",
      );
    }, 8500);

    // Phase 4: AI Analysis
    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_4"
            ? { ...p, status: "active" as const, progress: 20 }
            : p,
        ),
      );
      addLog(
        "phase_4",
        "AI Analysis & Brief Generation",
        "Starting AI analysis...",
      );
    }, 9000);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_4"
            ? {
                ...p,
                progress: 40,
                steps: p.steps.map((s, i) =>
                  i === 0
                    ? { ...s, status: "active" as const }
                    : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_4",
        "AI Analysis & Brief Generation",
        "Analyzing security posture...",
      );
    }, 9500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_4"
            ? {
                ...p,
                progress: 70,
                steps: p.steps.map((s, i) =>
                  i <= 2
                    ? {
                        ...s,
                        status: "completed" as const,
                        duration:
                          Math.floor(Math.random() * 800) + 400,
                      }
                    : i === 3
                      ? { ...s, status: "active" as const }
                      : s,
                ),
              }
            : p,
        ),
      );
      addLog(
        "phase_4",
        "AI Analysis & Brief Generation",
        "Compiling source citations...",
      );
    }, 10500);

    setTimeout(() => {
      setPhases((prev) =>
        prev.map((p) =>
          p.id === "phase_4"
            ? {
                ...p,
                progress: 100,
                status: "completed" as const,
                steps: p.steps.map((s) => ({
                  ...s,
                  status: "completed" as const,
                  duration:
                    Math.floor(Math.random() * 900) + 500,
                })),
              }
            : p,
        ),
      );
      addLog(
        "phase_4",
        "AI Analysis & Brief Generation",
        "CISO brief generated successfully",
      );
      setReportReady(true);
      setIsProcessing(false);
    }, 12000);
  };

  const addLog = (
    phaseId: string,
    phaseName: string,
    message: string,
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: phaseId,
        nodeLabel: phaseName,
        message: message,
        status: "info",
      },
    ]);
  };

  const loadPastAnalysis = (analysis: any) => {
    // Close the panel
    setPastAnalysisOpen(false);

    // Show loading state
    setIsProcessing(true);
    setCurrentQuery(analysis.product);
    setShowReport(false);
    setReportReady(false);
    setPhases([]);
    setLogs([]);

    // Simulate loading delay
    setTimeout(() => {
      // Create placeholder completed phases based on the analysis
      const completedPhases: Phase[] = [
        {
          id: "phase_1",
          name: "Entity Resolution",
          description:
            "Identifying the product, vendor, and website from your input",
          status: "completed",
          progress: 100,
          steps: [
            {
              id: "detect_input",
              message: "Analyzing input type (SHA1/URL/Name)",
              detail:
                "Determining the best resolution strategy",
              status: "completed",
              duration: 234,
            },
            {
              id: "search_entity",
              message:
                "Searching security databases and web sources",
              detail:
                "Querying VirusTotal, Tavily, and other sources",
              status: "completed",
              sources: ["VirusTotal", "Tavily"],
              duration: 456,
            },
            {
              id: "resolve_fields",
              message:
                "Filling missing product and vendor details",
              detail: "Ensuring complete entity information",
              status: "completed",
              duration: 389,
            },
            {
              id: "validate_entity",
              message: "Validating entity identification",
              detail:
                "Confirming we have enough data to proceed",
              status: "completed",
              duration: 312,
            },
          ],
        },
        {
          id: "phase_2",
          name: "Software Classification",
          description:
            "Categorizing the software using AI and industry taxonomies",
          status: "completed",
          progress: 100,
          steps: [
            {
              id: "analyze_product",
              message: "Analyzing product characteristics",
              detail: "Understanding product type and purpose",
              status: "completed",
              duration: 445,
            },
            {
              id: "match_categories",
              message:
                "Matching against 868 Gartner categories",
              detail:
                "Finding primary and secondary categories",
              status: "completed",
              duration: 523,
            },
            {
              id: "assign_taxonomy",
              message: "Assigning software taxonomy",
              detail:
                "Classification complete with confidence level",
              status: "completed",
              duration: 367,
            },
          ],
        },
        {
          id: "phase_3",
          name: "Security Data Gathering",
          description:
            "Collecting security intelligence from 15+ trusted sources",
          status: "completed",
          progress: 100,
          steps: [
            {
              id: "version_detection",
              message: "Detecting latest product version",
              detail: "Required for accurate CVE matching",
              optional: true,
              status: "skipped",
            },
            {
              id: "vulnerability_scan",
              message: "Scanning vulnerability databases",
              detail:
                "Checking NVD, GitHub Advisories, US-CERT",
              status: "completed",
              sources: ["NVD", "GitHub Advisories", "US-CERT"],
              duration: 890,
            },
            {
              id: "vendor_compliance",
              message: "Analyzing vendor compliance posture",
              detail:
                "Checking security pages, ToS, Privacy Policy, FedRAMP",
              status: "completed",
              sources: [
                "Security Page",
                "ToS",
                "Privacy Policy",
                "DPA",
                "FedRAMP",
              ],
              duration: 678,
            },
            {
              id: "breach_incidents",
              message: "Checking breach and incident history",
              detail:
                "Querying HaveIBeenPwned and security news",
              status: "completed",
              sources: ["HaveIBeenPwned", "Security News"],
              duration: 534,
            },
            {
              id: "threat_intel",
              message: "Gathering threat intelligence",
              detail:
                "Checking malware databases and threat feeds",
              status: "completed",
              sources: [
                "MalwareBazaar",
                "URLhaus",
                "AlienVault OTX",
              ],
              duration: 712,
            },
            {
              id: "company_info",
              message:
                "Collecting company and domain information",
              detail: "WHOIS lookup and company background",
              status: "completed",
              sources: ["WHOIS", "Company Database"],
              duration: 423,
            },
            {
              id: "alternatives",
              message: "Finding alternative products",
              detail:
                "Searching G2 and AlternativeTo databases",
              status: "completed",
              sources: ["G2", "AlternativeTo"],
              duration: 598,
            },
          ],
        },
        {
          id: "phase_4",
          name: "AI Analysis & Brief Generation",
          description:
            "Synthesizing findings into a CISO-ready security assessment",
          status: "completed",
          progress: 100,
          steps: [
            {
              id: "analyze_security",
              message: "Analyzing security posture with AI",
              detail:
                "Evaluating CVE severity, trends, and vendor transparency",
              status: "completed",
              duration: 1023,
            },
            {
              id: "calculate_scores",
              message: "Calculating trust and risk scores",
              detail:
                "Scoring based on vulnerabilities, breaches, and compliance",
              status: "completed",
              duration: 845,
            },
            {
              id: "extract_alternatives",
              message: "Identifying safer alternatives",
              detail:
                "Using AI to recommend comparable products",
              status: "completed",
              duration: 967,
            },
            {
              id: "build_citations",
              message: "Compiling source citations",
              detail:
                "Labeling vendor-stated vs independent sources",
              status: "completed",
              duration: 734,
            },
            {
              id: "generate_brief",
              message: "Generating final CISO brief",
              detail:
                "Creating structured assessment with rationale",
              status: "completed",
              duration: 1156,
            },
          ],
        },
      ];

      setPhases(completedPhases);

      // Add logs for loaded analysis
      addLog(
        "phase_1",
        "Entity Resolution",
        "Loaded from past analysis",
      );
      addLog(
        "phase_2",
        "Software Classification",
        "Loaded from past analysis",
      );
      addLog(
        "phase_3",
        "Security Data Gathering",
        "Loaded from past analysis",
      );
      addLog(
        "phase_4",
        "AI Analysis & Brief Generation",
        "Loaded from past analysis",
      );
      addLog(
        "system",
        "System",
        `Analysis for ${analysis.product} loaded successfully`,
      );

      // Set report as ready
      setReportReady(true);
      setIsProcessing(false);
    }, 1500); // 1.5 second loading delay
  };

  const completedPhases = phases.filter(
    (p) => p.status === "completed",
  ).length;
  const totalPhases = phases.length > 0 ? phases.length : 4;

  const handleRerunAnalysis = () => {
    if (currentQuery) {
      simulateProcessing(currentQuery);
    }
  };

  const handleClearAnalysis = () => {
    setPhases([]);
    setLogs([]);
    setCurrentQuery("");
    setReportReady(false);
    setShowReport(false);
    setIsProcessing(false);
  };

  const handleDownloadPDF = () => {
    if (reportReady && currentQuery) {
      const reportData = {
        query: currentQuery,
        trustScore: 72,
        criticalCVEs: 4,
        compliance: 78,
        patchResponse: "14 days",
        vulnerabilityData: [
          { name: "Critical", count: 4, color: "#ef4444" },
          { name: "High", count: 12, color: "#f97316" },
          { name: "Medium", count: 23, color: "#eab308" },
          { name: "Low", count: 8, color: "#22c55e" },
        ],
        securityScoreData: [
          { category: "Vulnerability Management", score: 65 },
          { category: "Compliance", score: 78 },
          { category: "Vendor Trust", score: 72 },
          { category: "Documentation", score: 90 },
          { category: "Community Support", score: 85 },
          { category: "Update Frequency", score: 70 },
        ],
        generatedDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
      downloadConsultantPDF(reportData);
    }
  };

  return (
    <>
      {showWelcome && (
        <WelcomeScreen onEnter={() => setShowWelcome(false)} />
      )}

      <div
        className="h-screen flex flex-col bg-black"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        {/* Input Section with Logo */}
        <div className="border-b border-slate-800 bg-black shadow-lg shadow-slate-900/50">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
          >
            {/* Full Width Search Bar */}
            <div className="w-full flex items-center gap-2 md:gap-4 px-2 md:px-6 py-2.5">
              <div className="flex items-center flex-shrink-0">
                <ShieldLogo className="w-8 h-8 md:w-12 md:h-12" />
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter product name or vendor to assess (e.g., 'Apache Log4j 2.14' or 'Okta')"
                  className={`w-full px-3 md:px-4 py-2 pr-10 md:pr-12 bg-gradient-to-r from-slate-900 to-slate-800 border text-slate-200 placeholder-slate-500 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-base transition-all ${
                    !input.trim()
                      ? "border-slate-600 shadow-[0_0_15px_rgba(148,163,184,0.3)] animate-pulse-glow"
                      : "border-slate-700"
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed transition-all"
                >
                  <Brain className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              {/* Status Indicator - Compact with just blips/icons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isProcessing && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="relative">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-ping"></div>
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
                {!isProcessing && phases.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full"></div>
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
          </form>
        </div>

        {/* Main Content - Full Width Canvas */}
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
                {/* System Status Button - icon only on mobile, full on desktop */}
                <button
                  onClick={() => setSystemStatusOpen(true)}
                  className="flex items-center gap-2 px-1.5 md:px-3 py-1.5 bg-gradient-to-r from-slate-900/80 to-slate-800/60 hover:from-slate-800/80 hover:to-slate-700/60 border border-slate-800 hover:border-slate-700 rounded-sm transition-all group"
                  title="System Status"
                >
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="hidden md:inline text-xs text-slate-400 group-hover:text-slate-300 uppercase tracking-wide font-mono transition-colors">
                    All Systems Operational
                  </span>
                  <CheckCircle2 className="hidden md:block w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </button>
              </div>
              {/* Center: View Report button - center aligned on mobile */}
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
                    {/* Animated glowing edges */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div
                        className="absolute inset-0 animate-pulse"
                        style={{
                          boxShadow:
                            "0 0 15px 2px rgba(148, 163, 184, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)",
                        }}
                      />
                    </div>

                    {/* Button content */}
                    <div className="relative flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-900 group-hover:text-black transition-colors" />
                      <span className="text-slate-900 group-hover:text-black tracking-wide">
                        Report
                      </span>
                    </div>
                  </button>
                )}
              </div>
              {/* Right: CLI and Activity Log buttons - right aligned on mobile */}
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
              />
            </div>
          </div>
        </div>

        <Citations
          isProcessing={isProcessing}
          logs={logs}
          isOpen={activityLogOpen}
          onClose={() => setActivityLogOpen(false)}
        />

        {showReport && (
          <ReportView
            query={currentQuery}
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
          onClose={() => setPastAnalysisOpen(false)}
          onSelectAnalysis={loadPastAnalysis}
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
        @keyframes edgeGlow {
          0% {
            box-shadow: 0 0 10px rgba(255,255,255,0.3);
          }
          50% {
            box-shadow: 0 0 10px rgba(255,255,255,0.6);
          }
          100% {
            box-shadow: 0 0 10px rgba(255,255,255,0.3);
          }
        }
        .animate-edge-glow {
          animation: edgeGlow 1.5s infinite;
        }
      `}</style>
    </>
  );
}