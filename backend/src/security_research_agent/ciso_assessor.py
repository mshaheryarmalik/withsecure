"""CISO Security Assessor - Main orchestration graph."""

import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field

from .configuration import Configuration
from .security_prompts import (
    CISO_SYSTEM_PROMPT,
    CVE_ANALYSIS_PROMPT,
    RISK_SCORING_PROMPT,
    ALTERNATIVES_PROMPT,
    SOFTWARE_TAXONOMY_PROMPT,
)
from .security_state import (
    CISOBrief,
    EntityResolution,
    SoftwareTaxonomy,
    CVETrendSummary,
    VendorReputation,
    IncidentReport,
    ComplianceStatus,
    DataHandling,
    AlternativeProduct,
    Citation,
    ConfidenceLevel,
    SourceLabel,
    SoftwareCategory,
    SOFTWARE_CATEGORIES,
)
from .tools import (
    resolve_entity,
    resolve_entity_complete,
    lookup_cves,
    fetch_vendor_security_info,
    lookup_security_incidents,
    lookup_latest_version,
)
from .api_utils import get_api_key_for_model
from .constants import DEFAULT_CLASSIFICATION_MODEL, DEFAULT_FINAL_REPORT_MODEL
from .llm_utils import extract_json_from_markdown, init_gemini_model
from .debug_logger import get_debug_logger
from .scoring import calculate_risk_trust_scores
from .parsers import parse_compliance_data, build_citations
from .parsers.citation_builder import generate_insufficient_notes
from .parsers.compliance_parser import extract_iso_certifications, check_gdpr_in_certifications, check_encryption_mentions
from .alternatives import extract_alternatives_from_community
from .reporting import assemble_ciso_brief, format_summary_message


class AssessmentState(BaseModel):
    """State for CISO security assessment."""
    
    # Input
    input_text: str = Field(description="Original input (product name, URL, or SHA1)")
    product_version: Optional[str] = Field(default=None, description="Product version (optional, defaults to 'latest')")
    
    # Intermediate results
    entity: Optional[Dict[str, Any]] = None
    taxonomy: Optional[Dict[str, Any]] = None
    cve_data: Optional[Dict[str, Any]] = None
    vendor_data: Optional[Dict[str, Any]] = None
    incident_data: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None  # ALL extra sources (ToS, Privacy, News, etc.)
    
    # Final output
    ciso_brief: Optional[CISOBrief] = None
    
    # Messages for LLM interaction
    messages: List[BaseMessage] = Field(default_factory=list)
    
    # Error tracking
    errors: List[str] = Field(default_factory=list)
    
    # Status tracking for real-time updates
    status_messages: List[str] = Field(default_factory=list)
    current_step: str = Field(default="", description="Current step being executed")


