# High-Signal Security Sources for CISO Assessment

This document outlines the comprehensive list of sources the CISO Assessment Tool will query to generate security trust briefs. Sources are categorized by signal type and labeled as either "independent" (third-party verified) or "vendor-stated" (self-reported).

## Source Priority Levels

**Tier 1 (Critical)** - Must query for every assessment
**Tier 2 (High Priority)** - Query when relevant/available
**Tier 3 (Supplemental)** - Optional, adds depth

---

## 1. Vulnerability Databases (INDEPENDENT - Tier 1)

### NVD (National Vulnerability Database)
- **URL**: https://nvd.nist.gov/
- **API**: NVD API 2.0
- **API Docs**: https://nvd.nist.gov/developers/vulnerabilities
- **Rate Limits**: 5 requests/30s (no key), 50 requests/30s (with API key)
- **Data Retrieved**:
  - CVE IDs associated with product/vendor
  - CVSS scores (severity ratings)
  - Vulnerability descriptions
  - Publication dates
  - Patch/remediation status
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free (API key recommended)

### CISA KEV (Known Exploited Vulnerabilities)
- **URL**: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- **API**: Direct JSON download
- **Endpoint**: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
- **Rate Limits**: None (static file)
- **Data Retrieved**:
  - CVEs with active exploitation in the wild
  - Date added to KEV
  - Required action/remediation
  - Due dates for patching
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free

### CVE Details
- **URL**: https://www.cvedetails.com/
- **API**: Limited (scraping may be needed)
- **Data Retrieved**:
  - CVE statistics and trends
  - Vendor vulnerability history
  - Product vulnerability counts
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free

---

## 2. Breach and Incident Databases (INDEPENDENT - Tier 1)

### HaveIBeenPwned (HIBP)
- **URL**: https://haveibeenpwned.com/
- **API**: Domain Breach Search API
- **API Docs**: https://haveibeenpwned.com/API/v3
- **Rate Limits**: 1 request/1.5s (free), higher with paid API key
- **Data Retrieved**:
  - Breaches associated with domain
  - Breach dates
  - Types of data compromised (emails, passwords, etc.)
  - Number of accounts affected
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free for domain search, paid for additional features

### DataBreaches.net
- **URL**: https://databreaches.net/
- **API**: None (scraping or manual search)
- **Data Retrieved**:
  - Detailed breach reports
  - Timeline of incidents
  - Response by vendor
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

### Privacy Rights Clearinghouse Data Breaches
- **URL**: https://privacyrights.org/data-breaches
- **API**: CSV download available
- **Data Retrieved**:
  - Breach incidents database
  - Organization names
  - Types of breach
  - Records affected
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

---

## 3. Security Advisories and CERTs (INDEPENDENT - Tier 1)

### US-CERT (Cybersecurity and Infrastructure Security Agency)
- **URL**: https://www.cisa.gov/cybersecurity-advisories
- **API**: RSS feeds available
- **Data Retrieved**:
  - Security advisories for products
  - Vulnerability alerts
  - Recommended actions
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free

### CERT/CC (Carnegie Mellon)
- **URL**: https://www.kb.cert.org/vuls/
- **API**: Limited
- **Data Retrieved**:
  - Vulnerability notes
  - Vendor responses
  - Coordinated disclosures
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

### GitHub Security Advisories
- **URL**: https://github.com/advisories
- **API**: GitHub GraphQL API
- **API Docs**: https://docs.github.com/en/graphql/reference/objects#securityadvisory
- **Data Retrieved**:
  - Open source software vulnerabilities
  - Package-specific CVEs
  - Patched versions
- **Source Label**: Independent
- **Cache TTL**: 24 hours
- **Cost**: Free with GitHub account

---

## 4. Vendor Security Pages (VENDOR-STATED - Tier 1)

### Vendor Security/PSIRT Pages
Common URL patterns to search:
- `{domain}/security`
- `{domain}/psirt`
- `{domain}/trust`
- `{domain}/security-center`
- `{domain}/responsible-disclosure`
- `{domain}/vulnerability-disclosure`
- `{domain}/bug-bounty`

**Data Retrieved**:
- Security contact information
- Responsible disclosure policy
- Bug bounty program details
- Security advisories from vendor
- Security features claimed
- Encryption methods claimed

**Source Label**: Vendor-stated

**Implementation**: Web scraping with BeautifulSoup/Scrapy
- Respect robots.txt
- Rate limit: 1 request/second per domain
- Cache TTL: 24 hours

---

## 5. Compliance and Certifications (MIXED - Tier 1)

