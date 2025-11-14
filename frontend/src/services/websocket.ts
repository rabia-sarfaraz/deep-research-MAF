/**
 * WebSocket client for real-time agent updates.
 */

import type { AgentState } from "../types/agent";

/**
 * WebSocket configuration.
 */
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

/**
 * WebSocket event types.
 */
export const WebSocketEventType = {
  CONNECTION_ESTABLISHED: "connection_established",
  AGENT_STATE_UPDATE: "agent_state_update",
  AGENT_MESSAGE: "agent_message",
  QUERY_STATUS_UPDATE: "query_status_update",
  ANSWER_READY: "answer_ready",
  ERROR: "error"
} as const;

export type WebSocketEventType = typeof WebSocketEventType[keyof typeof WebSocketEventType];

/**
 * WebSocket event interfaces.
 */
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType | string;
  data: T;
}

export interface AgentStateUpdateEvent {
  type: typeof WebSocketEventType.AGENT_STATE_UPDATE;
  data: AgentState;
}

export interface QueryStatusUpdateEvent {
  type: typeof WebSocketEventType.QUERY_STATUS_UPDATE;
  data: {
    query_id: string;
    status: string;
    error?: string;
  };
}

export interface AnswerReadyEvent {
  type: typeof WebSocketEventType.ANSWER_READY;
  data: {
    query_id: string;
    answer_id: string;
  };
}

export interface ErrorEvent {
  type: typeof WebSocketEventType.ERROR;
  data: {
    error: string;
    message: string;
    query_id?: string;
  };
}

/**
 * WebSocket event handler type.
 */
export type WebSocketEventHandler = (event: WebSocketEvent) => void;

/**
 * WebSocket connection state.
 */
export const WebSocketState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error"
} as const;

export type WebSocketState = typeof WebSocketState[keyof typeof WebSocketState];

/**
 * WebSocket client class.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private threadId: string | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  
  /**
   * Connect to WebSocket for a thread.
   */
  connect(threadId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn("WebSocket already connected");
      return;
    }
    
    this.threadId = threadId;
    this.state = WebSocketState.CONNECTING;
    
    const url = `${WS_BASE_URL}/ws/${threadId}`;
    this.ws = new WebSocket(url);
    
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }
  
  /**
   * Disconnect from WebSocket.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.threadId = null;
      this.state = WebSocketState.DISCONNECTED;
      this.reconnectAttempts = 0;
    }
  }
  
  /**
   * Get current connection state.
   */
  getState(): WebSocketState {
    return this.state;
  }
  
  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }
  
  /**
   * Subscribe to WebSocket events.
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
  
  /**
   * Send message to WebSocket (ping/pong).
   */
  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error("WebSocket not connected");
    }
  }
  
  /**
   * Handle WebSocket open event.
   */
  private handleOpen(): void {
    console.log("WebSocket connected");
    this.state = WebSocketState.CONNECTED;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Handle WebSocket message event.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WebSocketEvent;
      this.emit(data.type, data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }
  
  /**
   * Handle WebSocket error event.
   */
  private handleError(event: Event): void {
    console.error("WebSocket error:", event);
    this.state = WebSocketState.ERROR;
  }
  
  /**
   * Handle WebSocket close event.
   */
  private handleClose(event: CloseEvent): void {
    console.log("WebSocket closed:", event.code, event.reason);
    this.state = WebSocketState.DISCONNECTED;
    
    // Attempt to reconnect if not intentionally closed
    if (
      event.code !== 1000 &&
      this.reconnectAttempts < this.maxReconnectAttempts &&
      this.threadId
    ) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      
      setTimeout(() => {
        if (this.threadId) {
          this.connect(this.threadId);
        }
      }, delay);
    }
  }
  
  /**
   * Emit event to all registered handlers.
   */
  private emit(eventType: string, event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in WebSocket event handler:", error);
        }
      });
    }
    
    // Also emit to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error("Error in WebSocket wildcard handler:", error);
        }
      });
    }
  }
}

/**
 * Singleton WebSocket client instance.
 */
export const wsClient = new WebSocketClient();

/**
 * Export default instance.
 */
export default wsClient;
