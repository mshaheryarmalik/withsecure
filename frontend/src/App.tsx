import { useState, useRef, useEffect } from 'react';
<<<<<<< HEAD
import { GraphCanvas } from './components/GraphCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { Send, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { STREAM_ENDPOINT } from './config';
import type { AssessmentRequest, CISOBrief, PhaseEvent, ResultEvent, ErrorEvent } from './types/api';

interface Node {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  wittyRemark: string;
  details?: string;
  position: { x: number; y: number };
}

interface Edge {
  from: string;
  to: string;
=======
import { PhaseCanvas } from './components/PhaseCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CliTerminal } from './components/CliTerminal';
import { PastAnalysis } from './components/PastAnalysis';
import { ShieldLogo } from './components/ShieldLogo';
import { SystemStatusModal } from './components/SystemStatusModal';
import { Send, Shield, FileText, Terminal, History, Activity, Brain, CheckCircle2 } from 'lucide-react';

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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
<<<<<<< HEAD
  status: 'active' | 'completed' | 'error' | 'info' | 'warning';
}

export default function App() {
  // Form inputs
  const [product, setProduct] = useState('');
  const [vendor, setVendor] = useState('');
  const [url, setUrl] = useState('');
  const [sha1, setSha1] = useState('');
  const [version, setVersion] = useState('');
  const [noCache, setNoCache] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);
  const [assessment, setAssessment] = useState<CISOBrief | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  // Phase node mapping
  const PHASE_NODES = {
    init: { id: 'init', label: 'Starting Assessment', wittyRemark: 'Initializing...' },
    phase_1: { id: 'phase_1', label: 'Entity Resolution', wittyRemark: 'Resolving entity...' },
    phase_2: { id: 'phase_2', label: 'Software Classification', wittyRemark: 'Classifying software...' },
    phase_3: { id: 'phase_3', label: 'Security Data Gathering', wittyRemark: 'Gathering security data...' },
    phase_4: { id: 'phase_4', label: 'AI Analysis & Brief', wittyRemark: 'Generating report...' },
  };

  // Vertical layout configuration (nodes flow top to bottom)
  const NODE_VERTICAL_SPACING = 18; // 18% spacing between nodes vertically
  const START_Y = 10; // Start at 10% from top
  const CENTER_X = 50; // Center horizontally at 50%
=======
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
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [cliTerminalOpen, setCliTerminalOpen] = useState(false);
  const [pastAnalysisOpen, setPastAnalysisOpen] = useState(false);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da

  // Set document title
  useEffect(() => {
    document.title = 'CISO Security Assessor';
  }, []);

<<<<<<< HEAD
  // Auto-scroll logs
  useEffect(() => {
    const logsContainer = document.getElementById('logs-container');
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }, [logs]);

=======
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

