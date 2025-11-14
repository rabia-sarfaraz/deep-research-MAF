"""FastAPI routes for Deep Research Agent API."""

import asyncio
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field

from ..models import QueryStatus, SearchSource, ThreadStatus
from ..models.agent_state import AgentState
from ..models.query import ResearchQuery as QueryModel
from ..models.research_plan import ResearchPlan
from ..models.search_result import SearchResult
from ..models.synthesized_answer import SynthesizedAnswer
from ..models.thread import ConversationThread
from ..observability.telemetry import logger
from ..workflows.group_chat import ResearchWorkflow

# Router instance
router = APIRouter()

# In-memory storage (would be replaced with database in production)
threads_db: Dict[UUID, ConversationThread] = {}
queries_db: Dict[UUID, QueryModel] = {}
answers_db: Dict[UUID, SynthesizedAnswer] = {}
agent_states_db: Dict[UUID, List[AgentState]] = {}
search_results_db: Dict[UUID, List[SearchResult]] = {}
research_plans_db: Dict[UUID, ResearchPlan] = {}

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[UUID, List[WebSocket]] = {}
    
    async def connect(self, thread_id: UUID, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        if thread_id not in self.active_connections:
            self.active_connections[thread_id] = []
        self.active_connections[thread_id].append(websocket)
        logger.info(f"WebSocket connected for thread {thread_id}")
    
    def disconnect(self, thread_id: UUID, websocket: WebSocket):
        """Remove WebSocket connection."""
        if thread_id in self.active_connections:
            self.active_connections[thread_id].remove(websocket)
            if not self.active_connections[thread_id]:
                del self.active_connections[thread_id]
        logger.info(f"WebSocket disconnected for thread {thread_id}")
    
    async def send_message(self, thread_id: UUID, message: dict):
        """Send message to all connections for a thread."""
        if thread_id in self.active_connections:
            for connection in self.active_connections[thread_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {e}")

manager = ConnectionManager()


# Request/Response models
class CreateThreadRequest(BaseModel):
    """Request body for creating a new thread."""
    session_id: str = Field(..., description="Browser session identifier")


class CreateQueryRequest(BaseModel):
    """Request body for submitting a new query."""
    content: str = Field(..., min_length=1, max_length=2000, description="Research question text")
    search_sources: List[SearchSource] = Field(..., min_length=1, description="Search sources to use")


class ThreadDetailResponse(BaseModel):
    """Response with thread details including queries and answers."""
    id: UUID
    session_id: str
    status: ThreadStatus
    created_at: str
    updated_at: str
    queries: List[QueryModel]
    answers: List[SynthesizedAnswer]


class QueryDetailResponse(BaseModel):
    """Response with query details including agent states and results."""
    id: UUID
    thread_id: UUID
    content: str
    search_sources: List[SearchSource]
    status: QueryStatus
    created_at: str
    agent_states: List[AgentState]
    search_results: List[SearchResult]
    research_plan: ResearchPlan | None


# ============================================================================
# Thread Management Endpoints
# ============================================================================

@router.post("/threads", status_code=status.HTTP_201_CREATED, response_model=ConversationThread)
async def create_thread(request: CreateThreadRequest) -> ConversationThread:
    """
    Create a new conversation thread.
    
    Args:
        request: Thread creation request with session_id
        
    Returns:
        Created thread object
        
    Raises:
        HTTPException: If validation fails
    """
    try:
        # Create new thread
        thread = ConversationThread(session_id=request.session_id)
        threads_db[thread.id] = thread
        
        logger.info(f"Created thread {thread.id} for session {request.session_id}")
        return thread
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/threads/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(thread_id: UUID) -> ThreadDetailResponse:
    """
    Get thread details with all queries and answers.
    
    Args:
        thread_id: UUID of the thread
        
    Returns:
        Thread details with queries and answers
        
    Raises:
        HTTPException: If thread not found
    """
    # Check if thread exists
    if thread_id not in threads_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    thread = threads_db[thread_id]
    
    # Fetch related queries and answers
    queries = [queries_db[qid] for qid in thread.queries if qid in queries_db]
    answers = [answers_db[aid] for aid in thread.answers if aid in answers_db]
    
    return ThreadDetailResponse(
        id=thread.id,
        session_id=thread.session_id,
        status=thread.status,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        queries=queries,
        answers=answers
    )


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def close_thread(thread_id: UUID):
    """
    Close a conversation thread and clean up resources.
    
    Args:
        thread_id: UUID of the thread to close
        
    Raises:
        HTTPException: If thread not found
    """
    if thread_id not in threads_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    # Update thread status
    thread = threads_db[thread_id]
    thread.status = ThreadStatus.CLOSED
    
    logger.info(f"Closed thread {thread_id}")
    return None


# ============================================================================
# Query Management Endpoints
# ============================================================================

@router.post("/threads/{thread_id}/queries", status_code=status.HTTP_202_ACCEPTED, response_model=QueryModel)
async def submit_query(thread_id: UUID, request: CreateQueryRequest) -> QueryModel:
    """
    Submit a new research query to the thread.
    
    This initiates the multi-agent workflow. Real-time updates are sent via WebSocket.
    
    Args:
        thread_id: UUID of the conversation thread
        request: Query submission request
        
    Returns:
        Created query object
        
    Raises:
        HTTPException: If thread not found or validation fails
    """
    # Check if thread exists
    if thread_id not in threads_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found"
        )
    
    try:
        # Create query
        query = QueryModel(
            thread_id=thread_id,
            content=request.content,
            search_sources=request.search_sources,
            status=QueryStatus.PENDING
        )
        queries_db[query.id] = query
        
        # Add query to thread
        thread = threads_db[thread_id]
        thread.queries.append(query.id)
        thread.status = ThreadStatus.ACTIVE
        
        # Initialize agent states
        agent_states_db[query.id] = []
        search_results_db[query.id] = []
        
        logger.info(f"Created query {query.id} for thread {thread_id}")
        
        # Start workflow asynchronously
        asyncio.create_task(execute_workflow(query))
        
        return query
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/queries/{query_id}", response_model=QueryDetailResponse)
async def get_query(query_id: UUID) -> QueryDetailResponse:
    """
    Get query status and details.
    
    Args:
        query_id: UUID of the query
        
    Returns:
        Query details with agent states and results
        
    Raises:
        HTTPException: If query not found
    """
    if query_id not in queries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query {query_id} not found"
        )
    
    query = queries_db[query_id]
    agent_states = agent_states_db.get(query_id, [])
    search_results = search_results_db.get(query_id, [])
    research_plan = research_plans_db.get(query_id)
    
    return QueryDetailResponse(
        id=query.id,
        thread_id=query.thread_id,
        content=query.content,
        search_sources=query.search_sources,
        status=query.status,
        created_at=query.created_at.isoformat(),
        agent_states=agent_states,
        search_results=search_results,
        research_plan=research_plan
    )


