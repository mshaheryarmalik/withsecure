import { useState, useRef, useEffect } from 'react';
import { PhaseCanvas } from './components/PhaseCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Send, Shield, FileText } from 'lucide-react';

interface Step {
  id: string;
  message: string;
  detail: string;
  optional?: boolean;
  sources?: string[];
  status?: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
  duration?: number;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  steps: Step[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  status: 'active' | 'completed' | 'error' | 'info';
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [input, setInput] = useState('');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const [showReport, setShowReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = 'CISO Security Assessor';
  }, []);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input;
    setInput('');
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
        id: 'phase_1',
        name: 'Entity Resolution',
        description: 'Identifying the product, vendor, and website from your input',
        status: 'pending',
        progress: 0,
        steps: [
          { id: 'detect_input', message: 'Analyzing input type (SHA1/URL/Name)', detail: 'Determining the best resolution strategy', status: 'pending' },
          { id: 'search_entity', message: 'Searching security databases and web sources', detail: 'Querying VirusTotal, Tavily, and other sources', status: 'pending', sources: ['VirusTotal', 'Tavily'] },
          { id: 'resolve_fields', message: 'Filling missing product and vendor details', detail: 'Ensuring complete entity information', status: 'pending' },
          { id: 'validate_entity', message: 'Validating entity identification', detail: 'Confirming we have enough data to proceed', status: 'pending' }
        ]
      },
      {
        id: 'phase_2',
        name: 'Software Classification',
        description: 'Categorizing the software using AI and industry taxonomies',
        status: 'pending',
        progress: 0,
        steps: [
          { id: 'analyze_product', message: 'Analyzing product characteristics', detail: 'Understanding product type and purpose', status: 'pending' },
          { id: 'match_categories', message: 'Matching against 868 Gartner categories', detail: 'Finding primary and secondary categories', status: 'pending' },
          { id: 'assign_taxonomy', message: 'Assigning software taxonomy', detail: 'Classification complete with confidence level', status: 'pending' }
        ]
      },
      {
        id: 'phase_3',
        name: 'Security Data Gathering',
        description: 'Collecting security intelligence from 15+ trusted sources',
        status: 'pending',
        progress: 0,
        steps: [
          { id: 'version_detection', message: 'Detecting latest product version', detail: 'Required for accurate CVE matching', optional: true, status: 'pending' },
          { id: 'vulnerability_scan', message: 'Scanning vulnerability databases', detail: 'Checking NVD, GitHub Advisories, US-CERT', status: 'pending', sources: ['NVD', 'GitHub Advisories', 'US-CERT'] },
          { id: 'vendor_compliance', message: 'Analyzing vendor compliance posture', detail: 'Checking security pages, ToS, Privacy Policy, FedRAMP', status: 'pending', sources: ['Security Page', 'ToS', 'Privacy Policy', 'DPA', 'FedRAMP'] },
          { id: 'breach_incidents', message: 'Checking breach and incident history', detail: 'Querying HaveIBeenPwned and security news', status: 'pending', sources: ['HaveIBeenPwned', 'Security News'] },
          { id: 'threat_intel', message: 'Gathering threat intelligence', detail: 'Checking malware databases and threat feeds', status: 'pending', sources: ['MalwareBazaar', 'URLhaus', 'AlienVault OTX'] },
          { id: 'company_info', message: 'Collecting company and domain information', detail: 'WHOIS lookup and company background', status: 'pending', sources: ['WHOIS', 'Company Database'] },
          { id: 'alternatives', message: 'Finding alternative products', detail: 'Searching G2 and AlternativeTo databases', status: 'pending', sources: ['G2', 'AlternativeTo'] }
        ]
      },
      {
        id: 'phase_4',
        name: 'AI Analysis & Brief Generation',
        description: 'Synthesizing findings into a CISO-ready security assessment',
        status: 'pending',
        progress: 0,
        steps: [
          { id: 'analyze_security', message: 'Analyzing security posture with AI', detail: 'Evaluating CVE severity, trends, and vendor transparency', status: 'pending' },
          { id: 'calculate_scores', message: 'Calculating trust and risk scores', detail: 'Scoring based on vulnerabilities, breaches, and compliance', status: 'pending' },
          { id: 'extract_alternatives', message: 'Identifying safer alternatives', detail: 'Using AI to recommend comparable products', status: 'pending' },
          { id: 'build_citations', message: 'Compiling source citations', detail: 'Labeling vendor-stated vs independent sources', status: 'pending' },
          { id: 'generate_brief', message: 'Generating final CISO brief', detail: 'Creating structured assessment with rationale', status: 'pending' }
        ]
      }
    ];

    setPhases(initialPhases);

    // Phase 1: Entity Resolution
    setTimeout(() => {
      setPhases(prev => prev.map(p => p.id === 'phase_1' ? { ...p, status: 'active' as const, progress: 10 } : p));
      addLog('phase_1', 'Entity Resolution', 'Starting entity resolution...');
    }, 500);

    // Phase 1 steps
    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { 
          ...p, 
          progress: 25,
          steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const, duration: 234 } : s) 
        } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Analyzing input type...');
    }, 1000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { 
          ...p, 
          progress: 50,
          steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'completed' as const } : i === 1 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Searching security databases...');
    }, 1500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { 
          ...p, 
          progress: 75,
          steps: p.steps.map((s, i) => i <= 1 ? { ...s, status: 'completed' as const, duration: 456 } : i === 2 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Resolving product details...');
    }, 2000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { 
          ...p, 
          progress: 100,
          status: 'completed' as const,
          steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 500) + 200 })) 
        } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Entity resolved successfully');
    }, 2500);

    // Phase 2: Software Classification
    setTimeout(() => {
      setPhases(prev => prev.map(p => p.id === 'phase_2' ? { ...p, status: 'active' as const, progress: 15 } : p));
      addLog('phase_2', 'Software Classification', 'Starting software classification...');
    }, 3000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_2' ? { 
          ...p, 
          progress: 50,
          steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_2', 'Software Classification', 'Analyzing product characteristics...');
    }, 3500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_2' ? { 
          ...p, 
          progress: 100,
          status: 'completed' as const,
          steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 400) + 150 })) 
        } : p
      ));
      addLog('phase_2', 'Software Classification', 'Classification complete');
    }, 4500);

    // Phase 3: Security Data Gathering
    setTimeout(() => {
      setPhases(prev => prev.map(p => p.id === 'phase_3' ? { ...p, status: 'active' as const, progress: 10 } : p));
      addLog('phase_3', 'Security Data Gathering', 'Collecting security intelligence...');
    }, 5000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_3' ? { 
          ...p, 
          progress: 30,
          steps: p.steps.map((s, i) => i === 1 ? { ...s, status: 'active' as const } : i === 0 ? { ...s, status: 'skipped' as const } : s) 
        } : p
      ));
      addLog('phase_3', 'Security Data Gathering', 'Scanning vulnerability databases...');
    }, 5500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_3' ? { 
          ...p, 
          progress: 50,
          steps: p.steps.map((s, i) => i <= 1 ? (i === 0 ? { ...s, status: 'skipped' as const } : { ...s, status: 'completed' as const, duration: 890 }) : i === 2 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_3', 'Security Data Gathering', 'Analyzing vendor compliance...');
    }, 6500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_3' ? { 
          ...p, 
          progress: 80,
          steps: p.steps.map((s, i) => {
            if (i === 0) return { ...s, status: 'skipped' as const };
            if (i <= 4) return { ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 600) + 300 };
            if (i === 5) return { ...s, status: 'active' as const };
            return s;
          }) 
        } : p
      ));
      addLog('phase_3', 'Security Data Gathering', 'Collecting company information...');
    }, 7500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_3' ? { 
          ...p, 
          progress: 100,
          status: 'completed' as const,
          steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'skipped' as const } : { ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 700) + 250 }) 
        } : p
      ));
      addLog('phase_3', 'Security Data Gathering', 'Data collection complete');
    }, 8500);

    // Phase 4: AI Analysis
    setTimeout(() => {
      setPhases(prev => prev.map(p => p.id === 'phase_4' ? { ...p, status: 'active' as const, progress: 20 } : p));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Starting AI analysis...');
    }, 9000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_4' ? { 
          ...p, 
          progress: 40,
          steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Analyzing security posture...');
    }, 9500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_4' ? { 
          ...p, 
          progress: 70,
          steps: p.steps.map((s, i) => i <= 2 ? { ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 800) + 400 } : i === 3 ? { ...s, status: 'active' as const } : s) 
        } : p
      ));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Compiling source citations...');
    }, 10500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_4' ? { 
          ...p, 
          progress: 100,
          status: 'completed' as const,
          steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 900) + 500 })) 
        } : p
      ));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'CISO brief generated successfully');
      setReportReady(true);
      setIsProcessing(false);
    }, 12000);
  };

  const addLog = (phaseId: string, phaseName: string, message: string) => {
    setLogs(prev => [...prev, {
      id: `log-${++logIdCounter.current}`,
      timestamp: getTimestamp(),
      nodeId: phaseId,
      nodeLabel: phaseName,
      message: message,
      status: 'info'
    }]);
  };

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length > 0 ? phases.length : 4;

  return (
    <>
      {showWelcome && <WelcomeScreen onEnter={() => setShowWelcome(false)} />}
      
      <div className="h-screen flex flex-col bg-black" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        {/* Input Section with Logo */}
        <div className="border-b border-slate-800 bg-black shadow-lg shadow-slate-900/50">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
            {/* Left side - matches 65% pipeline panel */}
            <div className="w-full md:w-[65%] flex items-center gap-3 px-4 md:px-6 py-4 md:border-r border-slate-800">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-700 rounded-sm shadow-lg shadow-slate-700/50">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-black" />
                </div>
              </div>
              
              {/* Input with inline button */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter product name or vendor to assess (e.g., 'Apache Log4j 2.14' or 'Okta')"
                  className="w-full px-4 py-3 pr-16 bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm md:text-base font-mono"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-sm hover:from-slate-500 hover:to-slate-600 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-700/50"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            
            {/* Right side - Real-time Processing Status */}
            <div className="w-full md:w-[35%] px-4 md:px-6 py-3 md:py-4 flex items-center justify-center border-t md:border-t-0 border-slate-800">
              {isProcessing && (
                <div className="flex items-center gap-3 animate-fadeIn">
                  <div className="relative">
                    <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-slate-400 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">Processing</div>
                    <div className="text-sm text-slate-300 font-mono">{completedPhases} / {totalPhases} phases</div>
                  </div>
                </div>
              )}
              {!isProcessing && phases.length > 0 && (
                <div className="flex items-center gap-3 animate-fadeIn">
                  <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">Complete</div>
                    <div className="text-sm text-slate-300 font-mono">All phases finished</div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel - Phase Canvas (65%) */}
          <div className="w-full md:w-[65%] h-1/2 md:h-full md:border-r border-b md:border-b-0 border-slate-800 flex flex-col">
            {/* Left Panel Header */}
            <div className="px-4 md:px-6 py-3 border-b border-slate-800 bg-black">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse shadow-lg shadow-slate-500/50"></div>
                <h2 className="text-xs md:text-sm text-slate-400 uppercase tracking-wide font-mono">Assessment Phases</h2>
              </div>
            </div>
            {/* Canvas Area */}
            <div className="flex-1">
              <PhaseCanvas phases={phases} />
            </div>
          </div>

          {/* Right Panel - Activity Logs (35%) */}
          <div className="w-full md:w-[35%] h-1/2 md:h-full">
            <Citations isProcessing={isProcessing} logs={logs} />
          </div>
        </div>

        {/* Enhanced Report Button */}
        {reportReady && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={() => setShowReport(true)}
              className="group relative px-6 py-3 bg-black border border-slate-700 rounded-sm shadow-2xl hover:shadow-slate-700/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              {/* Silver gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-50"></div>
              
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-sm blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative flex items-center gap-2">
                <div className="p-1 bg-gradient-to-br from-slate-400 to-slate-600 rounded-sm group-hover:from-slate-300 group-hover:to-slate-500 transition-all duration-300">
                  <FileText className="w-4 h-4 text-black" />
                </div>
                <div>
                  <div className="text-xs bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent group-hover:from-slate-300 group-hover:to-slate-400 transition-all duration-300 font-mono">Assessment Complete</div>
                  <div className="text-sm bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300 font-mono">View Full Report</div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-400 rounded-full animate-pulse shadow-lg shadow-slate-400/50"></div>
            </button>
          </div>
        )}

        {/* Report View */}
        {showReport && (
          <ReportView
            query={currentQuery}
            onClose={() => setShowReport(false)}
          />
        )}
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
      `}</style>
    </>
  );
}
