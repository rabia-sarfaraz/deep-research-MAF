/**
 * Store index - exports all Zustand stores and hooks.
 */

// Conversation store
export {
  useConversationStore,
  useCurrentThread,
  useMessages,
  useIsSubmitting,
  useConversationError
} from "./conversationSlice";

// Agent state store
export {
  useAgentStateStore,
  useAgentStatesForQuery,
  useActiveAgents,
  useIsAgentExpanded,
  useAgentProgress
} from "./agentSlice";

// Re-export types for convenience
export type { ConversationThread, ResearchQuery, ChatMessage } from "../types/message";
export type { AgentState } from "../types/agent";
export { QueryStatus, ThreadStatus } from "../types/message";
export { AgentId, AgentStatus } from "../types/agent";
