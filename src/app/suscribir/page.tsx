'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

export default function SuscribirPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.createdAt) {
      const createdTime = new Date(user.createdAt).getTime();
      const now = Date.now();
      const differenceInHours = (now - createdTime) / (1000 * 60 * 60);
      setIsNewUser(differenceInHours < 24);

    }
  }, [user]);

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
      <header className="app-header" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="app-header-logo" style={{ fontSize: '1.25rem', fontWeight: 700, gap: '8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>🚀</span> Landing<span style={{ color: 'var(--primary)' }}>Lab</span>
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto'
      }}>
        {isNewUser ? (
          /* VISTA USUARIO NUEVO */
          <div className="card" style={{
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            padding: '20px 30px',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>

            <div style={{
              fontSize: '56px',
              padding: '10px',
            }}>✨</div>

            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.5px' }}>
              ¡Te damos la bienvenida!
            </h1>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.7', fontSize: '16px' }}>
              Nos emociona tenerte en <strong>LandingLab</strong>. Estás a un paso de crear landing pages espectaculares con el poder de la Inteligencia Artificial. Suscríbete para desbloquear el acceso ilimitado a todas nuestras herramientas premium y hacer despegar tus ideas hoy mismo.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '32px',
              textAlign: 'left',
              background: 'var(--bg-main)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary)', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '15px' }}>Creación ilimitada de Landing Pages</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary)', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '15px' }}>Generación de componentes con IA</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--primary)', fontSize: '18px' }}>✓</span>
                <span style={{ fontSize: '15px' }}>Exportación de código listo para producción</span>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.3)',
                  transition: 'all 0.2s ease',
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Redirigiendo a Mercado Pago...' : 'Suscribirse Ahora'}
              </button>
            </div>

            {/* <button
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '20px', color: 'var(--text-tertiary)', fontSize: '14px', position: 'relative', zIndex: 10 }}
              onClick={() => router.push('/dashboard')}
            >
              Explorar el Dashboard antes de suscribirme
            </button> */}
          </div>
        ) : (
          /* VISTA USUARIO ANTIGUO (REACTIVACIÓN) */
          <div className="card" style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            padding: '40px 32px',
            border: '2px solid var(--primary)',
            boxShadow: '0 10px 40px rgba(var(--primary-rgb), 0.15)',
            borderRadius: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              display: 'inline-block',
              animation: 'float 3s ease-in-out infinite'
            }}>👋</div>

            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
              ¡Qué bueno verte de nuevo!
            </h1>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6', fontSize: '15px' }}>
              Tu periodo de acceso requiere una suscripción activa para continuar creando y gestionando tus proyectos en LandingLab.
              Reactiva tu plan para no perder el ritmo.
            </p>

            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>💼</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Renueva tu suscripción</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Acceso total a las herramientas IA</div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '10px'
                }}
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Redirigiendo al pago...' : 'Reactivar mi Suscripción'}
              </button>
            </div>

            {/* <button
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: '20px', fontSize: '14px' }}
              onClick={() => router.push('/dashboard')}
            >
              Volver al Inicio
            </button> */}

            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
              }
            `}} />
          </div>
        )}
      </main>
    </div>
  );
}