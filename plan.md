# CISO-Ready Security Assessment Tool - Implementation Plan

**Project Name**: AI Security Assessor

**Objective**: Build an AI assessor that turns an application name or URL into a CISO-ready trust brief with sources in minutes

**Date Created**: November 15, 2025

---

## Project Requirements Summary

### Core Functionality
- **Input**: Minimal input (product name, vendor, URL, or SHA1 hash)
- **Output**: Decision-ready security brief with citations
- **Purpose**: Help security teams and CISOs approve new tools quickly and confidently

### Key Components Required
1. Entity resolution and vendor identity verification
2. Software taxonomy classification (File sharing, GenAI tool, SaaS CRM, Endpoint agent, etc.)
3. Security posture summary covering:
   - Description and usage
   - Vendor reputation
   - CVE trend summaries
   - Incidents/abuse signals
   - Data handling/compliance
   - Deployment/admin controls
   - Transparent 0-100 trust/risk score with rationale and confidence
4. 1-2 safer alternatives with short rationale
5. Lightweight local cache with timestamps and reproducibility

### High-Signal Sources to Prioritize
- Vendor security/PSIRT pages (Product Security Incident Response Team)
- Terms of Service/Data Processing Agreement (ToS/DPA)
- SOC2 (System and Organization Controls Type II) attestations
- ISO certifications
- Reputable advisories/CERTs (Computer Emergency Response Teams)
- CISA KEV (Known Exploited Vulnerabilities catalog)
- Official CVE databases (NVD)

### Quality Requirements
- Guard against hallucinations by labeling "vendor-stated" vs "independent claims"
- When data is scarce, return "Insufficient public evidence"
- Include citations for all claims
- Provide confidence levels for assessments

### Deliverable Options
- CLI (Command Line Interface) - primary
- Service/API - optional
- Web UI with compare-view - bonus

---

## Phase 1: Remove Non-Gemini LLM Providers

### 1.1 Dependencies - `pyproject.toml`
- [ ] Remove `langchain-openai>=0.3.28`
- [ ] Remove `langchain-anthropic>=0.3.15`
- [ ] Remove `langchain-deepseek>=0.1.2`
- [ ] Remove `langchain-groq>=0.2.4`
- [ ] Remove `langchain-aws>=0.2.28`
- [ ] Remove `openai>=1.99.2` (standalone package)
- [ ] Keep `langchain-google-vertexai>=2.0.25`
- [ ] Keep `langchain-google-genai>=2.1.5`

### 1.2 Configuration Defaults - `src/open_deep_research/configuration.py`
- [ ] Update `summarization_model` default: `openai:gpt-4.1-mini` → `google:gemini-2.5-flash`
- [ ] Update `research_model` default: `openai:gpt-4.1` → `google:gemini-2.5-pro`
- [ ] Update `compression_model` default: `openai:gpt-4.1` → `google:gemini-2.5-flash`
- [ ] Update `final_report_model` default: `openai:gpt-4.1` → `google:gemini-2.5-pro`
- [ ] Update `search_api` options: Can use Gemini's native Search grounding or Tavily
- [ ] Update UI config descriptions to reflect Gemini-only support

### 1.3 Utility Functions - `src/open_deep_research/utils.py`

#### Token Limits Dictionary (lines 788-829)
- [ ] Remove all OpenAI model entries (`openai:*`)
- [ ] Remove all Anthropic model entries (`anthropic:*`)
- [ ] Remove all Cohere model entries (`cohere:*`)
- [ ] Remove all Mistral model entries (`mistral:*`)
- [ ] Remove all Ollama model entries (`ollama:*`)
- [ ] Remove all Bedrock model entries (`bedrock:*`)
- [ ] Keep only Google/Gemini models with correct token limits:
  - `google:gemini-2.5-pro`: input 1,048,576 / output 65,536
  - `google:gemini-2.5-flash`: input 1,048,576 / output 65,536
  - `google:gemini-2.0-flash`: input 1,048,576 / output 8,192
  - `google:gemini-2.0-flash-lite`: input 1,048,576 / output 8,192

#### API Key Functions (lines 892-926)
- [ ] Simplify `get_api_key_for_model()` to only handle Google/Gemini
- [ ] Remove OpenAI and Anthropic conditional branches
- [ ] Keep only `GOOGLE_API_KEY` handling
- [ ] Update `get_tavily_api_key()` (keep as-is for search)

