#!/usr/bin/env python3
"""Comprehensive test suite for all security research tools.

This script tests every tool with sample inputs and validates:
1. Request structure is correct
2. Response structure is correct
3. Error handling works properly
4. API keys are configured correctly
"""

import os
import sys
import json
from datetime import datetime
from typing import Any, Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from security_research_agent.tools import (
    # Entity Resolution
    resolve_entity, detect_input_type,
    # Vulnerability
    lookup_cves, check_cisa_kev, lookup_github_advisories,
    # Vendor Compliance
    fetch_vendor_security_info, fetch_terms_of_service, 
    fetch_privacy_policy, fetch_dpa, check_fedramp,
    # Threat Intel
    lookup_malwarebazaar, lookup_urlhaus, lookup_alienvault_otx,
    # Incidents
    lookup_security_incidents,
    # News
    search_security_news,
    # Advisories
    search_us_cert_advisories,
    # Company Info
    lookup_whois, search_company_info,
    # Alternatives
    search_alternatives,
)


class ToolTester:
    """Test framework for security research tools."""
    
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.skipped = 0
        
    def log(self, message: str, level: str = "INFO"):
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️ ",
            "SUCCESS": "✅",
            "ERROR": "❌",
            "WARN": "⚠️ ",
            "DEBUG": "🔍"
        }.get(level, "  ")
        print(f"[{timestamp}] {prefix} {message}")
    
    def test_tool(self, name: str, tool_func, input_data: Dict, 
                  required_keys: List[str] = None, api_key_env: str = None):
        """Test a single tool.
        
        Args:
            name: Tool name
            tool_func: Tool function to test
            input_data: Input parameters
            required_keys: Keys that must be in response
            api_key_env: Environment variable for API key (if required)
        """
        print("\n" + "="*80)
        self.log(f"Testing: {name}", "INFO")
        print("="*80)
        
        # Check API key if required
        if api_key_env:
            api_key = os.getenv(api_key_env)
            if not api_key:
                self.log(f"API key {api_key_env} not configured - SKIPPING", "WARN")
                self.skipped += 1
                self.results.append({
                    "tool": name,
                    "status": "SKIPPED",
                    "reason": f"Missing API key: {api_key_env}"
                })
                return
            else:
                self.log(f"API key {api_key_env}: {'*' * 8}{api_key[-4:]}", "DEBUG")
        
        try:
            # Log input
            self.log(f"Input: {json.dumps(input_data, indent=2)}", "DEBUG")
            
            # Call tool
            self.log("Calling tool...", "INFO")
            result = tool_func.invoke(input_data)
            
            # Log output (truncated if too long)
            result_str = json.dumps(result, indent=2, default=str)
            if len(result_str) > 500:
                self.log(f"Output (truncated): {result_str[:500]}...", "DEBUG")
            else:
                self.log(f"Output: {result_str}", "DEBUG")
            
            # Validate structure
            if required_keys:
                missing_keys = [k for k in required_keys if k not in result]
                if missing_keys:
                    self.log(f"Missing required keys: {missing_keys}", "ERROR")
                    self.failed += 1
                    self.results.append({
                        "tool": name,
                        "status": "FAILED",
                        "reason": f"Missing keys: {missing_keys}",
                        "result": result
                    })
                    return
            
            # Check if result is None or empty
            if result is None:
                self.log("Result is None", "ERROR")
                self.failed += 1
                self.results.append({
                    "tool": name,
                    "status": "FAILED",
                    "reason": "Result is None"
                })
                return
            
            # Success!
            self.log(f"✓ {name} PASSED", "SUCCESS")
            self.passed += 1
            self.results.append({
                "tool": name,
                "status": "PASSED",
                "result_keys": list(result.keys()) if isinstance(result, dict) else None,
                "result_type": type(result).__name__
            })
            
        except Exception as e:
            self.log(f"Exception: {type(e).__name__}: {str(e)}", "ERROR")
            self.failed += 1
            self.results.append({
                "tool": name,
                "status": "FAILED",
                "reason": f"Exception: {str(e)}"
            })
    
    def print_summary(self):
        """Print test summary."""
        print("\n\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"✅ PASSED:  {self.passed}")
        print(f"❌ FAILED:  {self.failed}")
        print(f"⚠️  SKIPPED: {self.skipped}")
        print(f"📊 TOTAL:   {self.passed + self.failed + self.skipped}")
        print("="*80)
        
        # Print failed tests
        if self.failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if result['status'] == 'FAILED':
                    print(f"  - {result['tool']}: {result['reason']}")
        
        # Print skipped tests
        if self.skipped > 0:
            print("\n⚠️  SKIPPED TESTS:")
            for result in self.results:
                if result['status'] == 'SKIPPED':
                    print(f"  - {result['tool']}: {result['reason']}")
        
        # Save detailed report
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                "summary": {
                    "passed": self.passed,
                    "failed": self.failed,
                    "skipped": self.skipped,
                    "total": self.passed + self.failed + self.skipped
                },
                "results": self.results,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2, default=str)
        
        print(f"\n📄 Detailed report saved to: {report_file}")