### SOC2 Reports
- **Search Methods**:
  - Vendor website (`{domain}/compliance`, `{domain}/certifications`)
  - SOC2 registry services (limited free access)
  - Direct vendor security page
- **Data Retrieved**:
  - SOC2 Type I or Type II status
  - Audit date and auditor
  - Scope of audit
- **Source Label**: Vendor-stated (unless independently verified)
- **Cache TTL**: 30 days

### ISO Certifications
- **Sources**:
  - ISO 27001: https://www.iso.org/isoiec-27001-information-security.html
  - Vendor security pages
  - Certification body registries (e.g., BSI, ANAB)
- **Certifications to check**:
  - ISO 27001 (Information Security Management)
  - ISO 27017 (Cloud Security)
  - ISO 27018 (Cloud Privacy)
  - ISO 27701 (Privacy Management)
- **Data Retrieved**:
  - Certification status
  - Certification date and expiry
  - Certifying body
  - Scope of certification
- **Source Label**: Vendor-stated unless verified through certification body
- **Cache TTL**: 30 days

### FedRAMP (for US government use)
- **URL**: https://marketplace.fedramp.gov/
- **API**: FedRAMP Marketplace API
- **Data Retrieved**:
  - FedRAMP authorization status
  - Impact level (Low/Moderate/High)
  - Authorization date
- **Source Label**: Independent (government verified)
- **Cache TTL**: 30 days
- **Cost**: Free

### PCI DSS Compliance
- **Sources**: Vendor security pages
- **Data Retrieved**:
  - PCI DSS compliance status
  - Level (1-4)
  - AOC (Attestation of Compliance) availability
- **Source Label**: Vendor-stated
- **Cache TTL**: 30 days

---

## 6. Legal and Policy Documents (VENDOR-STATED - Tier 1)

### Terms of Service (ToS)
Common URL patterns:
- `{domain}/terms`
- `{domain}/terms-of-service`
- `{domain}/legal/terms`
- `{domain}/tos`

**Data Retrieved**:
- Service usage terms
- Data ownership clauses
- Liability limitations
- Termination conditions

**Source Label**: Vendor-stated

### Privacy Policy
Common URL patterns:
- `{domain}/privacy`
- `{domain}/privacy-policy`
- `{domain}/legal/privacy`

**Data Retrieved**:
- Data collection practices
- Data sharing with third parties
- Data retention periods
- User rights (access, deletion, portability)
- GDPR/CCPA compliance statements

**Source Label**: Vendor-stated

### Data Processing Agreement (DPA)
Common URL patterns:
- `{domain}/dpa`
- `{domain}/data-processing-agreement`
- `{domain}/legal/dpa`
- `{domain}/gdpr`

**Data Retrieved**:
- Data processor obligations
- Subprocessor list
- Data transfer mechanisms (SCCs, etc.)
- Security measures committed
- Breach notification procedures

**Source Label**: Vendor-stated

### Cookie Policy
- Data Retrieved: Tracking and analytics practices
- Source Label: Vendor-stated

---

## 7. Reputation and Threat Intelligence (INDEPENDENT - Tier 2)

### VirusTotal
- **URL**: https://www.virustotal.com/
- **API**: VirusTotal API v3
- **API Docs**: https://docs.virustotal.com/
- **Rate Limits**: 4 requests/minute (free), higher with paid
- **Data Retrieved**:
  - **File hash lookup** (SHA1/SHA256/MD5): Malware detections, file reputation, vendor results
  - **URL/domain reputation**: Malicious URL detection
  - Community votes and comments
  - Detected threats and threat categories
  - First/last submission dates
  - Behavioral analysis results
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free tier available, paid for higher limits
- **Note**: Critical for SHA1 hash input - can identify software from file hash

### URLhaus (Abuse.ch)
- **URL**: https://urlhaus.abuse.ch/
- **API**: URLhaus API
- **Data Retrieved**:
  - Malware distribution URLs
  - Malicious payload associations
  - Domain reputation
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

### AlienVault OTX (Open Threat Exchange)
- **URL**: https://otx.alienvault.com/
- **API**: OTX API
- **API Docs**: https://otx.alienvault.com/api
- **Data Retrieved**:
  - Threat indicators for domains/IPs
  - Malware associations
  - Threat pulse subscriptions
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

### MalwareBazaar (Abuse.ch)
- **URL**: https://bazaar.abuse.ch/
- **API**: MalwareBazaar API
- **API Docs**: https://bazaar.abuse.ch/api/
- **Data Retrieved**:
  - File hash (SHA1/SHA256/MD5) malware identification
  - Malware family/signature
  - File type and tags
  - First seen date
  - Yara rule matches
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free

