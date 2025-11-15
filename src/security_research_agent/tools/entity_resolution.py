"""Entity resolution tools - resolve product/vendor from name, URL, or SHA1 hash."""

import json
import os
import re
from typing import Any, Dict
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from ..security_state import (
    ConfidenceLevel,
    InputType,
)
from ._utils import (
    create_tavily_client,
    VIRUSTOTAL_API_URL,
)


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
    api_key = os.getenv("VIRUSTOTAL_API_KEY")
    
    if not api_key:
        return {
            "product_name": "Unknown (VirusTotal API key not configured)",
            "vendor_name": "Unknown",
            "website": None,
            "verified": False,
            "input_type": InputType.SHA1.value,
            "sha1_hash": sha1_hash,
            "file_reputation": "API key required - get free key at virustotal.com",
            "confidence": ConfidenceLevel.INSUFFICIENT.value,
        }
    
    try:
        # Query VirusTotal file report
        headers = {
            "x-apikey": api_key,
            "Accept": "application/json"
        }
        
        url = f"{VIRUSTOTAL_API_URL}/files/{sha1_hash}"
        response = requests.get(url, headers=headers, timeout=10)
        
        print(response.json())
        if response.status_code == 200:
            data = response.json()
            attributes = data.get('data', {}).get('attributes', {})
            
            # Extract file information
            meaningful_name = attributes.get('meaningful_name', '')
            names = attributes.get('names', [])
            file_name = meaningful_name or (names[0] if names else 'Unknown')
            
            # Get detection stats
            last_analysis = attributes.get('last_analysis_stats', {})
            malicious = last_analysis.get('malicious', 0)
            total_scans = sum(last_analysis.values())
            
            # Determine reputation
            if malicious > 5:
                reputation = f"MALICIOUS - {malicious}/{total_scans} vendors flagged"
            elif malicious > 0:
                reputation = f"SUSPICIOUS - {malicious}/{total_scans} vendors flagged"
            else:
                reputation = f"CLEAN - 0/{total_scans} vendors flagged"
            
            # Extract tags and type info
            tags = attributes.get('tags', [])
            file_type = attributes.get('type_description', 'Unknown')
            
            return {
                "product_name": file_name,
                "vendor_name": "Unknown",
                "website": None,
                "verified": True,
                "input_type": InputType.SHA1.value,
                "sha1_hash": sha1_hash,
                "file_reputation": reputation,
                "confidence": ConfidenceLevel.HIGH.value if malicious == 0 else ConfidenceLevel.MEDIUM.value,
                "file_type": file_type,
                "tags": tags[:5],  # First 5 tags
                "detection_ratio": f"{malicious}/{total_scans}"
            }
        elif response.status_code == 404:
            return {
                "product_name": "Unknown",
                "vendor_name": "Unknown",
                "website": None,
                "verified": False,
                "input_type": InputType.SHA1.value,
                "sha1_hash": sha1_hash,
                "file_reputation": "File not found in VirusTotal database",
                "confidence": ConfidenceLevel.LOW.value,
            }
        else:
            return {
                "product_name": "Unknown",
                "vendor_name": "Unknown",
                "website": None,
                "verified": False,
                "input_type": InputType.SHA1.value,
                "sha1_hash": sha1_hash,
                "file_reputation": f"VirusTotal API error: {response.status_code}",
                "confidence": ConfidenceLevel.LOW.value,
            }
    except Exception as e:
        return {
            "product_name": "Unknown",
            "vendor_name": "Unknown",
            "website": None,
            "verified": False,
            "input_type": InputType.SHA1.value,
            "sha1_hash": sha1_hash,
            "file_reputation": f"Error: {str(e)}",
            "confidence": ConfidenceLevel.LOW.value,
        }


