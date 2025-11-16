import { X, FileText, Shield } from 'lucide-react';
import type { CISOBrief } from '../types/api';

interface ReportViewProps {
  assessment: CISOBrief;
  onClose: () => void;
}

export function ReportView({ assessment, onClose }: ReportViewProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl text-cyan-300">Security Assessment Report</h2>
              <p className="text-xs text-slate-400">{assessment.entity.product_name} by {assessment.entity.vendor_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50 hover:border-cyan-500/30"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Executive Summary */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-500/20 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-cyan-400 mb-1">Trust Score</div>
                <div className="text-3xl md:text-4xl text-cyan-300 mb-2">{assessment.trust_score}</div>
                <div className="text-xs text-slate-400">Confidence: {assessment.confidence}</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/20 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-red-400 mb-1">Risk Score</div>
                <div className="text-3xl md:text-4xl text-red-300 mb-2">{assessment.risk_score}</div>
                <div className="text-xs text-slate-400">Out of 100</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-purple-400 mb-1">CVEs Found</div>
                <div className="text-3xl md:text-4xl text-purple-300 mb-2">{assessment.cve_summary.total_cves}</div>
                <div className="text-xs text-slate-400">Total vulnerabilities</div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 backdrop-blur-sm border border-amber-500/20 rounded-lg p-3 md:p-4">
                <div className="text-xs md:text-sm text-amber-400 mb-1">Category</div>
                <div className="text-sm md:text-base text-amber-300 mb-2">{assessment.taxonomy.primary_category}</div>
                <div className="text-xs text-slate-400">Software type</div>
              </div>
            </div>
          </div>

          {/* Rationale */}
          <div className="mb-6">
            <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
              Assessment Rationale
            </h3>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{assessment.rationale}</p>
            </div>
          </div>

          {/* CVE Details */}
          {assessment.cve_summary.recent_cves && assessment.cve_summary.recent_cves.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                Recent CVEs
              </h3>
              <div className="space-y-2">
                {assessment.cve_summary.recent_cves.slice(0, 10).map((cve: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-cyan-400 text-sm font-mono mb-1">{cve.cve_id}</div>
                        <div className="text-slate-300 text-xs">{cve.description?.substring(0, 200)}...</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        cve.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300' :
                        cve.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-300' :
                        cve.severity === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>
                        {cve.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          {assessment.all_citations && assessment.all_citations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base md:text-lg text-cyan-300 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full"></div>
                Sources ({assessment.all_citations.length})
              </h3>
              <div className="space-y-2">
                {assessment.all_citations.map((citation: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
                        citation.label === 'INDEPENDENT' ? 'bg-green-900/50 text-green-300' :
                        citation.label === 'VENDOR_STATED' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-slate-700/50 text-slate-300'
                      }`}>
                        {citation.label}
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-300 text-sm mb-1">{citation.text}</div>
                        {citation.url && (
                          <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs break-all">
                            {citation.url}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/20 px-4 md:px-6 py-3 bg-slate-900/50 backdrop-blur-sm text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Generated on {new Date(assessment.assessment_timestamp).toLocaleString()}</span>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">CISO Security Assessor v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
