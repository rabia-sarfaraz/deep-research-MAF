/**
 * ProcessingIndicator component - Shows current processing phase.
 */

import React from "react";
import { QueryStatus } from "../types/message";

interface ProcessingIndicatorProps {
  status: QueryStatus;
  activePhase?: string;
}

const STATUS_MESSAGES: Record<QueryStatus, string> = {
  [QueryStatus.PENDING]: "대기 중...",
  [QueryStatus.PROCESSING]: "처리 중...",
  [QueryStatus.COMPLETED]: "완료",
  [QueryStatus.FAILED]: "실패",
  [QueryStatus.CANCELLED]: "취소됨"
};

const PHASE_ICONS: Record<string, string> = {
  "searching": "🔍",
  "analyzing": "🧠",
  "generating": "✍️",
  "planning": "📋",
  "researching": "📚",
  "reflecting": "🤔",
  "writing": "📝"
};

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  status,
  activePhase
}) => {
  if (status === QueryStatus.COMPLETED || status === QueryStatus.FAILED || status === QueryStatus.CANCELLED) {
    return null;
  }
  
  const phases = ["planning", "researching", "reflecting", "writing"];
  const currentPhaseIndex = activePhase ? phases.indexOf(activePhase.toLowerCase()) : -1;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-sm font-medium text-blue-900">
          {STATUS_MESSAGES[status]}
        </span>
      </div>
      
      {activePhase && (
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <span className="text-lg">
            {PHASE_ICONS[activePhase.toLowerCase()] || "⚙️"}
          </span>
          <span>
            {activePhase === "planning" && "연구 계획 수립 중..."}
            {activePhase === "researching" && "자료 검색 및 분석 중..."}
            {activePhase === "reflecting" && "내용 검토 및 검증 중..."}
            {activePhase === "writing" && "답변 작성 중..."}
            {!phases.includes(activePhase.toLowerCase()) && `${activePhase} 작업 중...`}
          </span>
        </div>
      )}
      
      {/* Phase Progress */}
      {currentPhaseIndex >= 0 && (
        <div className="mt-3 flex gap-1">
          {phases.map((phase, index) => (
            <div
              key={phase}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentPhaseIndex
                  ? "bg-blue-500"
                  : "bg-blue-200"
              }`}
              title={phase}
            />
          ))}
        </div>
      )}
    </div>
  );
};
