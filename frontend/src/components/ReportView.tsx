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
    // Calculate compliance percentage from SOC2 status
    const getCompliancePercentage = () => {
      const soc2Status = assessment.compliance.soc2_status.toLowerCase();
      if (soc2Status.includes('certified') || soc2Status.includes('compliant')) {
        return 85;
      } else if (soc2Status.includes('partial') || soc2Status.includes('some')) {
        return 50;
      } else if (soc2Status.includes('not') || soc2Status.includes('none')) {
        return 0;
      }
      return 40; // Unknown/default
    };

    const compliancePercentage = getCompliancePercentage();
    const riskLevel = assessment.trust_score >= 70 ? 'Low Risk' : assessment.trust_score >= 40 ? 'Moderate Risk' : 'High Risk';
    const riskScoreLevel = assessment.risk_score >= 70 ? 'High Risk' : assessment.risk_score >= 40 ? 'Moderate Risk' : 'Low Risk';

    // Create comprehensive HTML report with actual data
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Assessment Report - ${query}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0;
              padding: 40px;
              background: #f5f5f5;
              color: #1F2937;
              line-height: 1.6;
            }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #1F2937; margin-bottom: 10px; font-size: 32px; }
            h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; font-size: 24px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
            h3 { color: #4B5563; margin-top: 20px; margin-bottom: 10px; font-size: 18px; }
            .header { margin-bottom: 30px; }
            .entity-info { color: #6B7280; font-size: 14px; margin-bottom: 20px; }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
              margin: 20px 0; 
            }
            .metric { 
              background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #3B82F6;
            }
            .metric.trust { border-left-color: #06B6D4; }
            .metric.risk { border-left-color: #EF4444; }
            .metric.cves { border-left-color: #F59E0B; }
            .metric.confidence { border-left-color: #10B981; }
            .metric-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .score { font-size: 36px; font-weight: bold; color: #1F2937; }
            .critical { color: #EF4444; font-weight: bold; }
            .high { color: #F59E0B; font-weight: bold; }
            .medium { color: #EAB308; font-weight: bold; }
            .low { color: #10B981; font-weight: bold; }
            .section { margin: 30px 0; }
            .info-box { 
              background: #F9FAFB; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 10px 0;
              border-left: 3px solid #3B82F6;
            }
            .cve-item { 
              background: #FEF2F2; 
              padding: 12px; 
              margin: 8px 0; 
              border-radius: 6px; 
              border-left: 3px solid #EF4444;
            }
            .cve-item.high { background: #FFFBEB; border-left-color: #F59E0B; }
            .cve-item.medium { background: #FEFCE8; border-left-color: #EAB308; }
            .cve-item.low { background: #F0FDF4; border-left-color: #10B981; }
            .recommendation { 
              background: #EFF6FF; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #3B82F6;
            }
            .citation { 
              background: #F9FAFB; 
              padding: 10px; 
              margin: 8px 0; 
              border-radius: 4px; 
              font-size: 12px;
              border-left: 2px solid #D1D5DB;
            }
            .citation-label { 
              display: inline-block; 
              padding: 2px 6px; 
              border-radius: 3px; 
              font-size: 10px; 
              font-weight: bold;
              margin-right: 8px;
            }
            .citation-label.vendor { background: #DBEAFE; color: #1E40AF; }
            .citation-label.independent { background: #D1FAE5; color: #065F46; }
            .citation-label.mixed { background: #E9D5FF; color: #6B21A8; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #F3F4F6; font-weight: 600; color: #374151; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px; }
            .badge { 
              display: inline-block; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 11px; 
              font-weight: 600;
              margin: 2px;
            }
            .badge.success { background: #D1FAE5; color: #065F46; }
            .badge.warning { background: #FEF3C7; color: #92400E; }
            .badge.danger { background: #FEE2E2; color: #991B1B; }
            ul { margin-left: 20px; margin-top: 10px; }
            li { margin: 5px 0; }
            a { color: #3B82F6; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .text-muted { color: #6B7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Assessment Report</h1>
              <div class="entity-info">
                <strong>Product:</strong> ${assessment.entity.product_name} | 
                <strong>Vendor:</strong> ${assessment.entity.vendor_name}
                ${assessment.entity.website ? ` | <strong>Website:</strong> <a href="${assessment.entity.website}" target="_blank">${assessment.entity.website}</a>` : ''}
              </div>
              <div class="text-muted">Generated on ${new Date(assessment.assessment_timestamp).toLocaleString()}</div>
            </div>

            <div class="metrics-grid">
              <div class="metric trust">
                <div class="metric-label">Trust Score</div>
                <div class="score">${assessment.trust_score}/100</div>
                <div class="text-muted">${riskLevel}</div>
              </div>
              <div class="metric risk">
                <div class="metric-label">Risk Score</div>
                <div class="score">${assessment.risk_score}/100</div>
                <div class="text-muted">${riskScoreLevel}</div>
              </div>
              <div class="metric cves">
                <div class="metric-label">Critical CVEs</div>
                <div class="score">${assessment.cve_summary.critical_count}</div>
                <div class="text-muted">CISA KEV: ${assessment.cve_summary.cisa_kev_count}</div>
              </div>
              <div class="metric confidence">
                <div class="metric-label">Confidence</div>
                <div class="score" style="font-size: 28px; text-transform: capitalize;">${assessment.confidence}</div>
                <div class="text-muted">${assessment.cve_summary.total_cves} Total CVEs</div>
              </div>
            </div>

            <div class="section">
              <h2>Executive Summary</h2>
              <div class="info-box">
                <p><strong>Product Category:</strong> ${assessment.taxonomy.primary_category}</p>
                <p><strong>Description:</strong> ${assessment.description}</p>
                <p><strong>Usage:</strong> ${assessment.usage}</p>
              </div>
            </div>

            <div class="section">
              <h2>Vulnerability Analysis</h2>
              <div class="info-box">
                <p><strong>Total CVEs:</strong> ${assessment.cve_summary.total_cves}</p>
                <p>
                  <span class="critical">Critical: ${assessment.cve_summary.critical_count}</span> | 
                  <span class="high">High: ${assessment.cve_summary.high_count}</span> | 
                  <span class="medium">Medium: ${assessment.cve_summary.medium_count}</span> | 
                  <span class="low">Low: ${assessment.cve_summary.low_count}</span>
                </p>
                <p><strong>Trend:</strong> ${assessment.cve_summary.trend}</p>
                <p><strong>CISA KEV Count:</strong> ${assessment.cve_summary.cisa_kev_count}</p>
                ${assessment.cve_summary.citation ? `<p class="text-muted"><em>${assessment.cve_summary.citation}</em></p>` : ''}
              </div>
              
              ${assessment.cve_summary.recent_cves.length > 0 ? `
                <h3>Recent CVEs</h3>
                ${assessment.cve_summary.recent_cves.slice(0, 10).map(cve => `
                  <div class="cve-item ${cve.severity.toLowerCase()}">
                    <strong>${cve.cve_id}</strong> ${cve.in_cisa_kev ? '<span class="badge danger">CISA KEV</span>' : ''}
                    <div style="margin-top: 5px;">${cve.description || 'No description available'}</div>
                    ${cve.cvss_score ? `<div class="text-muted">CVSS Score: ${cve.cvss_score}</div>` : ''}
                    ${cve.published_date ? `<div class="text-muted">Published: ${cve.published_date}</div>` : ''}
                  </div>
                `).join('')}
              ` : ''}
            </div>

            <div class="section">
              <h2>Security Incidents</h2>
              <div class="info-box">
                <p><strong>Data Breaches:</strong> ${assessment.incidents.breach_count}</p>
                <p><strong>Total Incidents:</strong> ${assessment.incidents.incidents.length}</p>
              </div>
              ${assessment.incidents.incidents.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Date</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${assessment.incidents.incidents.map(incident => `
                      <tr>
                        <td>${incident.incident_type}</td>
                        <td>${incident.severity}</td>
                        <td>${incident.incident_date || 'N/A'}</td>
                        <td>${incident.description}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p class="text-muted">No incidents found.</p>'}
            </div>

            <div class="section">
              <h2>Compliance Status</h2>
              <div class="info-box">
                <p><strong>SOC2:</strong> ${assessment.compliance.soc2_status} (${compliancePercentage}% requirements met)</p>
                <p><strong>GDPR:</strong> ${assessment.compliance.gdpr_compliant ? 'Compliant' : 'Not Compliant'}</p>
                ${assessment.compliance.ccpa_compliant !== undefined ? `<p><strong>CCPA:</strong> ${assessment.compliance.ccpa_compliant ? 'Compliant' : 'Not Compliant'}</p>` : ''}
                ${assessment.compliance.hipaa_compliant !== undefined ? `<p><strong>HIPAA:</strong> ${assessment.compliance.hipaa_compliant ? 'Compliant' : 'Not Compliant'}</p>` : ''}
                ${assessment.compliance.iso_certifications.length > 0 ? `
                  <p><strong>ISO Certifications:</strong></p>
                  <ul>
                    ${assessment.compliance.iso_certifications.map(iso => `
                      <li>${iso.certification_type} - ${iso.status}${iso.date_issued ? ` (Issued: ${iso.date_issued})` : ''}${iso.expiry_date ? ` (Expires: ${iso.expiry_date})` : ''}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <h2>Data Handling</h2>
              <div class="info-box">
                <p><strong>Encryption:</strong> ${assessment.data_handling.encryption_claimed ? 'Stated' : 'Not stated'}</p>
                ${assessment.data_handling.encryption_details ? `<p><strong>Encryption Details:</strong> ${assessment.data_handling.encryption_details}</p>` : ''}
                ${assessment.data_handling.data_retention ? `<p><strong>Data Retention:</strong> ${assessment.data_handling.data_retention}</p>` : ''}
                ${assessment.data_handling.third_party_sharing ? `<p><strong>Third-party Sharing:</strong> ${assessment.data_handling.third_party_sharing}</p>` : ''}
                ${assessment.data_handling.data_location ? `<p><strong>Data Location:</strong> ${assessment.data_handling.data_location}</p>` : ''}
                ${assessment.data_handling.tos_url ? `<p><strong>Terms of Service:</strong> <a href="${assessment.data_handling.tos_url}" target="_blank">${assessment.data_handling.tos_url}</a></p>` : ''}
                ${assessment.data_handling.privacy_policy_url ? `<p><strong>Privacy Policy:</strong> <a href="${assessment.data_handling.privacy_policy_url}" target="_blank">${assessment.data_handling.privacy_policy_url}</a></p>` : ''}
                ${assessment.data_handling.dpa_url ? `<p><strong>Data Processing Agreement:</strong> <a href="${assessment.data_handling.dpa_url}" target="_blank">${assessment.data_handling.dpa_url}</a></p>` : ''}
              </div>
            </div>

            <div class="section">
              <h2>Vendor Reputation</h2>
              <div class="info-box">
                <p><strong>Vendor:</strong> ${assessment.vendor_reputation.vendor_name}</p>
                ${assessment.vendor_reputation.founded_year ? `<p><strong>Founded:</strong> ${assessment.vendor_reputation.founded_year}</p>` : ''}
                <p><strong>Security Page Found:</strong> ${assessment.vendor_reputation.security_page_found ? 'Yes' : 'No'}</p>
                <p><strong>Security Advisories:</strong> ${assessment.vendor_reputation.security_advisories_found}</p>
                ${assessment.vendor_reputation.security_contact ? `<p><strong>Security Contact:</strong> ${assessment.vendor_reputation.security_contact}</p>` : ''}
                ${assessment.vendor_reputation.claimed_certifications.length > 0 ? `
                  <p><strong>Claimed Certifications:</strong> ${assessment.vendor_reputation.claimed_certifications.join(', ')}</p>
                ` : ''}
              </div>
            </div>

            ${assessment.deployment_controls ? `
              <div class="section">
                <h2>Deployment Controls</h2>
                <div class="info-box">
                  <p style="white-space: pre-wrap;">${assessment.deployment_controls}</p>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <h2>Recommendations</h2>
              <div class="recommendation">
                <p style="white-space: pre-wrap;">${assessment.rationale}</p>
                ${assessment.safer_alternatives.length > 0 ? `
                  <h3 style="margin-top: 20px;">Safer Alternatives</h3>
                  <ul>
                    ${assessment.safer_alternatives.map(alt => `
                      <li><strong>${alt.product_name}</strong> by ${alt.vendor_name} - ${alt.rationale}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
            </div>

            ${assessment.all_citations && assessment.all_citations.length > 0 ? `
              <div class="section">
                <h2>Citations</h2>
                ${assessment.all_citations.map((citation, idx) => `
                  <div class="citation">
                    <span class="citation-label ${citation.source_label === 'vendor-stated' ? 'vendor' : citation.source_label === 'independent' ? 'independent' : 'mixed'}">
                      ${citation.source_label === 'vendor-stated' ? 'VENDOR' : citation.source_label.toUpperCase()}
                    </span>
                    <strong>[${citation.source_type}]</strong>
                    <p style="margin-top: 5px;">${citation.claim}</p>
                    <p style="margin-top: 5px;"><a href="${citation.source_url}" target="_blank">${citation.source_url}</a></p>
                    ${citation.accessed_date ? `<p class="text-muted">Accessed: ${citation.accessed_date}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${assessment.insufficient_data_notes ? `
              <div class="section">
                <h2>Data Availability Notes</h2>
                <div class="info-box">
                  <p style="white-space: pre-wrap;">${assessment.insufficient_data_notes}</p>
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p>Generated by CISO Security Assessor v1.0</p>
              <p>Report generated on ${new Date(assessment.assessment_timestamp).toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${query.replace(/\s+/g, '-')}-${Date.now()}.html`;
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
