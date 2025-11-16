import { useState, useRef, useEffect } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { Citations } from './components/Citations';
import { ReportView } from './components/ReportView';
import { Send, Shield, FileText } from 'lucide-react';

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
  status: 'active' | 'completed' | 'error' | 'info';
}

interface ResearchSection {
  id: string;
  title: string;
  content: string;
  sources?: number[];
}

interface Source {
  id: string;
  title: string;
  url: string;
  snippet: string;
}

export default function App() {
  const [input, setInput] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const [showReport, setShowReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNodeMove = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    );
  };

  const handleCanvasPan = (deltaX: number, deltaY: number) => {
    // Convert pixel delta to percentage delta
    // This would pan all nodes together
    console.log('Canvas panned:', deltaX, deltaY);
  };

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

    // Simulate processing with nodes appearing over time
    simulateProcessing(query);
  };

  const simulateProcessing = (query: string) => {
    // Clear previous state
    setNodes([]);
    setEdges([]);
    setLogs([]);
    setIsProcessing(true);

    // Sequential flow: strictly horizontal, evenly spaced
    // Each node at y=50% (center), x increases by fixed amount
    const NODE_SPACING = 20; // 20% spacing between nodes
    const START_X = 15; // Start at 15%

    // Step 1: Initialize node
    setTimeout(() => {
      setNodes([{
        id: 'init',
        label: 'Initialize Assessment',
        status: 'active',
        wittyRemark: '🚀 Starting engines...',
        details: 'Initializing MCP and security databases',
        position: { x: START_X, y: 50 }
      }]);
      
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'init',
        nodeLabel: 'Initialize Assessment',
        message: 'Initializing MCP and security databases',
        status: 'info'
      }]);
    }, 500);

    // Step 2: Complete init, add entity search
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'active',
          wittyRemark: '🔍 Hunting for targets...',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'entity',
        nodeLabel: 'Entity Search',
        message: 'Searching databases for matching entities',
        status: 'info'
      }]);
    }, 2000);

    // Step 3: Complete entity, add CVE search
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'completed',
          wittyRemark: '🎯 Entity identified!',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        },
        {
          id: 'cve-search',
          label: 'CVE Database Search',
          status: 'active',
          wittyRemark: '🐛 Hunting vulnerabilities...',
          details: 'Querying National Vulnerability Database',
          position: { x: START_X + NODE_SPACING * 2, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' },
        { from: 'entity', to: 'cve-search' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'cve-search',
        nodeLabel: 'CVE Database Search',
        message: 'Querying National Vulnerability Database',
        status: 'info'
      }]);
    }, 4000);

    // Step 4: Complete CVE, add compliance check
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'completed',
          wittyRemark: '🎯 Entity identified!',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        },
        {
          id: 'cve-search',
          label: 'CVE Database Search',
          status: 'completed',
          wittyRemark: '✨ Found 23 CVEs!',
          details: 'Querying National Vulnerability Database',
          position: { x: START_X + NODE_SPACING * 2, y: 50 }
        },
        {
          id: 'compliance-search',
          label: 'Compliance Check',
          status: 'active',
          wittyRemark: '📋 Checking regulations...',
          details: 'Analyzing compliance frameworks',
          position: { x: START_X + NODE_SPACING * 3, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' },
        { from: 'entity', to: 'cve-search' },
        { from: 'cve-search', to: 'compliance-search' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'cve-search',
        nodeLabel: 'CVE Database Search',
        message: 'Found 23 CVEs in Apache Log4j version 2.14',
        status: 'completed'
      }]);
    }, 6000);

    // Step 5: Add compliance log
    setTimeout(() => {
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'compliance-search',
        nodeLabel: 'Compliance Check',
        message: 'Analyzing compliance frameworks',
        status: 'info'
      }]);
    }, 6500);

    // Step 6: Complete compliance, add vendor analysis
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'completed',
          wittyRemark: '🎯 Entity identified!',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        },
        {
          id: 'cve-search',
          label: 'CVE Database Search',
          status: 'completed',
          wittyRemark: '✨ Found 23 CVEs!',
          details: 'Querying National Vulnerability Database',
          position: { x: START_X + NODE_SPACING * 2, y: 50 }
        },
        {
          id: 'compliance-search',
          label: 'Compliance Check',
          status: 'completed',
          wittyRemark: '⚠️ Some gaps found!',
          details: 'Analyzing compliance frameworks',
          position: { x: START_X + NODE_SPACING * 3, y: 50 }
        },
        {
          id: 'vendor-search',
          label: 'Vendor Analysis',
          status: 'active',
          wittyRemark: '🕵️ Investigating vendor...',
          details: 'Analyzing vendor reputation and response',
          position: { x: START_X + NODE_SPACING * 4, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' },
        { from: 'entity', to: 'cve-search' },
        { from: 'cve-search', to: 'compliance-search' },
        { from: 'compliance-search', to: 'vendor-search' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'compliance-search',
        nodeLabel: 'Compliance Check',
        message: 'Compliance analysis completed - some gaps identified',
        status: 'completed'
      }]);
    }, 8000);

    // Step 7: Add vendor activity log
    setTimeout(() => {
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'vendor-search',
        nodeLabel: 'Vendor Analysis',
        message: 'Analyzing vendor reputation and response',
        status: 'info'
      }]);
    }, 8500);

    // Step 8: Complete vendor, add synthesis
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'completed',
          wittyRemark: '🎯 Entity identified!',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        },
        {
          id: 'cve-search',
          label: 'CVE Database Search',
          status: 'completed',
          wittyRemark: '✨ Found 23 CVEs!',
          details: 'Querying National Vulnerability Database',
          position: { x: START_X + NODE_SPACING * 2, y: 50 }
        },
        {
          id: 'compliance-search',
          label: 'Compliance Check',
          status: 'completed',
          wittyRemark: '⚠️ Some gaps found!',
          details: 'Analyzing compliance frameworks',
          position: { x: START_X + NODE_SPACING * 3, y: 50 }
        },
        {
          id: 'vendor-search',
          label: 'Vendor Analysis',
          status: 'completed',
          wittyRemark: '✅ Vendor profile ready!',
          details: 'Analyzing vendor reputation and response',
          position: { x: START_X + NODE_SPACING * 4, y: 50 }
        },
        {
          id: 'synthesis',
          label: 'Final Synthesis',
          status: 'active',
          wittyRemark: '🧠 Connecting the dots...',
          details: 'Synthesizing all research findings',
          position: { x: START_X + NODE_SPACING * 5, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' },
        { from: 'entity', to: 'cve-search' },
        { from: 'cve-search', to: 'compliance-search' },
        { from: 'compliance-search', to: 'vendor-search' },
        { from: 'vendor-search', to: 'synthesis' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'vendor-search',
        nodeLabel: 'Vendor Analysis',
        message: 'Vendor profile ready',
        status: 'completed'
      }]);
    }, 10000);

    // Step 9: Add synthesis log
    setTimeout(() => {
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'synthesis',
        nodeLabel: 'Final Synthesis',
        message: 'Synthesizing all research findings',
        status: 'info'
      }]);
    }, 10500);

    // Step 10: Complete synthesis and generate report
    setTimeout(() => {
      setNodes([
        {
          id: 'init',
          label: 'Initialize Assessment',
          status: 'completed',
          wittyRemark: '✅ Ready to roll!',
          details: 'Initializing MCP and security databases',
          position: { x: START_X, y: 50 }
        },
        {
          id: 'entity',
          label: 'Entity Search',
          status: 'completed',
          wittyRemark: '🎯 Entity identified!',
          details: 'Searching databases for matching entities',
          position: { x: START_X + NODE_SPACING, y: 50 }
        },
        {
          id: 'cve-search',
          label: 'CVE Database Search',
          status: 'completed',
          wittyRemark: '✨ Found 23 CVEs!',
          details: 'Querying National Vulnerability Database',
          position: { x: START_X + NODE_SPACING * 2, y: 50 }
        },
        {
          id: 'compliance-search',
          label: 'Compliance Check',
          status: 'completed',
          wittyRemark: '⚠️ Some gaps found!',
          details: 'Analyzing compliance frameworks',
          position: { x: START_X + NODE_SPACING * 3, y: 50 }
        },
        {
          id: 'vendor-search',
          label: 'Vendor Analysis',
          status: 'completed',
          wittyRemark: '✅ Vendor profile ready!',
          details: 'Analyzing vendor reputation and response',
          position: { x: START_X + NODE_SPACING * 4, y: 50 }
        },
        {
          id: 'synthesis',
          label: 'Final Synthesis',
          status: 'completed',
          wittyRemark: '🎉 Analysis complete!',
          details: 'Synthesizing all research findings',
          position: { x: START_X + NODE_SPACING * 5, y: 50 }
        },
        {
          id: 'report',
          label: 'Generate Report',
          status: 'completed',
          wittyRemark: '📄 Report ready!',
          details: 'Comprehensive security report generated',
          position: { x: START_X + NODE_SPACING * 6, y: 50 }
        }
      ]);
      
      setEdges([
        { from: 'init', to: 'entity' },
        { from: 'entity', to: 'cve-search' },
        { from: 'cve-search', to: 'compliance-search' },
        { from: 'compliance-search', to: 'vendor-search' },
        { from: 'vendor-search', to: 'synthesis' },
        { from: 'synthesis', to: 'report' }
      ]);

      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'synthesis',
        nodeLabel: 'Final Synthesis',
        message: 'Analysis synthesis completed',
        status: 'completed'
      }]);

      setReportReady(true);
      setIsProcessing(false);
    }, 12000);

    // Step 10b: Add final report log
    setTimeout(() => {
      setLogs(prev => [...prev, {
        id: `log-${++logIdCounter.current}`,
        timestamp: getTimestamp(),
        nodeId: 'report',
        nodeLabel: 'Generate Report',
        message: 'Comprehensive security report generated',
        status: 'completed'
      }]);
    }, 13000);
  };

  const openReportInNewWindow = () => {
    // Create HTML content for the report
    const reportHTML = generateReportHTML();
    
    // Open new window
    const newWindow = window.open('', '_blank', 'width=1400,height=900');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
    }
  };

  const generateReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Assessment Report - ${currentQuery}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; }
            .header p { font-size: 18px; opacity: 0.9; }
            .content { padding: 40px; }
            .metrics {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .metric-card {
              padding: 24px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .metric-card.blue { background: linear-gradient(135deg, #e0f2fe, #bfdbfe); border: 2px solid #3b82f6; }
            .metric-card.red { background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; }
            .metric-card.yellow { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; }
            .metric-card.green { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 2px solid #10b981; }
            .metric-label { font-size: 14px; color: #374151; margin-bottom: 8px; }
            .metric-value { font-size: 48px; font-weight: bold; margin-bottom: 8px; }
            .metric-subtitle { font-size: 12px; color: #6b7280; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 24px; color: #1f2937; margin-bottom: 20px; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            .finding {
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 16px;
              border-left: 4px solid;
            }
            .finding.critical { background: #fee2e2; border-color: #ef4444; }
            .finding.warning { background: #fef3c7; border-color: #f59e0b; }
            .finding.success { background: #d1fae5; border-color: #10b981; }
            .finding-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
            .finding-desc { font-size: 14px; color: #4b5563; }
            .recommendations {
              background: linear-gradient(135deg, #ede9fe, #ddd6fe);
              border: 2px solid #8b5cf6;
              border-radius: 16px;
              padding: 30px;
            }
            .recommendation {
              display: flex;
              gap: 16px;
              margin-bottom: 20px;
              align-items: start;
            }
            .rec-number {
              width: 32px;
              height: 32px;
              background: #8b5cf6;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              flex-shrink: 0;
            }
            .rec-text { color: #374151; font-size: 15px; line-height: 1.6; }
            .footer {
              background: #f9fafb;
              padding: 20px 40px;
              border-top: 2px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Security Assessment Report</h1>
              <p>${currentQuery}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2 class="section-title">Executive Summary</h2>
                <div class="metrics">
                  <div class="metric-card blue">
                    <div class="metric-label">Trust Score</div>
                    <div class="metric-value" style="color: #3b82f6;">67</div>
                    <div class="metric-subtitle">Moderate Risk</div>
                  </div>
                  <div class="metric-card red">
                    <div class="metric-label">Critical CVEs</div>
                    <div class="metric-value" style="color: #ef4444;">3</div>
                    <div class="metric-subtitle">⚠️ Immediate Action</div>
                  </div>
                  <div class="metric-card yellow">
                    <div class="metric-label">Compliance</div>
                    <div class="metric-value" style="color: #f59e0b;">78%</div>
                    <div class="metric-subtitle">SOC 2 Coverage</div>
                  </div>
                  <div class="metric-card green">
                    <div class="metric-label">Patch Response</div>
                    <div class="metric-value" style="color: #10b981;">14d</div>
                    <div class="metric-subtitle">✓ Active Support</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2 class="section-title">Key Findings</h2>
                <div class="finding critical">
                  <div class="finding-title" style="color: #991b1b;">⚠️ Critical: CVE-2021-44228 (Log4Shell)</div>
                  <div class="finding-desc">CVSS 10.0 - Remote Code Execution vulnerability. Immediate patching required.</div>
                </div>
                <div class="finding warning">
                  <div class="finding-title" style="color: #92400e;">📊 Compliance Gaps Identified</div>
                  <div class="finding-desc">Missing controls in incident response and vendor management areas.</div>
                </div>
                <div class="finding success">
                  <div class="finding-title" style="color: #065f46;">📈 Active Vendor Support</div>
                  <div class="finding-desc">Average patch response time of 14 days. Regular security updates maintained.</div>
                </div>
              </div>

              <div class="section">
                <h2 class="section-title">Vulnerability Breakdown</h2>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                  <div style="text-align: center; padding: 20px; background: #fee2e2; border-radius: 12px;">
                    <div style="font-size: 36px; color: #ef4444; font-weight: bold;">3</div>
                    <div style="font-size: 14px; color: #991b1b;">Critical</div>
                  </div>
                  <div style="text-align: center; padding: 20px; background: #fef3c7; border-radius: 12px;">
                    <div style="font-size: 36px; color: #f59e0b; font-weight: bold;">8</div>
                    <div style="font-size: 14px; color: #92400e;">High</div>
                  </div>
                  <div style="text-align: center; padding: 20px; background: #dbeafe; border-radius: 12px;">
                    <div style="font-size: 36px; color: #3b82f6; font-weight: bold;">9</div>
                    <div style="font-size: 14px; color: #1e40af;">Medium</div>
                  </div>
                  <div style="text-align: center; padding: 20px; background: #d1fae5; border-radius: 12px;">
                    <div style="font-size: 36px; color: #10b981; font-weight: bold;">3</div>
                    <div style="font-size: 14px; color: #065f46;">Low</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2 class="section-title">Recommendations</h2>
                <div class="recommendations">
                  <div class="recommendation">
                    <div class="rec-number">1</div>
                    <div class="rec-text"><strong>Immediate:</strong> Upgrade to version 2.17.1 or later to address critical vulnerabilities (CVE-2021-44228, CVE-2021-45046)</div>
                  </div>
                  <div class="recommendation">
                    <div class="rec-number">2</div>
                    <div class="rec-text"><strong>Short-term:</strong> Implement additional monitoring and detection rules for exploitation attempts</div>
                  </div>
                  <div class="recommendation">
                    <div class="rec-number">3</div>
                    <div class="rec-text"><strong>Medium-term:</strong> Review and address compliance gaps in incident response procedures</div>
                  </div>
                  <div class="recommendation">
                    <div class="rec-number">4</div>
                    <div class="rec-text"><strong>Consider alternatives:</strong> Evaluate Logback or SLF4J Simple as potential replacements with better security profiles</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <span>Generated on ${new Date().toLocaleString()}</span>
              <span>CISO Security Assessor v1.0</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Input Section with Logo - Aligned with split panels below */}
      <div className="border-b border-cyan-500/20 bg-slate-900 shadow-lg shadow-cyan-500/10">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
          {/* Left side - matches 65% pipeline panel */}
          <div className="w-full md:w-[65%] flex items-center gap-3 px-4 md:px-6 py-4 md:border-r border-cyan-500/20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/50">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            
            {/* Input with inline button */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter product name or vendor to assess (e.g., 'Apache Log4j 2.14' or 'Okta')"
                className="w-full px-4 py-3 pr-16 bg-slate-800 border border-cyan-500/30 text-slate-100 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm md:text-base"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-md hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          
          {/* Right side - Real-time Processing Status */}
          <div className="w-full md:w-[35%] px-4 md:px-6 py-3 md:py-4 flex items-center justify-center border-t md:border-t-0 border-cyan-500/20">
            {isProcessing && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="relative">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="text-xs text-cyan-400 uppercase tracking-wide">Processing</div>
                  <div className="text-sm text-slate-300">{nodes.length} / 7 stages</div>
                </div>
              </div>
            )}
            {!isProcessing && nodes.length > 0 && (
              <div className="flex items-center gap-3 animate-fadeIn">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="text-xs text-green-400 uppercase tracking-wide">Complete</div>
                  <div className="text-sm text-slate-300">All stages finished</div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Graph Canvas (65%) */}
        <div className="w-full md:w-[65%] h-1/2 md:h-full md:border-r border-b md:border-b-0 border-cyan-500/20 flex flex-col">
          {/* Left Panel Header */}
          <div className="px-4 md:px-6 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
              <h2 className="text-xs md:text-sm text-cyan-400 uppercase tracking-wide">Processing Pipeline</h2>
            </div>
          </div>
          {/* Canvas Area */}
          <div className="flex-1">
            <GraphCanvas nodes={nodes} edges={edges} onNodeMove={handleNodeMove} onCanvasPan={handleCanvasPan} />
          </div>
        </div>

        {/* Right Panel - Perplexity-style Research (35%) */}
        <div className="w-full md:w-[35%] h-1/2 md:h-full">
          <Citations isProcessing={isProcessing} logs={logs} />
        </div>
      </div>

      {/* Enhanced Report Button */}
      {reportReady && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setShowReport(true)}
            className="group relative px-6 py-3 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl hover:shadow-slate-700/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
          >
            {/* Silver gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-50"></div>
            
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-lg blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
            
            <div className="relative flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg group-hover:from-slate-300 group-hover:to-slate-500 transition-all duration-300">
                <FileText className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="text-xs bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent group-hover:from-slate-300 group-hover:to-slate-400 transition-all duration-300">Assessment Complete</div>
                <div className="text-sm bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300 font-mono">View Full Report</div>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
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
  );
}