def main():
    """Run all tool tests."""
    tester = ToolTester()
    
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║             SECURITY RESEARCH TOOLS - COMPREHENSIVE TEST            ║")
    print("╚══════════════════════════════════════════════════════════════════════╝\n")
    
    # ========================================================================
    # ENTITY RESOLUTION TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 1: ENTITY RESOLUTION")
    print("█"*80)
    
    # Note: detect_input_type is a regular function, not a tool
    # Skipping test as it doesn't have .invoke() method
    # Direct test: detect_input_type("redis") returns InputType enum
    
    tester.test_tool(
        "resolve_entity (name)",
        resolve_entity,
        {"input_text": "redis"},
        required_keys=["product_name", "vendor_name", "original_name", "confidence"],
        api_key_env="GOOGLE_API_KEY"
    )
    
    tester.test_tool(
        "resolve_entity (URL)",
        resolve_entity,
        {"input_text": "https://redis.io"},
        required_keys=["product_name", "vendor_name", "original_name", "website"],
        api_key_env="GOOGLE_API_KEY"
    )
    
    # ========================================================================
    # VULNERABILITY TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 2: VULNERABILITY ASSESSMENT")
    print("█"*80)
    
    tester.test_tool(
        "lookup_cves",
        lookup_cves,
        {"product_name": "redis", "vendor_name": "Redis Ltd."},
        required_keys=["total_cves", "critical_count", "high_count", "data_available"]
    )
    
    tester.test_tool(
        "check_cisa_kev",
        check_cisa_kev,
        {"product_name": "redis"},
        required_keys=["kev_count", "vulnerabilities"]
    )
    
    tester.test_tool(
        "lookup_github_advisories",
        lookup_github_advisories,
        {"product_name": "redis"},
        required_keys=["advisory_count"],
        api_key_env="GITHUB_TOKEN"
    )
    
    # ========================================================================
    # VENDOR COMPLIANCE TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 3: VENDOR COMPLIANCE")
    print("█"*80)
    
    tester.test_tool(
        "fetch_vendor_security_info",
        fetch_vendor_security_info,
        {"website_url": "https://redis.io", "vendor_name": "Redis"},
        required_keys=["vendor_name", "security_page_found", "claimed_certifications"],
        api_key_env="TAVILY_API_KEY"
    )
    
    tester.test_tool(
        "fetch_terms_of_service",
        fetch_terms_of_service,
        {"website_url": "https://redis.io", "product_name": "Redis"},
        required_keys=["found", "url"],
        api_key_env="TAVILY_API_KEY"
    )
    
    tester.test_tool(
        "fetch_privacy_policy",
        fetch_privacy_policy,
        {"website_url": "https://redis.io", "product_name": "Redis"},
        required_keys=["found", "url"],
        api_key_env="TAVILY_API_KEY"
    )
    
    tester.test_tool(
        "fetch_dpa",
        fetch_dpa,
        {"website_url": "https://redis.io", "product_name": "Redis"},
        required_keys=["found", "url"],
        api_key_env="TAVILY_API_KEY"
    )
    
    tester.test_tool(
        "check_fedramp",
        check_fedramp,
        {"product_name": "Redis"},
        required_keys=["authorized", "status"]
    )
    
    # ========================================================================
    # THREAT INTELLIGENCE TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 4: THREAT INTELLIGENCE")
    print("█"*80)
    
    tester.test_tool(
        "lookup_malwarebazaar",
        lookup_malwarebazaar,
        {"product_name": "redis"},
        required_keys=["samples_found"]
    )
    
    tester.test_tool(
        "lookup_urlhaus",
        lookup_urlhaus,
        {"domain": "redis.io"},
        required_keys=["threat_found"]
    )
    
    tester.test_tool(
        "lookup_alienvault_otx",
        lookup_alienvault_otx,
        {"domain": "redis.io"},
        required_keys=["threat_found"]
    )
    
    # ========================================================================
    # INCIDENT TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 5: INCIDENT DATABASES")
    print("█"*80)
    
    tester.test_tool(
        "lookup_security_incidents",
        lookup_security_incidents,
        {"product_name": "Redis", "domain": "redis.io"},
        required_keys=["breach_found", "source"],
        api_key_env="HIBP_API_KEY"
    )
    
    # ========================================================================
    # NEWS & ADVISORIES TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 6: NEWS & ADVISORIES")
    print("█"*80)
    
    tester.test_tool(
        "search_security_news",
        search_security_news,
        {"product_name": "redis"},
        required_keys=["incident_count", "incidents"],  # Fixed to match actual response
        api_key_env="TAVILY_API_KEY"
    )
    
    tester.test_tool(
        "search_us_cert_advisories",
        search_us_cert_advisories,
        {"product_name": "redis"},
        required_keys=["advisory_count"],
        api_key_env="TAVILY_API_KEY"
    )
    
    # ========================================================================
    # COMPANY INFO TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 7: COMPANY INFORMATION")
    print("█"*80)
    
    tester.test_tool(
        "lookup_whois",
        lookup_whois,
        {"domain": "redis.io"},
        required_keys=["domain", "found"]
    )
    
    tester.test_tool(
        "search_company_info",
        search_company_info,
        {"company_name": "Redis Ltd."},
        required_keys=["found"],
        api_key_env="TAVILY_API_KEY"
    )
    
    # ========================================================================
    # ALTERNATIVES TOOLS
    # ========================================================================
    print("\n" + "█"*80)
    print("█ CATEGORY 8: ALTERNATIVES")
    print("█"*80)
    
    tester.test_tool(
        "search_alternatives",
        search_alternatives,
        {"product_name": "Redis"},
        required_keys=["alternatives_found", "alternatives"],
        api_key_env="TAVILY_API_KEY"
    )
    
    # Print summary
    tester.print_summary()
    
    # Return exit code based on results
    return 0 if tester.failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

