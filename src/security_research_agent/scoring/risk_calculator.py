"""Risk and trust score calculation with threat intelligence adjustments."""

import re
from datetime import datetime
from typing import Any, Dict, List, Tuple

from ..llm_utils import extract_json_from_markdown
from ..security_prompts import CISO_SYSTEM_PROMPT, RISK_SCORING_PROMPT
from ..security_state import ConfidenceLevel


def calculate_risk_trust_scores(
    model: Any,
    entity_data: Any,
    cve_summary: Any,
    incident_report: Any,
    vendor_reputation: Any,
    iso_certs: List[Any],
    gdpr_in_certs: bool,
    encryption_mentioned: bool,
    state_additional_data: Dict[str, Any],
    status_update: List[str]
) -> Tuple[int, int, ConfidenceLevel, str, List[str]]:
    """Calculate risk and trust scores using LLM and threat intelligence.
    
    Args:
        model: Initialized LLM model
        entity_data: Entity resolution data
        cve_summary: CVE trend summary
        incident_report: Security incident report
        vendor_reputation: Vendor reputation data
        iso_certs: List of ISO certifications
        gdpr_in_certs: Whether GDPR is in certifications
        encryption_mentioned: Whether encryption is mentioned in docs
        state_additional_data: Additional data from various sources
        status_update: List to append status messages
        
    Returns:
        Tuple of (trust_score, risk_score, confidence, rationale, status_update)
    """
    # Build scoring prompt
    scoring_prompt = RISK_SCORING_PROMPT.format(
        product_name=entity_data.product_name,
        vendor_name=entity_data.vendor_name,
        website=entity_data.website or "Not found",
        total_cves=cve_summary.total_cves,
        critical=cve_summary.critical_count,
        high=cve_summary.high_count,
        kev_count=cve_summary.cisa_kev_count,
        trend=cve_summary.trend,
        breaches=incident_report.breach_count,
        incidents=len(incident_report.incidents),
        soc2=vendor_reputation.claimed_certifications,
        iso_count=len(iso_certs),
        gdpr=gdpr_in_certs,
        encryption=encryption_mentioned,
        tos_found=bool(state_additional_data and state_additional_data.get('tos')),
    )
    
    # Count available data points
    data_points = 0
    if cve_summary.total_cves > 0:
        data_points += cve_summary.total_cves
    if vendor_reputation.security_page_found:
        data_points += len(vendor_reputation.claimed_certifications or [])
    if incident_report.breach_count > 0:
        data_points += incident_report.breach_count
    
    status_update.append(f"  📊 Processing {data_points}+ security data points...")
    status_update.append("")
    status_update.append("  [Step 1/5] 🔍 Analyzing security posture...")
    status_update.append("        ├─ Evaluating CVE severity distribution")
    status_update.append("        ├─ Assessing vulnerability trends")
    status_update.append("        ├─ Checking exploit status (CISA KEV)")
    status_update.append("        └─ Analyzing vendor transparency")
    
    # Invoke LLM for scoring
    messages = [
        {"role": "system", "content": CISO_SYSTEM_PROMPT},
        {"role": "user", "content": scoring_prompt}
    ]
    
    status_update.append("")
    status_update.append("  [Step 2/5] 🤖 Invoking AI reasoning model...")
    scoring_response = model.invoke(messages)
    status_update.append("        └─ ✓ AI analysis complete (reasoning generated)")
    
    # Parse LLM response
    trust_score = 50  # Default
    risk_score = 50
    rationale = "Assessment based on available data"
    
    try:
        content = scoring_response.content if hasattr(scoring_response, 'content') else ""
        scores_data = extract_json_from_markdown(content)
        trust_score = scores_data.get('trust_score', 50)
        risk_score = scores_data.get('risk_score', 50)
        rationale = scores_data.get('rationale', 'Assessment based on available data')
    except Exception:
        # Fallback to regex if JSON parsing fails
        content = scoring_response.content if hasattr(scoring_response, 'content') else ""
        trust_match = re.search(r'trust[_\s]*score[:\s]*(\d+)', content, re.IGNORECASE)
        risk_match = re.search(r'risk[_\s]*score[:\s]*(\d+)', content, re.IGNORECASE)
        
        if trust_match:
            trust_score = int(trust_match.group(1))
        if risk_match:
            risk_score = int(risk_match.group(1))
    
    # Clamp raw LLM scores to [0, 100] to guard against out-of-range values
    trust_score = max(0, min(100, int(trust_score)))
    risk_score = max(0, min(100, int(risk_score)))
    
    status_update.append("")
    status_update.append("  [Step 3/5] 📊 Calculating trust & risk scores...")
    
    # Adjust scores with threat intelligence
    trust_score, risk_score = _adjust_scores_with_threat_intel(
        trust_score, risk_score, state_additional_data, status_update
    )
    
    # Calculate confidence level
    confidence = _calculate_confidence_level(cve_summary, vendor_reputation, incident_report, state_additional_data, status_update)
    
    return trust_score, risk_score, confidence, rationale, status_update


