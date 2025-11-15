#!/usr/bin/env python3
"""CISO Security Assessment CLI - Command-line interface for security assessments."""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.live import Live
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.text import Text

# Load environment variables from .env file
load_dotenv()

from src.security_research_agent.cache import get_cache
from src.security_research_agent.ciso_assessor import assess_security
from src.security_research_agent.configuration import Configuration


console = Console()


def print_banner():
    """Print CLI banner."""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║   🔒 CISO Security Assessment Tool                       ║
║   AI-powered security assessments in minutes             ║
║   Junction 2025 Hackathon                                ║
╚═══════════════════════════════════════════════════════════╝
    """
    console.print(banner, style="bold cyan")


def format_json_output(brief) -> str:
    """Format CISO brief as JSON."""
    return json.dumps(brief.model_dump(mode='json'), indent=2, default=str)


def format_markdown_output(brief) -> str:
    """Format CISO brief as Markdown."""
    return brief.to_markdown()


def format_text_output(brief) -> str:
    """Format CISO brief as plain text."""
    text = f"""
{'='*80}
SECURITY ASSESSMENT: {brief.entity.product_name}
{'='*80}

VENDOR: {brief.entity.vendor_name}
ASSESSED: {brief.assessment_timestamp.strftime('%Y-%m-%d %H:%M:%S')}
CONFIDENCE: {brief.confidence.value.upper()}

{'='*80}
EXECUTIVE SUMMARY
{'='*80}

Trust Score: {brief.trust_score}/100
Risk Score:  {brief.risk_score}/100

Rationale: {brief.rationale}

{'='*80}
PRODUCT OVERVIEW
{'='*80}

Category: {brief.taxonomy.primary_category.value}
Description: {brief.description}
Usage: {brief.usage}

{'='*80}
SECURITY POSTURE
{'='*80}

CVE Summary ({brief.cve_summary.source_label.value}):
  - Total CVEs: {brief.cve_summary.total_cves}
  - Critical: {brief.cve_summary.critical_count}
  - High: {brief.cve_summary.high_count}
  - Medium: {brief.cve_summary.medium_count}
  - Low: {brief.cve_summary.low_count}
  - CISA KEV: {brief.cve_summary.cisa_kev_count}
  - Trend: {brief.cve_summary.trend}

Incidents ({brief.incidents.source_label.value}):
  - Data Breaches: {brief.incidents.breach_count}
  - Total Incidents: {len(brief.incidents.incidents)}

Compliance:
  - SOC2: {brief.compliance.soc2_status}
  - GDPR: {'Yes' if brief.compliance.gdpr_compliant else 'Unknown'}
  - ISO Certifications: {len(brief.compliance.iso_certifications)}

Data Handling ({brief.data_handling.source_label.value}):
  - Encryption: {'Yes' if brief.data_handling.encryption_claimed else 'Not stated'}
  - Data Retention: {brief.data_handling.data_retention or 'Not specified'}
  - Third-party Sharing: {brief.data_handling.third_party_sharing or 'Not specified'}

{'='*80}
RECOMMENDED ALTERNATIVES
{'='*80}

"""
    for i, alt in enumerate(brief.safer_alternatives, 1):
        text += f"{i}. {alt.product_name} ({alt.vendor_name})\n"
        text += f"   {alt.rationale}\n\n"
    
    text += f"""
{'='*80}
CITATIONS
{'='*80}

"""
    for i, citation in enumerate(brief.all_citations, 1):
        text += f"{i}. [{citation.source_type}] {citation.source_url} ({citation.source_label.value})\n"
    
    if brief.insufficient_data_notes:
        text += f"""
{'='*80}
DATA LIMITATIONS
{'='*80}

