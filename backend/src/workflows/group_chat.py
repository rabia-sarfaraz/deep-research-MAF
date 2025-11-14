"""
Group Chat Workflow - Orchestrates all 4 agents to answer research questions.

This workflow:
1. Executes agents in sequence: Planning → Research → Reflect → Content
2. Manages shared state across all agents
3. Handles WebSocket notifications for real-time updates
4. Implements termination conditions
"""

from typing import Any, Dict, List, Optional, Callable
from uuid import UUID

from agent_framework import GroupChat, AgentRuntime

from ..agents.planning_agent import PlanningAgent
from ..agents.research_agent import ResearchAgent
from ..agents.reflect_agent import ReflectAgent
from ..agents.content_agent import ContentWritingAgent
from ..models import QueryStatus
from ..models.query import ResearchQuery
from ..models.thread import ConversationThread
from ..workflows.state_manager import WorkflowStateManager, create_state_manager
from ..observability.telemetry import get_tracer, TelemetryLogger


class ResearchWorkflow:
    """
    Orchestrates the deep research workflow using Group Chat pattern.
    
    Agent execution order:
    1. Planning Agent - Creates research strategy
    2. Research Agent - Executes searches
    3. Reflect Agent - Analyzes completeness
    4. Content Writing Agent - Synthesizes answer
    """
    
    def __init__(
        self,
        websocket_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        """
        Initialize the research workflow.
        
        Args:
            websocket_callback: Optional callback for real-time updates
        """
        # Initialize agents
        self.planning_agent = PlanningAgent()
        self.research_agent = ResearchAgent()
        self.reflect_agent = ReflectAgent()
        self.content_agent = ContentWritingAgent()
        
        # Telemetry
        self.tracer = get_tracer()
        self.logger = TelemetryLogger()
        
        # WebSocket callback for real-time updates
        self.websocket_callback = websocket_callback
        
        # Agent runtime (will be initialized when needed)
        self.runtime: Optional[AgentRuntime] = None
    
    async def execute_query(
        self,
        query: ResearchQuery,
        thread: ConversationThread
    ) -> Dict[str, Any]:
        """
        Execute the complete research workflow for a query.
        
        Args:
            query: Research query to process
            thread: Conversation thread
            
        Returns:
            Dict with synthesized answer and metadata
        """
        # Create workflow span
        with self.tracer.start_as_current_span("research_workflow") as span:
            span.set_attribute("query.id", str(query.id))
            span.set_attribute("thread.id", thread.id)
            
            # Create state manager
            state_manager = create_state_manager(query)
            
            # Update query status
            await state_manager.update_query_status(QueryStatus.PROCESSING)
            
            try:
                # Initialize shared context
                context = {
                    "query": query,
                    "thread": thread,
                    "state_manager": state_manager
                }
                
                # Execute agents in sequence
                # Step 1: Planning Agent
                self.logger.log_workflow_event(
                    event="agent_start",
                    query_id=str(query.id),
                    details={"agent": "planning"}
                )
                await self._notify_update({
                    "type": "agent_start",
                    "agent": "planning",
                    "query_id": str(query.id)
                })
                
                planning_result = await self._execute_planning(context, state_manager)
                
                await self._notify_update({
                    "type": "agent_complete",
                    "agent": "planning",
                    "query_id": str(query.id),
                    "result": planning_result
                })
                
                # Step 2: Research Agent
                self.logger.log_workflow_event(
                    event="agent_start",
                    query_id=str(query.id),
                    details={"agent": "research"}
                )
                await self._notify_update({
                    "type": "agent_start",
                    "agent": "research",
                    "query_id": str(query.id)
                })
                
                research_result = await self._execute_research(context, state_manager)
                
                await self._notify_update({
                    "type": "agent_complete",
                    "agent": "research",
                    "query_id": str(query.id),
                    "result": research_result
                })
                
                # Step 3: Reflect Agent
                self.logger.log_workflow_event(
                    event="agent_start",
                    query_id=str(query.id),
                    details={"agent": "reflect"}
                )
                await self._notify_update({
                    "type": "agent_start",
                    "agent": "reflect",
                    "query_id": str(query.id)
                })
                
                reflect_result = await self._execute_reflect(context, state_manager)
                
                await self._notify_update({
                    "type": "agent_complete",
                    "agent": "reflect",
                    "query_id": str(query.id),
                    "result": reflect_result
                })
                
                # Step 4: Content Writing Agent
                self.logger.log_workflow_event(
                    event="agent_start",
                    query_id=str(query.id),
                    details={"agent": "content"}
                )
                await self._notify_update({
                    "type": "agent_start",
                    "agent": "content",
                    "query_id": str(query.id)
                })
                
                content_result = await self._execute_content(context, state_manager)
                
                await self._notify_update({
                    "type": "agent_complete",
                    "agent": "content",
                    "query_id": str(query.id),
                    "result": content_result
                })
                
                # Mark query as completed
                await state_manager.update_query_status(QueryStatus.COMPLETED)
                
                # Get final answer
                synthesized_answer = await state_manager.get_synthesized_answer()
                
                # Notify completion
                await self._notify_update({
                    "type": "workflow_complete",
                    "query_id": str(query.id),
                    "answer": synthesized_answer.dict() if synthesized_answer else None
                })
                
                # Return results
                return {
                    "success": True,
                    "query_id": str(query.id),
                    "answer": synthesized_answer,
                    "planning": planning_result,
                    "research": research_result,
                    "reflect": reflect_result,
                    "content": content_result
                }
            
            except Exception as e:
                # Mark query as failed
                await state_manager.update_query_status(QueryStatus.FAILED)
                
                # Log error
                self.logger.log_workflow_event(
                    event="workflow_error",
                    query_id=str(query.id),
                    details={"error": str(e)}
                )
                
                # Notify error
                await self._notify_update({
                    "type": "workflow_error",
                    "query_id": str(query.id),
                    "error": str(e)
                })
                
                span.set_attribute("error", str(e))
                
                raise
    
    async def _execute_planning(
        self,
        context: Dict[str, Any],
        state_manager: WorkflowStateManager
    ) -> Dict[str, Any]:
        """Execute Planning Agent."""
        from agent_framework import AgentContext
        
        # Create agent context with shared state
        agent_context = AgentContext(state={
            "query_id": context["query"].id,
            "query": context["query"]
        })
        
        # Execute agent
        result = await self.planning_agent.run(agent_context)
        
        # Store research plan in state manager
        research_plan = agent_context.state.get("research_plan")
        if research_plan:
            await state_manager.set_research_plan(research_plan)
        
        # Store agent state
        agent_state = agent_context.state.get("planning_agent_state")
        if agent_state:
            await state_manager.set_agent_state(agent_state)
        
        return result
    
    async def _execute_research(
        self,
        context: Dict[str, Any],
        state_manager: WorkflowStateManager
    ) -> Dict[str, Any]:
        """Execute Research Agent."""
        from agent_framework import AgentContext
        
        # Get research plan
        research_plan = await state_manager.get_research_plan()
        
        # Create agent context
        agent_context = AgentContext(state={
            "query_id": context["query"].id,
            "query": context["query"],
            "research_plan": research_plan
        })
        
        # Execute agent
        result = await self.research_agent.run(agent_context)
        
        # Store search results
        search_results = agent_context.state.get("search_results")
        if search_results:
            await state_manager.add_search_results(search_results)
        
        # Store agent state
        agent_state = agent_context.state.get("research_agent_state")
        if agent_state:
            await state_manager.set_agent_state(agent_state)
        
        return result
    
    async def _execute_reflect(
        self,
        context: Dict[str, Any],
        state_manager: WorkflowStateManager
    ) -> Dict[str, Any]:
        """Execute Reflect Agent."""
        from agent_framework import AgentContext
        
        # Get data from state manager
        research_plan = await state_manager.get_research_plan()
        search_results = await state_manager.get_search_results()
        
        # Create agent context
        agent_context = AgentContext(state={
            "query_id": context["query"].id,
            "query": context["query"],
            "research_plan": research_plan,
            "search_results": search_results
        })
        
        # Execute agent
        result = await self.reflect_agent.run(agent_context)
        
        # Store feedback
        reflect_feedback = agent_context.state.get("reflect_feedback")
        if reflect_feedback:
            await state_manager.set_intermediate_data("reflect_feedback", reflect_feedback)
        
        # Store agent state
        agent_state = agent_context.state.get("reflect_agent_state")
        if agent_state:
            await state_manager.set_agent_state(agent_state)
        
        return result
    
    async def _execute_content(
        self,
        context: Dict[str, Any],
        state_manager: WorkflowStateManager
    ) -> Dict[str, Any]:
        """Execute Content Writing Agent."""
        from agent_framework import AgentContext
        
        # Get data from state manager
        search_results = await state_manager.get_search_results()
        reflect_feedback = await state_manager.get_intermediate_data("reflect_feedback")
        
        # Create agent context
        agent_context = AgentContext(state={
            "query_id": context["query"].id,
            "query": context["query"],
            "search_results": search_results,
            "reflect_feedback": reflect_feedback
        })
        
        # Execute agent
        result = await self.content_agent.run(agent_context)
        
        # Store synthesized answer
        synthesized_answer = agent_context.state.get("synthesized_answer")
        if synthesized_answer:
            await state_manager.set_synthesized_answer(synthesized_answer)
        
        # Store agent state
        agent_state = agent_context.state.get("content_writing_agent_state")
        if agent_state:
            await state_manager.set_agent_state(agent_state)
        
        return result
    
    async def _notify_update(self, update: Dict[str, Any]) -> None:
        """
        Send update via WebSocket callback if available.
        
        Args:
            update: Update dictionary to send
        """
        if self.websocket_callback:
            try:
                await self.websocket_callback(update)
            except Exception as e:
                self.logger.logger.error(f"WebSocket notification failed: {e}")


# Factory function
def create_research_workflow(
    websocket_callback: Optional[Callable[[Dict[str, Any]], None]] = None
) -> ResearchWorkflow:
    """
    Create a new research workflow instance.
    
    Args:
        websocket_callback: Optional callback for real-time updates
        
    Returns:
        ResearchWorkflow instance
    """
    return ResearchWorkflow(websocket_callback=websocket_callback)


# Export
__all__ = ["ResearchWorkflow", "create_research_workflow"]