def _resolve_from_url(url: str) -> Dict[str, Any]:
    """Resolve entity from URL using LLM analysis of website content."""
    try:
        # Normalize URL
        if not url.startswith('http'):
            url = 'https://' + url
        
        # Fix common typos (https// -> https://)
        url = url.replace('https//', 'https://').replace('http//', 'http://')
        
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        
        # Get API key
        google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not google_api_key:
            # Fallback to basic resolution
            simple_name = domain.replace('www.', '').split('.')[0]  # Extract base name for CVE searches
            product_name = simple_name.title()
            # Normalize for CVE searches
            original_name = re.sub(r'[^a-z0-9\-_]', '', simple_name.lower())
            
            return {
                "product_name": product_name,
                "original_name": original_name,  # Normalized for CVE searches
                "vendor_name": product_name,  # Use product name as vendor for consistency
                "website": url,
                "verified": False,
                "input_type": InputType.URL.value,
                "sha1_hash": None,
                "file_reputation": None,
                "confidence": ConfidenceLevel.LOW.value,
            }
        
        # Fetch the page to extract content
        page_content = ""
        page_title = ""
        meta_description = ""
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract page title
                if soup.title:
                    page_title = soup.title.string or ""
                
                # Extract meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc:
                    meta_description = meta_desc.get('content', '')
                
                # Extract Open Graph data
                og_title = soup.find('meta', property='og:title')
                og_description = soup.find('meta', property='og:description')
                og_site_name = soup.find('meta', property='og:site_name')
                
                if og_title:
                    page_title = og_title.get('content', page_title)
                if og_description:
                    meta_description = og_description.get('content', meta_description)
                
                # Get some visible text content (first few paragraphs)
                paragraphs = soup.find_all('p')[:3]
                page_content = ' '.join([p.get_text().strip() for p in paragraphs])[:500]
                
        except Exception as e:
            page_content = f"Could not fetch page: {str(e)}"
        
        # Use LLM with page data
        model = init_chat_model(
            "google_genai:gemini-2.5-flash",
            api_key=google_api_key,
            temperature=0
        )
        
        resolution_prompt = f"""You are analyzing a website URL to extract product and vendor information for a security assessment.

URL: {url}
Domain: {domain}

PAGE DATA:
Title: {page_title}
Description: {meta_description}
Content Preview: {page_content[:300]}

Based on this information, determine:
1. What is the official product name? (e.g., "Figma" not "Figma - The Collaborative...")
2. What is the vendor/company name? (e.g., "Figma Inc." or "Adobe")
3. What type of software/service is this?

Return ONLY a JSON object (no markdown):
{{
    "product_name": "clean product name",
    "vendor_name": "company name",
    "product_type": "brief description (e.g., 'Design tool', 'Communication platform')",
    "reasoning": "brief explanation",
    "confidence": "high|medium|low"
}}

IMPORTANT:
- Extract the BRAND name, not marketing copy
- Use official company names
- Be concise and accurate
- NEVER return null/None for product_name - use domain as fallback
"""
        
        messages = [
            SystemMessage(content="You are a precise entity extractor. Return ONLY valid JSON with no markdown."),
            HumanMessage(content=resolution_prompt)
        ]
        
        response = model.invoke(messages)
        response_text = response.content
        
        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            entity_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: extract from domain
            entity_data = {
                "product_name": domain.replace('www.', '').split('.')[0].title(),
                "vendor_name": domain,
                "confidence": "low"
            }
        
        # Map confidence
        confidence_map = {
            "high": ConfidenceLevel.HIGH.value,
            "medium": ConfidenceLevel.MEDIUM.value,
            "low": ConfidenceLevel.LOW.value
        }
        
        confidence = confidence_map.get(
            entity_data.get("confidence", "medium").lower(),
            ConfidenceLevel.MEDIUM.value
        )
        
        # Extract simple product name for CVE searches
        product_name = entity_data.get("product_name", domain)
        vendor_name = entity_data.get("vendor_name", domain)
        
        # Use domain base name as original for CVE searches (e.g., "redis" from "redis.io")
        simple_name = domain.replace('www.', '').split('.')[0].lower()
        
        # Normalize original_name for CVE searches (remove special chars)
        original_name = re.sub(r'[^a-z0-9\-_]', '', simple_name)
        
        return {
            "product_name": product_name,
            "original_name": original_name,  # Normalized for CVE searches
            "vendor_name": vendor_name,
            "website": url,
            "verified": entity_data.get("confidence") == "high",
            "input_type": InputType.URL.value,
            "sha1_hash": None,
            "file_reputation": None,
            "confidence": confidence,
            "reasoning": entity_data.get("reasoning", "LLM-based URL analysis"),
            "product_type": entity_data.get("product_type", "Unknown")
        }
        
    except Exception as e:
        # Ultimate fallback
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            simple_name = domain.replace('www.', '').split('.')[0]
            product_name = simple_name.title()
            # Normalize for CVE searches
            original_name = re.sub(r'[^a-z0-9\-_]', '', simple_name.lower())
        except:
            product_name = url
            simple_name = url
            domain = url
            original_name = re.sub(r'[^a-z0-9\-_]', '', url.lower())
            
        return {
            "product_name": product_name,
            "original_name": original_name,  # Normalized for CVE searches
            "vendor_name": product_name,  # Use product name as vendor for consistency
            "website": url,
            "verified": False,
            "input_type": InputType.URL.value,
            "sha1_hash": None,
            "file_reputation": None,
            "confidence": ConfidenceLevel.LOW.value,
            "error": f"URL resolution failed: {str(e)}"
        }


