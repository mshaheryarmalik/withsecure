"""Alternative product extraction from community sources using LLM."""

from typing import Any, Dict, List

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig

from ..api_utils import get_api_key_for_model
from ..configuration import Configuration
from ..constants import DEFAULT_CLASSIFICATION_MODEL
from ..llm_utils import extract_json_from_markdown
from ..security_state import AlternativeProduct


def extract_alternatives_from_community(
    state_entity: Dict[str, Any],
    state_additional_data: Dict[str, Any],
    config: RunnableConfig,
    status_update: List[str]
) -> List[AlternativeProduct]:
    """Extract alternative products from community search data using LLM.
    
    Args:
        state_entity: Entity data with product name
        state_additional_data: Additional data including alternatives search results
        config: Runnable configuration
        status_update: List to append status messages
        
    Returns:
        List of AlternativeProduct objects
    """
    alternatives = []
    
    status_update.append("")
    status_update.append("  [Step 4/5] 🔄 Extracting alternative products...")
    
    if not state_additional_data:
        status_update.append("        └─ ⚠️  No search data available")
        return alternatives
    
    alt_data = state_additional_data.get('alternatives', {})
    if not alt_data.get('alternatives') or not isinstance(alt_data['alternatives'], list):
        status_update.append("        └─ ⚠️  No alternatives data found")
        return alternatives
    
    status_update.append(f"        ├─ Processing {len(alt_data['alternatives'])} search results from Phase 3...")
    
    # Collect summaries from search results
    summaries_text = ""
    for i, alt in enumerate(alt_data['alternatives'][:5]):
        if isinstance(alt, dict):
            content = alt.get('summary', alt.get('content', ''))
            if content:
                summaries_text += f"\nResult {i+1}: {content[:300]}\n"
    
    if not summaries_text:
        status_update.append("        └─ ⚠️  No content in search results")
        return alternatives
    
    try:
        # Build extraction prompt
        extraction_prompt = f"""Extract the actual alternative product/software names mentioned in these search results.

Search results about alternatives to "{state_entity.get('product_name', 'the product')}":
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
        
        # Initialize LLM
        configuration = Configuration.from_runnable_config(config)
        model_name = configuration.classification_model or DEFAULT_CLASSIFICATION_MODEL
        api_key = get_api_key_for_model(model_name, config)
        
        llm = init_chat_model(
            model=model_name,
            model_provider="google_genai",
            api_key=api_key,
            temperature=0
        )
        
        # Extract products using LLM
        response = llm.invoke([HumanMessage(content=extraction_prompt)])
        response_text = response.content.strip()
        
        # Parse JSON response
        extracted_products = extract_json_from_markdown(response_text)
        
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
    
    return alternatives

