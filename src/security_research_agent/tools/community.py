"""Security assessment tools - Community."""

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


# OSINT Sources (Tavily-based)

@tool
def search_reddit_security(product_name: str) -> Dict[str, Any]:
    """Search Reddit security communities using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"discussions": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:reddit.com "{product_name}" security vulnerability breach'
        results = tavily.search(query=query, max_results=5)
        
        discussions = []
        if results and results.get('results'):
            for result in results['results']:
                discussions.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "snippet": result.get('content', '')[:200]
                })
        
        return {
            "discussions": discussions,
            "discussion_count": len(discussions),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"discussions": [], "error": str(e)}


@tool
def search_github_issues(product_name: str) -> Dict[str, Any]:
    """Search GitHub issues using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"issues": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:github.com "{product_name}" security vulnerability issue'
        results = tavily.search(query=query, max_results=5)
        
        issues = []
        if results and results.get('results'):
            for result in results['results']:
                issues.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "snippet": result.get('content', '')[:200]
                })
        
        return {
            "issues": issues,
            "issue_count": len(issues),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"issues": [], "error": str(e)}


@tool
def search_stackoverflow(product_name: str) -> Dict[str, Any]:
    """Search StackOverflow using Tavily."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {"questions": [], "note": "Tavily API key not configured"}
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        query = f'site:stackoverflow.com "{product_name}" security vulnerability'
        results = tavily.search(query=query, max_results=5)
        
        questions = []
        if results and results.get('results'):
            for result in results['results']:
                questions.append({
                    "title": result.get('title'),
                    "url": result.get('url'),
                    "snippet": result.get('content', '')[:200]
                })
        
        return {
            "questions": questions,
            "question_count": len(questions),
            "source_label": SourceLabel.INDEPENDENT.value
        }
    except Exception as e:
        return {"questions": [], "error": str(e)}




