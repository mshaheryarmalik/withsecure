"""Security assessment state models for CISO brief generation."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class InputType(str, Enum):
    """Type of input provided for assessment."""
    
    NAME = "name"
    URL = "url"
    SHA1 = "sha1"
    UNKNOWN = "unknown"


class ConfidenceLevel(str, Enum):
    """Confidence level for assessments."""
    
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class SourceLabel(str, Enum):
    """Label indicating source of information."""
    
    VENDOR_STATED = "vendor-stated"
    INDEPENDENT = "independent"
    MIXED = "mixed"


class SoftwareCategory(str, Enum):
    """Software taxonomy categories."""
    
    FILE_SHARING = "File sharing"
    GENAI_TOOL = "GenAI tool"
    SAAS_CRM = "SaaS CRM"
    ENDPOINT_AGENT = "Endpoint agent"
    BROWSER_EXTENSION = "Browser extension"
    COMMUNICATION_PLATFORM = "Communication platform"
    DEVELOPMENT_TOOL = "Development tool"
    SECURITY_TOOL = "Security tool"
    CLOUD_STORAGE = "Cloud storage"
    PROJECT_MANAGEMENT = "Project management"
    OTHER = "Other"


class EntityResolution(BaseModel):
    """Resolved entity information from minimal input."""
    
    product_name: str = Field(description="Canonical product name")
    vendor_name: str = Field(description="Vendor/company name")
    website: Optional[str] = Field(default=None, description="Official website URL")
    verified: bool = Field(default=False, description="Whether entity resolution was verified")
    input_type: InputType = Field(description="Type of input provided")
    sha1_hash: Optional[str] = Field(default=None, description="SHA1 hash if input was hash")
    file_reputation: Optional[str] = Field(default=None, description="File reputation from VirusTotal/MalwareBazaar")
    confidence: ConfidenceLevel = Field(default=ConfidenceLevel.MEDIUM, description="Confidence in resolution")


class SoftwareTaxonomy(BaseModel):
    """Software classification and taxonomy."""
    
    primary_category: SoftwareCategory = Field(description="Primary software category")
    secondary_categories: List[SoftwareCategory] = Field(default_factory=list, description="Additional categories")
    confidence: ConfidenceLevel = Field(default=ConfidenceLevel.MEDIUM, description="Classification confidence")


class CVEDetail(BaseModel):
    """Details of a specific CVE."""
    
    cve_id: str = Field(description="CVE identifier")
    severity: str = Field(description="CVSS severity (CRITICAL/HIGH/MEDIUM/LOW)")
    cvss_score: Optional[float] = Field(default=None, description="CVSS score")
    published_date: Optional[str] = Field(default=None, description="Publication date")
    description: Optional[str] = Field(default=None, description="CVE description")
    in_cisa_kev: bool = Field(default=False, description="Whether CVE is in CISA KEV catalog")


class CVETrendSummary(BaseModel):
    """CVE trend analysis and summary."""
    
    total_cves: int = Field(default=0, description="Total number of CVEs found")
    critical_count: int = Field(default=0, description="Number of critical CVEs")
    high_count: int = Field(default=0, description="Number of high severity CVEs")
    medium_count: int = Field(default=0, description="Number of medium severity CVEs")
    low_count: int = Field(default=0, description="Number of low severity CVEs")
    trend: str = Field(default="stable", description="Trend analysis (increasing/stable/decreasing)")
    recent_cves: List[CVEDetail] = Field(default_factory=list, description="Most recent or notable CVEs")
    cisa_kev_count: int = Field(default=0, description="Number of CVEs in CISA KEV catalog")
    citation: str = Field(default="", description="Source citation")
    source_label: SourceLabel = Field(default=SourceLabel.INDEPENDENT, description="Always independent")
    data_available: bool = Field(default=True, description="Whether CVE data was available")


class VendorReputation(BaseModel):
    """Vendor reputation and security posture."""
    
    vendor_name: str = Field(description="Vendor name")
    founded_year: Optional[int] = Field(default=None, description="Year founded")
    security_page_found: bool = Field(default=False, description="Whether security/PSIRT page found")
    security_contact: Optional[str] = Field(default=None, description="Security contact email")
    claimed_certifications: List[str] = Field(default_factory=list, description="Certifications claimed by vendor")
    security_advisories_found: int = Field(default=0, description="Number of security advisories found")
    source_label: SourceLabel = Field(default=SourceLabel.VENDOR_STATED, description="Source label")


class IncidentDetail(BaseModel):
    """Details of a security incident."""
    
    incident_date: Optional[str] = Field(default=None, description="Date of incident")
    incident_type: str = Field(description="Type of incident (breach, vulnerability, abuse)")
    severity: str = Field(description="Severity level")
    description: str = Field(description="Incident description")
    source_url: Optional[str] = Field(default=None, description="Source URL")


class IncidentReport(BaseModel):
    """Security incident history."""
    
    incidents: List[IncidentDetail] = Field(default_factory=list, description="List of incidents")
    breach_count: int = Field(default=0, description="Number of data breaches")
    source_label: SourceLabel = Field(default=SourceLabel.INDEPENDENT, description="Source label")
    data_available: bool = Field(default=True, description="Whether incident data was available")


class CertificationDetail(BaseModel):
    """Details of a compliance certification."""
    
    certification_type: str = Field(description="Type of certification (SOC2, ISO 27001, etc.)")
    status: str = Field(description="Status (verified/claimed/not_found)")
    date_issued: Optional[str] = Field(default=None, description="Date issued")
    expiry_date: Optional[str] = Field(default=None, description="Expiry date")
    source_label: SourceLabel = Field(description="Source of information")


class ComplianceStatus(BaseModel):
    """Compliance and certification status."""
    
    soc2_status: str = Field(default="not_found", description="SOC2 Type II status")
    iso_certifications: List[CertificationDetail] = Field(default_factory=list, description="ISO certifications")
    gdpr_compliant: Optional[bool] = Field(default=None, description="GDPR compliance status")
    ccpa_compliant: Optional[bool] = Field(default=None, description="CCPA compliance status")
    hipaa_compliant: Optional[bool] = Field(default=None, description="HIPAA compliance status")
    data_available: bool = Field(default=True, description="Whether compliance data was available")


class DataHandling(BaseModel):
    """Data handling and privacy policies."""
    
    tos_url: Optional[str] = Field(default=None, description="Terms of Service URL")
    dpa_url: Optional[str] = Field(default=None, description="Data Processing Agreement URL")
    privacy_policy_url: Optional[str] = Field(default=None, description="Privacy Policy URL")
    encryption_claimed: bool = Field(default=False, description="Whether encryption is claimed")
    encryption_details: Optional[str] = Field(default=None, description="Encryption details")
    data_retention: Optional[str] = Field(default=None, description="Data retention policy")
    third_party_sharing: Optional[str] = Field(default=None, description="Third-party sharing policy")
    data_location: Optional[str] = Field(default=None, description="Data storage location")
    source_label: SourceLabel = Field(default=SourceLabel.VENDOR_STATED, description="Always vendor-stated")
    data_available: bool = Field(default=True, description="Whether data handling info available")


class AlternativeProduct(BaseModel):
    """Safer alternative product recommendation."""
    
    product_name: str = Field(description="Alternative product name")
    vendor_name: str = Field(description="Alternative vendor name")
    rationale: str = Field(description="Why this is a safer alternative")
    category: Optional[SoftwareCategory] = Field(default=None, description="Product category")


class Citation(BaseModel):
    """Source citation for claims."""
    
    source_url: str = Field(description="URL of the source")
    source_type: str = Field(description="Type of source (NVD, CISA KEV, vendor page, etc.)")
    source_label: SourceLabel = Field(description="Vendor-stated vs independent")
    accessed_date: str = Field(description="Date accessed")
    claim: str = Field(description="What claim this citation supports")


class CISOBrief(BaseModel):
    """Final CISO-ready security assessment brief."""
    
    # Core Identity
    entity: EntityResolution = Field(description="Resolved entity information")
    taxonomy: SoftwareTaxonomy = Field(description="Software classification")
    
    # Assessment Components
    description: str = Field(description="Product description")
    usage: str = Field(description="Typical usage and deployment")
    vendor_reputation: VendorReputation = Field(description="Vendor reputation assessment")
    cve_summary: CVETrendSummary = Field(description="CVE trend summary")
    incidents: IncidentReport = Field(description="Security incident history")
    compliance: ComplianceStatus = Field(description="Compliance and certification status")
    data_handling: DataHandling = Field(description="Data handling policies")
    deployment_controls: str = Field(description="Deployment and admin controls")
    
    # Scoring and Recommendations
    trust_score: int = Field(ge=0, le=100, description="Trust score (0-100)")
    risk_score: int = Field(ge=0, le=100, description="Risk score (0-100)")
    rationale: str = Field(description="Rationale for trust/risk scores")
    confidence: ConfidenceLevel = Field(description="Overall assessment confidence")
    safer_alternatives: List[AlternativeProduct] = Field(default_factory=list, description="Recommended alternatives")
    
    # Evidence and Metadata
    all_citations: List[Citation] = Field(default_factory=list, description="All source citations")
    assessment_timestamp: datetime = Field(default_factory=datetime.now, description="Assessment timestamp")
    insufficient_data_notes: Optional[str] = Field(default=None, description="Notes on insufficient data")
    
    def to_markdown(self) -> str:
        """Convert CISO brief to markdown format."""
        md = f"# Security Assessment: {self.entity.product_name}\n\n"
        md += f"**Vendor:** {self.entity.vendor_name}\n"
        md += f"**Assessment Date:** {self.assessment_timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
        md += f"**Confidence Level:** {self.confidence.value.upper()}\n\n"
        
        md += "## Executive Summary\n\n"
        md += f"**Trust Score:** {self.trust_score}/100\n"
        md += f"**Risk Score:** {self.risk_score}/100\n\n"
        md += f"**Rationale:** {self.rationale}\n\n"
        
        if self.insufficient_data_notes:
            md += f"⚠️ **Data Limitations:** {self.insufficient_data_notes}\n\n"
        
        md += f"## Product Overview\n\n"
        md += f"**Category:** {self.taxonomy.primary_category.value}\n"
        md += f"**Description:** {self.description}\n"
        md += f"**Usage:** {self.usage}\n\n"
        
        md += "## Security Posture\n\n"
        md += f"### CVE Summary ({self.cve_summary.source_label.value})\n"
        md += f"- **Total CVEs:** {self.cve_summary.total_cves}\n"
        md += f"- **Critical:** {self.cve_summary.critical_count}\n"
        md += f"- **High:** {self.cve_summary.high_count}\n"
        md += f"- **CISA KEV:** {self.cve_summary.cisa_kev_count}\n"
        md += f"- **Trend:** {self.cve_summary.trend}\n\n"
        
        md += f"### Incidents ({self.incidents.source_label.value})\n"
        md += f"- **Data Breaches:** {self.incidents.breach_count}\n"
        md += f"- **Total Incidents:** {len(self.incidents.incidents)}\n\n"
        
        md += f"### Compliance ({self.compliance.soc2_status})\n"
        md += f"- **SOC2:** {self.compliance.soc2_status}\n"
        md += f"- **GDPR:** {'Yes' if self.compliance.gdpr_compliant else 'Unknown'}\n"
        md += f"- **ISO Certifications:** {len(self.compliance.iso_certifications)}\n\n"
        
        md += f"### Data Handling ({self.data_handling.source_label.value})\n"
        md += f"- **Encryption:** {'Yes' if self.data_handling.encryption_claimed else 'Not stated'}\n"
        md += f"- **Data Retention:** {self.data_handling.data_retention or 'Not specified'}\n"
        md += f"- **Third-party Sharing:** {self.data_handling.third_party_sharing or 'Not specified'}\n\n"
        
        if self.safer_alternatives:
            md += "## Recommended Alternatives\n\n"
            for i, alt in enumerate(self.safer_alternatives, 1):
                md += f"{i}. **{alt.product_name}** ({alt.vendor_name})\n"
                md += f"   - {alt.rationale}\n\n"
        
        md += "## Citations\n\n"
        for i, citation in enumerate(self.all_citations, 1):
            md += f"{i}. [{citation.source_type}] {citation.source_url} ({citation.source_label.value})\n"
        
        return md

