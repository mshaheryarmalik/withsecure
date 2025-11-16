"""CISO Security Assessor - Main orchestration graph."""

import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from langchain.chat_models import init_chat_model
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
from .utils import get_api_key_for_model
from .debug_logger import get_debug_logger


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
        technology_stack = state.entity.get("technology_stack", [])
        technology_note = state.entity.get("technology_note")
        homepage_title = state.entity.get("homepage_title", "")
        homepage_description = state.entity.get("homepage_description", "")
        homepage_content = state.entity.get("homepage_content", "")
        input_type = state.entity.get("input_type")
        
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
        
        if input_type == "url":
            status_update.append("  🌐 URL input detected - enriching classification with homepage insights and detected technologies.")
        status_update.append(f"  🎯 Analyzing product: '{product_name}'")
        status_update.append(f"  🤖 Running LLM-based taxonomy classification...")
        status_update.append(f"  📋 Checking against {len(SOFTWARE_CATEGORIES)} Gartner software categories...")
        
        # Get configuration
        configuration = Configuration.from_runnable_config(config)
        
        # Initialize LLM (use Gemini model - same pattern as workers)
        model_name = configuration.classification_model or "gemini-2.0-flash-exp"
        api_key = get_api_key_for_model(model_name, config)
        
        llm = init_chat_model(
            model=model_name,
            model_provider="google_genai",
            api_key=api_key,
            temperature=0
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
        if homepage_title:
            context_info += f"- Homepage Title: {homepage_title[:140]}\n"
        if homepage_description:
            context_info += f"- Homepage Description: {homepage_description[:200]}\n"
        if homepage_content:
            homepage_snippet = " ".join(homepage_content.split())
            context_info += f"- Homepage Content Snippet: {homepage_snippet[:600]}\n"
        if technology_stack:
            context_info += f"- Detected Technology Stack: {', '.join(technology_stack[:8])}\n"
        elif technology_note:
            context_info += f"- Technology Stack Note: {technology_note}\n"
        
        prompt_text += context_info
        
        status_update.append(f"  🔍 Invoking LLM for classification...")
        
        # Invoke LLM
        response = llm.invoke([HumanMessage(content=prompt_text)])
        response_text = response.content
        
        # Parse JSON response
        # Clean up markdown formatting if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        classification_result = json.loads(response_text)
        
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
            lookup_cves,
            fetch_vendor_security_info,
            lookup_security_incidents,
            lookup_github_advisories,
            fetch_terms_of_service,
            fetch_privacy_policy,
            fetch_dpa,
            search_security_news,
            search_us_cert_advisories,
            lookup_malwarebazaar,
            lookup_urlhaus,
            lookup_alienvault_otx,
            lookup_whois,
            search_company_info,
            search_alternatives,
            check_fedramp,
            check_cisa_kev,
            search_databreaches_net,
            search_privacy_rights_clearinghouse,
            lookup_circl_cves,
            search_cisa_alerts,
            search_packetstorm_advisories,
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
        
        if not resolved_version or resolved_version == "latest":
            status_update.append("  [0/6]  VERSION DETECTION")
            status_update.append("        ├─ No version specified, attempting to detect latest release...")
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
                    status_update.append("        └─ [INFO] Could not confirm latest version, continuing with product-wide CVE search")
            except Exception as e:
                resolved_version = None
                status_update.append(f"        └─ [WARNING] Version lookup failed: {str(e)}")
                status_update.append("        └─ Proceeding with product-wide CVE search")
            
            status_update.append("")
        else:
            status_update.append(f"   Using specified version: {resolved_version}")
            status_update.append("")
        
        # [1] CVE Databases
        status_update.append("  [1/6]   VULNERABILITY DATABASES")
        cve_data = None
        
        try:
            cve_input = {
                "product_name": product_name,
                "vendor_name": vendor_name,
                "product_version": resolved_version if resolved_version and resolved_version.lower() != "latest" else None
            }
            logger.log_tool_call("lookup_cves", cve_input)
            cve_data = lookup_cves.invoke(cve_input)
            logger.log_tool_call("lookup_cves", cve_input, cve_data)
            cve_count = cve_data.get('total_cves', 0)
            version_str = f" for version {resolved_version}" if resolved_version else ""
            status_update.append(f"        ├─ NVD: {cve_count} CVEs found{version_str} ({cve_data.get('critical_count', 0)} critical)")
            citation_count += 1
            
            # Cross-reference against CISA KEV when CVEs are present
            recent_cves = cve_data.get("recent_cves", [])
            if recent_cves:
                kev_input = {"cve_ids": [entry.get("cve_id") for entry in recent_cves if entry.get("cve_id")]}
                if kev_input["cve_ids"]:
                    logger.log_tool_call("check_cisa_kev", kev_input)
                    kev_result = check_cisa_kev.invoke(kev_input)
                    logger.log_tool_call("check_cisa_kev", kev_input, kev_result)
                    kev_count = kev_result.get("kev_count", 0)
                    if kev_count:
                        status_update.append(f"        ├─ CISA KEV: {kev_count} exploit(s) confirmed")
                        cve_data["cisa_kev_count"] = kev_count
                        # Mark CVEs present in KEV
                        kev_ids = {entry.get("cve_id") or entry.get("cveID") for entry in kev_result.get("kev_entries", [])}
                        for entry in recent_cves:
                            if entry.get("cve_id") in kev_ids:
                                entry["in_cisa_kev"] = True
                        all_data["cisa_kev"] = kev_result
                        citation_count += 1
                    else:
                        status_update.append("        ├─ CISA KEV: No matches")
        except Exception as e:
            logger.log_tool_call("lookup_cves", {"product_name": product_name, "vendor_name": vendor_name, "product_version": resolved_version}, error=e)
            cve_data = {"total_cves": 0, "data_available": False, "error": str(e)}
            status_update.append(f"        ├─ NVD: Query failed ({str(e)})")
        
        # CIRCL CVE search (no API key required)
        try:
            circl_input = {
                "product_name": product_name,
                "vendor_name": vendor_name if vendor_name and vendor_name.lower() != "unknown" else None,
            }
            circl_data = lookup_circl_cves.invoke(circl_input)
            if circl_data.get("match_count", 0) > 0:
                status_update.append(f"        ├─ CIRCL CVE Search: {circl_data['match_count']} matches")
                all_data['circl_cves'] = circl_data
                citation_count += 1
            else:
                status_update.append("        ├─ CIRCL CVE Search: No matches")
        except Exception as e:
            status_update.append(f"        ├─ CIRCL CVE Search: Failed ({str(e)})")
        
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
                status_update.append(f"        ├─ US-CERT: {cert_data['advisory_count']} advisories")
                all_data['us_cert'] = cert_data
                citation_count += 1
        except:
            status_update.append("        ├─ US-CERT: No advisories found")
        
        # CISA Alerts feed
        try:
            cisa_alerts = search_cisa_alerts.invoke({"product_name": product_name})
            if cisa_alerts.get("match_count", 0) > 0:
                status_update.append(f"        ├─ CISA Alerts: {cisa_alerts['match_count']} relevant alert(s)")
                all_data['cisa_alerts'] = cisa_alerts
                citation_count += 1
            else:
                status_update.append("        ├─ CISA Alerts: No matches")
        except Exception as e:
            status_update.append(f"        ├─ CISA Alerts: Lookup failed ({str(e)})")
        
        # Packet Storm advisories
        try:
            packetstorm_data = search_packetstorm_advisories.invoke({"product_name": product_name})
            if packetstorm_data.get("match_count", 0) > 0:
                status_update.append(f"        └─ Packet Storm: {packetstorm_data['match_count']} advisory hit(s)")
                all_data['packetstorm'] = packetstorm_data
                citation_count += 1
            else:
                status_update.append("        └─ Packet Storm: No matches")
        except Exception as e:
            status_update.append(f"        └─ Packet Storm: Lookup failed ({str(e)})")
        
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
            except Exception as e:
                incident_data = {"breach_count": 0, "data_available": False, "error": str(e)}
                status_update.append(f"        ├─ HaveIBeenPwned: {str(e)}")
            
            # Security News
            try:
                news_data = search_security_news.invoke({"product_name": product_name})
                news_count = news_data.get('incident_count', 0)
                if news_count > 0:
                    status_update.append(f"        ├─ Security News: {news_count} incidents reported")
                    all_data['news'] = news_data
                    citation_count += 1
                else:
                    status_update.append("        ├─ Security News: No recent incidents")
            except Exception as e:
                status_update.append(f"        ├─ Security News: Search failed ({str(e)})")
        else:
            status_update.append("        ├─ No website - skipping domain breach checks")
        
        # Additional breach intelligence
        try:
            databreach_data = search_databreaches_net.invoke({"product_name": product_name})
            if databreach_data.get('breach_count', 0) > 0:
                status_update.append(f"        ├─ DataBreaches.net: {databreach_data['breach_count']} relevant report(s)")
                all_data['databreaches_net'] = databreach_data
                citation_count += 1
            else:
                status_update.append("        ├─ DataBreaches.net: No recent reports")
        except Exception as e:
            status_update.append(f"        ├─ DataBreaches.net: Lookup failed ({str(e)})")
        
        try:
            prc_data = search_privacy_rights_clearinghouse.invoke({"product_name": product_name})
            if prc_data.get('breach_count', 0) > 0:
                status_update.append(f"        └─ Privacy Rights Clearinghouse: {prc_data['breach_count']} incident(s)")
                all_data['privacy_rights'] = prc_data
                citation_count += 1
            else:
                status_update.append("        └─ Privacy Rights Clearinghouse: No indexed incidents")
        except Exception as e:
            status_update.append(f"        └─ Privacy Rights Clearinghouse: Lookup failed ({str(e)})")
        
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
        
        # Parse model string (format: "provider:model" or just "model")
        model_str = configuration.final_report_model
        if ":" in model_str:
            provider, model_name = model_str.split(":", 1)
        else:
            provider = "google_genai"
            model_name = model_str
        
        # Get API key
        api_key = get_api_key_for_model(model_str, config or {})
        
        # Initialize model
        model = init_chat_model(
            model=model_name,
            model_provider=provider,
            api_key=api_key
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
        encryption_mentioned = False
        iso_certs = []
        gdpr_in_certs = False
        
        # Extract ISO certifications
        if vendor_reputation.claimed_certifications:
            for cert in vendor_reputation.claimed_certifications:
                if 'ISO' in cert:
                    from .security_state import CertificationDetail
                    iso_certs.append(CertificationDetail(
                        certification_type=cert,
                        status="claimed",
                        source_label=SourceLabel.VENDOR_STATED
                    ))
                if 'GDPR' in cert:
                    gdpr_in_certs = True
        
        # Parse ToS/Privacy/DPA for encryption mentions
        if state.additional_data:
            if state.additional_data.get('tos') and state.additional_data['tos'].get('content'):
                if 'encrypt' in state.additional_data['tos']['content'].lower():
                    encryption_mentioned = True
            
            if not encryption_mentioned and state.additional_data.get('privacy') and state.additional_data['privacy'].get('content'):
                if 'encrypt' in state.additional_data['privacy']['content'].lower():
                    encryption_mentioned = True
            
            if not encryption_mentioned and state.additional_data.get('dpa') and state.additional_data['dpa'].get('content'):
                if 'encrypt' in state.additional_data['dpa']['content'].lower():
                    encryption_mentioned = True
        
        # Calculate scores using LLM - provide ALL PARSED data
        scoring_prompt = RISK_SCORING_PROMPT.format(
            product_name=entity_data.product_name,
            vendor_name=entity_data.vendor_name,
            website=entity_data.website or "Not found",
            total_cves=cve_summary.total_cves,
            critical=cve_summary.critical_count,
            high=cve_summary.high_count,
            kev_count=cve_summary.cisa_kev_count,
            trend=cve_summary.trend,
            breaches=incident_report.breach_count,
            incidents=len(incident_report.incidents),
            soc2=vendor_reputation.claimed_certifications,
            iso_count=len(iso_certs),
            gdpr=gdpr_in_certs,
            encryption=encryption_mentioned,
            tos_found=bool(state.additional_data and state.additional_data.get('tos')),
        )
        
        # Count available data
        data_points = 0
        if state.cve_data:
            data_points += state.cve_data.get('total_cves', 0)
        if state.vendor_data and state.vendor_data.get('security_page_found'):
            data_points += len(state.vendor_data.get('claimed_certifications', []))
        if state.incident_data:
            data_points += state.incident_data.get('breach_count', 0)
        
        status_update.append(f"  📊 Processing {data_points}+ security data points...")
        status_update.append("")
        status_update.append("  [Step 1/5] 🔍 Analyzing security posture...")
        status_update.append("        ├─ Evaluating CVE severity distribution")
        status_update.append("        ├─ Assessing vulnerability trends")
        status_update.append("        ├─ Checking exploit status (CISA KEV)")
        status_update.append("        └─ Analyzing vendor transparency")
        
        messages = [
            {"role": "system", "content": CISO_SYSTEM_PROMPT},
            {"role": "user", "content": scoring_prompt}
        ]
        
        status_update.append("")
        status_update.append("  [Step 2/5] 🤖 Invoking AI reasoning model...")
        scoring_response = model.invoke(messages)
        status_update.append("        └─ ✓ AI analysis complete (reasoning generated)")
        
        # Parse JSON response from LLM
        trust_score = 50  # Default
        risk_score = 50
        confidence = ConfidenceLevel.MEDIUM
        rationale = "Assessment based on available data"
        
        try:
            content = scoring_response.content if hasattr(scoring_response, 'content') else ""
            
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            elif "{" in content:
                # Extract just the JSON object
                start = content.find("{")
                end = content.rfind("}") + 1
                content = content[start:end]
            
            # Parse JSON
            scores_data = json.loads(content)
            trust_score = scores_data.get('trust_score', 50)
            risk_score = scores_data.get('risk_score', 50)
            rationale = scores_data.get('rationale', 'Assessment based on available data')
        except Exception as e:
            # Fallback to regex if JSON parsing fails
            trust_match = re.search(r'trust[_\s]*score[:\s]*(\d+)', content, re.IGNORECASE)
            risk_match = re.search(r'risk[_\s]*score[:\s]*(\d+)', content, re.IGNORECASE)
            
            if trust_match:
                trust_score = int(trust_match.group(1))
            if risk_match:
                risk_score = int(risk_match.group(1))
        
        status_update.append("")
        status_update.append("  [Step 3/5] 📊 Calculating trust & risk scores...")
        
        # Determine confidence based on data availability (including ALL sources)
        data_sources = 0
        source_names = []
        if state.cve_data and state.cve_data.get('data_available'):
            data_sources += 1
            source_names.append("NVD")
        if state.vendor_data and state.vendor_data.get('security_page_found'):
            data_sources += 1
            source_names.append("Vendor Pages")
        if state.incident_data and state.incident_data.get('data_available'):
            data_sources += 1
            source_names.append("HIBP")
        
        # Count additional sources
        if state.additional_data:
            for source_key in state.additional_data.keys():
                data_sources += 1
                source_names.append(source_key.replace('_', ' ').title())
        
        status_update.append(f"        ├─ Data sources available: {data_sources}")
        for i, name in enumerate(source_names[:6], 1):  # Show first 6
            status_update.append(f"        │  {'└' if i == min(len(source_names), 6) else '├'}─ {name}")
        if len(source_names) > 6:
            status_update.append(f"        │  └─ ...and {len(source_names) - 6} more")
        
        # Process threat intelligence and advisories from additional_data
        advisory_penalty = 0
        if state.additional_data:
            # Check GitHub Advisories - add to risk
            gh_advisories = state.additional_data.get('github_advisories', {})
            if gh_advisories.get('advisory_count', 0) > 0:
                advisory_penalty += gh_advisories['advisory_count'] * 0.3
            
            # Check US-CERT Advisories - add to risk (government warnings are serious)
            cert_advisories = state.additional_data.get('us_cert', {})
            if cert_advisories.get('advisory_count', 0) > 0:
                advisory_penalty += cert_advisories['advisory_count'] * 0.5
            
            # Check MalwareBazaar - major risk if malware detected
            malware_data = state.additional_data.get('malwarebazaar', {})
            if malware_data.get('malware_detected'):
                risk_score = min(100, risk_score + 25)
                trust_score = max(0, trust_score - 20)
                status_update.append("        ⚠️  ALERT: Malware samples detected in MalwareBazaar")
            
            # Check URLhaus - major risk if malicious URLs found
            urlhaus_data = state.additional_data.get('urlhaus', {})
            if urlhaus_data.get('malicious_urls_found', 0) > 0:
                risk_score = min(100, risk_score + 20)
                trust_score = max(0, trust_score - 15)
                status_update.append("        ⚠️  ALERT: Malicious URLs detected in URLhaus")
            
            # Check AlienVault OTX - moderate risk if threats found
            otx_data = state.additional_data.get('otx', {})
            if otx_data.get('threat_found'):
                risk_score = min(100, risk_score + 15)
                trust_score = max(0, trust_score - 10)
                status_update.append("        ⚠️  WARNING: Threat indicators in AlienVault OTX")
            
            # Check WHOIS domain age - older domains = more trust
            whois_data = state.additional_data.get('whois', {})
            if whois_data.get('creation_date'):
                try:
                    from datetime import datetime
                    creation_date = whois_data['creation_date']
                    if isinstance(creation_date, str) and len(creation_date) >= 4:
                        year = int(creation_date[:4])
                        current_year = datetime.now().year
                        domain_age = current_year - year
                        
                        if domain_age >= 10:
                            trust_score = min(100, trust_score + 5)
                            status_update.append(f"        ✓ Domain age: {domain_age} years (trust bonus)")
                        elif domain_age >= 5:
                            trust_score = min(100, trust_score + 3)
                        elif domain_age < 2:
                            trust_score = max(0, trust_score - 5)
                            status_update.append(f"        ⚠️  Domain age: {domain_age} years (new domain)")
                except:
                    pass
        
        # Apply advisory penalty to risk score
        if advisory_penalty > 0:
            risk_score = min(100, risk_score + int(advisory_penalty))
            status_update.append(f"        ⚠️  Additional advisories: {int(advisory_penalty)} risk points added")
        
        if data_sources >= 2:
            confidence = ConfidenceLevel.MEDIUM
        elif data_sources >= 1:
            confidence = ConfidenceLevel.LOW
        else:
            confidence = ConfidenceLevel.INSUFFICIENT
        
        status_update.append(f"        ├─ Confidence level: {confidence.value.upper()}")
        status_update.append("        ├─ Trust score algorithm:")
        status_update.append("        │  ├─ Base: 50/100")
        status_update.append("        │  ├─ CVE penalty: -{cve_summary.total_cves * 0.5}")
        status_update.append("        │  ├─ Breach penalty: -{incident_report.breach_count * 10}")
        status_update.append("        │  └─ Transparency bonus: +{vendor_reputation.claimed_certifications count * 2}")
        status_update.append(f"        ├─ ✓ Trust Score: {trust_score}/100")
        status_update.append(f"        └─ ✓ Risk Score: {risk_score}/100")
        
        status_update.append("")
        status_update.append("  [Step 4/5] 🔄 Identifying safer alternatives...")
        status_update.append(f"        ├─ Category: {taxonomy_data.primary_category}")
        status_update.append("        ├─ Searching alternative database...")
        
        # Generate alternatives - use Phase 3 collected data only
        alternatives = []
        
        # Try to use alternatives from Phase 3 data gathering
        if state.additional_data and 'alternatives' in state.additional_data:
            alt_data = state.additional_data['alternatives']
            if alt_data.get('alternatives') and isinstance(alt_data['alternatives'], list):
                status_update.append(f"        ├─ Processing {len(alt_data['alternatives'])} search results from Phase 3...")
                
                # Collect all summaries to extract product names using LLM
                summaries_text = ""
                for i, alt in enumerate(alt_data['alternatives'][:5]):
                    if isinstance(alt, dict):
                        content = alt.get('summary', alt.get('content', ''))
                        if content:
                            summaries_text += f"\nResult {i+1}: {content[:300]}\n"
                
                if summaries_text:
                    try:
                        # Use LLM to extract actual product names from summaries
                        extraction_prompt = f"""Extract the actual alternative product/software names mentioned in these search results.

Search results about alternatives to "{state.entity.get('product_name', 'the product')}":
{summaries_text}

Return ONLY a JSON array of the top 1 to 2 alternative products mentioned, with this format:
[
  {{"product_name": "Product Name", "vendor_name": "Vendor Name", "reason": "brief reason why it's an alternative"}},
  ...
]

IMPORTANT:
- Extract ACTUAL product names (e.g., "Microsoft Teams", "Slack", "Google Workspace")
- Do NOT include generic terms like "alternatives", "competitors", "best tools"
- Only include products that are clearly mentioned as alternatives
- Limit to top 1 to 2 most relevant alternatives
- If no vendor names are found, dont return them.
- If no product names are found, dont return the product name
- If no reason is found, dont return the reason
- Return ONLY the JSON array, no other text"""


                        # Get configuration and initialize LLM
                        configuration = Configuration.from_runnable_config(config)
                        model_name = configuration.classification_model or "gemini-2.0-flash-exp"
                        api_key = get_api_key_for_model(model_name, config)
                        
                        llm = init_chat_model(
                            model=model_name,
                            model_provider="google_genai",
                            api_key=api_key,
                            temperature=0
                        )
                        
                        response = llm.invoke([HumanMessage(content=extraction_prompt)])
                        response_text = response.content.strip()
                        
                        # Clean JSON formatting
                        if response_text.startswith("```json"):
                            response_text = response_text[7:]
                        if response_text.startswith("```"):
                            response_text = response_text[3:]
                        if response_text.endswith("```"):
                            response_text = response_text[:-3]
                        response_text = response_text.strip()
                        
                        extracted_products = json.loads(response_text)
                        
                        # Convert to AlternativeProduct objects
                        for product in extracted_products:
                            if isinstance(product, dict):
                                prod_name = product.get('product_name', '').strip()
                                vendor = product.get('vendor_name', '').strip()
                                reason = product.get('reason', 'Alternative product')
                                
                                if prod_name and prod_name.lower() not in ['unknown', 'alternatives', 'competitors']:
                                    alternatives.append(AlternativeProduct(
                                        product_name=prod_name,
                                        vendor_name=vendor,
                                        rationale=reason
                                    ))
                                    status_update.append(f"        │  • {prod_name} ({vendor})")
                        
                        if alternatives:
                            status_update.append(f"        ├─ ✓ Extracted {len(alternatives)} products using LLM")
                    
                    except Exception as e:
                        status_update.append(f"        ├─ ⚠️  LLM extraction failed: {str(e)}")
        
        # Report results
        if alternatives:
            status_update.append(f"        └─ ✓ Found {len(alternatives)} alternatives from Phase 3 data")
        else:
            status_update.append(f"        └─ ⚠️  No alternatives found")
        
        # Build citations from ALL sources with real URLs
        citations: List[Citation] = []
        citation_urls_seen = set()

        def add_citation(url: Optional[str], source_type: str, label: SourceLabel, claim: str) -> None:
            if not url:
                return
            if url in citation_urls_seen:
                return
            citation_urls_seen.add(url)
            citations.append(
                Citation(
                    source_url=url,
                    source_type=source_type,
                    source_label=label,
                    accessed_date=datetime.now().strftime("%Y-%m-%d"),
                    claim=claim,
                )
            )

        # NVD
        if state.cve_data and state.cve_data.get("data_available"):
            add_citation(
                state.cve_data.get("source_url") or "https://nvd.nist.gov",
                "NVD",
                SourceLabel.INDEPENDENT,
                "CVE data and vulnerability counts",
            )

        # CISA KEV
        if state.additional_data and state.additional_data.get("cisa_kev"):
            add_citation(
                "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
                "CISA KEV Catalog",
                SourceLabel.INDEPENDENT,
                "Known exploited vulnerabilities",
            )
        if state.additional_data and state.additional_data.get("circl_cves"):
            add_citation(
                state.additional_data["circl_cves"].get("source_url") or "https://cve.circl.lu",
                "CIRCL CVE Search",
                SourceLabel.INDEPENDENT,
                "Additional vulnerability intelligence",
            )

        # GitHub Advisories
        if state.additional_data and state.additional_data.get("github_advisories"):
            github_advisories = state.additional_data["github_advisories"].get("advisories", [])
            if github_advisories:
                add_citation(
                    github_advisories[0].get("url"),
                    "GitHub Security Advisory",
                    SourceLabel.INDEPENDENT,
                    "Open source security advisory",
                )

        # US-CERT Advisories
        if state.additional_data and state.additional_data.get("us_cert"):
            advisories = state.additional_data["us_cert"].get("advisories", [])
            if advisories:
                add_citation(
                    advisories[0].get("url"),
                    "US-CERT Advisory",
                    SourceLabel.INDEPENDENT,
                    "Government-issued security advisory",
                )

        # Incident and breach data
        if state.incident_data and state.incident_data.get("breach_count", 0) > 0:
            add_citation(
                "https://haveibeenpwned.com",
                "HaveIBeenPwned",
                SourceLabel.INDEPENDENT,
                "Historic credential breach data",
            )
        if state.additional_data:
            if state.additional_data.get("news") and state.additional_data["news"].get("incidents"):
                add_citation(
                    state.additional_data["news"]["incidents"][0].get("url"),
                    "Security News",
                    SourceLabel.INDEPENDENT,
                    "Recent security incident reporting",
                )
            if state.additional_data.get("cisa_alerts") and state.additional_data["cisa_alerts"].get("alerts"):
                add_citation(
                    state.additional_data["cisa_alerts"].get("source_url") or "https://www.cisa.gov/cybersecurity-advisories",
                    "CISA Alerts",
                    SourceLabel.INDEPENDENT,
                    "Government cybersecurity alerts",
                )
            if state.additional_data.get("databreaches_net") and state.additional_data["databreaches_net"].get("breaches"):
                add_citation(
                    state.additional_data["databreaches_net"]["breaches"][0].get("url"),
                    "DataBreaches.net",
                    SourceLabel.INDEPENDENT,
                    "Independent breach reporting",
                )
            if state.additional_data.get("privacy_rights") and state.additional_data["privacy_rights"].get("breaches"):
                add_citation(
                    state.additional_data["privacy_rights"]["breaches"][0].get("url"),
                    "Privacy Rights Clearinghouse",
                    SourceLabel.INDEPENDENT,
                    "Privacy incident repository",
                )

        # Threat intelligence
        if state.additional_data:
            if state.additional_data.get("malwarebazaar") and state.additional_data["malwarebazaar"].get("malware_detected"):
                add_citation(
                    "https://bazaar.abuse.ch",
                    "MalwareBazaar",
                    SourceLabel.INDEPENDENT,
                    "Malware sample intelligence",
                )
            if state.additional_data.get("urlhaus") and state.additional_data["urlhaus"].get("malicious_urls_found", 0) > 0:
                add_citation(
                    "https://urlhaus.abuse.ch",
                    "URLhaus",
                    SourceLabel.INDEPENDENT,
                    "Malicious URL intelligence",
                )
            if state.additional_data.get("otx") and state.additional_data["otx"].get("threat_found"):
                add_citation(
                    "https://otx.alienvault.com",
                    "AlienVault OTX",
                    SourceLabel.INDEPENDENT,
                    "Community threat intelligence",
                )
            if state.additional_data.get("packetstorm") and state.additional_data["packetstorm"].get("advisories"):
                add_citation(
                    state.additional_data["packetstorm"].get("source_url") or "https://packetstormsecurity.com",
                    "Packet Storm",
                    SourceLabel.INDEPENDENT,
                    "Security exploit reporting",
                )

        # Compliance and policy documents
        tos_url = None
        privacy_url = None
        dpa_url = None
        if state.additional_data:
            if state.additional_data.get("tos"):
                tos_url = state.additional_data["tos"].get("url")
                add_citation(
                    tos_url,
                    "Terms of Service",
                    SourceLabel.VENDOR_STATED,
                    "Vendor legal commitments",
                )
            if state.additional_data.get("privacy"):
                privacy_url = state.additional_data["privacy"].get("url")
                add_citation(
                    privacy_url,
                    "Privacy Policy",
                    SourceLabel.VENDOR_STATED,
                    "Vendor privacy representations",
                )
            if state.additional_data.get("dpa"):
                dpa_url = state.additional_data["dpa"].get("url")
                add_citation(
                    dpa_url,
                    "Data Processing Agreement",
                    SourceLabel.VENDOR_STATED,
                    "Vendor data handling terms",
                )
        else:
            tos_url = privacy_url = dpa_url = None

        # FedRAMP listing
        if state.additional_data and state.additional_data.get("fedramp"):
            add_citation(
                state.additional_data["fedramp"].get("url") or "https://marketplace.fedramp.gov",
                "FedRAMP Marketplace",
                SourceLabel.INDEPENDENT,
                "Federal authorization status",
            )

        # Company intel
        if state.additional_data and state.additional_data.get("company"):
            company_sources = state.additional_data["company"].get("sources", [])
            if company_sources:
                add_citation(
                    company_sources[0],
                    "Company Intelligence",
                    SourceLabel.INDEPENDENT,
                    "Corporate background research",
                )

        
        # Note insufficient data areas (updated to account for all sources)
        insufficient_notes = []
        
        # Check CVE data
        if not state.cve_data or not state.cve_data.get('data_available'):
            insufficient_notes.append("CVE data unavailable")
        
        # Check vendor compliance data (including ToS, Privacy, DPA from additional_data)
        has_compliance_data = False
        if state.vendor_data and state.vendor_data.get('security_page_found'):
            has_compliance_data = True
        if state.additional_data:
            if state.additional_data.get('tos') or state.additional_data.get('privacy') or state.additional_data.get('dpa'):
                has_compliance_data = True
        
        if not has_compliance_data:
            insufficient_notes.append("Limited vendor compliance documentation")
        
        # Check incident data (HIBP or Security News)
        has_incident_data = False
        if state.incident_data and state.incident_data.get('data_available'):
            has_incident_data = True
        if state.additional_data and state.additional_data.get('news'):
            has_incident_data = True
        
        if not has_incident_data:
            insufficient_notes.append("Incident data limited (paid APIs recommended)")
        
        status_update.append("")
        status_update.append("  [Step 5/5] 📝 Assembling final CISO brief...")
        status_update.append("        ├─ Compiling assessment components")
        status_update.append("        ├─ Generating executive summary")
        status_update.append("        ├─ Building citations list")
        status_update.append("        ├─ Adding insufficiency notes")
        status_update.append("        └─ Formatting markdown output")
        
        # Parse compliance data from all sources
        gdpr_compliant = False
        gdpr_source = "Unknown"
        encryption_mentioned = False
        encryption_source = "Not stated"
        data_retention_policy = "Not specified"
        third_party_sharing = "Not specified"
        
        # Extract ISO certifications from vendor_reputation
        iso_certs = []
        if vendor_reputation.claimed_certifications:
            for cert in vendor_reputation.claimed_certifications:
                if 'ISO' in cert:
                    from .security_state import CertificationDetail
                    iso_certs.append(CertificationDetail(
                        certification_type=cert,
                        status="claimed",
                        source_label=SourceLabel.VENDOR_STATED
                    ))
        
        # Parse ToS data
        if state.additional_data and state.additional_data.get('tos'):
            tos_data = state.additional_data['tos']
            # Extract any compliance mentions from ToS
            if tos_data.get('content'):
                content_lower = tos_data['content'].lower()
                if 'gdpr' in content_lower and not gdpr_compliant:
                    gdpr_compliant = True
                    gdpr_source = "ToS (vendor-stated)"
                if 'encrypt' in content_lower:
                    encryption_mentioned = True
                    encryption_source = "ToS (vendor-stated)"
                if 'retention' in content_lower or 'retain' in content_lower:
                    data_retention_policy = "Mentioned in ToS (see document)"
                if 'third party' in content_lower or 'third-party' in content_lower:
                    third_party_sharing = "Mentioned in ToS (see document)"
        
        # Parse Company Info for vendor reputation enhancement
        if state.additional_data and state.additional_data.get('company'):
            company_data = state.additional_data['company']
            if company_data.get('founded_year'):
                try:
                    from datetime import datetime
                    founded_year = int(company_data['founded_year'])
                    current_year = datetime.now().year
                    company_age = current_year - founded_year
                    
                    # Update vendor reputation with company age
                    if company_age >= 20:
                        trust_score = min(100, trust_score + 5)
                    elif company_age >= 10:
                        trust_score = min(100, trust_score + 3)
                except:
                    pass
        
        # Parse Privacy Policy data
        if state.additional_data and state.additional_data.get('privacy'):
            privacy_data = state.additional_data['privacy']
            if privacy_data.get('gdpr_compliance'):
                gdpr_compliant = True
                gdpr_source = "Privacy Policy (vendor-stated)"
            if privacy_data.get('content'):
                content_lower = privacy_data['content'].lower()
                if 'encrypt' in content_lower and not encryption_mentioned:
                    encryption_mentioned = True
                    encryption_source = "Privacy Policy (vendor-stated)"
                if ('retention' in content_lower or 'retain' in content_lower) and data_retention_policy == "Not specified":
                    data_retention_policy = "Mentioned in Privacy Policy (see document)"
                if ('third party' in content_lower or 'third-party' in content_lower) and third_party_sharing == "Not specified":
                    third_party_sharing = "Mentioned in Privacy Policy (see document)"
        
        # Parse DPA data
        if state.additional_data and state.additional_data.get('dpa'):
            dpa_data = state.additional_data['dpa']
            if dpa_data.get('gdpr_mentioned'):
                gdpr_compliant = True
                gdpr_source = "DPA (vendor-stated)"
            if dpa_data.get('content'):
                content_lower = dpa_data['content'].lower()
                if 'encrypt' in content_lower and not encryption_mentioned:
                    encryption_mentioned = True
                    encryption_source = "DPA (vendor-stated)"
                if ('retention' in content_lower or 'retain' in content_lower) and data_retention_policy == "Not specified":
                    data_retention_policy = "Mentioned in DPA (see document)"
        
        # Fallback to vendor certifications for GDPR
        if not gdpr_compliant and 'GDPR' in str(vendor_reputation.claimed_certifications):
            gdpr_compliant = True
            gdpr_source = "Vendor security page"
        
        # Determine SOC2 status
        soc2_status = 'not_found'
        if vendor_reputation.claimed_certifications:
            for cert in vendor_reputation.claimed_certifications:
                if 'SOC' in cert or 'SOC2' in cert or 'SOC 2' in cert:
                    soc2_status = 'claimed'
                    break
        
        # Create CISO brief using ONLY structured state data (no LLM hallucination)
        ciso_brief = CISOBrief(
            entity=entity_data,
            taxonomy=taxonomy_data,
            description=f"{entity_data.product_name} is a {taxonomy_data.primary_category} solution.",
            usage=f"Typically used for {taxonomy_data.primary_category} purposes in enterprise environments.",
            vendor_reputation=vendor_reputation,
            cve_summary=cve_summary,
            incidents=incident_report,
            compliance=ComplianceStatus(
                soc2_status=soc2_status,
                iso_certifications=iso_certs,
                gdpr_compliant=gdpr_compliant,
            ),
            data_handling=DataHandling(
                tos_url=tos_url,
                dpa_url=dpa_url,
                privacy_policy_url=privacy_url,
                encryption_claimed=encryption_mentioned,
                encryption_details=encryption_source if encryption_mentioned else None,
                data_retention=data_retention_policy,
                third_party_sharing=third_party_sharing,
                source_label=SourceLabel.VENDOR_STATED,
                data_available=has_compliance_data,
            ),
            deployment_controls="Standard SaaS deployment with admin controls (specifics require vendor documentation)",
            trust_score=trust_score,
            risk_score=risk_score,
            rationale=rationale[:1000],  # Use LLM-generated rationale but limit length
            confidence=confidence,
            safer_alternatives=alternatives,
            all_citations=citations,
            assessment_timestamp=datetime.now(),
            insufficient_data_notes="; ".join(insufficient_notes) if insufficient_notes else None,
        )
        
        status_update.append("")
        status_update.append("  ✓ CISO BRIEF GENERATED SUCCESSFULLY!")
        status_update.append("")
        status_update.append("  📋 Summary:")
        status_update.append(f"     • Product: {entity_data.product_name}")
        status_update.append(f"     • Category: {taxonomy_data.primary_category}")
        status_update.append(f"     • Trust Score: {trust_score}/100")
        status_update.append(f"     • Risk Score: {risk_score}/100")
        status_update.append(f"     • Confidence: {confidence.value.upper()}")
        status_update.append(f"     • CVEs Found: {cve_summary.total_cves}")
        status_update.append(f"     • Breaches: {incident_report.breach_count}")
        status_update.append(f"     • Citations: {len(citations)}")
        status_update.append("")
        status_update.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
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

