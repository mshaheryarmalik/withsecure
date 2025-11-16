"""Constants and configuration values for security assessment.

This module centralizes all hardcoded values, API endpoints, and default configurations
to make them easily configurable via environment variables.
"""

import os


# API Endpoints - can be overridden via environment variables
NVD_API_URL = os.getenv(
    "NVD_API_URL", 
    "https://services.nvd.nist.gov/rest/json/cves/2.0"
)

CISA_KEV_URL = os.getenv(
    "CISA_KEV_URL",
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
)

VIRUSTOTAL_API_URL = os.getenv(
    "VIRUSTOTAL_API_URL",
    "https://www.virustotal.com/api/v3"
)

HIBP_API_URL = os.getenv(
    "HIBP_API_URL",
    "https://haveibeenpwned.com/api/v3"
)

GITHUB_GRAPHQL_URL = os.getenv(
    "GITHUB_GRAPHQL_URL",
    "https://api.github.com/graphql"
)

MALWAREBAZAAR_API_URL = os.getenv(
    "MALWAREBAZAAR_API_URL",
    "https://mb-api.abuse.ch/api/v1/"
)

URLHAUS_API_URL = os.getenv(
    "URLHAUS_API_URL",
    "https://urlhaus-api.abuse.ch/v1/"
)

ALIENVAULT_OTX_API_URL = os.getenv(
    "ALIENVAULT_OTX_API_URL",
    "https://otx.alienvault.com/api/v1"
)


# Rate Limiting
NVD_RATE_LIMIT_DELAY = 6  # seconds (5 requests per 30 seconds without API key)
HIBP_RATE_LIMIT_DELAY = 1.5  # seconds (required by HIBP API)


# Default Model Names
DEFAULT_CLASSIFICATION_MODEL = "gemini-2.0-flash-exp"
DEFAULT_ANALYSIS_MODEL = "google_genai:gemini-2.0-flash-exp"