#### Token Limit Detection (lines 665-785)
- [ ] Simplify `is_token_limit_exceeded()` to only check Gemini
- [ ] Remove `_check_openai_token_limit()` function entirely
- [ ] Remove `_check_anthropic_token_limit()` function entirely
- [ ] Keep only `_check_gemini_token_limit()` function
- [ ] Remove OpenAI/Anthropic provider detection logic

### 1.4 Environment Configuration
- [ ] Create/Update `.env.example` with only required keys:
  - `GOOGLE_API_KEY`
  - `TAVILY_API_KEY` (optional, for search)
- [ ] Document removal of deprecated keys:
  - ~~`OPENAI_API_KEY`~~
  - ~~`ANTHROPIC_API_KEY`~~

### 1.5 Lock Files and Installation
- [ ] Run `uv lock` to update dependency locks
- [ ] Run `uv sync` to install updated dependencies
- [ ] Verify no orphaned packages remain

---

## Phase 2: Implement Core Security Assessment Features

### 2.1 Create High-Signal Source Tools

#### 2.1.1 Entity Resolution Tool - `src/open_deep_research/security_tools.py`
- [ ] Create new file for security tools
- [ ] Implement `resolve_entity_tool`:
  - Take minimal input (name, vendor, URL, or SHA1 hash)
  - Resolve to canonical vendor/product name
  - For SHA1: Query VirusTotal/MalwareBazaar to identify file/software
  - Extract official website, vendor name, product name
  - Verify domain ownership
  - Return structured entity information with input type (name/url/sha1)
- [ ] Add confidence scoring for resolution

#### 2.1.2 Vendor Security Page Tool
- [ ] Implement `fetch_vendor_security_tool`:
  - Find and scrape vendor security/PSIRT pages
  - Extract security contact information
  - Find security advisories and bulletins
  - Identify security certifications claimed
  - Label as "vendor-stated" information

#### 2.1.3 CVE and CISA KEV Tool
- [ ] Implement `cve_lookup_tool`:
  - Query NVD (National Vulnerability Database) API
  - Check CISA Known Exploited Vulnerabilities catalog
  - Return CVE count, severity distribution, trends
  - Calculate trend summary (increasing/stable/decreasing)
  - Include proper citations (independent source)
- [ ] Add error handling and rate limiting
- [ ] Add caching for API responses

#### 2.1.4 Compliance and Certification Tool
- [ ] Implement `compliance_check_tool`:
  - Search for SOC2 Type II reports/attestations
  - Verify ISO 27001, ISO 27017, ISO 27018 certifications
  - Check GDPR/CCPA compliance statements
  - Distinguish vendor-stated vs independently verified
  - Return certification list with verification status and dates

#### 2.1.5 Terms of Service and DPA Tool
- [ ] Implement `fetch_legal_documents_tool`:
  - Locate Terms of Service (ToS)
  - Locate Data Processing Agreement (DPA)
  - Extract key data handling clauses
  - Identify data retention, encryption, sharing policies
  - Summarize compliance commitments

#### 2.1.6 Incident and Abuse Signals Tool
- [ ] Implement `incident_lookup_tool`:
  - Query HaveIBeenPwned API for breach history
  - Check reputable security advisory databases
  - Search CERT notices and vendor advisories
  - Look for abuse reports and security incidents
  - Include timestamps and severity (independent sources)

#### 2.1.7 Software Taxonomy Classifier
- [ ] Implement `classify_software_tool`:
  - Analyze product description and functionality
  - Classify into taxonomy: File sharing, GenAI tool, SaaS CRM, 
    Endpoint agent, Browser extension, Communication platform, etc.
  - Return primary and secondary categories
  - Include confidence level

### 2.2 Security Configuration - `src/open_deep_research/security_config.py`
- [ ] Create `SecurityConfiguration` class extending `Configuration`
- [ ] Add security-specific fields:
  - `high_signal_sources: List[str]` (PSIRT, CISA KEV, NVD, etc.)
  - `enable_cve_lookup: bool`
  - `enable_vendor_security_check: bool`
  - `enable_incident_check: bool`
  - `enable_compliance_check: bool`
  - `enable_tos_dpa_analysis: bool`
  - `minimum_confidence_threshold: float`
  - `cache_enabled: bool`
  - `cache_ttl_hours: int`
- [ ] Set `search_api` default to `SearchAPI.TAVILY` (for finding vendor pages)
- [ ] Add source prioritization configuration

