'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { useProjectStore } from '@/store/project-store';
import { STATUS_LABELS, type ProjectStatus } from '@/types/chat';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { projects, setProjects, loadingProjects, setLoadingProjects } = useProjectStore();
  const [creatingProject, setCreatingProject] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadProjects();
      loadCredits();
    }
  }, [isLoaded, user]);

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      if (typeof data.credits === 'number') {
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Error loading credits:', err);
    }
  };

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const createProject = async () => {
    if (!user || creatingProject) return;
    setCreatingProject(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.project) {
        router.push(`/project/${data.project.id}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setCreatingProject(false);
    }
  };

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const isComplete = status === 'completed';
    return (
      <span className={`project-status-badge ${isComplete ? 'completed' : 'in-progress'}`}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isLoaded) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-logo">🚀 Landing<span>Lab</span></div>
        </header>
        <div className="generating-overlay" style={{ flex: 1 }}>
          <div className="generating-spinner"></div>
          <p style={{ marginTop: '16px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-logo">
          🚀 Landing<span>Lab</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {credits !== null && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.05)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🪙 {credits}
            </div>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: '36px', height: '36px' },
              },
            }}
          />
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="dashboard-title-group">
              <h1>Mis proyectos</h1>
              <p>Hola {user?.firstName || 'Creador'}, gestioná tus landing pages optimizadas.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={createProject}
              disabled={creatingProject}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {creatingProject ? 'Creando...' : 'Nueva landing'}
            </button>
          </div>

          {loadingProjects ? (
            <div className="empty-state">
              <div className="generating-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px' }}>Cargando proyectos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>No hay proyectos activos</h3>
              <p>Creá tu primera landing page de alta conversión en minutos con ayuda de la IA de LandingLab.</p>
              <button className="btn btn-primary btn-lg" onClick={createProject} disabled={creatingProject}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Crear mi primera landing
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="card project-card"
                  onClick={() => {
                    const targetStatus = project.status;
                    if (targetStatus === 'completed' || targetStatus === 'editing') {
                      router.push(`/project/${project.id}/results`);
                    } else {
                      router.push(`/project/${project.id}`);
                    }
                  }}
                >
                  <div className="card-header">
                    <div className="project-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </div>
                    {getStatusBadge(project.status as ProjectStatus)}
                  </div>
                  <div className="project-name">{project.name || 'Proyecto sin título'}</div>
                  <div className="project-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>{formatDate(project.created_at)}</span>
                    {project.archetype && (
                      <>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                        <span style={{ textTransform: 'capitalize' }}>{project.archetype.replace(/_/g, ' ')}</span>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => deleteProject(project.id, e)}
                    style={{ position: 'absolute', top: '1px', right: '1px', padding: '8px', color: 'var(--text-muted)' }}
                    title="Eliminar proyecto"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
