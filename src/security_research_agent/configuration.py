"""Configuration management for CISO Security Assessment."""

import os
from typing import Any, List, Optional

from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field


class MCPConfig(BaseModel):
    """Configuration for Model Context Protocol (MCP) servers."""
    
    url: Optional[str] = Field(
        default=None,
        optional=True,
    )
    """The URL of the MCP server"""
    tools: Optional[List[str]] = Field(
        default=None,
        optional=True,
    )
    """The tools to make available to the LLM"""
    auth_required: Optional[bool] = Field(
        default=False,
        optional=True,
    )
    """Whether the MCP server requires authentication"""


class Configuration(BaseModel):
    """Configuration for CISO Security Assessment."""
    
    # User Interaction
    allow_clarification: bool = Field(
        default=True,
        metadata={
            "x_oap_ui_config": {
                "type": "boolean",
                "default": True,
                "description": "Whether to allow asking the user clarifying questions before starting assessment"
            }
        }
    )
    
    # Model Configuration
    classification_model: str = Field(
        default="gemini-2.0-flash-exp",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "gemini-2.0-flash-exp",
                "description": "Model for software taxonomy classification (Gemini only)"
            }
        }
    )
    
    final_report_model: str = Field(
        default="google_genai:gemini-2.0-flash-exp",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "google_genai:gemini-2.0-flash-exp",
                "description": "Model for generating the final CISO security brief (Gemini only)"
            }
        }
    )
    
    # MCP Server Configuration
    mcp_config: Optional[MCPConfig] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "mcp",
                "description": "MCP server configuration"
            }
        }
    )
    
    mcp_prompt: Optional[str] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "description": "Any additional instructions to pass along to the Agent regarding the MCP tools that are available to it."
            }
        }
    )

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = config.get("configurable", {}) if config else {}
        field_names = list(cls.model_fields.keys())
        values: dict[str, Any] = {
            field_name: os.environ.get(field_name.upper(), configurable.get(field_name))
            for field_name in field_names
        }
        return cls(**{k: v for k, v in values.items() if v is not None})

    class Config:
        """Pydantic configuration."""
        
        arbitrary_types_allowed = True