### Hybrid Analysis
- **URL**: https://www.hybrid-analysis.com/
- **API**: Hybrid Analysis API (requires registration)
- **Data Retrieved**:
  - File hash sandbox analysis
  - Behavioral indicators
  - Network connections
  - File operations
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Free tier available

### Shodan
- **URL**: https://www.shodan.io/
- **API**: Shodan API
- **Data Retrieved**:
  - Exposed services and ports
  - Misconfigured servers
  - SSL/TLS certificate info
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Paid (API key required)

---

## 8. Company and Vendor Information (MIXED - Tier 2)

### Crunchbase
- **URL**: https://www.crunchbase.com/
- **API**: Crunchbase API (paid)
- **Data Retrieved**:
  - Company founding date
  - Funding rounds
  - Headquarters location
  - Employee count
  - Acquisitions
- **Source Label**: Independent
- **Cache TTL**: 30 days
- **Cost**: Paid API

### WHOIS/Domain Information
- **Sources**: WHOIS databases, ICANN lookup
- **Data Retrieved**:
  - Domain registration date
  - Registrar information
  - Domain owner (if not private)
- **Source Label**: Independent
- **Cache TTL**: 30 days
- **Cost**: Free

### LinkedIn Company Pages
- **URL**: https://www.linkedin.com/
- **Data Retrieved**:
  - Company size
  - Industry classification
  - Founded date
  - Locations
- **Source Label**: Mixed (company-stated but LinkedIn verified)
- **Cache TTL**: 30 days
- **Implementation**: Web scraping or API if available

---

## 9. Security Scoring Services (INDEPENDENT - Tier 2)

### SecurityScorecard
- **URL**: https://securityscorecard.com/
- **API**: SecurityScorecard API (paid)
- **Data Retrieved**:
  - Overall security rating (A-F)
  - Factor scores (network security, patching cadence, etc.)
  - IP reputation
  - Breach history
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Paid (may have limited free tier)

### BitSight
- **URL**: https://www.bitsight.com/
- **API**: BitSight API (paid)
- **Data Retrieved**:
  - Security ratings
  - Risk vectors
  - Comparative peer analysis
- **Source Label**: Independent
- **Cache TTL**: 7 days
- **Cost**: Paid

---

## 10. App Store and Browser Extension Reviews (MIXED - Tier 3)

### Chrome Web Store (for browser extensions)
- **URL**: https://chrome.google.com/webstore/
- **Data Retrieved**:
  - User ratings and reviews
  - Permission requests
  - Installation count
  - Last updated date
  - Developer information
- **Source Label**: Mixed (user feedback + Google verification)
- **Cache TTL**: 7 days

### Apple App Store
- **API**: App Store Connect API
- **Data Retrieved**:
  - App ratings and reviews
  - Privacy labels (iOS 14+)
  - Age rating
  - Developer information
- **Source Label**: Mixed
- **Cache TTL**: 7 days

### Google Play Store
- **Data Retrieved**:
  - App ratings
  - Data safety declarations
  - Permissions
  - Developer contact
- **Source Label**: Mixed
- **Cache TTL**: 7 days

---

## 11. News and Media (INDEPENDENT - Tier 3)

### Security News Outlets
- **TechCrunch**: https://techcrunch.com/
- **The Hacker News**: https://thehackernews.com/
- **Krebs on Security**: https://krebsonsecurity.com/
- **BleepingComputer**: https://www.bleepingcomputer.com/
- **Dark Reading**: https://www.darkreading.com/

**Data Retrieved**:
- Security incidents reported in media
- Vendor responses to breaches
- Industry reputation signals

**Source Label**: Independent

**Implementation**: RSS feeds, web scraping, or Google News API search for `"{product_name}" security breach`

**Cache TTL**: 7 days

---

## 12. Open Source Intelligence (OSINT) (INDEPENDENT - Tier 3)

### Reddit Security Communities
- r/netsec
- r/cybersecurity
- r/sysadmin
- Product-specific subreddits

**Data Retrieved**: User reports, discussions of issues, sentiment

**Source Label**: Independent (community opinion)

### Twitter/X Security Community
- Search for product name + security keywords
- Monitor security researcher accounts

**Source Label**: Independent

### Stack Overflow / GitHub Issues
- **Data Retrieved**:
  - Security-related issues
  - Bug reports
  - Community discussions of vulnerabilities

**Source Label**: Independent (user-reported)

