"""Shared utilities for security assessment tools."""

import os
import urllib3

# Disable SSL warnings for development (Tavily SSL cert issue)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# Import API URLs from constants
from ..constants import (
    NVD_API_URL,
    CISA_KEV_URL,
    VIRUSTOTAL_API_URL,
    HIBP_API_URL,
    GITHUB_GRAPHQL_URL,
    MALWAREBAZAAR_API_URL,
    URLHAUS_API_URL,
    ALIENVAULT_OTX_API_URL,
)


def create_tavily_client(api_key: str):
    """Create a TavilyClient with SSL verification disabled for development."""
    from tavily import TavilyClient
    import requests
    
    client = TavilyClient(api_key=api_key)
    
    # Monkey-patch the requests to disable SSL verification
    original_post = requests.post
    def patched_post(*args, **kwargs):
        kwargs['verify'] = False
        return original_post(*args, **kwargs)
    
    import tavily.tavily
    tavily.tavily.requests.post = patched_post
    
    return client

