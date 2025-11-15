"""Entity resolution tools - resolve product/vendor from name, URL, or SHA1 hash."""

import json
import os
import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
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
        
        if response.status_code == 200:
            data = response.json()
            attributes = data.get('data', {}).get('attributes', {})
            
            # Extract file information
            meaningful_name = attributes.get('meaningful_name', '')
            names = attributes.get('names', [])
            file_name = meaningful_name or (names[0] if names else 'Unknown')
            
            # Extract vendor information from multiple possible sources
            vendor_name = "Unknown"
            
            # Try to get vendor from signature info (for signed files)
            signature_info = attributes.get('signature_info', {})
            if signature_info:
                vendor_name = (
                    signature_info.get('subject', {}).get('CN', '') or
                    signature_info.get('signers', '') or
                    signature_info.get('verified', '')
                )
            
            # Try to get vendor from exiftool data (metadata)
            if not vendor_name or vendor_name == "Unknown":
                exiftool = attributes.get('exiftool', {})
                if exiftool:
                    vendor_name = (
                        exiftool.get('CompanyName', '') or
                        exiftool.get('LegalCopyright', '') or
                        exiftool.get('ProductName', '') or
                        "Unknown"
                    )
            
            # Try to get vendor from PE info (for Windows executables)
            if not vendor_name or vendor_name == "Unknown":
                pe_info = attributes.get('pe_info', {})
                if pe_info:
                    resource_details = pe_info.get('resource_details', [{}])
                    for resource in resource_details:
                        if resource.get('type') == 'RT_VERSION':
                            lang_strings = resource.get('lang_sublang', {})
                            for lang_data in lang_strings.values():
                                vendor_name = (
                                    lang_data.get('CompanyName', '') or
                                    lang_data.get('LegalCopyright', '') or
                                    "Unknown"
                                )
                                if vendor_name and vendor_name != "Unknown":
                                    break
                        if vendor_name and vendor_name != "Unknown":
                            break
            
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
            
            # Clean up vendor name (remove copyright symbols, years, etc.)
            if vendor_name and vendor_name != "Unknown":
                # Remove copyright symbols and years
                vendor_name = re.sub(r'©|\(c\)|copyright|\d{4}', '', vendor_name, flags=re.IGNORECASE).strip()
                # Remove multiple spaces
                vendor_name = re.sub(r'\s+', ' ', vendor_name).strip()
                # Take first meaningful part if comma-separated
                if ',' in vendor_name:
                    vendor_name = vendor_name.split(',')[0].strip()
            
            # Create original_name for CVE searches (normalized, lowercase)
            # Extract base product name without version numbers or extensions
            original_name = re.sub(r'[^a-z0-9\-_]', '', file_name.lower().split()[0])
            
            return {
                "product_name": file_name,
                "original_name": original_name,  # Normalized for CVE searches
                "vendor_name": vendor_name,
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
        
        # Fetch the page content using Tavily
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        page_content = ""
        page_title = ""
        
        if tavily_api_key:
            try:
                # Use Tavily to search for the URL/domain to get enriched content
                tavily = create_tavily_client(tavily_api_key)
                search_query = f"site:{domain} OR {url}"
                results = tavily.search(query=search_query, max_results=3)
                
                # Extract title and content from Tavily results
                if results.get('results'):
                    first_result = results['results'][0]
                    page_title = first_result.get('title', '')
                    page_content = first_result.get('content', '')
                    
                    # Combine multiple results for better context
                    all_content = []
                    for result in results['results'][:3]:
                        if result.get('content'):
                            all_content.append(result['content'])
                    
                    if all_content:
                        page_content = ' '.join(all_content)[:800]
                        
            except Exception as e:
                page_content = f"Could not fetch page via Tavily: {str(e)}"
        else:
            page_content = "Tavily API key not configured"
        
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
Content Preview: {page_content[:500]}

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


# ============================================================================
# COMPREHENSIVE MULTI-INPUT RESOLUTION
# ============================================================================

def _names_match(name1: Optional[str], name2: Optional[str], threshold: float = 0.7) -> bool:
    """Fuzzy match product/vendor names to detect consistency.
    
    Args:
        name1: First name to compare
        name2: Second name to compare
        threshold: Similarity threshold (0.0-1.0)
        
    Returns:
        True if names match or are similar enough
    """
    if not name1 or not name2:
        return False
    
    # Normalize
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    # Exact match
    if n1 == n2:
        return True
    
    # One contains the other
    if n1 in n2 or n2 in n1:
        return True
    
    # Fuzzy matching using sequence matcher
    similarity = SequenceMatcher(None, n1, n2).ratio()
    return similarity >= threshold


def _detect_primary_input_type(input_fields: List[str]) -> str:
    """Determine primary input type for logging.
    
    Args:
        input_fields: List of field names that were provided by user
        
    Returns:
        Primary input type string
    """
    if "sha1_hash" in input_fields:
        return "sha1"
    elif "website" in input_fields:
        return "url"
    elif "product_name" in input_fields or "vendor_name" in input_fields:
        return "name"
    else:
        return "unknown"


def _map_confidence_to_level(confidence: float) -> str:
    """Map confidence score to level string.
    
    Args:
        confidence: Confidence score (0.0-1.0)
        
    Returns:
        Confidence level: "high", "medium", or "low"
    """
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.5:
        return "medium"
    else:
        return "low"


@tool
def resolve_entity_complete(
    product_name: Optional[str] = None,
    vendor_name: Optional[str] = None,
    website: Optional[str] = None,
    sha1_hash: Optional[str] = None
) -> Dict[str, Any]:
    """
    Resolve ALL 4 core entity fields from any combination of inputs.
    Deterministic resolution with validation and conflict detection.
    
    This function can handle all 15 possible input combinations:
    - Single inputs: SHA1, product, vendor, or URL
    - Dual inputs: Any 2 of the 4 fields
    - Triple inputs: Any 3 of the 4 fields  
    - All 4 inputs: Complete validation mode
    
    Args:
        product_name: Product name if known (optional)
        vendor_name: Vendor/company name if known (optional)
        website: Official website URL if known (optional)
        sha1_hash: File SHA1 hash if known (optional)
        
    Returns:
        Complete entity dict with all 4 core fields populated, sources tracked,
        and confidence scores per field
    """
    
    # Initialize entity with tracking
    entity = {
        "product_name": product_name,
        "vendor_name": vendor_name,
        "website": website,
        "sha1_hash": sha1_hash,
        "input_fields": [],
        "resolved_fields": [],
        "sources": {},
        "confidence": {},
        "conflicts": [],
    }
    
    # Track user-provided fields
    if sha1_hash:
        entity["input_fields"].append("sha1_hash")
    if product_name:
        entity["input_fields"].append("product_name")
    if vendor_name:
        entity["input_fields"].append("vendor_name")
    if website:
        entity["input_fields"].append("website")
    
    # PHASE 1: PRIMARY RESOLUTION - Use most specific input first
    # Priority: SHA1 > URL > Name
    
    if sha1_hash and not (product_name and vendor_name):
        # SHA1 provides product + vendor from VirusTotal
        vt_result = _resolve_from_sha1(sha1_hash)
        
        if not product_name and vt_result.get("product_name") != "Unknown":
            entity["product_name"] = vt_result["product_name"]
            entity["sources"]["product_name"] = "virustotal"
            entity["confidence"]["product_name"] = 0.8
            entity["resolved_fields"].append("product_name")
        
        if not vendor_name and vt_result.get("vendor_name") != "Unknown":
            entity["vendor_name"] = vt_result["vendor_name"]
            entity["sources"]["vendor_name"] = "virustotal"
            entity["confidence"]["vendor_name"] = 0.7
            entity["resolved_fields"].append("vendor_name")
        
        # Store file reputation data if available
        if vt_result.get("file_reputation"):
            entity["file_reputation"] = vt_result["file_reputation"]
            entity["file_type"] = vt_result.get("file_type")
    
    if website and not (product_name and vendor_name):
        # URL provides product + vendor via LLM analysis
        url_result = _resolve_from_url(website)
        
        if not product_name and url_result.get("product_name"):
            entity["product_name"] = url_result["product_name"]
            entity["sources"]["product_name"] = "url_analysis"
            entity["confidence"]["product_name"] = 0.9
            entity["resolved_fields"].append("product_name")
        
        if not vendor_name and url_result.get("vendor_name"):
            entity["vendor_name"] = url_result["vendor_name"]
            entity["sources"]["vendor_name"] = "url_analysis"
            entity["confidence"]["vendor_name"] = 0.9
            entity["resolved_fields"].append("vendor_name")
    
    # PHASE 2: FILL REMAINING GAPS - Use web search for missing fields
    
    # Missing website but have product
    if not entity["website"] and entity["product_name"]:
        search_result = _resolve_from_name(entity["product_name"])
        if search_result.get("website"):
            entity["website"] = search_result["website"]
            entity["sources"]["website"] = "web_search"
            entity["confidence"]["website"] = 0.8
            entity["resolved_fields"].append("website")
    
    # Missing vendor but have product
    if not entity["vendor_name"] and entity["product_name"]:
        search_result = _resolve_from_name(entity["product_name"])
        if search_result.get("vendor_name") and search_result["vendor_name"] != entity["product_name"]:
            entity["vendor_name"] = search_result["vendor_name"]
            entity["sources"]["vendor_name"] = "web_search"
            entity["confidence"]["vendor_name"] = 0.7
            entity["resolved_fields"].append("vendor_name")
    
    # Missing product but have vendor or website
    if not entity["product_name"] and (entity["vendor_name"] or entity["website"]):
        search_query = entity["vendor_name"] or entity["website"]
        search_result = _resolve_from_name(search_query)
        if search_result.get("product_name"):
            entity["product_name"] = search_result["product_name"]
            entity["sources"]["product_name"] = "web_search"
            entity["confidence"]["product_name"] = 0.6
            entity["resolved_fields"].append("product_name")
    
    # PHASE 3: VALIDATION - Cross-check for consistency
    
    # Validate SHA1 product matches provided product
    if sha1_hash and product_name and "product_name" in entity["input_fields"]:
        vt_result = _resolve_from_sha1(sha1_hash)
        vt_product = vt_result.get("product_name")
        if vt_product and not _names_match(vt_product, product_name):
            entity["conflicts"].append({
                "field": "product_name",
                "user_input": product_name,
                "virustotal": vt_product,
                "resolution": "using_user_input"
            })
    
    # Validate URL product matches provided product
    if website and product_name and "product_name" in entity["input_fields"]:
        url_result = _resolve_from_url(website)
        url_product = url_result.get("product_name")
        if url_product and not _names_match(url_product, product_name):
            entity["conflicts"].append({
                "field": "product_name",
                "user_input": product_name,
                "url_analysis": url_product,
                "resolution": "using_user_input"
            })
    
    # Similar validation for vendor if needed
    if website and vendor_name and "vendor_name" in entity["input_fields"]:
        url_result = _resolve_from_url(website)
        url_vendor = url_result.get("vendor_name")
        if url_vendor and not _names_match(url_vendor, vendor_name):
            entity["conflicts"].append({
                "field": "vendor_name",
                "user_input": vendor_name,
                "url_analysis": url_vendor,
                "resolution": "using_user_input"
            })
    
    # PHASE 4: CALCULATE OVERALL CONFIDENCE
    
    field_confidences = [
        entity["confidence"].get("product_name", 1.0),  # 1.0 if user-provided
        entity["confidence"].get("vendor_name", 1.0),
        entity["confidence"].get("website", 1.0),
    ]
    
    if entity["resolved_fields"]:
        overall_confidence = sum(field_confidences) / len(field_confidences)
    else:
        overall_confidence = 1.0  # All fields user-provided
    
    # Penalize if conflicts detected
    if entity["conflicts"]:
        overall_confidence *= 0.8
    
    confidence_level = _map_confidence_to_level(overall_confidence)
    
    # PHASE 5: BUILD FINAL RESPONSE
    
    return {
        # Core fields (always present)
        "product_name": entity["product_name"] or "Unknown",
        "vendor_name": entity["vendor_name"] or "Unknown",
        "website": entity["website"],
        "sha1_hash": entity["sha1_hash"],
        
        # Metadata
        "verified": overall_confidence > 0.7,
        "confidence": confidence_level,
        "input_type": _detect_primary_input_type(entity["input_fields"]),
        
        # Additional data
        "file_reputation": entity.get("file_reputation"),
        "file_type": entity.get("file_type"),
        
        # Detailed tracking (for debugging/validation)
        "resolution_details": {
            "user_provided": entity["input_fields"],
            "resolved": entity["resolved_fields"],
            "sources": entity["sources"],
            "field_confidence": entity["confidence"],
            "overall_confidence": overall_confidence,
            "conflicts": entity["conflicts"],
        }
    }


@tool
def lookup_latest_version(product_name: str, vendor_name: Optional[str] = None) -> Dict[str, Any]:
    """Look up the latest version of a product using Tavily search.
    
    Args:
        product_name: Name of the product
        vendor_name: Name of the vendor (optional, helps with accuracy)
        
    Returns:
        Dictionary containing the latest version information
    """
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return {
            "version": "latest",
            "found": False,
            "note": "Tavily API key not configured"
        }
    
    try:
        tavily = create_tavily_client(tavily_api_key)
        
        # Build search query
        search_terms = [product_name]
        if vendor_name:
            search_terms.append(vendor_name)
        search_terms.extend(["latest version", "current version", "release"])
        
        query = " ".join(search_terms)
        
        # Search for version information
        results = tavily.search(query=query, max_results=5)
        
        if results and results.get('results'):
            # Collect text from search results
            combined_text = ""
            for result in results['results'][:3]:  # Use top 3 results
                title = result.get('title', '')
                content = result.get('content', '')
                combined_text += f"{title}\n{content}\n\n"
            
            # Use regex to find version patterns (e.g., "5.14.5", "v2.0.1", "version 3.2")
            import re
            
            # Common version patterns
            patterns = [
                r'(?:version|v\.?|release)\s*(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)',  # "version 5.14.5", "v5.14.5"
                r'(\d+\.\d+\.\d+(?:\.\d+)?)\s*(?:is|was|now)?\s*(?:the\s+)?(?:latest|current|newest)',  # "5.14.5 is the latest"
                r'(?:latest|current|newest)\s+(?:version\s+)?(?:is\s+)?(?:v\.?)?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)',  # "latest version is 5.14.5"
                r'\b(\d+\.\d+\.\d+(?:\.\d+)?)\b',  # Generic version pattern (fallback)
            ]
            
            found_versions = []
            for pattern in patterns:
                matches = re.findall(pattern, combined_text, re.IGNORECASE)
                found_versions.extend(matches)
            
            if found_versions:
                # Take the most common version or the first one
                from collections import Counter
                version_counts = Counter(found_versions)
                most_common_version = version_counts.most_common(1)[0][0]
                
                return {
                    "version": most_common_version,
                    "found": True,
                    "source": "Tavily search",
                    "confidence": "medium" if len(found_versions) > 1 else "low"
                }
        
        return {
            "version": "latest",
            "found": False,
            "note": "Could not determine latest version from search results"
        }
    
    except Exception as e:
        return {
            "version": "latest",
            "found": False,
            "error": str(e)
        }