### 2.3 Security Prompts - `src/open_deep_research/security_prompts.py`
- [ ] Create CISO-focused system prompt
- [ ] Add instructions for high-signal source prioritization
- [ ] Add strict citation requirements (every claim must cite source)
- [ ] Add "vendor-stated" vs "independent" labeling instructions
- [ ] Add "Insufficient public evidence" fallback instructions
- [ ] Add risk assessment guidelines (0-100 score with rationale)
- [ ] Create prompt for alternative suggestions with rationale
- [ ] Add confidence scoring instructions (high/medium/low)
- [ ] Add taxonomy classification guidance
- [ ] Add CVE trend analysis instructions

### 2.4 Security State Models - `src/open_deep_research/security_state.py`
- [ ] Create `EntityResolution` Pydantic model:
  - product_name, vendor_name, website, verified: bool
  - input_type: str (name/url/sha1)
  - sha1_hash: Optional[str] (if input was SHA1)
  - file_reputation: Optional[str] (if SHA1 lookup performed)
- [ ] Create `SoftwareTaxonomy` Pydantic model:
  - primary_category, secondary_categories, confidence
- [ ] Create `CVETrendSummary` Pydantic model:
  - total_cves, critical_count, high_count, medium_count, low_count
  - trend: str (increasing/stable/decreasing)
  - recent_cves: List[CVEDetail]
  - cisa_kev_count: int
  - citation: str (always "independent")
- [ ] Create `VendorReputation` Pydantic model:
  - vendor_name, founded_year, security_page_found: bool
  - security_contact: Optional[str]
  - claimed_certifications: List[str] (vendor-stated)
- [ ] Create `IncidentReport` Pydantic model:
  - incidents: List[IncidentDetail] (with timestamps, sources)
  - breach_count: int
  - source_label: str (vendor-stated vs independent)
- [ ] Create `ComplianceStatus` Pydantic model:
  - soc2_status: str (verified/claimed/not_found)
  - iso_certifications: List[CertificationDetail]
  - gdpr_compliant: Optional[bool]
  - source_label: str per field
- [ ] Create `DataHandling` Pydantic model:
  - tos_url, dpa_url
  - encryption_claimed, data_retention, third_party_sharing
  - source: str (all vendor-stated)
- [ ] Create `CISOBrief` Pydantic model (final output):
  - entity: EntityResolution
  - taxonomy: SoftwareTaxonomy
  - description: str
  - usage: str
  - vendor_reputation: VendorReputation
  - cve_summary: CVETrendSummary
  - incidents: IncidentReport
  - compliance: ComplianceStatus
  - data_handling: DataHandling
  - deployment_controls: str
  - trust_score: int (0-100)
  - risk_score: int (0-100)
  - rationale: str
  - confidence: str (high/medium/low)
  - safer_alternatives: List[AlternativeProduct]
  - all_citations: List[Citation]
  - assessment_timestamp: datetime
  - insufficient_data_notes: Optional[str]

### 2.5 Security Assessment Graph - `src/open_deep_research/ciso_assessor.py`
- [ ] Create CISO assessment-specific graph (separate from deep research)
- [ ] Implement `resolve_entity` node:
  - Takes minimal input (name/vendor/URL/SHA1)
  - Detects input type (regex for SHA1, URL patterns, etc.)
  - For SHA1: Query file reputation services first
  - Resolves to canonical entity
  - Returns entity info or "Unable to resolve" error
- [ ] Implement `classify_software` node:
  - Determines software taxonomy
  - Uses entity info and description
- [ ] Implement `parallel_security_checks` node:
  - Execute security checks in parallel:
    - CVE/CISA KEV lookup
    - Vendor security page scan
    - Incident database search
    - Compliance verification
    - ToS/DPA analysis
  - Each returns with source labels (vendor-stated vs independent)
- [ ] Implement `generate_ciso_brief` node:
  - Synthesizes all findings
  - Calculates trust/risk scores with rationale
  - Determines confidence level
  - Suggests safer alternatives
  - Formats citations
  - Adds "Insufficient public evidence" notes where needed
- [ ] Implement `cache_results` node:
  - Stores results with timestamp
  - Enables reproducibility
- [ ] Wire up graph with proper error handling

