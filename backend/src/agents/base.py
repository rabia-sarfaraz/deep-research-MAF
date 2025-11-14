"""
Base Custom Agent implementation following Microsoft Agent Framework patterns.

This module provides the base class for all 4 custom agents:
- Planning Agent
- Research Agent
- Reflect Agent
- Content Writing Agent
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from uuid import UUID

from agent_framework import Agent, AgentContext

from ..models import AgentId, AgentStatus
from ..models.agent_state import AgentState
from ..observability.telemetry import get_tracer, TelemetryLogger


class BaseCustomAgent(Agent, ABC):
    """
    Base class for all custom agents in the system.
    
    Provides common functionality:
    - State management
    - Progress tracking
    - Telemetry integration
    - Error handling
    
    Subclasses must implement the `execute` method with agent-specific logic.
    """
    
    def __init__(
        self,
        agent_id: AgentId,
        name: str,
        description: str,
        **kwargs
    ):
        """
        Initialize the base agent.
        
        Args:
            agent_id: Unique identifier from AgentId enum
            name: Human-readable agent name
            description: Agent purpose description
            **kwargs: Additional arguments passed to Agent constructor
        """
        super().__init__(name=name, description=description, **kwargs)
        self.agent_id = agent_id
        self.tracer = get_tracer()
        self.logger = TelemetryLogger()
    
    async def run(self, context: AgentContext) -> Any:
        """
        Main entry point called by Agent Framework.
        
        Wraps execute() with:
        - State initialization
        - Progress tracking
        - Telemetry/logging
        - Error handling
        
        Args:
            context: Agent execution context with shared state
            
        Returns:
            Result from execute() method
        """
        # Extract query ID from context
        query_id = context.state.get("query_id")
        if not query_id:
            raise ValueError("query_id not found in context state")
        
        # Create tracer span for agent execution
        with self.tracer.start_as_current_span(f"{self.agent_id}_execution") as span:
            span.set_attribute("agent.id", self.agent_id.value)
            span.set_attribute("query.id", str(query_id))
            
            # Initialize agent state
            agent_state = self._create_agent_state(query_id)
            context.state[f"{self.agent_id}_state"] = agent_state
            
            # Log agent start
            self.logger.log_agent_start(
                agent_id=self.agent_id.value,
                query_id=str(query_id)
            )
            
            try:
                # Update status to running
                agent_state.status = AgentStatus.RUNNING
                agent_state.progress = 0.0
                
                # Execute agent-specific logic
                result = await self.execute(context)
                
                # Mark as completed
                agent_state.status = AgentStatus.COMPLETED
                agent_state.progress = 1.0
                agent_state.intermediate_result = result
                
                # Log completion
                self.logger.log_agent_complete(
                    agent_id=self.agent_id.value,
                    query_id=str(query_id),
                    result=result
                )
                
                span.set_attribute("agent.status", "completed")
                return result
            
            except Exception as e:
                # Mark as failed
                agent_state.status = AgentStatus.FAILED
                agent_state.error = str(e)
                
                # Log error
                self.logger.log_agent_error(
                    agent_id=self.agent_id.value,
                    query_id=str(query_id),
                    error=str(e)
                )
                
                span.set_attribute("agent.status", "failed")
                span.set_attribute("agent.error", str(e))
                
                # Re-raise to propagate to workflow
                raise
    
    @abstractmethod
    async def execute(self, context: AgentContext) -> Dict[str, Any]:
        """
        Agent-specific execution logic.
        
        Must be implemented by subclasses.
        
        Args:
            context: Agent execution context with shared state
            
        Returns:
            Agent-specific result dictionary
        """
        pass
    
    def _create_agent_state(self, query_id: UUID | str) -> AgentState:
        """
        Create initial agent state.
        
        Args:
            query_id: Associated query identifier
            
        Returns:
            Initialized AgentState instance
        """
        return AgentState(
            agent_id=self.agent_id,
            query_id=str(query_id) if isinstance(query_id, UUID) else query_id,
            status=AgentStatus.IDLE,
            progress=0.0,
            current_task=None,
            intermediate_result=None,
            error=None
        )
    
    def update_progress(
        self,
        context: AgentContext,
        progress: float,
        current_task: Optional[str] = None
    ) -> None:
        """
        Update agent progress in shared state.
        
        Args:
            context: Agent execution context
            progress: Progress value (0.0 to 1.0)
            current_task: Optional description of current task
        """
        agent_state = context.state.get(f"{self.agent_id}_state")
        if agent_state:
            agent_state.progress = max(0.0, min(1.0, progress))
            if current_task:
                agent_state.current_task = current_task
            
            # Log progress
            query_id = context.state.get("query_id")
            self.logger.log_agent_progress(
                agent_id=self.agent_id.value,
                query_id=str(query_id),
                progress=agent_state.progress,
                current_task=current_task or ""
            )
    
    def get_shared_state(
        self,
        context: AgentContext,
        key: str,
        default: Any = None
    ) -> Any:
        """
        Get value from shared state.
        
        Args:
            context: Agent execution context
            key: State key
            default: Default value if key not found
            
        Returns:
            Value from shared state or default
        """
        return context.state.get(key, default)
    
    def set_shared_state(
        self,
        context: AgentContext,
        key: str,
        value: Any
    ) -> None:
        """
        Set value in shared state.
        
        Args:
            context: Agent execution context
            key: State key
            value: Value to store
        """
        context.state[key] = value
    
    def get_agent_state(self, context: AgentContext) -> Optional[AgentState]:
        """
        Get this agent's state from context.
        
        Args:
            context: Agent execution context
            
        Returns:
            AgentState instance or None if not found
        """
        return context.state.get(f"{self.agent_id}_state")


# Export base class
__all__ = ["BaseCustomAgent"]
