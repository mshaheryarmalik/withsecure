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

1. **Install dependencies:**
```bash
uv sync
```

2. **Set up environment variables:**
```bash
# .env file
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key  # optional
```

3. **Run the server:**
```bash
uvx --native-tls --from "langgraph-cli[inmem]" --with-editable . --python 3.11 langgraph dev --allow-blocking
```

Server will start at:
- 🚀 API: http://127.0.0.1:2024
- 📚 API Docs: http://127.0.0.1:2024/docs

## Architecture

- **Models**: Gemini 2.5 Pro (research), Gemini 2.5 Flash (summarization)
- **Search**: Tavily API for finding vendor security pages
- **Framework**: LangGraph for agent orchestration
- **Output**: Decision-ready security briefs with citations

## Project Structure

```
src/security_research_agent/
├── configuration.py    # Agent configuration
├── deep_researcher.py  # Main research agent
├── prompts.py         # System prompts
├── state.py           # State models
└── utils.py           # Tools and utilities
```

## Configuration

Key settings in `configuration.py`:
- `research_model`: Default `gemini-2.5-pro`
- `summarization_model`: Default `gemini-2.5-flash`
- `search_api`: Tavily or Google native search
- `max_concurrent_research_units`: Parallel research capacity

## Development Status

**Phase 1 Complete**: ✅
- Gemini-only implementation
- LangSmith integration removed
- CLI-focused architecture

**Phase 2 In Progress**: 🚧
- CISO security assessment features
- High-signal source integrations (NVD, CISA KEV, HIBP)
- Security-specific prompts and state models

## License

MIT
