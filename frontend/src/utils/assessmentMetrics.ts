import type { CISOBrief } from "../types/api";

export interface ReportExportPayload {
  query: string;
  productName: string;
  vendorName: string;
  description: string;
  usage: string;
  trustScore: number;
  riskScore: number;
  criticalCVEs: number;
  compliance: number;
  patchResponse: string;
  vulnerabilityData: { name: string; count: number; color: string }[];
  securityScoreData: { category: string; score: number }[];
  generatedDate: string;
  totalCves: number;
  cveTrend: string;
  cisaKevCount: number;
  recentCves: {
    id: string;
    severity: string;
    cvss: number | null;
    description?: string;
    publishedDate?: string;
    inCisaKev: boolean;
  }[];
  incidents: {
    date?: string;
    type: string;
    severity: string;
    description: string;
    sourceUrl?: string;
  }[];
  breachCount: number;
  complianceDetails: {
    soc2Status: string;
    isoCertifications: {
      certificationType: string;
      status: string;
      dateIssued?: string;
      expiryDate?: string;
    }[];
    gdprCompliant: boolean | null;
    ccpaCompliant: boolean | null;
    hipaaCompliant: boolean | null;
  };
  dataHandling: {
    encryptionClaimed: boolean;
    encryptionDetails?: string;
    dataRetention?: string;
    dataLocation?: string;
    privacyPolicyUrl?: string;
    tosUrl?: string;
    dpaUrl?: string;
    thirdPartySharing?: string;
  };
  deploymentControls: string;
  rationale: string;
  saferAlternatives: {
    productName: string;
    vendorName: string;
    rationale: string;
    category?: string;
  }[];
  citations: {
    claim: string;
    sourceUrl: string;
    sourceType: string;
    sourceLabel: string;
    accessedDate: string;
  }[];
}

export function clampScore(value: number | undefined, min = 0, max = 100): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function calculateComplianceScore(compliance: CISOBrief["compliance"]): number {
  if (!compliance) {
    return 0;
  }
  const metrics: number[] = [];
  if (compliance.soc2_status) {
    metrics.push(
      /(compliant|certified|attested|yes)/i.test(compliance.soc2_status)
        ? 1
        : 0,
    );
  }
  metrics.push(compliance.iso_certifications?.length ? 1 : 0);
  metrics.push(compliance.gdpr_compliant ? 1 : 0);
  metrics.push(compliance.ccpa_compliant ? 1 : 0);
  metrics.push(compliance.hipaa_compliant ? 1 : 0);
  const total = metrics.length || 1;
  return Math.round((metrics.reduce((sum, value) => sum + value, 0) / total) * 100);
}

export function calculateVendorScore(vendor: CISOBrief["vendor_reputation"]): number {
  if (!vendor) {
    return 0;
  }
  let score = 40;
  if (vendor.security_page_found) {
    score += 20;
  }
  if (vendor.security_contact) {
    score += 10;
  }
  if (vendor.claimed_certifications?.length) {
    score += 10;
  }
  score += Math.min(20, (vendor.security_advisories_found ?? 0) * 2);
  return clampScore(score);
}

export function calculateDataHandlingScore(dataHandling: CISOBrief["data_handling"]): number {
  if (!dataHandling) {
    return 0;
  }
  let score = 40;
  if (dataHandling.encryption_claimed) {
    score += 20;
  }
  if (dataHandling.tos_url) {
    score += 10;
  }
  if (dataHandling.privacy_policy_url) {
    score += 10;
  }
  if (dataHandling.dpa_url) {
    score += 5;
  }
  if (dataHandling.data_retention) {
    score += 5;
  }
  if (dataHandling.data_location) {
    score += 5;
  }
  return clampScore(score);
}

export function calculateIncidentScore(incidents: CISOBrief["incidents"]): number {
  if (!incidents) {
    return 0;
  }
  let score = 80;
  if (incidents.breach_count && incidents.breach_count > 0) {
    score -= Math.min(60, incidents.breach_count * 15);
  }
  return clampScore(score);
}

