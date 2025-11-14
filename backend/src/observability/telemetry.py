"""OpenTelemetry telemetry and logging configuration."""

import logging
import os
from typing import Optional

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor


# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%S"
)

logger = logging.getLogger(__name__)


def setup_telemetry(
    service_name: str = "deep-research-agent",
    otlp_endpoint: Optional[str] = None
) -> TracerProvider:
    """
    Setup OpenTelemetry tracing with OTLP exporter.
    
    Args:
        service_name: Name of the service for telemetry
        otlp_endpoint: OTLP collector endpoint (defaults to OTEL_EXPORTER_OTLP_ENDPOINT env var)
        
    Returns:
        Configured TracerProvider
        
    Environment Variables:
        - OTEL_EXPORTER_OTLP_ENDPOINT: OTLP collector endpoint (e.g., http://localhost:4318)
        - OTEL_SERVICE_NAME: Service name override
    """
    # Get configuration from environment
    otlp_endpoint = otlp_endpoint or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    service_name = os.getenv("OTEL_SERVICE_NAME", service_name)
    
    # Create resource with service name
    resource = Resource.create({
        "service.name": service_name,
        "service.version": "0.1.0"
    })
    
    # Create tracer provider
    provider = TracerProvider(resource=resource)
    
    # Add OTLP exporter if endpoint is configured
    if otlp_endpoint:
        logger.info(f"Configuring OTLP exporter with endpoint: {otlp_endpoint}")
        otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        span_processor = BatchSpanProcessor(otlp_exporter)
        provider.add_span_processor(span_processor)
    else:
        logger.warning("OTLP endpoint not configured. Telemetry will not be exported.")
    
    # Set as global tracer provider
    trace.set_tracer_provider(provider)
    
    logger.info(f"Telemetry setup complete for service: {service_name}")
    return provider


def instrument_fastapi(app) -> None:
    """
    Instrument FastAPI application with OpenTelemetry.
    
    Args:
        app: FastAPI application instance
    """
    FastAPIInstrumentor.instrument_app(app)
    logger.info("FastAPI instrumentation enabled")


def get_tracer(name: str) -> trace.Tracer:
    """
    Get a tracer instance.
    
    Args:
        name: Name of the tracer (usually module name)
        
    Returns:
        Tracer instance
    """
    return trace.get_tracer(name)


class TelemetryLogger:
    """
    Structured logger for agent operations.
    
    Provides consistent logging format for debugging and monitoring.
    """
    
    def __init__(self, component: str):
        """
        Initialize logger for a component.
        
        Args:
            component: Component name (e.g., "planning_agent", "research_agent")
        """
        self.logger = logging.getLogger(f"deep-research.{component}")
        self.component = component
    
    def log_agent_start(self, agent_id: str, query_id: str) -> None:
        """Log agent operation start."""
        self.logger.info(
            f'{{"event": "agent_start", "agent_id": "{agent_id}", "query_id": "{query_id}", "component": "{self.component}"}}'
        )
    
    def log_agent_progress(self, agent_id: str, query_id: str, progress: float, task: str) -> None:
        """Log agent progress update."""
        self.logger.info(
            f'{{"event": "agent_progress", "agent_id": "{agent_id}", "query_id": "{query_id}", '
            f'"progress": {progress}, "task": "{task}", "component": "{self.component}"}}'
        )
    
    def log_agent_complete(self, agent_id: str, query_id: str) -> None:
        """Log agent operation completion."""
        self.logger.info(
            f'{{"event": "agent_complete", "agent_id": "{agent_id}", "query_id": "{query_id}", "component": "{self.component}"}}'
        )
    
    def log_agent_error(self, agent_id: str, query_id: str, error: str) -> None:
        """Log agent error."""
        self.logger.error(
            f'{{"event": "agent_error", "agent_id": "{agent_id}", "query_id": "{query_id}", '
            f'"error": "{error}", "component": "{self.component}"}}'
        )
    
    def log_search(self, query_id: str, source: str, results_count: int) -> None:
        """Log search operation."""
        self.logger.info(
            f'{{"event": "search", "query_id": "{query_id}", "source": "{source}", '
            f'"results_count": {results_count}, "component": "{self.component}"}}'
        )
    
    def log_workflow_event(self, event: str, query_id: str, details: str = "") -> None:
        """Log workflow event."""
        self.logger.info(
            f'{{"event": "{event}", "query_id": "{query_id}", "details": "{details}", "component": "{self.component}"}}'
        )


# Export convenience functions
__all__ = [
    "setup_telemetry",
    "instrument_fastapi",
    "get_tracer",
    "TelemetryLogger",
    "logger"
]
