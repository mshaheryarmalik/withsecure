"""API key utilities for security assessment."""

import os
from langchain_core.runnables import RunnableConfig


def get_api_key_for_model(model_name: str, config: RunnableConfig):
    """Get API key for a specific model from environment or config.
    
    Args:
        model_name: Model name (e.g., 'gemini-2.5-flash', 'google_genai:gemini-2.0')
        config: RunnableConfig containing configurable settings
        
    Returns:
        API key string if found, None otherwise
    """
    should_get_from_config = os.getenv("GET_API_KEYS_FROM_CONFIG", "false")
    model_name = model_name.lower()
    
    if should_get_from_config.lower() == "true":
        api_keys = config.get("configurable", {}).get("apiKeys", {})
        if not api_keys:
            return None
        if "gemini" in model_name or "google" in model_name:
            return api_keys.get("GOOGLE_API_KEY")
        return None
    else:
        if "gemini" in model_name or "google" in model_name:
            return os.getenv("GOOGLE_API_KEY")
        return None

