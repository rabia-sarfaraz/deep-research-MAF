/**
 * MessageList component for displaying chat messages.
 */

import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/message";
import { SourceList } from "./SourceList";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">대화를 시작해보세요</p>
          <p className="text-sm">
            연구 질문을 입력하면 멀티에이전트가 답변을 찾아드립니다.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message) => (
        <div key={message.id}>
          {message.type === "query" && (
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-3 shadow-sm">
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className="text-xs text-blue-100 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR")}
                </p>
              </div>
            </div>
          )}
          
          {message.type === "answer" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                {/* Agent Icon */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    AI
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Deep Research Agent
                  </span>
                </div>
                
                {/* Answer Content */}
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />")
                  }}
                />
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <SourceList sources={message.sources} />
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR")}
                </p>
              </div>
            </div>
          )}
          
          {message.type === "error" && (
            <div className="flex justify-center">
              <div className="max-w-[80%] bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold">오류 발생</span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm text-gray-600">에이전트가 답변을 생성중입니다...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
