"""Security assessment tools - Vendor Compliance."""

import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool

from ..security_state import SourceLabel
from ._utils import (
    create_tavily_client,
    NVD_API_URL,
    CISA_KEV_URL,
    VIRUSTOTAL_API_URL,
    HIBP_API_URL,
    GITHUB_GRAPHQL_URL,
    MALWAREBAZAAR_API_URL,
    URLHAUS_API_URL,
    ALIENVAULT_OTX_API_URL,
)


# Vendor Security Page Tools

@tool
def fetch_vendor_security_info(website_url: str, vendor_name: str) -> Dict[str, Any]:
    """Fetch vendor security/PSIRT page information using Tavily.
    
    Args:
        website_url: Vendor's main website URL
        vendor_name: Vendor name
        
    Returns:
        Dictionary containing vendor security information
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    
    if not tavily_api_key:
        return {
            "vendor_name": vendor_name,
            "founded_year": None,
            "security_page_found": False,
            "security_contact": None,
            "claimed_certifications": [],
            "security_advisories_found": 0,
            "source_label": SourceLabel.VENDOR_STATED.value,
            "note": "Tavily API key not configured"
        }
    
    try:
        from urllib.parse import urlparse
        
        tavily = create_tavily_client(tavily_api_key)
        domain = urlparse(website_url).netloc or urlparse(website_url).path
        
        # Search for vendor security page
        query = f"site:{domain} security compliance certifications SOC2 ISO27001 GDPR HIPAA PCI"
        results = tavily.search(query=query, max_results=3)
        
        security_page_found = False
        security_contact = None
        claimed_certifications = []
        
        # Parse results
        if results and results.get('results'):
            security_page_found = True
            
            for result in results['results']:
                content = (result.get('content', '') + ' ' + result.get('title', '')).lower()
                
                # Look for certifications
                if 'soc 2' in content or 'soc2' in content or 'soc-2' in content:
                    claimed_certifications.append('SOC 2 Type II')
                if 'iso 27001' in content or 'iso27001' in content:
                    claimed_certifications.append('ISO 27001')
                if 'iso 27017' in content:
                    claimed_certifications.append('ISO 27017')
                if 'iso 27018' in content:
                    claimed_certifications.append('ISO 27018')
                if 'gdpr' in content:
                    claimed_certifications.append('GDPR Compliant')
                if 'hipaa' in content:
                    claimed_certifications.append('HIPAA Compliant')
                if 'pci dss' in content or 'pci-dss' in content:
                    claimed_certifications.append('PCI DSS')
                if 'fedramp' in content:
                    claimed_certifications.append('FedRAMP')
                
                # Look for security contact
                email_pattern = r'security@[\w\.-]+'
                emails = re.findall(email_pattern, content)
                if emails and not security_contact:
                    security_contact = emails[0]
        
        return {
            "vendor_name": vendor_name,
            "founded_year": None,
            "security_page_found": security_page_found,
            "security_contact": security_contact,
            "claimed_certifications": list(set(claimed_certifications)),
            "security_advisories_found": len(results.get('results', [])) if security_page_found else 0,
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
            "error": str(e)
        }




# Legal Documents (Tavily-based)

@tool
def fetch_terms_of_service(website_url: str, product_name: str) -> Dict[str, Any]:
    """Fetch Terms of Service using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"found": False, "note": "Tavily API key not configured"}
    
    try:
        from urllib.parse import urlparse
        
        tavily = create_tavily_client(tavily_api_key)
        domain = urlparse(website_url).netloc or urlparse(website_url).path
        
        query = f"site:{domain} terms of service agreement"
        results = tavily.search(query=query, max_results=2)
        
        if results and results.get('results'):
            content = results['results'][0].get('content', '')
            
            return {
                "found": True,
                "url": results['results'][0].get('url'),
                "key_terms": {
                    "data_ownership": "vendor-stated" if "data" in content.lower() else "not found",
                    "liability_limit": "present" if "liability" in content.lower() else "not found",
                    "termination": "present" if "termination" in content.lower() else "not found"
                },
                "source_label": SourceLabel.VENDOR_STATED.value
            }
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}


@tool
def fetch_privacy_policy(website_url: str, product_name: str) -> Dict[str, Any]:
    """Fetch Privacy Policy using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"found": False, "note": "Tavily API key not configured"}
    
    try:
        from urllib.parse import urlparse
        
        tavily = create_tavily_client(tavily_api_key)
        domain = urlparse(website_url).netloc or urlparse(website_url).path
        
        query = f"site:{domain} privacy policy data collection"
        results = tavily.search(query=query, max_results=2)
        
        if results and results.get('results'):
            content = results['results'][0].get('content', '').lower()
            
            return {
                "found": True,
                "url": results['results'][0].get('url'),
                "gdpr_compliance": "gdpr" in content,
                "ccpa_compliance": "ccpa" in content,
                "data_retention": "retention" in content,
                "third_party_sharing": "third party" in content or "third-party" in content,
                "source_label": SourceLabel.VENDOR_STATED.value
            }
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}


@tool
def fetch_dpa(website_url: str, product_name: str) -> Dict[str, Any]:
    """Fetch Data Processing Agreement using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"found": False, "note": "Tavily API key not configured"}
    
    try:
        from urllib.parse import urlparse
        
        tavily = create_tavily_client(tavily_api_key)
        domain = urlparse(website_url).netloc or urlparse(website_url).path
        
        query = f"site:{domain} data processing agreement DPA GDPR"
        results = tavily.search(query=query, max_results=2)
        
        if results and results.get('results'):
            content = results['results'][0].get('content', '').lower()
            
            return {
                "found": True,
                "url": results['results'][0].get('url'),
                "subprocessors_listed": "subprocessor" in content,
                "scc_mentioned": "standard contractual clauses" in content or "scc" in content,
                "breach_notification": "breach" in content and "notification" in content,
                "gdpr_mentioned": "gdpr" in content or "general data protection" in content,
                "content_preview": results['results'][0].get('content', '')[:500],
                "source_label": SourceLabel.VENDOR_STATED.value
            }
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}




# FedRAMP and App Stores (Tavily-based)

@tool
def check_fedramp(product_name: str) -> Dict[str, Any]:
    """Check FedRAMP authorization using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"authorized": False, "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:marketplace.fedramp.gov "{product_name}"'
        results = tavily.search(query=query, max_results=2)
        
        if results and results.get('results'):
            content = results['results'][0].get('content', '').lower()
            
            # Determine authorization level
            level = None
            if 'high' in content:
                level = "High"
            elif 'moderate' in content:
                level = "Moderate"
            elif 'low' in content:
                level = "Low"
            
            return {
                "authorized": True,
                "level": level,
                "url": results['results'][0].get('url'),
                "source_label": SourceLabel.INDEPENDENT.value
            }
        
        return {"authorized": False}
    except Exception as e:
        return {"authorized": False, "error": str(e)}


@tool
def search_app_store_info(product_name: str) -> Dict[str, Any]:
    """Search app store information using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"found": False, "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'"{product_name}" site:chrome.google.com/webstore OR site:apps.apple.com privacy permissions'
        results = tavily.search(query=query, max_results=3)
        
        if results and results.get('results'):
            return {
                "found": True,
                "listings": [
                    {
                        "platform": "Chrome" if "chrome" in r.get('url', '') else "Apple" if "apple" in r.get('url', '') else "Other",
                        "url": r.get('url'),
                        "summary": r.get('content', '')[:200]
                    }
                    for r in results['results']
                ],
                "source_label": SourceLabel.INDEPENDENT.value
            }
        
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}




