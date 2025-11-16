"""Citation building from various data sources."""

from datetime import datetime
from typing import Any, Dict, List

from ..security_state import Citation, SourceLabel


def build_citations(
    entity_data: Any,
    cve_summary: Any,
    additional_data: Dict[str, Any]
) -> List[Citation]:
    """Build citations from all available data sources.
    
    Args:
        entity_data: Entity resolution data
        cve_summary: CVE trend summary
        additional_data: Additional data from various sources
        
    Returns:
        List of citations
    """
    citations = []
    
    # Citation mapping for all sources
    citation_map = {
        'nvd': ("https://nvd.nist.gov", "NVD", SourceLabel.INDEPENDENT, "CVE data and vulnerability counts"),
        'github_advisories': ("https://github.com/advisories", "GitHub Advisories", SourceLabel.INDEPENDENT, "Security advisories"),
        'us_cert': ("https://www.cisa.gov/uscert/", "US-CERT", SourceLabel.INDEPENDENT, "CERT advisories"),
        'hibp': ("https://haveibeenpwned.com", "HaveIBeenPwned", SourceLabel.INDEPENDENT, "Breach data"),
        'news': ("Tavily Search", "Security News", SourceLabel.INDEPENDENT, "Security incident reports"),
        'malwarebazaar': ("https://bazaar.abuse.ch", "MalwareBazaar", SourceLabel.INDEPENDENT, "Malware sample database"),
        'urlhaus': ("https://urlhaus.abuse.ch", "URLhaus", SourceLabel.INDEPENDENT, "Malicious URL detection"),
        'otx': ("https://otx.alienvault.com", "AlienVault OTX", SourceLabel.INDEPENDENT, "Threat intelligence"),
        'whois': ("WHOIS Lookup", "Domain WHOIS", SourceLabel.INDEPENDENT, "Domain registration data"),
        'fedramp': ("https://marketplace.fedramp.gov", "FedRAMP", SourceLabel.INDEPENDENT, "Government cloud authorization"),
        'tos': (entity_data.website, "Terms of Service", SourceLabel.VENDOR_STATED, "Legal terms"),
        'privacy': (entity_data.website, "Privacy Policy", SourceLabel.VENDOR_STATED, "Privacy commitments"),
        'dpa': (entity_data.website, "Data Processing Agreement", SourceLabel.VENDOR_STATED, "Data handling terms"),
        'company': ("Tavily Search", "Company Info", SourceLabel.INDEPENDENT, "Company background"),
        'alternatives': ("Tavily Search", "Alternatives", SourceLabel.INDEPENDENT, "Alternative products"),
    }
    
    # Add NVD citation if CVE data exists
    if cve_summary.citation:
        url, name, label, claim = citation_map['nvd']
        citations.append(Citation(
            source_url=url,
            source_type=name,
            source_label=label,
            accessed_date=datetime.now().strftime("%Y-%m-%d"),
            claim=claim
        ))
    
    # Add citations from additional_data
    if additional_data:
        for source_key, source_data in additional_data.items():
            if source_key in citation_map and source_data:  # Only add if data exists
                url, name, label, claim = citation_map[source_key]
                citations.append(Citation(
                    source_url=url,
                    source_type=name,
                    source_label=label,
                    accessed_date=datetime.now().strftime("%Y-%m-%d"),
                    claim=claim
                ))
    
    return citations


def generate_insufficient_notes(
    cve_data: Dict[str, Any],
    vendor_data: Dict[str, Any],
    incident_data: Dict[str, Any],
    additional_data: Dict[str, Any]
) -> List[str]:
    """Generate notes about insufficient data areas.
    
    Args:
        cve_data: CVE data
        vendor_data: Vendor data
        incident_data: Incident data
        additional_data: Additional data sources
        
    Returns:
        List of insufficiency notes
    """
    insufficient_notes = []
    
    # Check CVE data
    if not cve_data or not cve_data.get('data_available'):
        insufficient_notes.append("CVE data unavailable")
    
    # Check vendor compliance data
    has_compliance_data = False
    if vendor_data and vendor_data.get('security_page_found'):
        has_compliance_data = True
    if additional_data:
        if additional_data.get('tos') or additional_data.get('privacy') or additional_data.get('dpa'):
            has_compliance_data = True
    
    if not has_compliance_data:
        insufficient_notes.append("Limited vendor compliance documentation")
    
    # Check incident data
    has_incident_data = False
    if incident_data and incident_data.get('data_available'):
        has_incident_data = True
    if additional_data and additional_data.get('news'):
        has_incident_data = True
    
    if not has_incident_data:
        insufficient_notes.append("Incident data limited (paid APIs recommended)")
    
    return insufficient_notes