def resolve_entity_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Resolve entity from input and ensure all 4 core fields are populated.
    
    Uses the new comprehensive resolver that handles all input combinations
    and automatically fills missing fields.
    
    Core fields: product_name, vendor_name, website (URL), sha1_hash
    """
    # Initialize debug logger
    logger = get_debug_logger(state.input_text)
    
    try:
        # Update status with detailed reasoning
        status_update = [
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🔍 PHASE 1: ENTITY RESOLUTION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"  📥 Input received: '{state.input_text}'",
            "  🤔 Analyzing input format..."
        ]
        
        # Detect input type with reasoning
        input_lower = state.input_text.lower()
        if re.match(r'^[a-fA-F0-9]{40}$', state.input_text):
            status_update.append("  💡 Pattern detected: SHA1 hash (40 hex characters)")
            status_update.append("  🔎 Step 1: Querying VirusTotal for file reputation...")
            status_update.append("  🌐 Step 2: Resolving product → website via web search...")
        elif re.match(r'^https?://', state.input_text) or '.' in state.input_text and '/' in state.input_text:
            status_update.append("  💡 Pattern detected: URL/Domain")
            status_update.append("  🌐 Step 1: Analyzing URL via Tavily + LLM...")
            status_update.append("  📊 Step 2: Extracting product + vendor information...")
        else:
            status_update.append("  💡 Pattern detected: Name (person/product/company)")
            status_update.append("  🤖 Initializing comprehensive entity resolver...")
            status_update.append("  🔍 Step 1: Performing web search for context...")
            status_update.append("  🧠 Step 2: LLM analyzing search results...")
            status_update.append("  📊 Step 3: Filling all missing fields systematically...")
        
        # Use the OLD resolve_entity for backward compatibility to get initial data
        logger.log_tool_call("resolve_entity", {"input_text": state.input_text})
        initial_result = resolve_entity.invoke(state.input_text)
        logger.log_tool_call("resolve_entity", {"input_text": state.input_text}, initial_result)
        
        # Now use resolve_entity_complete to fill ALL fields
        # Pass what we got from initial resolution
        logger.log_tool_call("resolve_entity_complete", {
            "product_name": initial_result.get('product_name'),
            "vendor_name": initial_result.get('vendor_name'),
            "website": initial_result.get('website'),
            "sha1_hash": initial_result.get('sha1_hash')
        })
        
        entity_result = resolve_entity_complete.invoke({
            "product_name": initial_result.get('product_name') if initial_result.get('product_name') != 'Unknown' else None,
            "vendor_name": initial_result.get('vendor_name') if initial_result.get('vendor_name') != 'Unknown' else None,
            "website": initial_result.get('website'),
            "sha1_hash": initial_result.get('sha1_hash')
        })
        
        logger.log_tool_call("resolve_entity_complete", {
            "product_name": initial_result.get('product_name'),
            "vendor_name": initial_result.get('vendor_name'),
            "website": initial_result.get('website'),
            "sha1_hash": initial_result.get('sha1_hash')
        }, entity_result)
        
        # Extract the 4 core fields
        product_name = entity_result.get('product_name', 'Unknown')
        vendor_name = entity_result.get('vendor_name', 'Unknown')
        website = entity_result.get('website')
        sha1_hash = entity_result.get('sha1_hash')
        input_type = entity_result.get('input_type', 'unknown')
        confidence = entity_result.get('confidence', 'unknown')
        
        # Get resolution details
        resolution_details = entity_result.get('resolution_details', {})
        resolved_fields = resolution_details.get('resolved', [])
        
        # VALIDATION: Check if we have sufficient data to proceed
        if product_name == 'Unknown' and vendor_name == 'Unknown':
            status_update.append("")
            status_update.append("  ⚠️  INSUFFICIENT DATA")
            status_update.append("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            status_update.append("  ❌ Unable to identify product or vendor from provided input")
            status_update.append("")
            
            if input_type == 'sha1':
                status_update.append("  📋 Possible reasons for SHA1 hash:")
                status_update.append("     • File not found in VirusTotal database")
                status_update.append("     • File has no identifying metadata")
                status_update.append("     • Hash may be incorrect or incomplete")
                status_update.append("")
                status_update.append("  💡 Suggestions:")
                status_update.append("     • Verify the SHA1 hash is correct")
                status_update.append("     • Try providing additional information:")
                status_update.append("       --sha1 <hash> --product <name>")
                status_update.append("       --sha1 <hash> --url <website>")
            elif input_type == 'url':
                status_update.append("  📋 Possible reasons for URL:")
                status_update.append("     • Website could not be accessed")
                status_update.append("     • Page content is insufficient for identification")
                status_update.append("     • URL may not be a product website")
                status_update.append("")
                status_update.append("  💡 Suggestions:")
                status_update.append("     • Verify the URL is correct and accessible")
                status_update.append("     • Try providing the product name:")
                status_update.append("       --url <url> --product <name>")
            else:
                status_update.append("  📋 Possible reasons:")
                status_update.append("     • Product/vendor name is too ambiguous")
                status_update.append("     • No web search results found")
                status_update.append("     • Name may be misspelled")
                status_update.append("")
                status_update.append("  💡 Suggestions:")
                status_update.append("     • Check spelling and try again")
                status_update.append("     • Try providing more specific information")
                status_update.append("     • Provide additional context:")
                status_update.append("       --product <name> --vendor <company>")
                status_update.append("       --product <name> --url <website>")
            
            status_update.append("")
            status_update.append("  ⛔ Assessment cannot continue without valid entity identification")
            
            logger.log_phase(1, "Entity Resolution", entity_result, "FAILED - Insufficient Data")
            
            return {
                "entity": None,
                "errors": state.errors + ["Insufficient data: Unable to identify product or vendor"],
                "status_messages": state.status_messages + status_update,
                "current_step": "Entity Resolution Failed - Insufficient Data",
                "ciso_brief": None  # Signal to stop assessment
            }
        
        status_update.append(f"  ✓ Resolution completed!")
        
        # Show what was resolved
        if resolved_fields:
            status_update.append(f"  📊 Resolved {len(resolved_fields)} field(s): {', '.join(resolved_fields)}")
        
        status_update.append("")
        status_update.append("  📋 FINAL ENTITY DETAILS:")
        status_update.append(f"     • Product Name: {product_name}")
        status_update.append(f"     • Vendor Name: {vendor_name}")
        status_update.append(f"     • Version: {state.product_version or 'latest (will auto-detect)'}")
        status_update.append(f"     • Website: {website or 'N/A'}")
        status_update.append(f"     • SHA1 Hash: {sha1_hash or 'N/A'}")
        status_update.append(f"     • Confidence: {confidence.upper()}")
        
        # Show sources if available
        sources = resolution_details.get('sources', {})
        if sources:
            status_update.append(f"     • Resolution Sources:")
            for field, source in sources.items():
                status_update.append(f"       - {field}: {source}")
        
        # Show conflicts if any
        conflicts = resolution_details.get('conflicts', [])
        if conflicts:
            status_update.append(f"     ⚠ Detected {len(conflicts)} conflict(s) - using user input")
        
        # Add interpretation reasoning and product type
        interpretation = initial_result.get('input_interpretation')
        reasoning = initial_result.get('reasoning')
        product_type = initial_result.get('product_type')
        
        if interpretation:
            status_update.append(f"     • Interpretation: {interpretation}")
        if product_type:
            status_update.append(f"     • Product Type: {product_type}")
        if reasoning:
            status_update.append(f"     • Reasoning: {reasoning}")
        
        # Add SHA1-specific info
        if input_type == 'sha1':
            reputation = entity_result.get('file_reputation', 'Unknown')
            if reputation:
                status_update.append(f"     • File Reputation: {reputation}")
        
        # Log Phase 1 results
        logger.log_phase(1, "Entity Resolution", entity_result, "SUCCESS")
        
        return {
            "entity": entity_result,
            "messages": state.messages + [
                AIMessage(content=f"Resolved entity: {product_name} by {vendor_name}")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Entity Resolved"
        }
    except Exception as e:
        logger.log_error("Entity Resolution", e)
        return {
            "entity": None,
            "errors": state.errors + [f"Entity resolution failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Entity resolution failed: {str(e)}"],
            "current_step": "Entity Resolution Failed"
        }


def classify_software_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Classify software into taxonomy using LLM with comprehensive Gartner categories."""
    logger = get_debug_logger(state.input_text)
    
    try:
        status_update = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "📊 PHASE 2: SOFTWARE TAXONOMY CLASSIFICATION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ]
        
        if not state.entity:
            status_update.append("  ⚠️  No entity data available")
            status_update.append("  ✓ Defaulting to 'Other' category (low confidence)")
            return {
                "taxonomy": {
                    "primary_category": "Other",
                    "secondary_categories": [],
                    "confidence": ConfidenceLevel.LOW.value,
                },
                "status_messages": state.status_messages + status_update,
                "current_step": "Classification Complete"
            }
        
        product_name = state.entity.get("product_name") or "Unknown"
        vendor_name = state.entity.get("vendor_name", "")
        website = state.entity.get("website", "")
        
        # Safety check for None or empty product name
        if not product_name or product_name == "Unknown":
            status_update.append(f"  ⚠️  Product name unavailable or unknown")
            status_update.append("  ✓ Defaulting to 'Other' category (low confidence)")
            return {
                "taxonomy": {
                    "primary_category": "Other",
                    "secondary_categories": [],
                    "confidence": ConfidenceLevel.LOW.value,
                },
                "status_messages": state.status_messages + status_update,
                "current_step": "Classification Complete"
            }
        
        status_update.append(f"  🎯 Analyzing product: '{product_name}'")
        status_update.append(f"  🤖 Running LLM-based taxonomy classification...")
        status_update.append(f"  📋 Checking against {len(SOFTWARE_CATEGORIES)} Gartner software categories...")
        
        # Get configuration
        configuration = Configuration.from_runnable_config(config)
        
        # Initialize LLM with thinking enabled
        model_name = configuration.classification_model or DEFAULT_CLASSIFICATION_MODEL
        api_key = get_api_key_for_model(model_name, config)
        
        llm = init_gemini_model(
            model_name=model_name,
            api_key=api_key,
            temperature=0,
            thinking_budget=512
        )
        
        # Format categories as a numbered list for better LLM processing
        categories_formatted = "\n".join([f"{i+1}. {cat}" for i, cat in enumerate(SOFTWARE_CATEGORIES)])
        
        # Build the classification prompt
        prompt_text = SOFTWARE_TAXONOMY_PROMPT.format(
            product_name=product_name,
            categories_list=categories_formatted
        )
        
        # Add context about vendor and website if available
        context_info = f"\n\nADDITIONAL CONTEXT:\n"
        context_info += f"- Product Name: {product_name}\n"
        if vendor_name:
            context_info += f"- Vendor: {vendor_name}\n"
        if website:
            context_info += f"- Website: {website}\n"
        
        prompt_text += context_info
        
        status_update.append(f"  🔍 Invoking LLM for classification...")
        
        # Invoke LLM
        response = llm.invoke([HumanMessage(content=prompt_text)])
        response_text = response.content
        
        # Parse JSON response using common utility
        classification_result = extract_json_from_markdown(response_text)
        
        primary_category = classification_result.get("primary_category", "Other")
        secondary_categories = classification_result.get("secondary_categories", [])
        confidence = classification_result.get("confidence", "medium")
        reasoning = classification_result.get("reasoning", "LLM-based classification")
        
        # Validate that primary category is in our list (case-insensitive match)
        category_lower_map = {cat.lower(): cat for cat in SOFTWARE_CATEGORIES}
        if primary_category.lower() in category_lower_map:
            primary_category = category_lower_map[primary_category.lower()]
        else:
            # If not found, default to "Other" but keep the LLM's suggestion in reasoning
            status_update.append(f"  ⚠️  Category '{primary_category}' not in standard list, using as-is")
        
        # Validate secondary categories
        validated_secondary = []
        for sec_cat in secondary_categories:
            if sec_cat.lower() in category_lower_map:
                validated_secondary.append(category_lower_map[sec_cat.lower()])
            else:
                validated_secondary.append(sec_cat)
        
        status_update.append(f"  ✓ Classification complete!")
        status_update.append(f"     • Primary Category: {primary_category}")
        if validated_secondary:
            status_update.append(f"     • Secondary Categories: {', '.join(validated_secondary)}")
        status_update.append(f"     • Confidence: {confidence.upper()}")
        status_update.append(f"     • Reasoning: {reasoning}")
        
        taxonomy_data = {
            "primary_category": primary_category,
            "secondary_categories": validated_secondary,
            "confidence": confidence,
        }
        
        # Log Phase 2 results
        logger.log_phase(2, "Software Classification", taxonomy_data, "SUCCESS")
        
        return {
            "taxonomy": taxonomy_data,
            "status_messages": state.status_messages + status_update,
            "current_step": "Classification Complete"
        }
    except Exception as e:
        logger.log_error("Software Classification", e)
        status_update.append(f"  ✗ Classification failed: {str(e)}")
        status_update.append(f"  ✓ Defaulting to 'Other' category")
        return {
            "taxonomy": {
                "primary_category": "Other",
                "secondary_categories": [],
                "confidence": ConfidenceLevel.LOW.value,
            },
            "errors": state.errors + [f"Classification failed: {str(e)}"],
            "status_messages": state.status_messages + status_update,
            "current_step": "Classification Failed"
        }


