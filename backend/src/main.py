"""FastAPI application entry point for Deep Research Agent."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .api.middleware import setup_all_middleware
from .api.routes import router
from .observability.telemetry import logger, setup_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Deep Research Agent API")
    
    # Initialize telemetry
    setup_telemetry(
        service_name="deep-research-agent",
        service_version="1.0.0",
        otlp_endpoint=os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
    )
    logger.info("Telemetry initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Deep Research Agent API")


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    # Create FastAPI app
    app = FastAPI(
        title="Deep Research Agent API",
        description=(
            "Backend API for Deep Research Agent multi-agent workflow system. "
            "Supports WebSocket for real-time agent state updates and REST for query management."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )
    
    # Setup middleware
    allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    enable_request_logging = os.getenv("ENABLE_REQUEST_LOGGING", "true").lower() == "true"
    
    setup_all_middleware(
        app,
        allow_origins=allowed_origins,
        enable_request_logging=enable_request_logging
    )
    
    # Register routes
    app.include_router(router, prefix="", tags=["api"])
    
    # Health check endpoint
    @app.get("/health", tags=["system"])
    async def health_check():
        """Health check endpoint."""
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "service": "deep-research-agent",
                "version": "1.0.0"
            }
        )
    
    logger.info("FastAPI application configured")
    return app


# Create application instance
app = create_app()


# Export for uvicorn
__all__ = ["app"]
