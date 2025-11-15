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
)
from .tools import (
    resolve_entity,
    lookup_cves,
    fetch_vendor_security_info,
    lookup_security_incidents,
)
from .utils import get_api_key_for_model
from .debug_logger import get_debug_logger


class AssessmentState(BaseModel):
    """State for CISO security assessment."""
    
    # Input
    input_text: str = Field(description="Original input (product name, URL, or SHA1)")
    
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
    """Resolve entity from input."""
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
            status_update.append("  🔎 Querying VirusTotal for file reputation...")
        elif re.match(r'^https?://', state.input_text) or '.' in state.input_text and '/' in state.input_text:
            status_update.append("  💡 Pattern detected: URL/Domain")
            status_update.append("  🌐 Step 1: Normalizing URL and fetching website...")
            status_update.append("  📄 Step 2: Extracting page metadata (title, description, OG tags)...")
            status_update.append("  🧠 Step 3: LLM analyzing page content for product info...")
        else:
            status_update.append("  💡 Pattern detected: Name (person/product/company)")
            status_update.append("  🤖 Initializing LLM-based entity resolver...")
            status_update.append("  🔍 Step 1: Performing web search for context...")
            status_update.append("  🧠 Step 2: LLM analyzing search results...")
            status_update.append("  📊 Step 3: Extracting official product/vendor/website...")
        
        # Use the resolve_entity tool
        logger.log_tool_call("resolve_entity", {"input_text": state.input_text})
        entity_result = resolve_entity.invoke(state.input_text)
        logger.log_tool_call("resolve_entity", {"input_text": state.input_text}, entity_result)
        
        product_name = entity_result.get('product_name', 'Unknown')
        vendor_name = entity_result.get('vendor_name', 'Unknown')
        input_type = entity_result.get('input_type', 'unknown')
        confidence = entity_result.get('confidence', 'unknown')
        website = entity_result.get('website')
        
        status_update.append(f"  ✓ Entity resolved successfully!")
        status_update.append(f"     • Product: {product_name}")
        status_update.append(f"     • Vendor: {vendor_name}")
        status_update.append(f"     • Type: {input_type}")
        status_update.append(f"     • Confidence: {confidence.upper()}")
        if website:
            status_update.append(f"     • Website: {website}")
        
        # Add interpretation reasoning and product type
        interpretation = entity_result.get('input_interpretation')
        reasoning = entity_result.get('reasoning')
        product_type = entity_result.get('product_type')
        
        if interpretation:
            status_update.append(f"     • Interpretation: {interpretation}")
        if product_type:
            status_update.append(f"     • Product Type: {product_type}")
        if reasoning:
            status_update.append(f"     • Reasoning: {reasoning}")
        
        # Add SHA1-specific info
        if input_type == 'sha1':
            reputation = entity_result.get('file_reputation', 'Unknown')
            status_update.append(f"     • File Reputation: {reputation}")
        
        # Log Phase 1 results
        logger.log_phase(1, "Entity Resolution", entity_result, "SUCCESS")
        
        return {
            "entity": entity_result,
            "messages": state.messages + [
                AIMessage(content=f"Resolved entity: {product_name}")
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
    """Classify software into taxonomy."""
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
                    "primary_category": SoftwareCategory.OTHER.value,
                    "secondary_categories": [],
                    "confidence": ConfidenceLevel.LOW.value,
                },
                "status_messages": state.status_messages + status_update,
                "current_step": "Classification Complete"
            }
        
        product_name = state.entity.get("product_name") or "Unknown"
        
        # Safety check for None or empty product name
        if not product_name or product_name == "Unknown":
            status_update.append(f"  ⚠️  Product name unavailable or unknown")
            status_update.append("  ✓ Defaulting to 'Other' category (low confidence)")
            return {
                "taxonomy": {
                    "primary_category": SoftwareCategory.OTHER.value,
                    "secondary_categories": [],
                    "confidence": ConfidenceLevel.LOW.value,
                },
                "status_messages": state.status_messages + status_update,
                "current_step": "Classification Complete"
            }
        
        status_update.append(f"  🎯 Analyzing product: '{product_name}'")
        status_update.append("  🤖 Running taxonomy classification algorithm...")
        status_update.append("  📋 Checking against 11 software categories...")
        
        # Simple rule-based classification for MVP
        category = SoftwareCategory.OTHER
        matched_keywords = []
        
        product_lower = product_name.lower()
        
        # Check each category with keyword matching
        if any(term in product_lower for term in ["drive", "dropbox", "box", "share", "sync"]):
            category = SoftwareCategory.FILE_SHARING
            matched_keywords = [t for t in ["drive", "dropbox", "box", "share", "sync"] if t in product_lower]
        elif any(term in product_lower for term in ["gpt", "claude", "gemini", "ai", "copilot", "assistant"]):
            category = SoftwareCategory.GENAI_TOOL
            matched_keywords = [t for t in ["gpt", "claude", "gemini", "ai", "copilot"] if t in product_lower]
        elif any(term in product_lower for term in ["slack", "teams", "discord", "zoom", "meet"]):
            category = SoftwareCategory.COMMUNICATION_PLATFORM
            matched_keywords = [t for t in ["slack", "teams", "discord", "zoom"] if t in product_lower]
        elif any(term in product_lower for term in ["salesforce", "hubspot", "crm"]):
            category = SoftwareCategory.SAAS_CRM
            matched_keywords = [t for t in ["salesforce", "hubspot", "crm"] if t in product_lower]
        elif any(term in product_lower for term in ["github", "gitlab", "jenkins", "git", "vscode", "cursor", "ide", "code editor"]):
            category = SoftwareCategory.DEVELOPMENT_TOOL
            matched_keywords = [t for t in ["github", "gitlab", "jenkins", "vscode", "cursor", "ide"] if t in product_lower]
        elif any(term in product_lower for term in ["chrome", "firefox", "extension", "addon"]):
            category = SoftwareCategory.BROWSER_EXTENSION
            matched_keywords = [t for t in ["chrome", "firefox", "extension"] if t in product_lower]
        
        if matched_keywords:
            status_update.append(f"  💡 Matched keywords: {', '.join(matched_keywords)}")
        
        status_update.append(f"  ✓ Classification complete!")
        status_update.append(f"     • Primary Category: {category.value}")
        status_update.append(f"     • Confidence: MEDIUM")
        status_update.append(f"     • Reasoning: Pattern-based keyword matching")
        
        taxonomy_data = {
            "primary_category": category.value,
            "secondary_categories": [],
            "confidence": ConfidenceLevel.MEDIUM.value,
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
        return {
            "taxonomy": {
                "primary_category": SoftwareCategory.OTHER.value,
                "secondary_categories": [],
                "confidence": ConfidenceLevel.LOW.value,
            },
            "errors": state.errors + [f"Classification failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Classification failed: {str(e)}"],
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
        # Use original_name for CVE searches (e.g., "redis" instead of "Redis (database)")
        original_name = state.entity.get("original_name", product_name) if state.entity else product_name
        
        status_update = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "🔐 PHASE 3: COMPREHENSIVE SECURITY DATA GATHERING",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"  🎯 Target: {product_name}",
            f"  🔍 CVE Search Name: {original_name}",  # Show which name is used for CVE search
            f"  📡 Querying 15+ security databases and sources...",
            ""
        ]
        
        # Initialize ALL data collectors
        all_data = {}
        citation_count = 0
        
        # [1] CVE Databases
        status_update.append("  [1/6] 🛡️  VULNERABILITY DATABASES")
        cve_data = None
        try:
            # Use original_name for CVE searches (more likely to match NVD entries)
            cve_input = {"product_name": original_name, "vendor_name": vendor_name}
            logger.log_tool_call("lookup_cves", cve_input)
            cve_data = lookup_cves.invoke(cve_input)
            logger.log_tool_call("lookup_cves", cve_input, cve_data)
            cve_count = cve_data.get('total_cves', 0)
            status_update.append(f"        ├─ NVD: {cve_count} CVEs found ({cve_data.get('critical_count', 0)} critical)")
            citation_count += 1
        except Exception as e:
            logger.log_tool_call("lookup_cves", {"product_name": product_name, "vendor_name": vendor_name}, error=e)
            cve_data = {"total_cves": 0, "data_available": False}
            status_update.append("        ├─ NVD: Query failed")
        
        # GitHub Advisories
        try:
            gh_data = lookup_github_advisories.invoke({"product_name": original_name})
            if gh_data.get('advisory_count', 0) > 0:
                status_update.append(f"        ├─ GitHub Advisories: {gh_data['advisory_count']} found")
                all_data['github_advisories'] = gh_data
                citation_count += 1
        except:
            pass
        
        # US-CERT
        try:
            cert_data = search_us_cert_advisories.invoke({"product_name": original_name})
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
            status_update.append("        └─ No domain - skipping threat intel")
        
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
            primary_category=SoftwareCategory.OTHER,
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
        status_update.append(f"        ├─ Category: {taxonomy_data.primary_category.value}")
        status_update.append("        ├─ Searching alternative database...")
        
        # Generate alternatives
        alternatives = []
        if taxonomy_data.primary_category == SoftwareCategory.FILE_SHARING:
            status_update.append("        ├─ Found: Tresorit")
            status_update.append("        │  └─ Reason: E2E encryption, zero-knowledge")
            alternatives = [
                AlternativeProduct(
                    product_name="Tresorit",
                    vendor_name="Tresorit AG",
                    rationale="End-to-end encryption, zero-knowledge architecture, Swiss privacy laws"
                )
            ]
        elif taxonomy_data.primary_category == SoftwareCategory.COMMUNICATION_PLATFORM:
            status_update.append("        ├─ Found: Signal")
            status_update.append("        │  └─ Reason: Open-source, privacy-focused")
            alternatives = [
                AlternativeProduct(
                    product_name="Signal",
                    vendor_name="Signal Foundation",
                    rationale="Open-source, end-to-end encryption by default, privacy-focused"
                )
            ]
        else:
            status_update.append("        ├─ No pre-configured alternatives for this category")
        
        status_update.append(f"        └─ ✓ Alternatives identified: {len(alternatives)}")
        
        # Build citations from ALL sources
        citations = []
        citation_map = {
            'nvd': ("https://nvd.nist.gov", "NVD", SourceLabel.INDEPENDENT, "CVE data and vulnerability counts"),
            'github_advisories': ("https://github.com/advisories", "GitHub Advisories", SourceLabel.INDEPENDENT, "Security advisories"),
            'us_cert': ("https://www.cisa.gov/uscert/", "US-CERT", SourceLabel.INDEPENDENT, "CERT advisories"),
            'hibp': ("https://haveibeenpwned.com", "HaveIBeenPwned", SourceLabel.INDEPENDENT, "Breach data"),
            'news': ("Tavily Search", "Security News", SourceLabel.INDEPENDENT, "Security incident reports"),
            'urlhaus': ("https://urlhaus.abuse.ch", "URLhaus", SourceLabel.INDEPENDENT, "Malicious URL detection"),
            'otx': ("https://otx.alienvault.com", "AlienVault OTX", SourceLabel.INDEPENDENT, "Threat intelligence"),
            'whois': ("WHOIS Lookup", "Domain WHOIS", SourceLabel.INDEPENDENT, "Domain registration data"),
            'fedramp': ("https://marketplace.fedramp.gov", "FedRAMP", SourceLabel.INDEPENDENT, "Government cloud authorization"),
            'tos': (entity_data.website, "Terms of Service", SourceLabel.VENDOR_STATED, "Legal terms"),
            'privacy': (entity_data.website, "Privacy Policy", SourceLabel.VENDOR_STATED, "Privacy commitments"),
            'dpa': (entity_data.website, "Data Processing Agreement", SourceLabel.VENDOR_STATED, "Data handling terms"),
            'company': ("Tavily Search", "Company Info", SourceLabel.INDEPENDENT, "Company background"),
            'alternatives': ("Tavily Search", "Alternatives", SourceLabel.INDEPENDENT, "Alternative products"),
        }
        
        # Add NVD citation if CVE data exists
        if cve_summary.citation:
            url, name, label, claim = citation_map['nvd']
            citations.append(Citation(
                source_url=url,
                source_type=name,
                source_label=label,
                accessed_date=datetime.now().strftime("%Y-%m-%d"),
                claim=claim
            ))
        
        # Add citations from additional_data
        if state.additional_data:
            for source_key, source_data in state.additional_data.items():
                if source_key in citation_map and source_data:  # Only add if data exists
                    url, name, label, claim = citation_map[source_key]
                    citations.append(Citation(
                        source_url=url,
                        source_type=name,
                        source_label=label,
                        accessed_date=datetime.now().strftime("%Y-%m-%d"),
                        claim=claim
                    ))
        
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
            description=f"{entity_data.product_name} is a {taxonomy_data.primary_category.value} solution.",
            usage=f"Typically used for {taxonomy_data.primary_category.value} purposes in enterprise environments.",
            vendor_reputation=vendor_reputation,
            cve_summary=cve_summary,
            incidents=incident_report,
            compliance=ComplianceStatus(
                soc2_status=soc2_status,
                iso_certifications=iso_certs,
                gdpr_compliant=gdpr_compliant,
            ),
            data_handling=DataHandling(
                tos_url=entity_data.website,
                encryption=encryption_mentioned,
                data_retention=data_retention_policy,
                third_party_sharing=third_party_sharing,
                source_label=SourceLabel.VENDOR_STATED,
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
        status_update.append(f"     • Category: {taxonomy_data.primary_category.value}")
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
    workflow.add_edge("resolve_entity", "classify_software")
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

