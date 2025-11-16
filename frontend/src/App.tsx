import { useState, useRef, useEffect } from 'react';
import { PhaseCanvas } from './components/PhaseCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { CliTerminal } from './components/CliTerminal';
import { ShieldLogo } from './components/ShieldLogo';
import { Send, Shield, FileText, Terminal, Activity, Brain, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { AssessmentRequest, PhaseEvent, ResultEvent, ErrorEvent, CISOBrief } from './types/api';
import { API_BASE_URL } from './config';

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
  currentStep?: string; // Current step message from stream
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
  const [product, setProduct] = useState('');
  const [vendor, setVendor] = useState('');
  const [sha1, setSha1] = useState('');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('');
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]); // All logs for terminal
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]); // Filtered logs for activity log
  const logIdCounter = useRef(0);
  const currentPhaseRef = useRef<string>('');

  const [showReport, setShowReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [cliTerminalOpen, setCliTerminalOpen] = useState(false);
  const [assessmentData, setAssessmentData] = useState<CISOBrief | null>(null);
  
  // API URL - use the centralized config
  const API_URL = API_BASE_URL;

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
    if (!product.trim() && !sha1.trim() && !url.trim()) {
      // At least one of product, sha1, or url must be provided
      return;
    }

    // Build query string for display
    const query = product.trim() || sha1.trim() || url.trim() || vendor.trim();
    setCurrentQuery(query);
    setShowReport(false);
    setReportReady(false);
    setIsProcessing(true);
    setAssessmentData(null);

    // Build request payload with all provided fields
    const request: AssessmentRequest = {
      product: product.trim() || undefined,
      vendor: vendor.trim() || undefined,
      sha1: sha1.trim() || undefined,
      url: url.trim() || undefined,
      version: version.trim() || undefined,
    };

    // Clear form after submission (optional - you can keep values if preferred)
    // setProduct('');
    // setVendor('');
    // setSha1('');
    // setUrl('');
    // setVersion('');

    processWithBackend(request);
  };

  const processWithBackend = async (request: AssessmentRequest) => {
    // Clear previous state
    setPhases([]);
    setLogs([]);
    setActivityLogs([]);
    setIsProcessing(true);
    setAssessmentData(null);

    // Initialize all 4 phases with pending status (no dummy steps)
    const initialPhases: Phase[] = [
      {
        id: 'phase_1',
        name: 'Entity Resolution',
        description: 'Identifying the product, vendor, and website from your input',
        status: 'pending',
        progress: 0,
        steps: []
      },
      {
        id: 'phase_2',
        name: 'Software Classification',
        description: 'Categorizing the software using AI and industry taxonomies',
        status: 'pending',
        progress: 0,
        steps: []
      },
      {
        id: 'phase_3',
        name: 'Security Data Gathering',
        description: 'Collecting security intelligence from 15+ trusted sources',
        status: 'pending',
        progress: 0,
        steps: []
      },
      {
        id: 'phase_4',
        name: 'AI Analysis & Brief Generation',
        description: 'Synthesizing findings into a CISO-ready security assessment',
        status: 'pending',
        progress: 0,
        steps: []
      }
    ];

    setPhases(initialPhases);

    try {
      // Connect to SSE endpoint
      const response = await fetch(`${API_URL}/assess/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('event:')) {
            currentEventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                
                if (currentEventType === 'phase') {
                  handlePhaseEvent(data as PhaseEvent);
                } else if (currentEventType === 'result') {
                  handleResultEvent(data as ResultEvent);
                } else if (currentEventType === 'error') {
                  handleErrorEvent(data as ErrorEvent);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e, dataStr);
              }
            }
          } else if (line === '') {
            // Empty line indicates end of event
            currentEventType = '';
          }
        }
      }
    } catch (error) {
      console.error('SSE connection error:', error);
      const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      addLog('system', 'System', errorMsg, 'error', true); // System messages go to both logs
      
      // Mark all phases as error
      setPhases(prev => prev.map(p => ({ ...p, status: 'error' as const })));
      setIsProcessing(false);
    }
  };

  // Filter function to show only meaningful messages in activity log
  const isMeaningfulMessage = (msg: string, phaseId: string): boolean => {
    const trimmed = msg.trim();
    
    // Skip empty messages
    if (!trimmed) return false;
    
    // Skip generic start/end messages
    const skipPatterns = [
      /^starting/i,
      /^beginning/i,
      /^initiating/i,
      /complete!?$/i,
      /finished/i,
      /done!?$/i,
      /^✓\s*resolution completed/i,
      /^✓\s*data collection complete/i,
      /^📝\s*debug log saved/i,
      /^\[Step \d+\/\d+\]/i,
      /^        [├└─]/i, // Tree structure indicators
      /^  \[Step/i,
      /^        ├─/i,
      /^        └─/i,
      /^  📊 Processing/i,
      /^  🤖 Invoking/i,
      /^  🔍 Analyzing/i,
      /^  📋 FINAL ENTITY DETAILS:/i,
      /^  📊 Resolved \d+ field/i,
    ];
    
    if (skipPatterns.some(pattern => pattern.test(trimmed))) {
      return false;
    }
    
    // Phase-specific meaningful patterns
    if (phaseId === 'phase_1') {
      // Keep: Product Name, Vendor Name, Website, Product Type, Interpretation
      return /(Product Name|Vendor Name|Website|Product Type|Interpretation|File Reputation|Reasoning):/i.test(trimmed);
    }
    
    if (phaseId === 'phase_2') {
      // Keep: Primary Category, Secondary Categories, Confidence, Reasoning
      return /(Primary Category|Secondary Categories|Confidence|Reasoning):/i.test(trimmed);
    }
    
    if (phaseId === 'phase_3') {
      // Keep: CVE counts, sources queried, key security findings
      return /(CVEs?|sources? queried|vulnerabilities?|breaches?|incidents?|compliance|certifications?|✓)/i.test(trimmed) &&
             !/complete!?$/i.test(trimmed);
    }
    
    if (phaseId === 'phase_4') {
      // Keep: Trust score, Risk score, Confidence, Alternatives, key metrics
      return /(Trust Score|Risk Score|Confidence|Alternatives|rationale|summary)/i.test(trimmed) ||
             /^\s*•\s*(Trust|Risk|Confidence|Alternative)/i.test(trimmed);
    }
    
    // Keep messages with actual data (containing colons, numbers, or specific indicators)
    if (/[:•]/.test(trimmed) && trimmed.length > 10) {
      return true;
    }
    
    // Skip very short generic messages
    if (trimmed.length < 15) {
      return false;
    }
    
    return true;
  };

  const handlePhaseEvent = (event: PhaseEvent & { message?: string }) => {
    const { phase, phase_name, step, messages } = event;
    
    // Map backend phase to our phase ID
    let phaseId = phase;
    if (phase === 'init' || phase === 'cache') {
      // Initial phase - activate phase_1
      phaseId = 'phase_1';
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, status: 'active' as const } : p));
      // Skip init/cache messages in activity log
      return;
    }

    // Update phase status and extract actual steps from messages
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        // Mark this phase as active
        const updatedPhase = { ...p, status: 'active' as const, currentStep: step || '' };
        
        // Extract meaningful steps from messages
        if (messages && messages.length > 0) {
          const newSteps: Step[] = [];
          messages.forEach((msg, idx) => {
            // Only add meaningful messages as steps
            if (isMeaningfulMessage(msg, phaseId)) {
              // Check if step already exists
              const existingStep = updatedPhase.steps.find(s => s.message === msg);
              if (!existingStep) {
                newSteps.push({
                  id: `step-${phaseId}-${Date.now()}-${idx}`,
                  message: msg,
                  detail: msg,
                  status: 'active' as const
                });
              }
            }
          });
          
          // Mark previous steps as completed, add new ones
          updatedPhase.steps = [
            ...updatedPhase.steps.map(s => ({ ...s, status: 'completed' as const })),
            ...newSteps
          ];
        }
        
        return updatedPhase;
      } else if (currentPhaseRef.current && p.id === currentPhaseRef.current) {
        // Mark previous phase as completed when new phase starts
        return { ...p, status: 'completed' as const, progress: 100 };
      }
      return p;
    }));

    // Update current phase
    if (phaseId !== currentPhaseRef.current) {
      currentPhaseRef.current = phaseId;
    }

    // Add all messages to terminal logs, but only meaningful ones to activity log
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        // Always add to terminal (all logs)
        addLog(phaseId, phase_name, msg, 'info', false);
        
        // Only add meaningful messages to activity log
        if (isMeaningfulMessage(msg, phaseId)) {
          addLog(phaseId, phase_name, msg, 'info', true);
        }
      });
    }
  };

  const handleResultEvent = (event: ResultEvent) => {
    if (event.success && event.assessment) {
      setAssessmentData(event.assessment);
      
      // Mark all phases as completed
      setPhases(prev => prev.map(p => ({
        ...p,
        status: 'completed' as const,
        progress: 100,
        steps: p.steps.map(s => ({ ...s, status: 'completed' as const }))
      })));
      
      const completionMsg = 'Assessment completed successfully';
      addLog('system', 'System', completionMsg, 'info', true); // System messages go to both logs
      setReportReady(true);
      setIsProcessing(false);
    }
  };

  const handleErrorEvent = (event: ErrorEvent) => {
    const errorMsg = event.error || (event.errors && event.errors.join('; ')) || 'Unknown error';
    addLog('system', 'System', `Error: ${errorMsg}`, 'error', true); // System messages go to both logs
    
    // Mark current phase as error
    setPhases(prev => prev.map(p => {
      if (p.status === 'active') {
        return { ...p, status: 'error' as const };
      }
      return p;
    }));
    
    setIsProcessing(false);
  };

  const addLog = (phaseId: string, phaseName: string, message: string, status: 'active' | 'completed' | 'error' | 'info' = 'info', addToActivityLog: boolean = false) => {
    const newLog: LogEntry = {
      id: `log-${++logIdCounter.current}`,
      timestamp: getTimestamp(),
      nodeId: phaseId,
      nodeLabel: phaseName,
      message: message,
      status: status
    };

    // Always add to terminal logs (all logs)
    setLogs(prev => {
      // Check if this exact message already exists (prevent duplicates)
      const messageExists = prev.some(log => 
        log.nodeId === phaseId && 
        log.nodeLabel === phaseName && 
        log.message === message
      );
      
      if (messageExists) {
        return prev; // Don't add duplicate
      }
      
      return [...prev, newLog];
    });

    // Only add to activity log if explicitly requested (filtered)
    if (addToActivityLog) {
      setActivityLogs(prev => {
        const messageExists = prev.some(log => 
          log.nodeId === phaseId && 
          log.nodeLabel === phaseName && 
          log.message === message
        );
        
        if (messageExists) {
          return prev;
        }
        
        return [...prev, newLog];
      });
    }
  };


  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length > 0 ? phases.length : 4;

  return (
    <>
      <div className="h-screen flex flex-col bg-slate-950" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        {/* Input Section with Logo */}
        <div className="border-b border-slate-700 bg-slate-950 shadow-lg shadow-slate-900/50">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Main Input Row */}
            <div className="w-full flex items-center gap-2 md:gap-4 px-2 md:px-6 py-2.5">
              <div className="flex items-center flex-shrink-0">
                <Brain className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
              
              {/* Main Product Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Enter product name to assess..."
                  className={`w-full px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-r from-slate-800 to-slate-700 border text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm md:text-base transition-all ${
                    !product.trim() && !sha1.trim() && !url.trim()
                      ? 'border-slate-500 shadow-[0_0_15px_rgba(148,163,184,0.3)] animate-pulse-glow' 
                      : 'border-slate-600'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              
              {/* Additional Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdditionalFilters(!showAdditionalFilters)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-slate-700/80 to-slate-600/60 hover:from-slate-600/80 hover:to-slate-500/60 border border-slate-600 hover:border-slate-500 rounded-lg transition-all group"
                title="Additional Filters"
              >
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-slate-200 group-hover:text-slate-100 transition-colors" />
                <span className="hidden md:inline text-xs text-slate-200 group-hover:text-slate-100 uppercase tracking-wide font-mono transition-colors">Filters</span>
                {showAdditionalFilters ? (
                  <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-slate-200 transition-colors" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-slate-200 transition-colors" />
                )}
              </button>
              
              {/* Submit Button and Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="submit"
                  disabled={!product.trim() && !sha1.trim() && !url.trim()}
                  className="p-2 text-slate-200 hover:text-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-all bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600 disabled:border-slate-700"
                  title="Start Assessment"
                >
                  <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>
                
                {/* Status Indicator */}
                {isProcessing && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="relative">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-200 uppercase tracking-wide font-mono">Processing</div>
                      <div className="text-xs text-slate-100" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{completedPhases} / {totalPhases}</div>
                    </div>
                  </div>
                )}
                {!isProcessing && phases.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full"></div>
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-200 uppercase tracking-wide font-mono">Complete</div>
                      <div className="text-xs text-slate-100" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Ready</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Filters Dropdown */}
            {showAdditionalFilters && (
              <div className="px-2 md:px-6 pb-2.5 border-t border-slate-700 pt-3 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Vendor Name */}
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor name"
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs md:text-sm transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  
                  {/* SHA1 Hash */}
                  <input
                    type="text"
                    value={sha1}
                    onChange={(e) => setSha1(e.target.value)}
                    placeholder="SHA1 hash"
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs md:text-sm transition-all font-mono"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  
                  {/* URL */}
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="URL"
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs md:text-sm transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  
                  {/* Version */}
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Version"
                    className="w-full px-3 py-2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-xs md:text-sm transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Main Content - Full Width Canvas */}
        <div className="flex-1 overflow-hidden relative">
          <div className="w-full h-full flex flex-col">
            <div className="px-4 md:px-6 py-3 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-4">
              </div>
              {/* Center: View Report button - center aligned on mobile */}
              <div className="flex-1 flex justify-center md:justify-end md:mr-4">
                {reportReady && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="relative flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500 hover:from-slate-400 hover:via-slate-500 hover:to-slate-400 border border-slate-600 rounded-[3px] transition-all text-xs font-mono text-white shadow-lg animate-edge-glow"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Report</span>
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
                  <Activity className="w-4 h-4 text-slate-200" />
                </button>
                <button
                  onClick={() => setCliTerminalOpen(true)}
                  className="p-1.5 hover:bg-slate-900 rounded-sm transition-colors border border-slate-800 hover:border-slate-700"
                  title="CLI Terminal"
                >
                  <Terminal className="w-4 h-4 text-slate-200" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <PhaseCanvas phases={phases} />
            </div>
          </div>
        </div>

        <Citations 
          isProcessing={isProcessing} 
          logs={activityLogs}
          isOpen={activityLogOpen}
          onClose={() => setActivityLogOpen(false)}
        />

        {showReport && assessmentData && (
          <ReportView
            query={currentQuery}
            assessment={assessmentData}
            onClose={() => setShowReport(false)}
          />
        )}

        <CliTerminal
          isOpen={cliTerminalOpen}
          onClose={() => setCliTerminalOpen(false)}
          logs={logs}
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
