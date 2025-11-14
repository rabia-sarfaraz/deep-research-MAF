/**
 * InputBox component for submitting research queries.
 */

import React, { useState, useRef, useEffect } from "react";
import { SearchSource } from "../types/message";

interface InputBoxProps {
  onSubmit: (content: string, searchSources: SearchSource[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "연구 질문을 입력하세요..."
}) => {
  const [content, setContent] = useState("");
  const [searchSources, setSearchSources] = useState<SearchSource[]>([
    SearchSource.GOOGLE,
    SearchSource.ARXIV
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);
  
  const handleSubmit = () => {
    if (!content.trim() || isLoading || disabled) return;
    if (searchSources.length === 0) {
      alert("최소 하나의 검색 소스를 선택해주세요.");
      return;
    }
    
    onSubmit(content.trim(), searchSources);
    setContent("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const toggleSearchSource = (source: SearchSource) => {
    setSearchSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };
  
  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Search Source Toggles */}
      <div className="mb-3 flex gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchSources.includes(SearchSource.GOOGLE)}
            onChange={() => toggleSearchSource(SearchSource.GOOGLE)}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Google 검색</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={searchSources.includes(SearchSource.ARXIV)}
            onChange={() => toggleSearchSource(SearchSource.ARXIV)}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">arXiv 논문</span>
        </label>
      </div>
      
      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ maxHeight: "200px" }}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading || disabled || searchSources.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              처리중
            </span>
          ) : (
            "전송"
          )}
        </button>
      </div>
      
      {/* Character Count */}
      <div className="mt-2 text-right text-xs text-gray-500">
        {content.length} / 2000
      </div>
    </div>
  );
};
