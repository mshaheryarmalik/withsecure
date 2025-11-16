<<<<<<< HEAD
import { Download, FileText, X, AlertTriangle, CheckCircle, TrendingUp, Info, Shield } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { CISOBrief } from '../types/api';

interface ReportViewProps {
  assessment: CISOBrief;
  onClose: () => void;
}

export function ReportView({ assessment, onClose }: ReportViewProps) {
  // Prepare CVE distribution data
  const vulnerabilityData = [
    { name: 'Critical', count: assessment.cve_summary.critical_count, color: '#EF4444' },
    { name: 'High', count: assessment.cve_summary.high_count, color: '#F59E0B' },
    { name: 'Medium', count: assessment.cve_summary.medium_count, color: '#06B6D4' },
    { name: 'Low', count: assessment.cve_summary.low_count, color: '#10B981' }
  ];

  // Trust vs Risk gauge data
  const trustRiskData = [
    { category: 'Trust', score: assessment.trust_score, color: '#06B6D4' },
    { category: 'Risk', score: assessment.risk_score, color: '#EF4444' }
  ];

  // Compliance status pie data
  const totalCerts = assessment.compliance.iso_certifications.length;
  const soc2Present = assessment.compliance.soc2_status !== 'not_found' ? 1 : 0;
  const gdprPresent = assessment.compliance.gdpr_compliant ? 1 : 0;
  const totalCompliance = totalCerts + soc2Present + gdprPresent;
  
  const complianceData = totalCompliance > 0 ? [
    { name: 'Certified', value: totalCompliance, color: '#10B981' },
    { name: 'Uncertified', value: Math.max(0, 5 - totalCompliance), color: '#EF4444' }
  ] : [
    { name: 'No Data', value: 1, color: '#64748B' }
  ];

  // Security breakdown radar (simplified)
  const securityScoreData = [
    { category: 'Vendor Trust', score: Math.min(100, assessment.trust_score + 10) },
    { category: 'Compliance', score: totalCompliance > 0 ? totalCompliance * 20 : 30 },
    { category: 'CVE Response', score: Math.max(0, 100 - (assessment.cve_summary.critical_count * 10)) },
    { category: 'Incidents', score: Math.max(0, 100 - (assessment.incidents.breach_count * 20)) },
    { category: 'Data Handling', score: assessment.data_handling.encryption_claimed ? 80 : 40 },
  ];

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-cyan-400';
    return 'text-green-400';
  };

  const handleDownload = () => {
    const reportHTML = generateReportHTML();
=======
import { Download, FileText, X, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
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
    
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
<<<<<<< HEAD
    a.download = `security-report-${assessment.entity.product_name.replace(/\s+/g, '-')}.html`;
=======
    a.download = `security-report-${query.replace(/\s+/g, '-')}.html`;
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

<<<<<<< HEAD
  const generateReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Assessment Report - ${assessment.entity.product_name}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              background: #f3f4f6;
              padding: 20px;
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
              color: white;
              padding: 40px;
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; }
            .header p { font-size: 16px; opacity: 0.9; }
            .content { padding: 40px; }
            .section { margin-bottom: 32px; }
            .section-title { font-size: 24px; color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #06B6D4; padding-bottom: 8px; }
            .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
            .metric-card { padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .metric-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
            .metric-value { font-size: 36px; font-weight: bold; margin-bottom: 4px; }
            .info-row { display: grid; grid-template-columns: 200px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: 600; color: #374151; }
            .info-value { color: #6b7280; }
            .finding { padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid; }
            .finding.critical { background: #fee2e2; border-color: #ef4444; }
            .finding.warning { background: #fef3c7; border-color: #f59e0b; }
            .finding.success { background: #d1fae5; border-color: #10b981; }
            .finding-title { font-weight: 600; margin-bottom: 4px; }
            .footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Assessment Report</h1>
              <p>${assessment.entity.product_name} by ${assessment.entity.vendor_name}</p>
              <p style="font-size: 14px; opacity: 0.8; margin-top: 8px;">Generated: ${new Date(assessment.assessment_timestamp).toLocaleString()}</p>
            </div>
            
            <div class="content">
              <!-- Executive Summary -->
              <div class="section">
                <h2 class="section-title">Executive Summary</h2>
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-label">Trust Score</div>
                    <div class="metric-value" style="color: #06B6D4;">${assessment.trust_score}</div>
                    <div class="info-value">out of 100</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Risk Score</div>
                    <div class="metric-value" style="color: #EF4444;">${assessment.risk_score}</div>
                    <div class="info-value">out of 100</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Total CVEs</div>
                    <div class="metric-value" style="color: #F59E0B;">${assessment.cve_summary.total_cves}</div>
                    <div class="info-value">${assessment.cve_summary.critical_count} critical</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Breaches</div>
                    <div class="metric-value" style="color: #EF4444;">${assessment.incidents.breach_count}</div>
                    <div class="info-value">Data breaches found</div>
                  </div>
                </div>
                <div style="padding: 16px; background: #f3f4f6; border-radius: 8px;">
                  <strong>Rationale:</strong> ${assessment.rationale}
                </div>
              </div>

              <!-- Product Information -->
              <div class="section">
                <h2 class="section-title">Product Information</h2>
                <div class="info-row">
                  <div class="info-label">Product Name:</div>
                  <div class="info-value">${assessment.entity.product_name}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Vendor:</div>
                  <div class="info-value">${assessment.entity.vendor_name}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Category:</div>
                  <div class="info-value">${assessment.taxonomy.primary_category}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Website:</div>
                  <div class="info-value">${assessment.entity.website || 'N/A'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Confidence:</div>
                  <div class="info-value">${assessment.confidence.toUpperCase()}</div>
                </div>
              </div>

              <!-- Security Posture -->
              <div class="section">
                <h2 class="section-title">Security Posture</h2>
                <h3 style="font-size: 18px; margin: 16px 0 12px;">CVE Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">
                  <div style="padding: 12px; background: #fee2e2; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #ef4444; font-weight: bold;">${assessment.cve_summary.critical_count}</div>
                    <div style="font-size: 12px; color: #991b1b;">Critical</div>
                  </div>
                  <div style="padding: 12px; background: #fef3c7; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #f59e0b; font-weight: bold;">${assessment.cve_summary.high_count}</div>
                    <div style="font-size: 12px; color: #92400e;">High</div>
                  </div>
                  <div style="padding: 12px; background: #dbeafe; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #3b82f6; font-weight: bold;">${assessment.cve_summary.medium_count}</div>
                    <div style="font-size: 12px; color: #1e40af;">Medium</div>
                  </div>
                  <div style="padding: 12px; background: #d1fae5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; color: #10b981; font-weight: bold;">${assessment.cve_summary.low_count}</div>
                    <div style="font-size: 12px; color: #065f46;">Low</div>
                  </div>
                </div>
                ${assessment.cve_summary.cisa_kev_count > 0 ? `<p style="color: #ef4444; font-weight: 600;">CISA KEV: ${assessment.cve_summary.cisa_kev_count} actively exploited vulnerabilities</p>` : ''}
              </div>

              <!-- Compliance -->
              <div class="section">
                <h2 class="section-title">Compliance Status</h2>
                <div class="info-row">
                  <div class="info-label">SOC 2:</div>
                  <div class="info-value">${assessment.compliance.soc2_status}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">GDPR Compliant:</div>
                  <div class="info-value">${assessment.compliance.gdpr_compliant ? 'Yes' : 'Unknown'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">ISO Certifications:</div>
                  <div class="info-value">${assessment.compliance.iso_certifications.length} found</div>
                </div>
              </div>

              <!-- Alternatives -->
              ${assessment.safer_alternatives.length > 0 ? `
              <div class="section">
                <h2 class="section-title">Recommended Alternatives</h2>
                ${assessment.safer_alternatives.map((alt, i) => `
                  <div class="finding success">
                    <div class="finding-title">${i + 1}. ${alt.product_name} (${alt.vendor_name})</div>
                    <div>${alt.rationale}</div>
                  </div>
                `).join('')}
              </div>
              ` : ''}
            </div>

            <div class="footer">
              Generated on ${new Date().toLocaleString()} | CISO Security Assessor v1.0
            </div>
          </div>
        </body>
      </html>
    `;
  };

=======
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
<<<<<<< HEAD
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl text-cyan-300">Security Assessment Report</h2>
              <p className="text-xs md:text-sm text-slate-400">{assessment.entity.product_name} by {assessment.entity.vendor_name}</p>
=======
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg border border-slate-500 shadow-lg shadow-slate-700/50">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl text-[rgb(255,255,255)]">Security Assessment Report</h2>
              <p className="text-xs md:text-sm text-slate-400 font-[Inter]">{query}</p>
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleDownload}
<<<<<<< HEAD
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 text-sm"
=======
              className="flex items-center gap-2 px-4 md:px-5 py-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-100 rounded-full hover:from-slate-600 hover:via-slate-500 hover:to-slate-600 transition-all shadow-lg shadow-slate-700/30 border border-slate-600 hover:border-slate-500 text-sm font-medium"
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Download</span>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Executive Summary */}
          <div className="mb-6">
<<<<<<< HEAD
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
=======
            <h3 className="text-base md:text-lg text-[rgb(206,206,206)] mb-4 flex items-center gap-2">
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-3 md:p-4 hover:border-cyan-500/40 transition-all">
                <div className="text-xs md:text-sm text-cyan-400 mb-1">Trust Score</div>
<<<<<<< HEAD
                <div className={`text-3xl md:text-4xl mb-2 ${getTrustScoreColor(assessment.trust_score)}`}>{assessment.trust_score}</div>
                <div className="text-xs text-slate-400">Confidence: {assessment.confidence}</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-3 md:p-4 hover:border-red-500/40 transition-all">
                <div className="text-xs md:text-sm text-red-400 mb-1">Risk Score</div>
                <div className={`text-3xl md:text-4xl mb-2 ${getRiskScoreColor(assessment.risk_score)}`}>{assessment.risk_score}</div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                  {assessment.risk_score >= 60 && <AlertTriangle className="w-3 h-3" />}
                  <span>{assessment.risk_score >= 60 ? 'High Risk' : 'Moderate Risk'}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 rounded-lg p-3 md:p-4 hover:border-amber-500/40 transition-all">
                <div className="text-xs md:text-sm text-amber-400 mb-1">Total CVEs</div>
                <div className="text-3xl md:text-4xl text-amber-300 mb-2">{assessment.cve_summary.total_cves}</div>
                <div className="text-xs text-slate-400">{assessment.cve_summary.critical_count} critical</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-3 md:p-4 hover:border-purple-500/40 transition-all">
                <div className="text-xs md:text-sm text-purple-400 mb-1">Data Breaches</div>
                <div className="text-3xl md:text-4xl text-purple-300 mb-2">{assessment.incidents.breach_count}</div>
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  {assessment.incidents.breach_count === 0 ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  <span>{assessment.incidents.breach_count === 0 ? 'Clean Record' : 'Incidents Found'}</span>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-cyan-400 mb-1">Assessment Rationale</div>
                  <div className="text-sm text-slate-300">{assessment.rationale}</div>
                </div>
              </div>
            </div>

            {/* Insufficient Data Warning */}
            {assessment.insufficient_data_notes && (
              <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">{assessment.insufficient_data_notes}</div>
              </div>
            )}
=======
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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
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

<<<<<<< HEAD
            {/* Trust vs Risk */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 md:p-4 hover:border-cyan-500/30 transition-all">
              <h4 className="text-xs md:text-sm text-slate-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Trust vs Risk Scores
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trustRiskData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
=======
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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                  />
<<<<<<< HEAD
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {trustRiskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
=======
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="vulnerabilities" stroke="#EF4444" strokeWidth={2} name="Vulnerabilities" />
                  <Line type="monotone" dataKey="patches" stroke="#10B981" strokeWidth={2} name="Patches Released" />
                </LineChart>
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
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
<<<<<<< HEAD
                    label={({ name, value }) => `${name}: ${value}`}
=======
                    label={({ name, value }) => `${name}: ${value}%`}
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
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

<<<<<<< HEAD
          {/* Product Details */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Product Information
            </h3>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-slate-400">Product:</div>
                <div className="col-span-2 text-slate-200">{assessment.entity.product_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-slate-400">Vendor:</div>
                <div className="col-span-2 text-slate-200">{assessment.entity.vendor_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-slate-400">Category:</div>
                <div className="col-span-2 text-slate-200">{assessment.taxonomy.primary_category}</div>
              </div>
              {assessment.entity.website && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-slate-400">Website:</div>
                  <div className="col-span-2">
                    <a href={assessment.entity.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      {assessment.entity.website}
                    </a>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-slate-400">Description:</div>
                <div className="col-span-2 text-slate-200">{assessment.description}</div>
=======
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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Recent CVEs */}
          {assessment.cve_summary.recent_cves.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                Recent CVEs
              </h3>
              <div className="space-y-2">
                {assessment.cve_summary.recent_cves.slice(0, 5).map((cve) => (
                  <div key={cve.cve_id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 font-mono text-sm">{cve.cve_id}</span>
                          {cve.in_cisa_kev && (
                            <span className="px-2 py-0.5 bg-red-900/50 border border-red-500/50 rounded text-xs text-red-300">CISA KEV</span>
                          )}
                        </div>
                        {cve.description && (
                          <p className="text-xs text-slate-400">{cve.description.slice(0, 150)}...</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          cve.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300' :
                          cve.severity === 'HIGH' ? 'bg-amber-900/50 text-amber-300' :
                          cve.severity === 'MEDIUM' ? 'bg-cyan-900/50 text-cyan-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {cve.severity}
                        </span>
                        {cve.cvss_score && (
                          <span className="text-xs text-slate-400">CVSS: {cve.cvss_score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {assessment.safer_alternatives.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                Recommended Alternatives
              </h3>
              <div className="space-y-3">
                {assessment.safer_alternatives.map((alt, index) => (
                  <div key={index} className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-lg p-4 hover:border-green-500/50 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex-shrink-0 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-green-300 font-semibold mb-1">
                          {alt.product_name} <span className="text-slate-400">by {alt.vendor_name}</span>
                        </div>
                        <p className="text-xs text-slate-300">{alt.rationale}</p>
                        {alt.category && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-green-900/50 border border-green-500/50 rounded text-xs text-green-300">
                            {alt.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          {assessment.all_citations.length > 0 && (
            <div>
              <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                Sources & Citations ({assessment.all_citations.length})
              </h3>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {assessment.all_citations.map((citation, index) => (
                    <div key={index} className="flex items-start gap-3 text-xs pb-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-500 flex-shrink-0">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-300">{citation.source_type}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            citation.source_label === 'independent' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-amber-900/50 text-amber-300'
                          }`}>
                            {citation.source_label}
                          </span>
                        </div>
                        <a 
                          href={citation.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                        >
                          {citation.source_url}
                        </a>
                        <p className="text-slate-400 mt-1">{citation.claim}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
=======
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
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 px-4 md:px-6 py-3 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
<<<<<<< HEAD
            <span>Generated on {new Date(assessment.assessment_timestamp).toLocaleString()}</span>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">CISO Security Assessor v1.0</span>
            </div>
=======
            <span>Generated on {new Date().toLocaleString()}</span>
            <span className="text-cyan-400">CISO Security Assessor v1.0</span>
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
          </div>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 7ad940080105e9a2e760853b019852826fa5a2da