export function deriveAssessmentMetrics(assessment: CISOBrief) {
  const vulnerabilityData = [
    {
      name: "Critical",
      count: Math.max(0, assessment.cve_summary.critical_count),
      color: "#ef4444",
    },
    {
      name: "High",
      count: Math.max(0, assessment.cve_summary.high_count),
      color: "#f97316",
    },
    {
      name: "Medium",
      count: Math.max(0, assessment.cve_summary.medium_count),
      color: "#eab308",
    },
    {
      name: "Low",
      count: Math.max(0, assessment.cve_summary.low_count),
      color: "#22c55e",
    },
  ];

  const complianceScore = calculateComplianceScore(assessment.compliance);
  const vendorScore = calculateVendorScore(assessment.vendor_reputation);
  const dataHandlingScore = calculateDataHandlingScore(assessment.data_handling);
  const incidentScore = calculateIncidentScore(assessment.incidents);
  const riskScore = clampScore(assessment.risk_score);
  const patchMatch = assessment.deployment_controls?.match(
    /\b\d+\s*(?:day|days|hour|hours|hr|hrs|d)\b/i,
  );
  const patchResponse = patchMatch ? patchMatch[0] : "N/A";

  const securityScoreData = [
    { category: "Trust Score", score: clampScore(assessment.trust_score) },
    { category: "Risk Score", score: clampScore(100 - riskScore) },
    { category: "Compliance", score: complianceScore },
    { category: "Vendor Trust", score: vendorScore },
    { category: "Data Handling", score: dataHandlingScore },
    { category: "Incident Response", score: incidentScore },
  ];

  return {
    vulnerabilityData,
    securityScoreData,
    complianceScore,
    vendorScore,
    dataHandlingScore,
    incidentScore,
    patchResponse,
  };
}

export function buildReportExportPayload(
  assessment: CISOBrief,
  query: string,
): ReportExportPayload {
  const metrics = deriveAssessmentMetrics(assessment);
  const mappedRecentCves = (assessment.cve_summary.recent_cves || [])
    .slice(0, 12)
    .map((cve) => ({
      id: cve.cve_id,
      severity: cve.severity,
      cvss: typeof cve.cvss_score === "number" ? Math.round(cve.cvss_score * 10) / 10 : null,
      description: cve.description,
      publishedDate: cve.published_date,
      inCisaKev: Boolean(cve.in_cisa_kev),
    }));

  const mappedIncidents = (assessment.incidents?.incidents || []).map((incident) => ({
    date: incident.incident_date,
    type: incident.incident_type,
    severity: incident.severity,
    description: incident.description,
    sourceUrl: incident.source_url,
  }));

  const mappedCertifications =
    assessment.compliance?.iso_certifications?.map((cert) => ({
      certificationType: cert.certification_type,
      status: cert.status,
      dateIssued: cert.date_issued,
      expiryDate: cert.expiry_date,
    })) || [];

  const mappedAlternatives =
    assessment.safer_alternatives?.map((alt) => ({
      productName: alt.product_name,
      vendorName: alt.vendor_name,
      rationale: alt.rationale,
      category: alt.category,
    })) || [];

  const mappedCitations =
    assessment.all_citations?.slice(0, 12).map((citation) => ({
      claim: citation.claim,
      sourceUrl: citation.source_url,
      sourceType: citation.source_type,
      sourceLabel: citation.source_label,
      accessedDate: citation.accessed_date,
    })) || [];

  return {
    query: query || assessment.entity.product_name,
    productName: assessment.entity.product_name,
    vendorName: assessment.entity.vendor_name,
    description: assessment.description,
    usage: assessment.usage,
    trustScore: clampScore(assessment.trust_score),
    riskScore: clampScore(assessment.risk_score),
    criticalCVEs: Math.max(0, assessment.cve_summary.critical_count),
    compliance: metrics.complianceScore,
    patchResponse: metrics.patchResponse,
    vulnerabilityData: metrics.vulnerabilityData,
    securityScoreData: metrics.securityScoreData,
    generatedDate: new Date().toLocaleString(),
    totalCves: Math.max(0, assessment.cve_summary.total_cves),
    cveTrend: assessment.cve_summary.trend,
    cisaKevCount: Math.max(0, assessment.cve_summary.cisa_kev_count),
    recentCves: mappedRecentCves,
    incidents: mappedIncidents,
    breachCount: Math.max(0, assessment.incidents?.breach_count ?? 0),
    complianceDetails: {
      soc2Status: assessment.compliance?.soc2_status || "Not reported",
      isoCertifications: mappedCertifications,
      gdprCompliant: assessment.compliance?.gdpr_compliant ?? null,
      ccpaCompliant: assessment.compliance?.ccpa_compliant ?? null,
      hipaaCompliant: assessment.compliance?.hipaa_compliant ?? null,
    },
    dataHandling: {
      encryptionClaimed: Boolean(assessment.data_handling?.encryption_claimed),
      encryptionDetails: assessment.data_handling?.encryption_details,
      dataRetention: assessment.data_handling?.data_retention,
      dataLocation: assessment.data_handling?.data_location,
      privacyPolicyUrl: assessment.data_handling?.privacy_policy_url,
      tosUrl: assessment.data_handling?.tos_url,
      dpaUrl: assessment.data_handling?.dpa_url,
      thirdPartySharing: assessment.data_handling?.third_party_sharing,
    },
    deploymentControls: assessment.deployment_controls,
    rationale: assessment.rationale,
    saferAlternatives: mappedAlternatives,
    citations: mappedCitations,
  };
}
