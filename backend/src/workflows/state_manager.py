"""
Shared state manager for Group Chat workflow.

Provides thread-safe state management for agents working together:
- Query state
- Agent states
- Search results
- Research plans
- Final answers
"""

import asyncio
from typing import Any, Dict, List, Optional
from uuid import UUID

from ..models import AgentId, AgentStatus, QueryStatus
from ..models.agent_state import AgentState
from ..models.query import ResearchQuery
from ..models.research_plan import ResearchPlan
from ..models.search_result import SearchResult
from ..models.synthesized_answer import SynthesizedAnswer
from ..observability.telemetry import logger, TelemetryLogger


class WorkflowStateManager:
    """
    Thread-safe state manager for Group Chat workflow.
    
    Manages shared state across all agents in the workflow:
    - Research query and status
    - Individual agent states
    - Intermediate results (search results, plans)
    - Final synthesized answer
    
    Thread-safety: Uses asyncio.Lock for concurrent access control.
    """
    
    def __init__(self, query: ResearchQuery):
        """
        Initialize state manager for a query.
        
        Args:
            query: Research query to manage state for
        """
        self.query_id = query.id
        self.query = query
        
        # Shared state dictionary
        self._state: Dict[str, Any] = {
            "query_id": query.id,
            "query": query,
            "query_status": query.status,
            "agent_states": {},  # agent_id -> AgentState
            "search_results": [],  # List[SearchResult]
            "research_plan": None,  # ResearchPlan
            "synthesized_answer": None,  # SynthesizedAnswer
            "intermediate_data": {},  # Custom data storage
        }
        
        # Thread safety
        self._lock = asyncio.Lock()
        
        # Telemetry
        self.logger = TelemetryLogger()
    
    async def get_state(self, key: str, default: Any = None) -> Any:
        """
        Get value from shared state (thread-safe).
        
        Args:
            key: State key
            default: Default value if key not found
            
        Returns:
            Value from state or default
        """
        async with self._lock:
            return self._state.get(key, default)
    
    async def set_state(self, key: str, value: Any) -> None:
        """
        Set value in shared state (thread-safe).
        
        Args:
            key: State key
            value: Value to store
        """
        async with self._lock:
            self._state[key] = value
            logger.debug(f"State updated: {key}")
    
    async def get_all_state(self) -> Dict[str, Any]:
        """
        Get complete state snapshot (thread-safe).
        
        Returns:
            Copy of entire state dictionary
        """
        async with self._lock:
            return dict(self._state)
    
    async def update_query_status(self, status: QueryStatus) -> None:
        """
        Update query status.
        
        Args:
            status: New query status
        """
        async with self._lock:
            self.query.status = status
            self._state["query_status"] = status
            logger.info(f"Query {self.query_id} status updated to {status.value}")
    
    async def set_agent_state(self, agent_state: AgentState) -> None:
        """
        Store agent state.
        
        Args:
            agent_state: Agent state to store
        """
        async with self._lock:
            agent_id = agent_state.agent_id.value
            self._state["agent_states"][agent_id] = agent_state
            
            self.logger.log_workflow_event(
                event="agent_state_updated",
                query_id=str(self.query_id),
                details={
                    "agent_id": agent_id,
                    "status": agent_state.status.value,
                    "progress": agent_state.progress
                }
            )
    
    async def get_agent_state(self, agent_id: AgentId) -> Optional[AgentState]:
        """
        Get agent state by ID.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            AgentState or None if not found
        """
        async with self._lock:
            return self._state["agent_states"].get(agent_id.value)
    
    async def get_all_agent_states(self) -> Dict[str, AgentState]:
        """
        Get all agent states.
        
        Returns:
            Dictionary of agent_id -> AgentState
        """
        async with self._lock:
            return dict(self._state["agent_states"])
    
    async def add_search_result(self, result: SearchResult) -> None:
        """
        Add a search result to the collection.
        
        Args:
            result: Search result to add
        """
        async with self._lock:
            self._state["search_results"].append(result)
            
            self.logger.log_search(
                query=self.query.content,
                source=result.source.value,
                result_count=1,
                success=True
            )
    
    async def add_search_results(self, results: List[SearchResult]) -> None:
        """
        Add multiple search results.
        
        Args:
            results: List of search results to add
        """
        async with self._lock:
            self._state["search_results"].extend(results)
            
            if results:
                self.logger.log_search(
                    query=self.query.content,
                    source=results[0].source.value,
                    result_count=len(results),
                    success=True
                )
    
    async def get_search_results(self) -> List[SearchResult]:
        """
        Get all search results.
        
        Returns:
            List of SearchResult instances
        """
        async with self._lock:
            return list(self._state["search_results"])
    
    async def set_research_plan(self, plan: ResearchPlan) -> None:
        """
        Store the research plan from Planning Agent.
        
        Args:
            plan: Research plan to store
        """
        async with self._lock:
            self._state["research_plan"] = plan
            logger.info(f"Research plan stored for query {self.query_id}")
    
    async def get_research_plan(self) -> Optional[ResearchPlan]:
        """
        Get the research plan.
        
        Returns:
            ResearchPlan or None if not set
        """
        async with self._lock:
            return self._state.get("research_plan")
    
    async def set_synthesized_answer(self, answer: SynthesizedAnswer) -> None:
        """
        Store the final synthesized answer.
        
        Args:
            answer: Synthesized answer to store
        """
        async with self._lock:
            self._state["synthesized_answer"] = answer
            logger.info(f"Synthesized answer stored for query {self.query_id}")
    
    async def get_synthesized_answer(self) -> Optional[SynthesizedAnswer]:
        """
        Get the synthesized answer.
        
        Returns:
            SynthesizedAnswer or None if not set
        """
        async with self._lock:
            return self._state.get("synthesized_answer")
    
    async def set_intermediate_data(self, key: str, value: Any) -> None:
        """
        Store agent-specific intermediate data.
        
        Args:
            key: Data key (e.g., "reflect_feedback")
            value: Data value
        """
        async with self._lock:
            self._state["intermediate_data"][key] = value
            logger.debug(f"Intermediate data stored: {key}")
    
    async def get_intermediate_data(
        self,
        key: str,
        default: Any = None
    ) -> Any:
        """
        Get agent-specific intermediate data.
        
        Args:
            key: Data key
            default: Default value if key not found
            
        Returns:
            Data value or default
        """
        async with self._lock:
            return self._state["intermediate_data"].get(key, default)
    
    async def is_agent_completed(self, agent_id: AgentId) -> bool:
        """
        Check if an agent has completed execution.
        
        Args:
            agent_id: Agent identifier
            
        Returns:
            True if agent status is COMPLETED
        """
        agent_state = await self.get_agent_state(agent_id)
        return agent_state is not None and agent_state.status == AgentStatus.COMPLETED
    
    async def are_all_agents_completed(
        self,
        required_agents: List[AgentId]
    ) -> bool:
        """
        Check if all required agents have completed.
        
        Args:
            required_agents: List of agent IDs to check
            
        Returns:
            True if all required agents are completed
        """
        async with self._lock:
            agent_states = self._state["agent_states"]
            return all(
                agent_id.value in agent_states and
                agent_states[agent_id.value].status == AgentStatus.COMPLETED
                for agent_id in required_agents
            )
    
    async def get_workflow_summary(self) -> Dict[str, Any]:
        """
        Get workflow execution summary.
        
        Returns:
            Summary dictionary with agent statuses and results
        """
        async with self._lock:
            agent_states = self._state["agent_states"]
            return {
                "query_id": str(self.query_id),
                "query_status": self._state["query_status"].value,
                "agents": {
                    agent_id: {
                        "status": state.status.value,
                        "progress": state.progress,
                        "error": state.error
                    }
                    for agent_id, state in agent_states.items()
                },
                "search_result_count": len(self._state["search_results"]),
                "has_research_plan": self._state["research_plan"] is not None,
                "has_answer": self._state["synthesized_answer"] is not None
            }


# Factory function for creating state managers
def create_state_manager(query: ResearchQuery) -> WorkflowStateManager:
    """
    Create a new state manager for a query.
    
    Args:
        query: Research query
        
    Returns:
        Initialized WorkflowStateManager
    """
    return WorkflowStateManager(query)


# Export
__all__ = ["WorkflowStateManager", "create_state_manager"]
