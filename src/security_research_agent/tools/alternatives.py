"""Security assessment tools - Alternatives."""

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


# Alternative Products (Tavily-based)

@tool
def search_alternatives(product_name: str) -> Dict[str, Any]:
    """Search for product alternatives using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"alternatives": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        
        # Search G2, AlternativeTo, Capterra
        query = f'alternatives to "{product_name}" site:g2.com OR site:alternativeto.net OR site:capterra.com'
        results = tavily.search(query=query, max_results=5)
        
        alternatives = []
        if results and results.get('results'):
            for result in results['results']:
                alternatives.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "summary": result.get('content', '')[:200]
                })
        
        return {
            "alternatives": alternatives,
            "alternative_count": len(alternatives),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"alternatives": [], "error": str(e)}


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




