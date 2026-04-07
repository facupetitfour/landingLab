'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProjectStore } from '@/store/project-store';
import { QUESTION_SEQUENCE } from '@/types/chat';
import type { ChatMessage } from '@/types/chat';

export default function ChatBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, isLoaded } = useUser();

  const {
    messages, setMessages, addMessage,
    status, setStatus,
    briefData, setBriefData,
    isSending, setIsSending,
    isGenerating, setIsGenerating,
    setCurrentProject,
  } = useProjectStore();

  const [inputValue, setInputValue] = useState('');
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize
  useEffect(() => {
    if (!isLoaded || !user) return;

    const init = async () => {
      setCurrentProject(projectId);

      // Load project state
      const res = await fetch(`/api/generate?project_id=${projectId}`);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
      setStatus(data.status);

      // If project is completed/editing redirect to results
      if (data.status === 'completed' || data.status === 'editing') {
        router.push(`/project/${projectId}/results`);
        return;
      }

      // If still in generating states, start polling
      if (['building_strategy', 'generating_copy', 'generating_html'].includes(data.status)) {
        setIsGenerating(true);
        startPolling();
      }

      // If welcome and no messages, trigger welcome
      if (data.status === 'welcome' && (!data.messages || data.messages.length === 0)) {
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId }),
        });
        const chatData = await chatRes.json();
        if (chatData.messages) {
          const newMsgs = chatData.messages.map((content: string, i: number) => ({
            id: `welcome-${i}`,
            project_id: projectId,
            role: 'assistant' as const,
            content,
            created_at: new Date().toISOString(),
          }));
          setMessages(newMsgs);
        }
      }

      setInitialized(true);
    };
    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectId, isLoaded, user]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/generate?project_id=${projectId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setStatus(data.status);

      if (data.status === 'completed') {
        setIsGenerating(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
        router.push(`/project/${projectId}/results`);
      }
    }, 2000);
  }, [projectId]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending || !user) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      project_id: projectId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, message: userMessage }),
      });
      const data = await res.json();

      if (data.messages) {
        data.messages.forEach((content: string, i: number) => {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}-${i}`,
            project_id: projectId,
            role: 'assistant',
            content,
            created_at: new Date().toISOString(),
          };
          addMessage(assistantMsg);
        });
      }

      if (data.status) setStatus(data.status);
      if (data.brief) setBriefData(data.brief);

      if (data.shouldGenerate) {
        setIsGenerating(true);
        startPolling();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      addMessage({
        id: `error-${Date.now()}`,
        project_id: projectId,
        role: 'assistant',
        content: '❌ Error al enviar el mensaje. Intentá de nuevo.',
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (status === 'welcome') return { step: 0, total: QUESTION_SEQUENCE.length };
    if (status === 'confirming_brief') return { step: QUESTION_SEQUENCE.length, total: QUESTION_SEQUENCE.length };
    const currentIndex = messages.filter(m => m.role === 'user').length;
    return { step: Math.min(currentIndex, QUESTION_SEQUENCE.length), total: QUESTION_SEQUENCE.length };
  };

  const progress = getProgress();

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering for bold and line breaks
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
            ← Proyectos
          </button>
          <div className="app-header-logo">
            🚀 Landing<span>Lab</span>
          </div>
        </div>

        {!isGenerating && status !== 'welcome' && (
          <div className="progress-bar">
            <div className="progress-dot"></div>
            Pregunta {progress.step} de {progress.total}
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble-${msg.role}`}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            ))}

            {isSending && (
              <div className="chat-bubble chat-bubble-assistant" style={{ opacity: 0.6 }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>Pensando</span>
                  <span className="generating-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="generating-overlay">
                <div className="generating-spinner"></div>
                <div className="generating-steps">
                  <div className={`generating-step ${(status as string) === 'building_strategy' ? 'active' : 'done'}`}>
                    🔍 Analizando tu producto...
                  </div>
                  <div className={`generating-step ${status === 'generating_copy' ? 'active' : status === 'generating_html' || status === 'completed' ? 'done' : ''}`}>
                    ✍️ Escribiendo copy...
                  </div>
                  <div className={`generating-step ${status === 'generating_html' ? 'active' : status === 'completed' ? 'done' : ''}`}>
                    🏗️ Armando HTML...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!isGenerating && (
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="input"
                placeholder="Escribí tu respuesta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                rows={1}
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={isSending || !inputValue.trim()}
              >
                ↑
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
