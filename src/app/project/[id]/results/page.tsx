'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProjectStore } from '@/store/project-store';
import { ARCHETYPE_LABELS, SKELETON_LABELS, type MarketArchetype, type SkeletonType } from '@/types/strategy';
import { COPY_SECTION_LABELS, type CopyData } from '@/types/copy';
import type { LandingCopy } from '@/types/landing';
import type { StrategyData } from '@/types/strategy';
import type { ChatMessage } from '@/types/chat';

const PREDEFINED_THEMES: Record<string, { primary: string, secondary: string, bgLight: string, text: string }> = {
  'theme-green': { primary: '#22c55e', secondary: '#166534', bgLight: '#f8fafc', text: '#334155' },
  'theme-blue': { primary: '#3b82f6', secondary: '#1e40af', bgLight: '#f0f9ff', text: '#1e293b' },
  'theme-red': { primary: '#ef4444', secondary: '#991b1b', bgLight: '#fef2f2', text: '#450a0a' },
  'theme-purple': { primary: '#a855f7', secondary: '#6b21a8', bgLight: '#faf5ff', text: '#3b0764' },
  'theme-gold': { primary: '#eab308', secondary: '#854d0e', bgLight: '#fefce8', text: '#422006' },
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, isLoaded } = useUser();

  const {
    activeTab, setActiveTab,
    messages, setMessages,
    strategyData, setStrategyData,
    copyData, setCopyData,
    htmlContent, setHtmlContent,
    activeVersion, setActiveVersion,
    archetype, setArchetype,
    setCurrentProject, setStatus,
  } = useProjectStore();

  const [loading, setLoading] = useState(true);
  const [editInput, setEditInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero']));
  const [editedCopy, setEditedCopy] = useState<LandingCopy | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId || !isLoaded || !user) return;

    setCurrentProject(projectId);
    loadResults();
  }, [projectId, isLoaded, user]);

  const loadResults = async () => {
    // setLoading(true);
    try {
      const res = await fetch(`/api/generate?project_id=${projectId}`);
      const data = await res.json();

      setMessages(data.messages || []);
      setStatus(data.status);
      setArchetype(data.archetype);

      if (data.strategy) setStrategyData(data.strategy as StrategyData);
      if (data.output) {
        setCopyData(data.output.copy_data as CopyData);
        setEditedCopy(JSON.parse(JSON.stringify(data.output.copy_data)) as LandingCopy);
        setHtmlContent(data.output.html_content);
        setActiveVersion(data.output.version);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`✓ ${label} copiado`);
    } catch {
      showToast('Error al copiar');
    }
  };

  const handleQuickEdit = async (key: string) => {
    if (isEditing) return;
    setIsEditing(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, quick_edit_key: key }),
      });
      const data = await res.json();
      if (data.success) {
        setCopyData(data.copy_data);
        setEditedCopy(JSON.parse(JSON.stringify(data.copy_data)) as LandingCopy);
        setHtmlContent(data.html_content);
        setActiveVersion(data.version);
        showToast('✓ Cambios aplicados');
        await loadResults();
      }
    } catch (err) {
      console.error('Quick edit error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleFreeEdit = async () => {
    if (!editInput.trim() || isEditing) return;
    setIsEditing(true);
    const instruction = editInput.trim();
    setEditInput('');
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, instruction }),
      });
      const data = await res.json();
      if (data.success) {
        setCopyData(data.copy_data);
        setEditedCopy(JSON.parse(JSON.stringify(data.copy_data)) as LandingCopy);
        setHtmlContent(data.html_content);
        setActiveVersion(data.version);
        showToast('✓ Cambios aplicados');
        await loadResults();
      }
    } catch (err) {
      console.error('Free edit error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDesignSave = async () => {
    if (!editedCopy || isEditing) return;
    setIsEditing(true);
    try {
      const res = await fetch('/api/edit-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, updatedCopyData: editedCopy }),
      });
      const data = await res.json();
      if (data.success) {
        setCopyData(data.copy_data);
        setEditedCopy(JSON.parse(JSON.stringify(data.copy_data)) as LandingCopy);
        setHtmlContent(data.html_content);
        setActiveVersion(data.version);
        showToast('✓ Diseño actualizado');
        await loadResults();
      }
    } catch (err) {
      console.error('Design edit error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const toggleSection = (key: string) => {
    const next = new Set(expandedSections);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedSections(next);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  if (loading) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-logo">🚀 Landing<span>Lab</span></div>
        </header>
        <div className="generating-overlay" style={{ flex: 1 }}>
          <div className="generating-spinner"></div>
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
            ← Proyectos
          </button>
          <div className="app-header-logo">🚀 Landing<span>Lab</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Versión {activeVersion}
        </div>
      </header>

      <div className="results-container">
        {/* Chat / Edit Panel */}
        <div className="results-chat-panel">
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.slice(-10).map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`chat-bubble chat-bubble-${msg.role}`}
                style={{ fontSize: '0.88rem', maxWidth: '95%' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Edit Chips */}
          <div className="quick-edit-bar">
            <button className="chip" onClick={() => handleQuickEdit('mas_corto')} disabled={isEditing}>✂️ Más corto</button>
            <button className="chip" onClick={() => handleQuickEdit('mas_vendedor')} disabled={isEditing}>🔥 Más vendedor</button>
            <button className="chip" onClick={() => handleQuickEdit('mas_premium')} disabled={isEditing}>💎 Más premium</button>
            <button className="chip" onClick={() => handleQuickEdit('cambiar_cta')} disabled={isEditing}>🎯 Cambiar CTA</button>
            <button className="chip" onClick={() => handleQuickEdit('mejorar_hero')} disabled={isEditing}>⚡ Mejorar hero</button>
          </div>

          {/* Free Edit Input */}
          <div className="chat-input-area" style={{ background: 'var(--bg-secondary)' }}>
            <textarea
              className="input"
              placeholder="Pedí un cambio específico..."
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFreeEdit(); } }}
              disabled={isEditing}
              rows={1}
            />
            <button className="btn btn-primary" onClick={handleFreeEdit} disabled={isEditing || !editInput.trim()}
              style={{ height: '48px', width: '48px', padding: 0 }}>
              {isEditing ? '...' : '↑'}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="results-output-panel">
          <div className="results-tabs-header">
            <div className="tabs">
              <button className={`tab ${activeTab === 'strategy' ? 'active' : ''}`} onClick={() => setActiveTab('strategy')}>📊 Estrategia</button>
              <button className={`tab ${activeTab === 'copy' ? 'active' : ''}`} onClick={() => setActiveTab('copy')}>✍️ Copy</button>
              <button className={`tab ${activeTab === 'html' ? 'active' : ''}`} onClick={() => setActiveTab('html')}>🧱 HTML</button>
              <button className={`tab ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')}>🎨 Diseño</button>
            </div>

            {activeTab === 'html' && htmlContent && (
              <button className="btn btn-primary btn-sm" onClick={() => copyToClipboard(htmlContent, 'HTML')}>
                📋 Copiar HTML
              </button>
            )}
          </div>

          <div className="results-content">
            {isEditing && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'var(--accent-glow)', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
                <div className="generating-spinner" style={{ margin: '0 auto 12px' }}></div>
                <p style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Aplicando cambios...</p>
              </div>
            )}

            {/* Strategy Tab */}
            {activeTab === 'strategy' && strategyData && (
              <div>
                <div className="card" style={{ marginBottom: '16px', borderLeft: '3px solid var(--accent-primary)' }}>
                  <h3 style={{ marginBottom: '8px' }}>Arquetipo detectado</h3>
                  <p style={{ color: 'var(--accent-light)', fontWeight: 600, fontSize: '1.1rem' }}>
                    {archetype ? (ARCHETYPE_LABELS[archetype as MarketArchetype] || archetype) : 'No detectado'}
                  </p>
                </div>

                <div className="strategy-grid">
                  {strategyData.promise && (
                    <div className="strategy-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="strategy-item-label">Promesa principal</div>
                      <div className="strategy-item-value" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{strategyData.promise}</div>
                    </div>
                  )}
                  {strategyData.avatar_summary && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Avatar</div>
                      <div className="strategy-item-value">{strategyData.avatar_summary}</div>
                    </div>
                  )}
                  {strategyData.primary_desire && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Deseo principal</div>
                      <div className="strategy-item-value">{strategyData.primary_desire}</div>
                    </div>
                  )}
                  {strategyData.primary_pain && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Dolor principal</div>
                      <div className="strategy-item-value">{strategyData.primary_pain}</div>
                    </div>
                  )}
                  {strategyData.primary_objection && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Objeción principal</div>
                      <div className="strategy-item-value">{strategyData.primary_objection}</div>
                    </div>
                  )}
                  {strategyData.mechanism && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Mecanismo</div>
                      <div className="strategy-item-value">{strategyData.mechanism}</div>
                    </div>
                  )}
                  {strategyData.recommended_angle && (
                    <div className="strategy-item">
                      <div className="strategy-item-label">Ángulo recomendado</div>
                      <div className="strategy-item-value">{strategyData.recommended_angle}</div>
                    </div>
                  )}
                  {strategyData.offer_positioning && (
                    <div className="strategy-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="strategy-item-label">Posicionamiento de oferta</div>
                      <div className="strategy-item-value">{strategyData.offer_positioning}</div>
                    </div>
                  )}
                  {strategyData.required_beliefs && strategyData.required_beliefs.length > 0 && (
                    <div className="strategy-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="strategy-item-label">Creencias requeridas</div>
                      <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                        {strategyData.required_beliefs.map((b: string, i: number) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Copy Tab */}
            {activeTab === 'copy' && copyData && (
              <div>
                {(Object.keys(copyData) as (keyof CopyData)[]).map((sectionKey) => {
                  const section = copyData[sectionKey];
                  if (!section) return null;
                  const isExpanded = expandedSections.has(sectionKey);
                  const label = COPY_SECTION_LABELS[sectionKey] || sectionKey;

                  return (
                    <div key={sectionKey} className="copy-section">
                      <div className="copy-section-header" onClick={() => toggleSection(sectionKey)}>
                        <span className="copy-section-title">{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(JSON.stringify(section, null, 2), label); }}
                            style={{ fontSize: '0.8rem' }}
                          >
                            📋
                          </button>
                          <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            ▼
                          </span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="copy-section-body">
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.92rem' }}>
                            {JSON.stringify(section, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* HTML Tab */}
            {activeTab === 'html' && htmlContent && (
              <div>
                {/* Preview */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '12px' }}>Vista previa</h3>
                  <div className="html-preview">
                    <iframe
                      srcDoc={htmlContent}
                      title="Landing page preview"
                      sandbox="allow-scripts"
                      style={{ width: '100%', minHeight: '600px', border: 'none', borderRadius: 'var(--radius-lg)' }}
                    />
                  </div>
                </div>

                {/* Code */}
                <div>
                  <h3 style={{ marginBottom: '12px' }}>Código HTML</h3>
                  <div className="code-viewer">
                    <div className="code-viewer-header">
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HTML • Listo para Shopify</span>
                      <button className="btn btn-primary btn-sm" onClick={() => copyToClipboard(htmlContent, 'HTML')}>
                        📋 Copiar todo
                      </button>
                    </div>
                    <pre><code>{htmlContent}</code></pre>
                  </div>
                </div>
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && editedCopy && (
              <div className="design-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>

                {/* Temas y Colores */}
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Colores y Temas</h3>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Presets Rápidos</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setEditedCopy({ ...editedCopy, design: { ...editedCopy.design, theme: '' } })}
                        style={{
                          width: '32px', height: '32px', borderRadius: '6px',
                          background: 'var(--bg-surface)',
                          border: !editedCopy.design?.theme ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                        }}
                        title="Personalizado"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      {Object.entries(PREDEFINED_THEMES).map(([key, theme]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setEditedCopy({
                              ...editedCopy,
                              design: {
                                ...editedCopy.design,
                                theme: key,
                                colors: { ...editedCopy.design?.colors, ...theme }
                              }
                            });
                          }}
                          style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            background: theme.primary,
                            border: editedCopy.design?.theme === key ? '2px solid white' : '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                          title={key.replace('theme-', '')}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Personalizar Paleta</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>

                      {[
                        { key: 'primary', label: 'Principal', default: '#3b82f6' },
                        { key: 'secondary', label: 'Secundario', default: '#1e40af' },
                        { key: 'bgLight', label: 'Fondo Opuesto', default: '#f8fafc' },
                        { key: 'text', label: 'Texto', default: '#0F0F14' }
                      ].map((colorObj) => {
                        const currentColor = (editedCopy.design?.colors as any)?.[colorObj.key] || colorObj.default;
                        return (
                          <div key={colorObj.key} style={{ position: 'relative' }}>
                            <div style={{
                              height: '46px', background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', padding: '0 8px',
                              transition: 'border-color 0.2s', overflow: 'hidden'
                            }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: currentColor, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                              <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{colorObj.label}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentColor}</span>
                              </div>
                            </div>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) => setEditedCopy({
                                ...editedCopy,
                                design: {
                                  ...editedCopy.design,
                                  theme: '',
                                  colors: { ...editedCopy.design?.colors, [colorObj.key]: e.target.value }
                                }
                              })}
                              style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                opacity: 0, cursor: 'pointer'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Estilo y Geometría */}
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Estructura Visual</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Eilo Tipográfico</label>
                      <select
                        className="input"
                        value={editedCopy.design?.fontTheme || ''}
                        onChange={(e) => setEditedCopy({
                          ...editedCopy,
                          design: { ...editedCopy.design, fontTheme: e.target.value }
                        })}
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        <option value="">Moderno / Limpio (Por defecto)</option>
                        <option value="inter">Robusto (Inter)</option>
                        <option value="outfit">Dinámico (Outfit)</option>
                        <option value="playfair">Elegante / Premium (Playfair)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Geometría (Bordes)</label>
                      <select
                        className="input"
                        value={editedCopy.design?.borderRadius || ''}
                        onChange={(e) => setEditedCopy({
                          ...editedCopy,
                          design: { ...editedCopy.design, borderRadius: e.target.value }
                        })}
                        style={{ background: 'var(--bg-primary)' }}
                      >
                        <option value="">Equilibrado (16px)</option>
                        <option value="0px">Minimalísta / Cuadrado (0px)</option>
                        <option value="8px">Clásico (8px)</option>
                        <option value="50px">Amigable / Píldoras (Bordes curvos)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Modificadores de la Oferta */}
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Estrategia de Precio y Oferta</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>Precio Final (El que paga)</label>
                      <input
                        className="input"
                        value={editedCopy.offer.price_current}
                        onChange={(e) => {
                          const newPrice = e.target.value;
                          const numericNew = parseFloat(newPrice.replace(/[^0-9.-]+/g, '')) || 0;

                          // Generamos un precio tachado realista (multiplicado por 2.5) y lo redondeamos
                          const calcOldPriceNum = numericNew > 0 ? Math.round(numericNew * 2.5) : 0;

                          // Extraemos la divisa original si está presente
                          const prefix = newPrice.replace(/[0-9.,\s].*/, '');
                          const calculatedOldPriceStr = numericNew > 0 ? `${prefix}${calcOldPriceNum}` : editedCopy.offer.price_old;
                          const calcSavings = calcOldPriceNum - numericNew;

                          setEditedCopy({
                            ...editedCopy,
                            offer: {
                              ...editedCopy.offer,
                              price_current: newPrice,
                              price_old: calculatedOldPriceStr,
                              savings_label: calcSavings > 0 ? `Ahorrás ${prefix}${calcSavings} HOY` : editedCopy.offer.savings_label
                            }
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>Precio Tachado (Auto calculado)</label>
                      <input
                        className="input"
                        value={editedCopy.offer.price_old}
                        onChange={(e) => {
                          const newOldPrice = e.target.value;
                          const oldPriceNum = parseFloat(newOldPrice.replace(/[^0-9.-]+/g, '')) || 0;
                          const newPriceNum = parseFloat(editedCopy.offer.price_current.replace(/[^0-9.-]+/g, '')) || 0;
                          const savings = oldPriceNum > newPriceNum ? oldPriceNum - newPriceNum : 0;

                          const prefix = newOldPrice.replace(/[0-9.,\s].*/, '');
                          setEditedCopy({
                            ...editedCopy,
                            offer: { ...editedCopy.offer, price_old: newOldPrice, savings_label: savings > 0 ? `Ahorrás ${prefix}${savings} HOY` : editedCopy.offer.savings_label }
                          });
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>Etiqueta de Ahorro Mostrada</label>
                      <input
                        className="input"
                        value={editedCopy.offer.savings_label}
                        onChange={(e) => setEditedCopy({
                          ...editedCopy,
                          offer: { ...editedCopy.offer, savings_label: e.target.value }
                        })}
                        style={{ background: 'var(--bg-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recursos y Assets */}
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Recursos Visuales (URLs)</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Imagen del Hero (Principal)</label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.04)' }}>

                        {editedCopy.hero.main_image && (
                          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                            <img src={editedCopy.hero.main_image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                          </div>
                        )}
                        <input
                          className="input"
                          value={editedCopy.hero.main_image}
                          onChange={(e) => setEditedCopy({
                            ...editedCopy,
                            hero: { ...editedCopy.hero, main_image: e.target.value }
                          })}
                          style={{ background: 'var(--bg-primary)', flex: 1 }}
                        />
                      </div>
                    </div>

                    {/* <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Fotos de Avatares (Caras CTA - Separa por coma)</label>
                      <textarea
                        className="input"
                        value={editedCopy.hero.trust_avatars.join(',\n')}
                        onChange={(e) => setEditedCopy({
                          ...editedCopy,
                          hero: { ...editedCopy.hero, trust_avatars: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                        })}
                        style={{ background: 'var(--bg-primary)', minHeight: '80px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                    </div> */}

                    {editedCopy.product.includes?.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '8px' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Imágenes de Módulos Inluídos</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {editedCopy.product.includes.map((incl, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              {incl.image && (
                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                  <img src={incl.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{incl.title}</div>
                                <input
                                  className="input"
                                  value={incl.image}
                                  placeholder="URL de la imagen..."
                                  onChange={(e) => {
                                    const newIncludes = [...editedCopy.product.includes];
                                    newIncludes[i] = { ...newIncludes[i], image: e.target.value };
                                    setEditedCopy({
                                      ...editedCopy,
                                      product: { ...editedCopy.product, includes: newIncludes }
                                    });
                                  }}
                                  style={{ padding: '6px 10px', fontSize: '0.85rem', height: 'auto', background: 'rgba(255,255,255,0.03)' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Block */}
                <div
                  style={{
                    position: 'sticky',
                    bottom: '24px',
                    zIndex: 10,
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    boxShadow:
                      '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap', // 🔥 clave para responsive
                    gap: '12px', // espacio cuando se rompe la fila
                  }}
                >
                  <div
                    style={{
                      padding: '10px',
                      flex: '1 1 250px', // 🔥 se adapta automáticamente
                      minWidth: '200px',
                    }}
                  >
                    <strong
                      style={{
                        color: 'var(--text-primary)',
                        display: 'block',
                      }}
                    >
                      ¿Listo para aplicar el diseño?
                    </strong>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Esto reconstruirá la Landing Page con tus nuevos estilos.
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleDesignSave}
                    disabled={isEditing}
                    style={{
                      padding: '12px 32px',
                      fontSize: '1rem',
                      background:
                        'var(--accent-primary)',
                      color: 'var(--text-primary)',
                      flex: '1 1 200px', // 🔥 crece y baja en mobile
                      maxWidth: '300px',
                      width: '100%', // 🔥 ocupa todo en mobile
                    }}
                  >
                    {isEditing ? (
                      <>
                        <div
                          className="generating-spinner"
                          style={{
                            width: '16px',
                            height: '16px',
                            borderWidth: '2px',
                            borderTopColor: '#101010',
                          }}
                        ></div>
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Guardar Diseño
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
