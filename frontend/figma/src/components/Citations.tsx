import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Activity } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  status: 'active' | 'completed' | 'error' | 'info';
}

interface Citation {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon: string;
}

interface CitationsProps {
  isProcessing: boolean;
  logs: LogEntry[];
}

export function Citations({ isProcessing, logs }: CitationsProps) {
  const [showSources, setShowSources] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const citations: Citation[] = [
    {
      id: '1',
      title: "NVD - CVE-2021-44228",
      url: "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
      domain: "nvd.nist.gov",
      favicon: "🔒"
    },
    {
      id: '2',
      title: "Apache Log4j Security Vulnerabilities",
      url: "https://logging.apache.org/log4j/2.x/security.html",
      domain: "apache.org",
      favicon: "🪶"
    },
    {
      id: '3',
      title: "CISA Log4Shell Guidance",
      url: "https://www.cisa.gov/log4shell",
      domain: "cisa.gov",
      favicon: "🛡️"
    },
    {
      id: '4',
      title: "CVE Details - Apache Log4j2",
      url: "https://www.cvedetails.com/product/44998/Apache-Log4j.html",
      domain: "cvedetails.com",
      favicon: "📊"
    },
    {
      id: '5',
      title: "NIST National Vulnerability Database",
      url: "https://nvd.nist.gov",
      domain: "nvd.nist.gov",
      favicon: "🔒"
    },
    {
      id: '6',
      title: "Snyk Vulnerability Database",
      url: "https://security.snyk.io/vuln/SNYK-JAVA-ORGAPACHELOGGING",
      domain: "snyk.io",
      favicon: "🐍"
    },
    {
      id: '7',
      title: "GitHub Security Advisories",
      url: "https://github.com/advisories",
      domain: "github.com",
      favicon: "🐙"
    },
    {
      id: '8',
      title: "MITRE CVE Database",
      url: "https://cve.mitre.org",
      domain: "mitre.org",
      favicon: "⚔️"
    },
    {
      id: '9',
      title: "SOC 2 Compliance Framework",
      url: "https://www.aicpa.org/soc2",
      domain: "aicpa.org",
      favicon: "📋"
    },
    {
      id: '10',
      title: "OWASP Top 10 Vulnerabilities",
      url: "https://owasp.org/www-project-top-ten",
      domain: "owasp.org",
      favicon: "🔐"
    }
  ];

  const displayedCitations = showAllSources ? citations : citations.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-cyan-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '◉';
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-cyan-500/20 px-6 py-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-cyan-400 uppercase tracking-wide">Activity Log</div>
            <div className="text-sm text-slate-300">{logs.length} events</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {logs.length === 0 ? (
          /* Empty State - Waiting for Analysis */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400">Waiting for analysis to begin...</p>
            <p className="text-xs text-slate-500 mt-2">Activity will appear here</p>
          </div>
        ) : (
          <>
            {/* Sources Dropdown - Collapsible */}
            <div className="mb-4">
              <button
                onClick={() => setShowSources(!showSources)}
                className="w-full px-4 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <div className="text-sm text-slate-200 group-hover:text-cyan-300 transition-colors">
                      Sources & Citations
                    </div>
                    <div className="text-xs text-slate-500">
                      {citations.length} sources reviewed
                    </div>
                  </div>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-all ${showSources ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Sources List - Expandable */}
              {showSources && (
                <div className="mt-3 space-y-2 animate-fadeIn">
                  {displayedCitations.map((citation, index) => (
                    <a
                      key={citation.id}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="text-lg">{citation.favicon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                          {citation.title}
                        </div>
                        <div className="text-xs text-slate-500">{citation.domain}</div>
                      </div>
                    </a>
                  ))}

                  {!showAllSources && citations.length > 5 && (
                    <button
                      onClick={() => setShowAllSources(true)}
                      className="w-full mt-2 px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg text-xs text-cyan-400 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Show {citations.length - 5} more sources</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Activity Logs Section */}
            <div className="mb-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Activity Log · {logs.length} events
              </div>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="animate-fadeIn flex gap-3 px-3 py-2.5 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50"
                  >
                    <div className={`text-xs mt-0.5 ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs text-slate-500">{log.timestamp}</span>
                        <span className="text-xs text-cyan-400 font-medium">{log.nodeLabel}</span>
                      </div>
                      <div className="text-sm text-slate-300">{log.message}</div>
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
  );
}