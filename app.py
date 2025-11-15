#!/usr/bin/env python3
"""FastAPI REST API for CISO Security Assessment Tool with streaming progress."""

import asyncio
import json
import os
from datetime import datetime
from typing import Optional, AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

from src.security_research_agent.cache import get_cache
from src.security_research_agent.ciso_assessor import (
    create_ciso_assessor_graph,
    AssessmentState,
)


# Initialize FastAPI app
app = FastAPI(
    title="CISO Security Assessment API",
    description="AI-powered security assessments with real-time progress streaming",
    version="1.0.0",
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssessmentRequest(BaseModel):
    """Request model for security assessment."""

    product: Optional[str] = Field(None, description="Product name")
    vendor: Optional[str] = Field(None, description="Vendor/company name")
    url: Optional[str] = Field(None, description="Product URL")
    sha1: Optional[str] = Field(None, description="SHA1 hash")
    version: Optional[str] = Field(None, description="Product version (optional, defaults to auto-detect)")
    no_cache: bool = Field(False, description="Disable cache (force fresh assessment)")
    cache_ttl: int = Field(24, description="Cache TTL in hours")


class AssessmentResponse(BaseModel):
    """Response model for completed assessment."""

    success: bool
    assessment: Optional[dict] = None
    error: Optional[str] = None
    timestamp: str


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "CISO Security Assessment API",
        "version": "1.0.0",
        "endpoints": {
            "assess_stream": "POST /assess/stream - Stream assessment with real-time progress",
            "assess": "POST /assess - Get assessment result without streaming",
            "health": "GET /health - Health check",
        },
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


async def assessment_generator(
    input_text: str, product_version: Optional[str], use_cache: bool, cache_ttl: int
) -> AsyncIterator[str]:
    """Generate Server-Sent Events for assessment progress.
    
    Yields events in SSE format:
    - phase: Phase update with status messages
    - progress: Progress indicator
    - result: Final assessment result
    - error: Error message if assessment fails
    """
    try:
        # Check cache first
        cache = get_cache(ttl_hours=cache_ttl) if use_cache else None

        if cache and use_cache:
            cached_brief = cache.get(input_text)
            if cached_brief:
                # Send cache hit event
                yield f"event: phase\ndata: {json.dumps({'phase': 'cache', 'message': 'Found cached assessment'}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.01)
                
                # Send final result
                result = cached_brief.model_dump(mode='json')
                yield f"event: result\ndata: {json.dumps({'success': True, 'assessment': result}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.01)
                return

        # Create graph
        graph = create_ciso_assessor_graph()

        # Initialize state
        initial_state = AssessmentState(
            input_text=input_text,
            product_version=product_version,
            messages=[HumanMessage(content=f"Assess security for: {input_text}")],
        )

        # Send initial event
        yield f"event: phase\ndata: {json.dumps({'phase': 'init', 'message': 'Starting assessment...'}, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.01)

        brief = None
        errors = []
        current_phase = None
        last_message_count = 0

        # Stream graph execution
        for event in graph.stream(initial_state, stream_mode="updates"):
            for node_name, node_data in event.items():
                # Extract phase information
                current_step = node_data.get("current_step", "")
                status_messages = node_data.get("status_messages", [])
                node_errors = node_data.get("errors", [])

                # Determine phase from node name
                if "resolve_entity" in node_name:
                    phase = "phase_1"
                    phase_name = "Entity Resolution"
                elif "classify" in node_name:
                    phase = "phase_2"
                    phase_name = "Software Classification"
                elif "gather_security" in node_name:
                    phase = "phase_3"
                    phase_name = "Security Data Gathering"
                elif "generate_ciso" in node_name:
                    phase = "phase_4"
                    phase_name = "AI Analysis & Brief Generation"
                else:
                    phase = "processing"
                    phase_name = node_name

                # Send incremental updates as new messages arrive
                if status_messages:
                    # Detect phase change
                    if phase != current_phase:
                        current_phase = phase
                        last_message_count = 0  # Reset counter for new phase
                    
                    # Get only NEW messages since last update
                    total_messages = len(status_messages)
                    if total_messages > last_message_count:
                        new_messages = status_messages[last_message_count:]
                        last_message_count = total_messages
                        
                        # Send the new messages
                        phase_data = {
                            "phase": phase,
                            "phase_name": phase_name,
                            "step": current_step,
                            "messages": new_messages,
                        }
                        yield f"event: phase\ndata: {json.dumps(phase_data, ensure_ascii=False)}\n\n"
                        # Small delay to ensure immediate flush
                        await asyncio.sleep(0.01)

                # Collect errors
                if node_errors:
                    errors.extend(node_errors)
                    error_data = {"errors": node_errors}
                    yield f"event: error\ndata: {json.dumps(error_data, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.01)

                # Check if brief is complete
                if node_data.get("ciso_brief"):
                    brief = node_data.get("ciso_brief")

        # Send completion status
        if brief:
            # Cache result
            if cache and use_cache:
                cache.set(input_text, brief)

            # Send final result
            result = brief.model_dump(mode='json')
            yield f"event: result\ndata: {json.dumps({'success': True, 'assessment': result, 'timestamp': datetime.now().isoformat()}, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.01)
        else:
            # Assessment failed
            error_msg = "; ".join(errors) if errors else "Assessment failed for unknown reason"
            yield f"event: error\ndata: {json.dumps({'success': False, 'error': error_msg}, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.01)

    except Exception as e:
        # Send error event
        error_data = {"success": False, "error": str(e)}
        yield f"event: error\ndata: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        await asyncio.sleep(0.01)


@app.post("/assess/stream")
async def assess_stream(request: AssessmentRequest):
    """Run security assessment with streaming progress updates.
    
    Returns Server-Sent Events (SSE) stream with real-time progress:
    - phase: Progress updates from each assessment phase
    - result: Final assessment result
    - error: Error messages if any
    
    Example events:
    ```
    event: phase
    data: {"phase": "phase_1", "phase_name": "Entity Resolution", "messages": [...]}
    
    event: result
    data: {"success": true, "assessment": {...}}
    ```
    """
    # Determine primary input
    input_text = request.sha1 or request.url or request.product or request.vendor

    if not input_text:
        raise HTTPException(
            status_code=400,
            detail="Must provide at least one input (product, vendor, url, or sha1)",
        )

    # Return streaming response
    return StreamingResponse(
        assessment_generator(
            input_text=input_text,
            product_version=request.version,
            use_cache=not request.no_cache,
            cache_ttl=request.cache_ttl,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )


@app.post("/assess", response_model=AssessmentResponse)
async def assess(request: AssessmentRequest):
    """Run security assessment without streaming (returns final result only).
    
    This endpoint waits for the full assessment to complete and returns
    the final result. Use /assess/stream for real-time progress updates.
    """
    # Determine primary input
    input_text = request.sha1 or request.url or request.product or request.vendor

    if not input_text:
        raise HTTPException(
            status_code=400,
            detail="Must provide at least one input (product, vendor, url, or sha1)",
        )

    try:
        # Check cache
        cache = get_cache(ttl_hours=request.cache_ttl) if not request.no_cache else None

        if cache and not request.no_cache:
            cached_brief = cache.get(input_text)
            if cached_brief:
                return AssessmentResponse(
                    success=True,
                    assessment=cached_brief.model_dump(mode='json'),
                    timestamp=datetime.now().isoformat(),
                )

        # Create graph and run assessment
        graph = create_ciso_assessor_graph()

        initial_state = AssessmentState(
            input_text=input_text,
            product_version=request.version,
            messages=[HumanMessage(content=f"Assess security for: {input_text}")],
        )

        brief = None
        errors = []

        # Execute graph
        for event in graph.stream(initial_state, stream_mode="updates"):
            for node_name, node_data in event.items():
                node_errors = node_data.get("errors", [])
                if node_errors:
                    errors.extend(node_errors)

                if node_data.get("ciso_brief"):
                    brief = node_data.get("ciso_brief")

        if brief:
            # Cache result
            if cache and not request.no_cache:
                cache.set(input_text, brief)

            return AssessmentResponse(
                success=True,
                assessment=brief.model_dump(mode='json'),
                timestamp=datetime.now().isoformat(),
            )
        else:
            error_msg = "; ".join(errors) if errors else "Assessment failed"
            return AssessmentResponse(
                success=False, error=error_msg, timestamp=datetime.now().isoformat()
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    # Run with: python app.py
    # Or: uvicorn app:app --reload --host 0.0.0.0 --port 8000
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

