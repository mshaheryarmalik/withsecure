"""Shared utilities for security assessment tools."""

import os
import urllib3

# Disable SSL warnings for development (Tavily SSL cert issue)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# API Configuration
NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3"
HIBP_API_URL = "https://haveibeenpwned.com/api/v3"
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
MALWAREBAZAAR_API_URL = "https://mb-api.abuse.ch/api/v1/"
URLHAUS_API_URL = "https://urlhaus-api.abuse.ch/v1/"
ALIENVAULT_OTX_API_URL = "https://otx.alienvault.com/api/v1"


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