---

## 13. Alternative Product Databases (INDEPENDENT - Tier 2)

### G2
- **URL**: https://www.g2.com/
- **Data Retrieved**:
  - Alternative products in same category
  - User ratings and reviews
  - Feature comparisons

**Source Label**: Mixed (user reviews + vendor claims)

### Capterra
- **URL**: https://www.capterra.com/
- **Data Retrieved**: Similar to G2

### AlternativeTo
- **URL**: https://alternativeto.net/
- **Data Retrieved**:
  - Alternative software suggestions
  - Community recommendations
  - Platform support

---

## Implementation Priority

### Phase 1: Core Sources (Must Have)
1. NVD (CVE database)
2. CISA KEV
3. **VirusTotal** (essential for SHA1 hash resolution and file reputation)
4. Vendor security page scraping
5. ToS/Privacy Policy/DPA scraping
6. HaveIBeenPwned

### Phase 2: Enhanced Sources
7. MalwareBazaar (for additional SHA1 malware checks)
8. US-CERT advisories
9. ISO/SOC2 compliance checks
10. WHOIS/domain info
11. GitHub Security Advisories (for open source)

### Phase 3: Premium/Optional Sources
12. Hybrid Analysis (enhanced file analysis for SHA1)
13. SecurityScorecard/BitSight (if budget allows)
14. News/media scraping
15. App store data (for relevant products)

---

## Input Type Handling

The system accepts four types of input:

### 1. Product Name
Example: "Slack", "Microsoft Teams", "Zoom"
- Resolution: Web search to find official website and vendor
- Primary sources: Vendor pages, NVD (by product name)

### 2. Vendor Name
Example: "Salesforce", "Atlassian"
- Resolution: Find company website, then list products
- Primary sources: Company information databases

### 3. URL
Example: "https://slack.com", "https://zoom.us"
- Resolution: Extract domain, identify product/vendor
- Primary sources: WHOIS, vendor pages, domain reputation

### 4. SHA1 Hash
Example: "356a192b7913b04c54574d18c28d46e6395428ab"
- Resolution: File hash lookup to identify software/file
- Primary sources: **VirusTotal, MalwareBazaar, Hybrid Analysis**
- Use case: Verifying downloaded software, checking installers, malware analysis
- Output includes: File reputation, malware detections, identified software name

**Note**: SHA1 input type is particularly useful for:
- Verifying software installers before deployment
- Checking if a file hash is associated with known malware
- Identifying unknown binaries
- Cross-referencing with malware databases

## Source Labeling Rules

Every piece of data must be labeled at collection time:

1. **Independent**: Data from third-party verification, government databases, security researchers, breach databases, certification bodies (when directly verified), malware analysis platforms (VirusTotal, MalwareBazaar)

2. **Vendor-stated**: Data from vendor's own website, self-reported compliance, claimed certifications without independent verification, vendor security advisories

3. **Mixed**: User reviews, app store data (user + platform verification), LinkedIn company data

4. **Insufficient public evidence**: When no data is found from any source, explicitly state this rather than making assumptions

---

## API Keys Required

### Required (Free)
- Google API Key (for Gemini)
- NVD API Key (for better rate limits)
- VirusTotal API Key (FREE tier available - required for SHA1 hash lookups)

### Optional but Recommended
- Tavily API Key (for general web search)
- GitHub Personal Access Token (for security advisories)
- MalwareBazaar (no key required, but registration helpful)

### Paid (Optional)
- HaveIBeenPwned API Key (for enhanced features)
- VirusTotal Premium (for higher rate limits beyond free tier)
- Hybrid Analysis API Key (for enhanced file analysis)
- SecurityScorecard API Key (for security ratings)
- Crunchbase API Key (for company info)

---

## Rate Limiting Strategy

- NVD: 50 requests/30s with key, batch by vendor
- HIBP: 1 request/1.5s, sequential
- Web scraping: 1 request/second per domain, respect robots.txt
- CISA KEV: Download once per day, parse locally
- GitHub: 5,000 requests/hour with token

## Caching Strategy

- CVE data: 24 hours (relatively static)
- Breach data: 24 hours
- Compliance info: 30 days (changes infrequently)
- Vendor pages: 24 hours
- News/media: 7 days
- CISA KEV: 24 hours (updated daily by CISA)

---

## Error Handling

If a source fails:
1. Log the error
2. Continue with other sources
3. Note in final report: "Unable to retrieve [data type] from [source]"
4. Do not fabricate or estimate missing data
5. Include in "Insufficient public evidence" section if critical data is missing

