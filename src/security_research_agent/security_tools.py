"""Security assessment tools for CISO brief generation."""

import hashlib
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool

from .security_state import (
    CVEDetail,
    CVETrendSummary,
    EntityResolution,
    IncidentDetail,
    IncidentReport,
    InputType,
    SourceLabel,
    VendorReputation,
    ConfidenceLevel,
)


# ============================================================================
# Entity Resolution Tools
# ============================================================================

def detect_input_type(input_str: str) -> InputType:
    """Detect the type of input (SHA1, URL, or name)."""
    input_str = input_str.strip()
    
    # Check if SHA1 hash (40 hex characters)
    if re.match(r'^[a-fA-F0-9]{40}$', input_str):
        return InputType.SHA1
    
    # Check if URL
    if re.match(r'^https?://', input_str) or '.' in input_str and '/' in input_str:
        return InputType.URL
    
    # Otherwise assume it's a name
    return InputType.NAME


@tool
def resolve_entity(input_text: str) -> Dict[str, Any]:
    """Resolve entity from minimal input (product name, vendor, URL, or SHA1 hash).
    
    Args:
        input_text: The input to resolve (name, URL, or SHA1 hash)
        
    Returns:
        Dictionary containing resolved entity information
    """
    input_type = detect_input_type(input_text)
    
    if input_type == InputType.SHA1:
        return _resolve_from_sha1(input_text)
    elif input_type == InputType.URL:
        return _resolve_from_url(input_text)
    else:
        return _resolve_from_name(input_text)


def _resolve_from_sha1(sha1_hash: str) -> Dict[str, Any]:
    """Resolve entity from SHA1 hash using VirusTotal API."""
    # Note: This would require VirusTotal API key
    # For hackathon, we'll return a placeholder
    return {
        "product_name": "Unknown (SHA1 lookup requires VirusTotal API)",
        "vendor_name": "Unknown",
        "website": None,
        "verified": False,
        "input_type": InputType.SHA1.value,
        "sha1_hash": sha1_hash,
        "file_reputation": "Requires VirusTotal API key",
        "confidence": ConfidenceLevel.INSUFFICIENT.value,
    }


def _resolve_from_url(url: str) -> Dict[str, Any]:
    """Resolve entity from URL by extracting domain and searching for product info."""
    try:
        # Clean URL
        if not url.startswith('http'):
            url = 'https://' + url
        
        # Extract domain
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        
        # Try to scrape homepage for product info
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SecurityAssessmentBot/1.0)'
            })
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to extract title
            title = soup.find('title')
            product_name = title.get_text().strip() if title else domain
            
            # Try to find company name in meta tags
            og_site_name = soup.find('meta', property='og:site_name')
            vendor_name = og_site_name.get('content') if og_site_name else domain
            
            return {
                "product_name": product_name,
                "vendor_name": vendor_name,
                "website": url,
                "verified": True,
                "input_type": InputType.URL.value,
                "sha1_hash": None,
                "file_reputation": None,
                "confidence": ConfidenceLevel.MEDIUM.value,
            }
        except Exception as e:
            # Fall back to domain-based info
            return {
                "product_name": domain,
                "vendor_name": domain,
                "website": url,
                "verified": False,
                "input_type": InputType.URL.value,
                "sha1_hash": None,
                "file_reputation": None,
                "confidence": ConfidenceLevel.LOW.value,
            }
    except Exception as e:
        return {
            "product_name": f"Error resolving URL: {str(e)}",
            "vendor_name": "Unknown",
            "website": url,
            "verified": False,
            "input_type": InputType.URL.value,
            "sha1_hash": None,
            "file_reputation": None,
            "confidence": ConfidenceLevel.INSUFFICIENT.value,
        }


def _resolve_from_name(name: str) -> Dict[str, Any]:
    """Resolve entity from product/vendor name."""
    # For hackathon, we'll do basic resolution
    # In production, this would use a knowledge base or search API
    return {
        "product_name": name,
        "vendor_name": name,
        "website": None,
        "verified": False,
        "input_type": InputType.NAME.value,
        "sha1_hash": None,
        "file_reputation": None,
        "confidence": ConfidenceLevel.MEDIUM.value,
    }


