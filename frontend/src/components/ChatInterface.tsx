import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Message } from '../types';
import { streamResearch } from '../services/api';
import { MessageBubble } from './MessageBubble';
import { StatusIndicator } from './StatusIndicator';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'completed',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';
    let assistantSources: Message['sources'] = [];

    try {
      // Create initial assistant message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        status: 'pending',
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      for await (const event of streamResearch({
        content: userMessage.content,
        search_sources: ['google'],
      })) {
        switch (event.type) {
          case 'workflow_start':
            setStatusMessage('🚀 Starting research workflow...');
            break;
          
          case 'agent_start':
            setStatusMessage(`⚡ ${event.agent}: Processing...`);
            break;
          
          case 'agent_complete':
            setStatusMessage(`✅ ${event.agent}: Completed`);
            break;
          
          case 'plan_created':
            setStatusMessage('📋 Research plan created');
            break;
          
          case 'research_complete':
            setStatusMessage(`🔎 Found ${event.results_count || 0} results`);
            break;
          
          case 'answer_start':
            setStatusMessage('📝 Generating answer...');
            break;
          
          case 'answer_chunk':
            if (event.content) {
              assistantContent += event.content;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
            break;
          
          case 'answer_complete':
            if (event.answer?.sources) {
              assistantSources = event.answer.sources;
            }
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: assistantContent,
                      sources: assistantSources,
                      isStreaming: false,
                      status: 'completed'
                    }
                  : msg
              )
            );
            break;
          
          case 'workflow_complete':
            setStatusMessage('');
            break;
          
          case 'error':
            setStatusMessage(`❌ Error: ${event.message || 'Unknown error'}`);
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: assistantContent || 'An error occurred during research.',
                      isStreaming: false,
                      status: 'error'
                    }
                  : msg
              )
            );
            break;
        }
      }
    } catch (error) {
      console.error('Error during streaming:', error);
      setStatusMessage('');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId
            ? { 
                ...msg, 
                content: 'Sorry, an error occurred while processing your request.',
                isStreaming: false,
                status: 'error'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">🔍</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Deep Researcher</h1>
            <p className="text-sm text-gray-500">AI-powered research assistant</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white text-4xl">🔍</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to Deep Researcher
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-md">
                Ask me anything and I'll conduct thorough research to provide you with comprehensive answers.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-md">
                <button
                  onClick={() => setInput("What are the latest developments in quantum computing?")}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-left hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-gray-700">What are the latest developments in quantum computing?</span>
                </button>
                <button
                  onClick={() => setInput("Explain the impact of AI on healthcare")}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-left hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-gray-700">Explain the impact of AI on healthcare</span>
                </button>
                <button
                  onClick={() => setInput("What is the current state of renewable energy?")}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-left hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <span className="text-gray-700">What is the current state of renewable energy?</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {statusMessage && (
                <div className="flex justify-start">
                  <StatusIndicator status={statusMessage} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a research question..."
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 max-h-32 scrollbar-hide"
                style={{ minHeight: '48px' }}
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                {input.length}/2000
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
