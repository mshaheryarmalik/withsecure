"""Logging utility for security research tools."""

import os
import json
from datetime import datetime
from typing import Any, Dict


# Check if debug logging is enabled
DEBUG_ENABLED = os.getenv("DEBUG_TOOLS", "false").lower() == "true"


def debug_log(tool_name: str, message: str, data: Any = None):
    """Log debug information if DEBUG_TOOLS=true.
    
    Args:
        tool_name: Name of the tool
        message: Debug message
        data: Optional data to log
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    prefix = f"[{timestamp}] [DEBUG] [{tool_name}]"
    
    print(f"{prefix} {message}")
    
    if data is not None:
        # Pretty print data
        if isinstance(data, (dict, list)):
            data_str = json.dumps(data, indent=2, default=str)
            # Truncate if too long
            if len(data_str) > 1000:
                data_str = data_str[:1000] + "\n... (truncated)"
            print(f"{prefix} Data: {data_str}")
        else:
            print(f"{prefix} Data: {data}")


def debug_request(tool_name: str, method: str, url: str, params: Dict = None, 
                  headers: Dict = None, data: Any = None):
    """Log HTTP request details.
    
    Args:
        tool_name: Name of the tool
        method: HTTP method (GET, POST, etc.)
        url: Request URL
        params: Query parameters
        headers: Request headers
        data: Request body
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    prefix = f"[{timestamp}] [DEBUG] [{tool_name}]"
    
    print(f"{prefix} >>> HTTP {method} {url}")
    
    if params:
        # Mask sensitive params
        safe_params = {k: v if k not in ['apiKey', 'api_key', 'key', 'token'] 
                      else '***' for k, v in params.items()}
        print(f"{prefix}     Params: {json.dumps(safe_params, indent=8)}")
    
    if headers:
        # Mask sensitive headers
        safe_headers = {k: v if k.lower() not in ['authorization', 'apikey', 'x-apikey', 'api-key']
                       else '***' for k, v in headers.items()}
        print(f"{prefix}     Headers: {json.dumps(safe_headers, indent=8)}")
    
    if data:
        print(f"{prefix}     Body: {json.dumps(data, indent=8, default=str)[:500]}")


def debug_response(tool_name: str, status_code: int, response_data: Any = None, 
                   error: str = None):
    """Log HTTP response details.
    
    Args:
        tool_name: Name of the tool
        status_code: HTTP status code
        response_data: Response data
        error: Error message if request failed
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    prefix = f"[{timestamp}] [DEBUG] [{tool_name}]"
    
    status_emoji = "✓" if 200 <= status_code < 300 else "✗"
    print(f"{prefix} <<< {status_emoji} HTTP {status_code}")
    
    if error:
        print(f"{prefix}     Error: {error}")
    
    if response_data:
        if isinstance(response_data, (dict, list)):
            data_str = json.dumps(response_data, indent=8, default=str)
            if len(data_str) > 1000:
                data_str = data_str[:1000] + "\n... (truncated)"
            print(f"{prefix}     Response: {data_str}")
        else:
            print(f"{prefix}     Response: {str(response_data)[:500]}")


def debug_tool_start(tool_name: str, input_params: Dict):
    """Log tool invocation start.
    
    Args:
        tool_name: Name of the tool
        input_params: Input parameters
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"\n{'='*80}")
    print(f"[{timestamp}] [DEBUG] [{tool_name}] STARTED")
    print(f"{'='*80}")
    print(f"Input: {json.dumps(input_params, indent=2, default=str)}")


def debug_tool_end(tool_name: str, result: Any, duration_ms: float = None):
    """Log tool invocation end.
    
    Args:
        tool_name: Name of the tool
        result: Tool result
        duration_ms: Execution time in milliseconds
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    duration_str = f" ({duration_ms:.2f}ms)" if duration_ms else ""
    
    print(f"\n[{timestamp}] [DEBUG] [{tool_name}] COMPLETED{duration_str}")
    
    if isinstance(result, dict):
        # Show key fields only
        summary = {k: v for k, v in result.items() 
                  if k in ['found', 'count', 'total', 'status', 'error', 
                          'data_available', 'breach_found', 'threat_found']}
        if summary:
            print(f"Result Summary: {json.dumps(summary, indent=2)}")
    
    print(f"{'='*80}\n")


def debug_error(tool_name: str, error: Exception, context: str = None):
    """Log error details.
    
    Args:
        tool_name: Name of the tool
        error: Exception that occurred
        context: Additional context about the error
    """
    if not DEBUG_ENABLED:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    prefix = f"[{timestamp}] [ERROR] [{tool_name}]"
    
    print(f"\n{prefix} ✗ {type(error).__name__}: {str(error)}")
    if context:
        print(f"{prefix} Context: {context}")
    
    # Print stack trace in debug mode
    import traceback
    print(f"{prefix} Traceback:")
    traceback.print_exc()

