import { useState, useRef, useEffect } from 'react';
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
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
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

  // Set document title
  useEffect(() => {
    document.title = 'CISO Security Assessor';
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    const logsContainer = document.getElementById('logs-container');
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }, [logs]);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

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
                {nodes.length > 0
                  ? (nodes.filter(n => n.id.startsWith('phase') && n.status === 'completed').length >= 4
                      ? 'Processing Done'
                      : 'Processing Pipeline')
                  : 'Assessment Pipeline'}
              </h2>
            </div>
          </div>
          <div className="flex-1 relative">
            <GraphCanvas nodes={nodes} edges={edges} onNodeMove={handleNodeMove} onCanvasPan={handleCanvasPan} />

            {/* Report Button - positioned near the end of the node column */}
            {(assessment || nodes.filter(n => n.status === 'completed' && n.id.startsWith('phase')).length >= 4) && !showReport && (
              <div className="absolute bottom-6 right-8 z-[999] group">
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
    </div>
  );
}
