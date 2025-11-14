/**
 * SourceList component for displaying search result sources with citations.
 */

import React from "react";
import type { SourceCitation } from "../types/message";

interface SourceListProps {
  sources: SourceCitation[];
  onSourceClick?: (source: SourceCitation) => void;
}

export const SourceList: React.FC<SourceListProps> = ({
  sources,
  onSourceClick
}) => {
  if (sources.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        📚 출처 ({sources.length})
      </h3>
      
      <div className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Citation Number */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs font-semibold rounded">
              {source.citation_number}
            </div>
            
            {/* Source Content */}
            <div className="flex-1 min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onSourceClick?.(source)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate"
              >
                {source.title}
              </a>
              
              <p className="text-xs text-gray-500 mt-1 truncate">
                {source.url}
              </p>
            </div>
            
            {/* External Link Icon */}
            <div className="flex-shrink-0">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