### 2.6 Modify Tool Selection - `src/open_deep_research/utils.py`
- [ ] Create `get_ciso_tools()` function separate from `get_all_tools()`
- [ ] CISO mode tools:
  - Entity resolution tool
  - Vendor security page tool
  - CVE/CISA KEV tool
  - Compliance check tool
  - ToS/DPA tool
  - Incident lookup tool
  - Software taxonomy tool
  - Keep think_tool for reasoning
  - Keep limited web search (Tavily) only for finding official vendor pages
- [ ] Add tool validation to prevent unauthorized tool usage
- [ ] Ensure all tools return proper source labels

### 2.7 Local Cache Implementation - `src/open_deep_research/cache.py`
- [ ] Create cache module using file-based or SQLite storage
- [ ] Implement cache key generation from input (product name/URL)
- [ ] Store assessment results with timestamps
- [ ] Implement cache retrieval with TTL checking
- [ ] Add cache invalidation functionality
- [ ] Ensure reproducibility (same input = same cached result within TTL)
- [ ] Add cache statistics (hit rate, size)

---

## Phase 3: High-Signal Source API Integrations

### 3.1 NVD (National Vulnerability Database) - PRIORITY
- [ ] Set up NVD API 2.0 client
- [ ] Implement authentication (API key recommended for higher rate limits)
- [ ] Create query functions for CVE lookup by CPE/vendor/product
- [ ] Add rate limiting (5 requests/30 seconds without key, 50/30s with key)
- [ ] Add response caching (CVE data relatively static)
- [ ] Calculate CVE trends (count CVEs by year)
- [ ] Label all data as "independent"

### 3.2 CISA KEV (Known Exploited Vulnerabilities) - PRIORITY
- [ ] Set up CISA KEV catalog client
- [ ] Download and parse KEV JSON catalog
- [ ] Cross-reference product CVEs with KEV list
- [ ] Flag actively exploited vulnerabilities
- [ ] Label all data as "independent"

### 3.3 Web Scraping for Vendor Pages - PRIORITY
- [ ] Implement intelligent web scraper
- [ ] Find vendor security/PSIRT pages (common patterns: /security, /psirt, /trust)
- [ ] Extract security contact information
- [ ] Find and parse security advisories
- [ ] Locate ToS and DPA pages (common patterns: /terms, /privacy, /dpa)
- [ ] Extract compliance claims (SOC2, ISO mentions)
- [ ] Label all scraped vendor data as "vendor-stated"
- [ ] Handle rate limiting and robots.txt

### 3.4 HaveIBeenPwned - PRIORITY
- [ ] Set up HIBP API client
- [ ] Implement domain breach lookup
- [ ] Handle API rate limits (rate limiting is strict)
- [ ] Label data as "independent"
- [ ] Extract breach dates, data types compromised

### 3.5 CERT and Advisory Databases
- [ ] Integrate with US-CERT advisories
- [ ] Check vendor-specific CERTs if applicable
- [ ] Search for product-specific security advisories
- [ ] Label as "independent"

### 3.6 Compliance Verification Services (Optional/Manual)
- [ ] Research free SOC2 verification sources
- [ ] Check ISO certificate registries
- [ ] Distinguish "claimed" vs "verified" certifications
- [ ] Note: Many require manual verification or paid access

### 3.7 Alternative Product Database
- [ ] Create or integrate alternative product database
- [ ] Map categories to safer alternatives
- [ ] Include rationale for each alternative (better security, more transparent, etc.)
- [ ] Keep database updated

---

## Phase 4: Demo Examples and Validation

### 4.1 Real-World Demo Examples - CRITICAL FOR HACKATHON
- [ ] Example 1: Well-known file sharing (e.g., Dropbox, Box)
  - Should have abundant data, high confidence
  - Multiple CVEs, clear compliance info
- [ ] Example 2: GenAI tool (e.g., ChatGPT, Claude)
  - Emerging category, some data available
  - Focus on data handling and privacy
- [ ] Example 3: Enterprise SaaS (e.g., Salesforce, Slack)
  - Established vendor, good security posture
  - High trust score expected
- [ ] Save outputs in `examples/ciso_briefs/` for demo presentation

### 4.2 Quick Validation Checks
- [ ] Manual spot-check: Verify citations are real URLs
- [ ] Manual spot-check: Ensure source labels are correct (vendor-stated vs independent)
- [ ] Test edge case: Product with no data returns "Insufficient public evidence"
- [ ] Test edge case: Invalid input (bad URL, nonsense name) fails gracefully

---

## Phase 5: CLI and Deliverables

