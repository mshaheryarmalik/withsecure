import { Download, FileText, X, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Shield, ChevronDown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { downloadHTMLReport } from '../utils/reportExport';
import { downloadConsultantPDF } from '../utils/reportExportPDF';

interface ReportViewProps {
  query: string;
  onClose: () => void;
}

export function ReportView({ query, onClose }: ReportViewProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

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

  const handleDownload = (format: 'html' | 'pdf') => {
    const reportData = {
      query,
      trustScore: 67,
      criticalCVEs: 3,
      compliance: 78,
      patchResponse: '14d',
      vulnerabilityData,
      securityScoreData,
      generatedDate: new Date().toLocaleString()
    };

    setShowDownloadMenu(false);
    
    if (format === 'html') {
      downloadHTMLReport(reportData);
    } else if (format === 'pdf') {
      downloadConsultantPDF(reportData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg border border-slate-500 shadow-lg shadow-slate-700/50">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl text-[rgb(255,255,255)]">Security Assessment Report</h2>
              <p className="text-xs md:text-sm text-slate-400 font-[Inter]">{query}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto relative">
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-2 px-4 md:px-5 py-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-100 rounded-full hover:from-slate-600 hover:via-slate-500 hover:to-slate-600 transition-all shadow-lg shadow-slate-700/30 border border-slate-600 hover:border-slate-500 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Download</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDownloadMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDownloadMenu(false)}
                  ></div>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl shadow-slate-900/50 z-50 overflow-hidden min-w-[200px]">
                    <button
                      onClick={() => handleDownload('html')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-mono border-b border-slate-700/50"
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <div className="text-left">
                        <div className="text-sm text-slate-200">HTML Report</div>
                        <div className="text-xs text-slate-500">Standalone web page</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-mono"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                      <div className="text-left">
                        <div className="text-sm text-slate-200">PDF Report</div>
                        <div className="text-xs text-slate-500">Print-ready format</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50 hover:border-cyan-500/30"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-[rgb(206,206,206)] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-3 md:p-4 hover:border-cyan-500/40 transition-all">
                <div className="text-xs md:text-sm text-cyan-400 mb-1">Trust Score</div>
                <div className="text-3xl md:text-4xl text-cyan-300 mb-2">67</div>
                <div className="text-xs text-slate-400 font-[Inter]">Moderate Risk</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-3 md:p-4 hover:border-red-500/40 transition-all">
                <div className="text-xs md:text-sm text-red-400 mb-1">Critical CVEs</div>
                <div className="text-3xl md:text-4xl text-red-300 mb-2">3</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Immediate Action</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 rounded-lg p-3 md:p-4 hover:border-amber-500/40 transition-all">
                <div className="text-xs md:text-sm text-amber-400 mb-1">Compliance</div>
                <div className="text-3xl md:text-4xl text-amber-300 mb-2">78%</div>
                <div className="text-xs text-slate-400">SOC 2 Coverage</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 md:p-4 hover:border-green-500/40 transition-all">
                <div className="text-xs md:text-sm text-green-400 mb-1">Patch Response</div>
                <div className="text-3xl md:text-4xl text-green-300 mb-2">14d</div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Vulnerability Distribution */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Vulnerability Distribution
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vulnerabilityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Security Score Breakdown
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={securityScoreData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: '#94a3b8' }} />
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                6-Month Vulnerability Trend
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="vulnerabilities" stroke="#EF4444" strokeWidth={2} name="Vulnerabilities" />
                  <Line type="monotone" dataKey="patches" stroke="#10B981" strokeWidth={2} name="Patches Released" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance Pie */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-300 mb-4 flex items-center gap-2">
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
            <h3 className="text-base md:text-lg text-[rgb(255,255,255)] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Key Findings
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 md:p-4 bg-red-950/30 backdrop-blur-sm border-l-4 border-red-500 rounded-lg hover:bg-red-950/50 transition-all">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs md:text-sm text-red-300">Critical: CVE-2021-44228 (Log4Shell)</div>
                  <div className="text-xs text-slate-400 mt-1">CVSS 10.0 - Remote Code Execution vulnerability. Immediate patching required.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 md:p-4 bg-amber-950/30 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg hover:bg-amber-950/50 transition-all">
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs md:text-sm text-amber-300">Compliance Gaps Identified</div>
                  <div className="text-xs text-slate-400 mt-1">Missing controls in incident response and vendor management areas.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 md:p-4 bg-green-950/30 backdrop-blur-sm border-l-4 border-green-500 rounded-lg hover:bg-green-950/50 transition-all">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs md:text-sm text-green-300">Active Vendor Support</div>
                  <div className="text-xs text-slate-400 mt-1">Average patch response time of 14 days. Regular security updates maintained.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Recommendations
            </h3>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 md:p-6">
              <ol className="space-y-3 text-xs md:text-sm text-slate-300">
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
        <div className="border-t border-cyan-500/20 px-4 md:px-6 py-3 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Generated on {new Date().toLocaleString()}</span>
            <span className="text-cyan-400">CISO Security Assessor v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}