@router.get("/queries/{query_id}/answer", response_model=SynthesizedAnswer)
async def get_answer(query_id: UUID) -> SynthesizedAnswer:
    """
    Get the synthesized answer for a completed query.
    
    Args:
        query_id: UUID of the query
        
    Returns:
        Synthesized answer
        
    Raises:
        HTTPException: If answer not found or not ready
    """
    if query_id not in queries_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query {query_id} not found"
        )
    
    query = queries_db[query_id]
    
    # Check if query is completed
    if query.status != QueryStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_425_TOO_EARLY,
            detail=f"Answer not ready yet. Query status: {query.status}"
        )
    
    # Find answer for this query
    answer = None
    for ans in answers_db.values():
        if ans.query_id == query_id:
            answer = ans
            break
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Answer for query {query_id} not found"
        )
    
    return answer


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/ws/{thread_id}")
async def websocket_endpoint(websocket: WebSocket, thread_id: UUID):
    """
    WebSocket connection for real-time agent updates.
    
    Message types:
    - agent_state_update: Agent status/progress changed
    - agent_message: Inter-agent communication event
    - query_status_update: Query status changed
    - answer_ready: Final answer is available
    - error: Error occurred
    
    Args:
        websocket: WebSocket connection
        thread_id: UUID of the conversation thread
    """
    # Check if thread exists
    if thread_id not in threads_db:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Thread not found")
        return
    
    await manager.connect(thread_id, websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "data": {
                "thread_id": str(thread_id),
                "message": "WebSocket connected"
            }
        })
        
        # Keep connection alive and listen for client messages
        while True:
            # Wait for any messages from client (ping/pong, etc.)
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(thread_id, websocket)
        logger.info(f"WebSocket disconnected for thread {thread_id}")
    
    except Exception as e:
        logger.error(f"WebSocket error for thread {thread_id}: {e}")
        manager.disconnect(thread_id, websocket)


# ============================================================================
# Background Task: Execute Workflow
# ============================================================================

async def execute_workflow(query: QueryModel):
    """
    Execute the research workflow for a query.
    
    This runs in the background and sends updates via WebSocket.
    
    Args:
        query: Research query to process
    """
    try:
        # Update query status
        query.status = QueryStatus.PROCESSING
        queries_db[query.id] = query
        
        # Send status update
        await manager.send_message(query.thread_id, {
            "type": "query_status_update",
            "data": {
                "query_id": str(query.id),
                "status": query.status.value
            }
        })
        
        # Create workflow instance
        workflow = ResearchWorkflow()
        
        # Define WebSocket callback
        async def ws_callback(event_type: str, data: dict):
            """Send workflow events to WebSocket."""
            await manager.send_message(query.thread_id, {
                "type": event_type,
                "data": data
            })
        
        # Execute workflow
        result = await workflow.execute_query(
            query_id=query.id,
            query_content=query.content,
            search_sources=[src.value for src in query.search_sources],
            ws_callback=ws_callback
        )
        
        # Store results
        if result.get("research_plan"):
            research_plans_db[query.id] = result["research_plan"]
        
        if result.get("search_results"):
            search_results_db[query.id] = result["search_results"]
        
        if result.get("agent_states"):
            agent_states_db[query.id] = result["agent_states"]
        
        if result.get("synthesized_answer"):
            answer = result["synthesized_answer"]
            answers_db[answer.id] = answer
            
            # Add answer to thread
            thread = threads_db[query.thread_id]
            thread.answers.append(answer.id)
        
        # Update query status
        query.status = QueryStatus.COMPLETED
        queries_db[query.id] = query
        
        # Send completion notification
        await manager.send_message(query.thread_id, {
            "type": "answer_ready",
            "data": {
                "query_id": str(query.id),
                "answer_id": str(result["synthesized_answer"].id) if result.get("synthesized_answer") else None
            }
        })
        
        logger.info(f"Workflow completed for query {query.id}")
    
    except Exception as e:
        # Update query status
        query.status = QueryStatus.FAILED
        queries_db[query.id] = query
        
        # Send error notification
        await manager.send_message(query.thread_id, {
            "type": "error",
            "data": {
                "error": "WorkflowError",
                "message": str(e),
                "query_id": str(query.id)
            }
        })
        
        logger.error(f"Workflow failed for query {query.id}: {e}")


# Export router
__all__ = ["router"]
