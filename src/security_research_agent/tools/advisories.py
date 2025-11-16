"""Security assessment tools - Advisories."""

import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus

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


@tool
def search_cisa_alerts(product_name: str) -> Dict[str, Any]:
    """Search CISA alerts feed for product mentions (no API key required)."""
    term = (product_name or "").strip()
    if not term:
        return {"alerts": [], "match_count": 0, "data_available": False}
    
    url = "https://www.cisa.gov/sites/default/files/feeds/alerts.json"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        )
    }
    
    try:
        response = requests.get(url, timeout=12, headers=headers)
        if response.status_code != 200:
            return {
                "alerts": [],
                "match_count": 0,
                "data_available": False,
                "error": f"CISA alerts feed returned status {response.status_code}",
            }
        
        data = response.json()
        alerts: List[Dict[str, Any]] = []
        if isinstance(data, dict):
            for key in ("alerts", "items", "results", "data"):
                value = data.get(key)
                if isinstance(value, list):
                    alerts = value
                    break
        elif isinstance(data, list):
            alerts = data
        
        matches: List[Dict[str, Any]] = []
        term_lower = term.lower()
        for entry in alerts:
            if not isinstance(entry, dict):
                continue
            title = str(entry.get("title") or entry.get("name") or "")
            summary = str(entry.get("summary") or entry.get("description") or "")
            combined = f"{title} {summary}".lower()
            if term_lower in combined:
                matches.append({
                    "title": title,
                    "summary": summary[:300] if summary else None,
                    "url": entry.get("url") or entry.get("link") or entry.get("uri"),
                    "date": entry.get("date") or entry.get("published") or entry.get("publish_date"),
                })
            if len(matches) >= 5:
                break
        
        return {
            "alerts": matches,
            "match_count": len(matches),
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": bool(matches),
            "source_url": url,
        }
    except Exception as e:
        return {
            "alerts": [],
            "match_count": 0,
            "data_available": False,
            "error": str(e),
        }


@tool
def search_packetstorm_advisories(product_name: str) -> Dict[str, Any]:
    """Fetch Packet Storm advisories referencing the product."""
    term = (product_name or "").strip()
    if not term:
        return {"advisories": [], "match_count": 0, "data_available": False}
    
    query_url = f"https://packetstormsecurity.com/search/files/?q={quote_plus(term)}&s=files"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        )
    }
    
    try:
        response = requests.get(query_url, timeout=12, headers=headers)
        if response.status_code != 200:
            return {
                "advisories": [],
                "match_count": 0,
                "data_available": False,
                "error": f"Packet Storm search returned status {response.status_code}",
            }
        
        soup = BeautifulSoup(response.text, "html.parser")
        matches: List[Dict[str, Any]] = []
        term_lower = term.lower()
        
        for dl in soup.select("div#content dl"):
            link = dl.find("a")
            if not link or not link.get("href"):
                continue
            title = link.get_text(strip=True)
            if not title:
                continue
            description_node = dl.find("dd")
            summary = description_node.get_text(" ", strip=True) if description_node else ""
            combined = f"{title} {summary}".lower()
            if term_lower not in combined:
                continue
            href = link["href"]
            if not href.startswith("http"):
                href = f"https://packetstormsecurity.com{href}"
            
            matches.append({
                "title": title,
                "summary": summary[:300] if summary else None,
                "url": href,
            })
            if len(matches) >= 5:
                break
        
        return {
            "advisories": matches,
            "match_count": len(matches),
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": bool(matches),
            "source_url": query_url,
        }
    except Exception as e:
        return {
            "advisories": [],
            "match_count": 0,
            "data_available": False,
            "error": str(e),
        }




