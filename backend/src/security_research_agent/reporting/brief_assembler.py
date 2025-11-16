"""CISO brief assembly from all assessment components."""

from datetime import datetime
from typing import Any, List

from ..security_state import CISOBrief, ComplianceStatus, DataHandling, SourceLabel


def assemble_ciso_brief(
    entity_data: Any,
    taxonomy_data: Any,
    vendor_reputation: Any,
    cve_summary: Any,
    incident_report: Any,
    trust_score: int,
    risk_score: int,
    rationale: str,
    confidence: Any,
    alternatives: List[Any],
    citations: List[Any],
    insufficient_notes: List[str],
    soc2_status: str,
    iso_certs: List[Any],
    gdpr_compliant: bool,
    encryption_mentioned: bool,
    data_retention_policy: str,
    third_party_sharing: str
) -> CISOBrief:
    """Assemble the final CISO brief from all components.
    
    Args:
        entity_data: Entity resolution data
        taxonomy_data: Software taxonomy data
        vendor_reputation: Vendor reputation data
        cve_summary: CVE trend summary
        incident_report: Security incident report
        trust_score: Calculated trust score
        risk_score: Calculated risk score
        rationale: Risk/trust rationale
        confidence: Confidence level
        alternatives: List of alternative products
        citations: List of citations
        insufficient_notes: List of insufficiency notes
        soc2_status: SOC2 compliance status
        iso_certs: List of ISO certifications
        gdpr_compliant: GDPR compliance status
        encryption_mentioned: Whether encryption is mentioned
        data_retention_policy: Data retention policy
        third_party_sharing: Third-party sharing policy
        
    Returns:
        Complete CISOBrief object
    """
    ciso_brief = CISOBrief(
        entity=entity_data,
        taxonomy=taxonomy_data,
        description=f"{entity_data.product_name} is a {taxonomy_data.primary_category} solution.",
        usage=f"Typically used for {taxonomy_data.primary_category} purposes in enterprise environments.",
        vendor_reputation=vendor_reputation,
        cve_summary=cve_summary,
        incidents=incident_report,
        compliance=ComplianceStatus(
            soc2_status=soc2_status,
            iso_certifications=iso_certs,
            gdpr_compliant=gdpr_compliant,
        ),
        data_handling=DataHandling(
            tos_url=entity_data.website,
            encryption=encryption_mentioned,
            data_retention=data_retention_policy,
            third_party_sharing=third_party_sharing,
            source_label=SourceLabel.VENDOR_STATED,
        ),
        deployment_controls="Standard SaaS deployment with admin controls (specifics require vendor documentation)",
        trust_score=trust_score,
        risk_score=risk_score,
        rationale=rationale[:1000],  # Limit length
        confidence=confidence,
        safer_alternatives=alternatives,
        all_citations=citations,
        assessment_timestamp=datetime.now(),
        insufficient_data_notes="; ".join(insufficient_notes) if insufficient_notes else None,
    )
    
    return ciso_brief


def format_summary_message(
    entity_data: Any,
    taxonomy_data: Any,
    trust_score: int,
    risk_score: int,
    confidence: Any,
    cve_summary: Any,
    incident_report: Any,
    citations: List[Any]
) -> List[str]:
    """Format the final summary status message.
    
    Args:
        entity_data: Entity resolution data
        taxonomy_data: Software taxonomy data
        trust_score: Trust score
        risk_score: Risk score
        confidence: Confidence level
        cve_summary: CVE summary
        incident_report: Incident report
        citations: List of citations
        
    Returns:
        List of formatted status messages
    """
    status_update = [
        "",
        "  ✓ CISO BRIEF GENERATED SUCCESSFULLY!",
        "",
        "  📋 Summary:",
        f"     • Product: {entity_data.product_name}",
        f"     • Category: {taxonomy_data.primary_category}",
        f"     • Trust Score: {trust_score}/100",
        f"     • Risk Score: {risk_score}/100",
        f"     • Confidence: {confidence.value.upper()}",
        f"     • CVEs Found: {cve_summary.total_cves}",
        f"     • Breaches: {incident_report.breach_count}",
        f"     • Citations: {len(citations)}",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ]
    
    return status_update