def _resolve_from_name(name: str) -> Dict[str, Any]:
    """Resolve entity from product/vendor name using LLM and web search."""
    try:
        # Get API keys
        google_api_key = os.getenv("GOOGLE_API_KEY")
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        
        if not google_api_key:
            # Fallback to basic resolution
            # Normalize original_name for CVE searches
            original_name = re.sub(r'[^a-z0-9\-_]', '', name.lower())
            
            return {
                "product_name": name,
                "original_name": original_name,  # Normalized for CVE searches
                "vendor_name": name,
                "website": None,
                "verified": False,
                "input_type": InputType.NAME.value,
                "sha1_hash": None,
                "file_reputation": None,
                "confidence": ConfidenceLevel.LOW.value,
            }
        
        # Step 1: Perform web search using Tavily (Google Search grounding not in Python SDK yet)
        search_query = f"{name} official website vendor company"
        search_results = "No search results available"
        
        if tavily_api_key:
            try:
                tavily = create_tavily_client(tavily_api_key)
                results = tavily.search(query=search_query, max_results=5)
                
                search_results = "\n\n".join([
                    f"[{i+1}] {r['title']}\nURL: {r['url']}\n{r['content']}..."
                    for i, r in enumerate(results.get('results', []))
                ])
            except Exception as e:
                search_results = f"Search error: {str(e)}"
        
        # Step 2: Use LLM with search results to extract entity information
        model = init_chat_model(
            "google_genai:gemini-2.5-flash",
            api_key=google_api_key,
            temperature=0
        )
        
        resolution_prompt = f"""You are a security analyst resolving entity information for a CISO security assessment.

CONTEXT: This is for a SOFTWARE/TECHNOLOGY security assessment. When ambiguous, ALWAYS prioritize:
1. Software applications, tools, and platforms
2. Technology products and services
3. Security-related tools
Over: consumer products, unrelated businesses, or generic terms

INPUT: "{name}"

SEARCH RESULTS FROM WEB:
{search_results}

Based on the search results above, determine:

1. Is this a person name, product name, company name, or something else?
2. If it's a person, what product(s) are they most associated with? (e.g., "Elon Musk" → "X (Twitter)" or "Tesla")
3. What is the official SOFTWARE/TECHNOLOGY product name?
4. What is the vendor/company name?
5. What is the official website URL?

DISAMBIGUATION EXAMPLES:
- "vim" → "Vim (text editor)" by Bram Moolenaar, NOT "Vendor Invoice Management"
- "slack" → "Slack (communication platform)" by Salesforce, NOT any other "Slack"
- "python" → "Python (programming language)" by PSF, NOT unrelated products

Return ONLY a JSON object (no markdown, no explanations):
{{
    "input_interpretation": "person_name|product_name|company_name|url|ambiguous",
    "product_name": "official product name",
    "vendor_name": "company/vendor name",
    "website": "https://official-website.com",
    "reasoning": "brief explanation of your resolution",
    "confidence": "high|medium|low"
}}

CRITICAL RULES:
- **PRIORITIZE SOFTWARE/TECHNOLOGY products in all ambiguous cases**
- Use the search results to find accurate information
- If input is a person name, identify their PRIMARY software product
- Always try to extract the official website URL from search results
- Be specific with product names (e.g., "Cursor AI" not just "cursor")
- For well-known tech tools (vim, emacs, git, etc.), identify them correctly
- If truly unknown, set product_name to "{name}" and confidence to "low"
- NEVER return null/None for product_name - always provide a string
- Return ONLY valid JSON, no markdown formatting
"""
        
        messages = [
            SystemMessage(content="You are a precise entity resolver. Return ONLY valid JSON with no markdown."),
            HumanMessage(content=resolution_prompt)
        ]
        
        response = model.invoke(messages)
        
        # Parse LLM response
        response_text = response.content
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        try:
            entity_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: try to extract key info with regex
            entity_data = {
                "product_name": name,
                "vendor_name": name,
                "website": None,
                "confidence": "low"
            }
        
        # Map confidence to enum
        confidence_map = {
            "high": ConfidenceLevel.HIGH.value,
            "medium": ConfidenceLevel.MEDIUM.value,
            "low": ConfidenceLevel.LOW.value
        }
        
        confidence = confidence_map.get(
            entity_data.get("confidence", "medium").lower(),
            ConfidenceLevel.MEDIUM.value
        )
        
        # Build final result - ensure product_name is NEVER None
        product_name = entity_data.get("product_name") or name
        vendor_name = entity_data.get("vendor_name") or name
        
        # Normalize original_name for CVE searches (always lowercase, no special chars)
        original_name = re.sub(r'[^a-z0-9\-_]', '', name.lower())
        
        return {
            "product_name": product_name,
            "original_name": original_name,  # Normalized for CVE/vulnerability searches
            "vendor_name": vendor_name,
            "website": entity_data.get("website"),
            "verified": entity_data.get("confidence") == "high",
            "input_type": InputType.NAME.value,
            "sha1_hash": None,
            "file_reputation": None,
            "confidence": confidence,
            "reasoning": entity_data.get("reasoning", "LLM-based resolution"),
            "input_interpretation": entity_data.get("input_interpretation", "product_name")
        }
        
    except Exception as e:
        # Fallback to basic resolution on any error
        # Normalize original_name for CVE searches
        original_name = re.sub(r'[^a-z0-9\-_]', '', name.lower())
        
        return {
            "product_name": name,
            "original_name": original_name,  # Normalized for CVE searches
            "vendor_name": name,
            "website": None,
            "verified": False,
            "input_type": InputType.NAME.value,
            "sha1_hash": None,
            "file_reputation": None,
            "confidence": ConfidenceLevel.LOW.value,
            "error": f"LLM resolution failed: {str(e)}"
        }

