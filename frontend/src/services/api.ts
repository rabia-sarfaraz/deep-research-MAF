/**
 * REST API client for backend communication.
 */

import type {
  ConversationThread,
  ResearchQuery
} from "../types/message";
import { SearchSource } from "../types/message";
import type { AgentState } from "../types/agent";
import type { SearchResult, SynthesizedAnswer } from "../types/search";

/**
 * API configuration.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * API error class.
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  
  constructor(
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Handle API response and errors.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.details
    );
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

/**
 * Request body types.
 */
export interface CreateThreadRequest {
  session_id: string;
}

export interface CreateQueryRequest {
  content: string;
  search_sources: SearchSource[];
}

/**
 * Response types.
 */
export interface ThreadDetailResponse {
  id: string;
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  queries: ResearchQuery[];
  answers: SynthesizedAnswer[];
}

export interface QueryDetailResponse extends ResearchQuery {
  agent_states: AgentState[];
  search_results: SearchResult[];
  research_plan: Record<string, unknown> | null;
}

/**
 * REST API client class.
 */
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 60000; // 60 seconds for long-running research queries
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Make a request to the API with timeout handling.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    
    const timeout = timeoutMs || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError(
          "Request timeout",
          408,
          `Request to ${endpoint} timed out after ${timeout}ms`
        );
      }
      
      throw error;
    }
  }
  
  // ============================================================================
  // Thread Management
  // ============================================================================
  
  /**
   * Create a new conversation thread.
   */
  async createThread(sessionId: string): Promise<ConversationThread> {
    return this.request<ConversationThread>("/threads", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId })
    });
  }
  
  /**
   * Get thread details with queries and answers.
   */
  async getThread(threadId: string): Promise<ThreadDetailResponse> {
    return this.request<ThreadDetailResponse>(`/threads/${threadId}`);
  }
  
  /**
   * Close a thread.
   */
  async closeThread(threadId: string): Promise<void> {
    return this.request<void>(`/threads/${threadId}`, {
      method: "DELETE"
    });
  }
  
  // ============================================================================
  // Query Management
  // ============================================================================
  
  /**
   * Submit a new research query.
   */
  async submitQuery(
    threadId: string,
    content: string,
    searchSources: SearchSource[]
  ): Promise<ResearchQuery> {
    return this.request<ResearchQuery>(`/threads/${threadId}/queries`, {
      method: "POST",
      body: JSON.stringify({
        content,
        search_sources: searchSources
      })
    });
  }
  
  /**
   * Get query status and details.
   */
  async getQuery(queryId: string): Promise<QueryDetailResponse> {
    return this.request<QueryDetailResponse>(`/queries/${queryId}`);
  }
  
  /**
   * Get synthesized answer for a query.
   */
  async getAnswer(queryId: string): Promise<SynthesizedAnswer> {
    return this.request<SynthesizedAnswer>(`/queries/${queryId}/answer`);
  }
  
  // ============================================================================
  // Health Check
  // ============================================================================
  
  /**
   * Check API health.
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    return this.request<{ status: string; service: string; version: string }>("/health");
  }
}

/**
 * Singleton API client instance.
 */
export const apiClient = new ApiClient();

/**
 * Export default instance.
 */
export default apiClient;
