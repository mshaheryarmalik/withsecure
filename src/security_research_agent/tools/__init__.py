"""Security assessment tools package - organized by category.

This package provides a clean, organized interface to all security assessment tools.
Tools are organized into logical category modules for better maintainability and discoverability.
"""

# Import tools from organized category modules
from .entity_resolution import (
    resolve_entity,
    detect_input_type,
)

from .vulnerability import (
    lookup_cves,
    check_cisa_kev,
    lookup_github_advisories,
)

from .vendor_compliance import (
    fetch_vendor_security_info,
    fetch_terms_of_service,
    fetch_privacy_policy,
    fetch_dpa,
    check_fedramp,
)

from .threat_intel import (
    lookup_malwarebazaar,
    lookup_urlhaus,
    lookup_alienvault_otx,
)

from .incidents import (
    lookup_security_incidents,
    search_databreaches_net,
    search_privacy_rights_clearinghouse,
)

from .news import (
    search_security_news,
)

from .advisories import (
    search_us_cert_advisories,
    search_cert_cc_advisories,
)

from .company_info import (
    lookup_whois,
    search_company_info,
)

from .community import (
    search_reddit_security,
    search_github_issues,
    search_stackoverflow,
)

from .alternatives import (
    search_alternatives,
    search_app_store_info,
)


def get_security_tools():
    """Get all security assessment tools as a list."""
    return [
        # Entity Resolution
        resolve_entity,
        
        # Vulnerabilities
        lookup_cves,
        check_cisa_kev,
        lookup_github_advisories,
        
        # Vendor & Compliance
        fetch_vendor_security_info,
        fetch_terms_of_service,
        fetch_privacy_policy,
        fetch_dpa,
        check_fedramp,
        
        # Threat Intelligence
        lookup_malwarebazaar,
        lookup_urlhaus,
        lookup_alienvault_otx,
        
        # Incidents & Breaches
        lookup_security_incidents,
        search_databreaches_net,
        search_privacy_rights_clearinghouse,
        
        # Security News
        search_security_news,
        
        # Advisories
        search_us_cert_advisories,
        search_cert_cc_advisories,
        
        # Company Info
        lookup_whois,
        search_company_info,
        
        # Community
        search_reddit_security,
        search_github_issues,
        search_stackoverflow,
        
        # Alternatives
        search_alternatives,
        search_app_store_info,
    ]


__all__ = [
    # Entity Resolution
    'resolve_entity',
    'detect_input_type',
    
    # Vulnerabilities
    'lookup_cves',
    'check_cisa_kev',
    'lookup_github_advisories',
    
    # Vendor & Compliance
    'fetch_vendor_security_info',
    'fetch_terms_of_service',
    'fetch_privacy_policy',
    'fetch_dpa',
    'check_fedramp',
    
    # Threat Intelligence
    'lookup_malwarebazaar',
    'lookup_urlhaus',
    'lookup_alienvault_otx',
    
    # Incidents & Breaches
    'lookup_security_incidents',
    'search_databreaches_net',
    'search_privacy_rights_clearinghouse',
    
    # Security News
    'search_security_news',
    
    # Advisories
    'search_us_cert_advisories',
    'search_cert_cc_advisories',
    
    # Company Information
    'lookup_whois',
    'search_company_info',
    
    # Community Sources
    'search_reddit_security',
    'search_github_issues',
    'search_stackoverflow',
    
    # Alternatives & Reviews
    'search_alternatives',
    'search_app_store_info',
    
    # Utility
    'get_security_tools',
]
