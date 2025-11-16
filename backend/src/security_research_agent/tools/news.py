"""Security assessment tools - News."""

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


# News & Incident Databases (Tavily-based)

@tool
def search_security_news(product_name: str, days: int = 365) -> Dict[str, Any]:
    """Search security news using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"incidents": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        
        # Search for security incidents
        query = f'"{product_name}" security breach vulnerability incident hack'
        results = tavily.search(query=query, max_results=5, search_depth="advanced")
        
        incidents = []
        if results and results.get('results'):
            for result in results['results']:
                content = result.get('content', '')
                if any(word in content.lower() for word in ['breach', 'vulnerability', 'hack', 'exploit', 'cve']):
                    incidents.append({
                        "title": result.get('title'),
                        "url": result.get('url'),
                        "summary": content[:300],
                        "published_date": result.get('published_date', 'Unknown')
                    })
        
        return {
            "incidents": incidents,
            "incident_count": len(incidents),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"incidents": [], "error": str(e)}


@tool
def search_databreaches_net(product_name: str) -> Dict[str, Any]:
    """Search DataBreaches.net using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"breaches": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:databreaches.net "{product_name}"'
        results = tavily.search(query=query, max_results=3)
        
        breaches = []
        if results and results.get('results'):
            for result in results['results']:
                breaches.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "summary": result.get('content', '')[:200]
                })
        
        return {
            "breaches": breaches,
            "breach_count": len(breaches),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"breaches": [], "error": str(e)}


@tool
def search_privacy_rights_clearinghouse(product_name: str) -> Dict[str, Any]:
    """Search Privacy Rights Clearinghouse using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"breaches": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:privacyrights.org "{product_name}" data breach'
        results = tavily.search(query=query, max_results=3)
        
        breaches = []
        if results and results.get('results'):
            for result in results['results']:
                breaches.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "summary": result.get('content', '')[:200]
                })
        
        return {
            "breaches": breaches,
            "breach_count": len(breaches),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"breaches": [], "error": str(e)}