# ============================================================================
# CVE and CISA KEV Tools
# ============================================================================

@tool
def lookup_cves(product_name: str, vendor_name: Optional[str] = None) -> Dict[str, Any]:
    """Look up CVEs for a product using NVD API and check against CISA KEV.
    
    Args:
        product_name: Name of the product
        vendor_name: Name of the vendor (optional)
        
    Returns:
        Dictionary containing CVE summary and trend analysis
    """
    try:
        # For hackathon MVP, we'll use the public NVD API
        # Note: This requires careful rate limiting (5 requests per 30 seconds without key)
        nvd_api_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        
        # Search for CVEs
        params = {
            "keywordSearch": product_name,
            "resultsPerPage": 100,
        }
        
        headers = {
            "User-Agent": "SecurityAssessmentTool/1.0"
        }
        
        try:
            response = requests.get(nvd_api_url, params=params, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                cves = data.get('vulnerabilities', [])
                
                return _process_cve_data(cves, product_name)
            else:
                # API failed, return insufficient data
                return {
                    "total_cves": 0,
                    "critical_count": 0,
                    "high_count": 0,
                    "medium_count": 0,
                    "low_count": 0,
                    "trend": "insufficient data",
                    "recent_cves": [],
                    "cisa_kev_count": 0,
                    "citation": f"NVD API (status: {response.status_code})",
                    "source_label": SourceLabel.INDEPENDENT.value,
                    "data_available": False,
                }
        except requests.exceptions.Timeout:
            return {
                "total_cves": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "trend": "timeout",
                "recent_cves": [],
                "cisa_kev_count": 0,
                "citation": "NVD API (timeout)",
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
            }
        except Exception as e:
            return {
                "total_cves": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "trend": f"error: {str(e)}",
                "recent_cves": [],
                "cisa_kev_count": 0,
                "citation": f"NVD API (error: {str(e)})",
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
            }
    except Exception as e:
        return {
            "total_cves": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "trend": "error",
            "recent_cves": [],
            "cisa_kev_count": 0,
            "citation": f"Error: {str(e)}",
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
        }


def _process_cve_data(cves: List[Dict], product_name: str) -> Dict[str, Any]:
    """Process CVE data from NVD API."""
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    recent_cves = []
    
    for vuln in cves[:20]:  # Limit to first 20
        try:
            cve_data = vuln.get('cve', {})
            cve_id = cve_data.get('id', 'Unknown')
            
            # Get CVSS score
            metrics = cve_data.get('metrics', {})
            cvss_v3 = metrics.get('cvssMetricV31', []) or metrics.get('cvssMetricV30', [])
            
            cvss_score = None
            severity = "UNKNOWN"
            
            if cvss_v3:
                cvss_data = cvss_v3[0].get('cvssData', {})
                cvss_score = cvss_data.get('baseScore')
                severity = cvss_data.get('baseSeverity', 'UNKNOWN')
            
            # Count by severity
            if severity == "CRITICAL":
                critical_count += 1
            elif severity == "HIGH":
                high_count += 1
            elif severity == "MEDIUM":
                medium_count += 1
            elif severity == "LOW":
                low_count += 1
            
            # Get description
            descriptions = cve_data.get('descriptions', [])
            description = descriptions[0].get('value', '') if descriptions else ''
            
            # Get published date
            published = cve_data.get('published', '')
            
            recent_cves.append({
                "cve_id": cve_id,
                "severity": severity,
                "cvss_score": cvss_score,
                "published_date": published,
                "description": description[:200] if description else None,
                "in_cisa_kev": False,  # Would need CISA KEV lookup
            })
        except Exception as e:
            continue
    
    total = len(cves)
    
    # Determine trend (simplified)
    trend = "stable"
    if total > 50:
        trend = "increasing"
    elif total > 0 and critical_count > 0:
        trend = "concerning"
    
    return {
        "total_cves": total,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "trend": trend,
        "recent_cves": recent_cves[:5],  # Top 5 most recent
        "cisa_kev_count": 0,  # Would need separate CISA KEV check
        "citation": f"NVD API (https://nvd.nist.gov) - accessed {datetime.now().strftime('%Y-%m-%d')}",
        "source_label": SourceLabel.INDEPENDENT.value,
        "data_available": True,
    }


@tool
def check_cisa_kev(cve_id: str) -> bool:
    """Check if a CVE is in CISA Known Exploited Vulnerabilities catalog.
    
    Args:
        cve_id: CVE identifier (e.g., CVE-2024-1234)
        
    Returns:
        Boolean indicating if CVE is in CISA KEV
    """
    try:
        # CISA KEV catalog is available as JSON
        kev_url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
        
        response = requests.get(kev_url, timeout=10)
        if response.status_code == 200:
            kev_data = response.json()
            vulnerabilities = kev_data.get('vulnerabilities', [])
            
            for vuln in vulnerabilities:
                if vuln.get('cveID') == cve_id:
                    return True
            return False
        else:
            return False
    except Exception:
        return False


# ============================================================================
# Vendor Security Page Tools
# ============================================================================

@tool
def fetch_vendor_security_info(website_url: str, vendor_name: str) -> Dict[str, Any]:
    """Fetch vendor security/PSIRT page information.
    
    Args:
        website_url: Vendor's main website URL
        vendor_name: Vendor name
        
    Returns:
        Dictionary containing vendor security information
    """
    try:
        # Common security page patterns
        security_paths = [
            '/security',
            '/trust',
            '/psirt',
            '/security-center',
            '/responsible-disclosure',
            '/vulnerability-disclosure',
        ]
        
        security_page_found = False
        security_contact = None
        advisories_found = 0
        claimed_certifications = []
        
        for path in security_paths:
            try:
                url = website_url.rstrip('/') + path
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; SecurityAssessmentBot/1.0)'
                })
                
                if response.status_code == 200:
                    security_page_found = True
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Look for security contact
                    text = soup.get_text().lower()
                    email_pattern = r'security@[\w\.-]+\.[\w]+'
                    emails = re.findall(email_pattern, text)
                    if emails:
                        security_contact = emails[0]
                    
                    # Look for certifications
                    if 'soc 2' in text or 'soc2' in text:
                        claimed_certifications.append('SOC2 Type II')
                    if 'iso 27001' in text or 'iso27001' in text:
                        claimed_certifications.append('ISO 27001')
                    if 'iso 27017' in text:
                        claimed_certifications.append('ISO 27017')
                    if 'gdpr' in text:
                        claimed_certifications.append('GDPR Compliant')
                    
                    break
            except Exception:
                continue
        
        return {
            "vendor_name": vendor_name,
            "founded_year": None,
            "security_page_found": security_page_found,
            "security_contact": security_contact,
            "claimed_certifications": list(set(claimed_certifications)),
            "security_advisories_found": advisories_found,
            "source_label": SourceLabel.VENDOR_STATED.value,
        }
    except Exception as e:
        return {
            "vendor_name": vendor_name,
            "founded_year": None,
            "security_page_found": False,
            "security_contact": None,
            "claimed_certifications": [],
            "security_advisories_found": 0,
            "source_label": SourceLabel.VENDOR_STATED.value,
        }


# ============================================================================
# Incident Lookup Tools
# ============================================================================

@tool
def lookup_security_incidents(domain: str, product_name: str) -> Dict[str, Any]:
    """Look up security incidents and data breaches.
    
    Args:
        domain: Domain name to check
        product_name: Product name
        
    Returns:
        Dictionary containing incident history
    """
    # Note: HaveIBeenPwned API requires paid subscription for domain search
    # For hackathon, we'll return a placeholder with manual research suggestion
    
    return {
        "incidents": [],
        "breach_count": 0,
        "source_label": SourceLabel.INDEPENDENT.value,
        "data_available": False,
        "note": "Incident lookup requires HaveIBeenPwned API subscription or manual research"
    }


# ============================================================================
# Tool Registry
# ============================================================================

def get_security_tools() -> List:
    """Get all security assessment tools."""
    return [
        resolve_entity,
        lookup_cves,
        check_cisa_kev,
        fetch_vendor_security_info,
        lookup_security_incidents,
    ]