⚠️  {brief.insufficient_data_notes}
"""
    
    text += f"\n{'='*80}\n"
    return text


def create_status_display(status_messages):
    """Create a Rich table for status display."""
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Status", style="cyan")
    
    for msg in status_messages:
        # Color code messages
        if msg.startswith("✓"):
            table.add_row(f"[green]{msg}[/green]")
        elif msg.startswith("✗"):
            table.add_row(f"[red]{msg}[/red]")
        elif msg.startswith("⚠"):
            table.add_row(f"[yellow]{msg}[/yellow]")
        elif msg.startswith("  →"):
            table.add_row(f"[dim]{msg}[/dim]")
        else:
            table.add_row(msg)
    
    return table


def assess_command(args):
    """Run security assessment."""
    # Determine input
    input_text = args.product or args.url or args.sha1
    
    if not input_text:
        console.print("[red]Error: Must provide --product, --url, or --sha1[/red]")
        sys.exit(1)
    
    console.print(f"\n[cyan]Assessing:[/cyan] {input_text}\n")
    
    # Check cache
    cache = get_cache(ttl_hours=args.cache_ttl) if not args.no_cache else None
    
    if cache and not args.no_cache:
        cached_brief = cache.get(input_text)
        if cached_brief:
            console.print("[green]✓[/green] Found cached assessment\n")
            output_brief(cached_brief, args.output, args.output_file)
            return
    
    # Run assessment with real-time status updates
    try:
        from src.security_research_agent.ciso_assessor import create_ciso_assessor_graph, AssessmentState
        from langchain_core.messages import HumanMessage
        
        graph = create_ciso_assessor_graph()
        
        initial_state = AssessmentState(
            input_text=input_text,
            messages=[HumanMessage(content=f"Assess security for: {input_text}")]
        )
        
        brief = None
        errors = []
        
        # Use Rich Live display for real-time updates
        with Live(console=console, refresh_per_second=4) as live:
            for event in graph.stream(initial_state, stream_mode="updates"):
                for node_name, node_data in event.items():
                    status_messages = node_data.get("status_messages", [])
                    current_step = node_data.get("current_step", "")
                    node_errors = node_data.get("errors", [])
                    
                    if status_messages:
                        live.update(create_status_display(status_messages))
                    
                    if node_errors:
                        errors.extend(node_errors)
                    
                    if node_data.get("ciso_brief"):
                        brief = node_data.get("ciso_brief")
        
        if errors:
            console.print(f"\n[yellow]Warnings encountered:[/yellow]")
            for error in errors:
                console.print(f"  • {error}")
        
        if not brief:
            console.print("\n[red]✗ Assessment failed[/red]")
            sys.exit(1)
        
        console.print("\n[green]✓[/green] Assessment complete\n")
        
        # Cache result
        if cache and not args.no_cache:
            cache.set(input_text, brief)
        
        # Output
        output_brief(brief, args.output, args.output_file)
        
    except Exception as e:
        console.print(f"\n[red]Error during assessment: {e}[/red]")
        if args.verbose:
            import traceback
            console.print(traceback.format_exc())
        sys.exit(1)


def output_brief(brief, output_format, output_file):
    """Output the CISO brief."""
    # Format output
    if output_format == 'json':
        output = format_json_output(brief)
    elif output_format == 'markdown':
        output = format_markdown_output(brief)
    else:  # text
        output = format_text_output(brief)
    
    # Write to file or console
    if output_file:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output)
        console.print(f"[green]✓[/green] Saved to: {output_file}\n")
    else:
        if output_format == 'markdown':
            console.print(Markdown(output))
        else:
            console.print(output)


def cache_command(args):
    """Manage cache."""
    cache = get_cache()
    
    if args.cache_action == 'stats':
        stats = cache.stats()
        console.print("\n[cyan]Cache Statistics:[/cyan]\n")
        console.print(f"  Directory: {stats.get('cache_dir', 'N/A')}")
        console.print(f"  Total cached: {stats.get('total_cached', 0)}")
        console.print(f"  Valid: {stats.get('valid', 0)}")
        console.print(f"  Expired: {stats.get('expired', 0)}")
        console.print(f"  Total size: {stats.get('total_size_kb', 0):.2f} KB")
        console.print(f"  TTL: {stats.get('ttl_hours', 24)} hours\n")
    
    elif args.cache_action == 'clear':
        count = cache.clear()
        console.print(f"\n[green]✓[/green] Cleared {count} cached assessments\n")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='CISO Security Assessment Tool - AI-powered security assessments',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --product "Slack"
  %(prog)s --url "https://slack.com"
  %(prog)s --sha1 "a1b2c3d4e5f6..."
  %(prog)s --product "Dropbox" --output markdown --output-file report.md
  %(prog)s cache stats
  %(prog)s cache clear
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Assess command (default)
    assess_parser = subparsers.add_parser('assess', help='Run security assessment (default)')
    input_group = assess_parser.add_mutually_exclusive_group()
    input_group.add_argument('-p', '--product', help='Product name')
    input_group.add_argument('-u', '--url', help='Product URL')
    input_group.add_argument('-s', '--sha1', help='SHA1 hash')
    
    assess_parser.add_argument(
        '-o', '--output',
        choices=['text', 'json', 'markdown'],
        default='text',
        help='Output format (default: text)'
    )
    assess_parser.add_argument(
        '-f', '--output-file',
        help='Save output to file'
    )
    assess_parser.add_argument(
        '--no-cache',
        action='store_true',
        help='Disable cache (force fresh assessment)'
    )
    assess_parser.add_argument(
        '--cache-ttl',
        type=int,
        default=24,
        help='Cache TTL in hours (default: 24)'
    )
    assess_parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    # Cache command
    cache_parser = subparsers.add_parser('cache', help='Manage assessment cache')
    cache_parser.add_argument(
        'cache_action',
        choices=['stats', 'clear'],
        help='Cache action'
    )
    
    # Parse args
    args = parser.parse_args()
    
    # Print banner
    print_banner()
    
    # Default to assess command if no command specified
    if not args.command:
        # Check if any input provided
        if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
            # Treat first arg as product name
            args.command = 'assess'
            args.product = sys.argv[1]
            args.output = 'text'
            args.output_file = None
            args.no_cache = False
            args.cache_ttl = 24
            args.verbose = False
        else:
            parser.print_help()
            sys.exit(0)
    
    # Execute command
    if args.command == 'assess' or not args.command:
        assess_command(args)
    elif args.command == 'cache':
        cache_command(args)


if __name__ == '__main__':
    main()