def gather_security_data_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Gather security data from ALL available sources in parallel."""
    logger = get_debug_logger(state.input_text)
    
    try:
        from .tools import (
            lookup_cves, fetch_vendor_security_info, lookup_security_incidents,
            lookup_github_advisories, fetch_terms_of_service, fetch_privacy_policy,
            fetch_dpa, search_security_news, search_us_cert_advisories,
            lookup_malwarebazaar, lookup_urlhaus, lookup_alienvault_otx,
            lookup_whois, search_company_info, search_alternatives, check_fedramp
        )
        
        product_name = state.entity.get("product_name", "Unknown") if state.entity else "Unknown"
        vendor_name = state.entity.get("vendor_name", "Unknown") if state.entity else "Unknown"
        website = state.entity.get("website") if state.entity else None
        
        status_update = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🔐 PHASE 3: COMPREHENSIVE SECURITY DATA GATHERING",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"  🎯 Target: {product_name}",
            f"  🔍 CVE Search: Using product name '{product_name}'",
            f"  📡 Querying 15+ security databases and sources...",
            ""
        ]
        
        # Initialize ALL data collectors
        all_data = {}
        citation_count = 0
        
        # [0] Version Detection (if not provided)
        resolved_version = state.product_version
        skip_cves = False
        
        if not resolved_version or resolved_version == "latest":
            status_update.append("  [0/6]  VERSION DETECTION")
            status_update.append("        ├─ No version specified, looking up latest version...")
            try:
                version_result = lookup_latest_version.invoke({
                    "product_name": product_name,
                    "vendor_name": vendor_name
                })
                
                if version_result.get("found"):
                    resolved_version = version_result.get("version")
                    status_update.append(f"        ├─ [OK] Found latest version: {resolved_version}")
                    status_update.append(f"        └─ Source: {version_result.get('source', 'Tavily search')}")
                else:
                    resolved_version = None
                    skip_cves = True
                    status_update.append("        └─ [WARNING] Could not determine version")
                    status_update.append("        └─ [INFO] CVE lookup will be skipped (version required)")
            except Exception as e:
                resolved_version = None
                skip_cves = True
                status_update.append(f"        └─ [WARNING] Version lookup failed: {str(e)}")
                status_update.append("        └─ [INFO] CVE lookup will be skipped (version required)")
            
            status_update.append("")
        else:
            status_update.append(f"   Using specified version: {resolved_version}")
            status_update.append("")
        
        # [1] CVE Databases
        status_update.append("  [1/6]   VULNERABILITY DATABASES")
        cve_data = None
        
        if skip_cves:
            # Skip CVE lookup if version is not available
            cve_data = {"total_cves": 0, "data_available": False, "skipped": True, "reason": "Version not available"}
            status_update.append("        ├─ NVD: Skipped (version required for accurate CVE matching)")
            status_update.append("        └─ [INFO] Please provide --version flag for CVE analysis")
        else:
            try:
                # Use resolved_version (either user-provided or auto-detected)
                cve_input = {
                    "product_name": product_name,
                    "vendor_name": vendor_name,
                    "product_version": resolved_version
                }
                logger.log_tool_call("lookup_cves", cve_input)
                cve_data = lookup_cves.invoke(cve_input)
                logger.log_tool_call("lookup_cves", cve_input, cve_data)
                cve_count = cve_data.get('total_cves', 0)
                version_str = f" for version {resolved_version}" if resolved_version else ""
                status_update.append(f"        ├─ NVD: {cve_count} CVEs found{version_str} ({cve_data.get('critical_count', 0)} critical)")
                citation_count += 1
            except Exception as e:
                logger.log_tool_call("lookup_cves", {"product_name": product_name, "vendor_name": vendor_name, "product_version": resolved_version}, error=e)
                cve_data = {"total_cves": 0, "data_available": False}
                status_update.append("        ├─ NVD: Query failed")
        
        # GitHub Advisories
        try:
            gh_data = lookup_github_advisories.invoke({"product_name": product_name})
            if gh_data.get('advisory_count', 0) > 0:
                status_update.append(f"        ├─ GitHub Advisories: {gh_data['advisory_count']} found")
                all_data['github_advisories'] = gh_data
                citation_count += 1
        except:
            pass
        
        # US-CERT
        try:
            cert_data = search_us_cert_advisories.invoke({"product_name": product_name})
            if cert_data.get('advisory_count', 0) > 0:
                status_update.append(f"        └─ US-CERT: {cert_data['advisory_count']} advisories")
                all_data['us_cert'] = cert_data
                citation_count += 1
        except:
            status_update.append("        └─ US-CERT: No advisories found")
        
        # [2] Vendor Security & Compliance
        status_update.append("")
        status_update.append("  [2/6] 🏢 VENDOR SECURITY & COMPLIANCE")
        vendor_data = None
        if website:
            try:
                vendor_input = {"website_url": website, "vendor_name": vendor_name}
                logger.log_tool_call("fetch_vendor_security_info", vendor_input)
                vendor_data = fetch_vendor_security_info.invoke(vendor_input)
                logger.log_tool_call("fetch_vendor_security_info", vendor_input, vendor_data)
                certs = vendor_data.get('claimed_certifications', [])
                if certs:
                    status_update.append(f"        ├─ Compliance: {', '.join(certs[:3])}")
                    citation_count += 1
                else:
                    status_update.append("        ├─ Compliance: No certifications found")
            except Exception as e:
                logger.log_tool_call("fetch_vendor_security_info", {"website_url": website, "vendor_name": vendor_name}, error=e)
                vendor_data = {"security_page_found": False, "claimed_certifications": []}
            
            # ToS/Privacy/DPA
            try:
                tos_input = {"website_url": website, "product_name": product_name}
                logger.log_tool_call("fetch_terms_of_service", tos_input)
                tos_data = fetch_terms_of_service.invoke(tos_input)
                logger.log_tool_call("fetch_terms_of_service", tos_input, tos_data)
                if tos_data.get('found'):
                    status_update.append("        ├─ Terms of Service: Found")
                    all_data['tos'] = tos_data
                    citation_count += 1
            except Exception as e:
                logger.log_tool_call("fetch_terms_of_service", {"website_url": website, "product_name": product_name}, error=e)
                pass
            
            try:
                privacy_data = fetch_privacy_policy.invoke({"website_url": website, "product_name": product_name})
                if privacy_data.get('found'):
                    status_update.append("        ├─ Privacy Policy: Found")
                    all_data['privacy'] = privacy_data
                    citation_count += 1
            except:
                pass
            
            try:
                dpa_data = fetch_dpa.invoke({"website_url": website, "product_name": product_name})
                if dpa_data.get('found'):
                    status_update.append("        ├─ DPA: Found")
                    all_data['dpa'] = dpa_data
                    citation_count += 1
            except:
                pass
            
            # FedRAMP
            try:
                fedramp_data = check_fedramp.invoke({"product_name": product_name})
                if fedramp_data.get('authorized'):
                    status_update.append(f"        └─ FedRAMP: {fedramp_data.get('level', 'Authorized')}")
                    all_data['fedramp'] = fedramp_data
                    citation_count += 1
                else:
                    status_update.append("        └─ FedRAMP: Not authorized")
            except:
                status_update.append("        └─ FedRAMP: Check failed")
        else:
            status_update.append("        └─ No website URL - skipping vendor checks")
        
        # [3] Breach & Incident Data
        status_update.append("")
        status_update.append("  [3/6] 🚨 BREACH & INCIDENT DATABASES")
        incident_data = None
        if website:
            from urllib.parse import urlparse
            domain = urlparse(website).netloc or urlparse(website).path
            
            try:
                incident_data = lookup_security_incidents.invoke({"domain": domain, "product_name": product_name})
                breach_count = incident_data.get('breach_count', 0)
                if breach_count > 0:
                    status_update.append(f"        ├─ HaveIBeenPwned: {breach_count} breaches ⚠️")
                    citation_count += 1
                else:
                    status_update.append("        ├─ HaveIBeenPwned: No breaches found ✓")
            except:
                incident_data = {"breach_count": 0, "data_available": False}
                status_update.append("        ├─ HaveIBeenPwned: API key required")
            
            # Security News
            try:
                news_data = search_security_news.invoke({"product_name": product_name})
                news_count = news_data.get('incident_count', 0)
                if news_count > 0:
                    status_update.append(f"        └─ Security News: {news_count} incidents reported")
                    all_data['news'] = news_data
                    citation_count += 1
                else:
                    status_update.append("        └─ Security News: No recent incidents")
            except:
                status_update.append("        └─ Security News: Search failed")
        else:
            status_update.append("        └─ No website - skipping breach checks")
        
        # [4] Threat Intelligence
        status_update.append("")
        status_update.append("  [4/6] 🔍 THREAT INTELLIGENCE")
        
        # MalwareBazaar - check if SHA1 hash is available
        sha1_hash = state.entity.get("sha1_hash") if state.entity else None
        if sha1_hash:
            try:
                malware_data = lookup_malwarebazaar.invoke({"sha1_hash": sha1_hash})
                if malware_data.get('malware_detected'):
                    samples = malware_data.get('samples_found', 0)
                    status_update.append(f"        ├─ MalwareBazaar: {samples} malware samples found ⚠️")
                    all_data['malwarebazaar'] = malware_data
                    citation_count += 1
                else:
                    status_update.append("        ├─ MalwareBazaar: No malware detected ✓")
            except:
                status_update.append("        ├─ MalwareBazaar: Check failed")
        else:
            # Fallback: search by product name if no SHA1
            try:
                malware_data = lookup_malwarebazaar.invoke({"product_name": product_name})
                if malware_data.get('malware_detected'):
                    samples = malware_data.get('samples_found', 0)
                    status_update.append(f"        ├─ MalwareBazaar: {samples} tagged samples found")
                    all_data['malwarebazaar'] = malware_data
                    citation_count += 1
                else:
                    status_update.append("        ├─ MalwareBazaar: No tagged samples")
            except:
                status_update.append("        ├─ MalwareBazaar: Check failed")
        
        # Domain-based threat intel
        if website:
            domain = urlparse(website).netloc or urlparse(website).path
            
            try:
                urlhaus_data = lookup_urlhaus.invoke({"domain": domain})
                malicious_count = urlhaus_data.get('malicious_urls_found', 0)
                if malicious_count > 0:
                    status_update.append(f"        ├─ URLhaus: {malicious_count} malicious URLs ⚠️")
                    all_data['urlhaus'] = urlhaus_data
                    citation_count += 1
                else:
                    status_update.append("        ├─ URLhaus: Clean ✓")
            except:
                status_update.append("        ├─ URLhaus: Check failed")
            
            try:
                otx_data = lookup_alienvault_otx.invoke({"domain": domain})
                threat_found = otx_data.get('threat_found', False)
                if threat_found:
                    status_update.append(f"        └─ AlienVault OTX: Threats detected ⚠️")
                    all_data['otx'] = otx_data
                    citation_count += 1
                else:
                    status_update.append("        └─ AlienVault OTX: No threats ✓")
            except:
                status_update.append("        └─ AlienVault OTX: Check failed")
        else:
            status_update.append("        └─ No domain - skipping domain-based threat intel")
        
        # [5] Company Information
        status_update.append("")
        status_update.append("  [5/6] 🏛️  COMPANY & DOMAIN INFO")
        if website:
            domain = urlparse(website).netloc or urlparse(website).path
            
            try:
                whois_data = lookup_whois.invoke({"domain": domain})
                if whois_data.get('creation_date'):
                    status_update.append(f"        ├─ WHOIS: Domain created {whois_data['creation_date'][:10]}")
                    all_data['whois'] = whois_data
                    citation_count += 1
            except:
                status_update.append("        ├─ WHOIS: Lookup failed")
            
            try:
                company_data = search_company_info.invoke({"company_name": vendor_name})
                if company_data.get('found'):
                    status_update.append("        └─ Company Info: Found")
                    all_data['company'] = company_data
                    citation_count += 1
            except:
                status_update.append("        └─ Company Info: Not found")
        else:
            status_update.append("        └─ No website - skipping company checks")
        
        # [6] Alternatives
        status_update.append("")
        status_update.append("  [6/6] 🔄 ALTERNATIVE PRODUCTS")
        try:
            alt_data = search_alternatives.invoke({"product_name": product_name})
            alt_count = alt_data.get('alternative_count', 0)
            if alt_count > 0:
                status_update.append(f"        └─ Found {alt_count} alternatives (G2/AlternativeTo)")
                all_data['alternatives'] = alt_data
                citation_count += 1
            else:
                status_update.append("        └─ No alternatives found")
        except:
            status_update.append("        └─ Alternative search failed")
        
        status_update.append("")
        status_update.append(f"  ✓ Data collection complete! {citation_count} sources queried successfully.")
        
        # Log Phase 3 results
        phase3_data = {
            "cve_data": cve_data,
            "vendor_data": vendor_data,
            "incident_data": incident_data,
            "additional_sources_count": len(all_data),
            "additional_sources": list(all_data.keys()) if all_data else []
        }
        logger.log_phase(3, "Security Data Gathering", phase3_data, "SUCCESS")
        
        return {
            "cve_data": cve_data,
            "vendor_data": vendor_data,
            "incident_data": incident_data,
            "additional_data": all_data,  # Store all extra data
            "product_version": resolved_version,  # Update with resolved version
            "messages": state.messages + [
                AIMessage(content=f"Security data gathered from {citation_count} sources")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Security Data Gathered"
        }
    except Exception as e:
        logger.log_error("Security Data Gathering", e)
        return {
            "errors": state.errors + [f"Data gathering failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Data gathering failed: {str(e)}"],
            "current_step": "Data Gathering Failed"
        }


def generate_ciso_brief_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Generate final CISO brief with LLM."""
    logger = get_debug_logger(state.input_text)
    
    try:
        status_update = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🤖 PHASE 4: AI ANALYSIS & BRIEF GENERATION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "  🧠 Initializing Gemini 2.5 Pro analysis engine...",
        ]
        
        # Get configuration
        configuration = Configuration.from_runnable_config(config)
        status_update.append(f"  ⚙️  Model: {configuration.final_report_model}")
        
        # Get model name and API key
        model_name = configuration.final_report_model or DEFAULT_FINAL_REPORT_MODEL
        api_key = get_api_key_for_model(model_name, config or {})
        
        # Initialize model with thinking enabled (Pro model for detailed reports)
        model = init_gemini_model(
            model_name=model_name,
            api_key=api_key,
            temperature=0,
            thinking_budget=1024
        )
        
        # Prepare entity data
        entity_data = EntityResolution(**state.entity) if state.entity else EntityResolution(
            product_name="Unknown",
            vendor_name="Unknown",
            verified=False,
            input_type="unknown",
            confidence=ConfidenceLevel.INSUFFICIENT
        )
        
        # Prepare taxonomy
        taxonomy_data = SoftwareTaxonomy(**state.taxonomy) if state.taxonomy else SoftwareTaxonomy(
            primary_category="Other",
            confidence=ConfidenceLevel.LOW
        )
        
        # Prepare CVE data
        cve_summary = CVETrendSummary(**state.cve_data) if state.cve_data else CVETrendSummary(
            data_available=False
        )
        
        # Prepare vendor data
        vendor_reputation = VendorReputation(**state.vendor_data) if state.vendor_data else VendorReputation(
            vendor_name=entity_data.vendor_name
        )
        
        # Prepare incident data
        incident_report = IncidentReport(**state.incident_data) if state.incident_data else IncidentReport(
            data_available=False
        )
        
        # PARSE COMPLIANCE DATA FIRST (before LLM scoring) to use actual values
        iso_certs = extract_iso_certifications(vendor_reputation)
        gdpr_in_certs = check_gdpr_in_certifications(iso_certs)
        encryption_mentioned = check_encryption_mentions(state.additional_data)
        
        # Calculate trust and risk scores using modular scoring system
        trust_score, risk_score, confidence, rationale, status_update = calculate_risk_trust_scores(
            model=model,
            entity_data=entity_data,
            cve_summary=cve_summary,
            incident_report=incident_report,
            vendor_reputation=vendor_reputation,
            iso_certs=iso_certs,
            gdpr_in_certs=gdpr_in_certs,
            encryption_mentioned=encryption_mentioned,
            state_additional_data=state.additional_data or {},
            status_update=status_update
        )
        
        # Extract alternatives using modular extractor
        alternatives = extract_alternatives_from_community(
            state_entity=state.entity,
            state_additional_data=state.additional_data,
            config=config,
            status_update=status_update
        )
        
        # Parse full compliance data for final brief
        (gdpr_compliant, gdpr_source, encryption_full, encryption_source,
         data_retention_policy, third_party_sharing, iso_certs_full, soc2_status) = parse_compliance_data(
            vendor_reputation=vendor_reputation,
            additional_data=state.additional_data or {}
        )
        
        # Build citations from all sources
        citations = build_citations(
            entity_data=entity_data,
            cve_summary=cve_summary,
            additional_data=state.additional_data or {}
        )
        
        # Generate insufficiency notes
        insufficient_notes = generate_insufficient_notes(
            cve_data=state.cve_data,
            vendor_data=state.vendor_data,
            incident_data=state.incident_data,
            additional_data=state.additional_data
        )
        
        # Assemble final CISO brief
        status_update.append("")
        status_update.append("  [Step 5/5] 📝 Assembling final CISO brief...")
        status_update.append("        ├─ Compiling assessment components")
        status_update.append("        ├─ Generating executive summary")
        status_update.append("        ├─ Building citations list")
        status_update.append("        ├─ Adding insufficiency notes")
        status_update.append("        └─ Formatting markdown output")
        
        ciso_brief = assemble_ciso_brief(
            entity_data=entity_data,
            taxonomy_data=taxonomy_data,
            vendor_reputation=vendor_reputation,
            cve_summary=cve_summary,
            incident_report=incident_report,
            trust_score=trust_score,
            risk_score=risk_score,
            rationale=rationale,
            confidence=confidence,
            alternatives=alternatives,
            citations=citations,
            insufficient_notes=insufficient_notes,
            soc2_status=soc2_status,
            iso_certs=iso_certs_full,
            gdpr_compliant=gdpr_compliant,
            encryption_mentioned=encryption_full,
            data_retention_policy=data_retention_policy,
            third_party_sharing=third_party_sharing
        )
        
        # Format summary message
        summary_messages = format_summary_message(
            entity_data=entity_data,
            taxonomy_data=taxonomy_data,
            trust_score=trust_score,
            risk_score=risk_score,
            confidence=confidence,
            cve_summary=cve_summary,
            incident_report=incident_report,
            citations=citations
        )
        status_update.extend(summary_messages)
        
        # Log Phase 4 results
        phase4_data = {
            "trust_score": trust_score,
            "risk_score": risk_score,
            "rationale": rationale[:500],  # Truncate for readability
            "confidence": confidence.value,
            "alternatives_count": len(alternatives)
        }
        logger.log_phase(4, "AI Analysis & Brief Generation", phase4_data, "SUCCESS")
        
        # Log final summary
        logger.log_summary(ciso_brief.model_dump())
        
        # Print log file location
        status_update.append(f"\n📝 Debug log saved to: {logger.get_log_path()}")
        
        return {
            "ciso_brief": ciso_brief,
            "messages": state.messages + [
                AIMessage(content="CISO brief generated successfully")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Complete"
        }
    except Exception as e:
        logger.log_error("Brief Generation", e)
        return {
            "errors": state.errors + [f"Brief generation failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Brief generation failed: {str(e)}"],
            "current_step": "Failed"
        }


def should_continue_after_entity_resolution(state: AssessmentState) -> str:
    """Determine if assessment should continue after entity resolution.
    
    Returns "continue" if entity was resolved successfully, "end" otherwise.
    """
    if state.entity is None:
        # Entity resolution failed - stop assessment
        return "end"
    
    # Check if we have sufficient data (not both Unknown)
    product_name = state.entity.get('product_name', 'Unknown')
    vendor_name = state.entity.get('vendor_name', 'Unknown')
    
    if product_name == 'Unknown' and vendor_name == 'Unknown':
        # Insufficient data - stop assessment
        return "end"
    
    # Sufficient data - continue assessment
    return "continue"


def create_ciso_assessor_graph() -> StateGraph:
    """Create the CISO security assessor graph."""
    
    # Create graph
    workflow = StateGraph(AssessmentState)
    
    # Add nodes
    workflow.add_node("resolve_entity", resolve_entity_node)
    workflow.add_node("classify_software", classify_software_node)
    workflow.add_node("gather_security_data", gather_security_data_node)
    workflow.add_node("generate_ciso_brief", generate_ciso_brief_node)
    
    # Define edges
    workflow.set_entry_point("resolve_entity")
    
    # Conditional edge: only continue if entity resolution succeeded
    workflow.add_conditional_edges(
        "resolve_entity",
        should_continue_after_entity_resolution,
        {
            "continue": "classify_software",
            "end": END
        }
    )
    
    workflow.add_edge("classify_software", "gather_security_data")
    workflow.add_edge("gather_security_data", "generate_ciso_brief")
    workflow.add_edge("generate_ciso_brief", END)
    
    return workflow.compile()


# Main entry point
def assess_security(input_text: str, config: Optional[RunnableConfig] = None) -> CISOBrief:
    """Assess security of a product/tool.
    
    Args:
        input_text: Product name, URL, or SHA1 hash
        config: Optional configuration
        
    Returns:
        CISOBrief with complete security assessment
    """
    graph = create_ciso_assessor_graph()
    
    initial_state = AssessmentState(
        input_text=input_text,
        messages=[HumanMessage(content=f"Assess security for: {input_text}")]
    )
    
    result = graph.invoke(initial_state, config=config or {})
    
    if result.get("errors"):
        print("Errors encountered:", result["errors"])
    
    return result.get("ciso_brief")
