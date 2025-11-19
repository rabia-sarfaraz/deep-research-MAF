export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  status?: 'pending' | 'completed' | 'error';
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface StreamEvent {
  type: 'workflow_start' | 'agent_start' | 'agent_complete' | 'plan_created' | 
        'research_complete' | 'answer_start' | 'answer_chunk' | 'answer_complete' | 
        'workflow_complete' | 'error';
  agent?: string;
  plan?: {
    keywords: string[];
  };
  results_count?: number;
  content?: string;
  answer?: {
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
  message?: string;
}

export interface ResearchRequest {
  content: string;
  search_sources: string[];
}
