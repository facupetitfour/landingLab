'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

export default function SuscribirPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/suscribir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          userEmail: user.primaryEmailAddress?.emailAddress 
        }),
      });
      
      const data = await res.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || 'Error al procesar la solicitud de suscripción.');
      }
    } catch (err) {
      console.error('Error al iniciar la suscripción:', err);
      alert('Hubo un error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="app-shell">
        <div className="generating-overlay" style={{ flex: 1 }}>
          <div className="generating-spinner"></div>
          <p style={{ marginTop: '16px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <header className="app-header">
        <div className="app-header-logo">
          🚀 Landing<span>Lab</span>
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: { width: '36px', height: '36px' },
            },
          }}
        />
      </header>
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        padding: '24px',
        overflowY: 'auto'
      }}>
        <div className="card" style={{ 
          maxWidth: '500px', 
          width: '100%', 
          textAlign: 'center', 
          padding: '40px 32px' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Suscripción Mensual
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Para acceder a tus proyectos y seguir creando landing pages increíbles con IA, suscríbete a continuación.
          </p>
          
          <div style={{ textAlign: 'center', minHeight: '100px' }}>
            <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '18px' }}
                onClick={handleSubscribe}
                disabled={loading}
            >
                {loading ? 'Redirigiendo a Mercado Pago...' : 'Suscribirse Ahora'}
            </button>
          </div>
          
          <button 
            className="btn btn-ghost" 
            style={{ width: '100%', marginTop: '24px' }}
            onClick={() => router.push('/dashboard')}
          >
            Volver al Inicio
          </button>
        </div>
      </main>
    </div>
  );
}