<<<<<<< HEAD
  const handleNodeMove = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    );
  };

  const handleCanvasPan = (deltaX: number, deltaY: number) => {
    console.log('Canvas panned:', deltaX, deltaY);
  };

  const addOrUpdateNode = (phaseId: string, status: 'pending' | 'active' | 'completed' | 'error', wittyRemark?: string, details?: string) => {
    setNodes(prevNodes => {
      const phaseKeys = Object.keys(PHASE_NODES);
      const phaseIndex = phaseKeys.indexOf(phaseId);
      
      if (phaseIndex === -1) return prevNodes;

      const nodeConfig = PHASE_NODES[phaseId as keyof typeof PHASE_NODES];
      // Vertical layout: center horizontally, flow vertically
      const position = { x: CENTER_X, y: START_Y + (phaseIndex * NODE_VERTICAL_SPACING) };

      // Check if node exists
      const existingNode = prevNodes.find(n => n.id === phaseId);
      
      if (existingNode) {
        // Update existing node
        return prevNodes.map(node =>
          node.id === phaseId
            ? { ...node, status, wittyRemark: wittyRemark || node.wittyRemark, details: details || node.details }
            : node
        );
      } else {
        // Add new node and create edges
        const newNode: Node = {
          id: phaseId,
          label: nodeConfig.label,
          status,
          wittyRemark: wittyRemark || nodeConfig.wittyRemark,
          details,
          position,
        };
        return [...prevNodes, newNode];
      }
    });

    // Update edges
    setEdges(prevEdges => {
      const phaseKeys = Object.keys(PHASE_NODES);
      const phaseIndex = phaseKeys.indexOf(phaseId);
      
      if (phaseIndex > 0) {
        const prevPhaseId = phaseKeys[phaseIndex - 1];
        const edgeExists = prevEdges.some(e => e.from === prevPhaseId && e.to === phaseId);
        
        if (!edgeExists) {
          return [...prevEdges, { from: prevPhaseId, to: phaseId }];
        }
      }
      
      return prevEdges;
    });
  };

  const addLog = (nodeId: string, nodeLabel: string, message: string, status: LogEntry['status']) => {
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
      nodeId,
      nodeLabel,
      message,
      status,
    }]);
  };

  const isImportantMessage = (message: string): boolean => {
    if (!message || typeof message !== 'string') return false;
    
    // Filter out verbose/technical messages and generic phase starts/ends
    const skipPatterns = [
      /^─+$/,  // Just separator lines
      /^\s*$/,  // Empty or whitespace only
      /^Step \d+\/\d+:/,  // Step counters without context
      /^└─/,  // Tree structure characters only
      /^├─/,
      /^│/,
      /^▸.*Starting/i,  // Generic "Starting..." messages
      /Initializing\.\.\./i,
      /Resolving entity\.\.\./i,
      /Classifying software\.\.\./i,
      /Gathering security data\.\.\./i,
      /Generating report\.\.\./i,
      /Loaded from cache$/i,  // Generic cache messages
      /Retrieved from cache$/i,
      /Entity Resolved$/i,  // Generic completion without details
      /Classification Complete$/i,
      /Data Gathering Complete$/i,
      /Brief Complete$/i,
      /PHASE \d+:/i,  // Phase headers
      /Running.*classification/i,
      /Invoking LLM/i,
      /Analyzing input format/i,
      /Checking against.*categories/i,
    ];
    
    if (skipPatterns.some(pattern => pattern.test(message.trim()))) {
      return false;
    }
    
    // Include only actual results and findings
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
    
    return includePatterns.some(pattern => pattern.test(message));
  };

  const parseSSEMessage = (data: string): { event: string; data: any } | null => {
    try {
      const lines = data.split('\n');
      let event = 'message';
      let jsonData = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          jsonData = line.substring(5).trim();
        }
      }

      if (jsonData) {
        return { event, data: JSON.parse(jsonData) };
      }
    } catch (e) {
      console.error('Error parsing SSE message:', e);
    }
    return null;
  };

  const connectToStreamingAPI = async (request: AssessmentRequest) => {
    try {
      const response = await fetch(STREAM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const parsed = parseSSEMessage(line);
            if (parsed) {
              handleSSEEvent(parsed.event, parsed.data);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog('error', 'Error', errorMessage, 'error');
      addOrUpdateNode('phase_1', 'error');
      setIsProcessing(false);
    }
  };

  const handleSSEEvent = (event: string, data: any) => {
    switch (event) {
      case 'phase': {
        const phaseData = data as PhaseEvent;
        const phaseId = phaseData.phase;
        const phaseConfig = PHASE_NODES[phaseId as keyof typeof PHASE_NODES];
        const phaseName = phaseConfig ? phaseConfig.label : phaseId;
        
        // Extract reasoning from messages based on phase
        let reasoning = phaseData.step || '';
        if (phaseData.messages && Array.isArray(phaseData.messages)) {
          let reasoningLine: string | undefined;
          
          // Phase-specific reasoning extraction
          if (phaseId === 'phase_2') {
            // Software Classification: prioritize showing category
            reasoningLine = phaseData.messages.find((msg: string) => 
              msg && typeof msg === 'string' && (
                msg.includes('Primary Category:') ||
                msg.includes('Category:')
              )
            );
          } else if (phaseId === 'phase_4') {
            // AI Analysis & Brief: show scores
            reasoningLine = phaseData.messages.find((msg: string) => 
              msg && typeof msg === 'string' && (
                msg.includes('Trust Score:') ||
                msg.includes('Risk Score:') ||
                msg.includes('Rationale:')
              )
            );
          } else {
            // Other phases: show product name or reasoning
            reasoningLine = phaseData.messages.find((msg: string) => 
              msg && typeof msg === 'string' && (
                msg.includes('Product Name:') ||
                msg.includes('Reasoning:') ||
                msg.includes('Rationale:')
              )
            );
          }
          
          if (reasoningLine) {
            reasoning = reasoningLine.replace(/^[─├└│\s]+/, '').trim();
          }
        }
        
        // Update node status with reasoning
        addOrUpdateNode(phaseId, 'active', reasoning, phaseData.step);

        // Mark previous phases as completed
        const phaseKeys = Object.keys(PHASE_NODES);
        const currentIndex = phaseKeys.indexOf(phaseId);
        for (let i = 0; i < currentIndex; i++) {
          addOrUpdateNode(phaseKeys[i], 'completed');
        }

        // Don't add generic phase header logs - only actual findings will be added below

        // Add important messages as logs
        if (phaseData.messages && Array.isArray(phaseData.messages)) {
          phaseData.messages.forEach(message => {
            if (message && typeof message === 'string' && isImportantMessage(message)) {
              // Determine status for this message
              let messageStatus: LogEntry['status'] = 'info';
              if (message.includes('[FAILED]') || message.includes('[ERROR]')) {
                messageStatus = 'error';
              } else if (message.includes('[WARNING]')) {
                messageStatus = 'warning';
              } else if (message.includes('[OK]') || message.includes('completed') || message.includes('Complete')) {
                messageStatus = 'completed';
              } else if (message.includes('Analyzing') || message.includes('Processing')) {
                messageStatus = 'active';
              }
              
              // Clean up message for display
              const cleanMessage = message
                .replace(/^[─├└│\s]+/, '') // Remove tree characters
                .trim();
              
              if (cleanMessage) {
                addLog(phaseId, phaseName, cleanMessage, messageStatus);
              }
            }
          });
        }
        break;
      }

      case 'result': {
        const resultData = data as ResultEvent;
        if (resultData.success && resultData.assessment) {
          setAssessment(resultData.assessment);
          
          // Check if this was a cached result (no phase nodes exist yet)
          const isCachedResult = nodes.length <= 1; // Only init node or no nodes
          
          if (isCachedResult) {
            // Create all phase nodes as completed for cached results
            const phaseKeys = Object.keys(PHASE_NODES);
            phaseKeys.forEach((phaseId, index) => {
              const nodeConfig = PHASE_NODES[phaseId as keyof typeof PHASE_NODES];
              // Vertical layout for cached results too
              const position = { x: CENTER_X, y: START_Y + (index * NODE_VERTICAL_SPACING) };
              
              setNodes(prev => {
                const exists = prev.find(n => n.id === phaseId);
                if (!exists) {
                  return [...prev, {
                    id: phaseId,
                    label: nodeConfig.label,
                    status: 'completed' as const,
                    wittyRemark: 'Loaded from cache',
                    details: 'Retrieved from cache',
                    position,
                  }];
                }
                return prev;
              });
              
              // Add edges
              if (index > 0) {
                const prevPhaseId = phaseKeys[index - 1];
                setEdges(prev => {
                  const exists = prev.find(e => e.from === prevPhaseId && e.to === phaseId);
                  if (!exists) {
                    return [...prev, { from: prevPhaseId, to: phaseId }];
                  }
                  return prev;
                });
              }
              
              // Don't add generic cache logs - only show final result
            });
          } else {
            // Mark all existing phases as completed
            Object.keys(PHASE_NODES).forEach(phaseId => {
              addOrUpdateNode(phaseId, 'completed');
            });
          }

          addLog('complete', 'Assessment Complete', 
            isCachedResult ? 'Assessment retrieved from cache' : 'Assessment completed successfully', 
            'completed');
          setIsProcessing(false);
        }
        break;
      }

      case 'error': {
        const errorData = data as ErrorEvent;
        const errorMessage = errorData.error || 'Assessment failed';
        setError(errorMessage);
        addLog('error', 'Error', errorMessage, 'error');
        
        // Mark current phase as error
        const currentPhase = nodes[nodes.length - 1];
        if (currentPhase) {
          addOrUpdateNode(currentPhase.id, 'error');
        }
        
        setIsProcessing(false);
        break;
      }

      default:
        console.log('Unknown event type:', event, data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product.trim()) {
      setError('Product name is required');
      return;
    }

    // Clear previous state
    setNodes([]);
    setEdges([]);
    setLogs([]);
    setAssessment(null);
    setShowReport(false);
    setError(null);
    setIsProcessing(true);
    setCurrentQuery(product);

    // Build request
    const request: AssessmentRequest = {
      product: product.trim(),
      no_cache: noCache,
    };

    if (vendor.trim()) request.vendor = vendor.trim();
    if (url.trim()) request.url = url.trim();
    if (sha1.trim()) request.sha1 = sha1.trim();
    if (version.trim()) request.version = version.trim();

    // Add initial node (no log - wait for actual results)
    addOrUpdateNode('init', 'active', 'Starting assessment...');

    // Connect to streaming API
    await connectToStreamingAPI(request);
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-500/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-200 text-sm">{error}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Section with Logo */}
      <div className="border-b border-cyan-500/20 bg-slate-900 shadow-lg shadow-cyan-500/10">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Main Input Row */}
          <div className="flex flex-col md:flex-row">
            {/* Left side - Logo */}
            <div className="w-full md:w-[65%] flex items-start gap-3 px-4 md:px-6 py-4 md:border-r border-cyan-500/20">
              <div className="flex items-center flex-shrink-0 mt-1">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/50">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            
              {/* Input Fields */}
              <div className="flex-1 space-y-3">
                {/* Product (Required) */}
                <div className="relative">
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="Product name (required) *"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-cyan-500/30 text-slate-100 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Vendor (optional)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Version (optional)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="URL (optional)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
              <input
                type="text"
                      value={sha1}
                      onChange={(e) => setSha1(e.target.value)}
                      placeholder="SHA1 hash (optional)"
                      className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={noCache}
                        onChange={(e) => setNoCache(e.target.checked)}
                        className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-700 rounded focus:ring-cyan-500"
                      />
                      Disable cache
                    </label>
                  </div>
                )}

                {/* Submit Button */}
              <button
                type="submit"
                  disabled={!product.trim() || isProcessing}
                  className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 text-sm font-medium"
              >
                  <Send className="w-4 h-4" />
                  {isProcessing ? 'Assessing...' : 'Start Assessment'}
              </button>
            </div>
          </div>
          
            {/* Right side - Status */}
          <div className="w-full md:w-[35%] px-4 md:px-6 py-3 md:py-4 flex items-center justify-center border-t md:border-t-0 border-cyan-500/20">
            {isProcessing && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="relative">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="text-xs text-cyan-400 uppercase tracking-wide">Processing</div>
                    <div className="text-sm text-slate-300">{nodes.length} / 4 phases</div>
                </div>
              </div>
            )}
              {!isProcessing && assessment && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="text-xs text-green-400 uppercase tracking-wide">Complete</div>
                    <div className="text-sm text-slate-300">Assessment ready</div>
                  </div>
                </div>
              )}
          </div>
          </div>
        </form>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Graph Canvas (65%) */}
        <div className="w-full md:w-[65%] h-1/2 md:h-full md:border-r border-b md:border-b-0 border-cyan-500/20 flex flex-col">
          <div className="px-4 md:px-6 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shadow-lg ${nodes.length > 0 ? 'bg-cyan-500 animate-pulse shadow-cyan-500/50' : 'bg-slate-500 shadow-slate-500/50'}`}></div>
              <h2 className="text-xs md:text-sm text-cyan-400 uppercase tracking-wide">
                {nodes.length > 0 ? 'Processing Pipeline' : 'Assessment Pipeline'}
              </h2>
            </div>
          </div>
          <div className="flex-1">
            <GraphCanvas nodes={nodes} edges={edges} onNodeMove={handleNodeMove} onCanvasPan={handleCanvasPan} />
          </div>
        </div>

        {/* Right Panel - Logs */}
        <div className="w-full md:w-[35%] h-1/2 md:h-full">
          <Citations isProcessing={isProcessing} logs={logs} />
        </div>
      </div>

      {/* Report View */}
      {showReport && assessment && (
        <ReportView
          assessment={assessment}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Report Button - Cool Floating Action Button (INSIDE main container) */}
      {/* Show button when either: assessment is complete OR all 4 phases are done */}
      {(assessment || nodes.filter(n => n.status === 'completed' && n.id.startsWith('phase')).length >= 4) && !showReport && (
        <div className="fixed bottom-8 right-8 z-[9999] group">
          <button
            onClick={() => setShowReport(true)}
            className="relative w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full shadow-[0_0_40px_rgba(6,182,212,0.8)] hover:shadow-[0_0_60px_rgba(6,182,212,1)] hover:scale-110 transition-all duration-300 flex items-center justify-center animate-pulse"
            aria-label="View Full Report"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            {/* Blinking outer ring */}
            <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-75 animate-ping"></div>
            
            {/* Icon */}
            <FileText className="relative z-10 w-12 h-12 text-white drop-shadow-2xl" />
            
            {/* Notification badge with pulse */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-base font-bold shadow-2xl border-4 border-slate-950 animate-bounce">
              <span className="relative z-10">1</span>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
            </div>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <div className="bg-slate-800 text-white text-sm font-bold px-5 py-3 rounded-lg shadow-2xl border-2 border-cyan-500/50">
              View Full Report
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
=======
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

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { ...p, progress: 25, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const, duration: 234 } : s) } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Analyzing input type...');
    }, 1000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { ...p, progress: 50, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'completed' as const } : i === 1 ? { ...s, status: 'active' as const } : s) } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Searching security databases...');
    }, 1500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { ...p, progress: 75, steps: p.steps.map((s, i) => i <= 1 ? { ...s, status: 'completed' as const, duration: 456 } : i === 2 ? { ...s, status: 'active' as const } : s) } : p
      ));
      addLog('phase_1', 'Entity Resolution', 'Resolving product details...');
    }, 2000);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_1' ? { ...p, progress: 100, status: 'completed' as const, steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 500) + 200 })) } : p
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
        p.id === 'phase_2' ? { ...p, progress: 50, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const } : s) } : p
      ));
      addLog('phase_2', 'Software Classification', 'Analyzing product characteristics...');
    }, 3500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_2' ? { ...p, progress: 100, status: 'completed' as const, steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 400) + 150 })) } : p
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
        p.id === 'phase_3' ? { ...p, progress: 30, steps: p.steps.map((s, i) => i === 1 ? { ...s, status: 'active' as const } : i === 0 ? { ...s, status: 'skipped' as const } : s) } : p
      ));
      addLog('phase_3', 'Security Data Gathering', 'Scanning vulnerability databases...');
    }, 5500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_3' ? { ...p, progress: 50, steps: p.steps.map((s, i) => i <= 1 ? (i === 0 ? { ...s, status: 'skipped' as const } : { ...s, status: 'completed' as const, duration: 890 }) : i === 2 ? { ...s, status: 'active' as const } : s) } : p
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
        p.id === 'phase_3' ? { ...p, progress: 100, status: 'completed' as const, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'skipped' as const } : { ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 700) + 250 }) } : p
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
        p.id === 'phase_4' ? { ...p, progress: 40, steps: p.steps.map((s, i) => i === 0 ? { ...s, status: 'active' as const } : s) } : p
      ));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Analyzing security posture...');
    }, 9500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_4' ? { ...p, progress: 70, steps: p.steps.map((s, i) => i <= 2 ? { ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 800) + 400 } : i === 3 ? { ...s, status: 'active' as const } : s) } : p
      ));
      addLog('phase_4', 'AI Analysis & Brief Generation', 'Compiling source citations...');
    }, 10500);

    setTimeout(() => {
      setPhases(prev => prev.map(p => 
        p.id === 'phase_4' ? { ...p, progress: 100, status: 'completed' as const, steps: p.steps.map(s => ({ ...s, status: 'completed' as const, duration: Math.floor(Math.random() * 900) + 500 })) } : p
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
                      ? 'border-slate-600 shadow-[0_0_15px_rgba(148,163,184,0.3)] animate-pulse-glow' 
                      : 'border-slate-700'
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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
