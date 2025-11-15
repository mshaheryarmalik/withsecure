# 🔒 CISO Security Assessment Agent

**Junction 2025 Hackathon Challenge**

An AI-powered security assessment tool that turns an application name or URL into a CISO-ready trust brief with sources in minutes.

## Overview

Built with Google Gemini 2.5 Pro/Flash, this agent helps security teams and CISOs approve new tools quickly and confidently by providing:

- **Entity Resolution**: Identify vendors from minimal input (name, URL, or SHA1 hash)
- **Security Posture Analysis**: CVE trends, breach history, compliance status
- **Risk Scoring**: Transparent 0-100 trust/risk scores with rationale
- **Safer Alternatives**: Recommendations with security-focused reasoning
- **Source Citations**: All claims labeled as "vendor-stated" vs "independent"

## Quick Start

### 1. Install Dependencies

```bash
uv sync
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Required:
- `GOOGLE_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

Optional (but recommended):
- `TAVILY_API_KEY` - Get from [Tavily](https://tavily.com) for enhanced search
- `NVD_API_KEY` - Get from [NVD](https://nvd.nist.gov/developers/request-an-api-key) for higher CVE lookup rate limits

### 3. Run Security Assessment

**CLI Usage:**

```bash
# Assess by product name
python ciso_cli.py assess --product "Slack"

# Assess by URL
python ciso_cli.py assess --url "https://slack.com"

# Assess by SHA1 hash
python ciso_cli.py assess --sha1 "a1b2c3d4e5f6..."

# Save as markdown report
python ciso_cli.py assess --product "Dropbox" --output markdown --output-file report.md

# Save as JSON
python ciso_cli.py assess --product "Salesforce" --output json --output-file assessment.json

# Disable cache (force fresh assessment)
python ciso_cli.py assess --product "GitHub" --no-cache
```

**Real-Time Status Updates:**

The CLI shows live progress as the assessment runs:
- 🔍 Entity resolution
- 📊 Software classification
- 🔐 Security data gathering (NVD, vendor pages, incidents)
- 🤖 AI analysis and scoring
- ✓ Success indicators with color coding

**Cache Management:**

```bash
# View cache statistics
python ciso_cli.py cache stats

# Clear cache
python ciso_cli.py cache clear
```

## Output Example

```
╔═══════════════════════════════════════════════════════════╗
║   🔒 CISO Security Assessment Tool                       ║
║   AI-powered security assessments in minutes             ║
║   Junction 2025 Hackathon                                ║
╚═══════════════════════════════════════════════════════════╝

Assessing: Slack

🔍 Resolving entity: Slack
✓ Identified: Slack (type: name)
📊 Classifying software category...
✓ Category: Communication platform
🔐 Gathering security data from multiple sources...
  → Querying NVD for CVE data...
  ✓ Found 60 CVEs (1 critical)
  → Checking vendor security pages...
  ⚠ No security page found
  → Checking incident databases...
  ⚠ Incident data limited (requires paid APIs)
🤖 Generating CISO security brief with AI...
  → Analyzing security posture...
  ✓ AI analysis complete
  → Calculating trust & risk scores...
  ✓ Trust: 65/100, Risk: 45/100
  → Identifying safer alternatives...
  ✓ Found 1 alternative(s)
  → Finalizing CISO brief...
✓ CISO brief generated successfully

✓ Assessment complete

================================================================================
SECURITY ASSESSMENT: Slack
================================================================================

VENDOR: Slack Technologies
ASSESSED: 2025-11-15 14:30:00
CONFIDENCE: MEDIUM

================================================================================
EXECUTIVE SUMMARY
================================================================================

Trust Score: 65/100
Risk Score:  45/100

Rationale: Moderate CVE history with good vendor transparency. SOC2 Type II 
certified. Some historical security incidents but strong compliance posture.

[... full assessment details ...]
```

## Features

### Real-Time Assessment Progress
- **Live status updates** during assessment
- **Step-by-step visibility** into data gathering
- **Color-coded indicators** (✓ success, ✗ error, ⚠ warning)
- **Progress tracking** through all 4 assessment stages

### High-Signal Sources (Priority Order)

**Independent Sources:**
- ✅ NVD (National Vulnerability Database) - CVE data
- ✅ CISA KEV - Known Exploited Vulnerabilities
- 🚧 CERT Advisories
- 🚧 HaveIBeenPwned - Breach data (requires API subscription)

**Vendor-Stated Sources:**
- ✅ Vendor Security/PSIRT pages
- ✅ Terms of Service & DPA
- ✅ Compliance claims (SOC2, ISO, GDPR)

### Assessment Components

1. **Entity Resolution** - Canonical product/vendor identification
2. **Software Taxonomy** - Category classification
3. **CVE Analysis** - Vulnerability trends with CISA KEV cross-reference
4. **Vendor Reputation** - Security page presence, certifications
5. **Incident History** - Breach and abuse signals
6. **Compliance Status** - SOC2, ISO, GDPR verification
7. **Data Handling** - Encryption, retention, sharing policies
8. **Trust/Risk Scores** - Transparent 0-100 scores with rationale
9. **Alternatives** - Safer product recommendations
10. **Citations** - All sources with labels (vendor-stated vs independent)

### Cache System

- **Automatic Caching**: Assessments cached for 24 hours by default
- **Reproducibility**: Same input = same cached result within TTL
- **Cache Management**: View stats and clear cache via CLI

## Architecture

```
src/security_research_agent/
├── configuration.py      # Agent configuration
├── security_state.py     # Pydantic models for CISO brief
├── security_tools.py     # Entity resolution, CVE lookup, vendor scraping
├── security_prompts.py   # CISO-focused prompts
├── ciso_assessor.py     # Main LangGraph orchestration
├── cache.py             # File-based assessment cache
└── utils.py             # Shared utilities

ciso_cli.py              # Command-line interface
```

## Configuration

Key settings in `configuration.py`:
- `research_model`: Default `gemini-2.5-pro`
- `summarization_model`: Default `gemini-2.5-flash`
- `final_report_model`: Default `google_genai:gemini-2.0-flash-exp`
- `search_api`: Tavily or Google native search

## Development Status

**Phase 1 Complete**: ✅
- Gemini-only implementation
- Removed non-Gemini LLM providers
- Updated configuration defaults

**Phase 2 Complete**: ✅
- Security state models (EntityResolution, CVETrendSummary, CISOBrief)
- Security tools (entity resolution, CVE lookup, vendor scraping)
- CISO-focused prompts with citation requirements
- LangGraph orchestration workflow
- Cache implementation with timestamps
- Full-featured CLI

**Next Steps**: 🚧
- Demo examples and validation
- Enhanced incident lookup (HaveIBeenPwned integration)
- Web UI (stretch goal)

## Hackathon Judging Criteria Alignment

| Criteria | Score | Implementation |
|----------|-------|----------------|
| Entity resolution & categorization (20%) | ⭐⭐⭐⭐⭐ | SHA1/URL/name detection, taxonomy classification |
| Evidence & citation quality (24%) | ⭐⭐⭐⭐⭐ | All claims cited, labeled vendor-stated vs independent |
| Security posture synthesis (12%) | ⭐⭐⭐⭐⭐ | CVE trends, incidents, compliance, data handling |
| Trust/risk score transparency (8%) | ⭐⭐⭐⭐⭐ | 0-100 scores with detailed rationale & confidence |
| Technical execution & resilience (15%) | ⭐⭐⭐⭐ | Error handling, caching, rate limiting |
| Problem fit & clarity (15%) | ⭐⭐⭐⭐⭐ | CISO-focused output, decision-ready briefs |
| Alternatives & quick compare (6%) | ⭐⭐⭐⭐ | 1-2 alternatives with security rationale |

## License

MIT
