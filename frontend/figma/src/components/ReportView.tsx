import { Download, FileText, X, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportViewProps {
  query: string;
  onClose: () => void;
}

export function ReportView({ query, onClose }: ReportViewProps) {
  // Mock data for visualizations
  const vulnerabilityData = [
    { name: 'Critical', count: 3, color: '#EF4444' },
    { name: 'High', count: 8, color: '#F59E0B' },
    { name: 'Medium', count: 9, color: '#06B6D4' },
    { name: 'Low', count: 3, color: '#10B981' }
  ];

  const securityScoreData = [
    { category: 'Vulnerability Management', score: 65 },
    { category: 'Patch Response', score: 72 },
    { category: 'Compliance', score: 78 },
    { category: 'Vendor Trust', score: 80 },
    { category: 'Community Support', score: 85 },
    { category: 'Documentation', score: 90 }
  ];

  const trendData = [
    { month: 'Jan', vulnerabilities: 15, patches: 12 },
    { month: 'Feb', vulnerabilities: 18, patches: 16 },
    { month: 'Mar', vulnerabilities: 23, patches: 20 },
    { month: 'Apr', vulnerabilities: 20, patches: 22 },
    { month: 'May', vulnerabilities: 17, patches: 18 },
    { month: 'Jun', vulnerabilities: 23, patches: 19 }
  ];

  const complianceData = [
    { name: 'Met', value: 78, color: '#10B981' },
    { name: 'Gap', value: 22, color: '#EF4444' }
  ];

  const handleDownload = () => {
    // Create a simple HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Assessment Report - ${query}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #1F2937; }
            .metric { background: #F3F4F6; padding: 20px; margin: 10px 0; border-radius: 8px; }
            .critical { color: #EF4444; font-weight: bold; }
            .score { font-size: 48px; color: #3B82F6; }
          </style>
        </head>
        <body>
          <h1>Security Assessment Report</h1>
          <h2>Entity: ${query}</h2>
          <div class="metric">
            <h3>Overall Trust Score</h3>
            <div class="score">67/100</div>
          </div>
          <div class="metric">
            <h3>Vulnerabilities Found</h3>
            <p><span class="critical">Critical: 3</span> | High: 8 | Medium: 9 | Low: 3</p>
          </div>
          <div class="metric">
            <h3>Compliance Status</h3>
            <p>78% of SOC 2 requirements met</p>
          </div>
          <div class="metric">
            <h3>Recommendation</h3>
            <p>Update to latest version, implement additional monitoring, review compliance gaps.</p>
          </div>
          <p><small>Generated on ${new Date().toLocaleString()}</small></p>
        </body>
      </html>
    `;
    
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${query.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl text-cyan-300">Security Assessment Report</h2>
              <p className="text-sm text-slate-400">{query}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50 hover:border-cyan-500/30"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Executive Summary
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all">
                <div className="text-sm text-cyan-400 mb-1">Trust Score</div>
                <div className="text-4xl text-cyan-300 mb-2">67</div>
                <div className="text-xs text-slate-400">Moderate Risk</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-4 hover:border-red-500/40 transition-all">
                <div className="text-sm text-red-400 mb-1">Critical CVEs</div>
                <div className="text-4xl text-red-300 mb-2">3</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Immediate Action</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 rounded-lg p-4 hover:border-amber-500/40 transition-all">
                <div className="text-sm text-amber-400 mb-1">Compliance</div>
                <div className="text-4xl text-amber-300 mb-2">78%</div>
                <div className="text-xs text-slate-400">SOC 2 Coverage</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 hover:border-green-500/40 transition-all">
                <div className="text-sm text-green-400 mb-1">Patch Response</div>
                <div className="text-4xl text-green-300 mb-2">14d</div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Vulnerability Distribution */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Vulnerability Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vulnerabilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {vulnerabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Security Score Radar */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Security Score Breakdown
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={securityScoreData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#334155" />
                  <Radar name="Score" dataKey="score" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Vulnerability Trend */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                6-Month Vulnerability Trend
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="vulnerabilities" stroke="#EF4444" strokeWidth={2} name="Vulnerabilities" />
                  <Line type="monotone" dataKey="patches" stroke="#10B981" strokeWidth={2} name="Patches Released" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance Pie */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Compliance Status
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Findings */}
          <div className="mb-6">
            <h3 className="text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Key Findings
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-950/30 backdrop-blur-sm border-l-4 border-red-500 rounded-lg hover:bg-red-950/50 transition-all">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-red-300">Critical: CVE-2021-44228 (Log4Shell)</div>
                  <div className="text-xs text-slate-400 mt-1">CVSS 10.0 - Remote Code Execution vulnerability. Immediate patching required.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-950/30 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg hover:bg-amber-950/50 transition-all">
                <TrendingDown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-amber-300">Compliance Gaps Identified</div>
                  <div className="text-xs text-slate-400 mt-1">Missing controls in incident response and vendor management areas.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-950/30 backdrop-blur-sm border-l-4 border-green-500 rounded-lg hover:bg-green-950/50 transition-all">
                <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-green-300">Active Vendor Support</div>
                  <div className="text-xs text-slate-400 mt-1">Average patch response time of 14 days. Regular security updates maintained.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Recommendations
            </h3>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-6">
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex-shrink-0 text-xs shadow-lg shadow-cyan-500/50">1</span>
                  <span><strong className="text-cyan-400">Immediate:</strong> Upgrade to version 2.17.1 or later to address critical vulnerabilities (CVE-2021-44228, CVE-2021-45046)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex-shrink-0 text-xs shadow-lg shadow-cyan-500/50">2</span>
                  <span><strong className="text-cyan-400">Short-term:</strong> Implement additional monitoring and detection rules for exploitation attempts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex-shrink-0 text-xs shadow-lg shadow-cyan-500/50">3</span>
                  <span><strong className="text-cyan-400">Medium-term:</strong> Review and address compliance gaps in incident response procedures</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex-shrink-0 text-xs shadow-lg shadow-cyan-500/50">4</span>
                  <span><strong className="text-cyan-400">Consider alternatives:</strong> Evaluate Logback or SLF4J Simple as potential replacements with better security profiles</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 px-6 py-3 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Generated on {new Date().toLocaleString()}</span>
            <span className="text-cyan-400">CISO Security Assessor v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}