/**
 * Custom hook for WebSocket connection management.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { wsClient, WebSocketState, WebSocketEventType, type WebSocketEvent } from "../services/websocket";
import type { AgentState } from "../types/agent";
import { AgentStatus } from "../types/agent";
import { QueryStatus } from "../types/message";
import { useConversationStore } from "../store/conversationSlice";
import { useAgentStateStore } from "../store/agentSlice";

/**
 * WebSocket hook options.
 */
interface UseWebSocketOptions {
  threadId: string | null;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket hook return type.
 */
interface UseWebSocketReturn {
  state: WebSocketState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing WebSocket connection and handling events.
 */
export function useWebSocket({
  threadId,
  autoConnect = true,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions): UseWebSocketReturn {
  const [state, setState] = useState<WebSocketState>(wsClient.getState());
  const unsubscribersRef = useRef<Array<() => void>>([]);
  
  // Store actions
  const updateQueryStatus = useConversationStore((state) => state.updateQueryStatus);
  const updateMessage = useConversationStore((state) => state.updateMessage);
  const updateAgentState = useAgentStateStore((state) => state.updateAgentState);
  const setActiveAgent = useAgentStateStore((state) => state.setActiveAgent);
  const removeActiveAgent = useAgentStateStore((state) => state.removeActiveAgent);
  
  /**
   * Connect to WebSocket.
   */
  const connect = useCallback(() => {
    if (threadId) {
      wsClient.connect(threadId);
      setState(wsClient.getState());
    }
  }, [threadId]);
  
  /**
   * Disconnect from WebSocket.
   */
  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setState(wsClient.getState());
  }, []);
  
  /**
   * Handle agent state update event.
   */
  const handleAgentStateUpdate = useCallback((event: WebSocketEvent) => {
    const agentState = event.data as AgentState;
    
    // Update agent state in store
    updateAgentState(agentState.query_id, agentState);
    
    // Track active agents
    if (agentState.status === AgentStatus.RUNNING) {
      setActiveAgent(agentState.agent_id);
    } else if (agentState.status === AgentStatus.COMPLETED || agentState.status === AgentStatus.FAILED) {
      removeActiveAgent(agentState.agent_id);
    }
  }, [updateAgentState, setActiveAgent, removeActiveAgent]);
  
  /**
   * Handle query status update event.
   */
  const handleQueryStatusUpdate = useCallback((event: WebSocketEvent) => {
    const data = event.data as { query_id: string; status: string; error?: string };
    
    // Update query status in store
    updateQueryStatus(data.query_id, data.status as QueryStatus);
    
    // If error, update message with error
    if (data.error) {
      updateMessage(data.query_id, {
        type: "error",
        content: data.error
      });
    }
  }, [updateQueryStatus, updateMessage]);
  
  /**
   * Handle answer ready event.
   */
  const handleAnswerReady = useCallback((event: WebSocketEvent) => {
    const data = event.data as { 
      query_id: string; 
      answer_id: string; 
      has_results?: boolean;
      message?: string;
    };
    
    // Update query status to completed
    updateQueryStatus(data.query_id, QueryStatus.COMPLETED);
    
    // Handle empty search results
    if (data.has_results === false) {
      updateMessage(data.query_id, {
        type: "error",
        content: data.message || "검색 결과를 찾을 수 없습니다. 다른 키워드로 시도해보세요."
      });
    }
    
    console.log("Answer ready:", data);
  }, [updateQueryStatus, updateMessage]);
  
  /**
   * Handle error event.
   */
  const handleError = useCallback((event: WebSocketEvent) => {
    const data = event.data as { error: string; message: string; query_id?: string };
    
    console.error("WebSocket error event:", data);
    
    // If query_id is present, update the query status
    if (data.query_id) {
      updateQueryStatus(data.query_id, QueryStatus.FAILED);
      updateMessage(data.query_id, {
        type: "error",
        content: data.message
      });
    }
    
    if (onError) {
      onError(new Error(data.message));
    }
  }, [updateQueryStatus, updateMessage, onError]);
  
  /**
   * Handle connection established event.
   */
  const handleConnectionEstablished = useCallback(() => {
    console.log("WebSocket connection established");
    setState(WebSocketState.CONNECTED);
    
    if (onConnect) {
      onConnect();
    }
  }, [onConnect]);
  
  /**
   * Setup WebSocket event listeners.
   */
  useEffect(() => {
    // Subscribe to WebSocket events
    const unsubscribers = [
      wsClient.on(WebSocketEventType.CONNECTION_ESTABLISHED, handleConnectionEstablished),
      wsClient.on(WebSocketEventType.AGENT_STATE_UPDATE, handleAgentStateUpdate),
      wsClient.on(WebSocketEventType.QUERY_STATUS_UPDATE, handleQueryStatusUpdate),
      wsClient.on(WebSocketEventType.ANSWER_READY, handleAnswerReady),
      wsClient.on(WebSocketEventType.ERROR, handleError)
    ];
    
    unsubscribersRef.current = unsubscribers;
    
    // Cleanup on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    handleConnectionEstablished,
    handleAgentStateUpdate,
    handleQueryStatusUpdate,
    handleAnswerReady,
    handleError
  ]);
  
  /**
   * Auto-connect when threadId is available.
   */
  useEffect(() => {
    if (autoConnect && threadId && !wsClient.isConnected()) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        connect();
      }, 0);
      
      return () => clearTimeout(timer);
    }
    
    // Cleanup on unmount or threadId change
    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [threadId, autoConnect, connect, disconnect]);
  
  /**
   * Update state when WebSocket state changes.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = wsClient.getState();
      if (currentState !== state) {
        setState(currentState);
        
        // Handle state transitions
        if (currentState === WebSocketState.DISCONNECTED && onDisconnect) {
          onDisconnect();
        }
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [state, onDisconnect]);
  
  return {
    state,
    isConnected: state === WebSocketState.CONNECTED,
    connect,
    disconnect
  };
}
