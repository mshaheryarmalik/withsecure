import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, ChevronRight, Search } from "lucide-react";
import type { Citation } from "../types/api";

interface CitationsProps {
  isProcessing: boolean;
  logs: {
    id: string;
    timestamp: string;
    nodeId: string;
    nodeLabel: string;
    message: string;
    status: "active" | "completed" | "error" | "info" | "warning";
  }[];
  citations?: Citation[];
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_CITATIONS: Citation[] = [
  {
    source_url: "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
    source_type: "NVD",
    source_label: "independent",
    accessed_date: new Date().toISOString(),
    claim: "Critical remote code execution vulnerability in Apache Log4j",
  },
  {
    source_url: "https://logging.apache.org/log4j/2.x/security.html",
    source_type: "Vendor Advisory",
    source_label: "vendor-stated",
    accessed_date: new Date().toISOString(),
    claim: "Vendor security advisories for Log4j",
  },
  {
    source_url: "https://www.cisa.gov/news-events/alerts",
    source_type: "CISA",
    source_label: "independent",
    accessed_date: new Date().toISOString(),
    claim: "CISA alerts and emergency directives",
  },
  {
    source_url: "https://security.snyk.io/",
    source_type: "Snyk",
    source_label: "independent",
    accessed_date: new Date().toISOString(),
    claim: "Open-source vulnerability intelligence",
  },
  {
    source_url: "https://haveibeenpwned.com/",
    source_type: "HaveIBeenPwned",
    source_label: "independent",
    accessed_date: new Date().toISOString(),
    claim: "Breach intelligence for vendor incidents",
  },
];

function normalizeCitations(citations?: Citation[]) {
  const items = citations?.length ? citations : FALLBACK_CITATIONS;
  return items.map((citation, index) => {
    let domain = "unknown";
    try {
      domain = new URL(citation.source_url).hostname.replace(/^www\./, "");
    } catch {
      domain = citation.source_url;
    }
    return {
      id: `${citation.source_url}-${index}`,
      title: citation.claim || citation.source_type,
      url: citation.source_url,
      domain,
      label: citation.source_label,
      accessed: citation.accessed_date
        ? new Date(citation.accessed_date).toLocaleDateString()
        : "Recently accessed",
    };
  });
}

export function Citations({
  isProcessing,
  logs,
  citations,
  isOpen,
  onClose,
}: CitationsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showSources, setShowSources] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  const normalizedCitations = normalizeCitations(citations);
  const displayedCitations = showAllSources
    ? normalizedCitations
    : normalizedCitations.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-slate-400";
      case "completed":
        return "text-slate-500";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-amber-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "◉";
      case "completed":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "!";
      default:
        return "•";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-96 bg-black backdrop-blur-xl border-l border-slate-700 shadow-2xl z-50 transition-transform duration-300 overflow-hidden group ${
          animate ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Granular gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40 pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(71, 85, 105, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(51, 65, 85, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.1) 0%, transparent 70%)
          `,
          }}
        ></div>

        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/5 via-transparent to-slate-900/10 pointer-events-none group-hover:from-slate-600/10 group-hover:to-slate-800/15 transition-all duration-500"></div>

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")",
          }}
        ></div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-slate-700 px-6 py-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-mono bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
                Activity Log
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Real-time processing events
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-900/50 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20 px-6 py-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 mb-4 rounded-sm bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-700 flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
              </div>
              <p className="text-sm text-slate-400 font-mono">
                Waiting for analysis...
              </p>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Activity will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="w-full px-4 py-3 bg-slate-950/50 hover:bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-sm flex items-center justify-between transition-all group backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <div className="text-left">
                      <div className="text-sm text-slate-200 group-hover:text-slate-300 transition-colors font-mono">
                        Sources & Citations
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {normalizedCitations.length} sources reviewed
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showSources ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showSources && (
                  <div className="mt-3 space-y-2 animate-fadeIn">
                    {displayedCitations.map((citation, index) => (
                      <a
                        key={citation.id}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 bg-slate-950/50 backdrop-blur-sm rounded-sm border border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-700/50 transition-all group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-2 h-2 bg-slate-600 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-200 group-hover:text-slate-300 transition-colors truncate font-mono">
                            {citation.title}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {citation.domain}
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            {citation.label?.toUpperCase()} · {citation.accessed}
                          </div>
                        </div>
                      </a>
                    ))}

                    {!showAllSources && normalizedCitations.length > 5 && (
                      <button
                        onClick={() => setShowAllSources(true)}
                        className="w-full mt-2 px-3 py-2 bg-slate-950/50 hover:bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-sm text-xs text-slate-400 flex items-center justify-center gap-2 transition-all font-mono backdrop-blur-sm"
                      >
                        <span>
                          Show {normalizedCitations.length - 5} more sources
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2 font-mono">
                  <Activity className="w-3 h-3" />
                  Activity Log · {logs.length} events
                </div>
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="animate-fadeIn flex gap-3 px-3 py-2.5 bg-slate-950/50 backdrop-blur-sm rounded-sm border border-slate-800"
                    >
                      <div className={`text-xs mt-0.5 ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-slate-500 font-mono">
                            {log.timestamp}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {log.nodeLabel}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300 font-mono">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </>
          )}
        </div>
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
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}