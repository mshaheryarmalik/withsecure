"""Security assessment tools - Company Info."""

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


# Company Information (Tavily + APIs)

@tool
def lookup_whois(domain: str) -> Dict[str, Any]:
    """Lookup WHOIS information for a domain."""
    try:
        import whois
        
        w = whois.whois(domain)
        
        return {
            "domain": domain,
            "creation_date": str(w.creation_date) if w.creation_date else None,
            "registrar": w.registrar,
            "organization": w.org,
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"domain": domain, "error": str(e)}


@tool
def search_company_info(company_name: str) -> Dict[str, Any]:
    """Search for company information using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"found": False, "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'"{company_name}" company founded headquarters employees'
        results = tavily.search(query=query, max_results=3)
        
        if results and results.get('results'):
            content = ' '.join([r.get('content', '') for r in results['results']])
            
            return {
                "found": True,
                "summary": content[:500],
                "sources": [r.get('url') for r in results['results']],
                "source_label": SourceLabel.INDEPENDENT.value
            }
        
        return {"found": False}
    except Exception as e:
        return {"found": False, "error": str(e)}