def _adjust_scores_with_threat_intel(
    trust_score: int,
    risk_score: int,
    additional_data: Dict[str, Any],
    status_update: List[str]
) -> Tuple[int, int]:
    """Adjust scores based on threat intelligence data.
    
    Args:
        trust_score: Initial trust score
        risk_score: Initial risk score
        additional_data: Additional data sources
        status_update: List to append status messages
        
    Returns:
        Tuple of (adjusted_trust_score, adjusted_risk_score)
    """
    if not additional_data:
        return trust_score, risk_score
    
    # Check GitHub Advisories
    gh_advisories = additional_data.get('github_advisories', {})
    advisory_penalty = 0
    if gh_advisories.get('advisory_count', 0) > 0:
        advisory_penalty += gh_advisories['advisory_count'] * 0.3
    
    # Check US-CERT Advisories
    cert_advisories = additional_data.get('us_cert', {})
    if cert_advisories.get('advisory_count', 0) > 0:
        advisory_penalty += cert_advisories['advisory_count'] * 0.5
    
    # Check MalwareBazaar
    malware_data = additional_data.get('malwarebazaar', {})
    if malware_data.get('malware_detected'):
        risk_score = min(100, risk_score + 25)
        trust_score = max(0, trust_score - 20)
        status_update.append("        ⚠️  ALERT: Malware samples detected in MalwareBazaar")
    
    # Check URLhaus
    urlhaus_data = additional_data.get('urlhaus', {})
    if urlhaus_data.get('malicious_urls_found', 0) > 0:
        risk_score = min(100, risk_score + 20)
        trust_score = max(0, trust_score - 15)
        status_update.append("        ⚠️  ALERT: Malicious URLs detected in URLhaus")
    
    # Check AlienVault OTX
    otx_data = additional_data.get('otx', {})
    if otx_data.get('threat_found'):
        risk_score = min(100, risk_score + 15)
        trust_score = max(0, trust_score - 10)
        status_update.append("        ⚠️  WARNING: Threat indicators in AlienVault OTX")
    
    # Check WHOIS domain age
    trust_score = _adjust_for_domain_age(additional_data, trust_score, status_update)
    
    # Check company age
    trust_score = _adjust_for_company_age(additional_data, trust_score)
    
    # Apply advisory penalty
    if advisory_penalty > 0:
        penalty_points = int(advisory_penalty)
        # Increase risk based on total advisory volume
        risk_score = min(100, risk_score + penalty_points)
        # Slightly decrease trust as well to reflect advisory history
        trust_penalty = max(1, penalty_points // 2)
        trust_score = max(0, trust_score - trust_penalty)
        status_update.append(
            f"        ⚠️  Additional advisories: {penalty_points} risk points added, trust slightly reduced"
        )
    
    # Final safety clamp
    trust_score = max(0, min(100, int(trust_score)))
    risk_score = max(0, min(100, int(risk_score)))
    
    return trust_score, risk_score


def _adjust_for_domain_age(
    additional_data: Dict[str, Any],
    trust_score: int,
    status_update: List[str]
) -> int:
    """Adjust trust score based on domain age."""
    whois_data = additional_data.get('whois', {})
    if not whois_data.get('creation_date'):
        return trust_score
    
    try:
        creation_date = whois_data['creation_date']
        if isinstance(creation_date, str) and len(creation_date) >= 4:
            year = int(creation_date[:4])
            current_year = datetime.now().year
            domain_age = current_year - year
            
            if domain_age >= 10:
                trust_score = min(100, trust_score + 5)
                status_update.append(f"        ✓ Domain age: {domain_age} years (trust bonus)")
            elif domain_age >= 5:
                trust_score = min(100, trust_score + 3)
            elif domain_age < 2:
                trust_score = max(0, trust_score - 5)
                status_update.append(f"        ⚠️  Domain age: {domain_age} years (new domain)")
    except Exception:
        pass
    
    return trust_score


def _adjust_for_company_age(additional_data: Dict[str, Any], trust_score: int) -> int:
    """Adjust trust score based on company age."""
    company_data = additional_data.get('company', {})
    if not company_data.get('founded_year'):
        return trust_score
    
    try:
        founded_year = int(company_data['founded_year'])
        current_year = datetime.now().year
        company_age = current_year - founded_year
        
        if company_age >= 20:
            trust_score = min(100, trust_score + 5)
        elif company_age >= 10:
            trust_score = min(100, trust_score + 3)
    except Exception:
        pass
    
    return trust_score


def _calculate_confidence_level(
    cve_summary: Any,
    vendor_reputation: Any,
    incident_report: Any,
    additional_data: Dict[str, Any],
    status_update: List[str]
) -> ConfidenceLevel:
    """Calculate confidence level based on data availability."""
    data_sources = 0
    source_names = []
    
    if cve_summary.data_available:
        data_sources += 1
        source_names.append("NVD")
    if vendor_reputation.security_page_found:
        data_sources += 1
        source_names.append("Vendor Pages")
    if incident_report.data_available:
        data_sources += 1
        source_names.append("HIBP")
    
    # Count additional sources that have meaningful signal
    if additional_data:
        # GitHub advisories
        gh_advisories = additional_data.get("github_advisories") or {}
        if gh_advisories.get("advisory_count", 0) > 0:
            data_sources += 1
            source_names.append("GitHub Advisories")
        
        # US-CERT / CISA advisories
        cert_advisories = additional_data.get("us_cert") or {}
        if cert_advisories.get("advisory_count", 0) > 0:
            data_sources += 1
            source_names.append("US-CERT / CISA Advisories")
        
        # MalwareBazaar
        malware_data = additional_data.get("malwarebazaar") or {}
        if malware_data.get("malware_detected"):
            data_sources += 1
            source_names.append("MalwareBazaar")
        
        # URLhaus
        urlhaus_data = additional_data.get("urlhaus") or {}
        if urlhaus_data.get("malicious_urls_found", 0) > 0:
            data_sources += 1
            source_names.append("URLhaus")
        
        # AlienVault OTX
        otx_data = additional_data.get("otx") or {}
        if otx_data.get("threat_found"):
            data_sources += 1
            source_names.append("AlienVault OTX")
        
        # WHOIS domain data
        whois_data = additional_data.get("whois") or {}
        if whois_data.get("creation_date"):
            data_sources += 1
            source_names.append("WHOIS")
        
        # Company profile
        company_data = additional_data.get("company") or {}
        if company_data.get("founded_year"):
            data_sources += 1
            source_names.append("Company Profile")
        
        # Any other additional sources with non-empty payload
        known_keys = {
            "github_advisories",
            "us_cert",
            "malwarebazaar",
            "urlhaus",
            "otx",
            "whois",
            "company",
        }
        for source_key, value in additional_data.items():
            if source_key in known_keys:
                continue
            if value:
                data_sources += 1
                source_names.append(source_key.replace("_", " ").title())
    
    status_update.append(f"        ├─ Data sources available: {data_sources}")
    for i, name in enumerate(source_names[:6], 1):
        status_update.append(f"        │  {'└' if i == min(len(source_names), 6) else '├'}─ {name}")
    if len(source_names) > 6:
        status_update.append(f"        │  └─ ...and {len(source_names) - 6} more")
    
    # Determine confidence
    if data_sources >= 5:
        return ConfidenceLevel.HIGH
    elif data_sources >= 2:
        return ConfidenceLevel.MEDIUM
    else:
        return ConfidenceLevel.LOW

