"""LLM response parsing and initialization utilities."""

import json
from typing import Any, Dict

from langchain.chat_models import init_chat_model


def extract_json_from_markdown(response_text: str) -> Dict[str, Any]:
    """Extract JSON from markdown code blocks in LLM responses.
    
    Handles common LLM response formats:
    - ```json {...} ```
    - ``` {...} ```
    - Raw JSON
    
    Args:
        response_text: Raw LLM response text
        
    Returns:
        Parsed JSON as dictionary
        
    Raises:
        json.JSONDecodeError: If JSON parsing fails
    """
    response_text = response_text.strip()
    
    # Remove markdown code blocks
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()
    elif "{" in response_text:
        # Extract just the JSON object
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        response_text = response_text[start:end]
    
    return json.loads(response_text)


def init_gemini_model(model_name: str, api_key: str, temperature: int = 0, thinking_budget: int = 1024, **kwargs):
    """Standardized Gemini model initialization with thinking/reasoning enabled.
    
    Args:
        model_name: Model name (just the model name like 'gemini-2.5-flash', not prefixed)
        api_key: Google API key
        temperature: Temperature setting (default 0 for deterministic)
        thinking_budget: Token budget for reasoning/thinking (default 1024)
        **kwargs: Additional arguments to pass to init_chat_model
        
    Returns:
        Initialized chat model with thinking enabled
    """
    # Remove any provider prefix if present
    if ":" in model_name:
        model_name = model_name.split(":", 1)[1]
    
    # Configure model kwargs
    model_kwargs = {
        "model": model_name,
        "model_provider": "google_genai",
        "api_key": api_key,
        "temperature": temperature,
        **kwargs
    }
    
    # Add thinking budget if model supports it (Gemini 2.5+)
    if "2.5" in model_name or "2.0-flash-thinking" in model_name:
        model_kwargs["thinking_budget"] = thinking_budget
    
    return init_chat_model(**model_kwargs)

