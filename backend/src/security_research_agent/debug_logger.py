"""Debug logging utility for CISO assessment phases."""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


# Global cache to ensure same product uses same log file during assessment
_logger_cache = {}


class DebugLogger:
    """Logger for debugging CISO assessment phases."""
    
    def __init__(self, product_name: str, log_dir: str | None = None):
        """Initialize debug logger.
        
        Args:
            product_name: Name of the product being assessed
            log_dir: Directory to store log files. If None, defaults to backend/.logs.
        """
        self.product_name = product_name
        if log_dir is None:
            # Default to backend/.logs regardless of current working directory
            backend_dir = Path(__file__).resolve().parents[3]
            self.log_dir = backend_dir / ".logs"
        else:
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Create timestamped log file (use minute precision to group phases)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in product_name[:50])  # Limit length
        self.log_file = self.log_dir / f"{safe_name}_{timestamp}.txt"
        
        # Initialize log file only if it doesn't exist
        if not self.log_file.exists():
            self._write_header()
        else:
            # Append mode - add separator
            with open(self.log_file, 'a') as f:
                f.write("\n")
    
    def _write_header(self):
        """Write log file header."""
        with open(self.log_file, 'w') as f:
            f.write("="*80 + "\n")
            f.write(f"CISO SECURITY ASSESSMENT DEBUG LOG\n")
            f.write(f"Product: {self.product_name}\n")
            f.write(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("="*80 + "\n\n")
    
    def log_phase(self, phase_number: int, phase_name: str, data: Dict[str, Any], status: str = "SUCCESS"):
        """Log a phase of the assessment.
        
        Args:
            phase_number: Phase number (1-4)
            phase_name: Name of the phase
            data: Data/results from the phase
            status: Phase status (SUCCESS, ERROR, WARNING)
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.log_file, 'a') as f:
            f.write("\n" + "="*80 + "\n")
            f.write(f"PHASE {phase_number}: {phase_name}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Status: {status}\n")
            f.write("-"*80 + "\n\n")
            
            # Write data in a readable format
            if isinstance(data, dict):
                # Pretty print dict
                for key, value in data.items():
                    f.write(f"{key}:\n")
                    if isinstance(value, (dict, list)):
                        # Use JSON for complex structures
                        f.write(json.dumps(value, indent=2, default=str))
                        f.write("\n\n")
                    else:
                        f.write(f"  {value}\n\n")
            else:
                # Fallback to string representation
                f.write(str(data))
                f.write("\n\n")
    
    def log_tool_call(self, tool_name: str, input_data: Any, output_data: Any = None, error: Exception = None):
        """Log a tool call with its input and output.
        
        Args:
            tool_name: Name of the tool being called
            input_data: Input parameters to the tool
            output_data: Output from the tool (optional)
            error: Exception if tool failed (optional)
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.log_file, 'a') as f:
            f.write("\n" + "-"*80 + "\n")
            f.write(f"🔧 TOOL CALL: {tool_name}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write("-"*80 + "\n")
            
            # Log input
            f.write("INPUT:\n")
            if isinstance(input_data, dict):
                f.write(json.dumps(input_data, indent=2, default=str))
            else:
                f.write(f"  {input_data}")
            f.write("\n\n")
            
            # Log output or error
            if error:
                f.write(f"❌ ERROR: {type(error).__name__}: {str(error)}\n")
            elif output_data is not None:
                f.write("OUTPUT:\n")
                if isinstance(output_data, dict):
                    # Truncate large outputs
                    output_str = json.dumps(output_data, indent=2, default=str)
                    if len(output_str) > 2000:
                        f.write(output_str[:2000] + "\n... (truncated, total length: " + str(len(output_str)) + " chars)\n")
                    else:
                        f.write(output_str)
                elif isinstance(output_data, list):
                    f.write(f"  List with {len(output_data)} items\n")
                    f.write(json.dumps(output_data[:3], indent=2, default=str))
                    if len(output_data) > 3:
                        f.write("\n  ... (showing first 3 items)")
                else:
                    output_str = str(output_data)
                    if len(output_str) > 2000:
                        f.write(output_str[:2000] + "\n... (truncated)")
                    else:
                        f.write(output_str)
                f.write("\n")
            else:
                f.write("⏳ (pending)\n")
            
            f.write("-"*80 + "\n")
    
    def log_error(self, phase_name: str, error: Exception):
        """Log an error during a phase.
        
        Args:
            phase_name: Name of the phase where error occurred
            error: The exception that was raised
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.log_file, 'a') as f:
            f.write("\n" + "!"*80 + "\n")
            f.write(f"ERROR in {phase_name}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Error Type: {type(error).__name__}\n")
            f.write(f"Error Message: {str(error)}\n")
            f.write("!"*80 + "\n\n")
    
    def log_summary(self, final_brief: Dict[str, Any]):
        """Log final assessment summary.
        
        Args:
            final_brief: The final CISO brief
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(self.log_file, 'a') as f:
            f.write("\n" + "="*80 + "\n")
            f.write("ASSESSMENT SUMMARY\n")
            f.write(f"Completed: {timestamp}\n")
            f.write("-"*80 + "\n\n")
            
            # Extract key metrics
            if isinstance(final_brief, dict):
                f.write(f"Product: {final_brief.get('entity', {}).get('product_name', 'Unknown')}\n")
                f.write(f"Vendor: {final_brief.get('entity', {}).get('vendor_name', 'Unknown')}\n")
                f.write(f"Category: {final_brief.get('taxonomy', {}).get('primary_category', 'Unknown')}\n")
                f.write(f"Trust Score: {final_brief.get('trust_score', 'N/A')}/100\n")
                f.write(f"Risk Score: {final_brief.get('risk_score', 'N/A')}/100\n")
                f.write(f"Confidence: {final_brief.get('confidence', 'N/A')}\n")
                f.write(f"CVEs Found: {final_brief.get('cve_summary', {}).get('total_cves', 0)}\n")
                f.write(f"Breaches: {final_brief.get('incidents', {}).get('breach_count', 0)}\n")
                f.write(f"Citations: {len(final_brief.get('all_citations', []))}\n")
                f.write("\n")
                f.write(f"Rationale: {final_brief.get('rationale', 'N/A')}\n")
            
            f.write("\n" + "="*80 + "\n")
            f.write(f"Log file: {self.log_file}\n")
            f.write("="*80 + "\n")
    
    def get_log_path(self) -> str:
        """Get the path to the log file.
        
        Returns:
            Path to the log file
        """
        return str(self.log_file)


def get_debug_logger(product_name: str) -> DebugLogger:
    """Get a debug logger instance.
    
    Args:
        product_name: Name of the product being assessed
        
    Returns:
        DebugLogger instance
    """
    return DebugLogger(product_name)

