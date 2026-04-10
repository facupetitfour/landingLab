'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/project-store';
import { QUESTION_SEQUENCE } from '@/types/chat';
import { EMPTY_BRIEF } from '@/types/brief';
import type { ChatMessage } from '@/types/chat';
import { sendMessageAction, getProjectStateAction } from '@/app/actions/project-actions';

interface ClientChatProps {
  projectId: string;
  initialData: any;
}

export default function ClientChat({ projectId, initialData }: ClientChatProps) {
  const router = useRouter();

  const {
    currentProjectId,
    messages, setMessages, addMessage,
    status, setStatus,
    setBriefData,
    isSending, setIsSending,
    isGenerating, setIsGenerating,
    setCurrentProject,
  } = useProjectStore();

  const [inputValue, setInputValue] = useState('');
  const [initializedId, setInitializedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Keep focus on input after sending
  useEffect(() => {
    if (!isSending && !isGenerating && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1);
    }
  }, [isSending, isGenerating]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setCurrentProject(projectId);

      if (initialData.messages && initialData.messages.length > 0) {
        setMessages(initialData.messages);
      } else {
        setMessages([]);
      }
      setStatus(initialData.status as any);

      if (initialData.brief) {
        setBriefData(initialData.brief);
      } else {
        setBriefData({ ...EMPTY_BRIEF });
      }

      // If project is completed/editing redirect to results
      if (initialData.status === 'completed' || initialData.status === 'editing') {
        router.refresh();
        router.push(`/project/${projectId}/results`);
        return;
      }

      // If still in generating states, start polling
      if (['building_strategy', 'generating_copy', 'generating_html'].includes(initialData.status)) {
        setIsGenerating(true);
        startPolling();
      }

      // If welcome and no messages, trigger welcome
      if (initialData.status === 'welcome' && (!initialData.messages || initialData.messages.length === 0)) {
        try {
          const chatData = await sendMessageAction(projectId);
          if (chatData.messages && chatData.messages.length > 0) {
            const newMsgs = chatData.messages.map((content: string, i: number) => ({
              id: `welcome-${i}`,
              project_id: projectId,
              role: 'assistant' as const,
              content,
              created_at: new Date().toISOString(),
            }));
            setMessages(newMsgs);
          } else if (chatData.status && chatData.status !== 'welcome') {
            const freshData = await getProjectStateAction(projectId, Date.now());
            if (freshData.messages && freshData.messages.length > 0) {
              setMessages(freshData.messages);
            }
          }
          if (chatData.status) {
            setStatus(chatData.status as any);
          }
        } catch (error) {
          console.error("Welcome message error", error);
        }
      }

      setInitializedId(projectId);
    };

    if (initializedId !== projectId) {
      init();
    }
  }, [projectId, initialData, initializedId, setCurrentProject, setMessages, setStatus, setBriefData, setIsGenerating, router]);

  // Cleanup polling on unmount ONLY
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getProjectStateAction(projectId, Date.now());
        setMessages(data.messages || []);
        setStatus(data.status as any);

        if (data.status === 'completed' || data.status === 'editing') {
          setIsGenerating(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          window.location.href = `/project/${projectId}/results`;
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
  }, [projectId, setMessages, setStatus, setIsGenerating]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      project_id: projectId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      const data = await sendMessageAction(projectId, userMessage);

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

      if (data.status) setStatus(data.status as any);
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

  const getProgress = () => {
    if (status === 'welcome') return { step: 0, total: QUESTION_SEQUENCE.length };
    if (status === 'confirming_brief') return { step: QUESTION_SEQUENCE.length, total: QUESTION_SEQUENCE.length };
    const currentIndex = messages.filter(m => m.role === 'user').length;
    return { step: Math.min(currentIndex, QUESTION_SEQUENCE.length), total: QUESTION_SEQUENCE.length };
  };

  const progress = getProgress();

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  if (currentProjectId !== projectId) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-logo">🚀 Landing<span>Lab</span></div>
        </header>
        <div className="generating-overlay" style={{ flex: 1 }}>
          <div className="generating-spinner"></div>
          <p style={{ marginTop: '16px' }}>Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { useProjectStore.getState().resetProject(); router.push('/dashboard'); }}>
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
                autoFocus
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
