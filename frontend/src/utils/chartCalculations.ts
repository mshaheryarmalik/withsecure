import type { CISOBrief } from '../types/api';

/**
 * Calculate 5-dimension security scores for radar chart
 */
export interface SecurityDimensions {
  vendorTrust: number;
  compliance: number;
  cveResponse: number;
  incidents: number;
  dataHandling: number;
}

export function calculateSecurityDimensions(assessment: CISOBrief): SecurityDimensions {
  // 1. Vendor Trust (0-100)
  let vendorTrust = 50;
  if (assessment.vendor_reputation.security_page_found) vendorTrust += 15;
  if (assessment.vendor_reputation.claimed_certifications.length > 0) {
    vendorTrust += Math.min(20, assessment.vendor_reputation.claimed_certifications.length * 5);
  }
  if (assessment.vendor_reputation.founded_year && assessment.vendor_reputation.founded_year < 2015) {
    vendorTrust += 15;
  }
  
  // 2. Compliance (0-100)
  let compliance = 0;
  if (assessment.compliance.soc2_status.toLowerCase().includes('type ii')) compliance += 30;
  else if (assessment.compliance.soc2_status.toLowerCase().includes('soc2')) compliance += 20;
  if (assessment.compliance.iso_certifications && assessment.compliance.iso_certifications.length > 0) {
    compliance += Math.min(30, assessment.compliance.iso_certifications.length * 10);
  }
  if (assessment.compliance.gdpr_compliant) compliance += 20;
  if (assessment.compliance.hipaa_compliant) compliance += 20;
  
  // 3. CVE Response (0-100)
  let cveResponse = 100;
  if (assessment.cve_summary.total_cves > 0) {
    const penalty = assessment.cve_summary.critical_count * 15 + assessment.cve_summary.high_count * 5 + 
                    assessment.cve_summary.medium_count * 2 + assessment.cve_summary.low_count * 0.5;
    cveResponse = Math.max(0, 100 - penalty);
  }
  if (assessment.cve_summary.cisa_kev_count > 0) {
    cveResponse = Math.max(0, cveResponse - (assessment.cve_summary.cisa_kev_count * 20));
  }
  
  // 4. Incidents (0-100)
  let incidents = 100;
  if (assessment.incidents.breach_count > 0) {
    incidents = Math.max(0, 100 - (assessment.incidents.breach_count * 25));
  }
  
  // 5. Data Handling (0-100)
  let dataHandling = 20;
  if (assessment.data_handling.encryption_claimed) dataHandling += 30;
  if (assessment.data_handling.privacy_policy_url) dataHandling += 15;
  if (assessment.data_handling.tos_url) dataHandling += 15;
  if (assessment.data_handling.dpa_url) dataHandling += 20;
  
  return {
    vendorTrust: Math.min(100, Math.max(0, Math.round(vendorTrust))),
    compliance: Math.min(100, Math.max(0, Math.round(compliance))),
    cveResponse: Math.min(100, Math.max(0, Math.round(cveResponse))),
    incidents: Math.min(100, Math.max(0, Math.round(incidents))),
    dataHandling: Math.min(100, Math.max(0, Math.round(dataHandling))),
  };
}

export interface VulnerabilityDistribution {
  name: string;
  count: number;
  fill: string;
}

export function calculateVulnerabilityDistribution(assessment: CISOBrief): VulnerabilityDistribution[] {
  return [
    { name: 'Critical', count: assessment.cve_summary.critical_count, fill: '#dc2626' },
    { name: 'High', count: assessment.cve_summary.high_count, fill: '#ea580c' },
    { name: 'Medium', count: assessment.cve_summary.medium_count, fill: '#ca8a04' },
    { name: 'Low', count: assessment.cve_summary.low_count, fill: '#16a34a' },
  ];
}


