"""Security assessment tools - Threat Intel."""

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


# Threat Intelligence APIs

@tool
def lookup_malwarebazaar(sha1_hash: Optional[str] = None, product_name: Optional[str] = None) -> Dict[str, Any]:
    """Query MalwareBazaar API for malware information."""
    try:
        api_url = "https://mb-api.abuse.ch/api/v1/"
        
        if sha1_hash:
            data = {"query": "get_info", "hash": sha1_hash}
        elif product_name:
            data = {"query": "get_taginfo", "tag": product_name, "limit": 10}
        else:
            return {"found": False, "note": "No search parameter provided"}
        
        response = requests.post(api_url, data=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('query_status') == 'ok':
                return {
                    "found": True,
                    "malware_detected": True,
                    "data": result.get('data', []),
                    "source_label": SourceLabel.INDEPENDENT.value
                }
        
        return {"found": False, "malware_detected": False}
    except Exception as e:
        return {"found": False, "error": str(e)}


@tool
def lookup_urlhaus(domain: str) -> Dict[str, Any]:
    """Query URLhaus API for malicious URL information."""
    try:
        api_url = "https://urlhaus-api.abuse.ch/v1/host/"
        data = {"host": domain}
        
        response = requests.post(api_url, data=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('query_status') == 'ok':
                urls = result.get('urls', [])
                return {
                    "malicious_urls_found": len(urls),
                    "urls": urls[:5],  # First 5
                    "source_label": SourceLabel.INDEPENDENT.value
                }
        
        return {"malicious_urls_found": 0}
    except Exception as e:
        return {"malicious_urls_found": 0, "error": str(e)}


@tool
def lookup_alienvault_otx(domain: str) -> Dict[str, Any]:
    """Query AlienVault OTX for threat intelligence."""
    try:
        api_url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
        
        response = requests.get(api_url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            return {
                "pulse_count": result.get('pulse_info', {}).get('count', 0),
                "reputation": result.get('reputation', 0),
                "threat_found": result.get('pulse_info', {}).get('count', 0) > 0,
                "source_label": SourceLabel.INDEPENDENT.value
            }
        
        return {"pulse_count": 0, "threat_found": False}
    except Exception as e:
        return {"pulse_count": 0, "error": str(e)}




