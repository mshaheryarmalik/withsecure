"""CISO Security Assessor - Main orchestration graph."""

import json
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
from .security_tools import (
    resolve_entity,
    lookup_cves,
    fetch_vendor_security_info,
    lookup_security_incidents,
)
from .utils import get_api_key_for_model


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
    try:
        # Update status
        status_update = [f"🔍 Resolving entity: {state.input_text}"]
        
        # Use the resolve_entity tool
        entity_result = resolve_entity.invoke(state.input_text)
        
        product_name = entity_result.get('product_name', 'Unknown')
        input_type = entity_result.get('input_type', 'unknown')
        status_update.append(f"✓ Identified: {product_name} (type: {input_type})")
        
        return {
            "entity": entity_result,
            "messages": state.messages + [
                AIMessage(content=f"Resolved entity: {product_name}")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Entity Resolved"
        }
    except Exception as e:
        return {
            "entity": None,
            "errors": state.errors + [f"Entity resolution failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Entity resolution failed: {str(e)}"],
            "current_step": "Entity Resolution Failed"
        }


def classify_software_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Classify software into taxonomy."""
    try:
        status_update = ["📊 Classifying software category..."]
        
        if not state.entity:
            return {
                "taxonomy": {
                    "primary_category": SoftwareCategory.OTHER.value,
                    "secondary_categories": [],
                    "confidence": ConfidenceLevel.LOW.value,
                },
                "status_messages": state.status_messages + status_update + ["✓ Category: Other (low confidence)"],
                "current_step": "Classification Complete"
            }
        
        product_name = state.entity.get("product_name", "Unknown")
        
        # Simple rule-based classification for MVP
        # In production, this would use LLM or ML model
        category = SoftwareCategory.OTHER
        
        product_lower = product_name.lower()
        if any(term in product_lower for term in ["drive", "dropbox", "box", "share"]):
            category = SoftwareCategory.FILE_SHARING
        elif any(term in product_lower for term in ["gpt", "claude", "gemini", "ai", "copilot"]):
            category = SoftwareCategory.GENAI_TOOL
        elif any(term in product_lower for term in ["slack", "teams", "discord", "zoom"]):
            category = SoftwareCategory.COMMUNICATION_PLATFORM
        elif any(term in product_lower for term in ["salesforce", "hubspot", "crm"]):
            category = SoftwareCategory.SAAS_CRM
        elif any(term in product_lower for term in ["github", "gitlab", "jenkins"]):
            category = SoftwareCategory.DEVELOPMENT_TOOL
        
        status_update.append(f"✓ Category: {category.value}")
        
        return {
            "taxonomy": {
                "primary_category": category.value,
                "secondary_categories": [],
                "confidence": ConfidenceLevel.MEDIUM.value,
            },
            "status_messages": state.status_messages + status_update,
            "current_step": "Classification Complete"
        }
    except Exception as e:
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
    """Gather security data from multiple sources in parallel."""
    try:
        product_name = state.entity.get("product_name", "Unknown") if state.entity else "Unknown"
        vendor_name = state.entity.get("vendor_name", "Unknown") if state.entity else "Unknown"
        website = state.entity.get("website") if state.entity else None
        
        status_update = ["🔐 Gathering security data from multiple sources..."]
        
        # Gather CVE data
        status_update.append("  → Querying NVD for CVE data...")
        cve_data = None
        try:
            cve_data = lookup_cves.invoke({"product_name": product_name, "vendor_name": vendor_name})
            cve_count = cve_data.get('total_cves', 0)
            critical = cve_data.get('critical_count', 0)
            status_update.append(f"  ✓ Found {cve_count} CVEs ({critical} critical)")
        except Exception as e:
            status_update.append(f"  ✗ CVE lookup failed: {str(e)[:50]}")
            cve_data = {
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
        
        # Gather vendor security info
        status_update.append("  → Checking vendor security pages...")
        vendor_data = None
        if website:
            try:
                vendor_data = fetch_vendor_security_info.invoke({
                    "website_url": website,
                    "vendor_name": vendor_name
                })
                if vendor_data.get('security_page_found'):
                    certs = len(vendor_data.get('claimed_certifications', []))
                    status_update.append(f"  ✓ Found security page ({certs} certifications claimed)")
                else:
                    status_update.append("  ⚠ No security page found")
            except Exception as e:
                status_update.append(f"  ✗ Vendor check failed: {str(e)[:50]}")
                vendor_data = {
                    "vendor_name": vendor_name,
                    "security_page_found": False,
                    "security_contact": None,
                    "claimed_certifications": [],
                    "source_label": SourceLabel.VENDOR_STATED.value,
                }
        else:
            status_update.append("  ⚠ No website URL available")
        
        # Gather incident data
        status_update.append("  → Checking incident databases...")
        incident_data = None
        if website:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(website)
                domain = parsed.netloc or parsed.path
                incident_data = lookup_security_incidents.invoke({
                    "domain": domain,
                    "product_name": product_name
                })
                status_update.append("  ⚠ Incident data limited (requires paid APIs)")
            except Exception as e:
                status_update.append(f"  ✗ Incident lookup failed: {str(e)[:50]}")
                incident_data = {
                    "incidents": [],
                    "breach_count": 0,
                    "source_label": SourceLabel.INDEPENDENT.value,
                    "data_available": False,
                }
        else:
            status_update.append("  ⚠ No website URL for incident lookup")
        
        return {
            "cve_data": cve_data,
            "vendor_data": vendor_data,
            "incident_data": incident_data,
            "messages": state.messages + [
                AIMessage(content="Security data gathered from multiple sources")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Security Data Gathered"
        }
    except Exception as e:
        return {
            "errors": state.errors + [f"Data gathering failed: {str(e)}"],
            "status_messages": state.status_messages + [f"✗ Data gathering failed: {str(e)}"],
            "current_step": "Data Gathering Failed"
        }


def generate_ciso_brief_node(state: AssessmentState, config: RunnableConfig) -> Dict[str, Any]:
    """Generate final CISO brief with LLM."""
    try:
        status_update = ["🤖 Generating CISO security brief with AI..."]
        
        # Get configuration
        configuration = Configuration.from_runnable_config(config)
        
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
        
        # Calculate scores using LLM
        scoring_prompt = RISK_SCORING_PROMPT.format(
            product_name=entity_data.product_name,
            total_cves=cve_summary.total_cves,
            critical=cve_summary.critical_count,
            high=cve_summary.high_count,
            kev_count=cve_summary.cisa_kev_count,
            trend=cve_summary.trend,
            breaches=incident_report.breach_count,
            incidents=len(incident_report.incidents),
            soc2=vendor_reputation.claimed_certifications,
            iso_count=len([c for c in vendor_reputation.claimed_certifications if 'ISO' in c]),
            gdpr='GDPR' in str(vendor_reputation.claimed_certifications),
            encryption=True,  # Default assumption
            tos_found=True,
        )
        
        status_update.append("  → Analyzing security posture...")
        
        messages = [
            {"role": "system", "content": CISO_SYSTEM_PROMPT},
            {"role": "user", "content": scoring_prompt}
        ]
        
        scoring_response = model.invoke(messages)
        status_update.append("  ✓ AI analysis complete")
        
        # Extract scores from response (simplified for MVP)
        # In production, use structured output
        trust_score = 50  # Default
        risk_score = 50
        confidence = ConfidenceLevel.MEDIUM
        rationale = scoring_response.content if hasattr(scoring_response, 'content') else "Assessment based on available data"
        
        # Try to extract scores from response
        import re
        content = scoring_response.content if hasattr(scoring_response, 'content') else ""
        trust_match = re.search(r'Trust Score[:\s]+(\d+)', content, re.IGNORECASE)
        risk_match = re.search(r'Risk Score[:\s]+(\d+)', content, re.IGNORECASE)
        
        if trust_match:
            trust_score = int(trust_match.group(1))
        if risk_match:
            risk_score = int(risk_match.group(1))
        
        status_update.append("  → Calculating trust & risk scores...")
        
        # Determine confidence based on data availability
        data_sources = 0
        if state.cve_data and state.cve_data.get('data_available'):
            data_sources += 1
        if state.vendor_data and state.vendor_data.get('security_page_found'):
            data_sources += 1
        if state.incident_data and state.incident_data.get('data_available'):
            data_sources += 1
        
        if data_sources >= 2:
            confidence = ConfidenceLevel.MEDIUM
        elif data_sources >= 1:
            confidence = ConfidenceLevel.LOW
        else:
            confidence = ConfidenceLevel.INSUFFICIENT
        
        status_update.append(f"  ✓ Trust: {trust_score}/100, Risk: {risk_score}/100")
        
        status_update.append("  → Identifying safer alternatives...")
        
        # Generate alternatives
        alternatives = []
        if taxonomy_data.primary_category == SoftwareCategory.FILE_SHARING:
            alternatives = [
                AlternativeProduct(
                    product_name="Tresorit",
                    vendor_name="Tresorit AG",
                    rationale="End-to-end encryption, zero-knowledge architecture, Swiss privacy laws"
                )
            ]
        elif taxonomy_data.primary_category == SoftwareCategory.COMMUNICATION_PLATFORM:
            alternatives = [
                AlternativeProduct(
                    product_name="Signal",
                    vendor_name="Signal Foundation",
                    rationale="Open-source, end-to-end encryption by default, privacy-focused"
                )
            ]
        
        status_update.append(f"  ✓ Found {len(alternatives)} alternative(s)")
        
        # Build citations
        citations = []
        if cve_summary.citation:
            citations.append(Citation(
                source_url="https://nvd.nist.gov",
                source_type="NVD",
                source_label=SourceLabel.INDEPENDENT,
                accessed_date=datetime.now().strftime("%Y-%m-%d"),
                claim="CVE data and vulnerability counts"
            ))
        
        # Note insufficient data areas
        insufficient_notes = []
        if not state.cve_data or not state.cve_data.get('data_available'):
            insufficient_notes.append("CVE data unavailable or limited")
        if not state.vendor_data or not state.vendor_data.get('security_page_found'):
            insufficient_notes.append("No vendor security page found")
        if not state.incident_data or not state.incident_data.get('data_available'):
            insufficient_notes.append("Incident data limited (requires paid APIs)")
        
        status_update.append("  → Finalizing CISO brief...")
        
        # Create CISO brief
        ciso_brief = CISOBrief(
            entity=entity_data,
            taxonomy=taxonomy_data,
            description=f"{entity_data.product_name} is a {taxonomy_data.primary_category.value} solution.",
            usage=f"Typically used for {taxonomy_data.primary_category.value} purposes in enterprise environments.",
            vendor_reputation=vendor_reputation,
            cve_summary=cve_summary,
            incidents=incident_report,
            compliance=ComplianceStatus(
                soc2_status='claimed' if 'SOC2' in str(vendor_reputation.claimed_certifications) else 'not_found',
                iso_certifications=[],
                gdpr_compliant='GDPR' in str(vendor_reputation.claimed_certifications),
            ),
            data_handling=DataHandling(
                tos_url=entity_data.website,
                source_label=SourceLabel.VENDOR_STATED,
            ),
            deployment_controls="Standard SaaS deployment with admin controls (specifics require vendor documentation)",
            trust_score=trust_score,
            risk_score=risk_score,
            rationale=rationale[:500],  # Limit length
            confidence=confidence,
            safer_alternatives=alternatives,
            all_citations=citations,
            assessment_timestamp=datetime.now(),
            insufficient_data_notes="; ".join(insufficient_notes) if insufficient_notes else None,
        )
        
        status_update.append("✓ CISO brief generated successfully")
        
        return {
            "ciso_brief": ciso_brief,
            "messages": state.messages + [
                AIMessage(content="CISO brief generated successfully")
            ],
            "status_messages": state.status_messages + status_update,
            "current_step": "Complete"
        }
    except Exception as e:
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

