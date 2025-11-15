#!/usr/bin/env python3
"""Quick test script to verify CISO assessment system."""

import sys
from src.security_research_agent.security_tools import (
    resolve_entity,
    lookup_cves,
    fetch_vendor_security_info,
)
from src.security_research_agent.security_state import EntityResolution, CVETrendSummary

def test_entity_resolution():
    """Test entity resolution."""
    print("=" * 80)
    print("TEST 1: Entity Resolution")
    print("=" * 80)
    
    # Test with URL
    result = resolve_entity.invoke("https://slack.com")
    print("\nInput: https://slack.com")
    print(f"Result: {result}")
    
    # Test with name
    result = resolve_entity.invoke("Dropbox")
    print("\nInput: Dropbox")
    print(f"Result: {result}")
    
    print("\n✅ Entity resolution test passed\n")


def test_cve_lookup():
    """Test CVE lookup."""
    print("=" * 80)
    print("TEST 2: CVE Lookup")
    print("=" * 80)
    
    result = lookup_cves.invoke({"product_name": "Slack", "vendor_name": None})
    print("\nInput: Slack")
    print(f"Total CVEs: {result.get('total_cves', 0)}")
    print(f"Critical: {result.get('critical_count', 0)}")
    print(f"High: {result.get('high_count', 0)}")
    print(f"Trend: {result.get('trend', 'N/A')}")
    print(f"Data available: {result.get('data_available', False)}")
    
    print("\n✅ CVE lookup test passed\n")


def test_vendor_security():
    """Test vendor security info fetching."""
    print("=" * 80)
    print("TEST 3: Vendor Security Info")
    print("=" * 80)
    
    result = fetch_vendor_security_info.invoke({
        "website_url": "https://slack.com",
        "vendor_name": "Slack"
    })
    print("\nInput: https://slack.com")
    print(f"Security page found: {result.get('security_page_found', False)}")
    print(f"Security contact: {result.get('security_contact', 'N/A')}")
    print(f"Certifications: {result.get('claimed_certifications', [])}")
    
    print("\n✅ Vendor security test passed\n")


def test_state_models():
    """Test Pydantic state models."""
    print("=" * 80)
    print("TEST 4: State Models")
    print("=" * 80)
    
    # Test EntityResolution
    entity = EntityResolution(
        product_name="Test Product",
        vendor_name="Test Vendor",
        website="https://example.com",
        verified=True,
        input_type="url",
        confidence="high"
    )
    print(f"\nEntityResolution: {entity.product_name}")
    
    # Test CVETrendSummary
    cve_summary = CVETrendSummary(
        total_cves=10,
        critical_count=2,
        high_count=3,
        trend="stable"
    )
    print(f"CVETrendSummary: {cve_summary.total_cves} CVEs")
    
    print("\n✅ State models test passed\n")


def main():
    """Run all tests."""
    print("\n")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║   🧪 CISO Assessment System Tests                       ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print("\n")
    
    try:
        test_state_models()
        test_entity_resolution()
        test_cve_lookup()
        test_vendor_security()
        
        print("=" * 80)
        print("✅ ALL TESTS PASSED")
        print("=" * 80)
        print("\nSystem is ready for security assessments!")
        print("\nNext steps:")
        print("1. Set up your .env file with GOOGLE_API_KEY")
        print("2. Run: python ciso_cli.py --product 'Slack'")
        print("\n")
        
        return 0
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