### 5.1 CLI Implementation - `src/ciso_cli.py`
- [ ] Create command-line interface
- [ ] Accept input flags:
  - `--product` or `-p` for product name
  - `--vendor` or `-v` for vendor name
  - `--url` or `-u` for URL
  - `--sha1` or `-s` for SHA1 hash
  - `--output` or `-o` for output format (json/markdown/text)
  - `--cache` flag to use cached results
  - `--no-cache` flag to force fresh assessment
- [ ] Auto-detect input type if no flag specified (smart detection)
- [ ] Display progress indicators during assessment
- [ ] Output formatted CISO brief
- [ ] Save results to file if requested
- [ ] Handle errors gracefully

### 5.2 Output Formatting
- [ ] Implement JSON output (structured CISOBrief model)
- [ ] Implement Markdown output (CISO-friendly format):
  - Executive summary at top
  - Trust/Risk scores prominently displayed
  - Sections for each assessment area
  - Citations inline and at bottom
  - Clear labels for vendor-stated vs independent
  - Highlight "Insufficient public evidence" areas
- [ ] Implement plain text output (CLI-friendly)
- [ ] Add color coding for risk levels (if terminal supports)

### 5.3 Web UI (Stretch Goal - If Time Permits)
- [ ] Simple single-page interface
- [ ] Input form (product name/URL)
- [ ] Display CISO brief in readable format
- [ ] Visual indicators for scores (color-coded risk levels)
- [ ] Note: Only attempt if Day 1-2 goals complete early

---

## Phase 6: Polish for Hackathon Demo

### 6.1 Minimal README - `README.md`
- [ ] Quick start guide (installation + first run)
- [ ] Required API keys (Google, NVD)
- [ ] CLI usage example (1-2 commands)
- [ ] Example output screenshot or markdown

### 6.2 Environment Setup
- [ ] Create `.env.example` with required keys:
  - GOOGLE_API_KEY (required)
  - NVD_API_KEY (recommended for better rate limits)
  - TAVILY_API_KEY (optional)
- [ ] Add one-line setup instructions

### 6.3 Basic Error Handling
- [ ] Graceful degradation if API fails (continue with other sources)
- [ ] Basic retry logic for rate limits (exponential backoff)
- [ ] Handle "product not found" gracefully
- [ ] Handle malformed input (bad URLs, nonsense names)
- [ ] Continue assessment even if some sources fail

---

## Risks and Considerations

### Gemini-Specific Limitations
- **Token Limits**: Gemini 2.5 Pro/Flash has 1M input tokens and 65,536 output tokens
- **Rate Limits**: Google API has rate limits (15 RPM for free tier, higher for paid)
- **Native Search**: Gemini 2.5 supports Search grounding (can be used for finding vendor pages)
- **Structured Output**: Gemini 2.5 fully supports structured outputs
- **Knowledge Cutoff**: January 2025 for Gemini 2.5 models

### Security API Considerations
- **NVD Rate Limits**: Very strict (5 requests per 30 seconds without API key, 50 with key)
  - Solution: Use API key, implement caching, batch requests
- **CISA KEV**: Free JSON catalog, no API key needed, download and parse locally
- **HaveIBeenPwned**: Rate limited, some features require paid API
  - Solution: Cache aggressively, use free tier for basic breach checks
- **Web Scraping**: Respect robots.txt, implement polite crawling
  - Solution: Rate limit requests, cache vendor pages, handle 403/404 gracefully
- **Data Freshness**: CVE data may have delays (hours to days)
  - Solution: Document assessment timestamp, note data may be stale
- **Coverage**: Not all software will have CVE data or public security info
  - Solution: Return "Insufficient public evidence" instead of hallucinating

### Hallucination Prevention Challenges
- **LLMs tend to fill gaps**: Model may invent plausible-sounding security claims
  - Solution: Strict prompting to only use tool outputs, require citations
- **Distinguishing vendor claims from independent sources**: Critical for trust
  - Solution: Label every piece of data at collection time
- **Confidence calibration**: Model may be overconfident
  - Solution: Base confidence on data availability, not model certainty

### Alternative Approaches if Issues Arise
- **If Gemini struggles with structured output**: Use JSON mode, add validation, retry with corrections
- **If API costs too high**: Prioritize free APIs (NVD with key, CISA KEV, basic HIBP, web scraping)
- **If rate limits are severe**: Implement aggressive caching (24-48 hour TTL), queue requests
- **If scraping is unreliable**: Focus on APIs first, use scraping as fallback
- **If CVE coverage is poor**: Supplement with other security signals (incidents, compliance)

