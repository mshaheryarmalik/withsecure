// TypeScript types for API responses matching backend Pydantic models

export interface AssessmentRequest {
  product?: string;
  vendor?: string;
  url?: string;
  sha1?: string;
  version?: string;
  no_cache?: boolean;
  cache_ttl?: number;
}

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type SourceLabel = "vendor-stated" | "independent" | "mixed";
export type InputType = "name" | "url" | "sha1" | "unknown";

export interface EntityResolution {
  product_name: string;
  original_name?: string;
  vendor_name: string;
  website?: string;
  verified: boolean;
  input_type: InputType;
  sha1_hash?: string;
  file_reputation?: string;
  confidence: ConfidenceLevel;
}

export interface SoftwareTaxonomy {
  primary_category: string;
  secondary_categories: string[];
  confidence: ConfidenceLevel;
}

export interface CVEDetail {
  cve_id: string;
  severity: string;
  cvss_score?: number;
  published_date?: string;
  description?: string;
  in_cisa_kev: boolean;
}

export interface CVETrendSummary {
  total_cves: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  trend: string;
  recent_cves: CVEDetail[];
  cisa_kev_count: number;
  citation: string;
  source_label: SourceLabel;
  data_available: boolean;
}

export interface VendorReputation {
  vendor_name: string;
  founded_year?: number;
  security_page_found: boolean;
  security_contact?: string;
  claimed_certifications: string[];
  security_advisories_found: number;
  source_label: SourceLabel;
}

export interface IncidentDetail {
  incident_date?: string;
  incident_type: string;
  severity: string;
  description: string;
  source_url?: string;
}

export interface IncidentReport {
  incidents: IncidentDetail[];
  breach_count: number;
  source_label: SourceLabel;
  data_available: boolean;
}

export interface CertificationDetail {
  certification_type: string;
  status: string;
  date_issued?: string;
  expiry_date?: string;
  source_label: SourceLabel;
}

export interface ComplianceStatus {
  soc2_status: string;
  iso_certifications: CertificationDetail[];
  gdpr_compliant?: boolean;
  ccpa_compliant?: boolean;
  hipaa_compliant?: boolean;
  data_available: boolean;
}

export interface DataHandling {
  tos_url?: string;
  dpa_url?: string;
  privacy_policy_url?: string;
  encryption_claimed: boolean;
  encryption_details?: string;
  data_retention?: string;
  third_party_sharing?: string;
  data_location?: string;
  source_label: SourceLabel;
  data_available: boolean;
}

export interface AlternativeProduct {
  product_name: string;
  vendor_name: string;
  rationale: string;
  category?: string;
}

export interface Citation {
  source_url: string;
  source_type: string;
  source_label: SourceLabel;
  accessed_date: string;
  claim: string;
}

export interface CISOBrief {
  entity: EntityResolution;
  taxonomy: SoftwareTaxonomy;
  description: string;
  usage: string;
  vendor_reputation: VendorReputation;
  cve_summary: CVETrendSummary;
  incidents: IncidentReport;
  compliance: ComplianceStatus;
  data_handling: DataHandling;
  deployment_controls: string;
  trust_score: number;
  risk_score: number;
  rationale: string;
  confidence: ConfidenceLevel;
  safer_alternatives: AlternativeProduct[];
  all_citations: Citation[];
  assessment_timestamp: string;
  insufficient_data_notes?: string;
}

// SSE Event Types
export interface PhaseEvent {
  phase: string;
  phase_name: string;
  step: string;
  messages: string[];
}

export interface ResultEvent {
  success: boolean;
  assessment: CISOBrief;
  timestamp: string;
}

export interface ErrorEvent {
  success: boolean;
  error: string;
  errors?: string[];
}

export type SSEEvent = PhaseEvent | ResultEvent | ErrorEvent;

