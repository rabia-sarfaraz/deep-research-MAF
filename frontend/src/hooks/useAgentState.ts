/**
 * Custom hook for agent state management and queries.
 */

import { useMemo } from "react";
import { useAgentStateStore } from "../store/agentSlice";
import { AGENT_METADATA, AgentId, AgentStatus } from "../types/agent";

/**
 * Agent state summary for UI display.
 */
export interface AgentStateSummary {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: AgentStatus;
  progress: number;
  currentTask: string | null;
  error: string | null;
  isActive: boolean;
  isExpanded: boolean;
}

/**
 * Hook options.
 */
interface UseAgentStateOptions {
  queryId: string | null;
}

/**
 * Hook return type.
 */
interface UseAgentStateReturn {
  agents: AgentStateSummary[];
  activeAgents: AgentId[];
  completedAgents: AgentId[];
  failedAgents: AgentId[];
  currentAgent: AgentStateSummary | null;
  overallProgress: number;
  isProcessing: boolean;
  hasErrors: boolean;
  
  // Actions
  toggleAgent: (agentId: AgentId) => void;
  expandAgent: (agentId: AgentId) => void;
  collapseAgent: (agentId: AgentId) => void;
  collapseAll: () => void;
}

/**
 * Custom hook for agent state management.
 * Provides agent status, progress, and UI state management.
 */
export function useAgentState({ queryId }: UseAgentStateOptions): UseAgentStateReturn {
  // Get store state
  const agentStates = useAgentStateStore((state) => 
    queryId ? state.agentStates[queryId] || [] : []
  );
  const expandedAgents = useAgentStateStore((state) => state.expandedAgents);
  const activeAgents = useAgentStateStore((state) => Array.from(state.activeAgents));
  
  // Get store actions
  const toggleExpandedAgent = useAgentStateStore((state) => state.toggleExpandedAgent);
  const setExpandedAgent = useAgentStateStore((state) => state.setExpandedAgent);
  const collapseAllAgents = useAgentStateStore((state) => state.collapseAllAgents);
  
  /**
   * Build agent summaries with metadata and state.
   */
  const agents = useMemo<AgentStateSummary[]>(() => {
    return Object.values(AgentId).map((agentId) => {
      const metadata = AGENT_METADATA[agentId];
      const state = agentStates.find((s) => s.agent_id === agentId);
      
      return {
        id: agentId,
        name: metadata.name,
        description: metadata.description,
        icon: metadata.icon || "🤖",
        color: metadata.color || "#666666",
        status: state?.status || AgentStatus.IDLE,
        progress: state?.progress || 0,
        currentTask: state?.current_task || null,
        error: state?.error || null,
        isActive: activeAgents.includes(agentId),
        isExpanded: expandedAgents.has(agentId)
      };
    });
  }, [agentStates, expandedAgents, activeAgents]);
  
  /**
   * Get completed agents.
   */
  const completedAgents = useMemo(() => {
    return agents
      .filter((a) => a.status === AgentStatus.COMPLETED)
      .map((a) => a.id);
  }, [agents]);
  
  /**
   * Get failed agents.
   */
  const failedAgents = useMemo(() => {
    return agents
      .filter((a) => a.status === AgentStatus.FAILED)
      .map((a) => a.id);
  }, [agents]);
  
  /**
   * Get currently active agent.
   */
  const currentAgent = useMemo(() => {
    return agents.find((a) => a.isActive) || null;
  }, [agents]);
  
  /**
   * Calculate overall progress.
   * Average of all agent progress values.
   */
  const overallProgress = useMemo(() => {
    if (agents.length === 0) return 0;
    
    const totalProgress = agents.reduce((sum, agent) => sum + agent.progress, 0);
    return totalProgress / agents.length;
  }, [agents]);
  
  /**
   * Check if any agent is currently processing.
   */
  const isProcessing = useMemo(() => {
    return agents.some(
      (a) => a.status === AgentStatus.RUNNING || a.status === AgentStatus.WAITING
    );
  }, [agents]);
  
  /**
   * Check if any agent has errors.
   */
  const hasErrors = useMemo(() => {
    return failedAgents.length > 0;
  }, [failedAgents]);
  
  /**
   * Toggle agent expanded state.
   */
  const toggleAgent = (agentId: AgentId) => {
    toggleExpandedAgent(agentId);
  };
  
  /**
   * Expand agent details.
   */
  const expandAgent = (agentId: AgentId) => {
    setExpandedAgent(agentId, true);
  };
  
  /**
   * Collapse agent details.
   */
  const collapseAgent = (agentId: AgentId) => {
    setExpandedAgent(agentId, false);
  };
  
  /**
   * Collapse all agents.
   */
  const collapseAll = () => {
    collapseAllAgents();
  };
  
  return {
    agents,
    activeAgents,
    completedAgents,
    failedAgents,
    currentAgent,
    overallProgress,
    isProcessing,
    hasErrors,
    toggleAgent,
    expandAgent,
    collapseAgent,
    collapseAll
  };
}
