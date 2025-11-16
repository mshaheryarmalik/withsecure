"""Compliance data parsing from various sources (ToS, Privacy Policy, DPA, etc.)."""

from typing import Any, Dict, List, Tuple

from ..security_state import CertificationDetail, SourceLabel


def parse_compliance_data(
    vendor_reputation: Any,
    additional_data: Dict[str, Any]
) -> Tuple[bool, str, bool, str, str, str, List[CertificationDetail], str]:
    """Parse compliance data from all available sources.
    
    Args:
        vendor_reputation: Vendor reputation data
        additional_data: Additional data from various sources
        
    Returns:
        Tuple of (gdpr_compliant, gdpr_source, encryption_mentioned, encryption_source,
                  data_retention_policy, third_party_sharing, iso_certs, soc2_status)
    """
    gdpr_compliant = False
    gdpr_source = "Unknown"
    encryption_mentioned = False
    encryption_source = "Not stated"
    data_retention_policy = "Not specified"
    third_party_sharing = "Not specified"
    iso_certs = []
    soc2_status = 'not_found'
    
    # Extract ISO certifications from vendor_reputation
    if vendor_reputation.claimed_certifications:
        for cert in vendor_reputation.claimed_certifications:
            if 'ISO' in cert:
                iso_certs.append(CertificationDetail(
                    certification_type=cert,
                    status="claimed",
                    source_label=SourceLabel.VENDOR_STATED
                ))
            if 'SOC' in cert or 'SOC2' in cert or 'SOC 2' in cert:
                soc2_status = 'claimed'
    
    # Parse ToS data
    if additional_data and additional_data.get('tos'):
        tos_data = additional_data['tos']
        if tos_data.get('content'):
            content_lower = tos_data['content'].lower()
            if 'gdpr' in content_lower and not gdpr_compliant:
                gdpr_compliant = True
                gdpr_source = "ToS (vendor-stated)"
            if 'encrypt' in content_lower:
                encryption_mentioned = True
                encryption_source = "ToS (vendor-stated)"
            if 'retention' in content_lower or 'retain' in content_lower:
                data_retention_policy = "Mentioned in ToS (see document)"
            if 'third party' in content_lower or 'third-party' in content_lower:
                third_party_sharing = "Mentioned in ToS (see document)"
    
    # Parse Privacy Policy data
    if additional_data and additional_data.get('privacy'):
        privacy_data = additional_data['privacy']
        if privacy_data.get('gdpr_compliance'):
            gdpr_compliant = True
            gdpr_source = "Privacy Policy (vendor-stated)"
        if privacy_data.get('content'):
            content_lower = privacy_data['content'].lower()
            if 'encrypt' in content_lower and not encryption_mentioned:
                encryption_mentioned = True
                encryption_source = "Privacy Policy (vendor-stated)"
            if ('retention' in content_lower or 'retain' in content_lower) and data_retention_policy == "Not specified":
                data_retention_policy = "Mentioned in Privacy Policy (see document)"
            if ('third party' in content_lower or 'third-party' in content_lower) and third_party_sharing == "Not specified":
                third_party_sharing = "Mentioned in Privacy Policy (see document)"
    
    # Parse DPA data
    if additional_data and additional_data.get('dpa'):
        dpa_data = additional_data['dpa']
        if dpa_data.get('gdpr_mentioned'):
            gdpr_compliant = True
            gdpr_source = "DPA (vendor-stated)"
        if dpa_data.get('content'):
            content_lower = dpa_data['content'].lower()
            if 'encrypt' in content_lower and not encryption_mentioned:
                encryption_mentioned = True
                encryption_source = "DPA (vendor-stated)"
            if ('retention' in content_lower or 'retain' in content_lower) and data_retention_policy == "Not specified":
                data_retention_policy = "Mentioned in DPA (see document)"
    
    # Fallback to vendor certifications for GDPR
    if not gdpr_compliant and 'GDPR' in str(vendor_reputation.claimed_certifications):
        gdpr_compliant = True
        gdpr_source = "Vendor security page"
    
    return (
        gdpr_compliant,
        gdpr_source,
        encryption_mentioned,
        encryption_source,
        data_retention_policy,
        third_party_sharing,
        iso_certs,
        soc2_status
    )


def extract_iso_certifications(vendor_reputation: Any) -> List[CertificationDetail]:
    """Extract ISO certifications from vendor reputation data.
    
    Args:
        vendor_reputation: Vendor reputation data
        
    Returns:
        List of ISO certification details
    """
    iso_certs = []
    if vendor_reputation.claimed_certifications:
        for cert in vendor_reputation.claimed_certifications:
            if 'ISO' in cert:
                iso_certs.append(CertificationDetail(
                    certification_type=cert,
                    status="claimed",
                    source_label=SourceLabel.VENDOR_STATED
                ))
    return iso_certs


def check_gdpr_in_certifications(certifications: List[CertificationDetail]) -> bool:
    """Check if GDPR is mentioned in certifications.
    
    Args:
        certifications: List of certifications
        
    Returns:
        True if GDPR is mentioned
    """
    for cert in certifications:
        if 'GDPR' in cert.certification_type:
            return True
    return False


def check_encryption_mentions(additional_data: Dict[str, Any]) -> bool:
    """Check if encryption is mentioned in any vendor documents.
    
    Args:
        additional_data: Additional data from various sources
        
    Returns:
        True if encryption is mentioned
    """
    if not additional_data:
        return False
    
    # Check ToS
    if additional_data.get('tos') and additional_data['tos'].get('content'):
        if 'encrypt' in additional_data['tos']['content'].lower():
            return True
    
    # Check Privacy Policy
    if additional_data.get('privacy') and additional_data['privacy'].get('content'):
        if 'encrypt' in additional_data['privacy']['content'].lower():
            return True
    
    # Check DPA
    if additional_data.get('dpa') and additional_data['dpa'].get('content'):
        if 'encrypt' in additional_data['dpa']['content'].lower():
            return True
    
    return False

