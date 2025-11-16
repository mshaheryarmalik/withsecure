import { useState, useRef, useEffect } from 'react';
import { PhaseCanvas } from './components/PhaseCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CliTerminal } from './components/CliTerminal';
import { PastAnalysis } from './components/PastAnalysis';
import { ShieldLogo } from './components/ShieldLogo';
import { SystemStatusModal } from './components/SystemStatusModal';
import { Send, Shield, FileText, Terminal, History, Activity, Brain, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { AssessmentRequest, PhaseEvent, ResultEvent, ErrorEvent, CISOBrief } from './types/api';

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
  const [product, setProduct] = useState('');
  const [vendor, setVendor] = useState('');
  const [sha1, setSha1] = useState('');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);
  const currentPhaseRef = useRef<string>('');

  const [showReport, setShowReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [cliTerminalOpen, setCliTerminalOpen] = useState(false);
  const [pastAnalysisOpen, setPastAnalysisOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [assessmentData, setAssessmentData] = useState<CISOBrief | null>(null);
  
  // API URL from environment or default
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    setIsProcessing(true);
    setAssessmentData(null);

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
      addLog('system', 'System', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Mark all phases as error
      setPhases(prev => prev.map(p => ({ ...p, status: 'error' as const })));
      setIsProcessing(false);
    }
  };

  const handlePhaseEvent = (event: PhaseEvent & { message?: string }) => {
    const { phase, phase_name, step, messages } = event;
    
    // Map backend phase to our phase ID
    let phaseId = phase;
    if (phase === 'init' || phase === 'cache') {
      // Initial phase - activate phase_1
      phaseId = 'phase_1';
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, status: 'active' as const } : p));
      if (event.message) {
        addLog(phaseId, phase_name || 'Initialization', event.message);
      }
      return;
    }

    // Update phase status
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        // Mark this phase as active
        const updatedPhase = { ...p, status: 'active' as const };
        
        // Update progress based on step
        if (step) {
          // Try to match step to a step in the phase
          const stepIndex = updatedPhase.steps.findIndex(s => 
            s.message.toLowerCase().includes(step.toLowerCase()) ||
            s.detail.toLowerCase().includes(step.toLowerCase())
          );
          
          if (stepIndex >= 0) {
            // Mark previous steps as completed, current as active
            updatedPhase.steps = updatedPhase.steps.map((s, i) => {
              if (i < stepIndex) return { ...s, status: 'completed' as const };
              if (i === stepIndex) return { ...s, status: 'active' as const };
              return s;
            });
          }
          
          // Calculate progress (rough estimate)
          const activeStepIndex = updatedPhase.steps.findIndex(s => s.status === 'active');
          if (activeStepIndex >= 0) {
            updatedPhase.progress = Math.min(100, ((activeStepIndex + 1) / updatedPhase.steps.length) * 100);
          }
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

    // Add messages to logs
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        addLog(phaseId, phase_name, msg);
      });
    } else if (step) {
      addLog(phaseId, phase_name, step);
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
      
      addLog('system', 'System', 'Assessment completed successfully');
      setReportReady(true);
      setIsProcessing(false);
    }
  };

  const handleErrorEvent = (event: ErrorEvent) => {
    const errorMsg = event.error || (event.errors && event.errors.join('; ')) || 'Unknown error';
    addLog('system', 'System', `Error: ${errorMsg}`, 'error');
    
    // Mark current phase as error
    setPhases(prev => prev.map(p => {
      if (p.status === 'active') {
        return { ...p, status: 'error' as const };
      }
      return p;
    }));
    
    setIsProcessing(false);
  };

  const addLog = (phaseId: string, phaseName: string, message: string, status: 'active' | 'completed' | 'error' | 'info' = 'info') => {
    setLogs(prev => [...prev, {
      id: `log-${++logIdCounter.current}`,
      timestamp: getTimestamp(),
      nodeId: phaseId,
      nodeLabel: phaseName,
      message: message,
      status: status
    }]);
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
          id: 'phase_1',
          name: 'Entity Resolution',
          description: 'Identifying the product, vendor, and website from your input',
          status: 'completed',
          progress: 100,
          steps: [
            { id: 'detect_input', message: 'Analyzing input type (SHA1/URL/Name)', detail: 'Determining the best resolution strategy', status: 'completed', duration: 234 },
            { id: 'search_entity', message: 'Searching security databases and web sources', detail: 'Querying VirusTotal, Tavily, and other sources', status: 'completed', sources: ['VirusTotal', 'Tavily'], duration: 456 },
            { id: 'resolve_fields', message: 'Filling missing product and vendor details', detail: 'Ensuring complete entity information', status: 'completed', duration: 389 },
            { id: 'validate_entity', message: 'Validating entity identification', detail: 'Confirming we have enough data to proceed', status: 'completed', duration: 312 }
          ]
        },
        {
          id: 'phase_2',
          name: 'Software Classification',
          description: 'Categorizing the software using AI and industry taxonomies',
          status: 'completed',
          progress: 100,
          steps: [
            { id: 'analyze_product', message: 'Analyzing product characteristics', detail: 'Understanding product type and purpose', status: 'completed', duration: 445 },
            { id: 'match_categories', message: 'Matching against 868 Gartner categories', detail: 'Finding primary and secondary categories', status: 'completed', duration: 523 },
            { id: 'assign_taxonomy', message: 'Assigning software taxonomy', detail: 'Classification complete with confidence level', status: 'completed', duration: 367 }
          ]
        },
        {
          id: 'phase_3',
          name: 'Security Data Gathering',
          description: 'Collecting security intelligence from 15+ trusted sources',
          status: 'completed',
          progress: 100,
          steps: [
            { id: 'version_detection', message: 'Detecting latest product version', detail: 'Required for accurate CVE matching', optional: true, status: 'skipped' },
            { id: 'vulnerability_scan', message: 'Scanning vulnerability databases', detail: 'Checking NVD, GitHub Advisories, US-CERT', status: 'completed', sources: ['NVD', 'GitHub Advisories', 'US-CERT'], duration: 890 },
            { id: 'vendor_compliance', message: 'Analyzing vendor compliance posture', detail: 'Checking security pages, ToS, Privacy Policy, FedRAMP', status: 'completed', sources: ['Security Page', 'ToS', 'Privacy Policy', 'DPA', 'FedRAMP'], duration: 678 },
            { id: 'breach_incidents', message: 'Checking breach and incident history', detail: 'Querying HaveIBeenPwned and security news', status: 'completed', sources: ['HaveIBeenPwned', 'Security News'], duration: 534 },
            { id: 'threat_intel', message: 'Gathering threat intelligence', detail: 'Checking malware databases and threat feeds', status: 'completed', sources: ['MalwareBazaar', 'URLhaus', 'AlienVault OTX'], duration: 712 },
            { id: 'company_info', message: 'Collecting company and domain information', detail: 'WHOIS lookup and company background', status: 'completed', sources: ['WHOIS', 'Company Database'], duration: 423 },
            { id: 'alternatives', message: 'Finding alternative products', detail: 'Searching G2 and AlternativeTo databases', status: 'completed', sources: ['G2', 'AlternativeTo'], duration: 598 }
          ]
        },
        {
          id: 'phase_4',
          name: 'AI Analysis & Brief Generation',
          description: 'Synthesizing findings into a CISO-ready security assessment',
          status: 'completed',
          progress: 100,
          steps: [
            { id: 'analyze_security', message: 'Analyzing security posture with AI', detail: 'Evaluating CVE severity, trends, and vendor transparency', status: 'completed', duration: 1023 },
            { id: 'calculate_scores', message: 'Calculating trust and risk scores', detail: 'Scoring based on vulnerabilities, breaches, and compliance', status: 'completed', duration: 845 },
            { id: 'extract_alternatives', message: 'Identifying safer alternatives', detail: 'Using AI to recommend comparable products', status: 'completed', duration: 967 },
            { id: 'build_citations', message: 'Compiling source citations', detail: 'Labeling vendor-stated vs independent sources', status: 'completed', duration: 734 },
            { id: 'generate_brief', message: 'Generating final CISO brief', detail: 'Creating structured assessment with rationale', status: 'completed', duration: 1156 }
          ]
        }
      ];

      setPhases(completedPhases);
      
      // Add logs for loaded analysis
      addLog('phase_1', 'Entity Resolution', 'Loaded from past analysis');
      addLog('phase_2', 'Software Classification', 'Loaded from past analysis');
      addLog('phase_3', 'Security Data Gathering', 'Loaded from past analysis');
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Loaded from past analysis');
      addLog('system', 'System', `Analysis for ${analysis.product} loaded successfully`);

      // Set report as ready
      setReportReady(true);
      setIsProcessing(false);
    }, 1500); // 1.5 second loading delay
  };

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length > 0 ? phases.length : 4;

  return (
    <>
      {showWelcome && <WelcomeScreen onEnter={() => setShowWelcome(false)} />}
      
      <div className="h-screen flex flex-col bg-black" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        {/* Input Section with Logo */}
        <div className="border-b border-slate-800 bg-black shadow-lg shadow-slate-900/50">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Main Input Row */}
            <div className="w-full flex items-center gap-2 md:gap-4 px-2 md:px-6 py-2.5">
              <div className="flex items-center flex-shrink-0">
                <ShieldLogo className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Product Name - Required */}
                <div className="relative">
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="Product name *"
                    className={`w-full px-3 md:px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-sm transition-all ${
                      !product.trim() && !sha1.trim() && !url.trim()
                        ? 'border-slate-600 shadow-[0_0_15px_rgba(148,163,184,0.3)] animate-pulse-glow' 
                        : 'border-slate-700'
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                
                {/* Vendor Name - Optional */}
                <div className="relative">
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor name (optional)"
                    className="w-full px-3 md:px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-sm transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                
                {/* SHA1 - Optional */}
                <div className="relative">
                  <input
                    type="text"
                    value={sha1}
                    onChange={(e) => setSha1(e.target.value)}
                    placeholder="SHA1 hash (optional)"
                    className="w-full px-3 md:px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-sm transition-all font-mono"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                
                {/* URL - Optional */}
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="URL (optional)"
                    className="w-full px-3 md:px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs md:text-sm transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>
              
              {/* Submit Button and Status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="submit"
                  disabled={!product.trim() && !sha1.trim() && !url.trim()}
                  className="p-2 text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed transition-all bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700 disabled:border-slate-800"
                  title="Start Assessment"
                >
                  <Brain className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                
                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="p-2 text-slate-400 hover:text-slate-200 transition-all bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700"
                  title="Advanced Options"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {/* Status Indicator */}
                {isProcessing && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="relative">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-slate-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">Processing</div>
                      <div className="text-xs text-slate-300" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{completedPhases} / {totalPhases}</div>
                    </div>
                  </div>
                )}
                {!isProcessing && phases.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full"></div>
                    <div className="hidden md:block">
                      <div className="text-xs text-slate-400 uppercase tracking-wide font-mono">Complete</div>
                      <div className="text-xs text-slate-300" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Ready</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Advanced Options (Version) */}
            {showAdvanced && (
              <div className="px-2 md:px-6 pb-2.5 border-t border-slate-800 pt-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 whitespace-nowrap">Version:</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Product version (optional)"
                    className="flex-1 max-w-xs px-3 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-xs transition-all"
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
                  <span className="hidden md:inline text-xs text-slate-400 group-hover:text-slate-300 uppercase tracking-wide font-mono transition-colors">All Systems Operational</span>
                  <CheckCircle2 className="hidden md:block w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                </button>
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
              <PhaseCanvas phases={phases} />
            </div>
          </div>
        </div>

        <Citations 
          isProcessing={isProcessing} 
          logs={logs}
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
