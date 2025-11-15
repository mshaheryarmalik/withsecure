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
    { name: 'Medium', count: 9, color: '#3B82F6' },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900">Security Assessment Report</h2>
              <p className="text-sm text-gray-600">{query}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-lg text-gray-900 mb-4">Executive Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Trust Score</div>
                <div className="text-4xl text-blue-700 mb-2">67</div>
                <div className="text-xs text-blue-600">Moderate Risk</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Critical CVEs</div>
                <div className="text-4xl text-red-700 mb-2">3</div>
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Immediate Action</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-700 mb-1">Compliance</div>
                <div className="text-4xl text-amber-700 mb-2">78%</div>
                <div className="text-xs text-amber-600">SOC 2 Coverage</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Patch Response</div>
                <div className="text-4xl text-green-700 mb-2">14d</div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Active Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Vulnerability Distribution */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="text-sm text-gray-700 mb-4">Vulnerability Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vulnerabilityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {vulnerabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Security Score Radar */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="text-sm text-gray-700 mb-4">Security Score Breakdown</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={securityScoreData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Vulnerability Trend */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="text-sm text-gray-700 mb-4">6-Month Vulnerability Trend</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vulnerabilities" stroke="#EF4444" strokeWidth={2} name="Vulnerabilities" />
                  <Line type="monotone" dataKey="patches" stroke="#10B981" strokeWidth={2} name="Patches Released" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance Pie */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h4 className="text-sm text-gray-700 mb-4">Compliance Status</h4>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Findings */}
          <div className="mb-6">
            <h3 className="text-lg text-gray-900 mb-4">Key Findings</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-red-900">Critical: CVE-2021-44228 (Log4Shell)</div>
                  <div className="text-xs text-red-700 mt-1">CVSS 10.0 - Remote Code Execution vulnerability. Immediate patching required.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                <TrendingDown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-amber-900">Compliance Gaps Identified</div>
                  <div className="text-xs text-amber-700 mt-1">Missing controls in incident response and vendor management areas.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-green-900">Active Vendor Support</div>
                  <div className="text-xs text-green-700 mt-1">Average patch response time of 14 days. Regular security updates maintained.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Recommendations</h3>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full flex-shrink-0 text-xs">1</span>
                  <span><strong>Immediate:</strong> Upgrade to version 2.17.1 or later to address critical vulnerabilities (CVE-2021-44228, CVE-2021-45046)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full flex-shrink-0 text-xs">2</span>
                  <span><strong>Short-term:</strong> Implement additional monitoring and detection rules for exploitation attempts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full flex-shrink-0 text-xs">3</span>
                  <span><strong>Medium-term:</strong> Review and address compliance gaps in incident response procedures</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full flex-shrink-0 text-xs">4</span>
                  <span><strong>Consider alternatives:</strong> Evaluate Logback or SLF4J Simple as potential replacements with better security profiles</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 px-6 py-3 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Generated on {new Date().toLocaleString()}</span>
            <span>CISO Security Assessor v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
