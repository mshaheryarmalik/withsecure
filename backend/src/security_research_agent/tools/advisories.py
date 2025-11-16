"""Security assessment tools - Advisories."""

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


# Security Advisories (Tavily-based)

@tool
def search_us_cert_advisories(product_name: str) -> Dict[str, Any]:
    """Search US-CERT/CISA advisories using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"advisories": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:cisa.gov "{product_name}" advisory vulnerability'
        results = tavily.search(query=query, max_results=5)
        
        advisories = []
        if results and results.get('results'):
            for result in results['results']:
                advisories.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "summary": result.get('content', '')[:250]
                })
        
        return {
            "advisories": advisories,
            "advisory_count": len(advisories),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"advisories": [], "error": str(e)}


@tool
def search_cert_cc_advisories(product_name: str) -> Dict[str, Any]:
    """Search CERT/CC advisories using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"advisories": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:kb.cert.org "{product_name}" vulnerability'
        results = tavily.search(query=query, max_results=3)
        
        advisories = []
        if results and results.get('results'):
            for result in results['results']:
                advisories.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "summary": result.get('content', '')[:250]
                })
        
        return {
            "advisories": advisories,
            "advisory_count": len(advisories),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"advisories": [], "error": str(e)}




