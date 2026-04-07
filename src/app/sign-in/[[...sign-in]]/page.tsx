import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="app-header-logo" style={{ justifyContent: 'center', fontSize: '1.8rem', marginBottom: '12px' }}>
          🚀 Landing<span>Lab</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center' }}>
          Creá landing pages profesionales con IA
        </p>
      </div>
      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "clerk-root",
            cardBox: "clerk-card",
            headerTitle: { display: "none" },
            headerSubtitle: { display: "none" },
            socialButtonsBlockButton: {
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontWeight: 500,
              transition: "all 0.2s ease",
            },
            formButtonPrimary: {
              background: "var(--accent-primary)",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              transition: "all 0.2s ease",
            },
            footerActionLink: {
              color: "var(--accent-light)",
            },
          },
        }}
      />
    </div>
  );
}