---

## Hackathon Implementation Strategy

### Critical Success Factors for Demo
1. **Working End-to-End**: User inputs product name, gets CISO brief
2. **Hallucination Prevention**: Label sources, return "Insufficient public evidence" when needed
3. **Citation Quality**: Show verifiable URLs for all claims
4. **Impressive Output**: Professional-looking CISO brief that judges can understand
5. **Demo-Ready Examples**: 2-3 pre-run examples showing different scenarios

### Hackathon Development Approach
1. **MVP First**: Get basic flow working, then add sources incrementally
2. **Demo Over Perfect**: Focus on impressive output format over comprehensive coverage
3. **Pre-cache Demo Data**: Run demo examples beforehand to avoid live API failures
4. **Source Quality Over Quantity**: 3-4 reliable sources is better than 10 flaky ones
5. **Fail Visibly**: Show "Insufficient public evidence" prominently (judges appreciate honesty)

---

## Hackathon Timeline (2-3 Days)

### Day 1: Core Foundation (8-10 hours)
**Morning (4-5 hours)**
1. Remove non-Gemini providers (Phase 1) - 2 hours
2. Create security state models (Phase 2.4) - 2 hours

**Afternoon (4-5 hours)**
3. Implement NVD + CISA KEV tool (Phase 2.1.3) - 3 hours
4. Create basic CISO assessor graph (Phase 2.5) - 2 hours

**End of Day Goal**: Can query NVD for a product and get CVE data

### Day 2: High-Signal Sources + Output (8-10 hours)
**Morning (4-5 hours)**
1. Implement vendor page scraping (Phase 2.1.2 + 3.3) - 3 hours
2. Implement HIBP integration (Phase 2.1.6 + 3.4) - 2 hours

**Afternoon (4-5 hours)**
3. Implement scoring logic (trust/risk/confidence) - 2 hours
4. Create CISO prompts (Phase 2.3) - 2 hours
5. Build CLI (Phase 5.1) - 1 hour

**End of Day Goal**: Can generate complete CISO brief from CLI

### Day 3: Polish + Demo Prep (6-8 hours)
**Morning (3-4 hours)**
1. Implement output formatting (Phase 5.2) - 2 hours
2. Add basic cache (Phase 2.7) - 1 hour
3. Error handling (Phase 6.3) - 1 hour

**Afternoon (3-4 hours)**
4. Run and save demo examples (Phase 4.1) - 2 hours
5. Create README with screenshots (Phase 6.1) - 1 hour
6. Practice demo presentation - 1 hour

**End of Day Goal**: Polished demo ready to present

---

## Hackathon Progress Tracking

**Day 1 - Foundation**: [ ] Not Started
- [ ] Phase 1: Remove non-Gemini providers
- [ ] Phase 2.4: State models
- [ ] Phase 2.1.3: NVD/CISA KEV tool
- [ ] Phase 2.5: Basic assessor graph

**Day 2 - Integration**: [ ] Not Started
- [ ] Phase 2.1.2: Vendor page scraping
- [ ] Phase 2.1.6: HIBP integration
- [ ] Scoring logic + CISO prompts
- [ ] Phase 5.1: CLI

**Day 3 - Demo Ready**: [ ] Not Started
- [ ] Phase 5.2: Output formatting
- [ ] Phase 2.7: Basic cache
- [ ] Phase 6.3: Error handling
- [ ] Phase 4.1: Demo examples
- [ ] Phase 6.1: README + screenshots

---

## Notes and Decisions

- Using Gemini 2.5 Pro for main assessment (1M input context, 65K output, thinking capability, knowledge cutoff Jan 2025)
- Using Gemini 2.5 Flash for summarization and classification (faster, cheaper, same capabilities)
- Model codes: `gemini-2.5-pro` and `gemini-2.5-flash`
- Can leverage native Search grounding feature for finding vendor pages
- Cache TTL: 24 hours for security data (balance freshness vs rate limits)
- Priority order for sources: NVD/CISA KEV > HIBP > Vendor pages > Everything else
- If a source fails, continue with partial data rather than failing entire assessment
- Taxonomy categories to support initially: File sharing, GenAI tool, SaaS CRM, Endpoint agent, 
  Browser extension, Communication platform, Development tool, Security tool, Other
- Alternative suggestions: Maintain curated list per category, expand over time

