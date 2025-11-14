/**
 * Conversation state management with Zustand.
 * Manages threads, queries, and chat messages.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  ConversationThread,
  ResearchQuery,
  ChatMessage
} from "../types/message";
import { QueryStatus, ThreadStatus } from "../types/message";

/**
 * Conversation state interface.
 */
interface ConversationState {
  // Current thread
  currentThread: ConversationThread | null;
  
  // All threads (for session)
  threads: ConversationThread[];
  
  // Queries by thread ID
  queries: Record<string, ResearchQuery[]>;
  
  // Chat messages for UI display
  messages: ChatMessage[];
  
  // Loading states
  isCreatingThread: boolean;
  isSubmittingQuery: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setCurrentThread: (thread: ConversationThread | null) => void;
  addThread: (thread: ConversationThread) => void;
  updateThreadStatus: (threadId: string, status: ThreadStatus) => void;
  
  addQuery: (query: ResearchQuery) => void;
  updateQueryStatus: (queryId: string, status: QueryStatus) => void;
  
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  
  setIsCreatingThread: (isCreating: boolean) => void;
  setIsSubmittingQuery: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  
  // Helper actions
  getQueriesForThread: (threadId: string) => ResearchQuery[];
  getCurrentQuery: () => ResearchQuery | null;
  
  reset: () => void;
}

/**
 * Initial state values.
 */
const initialState = {
  currentThread: null,
  threads: [],
  queries: {},
  messages: [],
  isCreatingThread: false,
  isSubmittingQuery: false,
  error: null
};

/**
 * Conversation store with Zustand.
 */
export const useConversationStore = create<ConversationState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Thread management
      setCurrentThread: (thread) =>
        set({ currentThread: thread }, false, "setCurrentThread"),
      
      addThread: (thread) =>
        set(
          (state) => ({
            threads: [...state.threads, thread],
            currentThread: thread
          }),
          false,
          "addThread"
        ),
      
      updateThreadStatus: (threadId, status) =>
        set(
          (state) => ({
            threads: state.threads.map((t) =>
              t.id === threadId ? { ...t, status, updated_at: new Date().toISOString() } : t
            ),
            currentThread:
              state.currentThread?.id === threadId
                ? { ...state.currentThread, status, updated_at: new Date().toISOString() }
                : state.currentThread
          }),
          false,
          "updateThreadStatus"
        ),
      
      // Query management
      addQuery: (query) =>
        set(
          (state) => {
            const threadQueries = state.queries[query.thread_id] || [];
            return {
              queries: {
                ...state.queries,
                [query.thread_id]: [...threadQueries, query]
              }
            };
          },
          false,
          "addQuery"
        ),
      
      updateQueryStatus: (queryId, status) =>
        set(
          (state) => {
            const newQueries = { ...state.queries };
            for (const threadId in newQueries) {
              newQueries[threadId] = newQueries[threadId].map((q) =>
                q.id === queryId ? { ...q, status, updated_at: new Date().toISOString() } : q
              );
            }
            return { queries: newQueries };
          },
          false,
          "updateQueryStatus"
        ),
      
      // Message management
      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages, message]
          }),
          false,
          "addMessage"
        ),
      
      updateMessage: (messageId, updates) =>
        set(
          (state) => ({
            messages: state.messages.map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            )
          }),
          false,
          "updateMessage"
        ),
      
      clearMessages: () =>
        set({ messages: [] }, false, "clearMessages"),
      
      // Loading states
      setIsCreatingThread: (isCreating) =>
        set({ isCreatingThread: isCreating }, false, "setIsCreatingThread"),
      
      setIsSubmittingQuery: (isSubmitting) =>
        set({ isSubmittingQuery: isSubmitting }, false, "setIsSubmittingQuery"),
      
      setError: (error) =>
        set({ error }, false, "setError"),
      
      // Helper actions
      getQueriesForThread: (threadId) => {
        const state = get();
        return state.queries[threadId] || [];
      },
      
      getCurrentQuery: () => {
        const state = get();
        if (!state.currentThread) return null;
        
        const threadQueries = state.queries[state.currentThread.id] || [];
        return threadQueries.length > 0 ? threadQueries[threadQueries.length - 1] : null;
      },
      
      // Reset state
      reset: () =>
        set(initialState, false, "reset")
    }),
    {
      name: "conversation-store",
      enabled: import.meta.env.DEV
    }
  )
);

/**
 * Selector hooks for common queries.
 */
export const useCurrentThread = () =>
  useConversationStore((state) => state.currentThread);

export const useMessages = () =>
  useConversationStore((state) => state.messages);

export const useIsSubmitting = () =>
  useConversationStore((state) => state.isSubmittingQuery);

export const useConversationError = () =>
  useConversationStore((state) => state.error);
