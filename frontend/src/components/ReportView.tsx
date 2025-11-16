import { Download, FileText, X, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CISOBrief } from '../types/api';
import { calculateSecurityDimensions, calculateVulnerabilityDistribution } from '../utils/chartCalculations';

interface ReportViewProps {
  query: string;
  assessment: CISOBrief;
  onClose: () => void;
}

export function ReportView({ query, assessment, onClose }: ReportViewProps) {
  // Calculate real data from assessment
  const vulnerabilityData = calculateVulnerabilityDistribution(assessment);
  const securityDimensions = calculateSecurityDimensions(assessment);
  
  // Convert to chart format
  const securityScoreData = [
    { category: 'Vendor Trust', score: securityDimensions.vendorTrust },
    { category: 'Compliance', score: securityDimensions.compliance },
    { category: 'CVE Response', score: securityDimensions.cveResponse },
    { category: 'Incidents', score: securityDimensions.incidents },
    { category: 'Data Handling', score: securityDimensions.dataHandling },
  ];

  // Compliance data calculated from assessment
  const complianceScore = securityDimensions.compliance;
  const complianceData = [
    { name: 'Met', value: complianceScore, color: '#10B981' },
    { name: 'Gap', value: 100 - complianceScore, color: '#EF4444' }
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg border border-slate-400 shadow-lg shadow-slate-600/50">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl text-white">Security Assessment Report</h2>
              <p className="text-xs md:text-sm text-slate-200 font-[Inter]">{query}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 md:px-5 py-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-100 rounded-full hover:from-slate-600 hover:via-slate-500 hover:to-slate-600 transition-all shadow-lg shadow-slate-700/30 border border-slate-600 hover:border-slate-500 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600/50 hover:border-cyan-500/30"
            >
              <X className="w-5 h-5 text-slate-200 hover:text-cyan-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-3 md:p-4 hover:border-cyan-500/40 transition-all">
                <div className="text-xs md:text-sm text-cyan-400 mb-1">Trust Score</div>
                <div className="text-3xl md:text-4xl text-cyan-300 mb-2">{assessment.trust_score}</div>
                <div className="text-xs text-slate-200 font-[Inter]">
                  {assessment.trust_score >= 70 ? 'Low Risk' : assessment.trust_score >= 40 ? 'Moderate Risk' : 'High Risk'}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-3 md:p-4 hover:border-red-500/40 transition-all">
                <div className="text-xs md:text-sm text-red-400 mb-1">Risk Score</div>
                <div className="text-3xl md:text-4xl text-red-300 mb-2">{assessment.risk_score}</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{assessment.risk_score >= 70 ? 'High Risk' : assessment.risk_score >= 40 ? 'Moderate Risk' : 'Low Risk'}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 rounded-lg p-3 md:p-4 hover:border-amber-500/40 transition-all">
                <div className="text-xs md:text-sm text-amber-400 mb-1">Critical CVEs</div>
                <div className="text-3xl md:text-4xl text-amber-300 mb-2">{assessment.cve_summary.critical_count}</div>
                <div className="text-xs text-slate-200">CISA KEV: {assessment.cve_summary.cisa_kev_count}</div>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 md:p-4 hover:border-green-500/40 transition-all">
                <div className="text-xs md:text-sm text-green-400 mb-1">Confidence</div>
                <div className="text-3xl md:text-4xl text-green-300 mb-2 capitalize">{assessment.confidence}</div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>{assessment.cve_summary.total_cves} Total CVEs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Vulnerability Distribution */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-100 mb-4 flex items-center gap-2">
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
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Security Score Radar */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-100 mb-4 flex items-center gap-2">
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

            {/* Entity Information */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Entity Information
              </h4>
              <div className="space-y-2 text-xs text-slate-100">
                <div><strong className="text-cyan-400">Product:</strong> {assessment.entity.product_name}</div>
                <div><strong className="text-cyan-400">Vendor:</strong> {assessment.entity.vendor_name}</div>
                {assessment.entity.website && <div><strong className="text-cyan-400">Website:</strong> <a href={assessment.entity.website} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">{assessment.entity.website}</a></div>}
                <div><strong className="text-cyan-400">Category:</strong> {assessment.taxonomy.primary_category}</div>
                {assessment.taxonomy.secondary_categories.length > 0 && (
                  <div><strong className="text-cyan-400">Secondary:</strong> {assessment.taxonomy.secondary_categories.join(', ')}</div>
                )}
              </div>
            </div>

            {/* Compliance Pie */}
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-100 mb-4 flex items-center gap-2">
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
              {assessment.cve_summary.recent_cves.slice(0, 3).map((cve, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 md:p-4 bg-red-950/30 backdrop-blur-sm border-l-4 border-red-500 rounded-lg hover:bg-red-950/50 transition-all">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs md:text-sm text-red-300">
                      {cve.severity}: {cve.cve_id} {cve.in_cisa_kev && '(CISA KEV)'}
                    </div>
                    <div className="text-xs text-slate-200 mt-1">
                      {cve.description || 'No description available'}
                      {cve.cvss_score && ` (CVSS: ${cve.cvss_score})`}
                    </div>
                  </div>
                </div>
              ))}
              {assessment.incidents.breach_count > 0 && (
                <div className="flex items-start gap-3 p-3 md:p-4 bg-amber-950/30 backdrop-blur-sm border-l-4 border-amber-500 rounded-lg hover:bg-amber-950/50 transition-all">
                  <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs md:text-sm text-amber-300">Security Incidents Detected</div>
                    <div className="text-xs text-slate-200 mt-1">{assessment.incidents.breach_count} breach(es) found in security databases.</div>
                  </div>
                </div>
              )}
              {assessment.vendor_reputation.security_page_found && (
                <div className="flex items-start gap-3 p-3 md:p-4 bg-green-950/30 backdrop-blur-sm border-l-4 border-green-500 rounded-lg hover:bg-green-950/50 transition-all">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs md:text-sm text-green-300">Vendor Security Transparency</div>
                    <div className="text-xs text-slate-200 mt-1">Security page found. {assessment.vendor_reputation.security_advisories_found} advisory/advisories published.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Overview */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Product Overview
            </h3>
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 md:p-6">
              <div className="space-y-3 text-xs md:text-sm text-slate-100">
                <div>
                  <strong className="text-cyan-400">Category:</strong> {assessment.taxonomy.primary_category}
                </div>
                <div>
                  <strong className="text-cyan-400">Description:</strong> {assessment.description}
                </div>
                <div>
                  <strong className="text-cyan-400">Usage:</strong> {assessment.usage}
                </div>
                {assessment.taxonomy.secondary_categories.length > 0 && (
                  <div>
                    <strong className="text-cyan-400">Secondary Categories:</strong> {assessment.taxonomy.secondary_categories.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Posture Details */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Security Posture
            </h3>
            <div className="space-y-4">
              {/* CVE Summary */}
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <h4 className="text-sm text-cyan-400 mb-3">CVE Summary ({assessment.cve_summary.source_label})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-slate-200">Total CVEs</div>
                    <div className="text-slate-100 font-semibold">{assessment.cve_summary.total_cves}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">Critical</div>
                    <div className="text-red-300 font-semibold">{assessment.cve_summary.critical_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">High</div>
                    <div className="text-orange-300 font-semibold">{assessment.cve_summary.high_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">Medium</div>
                    <div className="text-yellow-300 font-semibold">{assessment.cve_summary.medium_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">Low</div>
                    <div className="text-green-300 font-semibold">{assessment.cve_summary.low_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">CISA KEV</div>
                    <div className="text-red-300 font-semibold">{assessment.cve_summary.cisa_kev_count}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-200">Trend</div>
                    <div className="text-slate-100 font-semibold capitalize">{assessment.cve_summary.trend}</div>
                  </div>
                </div>
                {assessment.cve_summary.citation && (
                  <div className="mt-3 text-xs text-slate-300 italic">{assessment.cve_summary.citation}</div>
                )}
              </div>

              {/* Incidents */}
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <h4 className="text-sm text-cyan-400 mb-3">Incidents ({assessment.incidents.source_label})</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-200">Data Breaches</div>
                    <div className="text-slate-100 font-semibold">{assessment.incidents.breach_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-200">Total Incidents</div>
                    <div className="text-slate-100 font-semibold">{assessment.incidents.incidents.length}</div>
                  </div>
                </div>
                {assessment.incidents.incidents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {assessment.incidents.incidents.map((incident, idx) => (
                      <div key={idx} className="text-xs text-slate-100 border-l-2 border-amber-500/50 pl-2">
                        <div className="font-semibold">{incident.incident_type} - {incident.severity}</div>
                        {incident.incident_date && <div className="text-slate-200">{incident.incident_date}</div>}
                        <div className="text-slate-200 mt-1">{incident.description}</div>
                        {incident.source_url && (
                          <a href={incident.source_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-[10px]">
                            Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compliance */}
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <h4 className="text-sm text-cyan-400 mb-3">Compliance</h4>
                <div className="space-y-2 text-xs text-slate-100">
                  <div>
                    <strong className="text-cyan-400">SOC2:</strong> {assessment.compliance.soc2_status}
                  </div>
                  <div>
                    <strong className="text-cyan-400">GDPR:</strong> {assessment.compliance.gdpr_compliant ? 'Yes' : 'No'}
                  </div>
                  {assessment.compliance.ccpa_compliant !== undefined && (
                    <div>
                      <strong className="text-cyan-400">CCPA:</strong> {assessment.compliance.ccpa_compliant ? 'Yes' : 'No'}
                    </div>
                  )}
                  {assessment.compliance.hipaa_compliant !== undefined && (
                    <div>
                      <strong className="text-cyan-400">HIPAA:</strong> {assessment.compliance.hipaa_compliant ? 'Yes' : 'No'}
                    </div>
                  )}
                  {assessment.compliance.iso_certifications.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-cyan-400">ISO Certifications:</strong>
                      <ul className="mt-1 space-y-1 ml-4">
                        {assessment.compliance.iso_certifications.map((iso, idx) => (
                          <li key={idx} className="text-slate-200">
                            {iso.certification_type} - {iso.status}
                            {iso.date_issued && ` (Issued: ${iso.date_issued})`}
                            {iso.expiry_date && ` (Expires: ${iso.expiry_date})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Handling */}
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <h4 className="text-sm text-cyan-400 mb-3">Data Handling ({assessment.data_handling.source_label})</h4>
                <div className="space-y-2 text-xs text-slate-100">
                  <div>
                    <strong className="text-cyan-400">Encryption:</strong> {assessment.data_handling.encryption_claimed ? 'Stated' : 'Not stated'}
                    {assessment.data_handling.encryption_details && (
                      <div className="text-slate-200 ml-4 mt-1">{assessment.data_handling.encryption_details}</div>
                    )}
                  </div>
                  {assessment.data_handling.data_retention && (
                    <div>
                      <strong className="text-cyan-400">Data Retention:</strong> {assessment.data_handling.data_retention}
                    </div>
                  )}
                  {assessment.data_handling.third_party_sharing && (
                    <div>
                      <strong className="text-cyan-400">Third-party Sharing:</strong> {assessment.data_handling.third_party_sharing}
                    </div>
                  )}
                  {assessment.data_handling.data_location && (
                    <div>
                      <strong className="text-cyan-400">Data Location:</strong> {assessment.data_handling.data_location}
                    </div>
                  )}
                  <div className="mt-3 space-y-1">
                    {assessment.data_handling.tos_url && (
                      <div>
                        <strong className="text-cyan-400">Terms of Service:</strong>{' '}
                        <a href={assessment.data_handling.tos_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                          {assessment.data_handling.tos_url}
                        </a>
                      </div>
                    )}
                    {assessment.data_handling.privacy_policy_url && (
                      <div>
                        <strong className="text-cyan-400">Privacy Policy:</strong>{' '}
                        <a href={assessment.data_handling.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                          {assessment.data_handling.privacy_policy_url}
                        </a>
                      </div>
                    )}
                    {assessment.data_handling.dpa_url && (
                      <div>
                        <strong className="text-cyan-400">Data Processing Agreement:</strong>{' '}
                        <a href={assessment.data_handling.dpa_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline">
                          {assessment.data_handling.dpa_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deployment Controls */}
              {assessment.deployment_controls && (
                <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                  <h4 className="text-sm text-cyan-400 mb-3">Deployment Controls</h4>
                  <div className="text-xs text-slate-100 whitespace-pre-wrap">{assessment.deployment_controls}</div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Recommendations
            </h3>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-4 md:p-6">
              <div className="text-xs md:text-sm text-white mb-4 whitespace-pre-wrap">{assessment.rationale}</div>
              {assessment.safer_alternatives.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm text-white font-bold mb-2">Safer Alternatives:</h4>
                  <ul className="space-y-2">
                    {assessment.safer_alternatives.map((alt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-white">
                        <span className="text-white">•</span>
                        <span><strong className="text-white font-bold">{alt.product_name}</strong> by <strong className="text-white font-bold">{alt.vendor_name}</strong> - {alt.rationale}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Citations */}
          {assessment.all_citations && assessment.all_citations.length > 0 && (
            <div className="mb-6">
            <h3 className="text-base md:text-lg text-slate-100 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Citations
            </h3>
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
                <div className="space-y-2">
                  {assessment.all_citations.map((citation, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs border-l-2 border-slate-500/50 pl-3 py-1">
                      <span className="text-white font-mono flex-shrink-0 font-bold">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            citation.source_label === 'independent' ? 'bg-green-500/40 text-white border border-green-400/60' :
                            citation.source_label === 'vendor-stated' ? 'bg-blue-500/40 text-white border border-blue-400/60' :
                            'bg-purple-500/40 text-white border border-purple-400/60'
                          }`}>
                            {citation.source_label === 'vendor-stated' ? 'VENDOR' : citation.source_label.toUpperCase()}
                          </span>
                          <span className="text-white font-bold">[{citation.source_type}]</span>
                        </div>
                        <div className="mt-1 text-white">{citation.claim}</div>
                        <a 
                          href={citation.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-cyan-300 hover:text-cyan-200 hover:underline break-all text-[10px] mt-1 inline-block font-semibold"
                        >
                          {citation.source_url}
                        </a>
                        {citation.accessed_date && (
                          <div className="text-white text-[10px] mt-1">Accessed: {citation.accessed_date}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 px-4 md:px-6 py-3 bg-slate-800/50 backdrop-blur-sm text-xs text-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Generated on {new Date(assessment.assessment_timestamp).toLocaleString()}</span>
            <span className="text-cyan-400">CISO Security Assessor v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
