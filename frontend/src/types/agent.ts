/**
 * Agent-related type definitions (mirrors backend models).
 */

/**
 * Agent identifiers matching backend AgentId enum.
 */
export enum AgentId {
  PLANNING = "planning_agent",
  RESEARCH = "research_agent",
  REFLECT = "reflect_agent",
  CONTENT = "content_writing_agent"
}

/**
 * Agent status matching backend AgentStatus enum.
 */
export enum AgentStatus {
  IDLE = "idle",
  RUNNING = "running",
  WAITING = "waiting",
  COMPLETED = "completed",
  FAILED = "failed"
}

/**
 * Agent state for tracking progress and status.
 * Mirrors backend AgentState model.
 */
export interface AgentState {
  id: string;
  agent_id: AgentId;
  query_id: string;
  status: AgentStatus;
  progress: number; // 0.0 to 1.0
  current_task: string | null;
  intermediate_result: Record<string, any> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Agent metadata for UI display.
 */
export interface AgentMetadata {
  id: AgentId;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

/**
 * Standard agent metadata for all 4 agents.
 */
export const AGENT_METADATA: Record<AgentId, AgentMetadata> = {
  [AgentId.PLANNING]: {
    id: AgentId.PLANNING,
    name: "Planning Agent",
    description: "Creates research strategy and search plan",
    icon: "🎯",
    color: "#3B82F6" // blue
  },
  [AgentId.RESEARCH]: {
    id: AgentId.RESEARCH,
    name: "Research Agent",
    description: "Executes searches and gathers information",
    icon: "🔍",
    color: "#10B981" // green
  },
  [AgentId.REFLECT]: {
    id: AgentId.REFLECT,
    name: "Reflect Agent",
    description: "Analyzes completeness and suggests improvements",
    icon: "💡",
    color: "#F59E0B" // amber
  },
  [AgentId.CONTENT]: {
    id: AgentId.CONTENT,
    name: "Content Writing Agent",
    description: "Synthesizes final answer with citations",
    icon: "✍️",
    color: "#8B5CF6" // purple
  }
};
