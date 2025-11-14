/**
 * ChatInterface component - Main container for the research chat interface.
 */

import React, { useEffect, useState } from "react";
import { InputBox } from "./InputBox";
import { MessageList } from "./MessageList";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { useConversationStore } from "../store/conversationSlice";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAgentState } from "../hooks/useAgentState";
import { apiClient } from "../services/api";
import { SearchSource, QueryStatus } from "../types/message";
import { AgentStatus } from "../types/agent";

// Agent status color mapping
const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "text-gray-400",
  running: "text-blue-500 animate-pulse",
  waiting: "text-yellow-500",
  completed: "text-green-500",
  failed: "text-red-500",
};

export const ChatInterface: React.FC = () => {
  const [inputDisabled, setInputDisabled] = useState(false);
  
  const currentThread = useConversationStore((state) => state.currentThread);
  const messages = useConversationStore((state) => state.messages);
  const isSubmittingQuery = useConversationStore((state) => state.isSubmittingQuery);
  const error = useConversationStore((state) => state.error);
  
  const addThread = useConversationStore((state) => state.addThread);
  const setCurrentThread = useConversationStore((state) => state.setCurrentThread);
  const addQuery = useConversationStore((state) => state.addQuery);
  const addMessage = useConversationStore((state) => state.addMessage);
  
  const { agents: agentSummaries, isProcessing } = useAgentState({ 
    queryId: currentThread?.id || null 
  });
  
  // Initialize WebSocket connection
  useWebSocket({ threadId: currentThread?.id || null });
  
  // Create initial thread on mount
  useEffect(() => {
    if (!currentThread) {
      const initThread = async () => {
        try {
          const thread = await apiClient.createThread("session-" + Date.now());
          addThread(thread);
          setCurrentThread(thread);
        } catch (err) {
          console.error("Failed to create thread:", err);
        }
      };
      initThread();
    }
  }, [currentThread, addThread, setCurrentThread]);
  
  const handleSubmit = async (content: string, searchSources: SearchSource[]) => {
    if (!currentThread || inputDisabled) return;
    
    try {
      setInputDisabled(true);
      
      // Add query message to UI
      addMessage({
        id: `msg-${Date.now()}`,
        type: "query",
        content,
        timestamp: new Date().toISOString(),
      });
      
      // Submit query to backend
      const query = await apiClient.submitQuery(
        currentThread.id,
        content,
        searchSources
      );
      
      addQuery(query);
      
    } catch (err) {
      console.error("Failed to submit query:", err);
      
      // Generate user-friendly error messages
      let errorMessage = "질문 제출에 실패했습니다. 다시 시도해주세요.";
      
      if (err instanceof Error) {
        if (err.message.includes("timeout") || err.message.includes("408")) {
          errorMessage = "요청 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.";
        } else if (err.message.includes("Network") || err.message.includes("Failed to fetch")) {
          errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
        } else if (err.message.includes("404")) {
          errorMessage = "요청한 리소스를 찾을 수 없습니다.";
        } else if (err.message.includes("500")) {
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
      }
      
      addMessage({
        id: `msg-${Date.now()}`,
        type: "error",
        content: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setInputDisabled(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Deep Researcher
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                멀티에이전트 기반 심층 연구 어시스턴트
              </p>
            </div>
            
            {/* Thread Status */}
            {currentThread && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Thread ID</p>
                  <p className="text-sm font-mono text-gray-700">
                    {currentThread.id.substring(0, 8)}...
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentThread.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                  title={currentThread.status}
                />
              </div>
            )}
          </div>
        </header>
        
        {/* Processing Indicator */}
        {isProcessing && agentSummaries.length > 0 && (
          <div className="px-4 pt-4">
            <ProcessingIndicator
              status={QueryStatus.PROCESSING}
              activePhase={
                agentSummaries.find(a => a.isActive)?.name.toLowerCase() || undefined
              }
            />
          </div>
        )}
        
        {/* Message List */}
        <MessageList messages={messages} isLoading={isSubmittingQuery || isProcessing} />
        
        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        {/* Input Box */}
        <div className="border-t border-gray-200 bg-white p-4">
          <InputBox
            onSubmit={handleSubmit}
            isLoading={isSubmittingQuery || isProcessing}
            disabled={inputDisabled || !currentThread}
            placeholder="연구 질문을 입력하세요..."
          />
        </div>
      </div>
      
      {/* Agent Monitoring Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">에이전트 상태</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {agentSummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-10 w-10 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-sm">대기 중</p>
            </div>
          ) : (
            agentSummaries.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{agent.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`${
                      AGENT_STATUS_COLORS[agent.status]
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {agent.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${agent.progress * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-right">
                      {Math.round(agent.progress * 100)}%
                    </p>
                  </div>
                )}
                
                {/* Current Task */}
                {agent.currentTask && (
                  <p className="text-xs text-gray-700 mt-2">
                    {agent.currentTask}
                  </p>
                )}
                
                {/* Error Message */}
                {agent.error && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ {agent.error}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};
