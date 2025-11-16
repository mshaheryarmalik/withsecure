# Backend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [API Layer](#api-layer)
6. [Orchestration Layer](#orchestration-layer)
7. [Tool Layer](#tool-layer)
8. [State Management](#state-management)
9. [Caching System](#caching-system)
10. [Error Handling](#error-handling)
11. [Deployment](#deployment)

---

## Overview

The CISO Security Assessment Tool backend is a Python-based microservice that provides automated security assessments for software products. The system processes minimal input (product name, URL, or SHA1 hash) and generates comprehensive security briefs through a four-phase assessment pipeline.

### Key Characteristics

- **Architecture Pattern**: Orchestration-based microservice with state machine workflow
- **Framework**: FastAPI for REST API, LangGraph for workflow orchestration
- **AI Model**: Google Gemini 2.5 Pro/Flash for analysis and classification
- **Data Sources**: 25+ external security databases and APIs
- **Response Format**: Server-Sent Events (SSE) for real-time progress streaming
- **Caching**: File-based cache with configurable TTL

---

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                    (Web Frontend / CLI)                         │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                      API Layer (FastAPI)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  /assess     │  │ /assess/     │  │   /health    │          │
│  │              │  │ stream       │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              │ State Graph Invocation
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│              Orchestration Layer (LangGraph)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Assessment State Machine                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Phase 1  │→ │ Phase 2  │→ │ Phase 3  │→ │ Phase 4  │  │  │
│  │  │ Entity   │  │ Classify │  │ Gather   │  │ Generate │  │  │
│  │  │ Resolve  │  │ Software │  │ Security │  │ Brief    │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              │ Tool Invocation
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                      Tool Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Entity       │  │ Vulnerability│  │ Vendor       │          │
│  │ Resolution   │  │ Tools        │  │ Compliance   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Threat Intel │  │ Incidents    │  │ Alternatives │          │
│  │ Tools        │  │ Tools        │  │ Tools        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              │ API Calls
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                  External Data Sources                         │
│  ┌──────────┐  ┌─────────-─┐  ┌──────────┐  ┌──────────┐       │
│  │   NVD    │  │ VirusTotal│  │  Tavily  │  │  GitHub  │       │
│  │   CVE    │  │           │  │  Search  │  │ Advisories│      │
│  └──────────┘  └──────────-┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Malware  │  │ URLhaus  │  │  OTX     │  │  Google  │        │
│  │ Bazaar   │  │          │  │          │  │  Gemini  │        | 
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────────────────────────────────────────┘
```

### Component Interaction Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /assess/stream
       │ {product: "Slack", version: null}
       ▼
┌─────────────────────────────────────┐
│         FastAPI App (app.py)        │
│  ┌─────────────────────────────-─┐  │
│  │  assessment_generator()       │  │
│  │  1. Check cache.get()         │  │
│  │  2. Create graph              │  │
│  │  3. graph.stream()            │  │
│  │  4. Yield SSE events          │  │
│  │  5. cache.set() on completion │  │
│  └───────────┬──────────────────-┘  │
└──────────────┼──────────────────────┘
               │
               │ graph.stream(initial_state)
               │ stream_mode="updates"
               ▼
┌─────────────────────────────────────┐
│   LangGraph Workflow                │
│   (create_ciso_assessor_graph)      │
│  ┌──────────────────────────────┐   │
│  │  Entry: resolve_entity       │   │
│  │  ↓                           │   │
│  │  Conditional: should_continue│   │
│  │  ├─ continue → classify      │   │
│  │  └─ end → END                │   │
│  │  ↓                           │   │
│  │  classify_software           │   │
│  │  ↓                           │   │
│  │  gather_security_data        │   │
│  │  ↓                           |   │
│  │  generate_ciso_brief         │   │
│  │  ↓                           │   │
│  │  END                         │   │
│  └───────────┬──────────────────┘   │
└──────────────┼──────────────────────┘
               │
               │ Node execution
               │ Updates state
               ▼
┌─────────────────────────────────────┐
│         Tool Functions              │
│  (src/security_research_agent/tools)│
│  ┌──────────────────────────────--┐ │
│  │  Entity:                       │ │
│  │  - resolve_entity_complete()   │ │
│  │                                │ │
│  │  Vulnerability:                │ │
│  │  - lookup_cves()               │ │
│  │  - check_cisa_kev()            │ │
│  │  - lookup_github_advisories()  │ │
│  │                                │ │
│  │  Compliance:                   │ │
│  │  - fetch_vendor_security_info()│ │
│  │  - fetch_terms_of_service()    │ │
│  │  - fetch_privacy_policy()      │ │
│  │  - fetch_dpa()                 │ │
│  │                                │ │
│  │  Threat Intel:                 │ │
│  │  - lookup_malwarebazaar()      │ │
│  │  - lookup_urlhaus()            │ │
│  │  - lookup_alienvault_otx()     │ │
│  │                                │ │
│  │  Incidents:                    │ │
│  │  - lookup_security_incidents() │ │
│  │                                │ │
│  │  ... (25+ tools total)         │ │
│  └───────────┬──────────────────--┘ │
└──────────────┼──────────────────────┘
               │
               │ HTTP/API calls
               │ Return Dict[str, Any]
               ▼
┌─────────────────────────────────────┐
│    External APIs & Databases        │
│  - NVD CVE Database                 │
│  - VirusTotal                       │
│  - Tavily Search                    │
│  - Google Gemini API                │
│  - GitHub Security Advisories       │
│  - MalwareBazaar                    │
│  - URLhaus                          │
│  - AlienVault OTX                   │
│  - ... (25+ sources)                │
└─────────────────────────────────────┘
```

---

## Component Architecture

### API Layer

The API layer is implemented using FastAPI and provides two primary endpoints:

#### Endpoints

**POST /assess/stream**
- **Purpose**: Streaming assessment with real-time progress updates
- **Response**: Server-Sent Events (SSE) stream
- **Events**: `phase`, `result`, `error`
- **Use Case**: Frontend integration requiring live progress updates

**POST /assess**
- **Purpose**: Non-streaming assessment
- **Response**: Complete assessment result (JSON)
- **Use Case**: CLI tools or batch processing

**GET /health**
- **Purpose**: Health check endpoint
- **Response**: Service status and timestamp

#### Request/Response Models

```python
class AssessmentRequest(BaseModel):
    product: Optional[str] = None
    vendor: Optional[str] = None
    url: Optional[str] = None
    sha1: Optional[str] = None
    version: Optional[str] = None
    no_cache: bool = False
    cache_ttl: int = 24

class AssessmentResponse(BaseModel):
    success: bool
    assessment: Optional[dict] = None
    error: Optional[str] = None
    timestamp: str
```

### Orchestration Layer

The orchestration layer uses LangGraph to implement a state machine workflow. The workflow consists of four sequential phases with conditional routing.


#### Phase Descriptions

**Phase 1: Entity Resolution**
- **Node**: `resolve_entity_node`
- **Purpose**: Identify canonical product and vendor information from minimal input
- **Input Types**: Product name, URL, or SHA1 hash
- **Output**: EntityResolution object with product_name, vendor_name, website, sha1_hash
- **Tools Used**: `resolve_entity_complete()`, VirusTotal API, Tavily Search

**Phase 2: Software Classification**
- **Node**: `classify_software_node`
- **Purpose**: Classify software into taxonomy categories
- **Input**: EntityResolution from Phase 1
- **Output**: SoftwareTaxonomy with primary and secondary categories
- **LLM Model**: Gemini 2.5 Flash
- **Taxonomy**: 868 Gartner software categories

**Phase 3: Security Data Gathering**
- **Node**: `gather_security_data_node`
- **Purpose**: Collect security data from multiple sources in parallel
- **Input**: EntityResolution, SoftwareTaxonomy
- **Output**: Aggregated security data (CVE, compliance, incidents, etc.)
- **Tools Used**: 15+ security tools executed in parallel
- **Data Sources**: NVD, CISA KEV, vendor pages, breach databases, threat intel feeds

**Phase 4: AI Analysis & Brief Generation**
- **Node**: `generate_ciso_brief_node`
- **Purpose**: Synthesize all data into CISO-ready security brief
- **Input**: All aggregated data from previous phases
- **Output**: CISOBrief with trust/risk scores, rationale, citations
- **LLM Model**: Gemini 2.5 Pro
- **Components**: Risk scoring, alternative extraction, citation building, brief assembly

### Tool Layer

The tool layer consists of 25+ specialized functions organized by category. Each tool is a standalone function that queries external APIs or databases.

#### Tool Categories

**Entity Resolution Tools**
- `resolve_entity()`: Basic entity resolution
- `resolve_entity_complete()`: Comprehensive entity resolution with field completion
- `detect_input_type()`: Detect input type (name/URL/SHA1)
- `lookup_latest_version()`: Version detection and lookup

**Vulnerability Tools**
- `lookup_cves()`: Query NVD for CVE data
- `check_cisa_kev()`: Check CISA Known Exploited Vulnerabilities
- `lookup_github_advisories()`: GitHub Security Advisories

**Vendor Compliance Tools**
- `fetch_vendor_security_info()`: Vendor security pages and PSIRT
- `fetch_terms_of_service()`: Terms of Service extraction
- `fetch_privacy_policy()`: Privacy policy extraction
- `fetch_dpa()`: Data Processing Agreement extraction
- `check_fedramp()`: FedRAMP compliance check

**Threat Intelligence Tools**
- `lookup_malwarebazaar()`: MalwareBazaar database
- `lookup_urlhaus()`: URLhaus malicious URL database
- `lookup_alienvault_otx()`: AlienVault OTX threat intel

**Incident Tools**
- `lookup_security_incidents()`: Security incident databases
- `search_databreaches_net()`: Data breach database

**Advisory Tools**
- `search_us_cert_advisories()`: US-CERT advisories
- `search_cert_cc_advisories()`: CERT-CC advisories

**Company Information Tools**
- `lookup_whois()`: WHOIS domain information
- `search_company_info()`: Company data lookup

**Community Tools**
- `search_reddit_security()`: Reddit security discussions
- `search_github_issues()`: GitHub issue search
- `search_stackoverflow()`: Stack Overflow search

**Alternative Tools**
- `search_alternatives()`: Alternative product search
- `search_app_store_info()`: App store information

**News Tools**
- `search_security_news()`: Security news search

#### Tool Execution Pattern

All tools follow a consistent pattern:

```python
def tool_function(params) -> Dict[str, Any]:
    """
    Tool description.
    
    Returns:
        Dictionary with tool results and metadata
    """
    try:
        # Tool implementation
        result = perform_operation(params)
        return {
            "success": True,
            "data": result,
            "source": "source_name",
            "citation": "citation_url"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }
```

---

## Data Flow

### Data Flow Diagram

The following diagram illustrates the data flow through the assessment pipeline:


### Assessment Request Flow

```
1. Client Request
   │
   ├─> POST /assess/stream
   │   └─> AssessmentRequest
   │
2. API Layer Processing
   │
   ├─> Check Cache
   │   ├─> Cache Hit → Return Cached Result
   │   └─> Cache Miss → Continue
   │
3. Graph Initialization
   │
   ├─> Create AssessmentState
   │   ├─> input_text: "Slack"
   │   ├─> product_version: None
   │   └─> messages: [HumanMessage(...)]
   │
4. Phase 1: Entity Resolution
   │
   ├─> resolve_entity_node()
   │   ├─> Call resolve_entity_complete()
   │   ├─> Query VirusTotal (if SHA1)
   │   ├─> Query Tavily Search (if URL/name)
   │   └─> Update state.entity
   │
5. Phase 2: Software Classification
   │
   ├─> classify_software_node()
   │   ├─> Initialize Gemini 2.5 Flash
   │   ├─> LLM Classification
   │   ├─> Match against 868 categories
   │   └─> Update state.taxonomy
   │
6. Phase 3: Security Data Gathering
   │
   ├─> gather_security_data_node()
   │   ├─> Parallel Execution:
   │   │   ├─> lookup_cves()
   │   │   ├─> fetch_vendor_security_info()
   │   │   ├─> lookup_security_incidents()
   │   │   ├─> fetch_terms_of_service()
   │   │   ├─> fetch_privacy_policy()
   │   │   ├─> lookup_github_advisories()
   │   │   ├─> check_cisa_kev()
   │   │   ├─> lookup_malwarebazaar()
   │   │   ├─> lookup_urlhaus()
   │   │   ├─> lookup_alienvault_otx()
   │   │   ├─> search_security_news()
   │   │   ├─> search_us_cert_advisories()
   │   │   ├─> lookup_whois()
   │   │   ├─> search_company_info()
   │   │   └─> search_alternatives()
   │   └─> Aggregate into state.cve_data, state.vendor_data, 
   │       state.incident_data, state.additional_data
   │
7. Phase 4: AI Analysis & Brief Generation
   │
   ├─> generate_ciso_brief_node()
   │   ├─> Initialize Gemini 2.5 Pro
   │   ├─> Calculate Trust/Risk Scores
   │   ├─> Extract Alternatives
   │   ├─> Parse Compliance Data
   │   ├─> Build Citations
   │   ├─> Assemble CISOBrief
   │   └─> Update state.ciso_brief
   │
8. Cache & Response
   │
   ├─> Cache Result (if enabled)
   └─> Stream Final Result to Client
```

### State Transformation Diagram

```
Initial State
┌─────────────────────────────┐
│ input_text: "Slack"         │
│ product_version: None       │
│ entity: None                │
│ taxonomy: None              │
│ cve_data: None              │
│ vendor_data: None           │
│ incident_data: None         │
│ additional_data: None       │
│ ciso_brief: None            │
└─────────────────────────────┘
         │
         │ Phase 1
         ▼
┌─────────────────────────────┐
│ entity: {                   │
│   product_name: "Slack"     │
│   vendor_name: "Slack Tech" │
│   website: "slack.com"      │
│   ...                       │
│ }                           │
└─────────────────────────────┘
         │
         │ Phase 2
         ▼
┌─────────────────────────────-┐
│ taxonomy: {                  │
│   primary_category:          │
│     "Communication platform" │
│   secondary_categories: [...]│
│ }                            │
└─────────────────────────────-┘
         │
         │ Phase 3
         ▼
┌─────────────────────────────┐
│ cve_data: {                 │
│   total_cves: 60            │
│   critical_count: 1         │
│   ...                       │
│ }                           │
│ vendor_data: {...}          │
│ incident_data: {...}        │
│ additional_data: {...}      │
└─────────────────────────────┘
         │
         │ Phase 4
         ▼
┌─────────────────────────────-┐
│ ciso_brief: {                │
│   entity: EntityResolution   │
│   taxonomy: SoftwareTaxonomy │
│   trust_score: 65            │
│   risk_score: 45             │
│   rationale: "..."           │
│   citations: [...]           │
│   safer_alternatives: [...]  │
│   ...                        │
│ }                            │
└─────────────────────────────-┘
```

---

## State Management

### AssessmentState Model

The `AssessmentState` class is a Pydantic model that maintains the complete state throughout the assessment workflow.

```python
class AssessmentState(BaseModel):
    # Input
    input_text: str
    product_version: Optional[str] = None
    
    # Intermediate results
    entity: Optional[Dict[str, Any]] = None
    taxonomy: Optional[Dict[str, Any]] = None
    cve_data: Optional[Dict[str, Any]] = None
    vendor_data: Optional[Dict[str, Any]] = None
    incident_data: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None
    
    # Final output
    ciso_brief: Optional[CISOBrief] = None
    
    # Messages for LLM interaction
    messages: List[BaseMessage] = Field(default_factory=list)
    
    # Error tracking
    errors: List[str] = Field(default_factory=list)
    
    # Status tracking for real-time updates
    status_messages: List[str] = Field(default_factory=list)
    current_step: str = Field(default="")
```

### State Persistence

State is maintained in memory during graph execution. Each node receives the current state, processes it, and returns updates that are merged into the state by LangGraph.

### State Validation

Pydantic models provide automatic validation:
- Type checking
- Required field validation
- Default value assignment
- Serialization/deserialization

---

## Caching System

### Cache Architecture

The caching system uses a file-based cache with configurable TTL.

```
┌─────────────────────────────────────┐
│      AssessmentCache                │
│  ┌──────────────────────────────┐   │
│  │ Cache Directory Structure    │   │
│  │ .cache/assessments/          │   │
│  │   ├─ {hash1}.json            │   │
│  │   ├─ {hash2}.json            │   │
│  │   └─ ...                     │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Cache Key Generation

Cache keys are generated using SHA256 hashing of normalized input:

```python
def _get_cache_key(input_text: str) -> str:
    normalized = input_text.strip().lower()
    return hashlib.sha256(normalized.encode()).hexdigest()
```

### Cache Entry Structure

```json
{
  "cached_at": "2025-01-15T10:30:00",
  "input_text": "Slack",
  "brief": {
    "entity": {...},
    "taxonomy": {...},
    "trust_score": 65,
    "risk_score": 45,
    ...
  }
}
```

### Cache Operations

**Get Operation**
1. Generate cache key from input
2. Check if cache file exists
3. Validate TTL (delete if expired)
4. Deserialize CISOBrief from JSON
5. Return cached brief or None

**Set Operation**
1. Generate cache key from input
2. Serialize CISOBrief to JSON
3. Add metadata (cached_at, input_text)
4. Write to cache file

**Clear Operation**
- Delete all cache files in cache directory
- Return count of deleted files

**Stats Operation**
- Count total, valid, and expired cache entries
- Calculate total cache size
- Return statistics dictionary

### Cache Configuration

- **Default TTL**: 24 hours
- **Cache Directory**: `backend/.cache/assessments`
- **File Format**: JSON
- **Naming**: SHA256 hash of normalized input

---

## Error Handling

### Error Handling Strategy

The system implements multi-level error handling:

1. **Tool Level**: Each tool catches exceptions and returns error information
2. **Node Level**: Each graph node catches exceptions and updates state.errors
3. **API Level**: API layer catches exceptions and returns HTTP 500

### Error Propagation

```
Tool Exception
    │
    ▼
Tool returns {success: False, error: "..."}
    │
    ▼
Node catches and adds to state.errors
    │
    ▼
Graph continues (graceful degradation)
    │
    ▼
API returns error in response or SSE stream
```

### Error Types

**Entity Resolution Errors**
- Insufficient data to resolve entity
- Invalid input format
- External API failures

**Classification Errors**
- LLM API failures
- Invalid taxonomy match
- Timeout errors

**Data Gathering Errors**
- External API rate limits
- Network timeouts
- Invalid response formats

**Brief Generation Errors**
- LLM API failures
- Data serialization errors
- Missing required fields

### Error Recovery

- **Graceful Degradation**: System continues with available data
- **Partial Results**: Return assessment with confidence level indicating data gaps
- **Error Logging**: All errors logged to debug log files
- **User Notification**: Errors included in status_messages for real-time display

---

## Deployment

### Environment Requirements

**Python Version**: >= 3.10

**Key Dependencies**:
- FastAPI >= 0.115.0
- Uvicorn >= 0.32.0
- LangGraph >= 0.5.4
- LangChain Community >= 0.3.9
- LangChain Google GenAI >= 2.1.5

**Environment Variables**:
- `GOOGLE_API_KEY`: Google Gemini API key (required)
- `TAVILY_API_KEY`: Tavily search API key (optional)
- `NVD_API_KEY`: NVD API key (optional, for higher rate limits)
- `VIRUSTOTAL_API_KEY`: VirusTotal API key (optional)

### Deployment Architecture

```
┌─────────────────────────────────────┐
│         Load Balancer               │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼──────┐
│  API Server │  │ API Server │
│  Instance 1 │  │ Instance 2 │
└──────┬──────┘  └─────┬──────┘
       │               │
       └───────┬───────┘
               │
┌──────────────▼────────────-──┐
│    Shared Cache Directory    │
│   (Network File System)      │
└──────────────────────────────┘
```

### Running the Service

**Development Mode**:
```bash
cd backend
python app.py
```

**Production Mode**:
```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

**Docker Deployment**:
```bash
docker build -t ciso-assessor .
docker run -p 8000:8000 -e GOOGLE_API_KEY=... ciso-assessor
```

### Performance Considerations

**Caching**: Reduces redundant API calls and LLM invocations
**Parallel Execution**: Phase 3 tools execute in parallel
**Streaming**: Real-time progress reduces perceived latency
**Rate Limiting**: External API rate limits handled gracefully
**Connection Pooling**: HTTP client connection reuse

### Monitoring

**Health Endpoint**: `/health` for service health checks
**Debug Logging**: Per-assessment debug logs in `.cache/debug/`
**Error Tracking**: Errors logged to state.errors and returned in responses
**Cache Statistics**: Available via cache.stats() method

---

## API Reference

### POST /assess/stream

Streaming assessment endpoint with real-time progress updates.

**Request Body**:
```json
{
  "product": "Slack",
  "vendor": null,
  "url": null,
  "sha1": null,
  "version": null,
  "no_cache": false,
  "cache_ttl": 24
}
```

**Response**: Server-Sent Events stream

**Event Types**:
- `phase`: Phase progress update
- `result`: Final assessment result
- `error`: Error message

**Example Phase Event**:
```
event: phase
data: {
  "phase": "phase_1",
  "phase_name": "Entity Resolution",
  "step": "Resolving entity...",
  "messages": ["Product Name: Slack", "Vendor Name: Slack Technologies"]
}
```

**Example Result Event**:
```
event: result
data: {
  "success": true,
  "assessment": {
    "entity": {...},
    "trust_score": 65,
    "risk_score": 45,
    ...
  },
  "timestamp": "2025-01-15T10:30:00"
}
```

### POST /assess

Non-streaming assessment endpoint.

**Request Body**: Same as `/assess/stream`

**Response**:
```json
{
  "success": true,
  "assessment": {
    "entity": {...},
    "taxonomy": {...},
    "trust_score": 65,
    "risk_score": 45,
    ...
  },
  "error": null,
  "timestamp": "2025-01-15T10:30:00"
}
```

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00"
}
```

---

## Conclusion

The backend architecture is designed for scalability, maintainability, and reliability. The orchestration-based approach with LangGraph provides clear separation of concerns, while the tool layer enables easy extension with new data sources. The caching system and streaming API ensure optimal performance and user experience.

