"""Security assessment tools for CISO brief generation."""

import hashlib
import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool

# Disable SSL warnings for development (Tavily SSL cert issue)
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from .security_state import (
    CVEDetail,
    CVETrendSummary,
    EntityResolution,
    IncidentDetail,
    IncidentReport,
    InputType,
    SourceLabel,
    VendorReputation,
    ConfidenceLevel,
)


# Helper function to create Tavily client with SSL verification disabled
def create_tavily_client(api_key: str):
    """Create a TavilyClient with SSL verification disabled for development."""
    from tavily import TavilyClient
    import requests
    from requests.adapters import HTTPAdapter
    
    client = TavilyClient(api_key=api_key)
    
    # Monkey-patch the requests to disable SSL verification
    original_post = requests.post
    def patched_post(*args, **kwargs):
        kwargs['verify'] = False
        return original_post(*args, **kwargs)
    
    import tavily.tavily
    tavily.tavily.requests.post = patched_post
    
    return client


# API Configuration
NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3"
HIBP_API_URL = "https://haveibeenpwned.com/api/v3"
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"


# ============================================================================
# Entity Resolution Tools
# ============================================================================

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
        
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        
        # Get API key
        google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if not google_api_key:
            # Fallback to basic resolution
            return {
                "product_name": domain.replace('www.', '').split('.')[0].title(),
                "vendor_name": domain,
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
        from langchain.chat_models import init_chat_model
        from langchain_core.messages import HumanMessage, SystemMessage
        
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
        
        return {
            "product_name": entity_data.get("product_name", domain),
            "vendor_name": entity_data.get("vendor_name", domain),
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
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            product_name = domain.replace('www.', '').split('.')[0].title()
        except:
            product_name = url
            domain = url
            
        return {
            "product_name": product_name,
            "vendor_name": domain,
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
        # Initialize LLM
        from langchain.chat_models import init_chat_model
        from langchain_core.messages import HumanMessage, SystemMessage
        
        # Get API keys
        google_api_key = os.getenv("GOOGLE_API_KEY")
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        
        if not google_api_key:
            # Fallback to basic resolution
            return {
                "product_name": name,
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
        
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        if tavily_api_key:
            try:
                tavily = create_tavily_client(tavily_api_key)
                results = tavily.search(query=search_query, max_results=5)
                
                search_results = "\n\n".join([
                    f"[{i+1}] {r['title']}\nURL: {r['url']}\n{r['content'][:250]}..."
                    for i, r in enumerate(results.get('results', []))
                ])
            except Exception as e:
                search_results = f"Search error: {str(e)}"
        
        # Step 2: Use LLM with search results to extract entity information
        from langchain.chat_models import init_chat_model
        from langchain_core.messages import HumanMessage, SystemMessage
        
        model = init_chat_model(
            "google_genai:gemini-2.5-flash",
            api_key=google_api_key,
            temperature=0
        )
        
        resolution_prompt = f"""You are a security analyst resolving entity information for a CISO security assessment.

INPUT: "{name}"

SEARCH RESULTS FROM WEB:
{search_results}

Based on the search results above, determine:

1. Is this a person name, product name, company name, or something else?
2. If it's a person, what product(s) are they most associated with? (e.g., "Elon Musk" → "X (Twitter)" or "Tesla")
3. What is the official product name?
4. What is the vendor/company name?
5. What is the official website URL?

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
- Use the search results to find accurate information
- If input is a person name, identify their PRIMARY software product
- Always try to extract the official website URL from search results
- Be specific with product names (e.g., "Cursor AI" not just "cursor")
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
        
        return {
            "product_name": product_name,
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
        return {
            "product_name": name,
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
# CVE and CISA KEV Tools
# ============================================================================

@tool
def lookup_cves(product_name: str, vendor_name: Optional[str] = None) -> Dict[str, Any]:
    """Look up CVEs for a product using NVD API and check against CISA KEV.
    
    Args:
        product_name: Name of the product
        vendor_name: Name of the vendor (optional)
        
    Returns:
        Dictionary containing CVE summary and trend analysis
    """
    try:
        # Get NVD API key for better rate limits
        api_key = os.getenv("NVD_API_KEY")
        
        # Search for CVEs
        params = {
            "keywordSearch": product_name,
            "resultsPerPage": 100,
        }
        
        headers = {
            "User-Agent": "SecurityAssessmentTool/1.0"
        }
        
        # Add API key if available for higher rate limits (50 req/30s vs 5 req/30s)
        if api_key:
            headers["apiKey"] = api_key
        
        try:
            response = requests.get(NVD_API_URL, params=params, headers=headers, timeout=15)
            
            # Rate limiting: sleep if no API key
            if not api_key:
                time.sleep(6)  # 6 seconds to stay under 5 requests/30s limit
            
            if response.status_code == 200:
                data = response.json()
                cves = data.get('vulnerabilities', [])
                
                return _process_cve_data(cves, product_name)
            else:
                # API failed, return insufficient data
                return {
                    "total_cves": 0,
                    "critical_count": 0,
                    "high_count": 0,
                    "medium_count": 0,
                    "low_count": 0,
                    "trend": "insufficient data",
                    "recent_cves": [],
                    "cisa_kev_count": 0,
                    "citation": f"NVD API (status: {response.status_code})",
                    "source_label": SourceLabel.INDEPENDENT.value,
                    "data_available": False,
                }
        except requests.exceptions.Timeout:
            return {
                "total_cves": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "trend": "timeout",
                "recent_cves": [],
                "cisa_kev_count": 0,
                "citation": "NVD API (timeout)",
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
            }
        except Exception as e:
            return {
                "total_cves": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "trend": f"error: {str(e)}",
                "recent_cves": [],
                "cisa_kev_count": 0,
                "citation": f"NVD API (error: {str(e)})",
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
            }
    except Exception as e:
        return {
            "total_cves": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "trend": "error",
            "recent_cves": [],
            "cisa_kev_count": 0,
            "citation": f"Error: {str(e)}",
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
        }


def _process_cve_data(cves: List[Dict], product_name: str) -> Dict[str, Any]:
    """Process CVE data from NVD API."""
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    recent_cves = []
    
    for vuln in cves[:20]:  # Limit to first 20
        try:
            cve_data = vuln.get('cve', {})
            cve_id = cve_data.get('id', 'Unknown')
            
            # Get CVSS score
            metrics = cve_data.get('metrics', {})
            cvss_v3 = metrics.get('cvssMetricV31', []) or metrics.get('cvssMetricV30', [])
            
            cvss_score = None
            severity = "UNKNOWN"
            
            if cvss_v3:
                cvss_data = cvss_v3[0].get('cvssData', {})
                cvss_score = cvss_data.get('baseScore')
                severity = cvss_data.get('baseSeverity', 'UNKNOWN')
            
            # Count by severity
            if severity == "CRITICAL":
                critical_count += 1
            elif severity == "HIGH":
                high_count += 1
            elif severity == "MEDIUM":
                medium_count += 1
            elif severity == "LOW":
                low_count += 1
            
            # Get description
            descriptions = cve_data.get('descriptions', [])
            description = descriptions[0].get('value', '') if descriptions else ''
            
            # Get published date
            published = cve_data.get('published', '')
            
            recent_cves.append({
                "cve_id": cve_id,
                "severity": severity,
                "cvss_score": cvss_score,
                "published_date": published,
                "description": description[:200] if description else None,
                "in_cisa_kev": False,  # Would need CISA KEV lookup
            })
        except Exception as e:
            continue
    
    total = len(cves)
    
    # Determine trend (simplified)
    trend = "stable"
    if total > 50:
        trend = "increasing"
    elif total > 0 and critical_count > 0:
        trend = "concerning"
    
    return {
        "total_cves": total,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "trend": trend,
        "recent_cves": recent_cves[:5],  # Top 5 most recent
        "cisa_kev_count": 0,  # Would need separate CISA KEV check
        "citation": f"NVD API (https://nvd.nist.gov) - accessed {datetime.now().strftime('%Y-%m-%d')}",
        "source_label": SourceLabel.INDEPENDENT.value,
        "data_available": True,
    }


@tool
def check_cisa_kev(cve_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """Check CVEs against CISA Known Exploited Vulnerabilities catalog.
    
    Args:
        cve_ids: List of CVE identifiers to check (optional, returns all KEV if None)
        
    Returns:
        Dictionary with KEV information
    """
    try:
        response = requests.get(CISA_KEV_URL, timeout=10)
        if response.status_code == 200:
            kev_data = response.json()
            vulnerabilities = kev_data.get('vulnerabilities', [])
            
            if cve_ids:
                # Check specific CVEs
                matched = []
                for vuln in vulnerabilities:
                    if vuln.get('cveID') in cve_ids:
                        matched.append({
                            'cve_id': vuln.get('cveID'),
                            'vulnerability_name': vuln.get('vulnerabilityName'),
                            'date_added': vuln.get('dateAdded'),
                            'short_description': vuln.get('shortDescription'),
                            'required_action': vuln.get('requiredAction'),
                            'due_date': vuln.get('dueDate')
                        })
                
                return {
                    "in_kev": len(matched) > 0,
                    "kev_count": len(matched),
                    "kev_entries": matched,
                    "source": "CISA Known Exploited Vulnerabilities Catalog",
                    "source_label": SourceLabel.INDEPENDENT.value
                }
            else:
                # Return summary
                return {
                    "total_kev_entries": len(vulnerabilities),
                    "last_updated": kev_data.get('dateReleased'),
                    "source": "CISA KEV Catalog",
                    "source_label": SourceLabel.INDEPENDENT.value
                }
        else:
            return {
                "in_kev": False,
                "kev_count": 0,
                "error": f"CISA KEV API returned status {response.status_code}"
            }
    except Exception as e:
        return {
            "in_kev": False,
            "kev_count": 0,
            "error": str(e)
        }


# ============================================================================
# Vendor Security Page Tools
# ============================================================================

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


# ============================================================================
# Incident Lookup Tools
# ============================================================================

@tool
def lookup_security_incidents(domain: str, product_name: str) -> Dict[str, Any]:
    """Look up security incidents and data breaches using HaveIBeenPwned API.
    
    Args:
        domain: Domain name to check
        product_name: Product name
        
    Returns:
        Dictionary containing incident history
    """
    api_key = os.getenv("HIBP_API_KEY")
    
    if not api_key:
        return {
            "incidents": [],
            "breach_count": 0,
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
            "note": "HaveIBeenPwned API key not configured - get key at haveibeenpwned.com/API/Key ($3.50/month)"
        }
    
    try:
        # Query HIBP breaches by domain
        headers = {
            "hibp-api-key": api_key,
            "User-Agent": "CISO-Security-Assessor"
        }
        
        url = f"{HIBP_API_URL}/breaches"
        
        # Rate limiting: HIBP requires 1.5 second delay between requests
        time.sleep(1.5)
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            all_breaches = response.json()
            
            # Filter breaches by domain
            domain_breaches = [
                breach for breach in all_breaches 
                if domain.lower() in breach.get('Domain', '').lower() or 
                   product_name.lower() in breach.get('Name', '').lower()
            ]
            
            incidents = []
            for breach in domain_breaches:
                incidents.append({
                    "incident_date": breach.get('BreachDate'),
                    "incident_type": "Data Breach",
                    "severity": "HIGH" if breach.get('IsSensitive') else "MEDIUM",
                    "description": f"{breach.get('Title', 'Unknown')}: {breach.get('Description', 'No description')[:200]}",
                    "source_url": f"https://haveibeenpwned.com/Breach/{breach.get('Name')}",
                    "accounts_affected": breach.get('PwnCount', 0),
                    "data_classes": breach.get('DataClasses', [])
                })
            
            return {
                "incidents": incidents,
                "breach_count": len(incidents),
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": True,
                "source": "HaveIBeenPwned",
                "total_accounts_affected": sum(i.get('accounts_affected', 0) for i in incidents)
            }
        elif response.status_code == 404:
            return {
                "incidents": [],
                "breach_count": 0,
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": True,
                "note": "No breaches found in HaveIBeenPwned database"
            }
        else:
            return {
                "incidents": [],
                "breach_count": 0,
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
                "error": f"HIBP API returned status {response.status_code}"
            }
    except Exception as e:
        return {
            "incidents": [],
            "breach_count": 0,
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
            "error": str(e)
        }


# ============================================================================
# GitHub Security Advisories
# ============================================================================

@tool
def lookup_github_advisories(product_name: str, ecosystem: str = "all") -> Dict[str, Any]:
    """Look up security advisories from GitHub Security Advisory Database.
    
    Args:
        product_name: Name of the package/product
        ecosystem: Ecosystem (npm, pypi, maven, rubygems, nuget, composer, etc.)
        
    Returns:
        Dictionary containing GitHub security advisories
    """
    github_token = os.getenv("GITHUB_TOKEN")
    
    if not github_token:
        return {
            "advisories": [],
            "advisory_count": 0,
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
            "note": "GitHub token not configured - get free token at github.com/settings/tokens"
        }
    
    try:
        # GraphQL query for security advisories
        query = """
        query($queryString: String!) {
          securityVulnerabilities(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}, query: $queryString) {
            nodes {
              advisory {
                ghsaId
                summary
                description
                severity
                publishedAt
                updatedAt
                withdrawnAt
                references {
                  url
                }
              }
              package {
                name
                ecosystem
              }
              vulnerableVersionRange
              firstPatchedVersion {
                identifier
              }
            }
          }
        }
        """
        
        # Build search query
        if ecosystem != "all":
            query_string = f"{product_name} ecosystem:{ecosystem}"
        else:
            query_string = product_name
        
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": query,
            "variables": {
                "queryString": query_string
            }
        }
        
        response = requests.post(GITHUB_GRAPHQL_URL, json=payload, headers=headers, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'errors' in data:
                return {
                    "advisories": [],
                    "advisory_count": 0,
                    "source_label": SourceLabel.INDEPENDENT.value,
                    "data_available": False,
                    "error": data['errors'][0].get('message', 'GraphQL error')
                }
            
            vulnerabilities = data.get('data', {}).get('securityVulnerabilities', {}).get('nodes', [])
            
            advisories = []
            for vuln in vulnerabilities:
                advisory = vuln.get('advisory', {})
                package = vuln.get('package', {})
                
                advisories.append({
                    "id": advisory.get('ghsaId'),
                    "summary": advisory.get('summary'),
                    "severity": advisory.get('severity'),
                    "published_date": advisory.get('publishedAt'),
                    "package_name": package.get('name'),
                    "ecosystem": package.get('ecosystem'),
                    "vulnerable_range": vuln.get('vulnerableVersionRange'),
                    "patched_version": vuln.get('firstPatchedVersion', {}).get('identifier') if vuln.get('firstPatchedVersion') else None,
                    "url": f"https://github.com/advisories/{advisory.get('ghsaId')}"
                })
            
            # Count by severity
            severity_counts = {
                "critical": len([a for a in advisories if a['severity'] == 'CRITICAL']),
                "high": len([a for a in advisories if a['severity'] == 'HIGH']),
                "medium": len([a for a in advisories if a['severity'] == 'MODERATE']),
                "low": len([a for a in advisories if a['severity'] == 'LOW'])
            }
            
            return {
                "advisories": advisories,
                "advisory_count": len(advisories),
                "severity_counts": severity_counts,
                "source": "GitHub Security Advisory Database",
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": True
            }
        else:
            return {
                "advisories": [],
                "advisory_count": 0,
                "source_label": SourceLabel.INDEPENDENT.value,
                "data_available": False,
                "error": f"GitHub API returned status {response.status_code}"
            }
    except Exception as e:
        return {
            "advisories": [],
            "advisory_count": 0,
            "source_label": SourceLabel.INDEPENDENT.value,
            "data_available": False,
            "error": str(e)
        }


# ============================================================================
# Legal Documents (Tavily-based)
# ============================================================================

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


# ============================================================================
# News & Incident Databases (Tavily-based)
# ============================================================================

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


# ============================================================================
# Security Advisories (Tavily-based)
# ============================================================================

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


# ============================================================================
# Threat Intelligence APIs
# ============================================================================

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


# ============================================================================
# Company Information (Tavily + APIs)
# ============================================================================

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


# ============================================================================
# OSINT Sources (Tavily-based)
# ============================================================================

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


# ============================================================================
# Alternative Products (Tavily-based)
# ============================================================================

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


# ============================================================================
# FedRAMP and App Stores (Tavily-based)
# ============================================================================

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


# ============================================================================
# Tool Registry
# ============================================================================

def get_security_tools() -> List:
    """Get all security assessment tools."""
    return [
        resolve_entity,
        lookup_cves,
        check_cisa_kev,
        fetch_vendor_security_info,
        lookup_security_incidents,
        lookup_github_advisories,
        # Legal Documents
        fetch_terms_of_service,
        fetch_privacy_policy,
        fetch_dpa,
        # News & Incidents
        search_security_news,
        search_databreaches_net,
        search_privacy_rights_clearinghouse,
        # Advisories
        search_us_cert_advisories,
        search_cert_cc_advisories,
        # Threat Intel
        lookup_malwarebazaar,
        lookup_urlhaus,
        lookup_alienvault_otx,
        # Company Info
        lookup_whois,
        search_company_info,
        # OSINT
        search_reddit_security,
        search_github_issues,
        search_stackoverflow,
        # Alternatives
        search_alternatives,
        # Compliance
        check_fedramp,
        search_app_store_info,
    ]

