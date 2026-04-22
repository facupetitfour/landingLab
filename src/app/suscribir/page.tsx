"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SuscribirPage() {
	const router = useRouter();
	const { isLoaded, user } = useUser();

	const [loading, setLoading] = useState(false);
	const [isNewUser, setIsNewUser] = useState<boolean>(false);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [useAccountEmail, setUseAccountEmail] = useState(true);

	// 📌 Inicialización
	useEffect(() => {
		if (user?.primaryEmailAddress?.emailAddress) {
			setEmail(user.primaryEmailAddress.emailAddress);
		}

		if (user?.createdAt) {
			const createdTime = new Date(user.createdAt).getTime();
			const now = Date.now();
			const diffHours = (now - createdTime) / (1000 * 60 * 60);
			setIsNewUser(diffHours < 24);
		}
	}, [user]);

	useEffect(() => {
		if (useAccountEmail && user?.primaryEmailAddress?.emailAddress) {
			setEmail(user.primaryEmailAddress.emailAddress);
		}
	}, [useAccountEmail, user]);

	// 📧 Validación real de email
	const isValidEmail = (email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	};

	const handleSubscribe = async () => {
		if (!user) return;

		setError("");

		if (!isValidEmail(email)) {
			setError("Ingresá un email válido");
			return;
		}

		setLoading(true);

		try {
			console.log("Iniciando suscripción con email:", email);
			const res = await fetch("/api/suscribir", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userEmail: email, // ✅ ahora SI usa el editable
				}),
			});

			const data = await res.json();

			if (data.init_point) {
				window.location.href = data.init_point;
			} else {
				setError(data.error || "Error al procesar la suscripción");
			}
		} catch (err) {
			console.error(err);
			setError("Error de conexión con el servidor");
		} finally {
			setLoading(false);
		}
	};

	if (!isLoaded) {
		return (
			<div className="app-shell">
				<div className="generating-overlay" style={{ flex: 1 }}>
					<div className="generating-spinner"></div>
					<p style={{ marginTop: "16px" }}>Cargando...</p>
				</div>
			</div>
		);
	}

	// 📧 COMPONENTE EMAIL REUTILIZABLE
	const EmailInput = (
		<div style={{ textAlign: "left", marginBottom: "24px" }}>
			<label
				style={{
					fontSize: "14px",
					marginBottom: "12px",
					display: "block",
					fontWeight: 600,
				}}
			>
				Email para la suscripción
			</label>

			{/* Opción 1: Email de la cuenta */}
			<div
				onClick={() => !loading && setUseAccountEmail(true)} // Bloquear si está cargando
				style={{
					display: "flex",
					alignItems: "center",
					padding: "16px",
					cursor: "pointer",
					borderRadius: "12px",
					border: useAccountEmail
						? "2px solid var(--accent-primary)"
						: "1px solid var(--bg-elevated)",
					backgroundColor: useAccountEmail
						? "var(--accent-deep)"
						: "var(--bg-secondary)",
					marginBottom: "12px",
					transition: "all 0.2s ease",
				}}
			>
				<input
					type="radio"
					checked={useAccountEmail}
					readOnly
					style={{
						marginRight: "12px",
						accentColor: "var(--accent-primary)",
						width: "18px",
						height: "18px",
						cursor: "pointer",
					}}
				/>
				<div style={{ flex: 1 }}>
					<div
						style={{
							fontSize: "14px",
							fontWeight: 500,
							color: "var(--text-primary, inherit)",
						}}
					>
						Usar mi email de cuenta
					</div>
					<div
						style={{
							fontSize: "12px",
							color: "var(--text-secondary, #666)",
							display: "flex",
							alignItems: "center",
							gap: "6px",
							marginTop: "4px",
						}}
					>
						<Mail size={14} /> {user?.primaryEmailAddress?.emailAddress}
					</div>
				</div>
				{useAccountEmail && (
					<CheckCircle2 color="var(--accent-primary)" size={20} />
				)}
			</div>

			{/* Opción 2: Otro Email */}
			<div
				onClick={() => setUseAccountEmail(false)}
				style={{
					display: "flex",
					flexDirection: "column",
					padding: "16px",
					cursor: "pointer",
					borderRadius: "12px",
					border: !useAccountEmail
						? "2px solid var(--accent-primary)"
						: "1px solid var(--bg-elevated)",
					backgroundColor: !useAccountEmail
						? "var(--accent-deep)"
						: "var(--bg-secondary)",
					transition: "all 0.2s ease",
				}}
			>
				<div style={{ display: "flex", alignItems: "flex-start" }}>
					<input
						type="radio"
						checked={!useAccountEmail}
						readOnly
						style={{
							marginRight: "12px",
							marginTop: "2px",
							accentColor: "var(--accent-primary)",
							width: "18px",
							height: "18px",
							cursor: "pointer",
						}}
					/>
					<div style={{ flex: 1 }}>
						<div
							style={{
								fontSize: "14px",
								fontWeight: 500,
								color: "var(--text-primary, inherit)",
							}}
						>
							Usar un email diferente de Mercado Pago
						</div>
						<div
							style={{
								fontSize: "12px",
								color: "var(--text-secondary, #666)",
								marginTop: "4px",
							}}
						>
							Elige esta opción si tu cuenta de MP es distinta.
						</div>
					</div>
				</div>

				{/* Input Condicional para el nuevo email */}
				{!useAccountEmail && (
					<div style={{ marginTop: "16px", position: "relative" }}>
						<input
							type="email"
							placeholder="Ej: tu-email-mp@correo.com"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								if (error) setError(""); // Limpia el error al escribir
							}}
							disabled={loading}
							autoFocus
							style={{
								width: "100%",
								padding: "12px 16px",
								borderRadius: "8px",
								border: error
									? "1px solid #ef4444"
									: "1px solid var(--border, #96969659)",
								background: "var(--bg-secondary)",
								color: "var(--text-primary, inherit)",
								fontSize: "14px",
								outline: "none",
								boxShadow: error ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : "none",
								transition: "all 0.2s ease",
							}}
						/>
						{error && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "4px",
									marginTop: "8px",
									color: "#ef4444",
									fontSize: "13px",
								}}
							>
								<AlertCircle size={14} />
								<span>{error}</span>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div
			className="app-shell"
			style={{
				display: "flex",
				flexDirection: "column",
				minHeight: "100vh",
				background: "var(--bg-main)",
			}}
		>
			<header
				className="app-header"
				style={{ borderBottom: "1px solid var(--border)" }}
			>
				<div style={{ fontWeight: 700 }}>
					🚀 Landing<span style={{ color: "var(--primary)" }}>Lab</span>
				</div>
				<UserButton />
			</header>

			<main
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "24px",
				}}
			>
				<div
					className="card"
					style={{
						maxWidth: "520px",
						width: "100%",
						padding: "28px",
						borderRadius: "20px",
						textAlign: "center",
					}}
				>
					<h1 style={{ fontSize: "24px", marginBottom: "10px" }}>
						{isNewUser
							? "✨ Bienvenido a LandingLab"
							: "👋 Reactivá tu suscripción"}
					</h1>

					<p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
						{isNewUser
							? "Desbloqueá todas las funciones premium y empezá a crear sin límites."
							: "Volvé a tener acceso completo a todas las herramientas."}
					</p>

					{EmailInput}

					<button
						className="btn btn-primary"
						style={{
							width: "100%",
							padding: "14px",
							fontSize: "16px",
							borderRadius: "10px",
						}}
						onClick={handleSubscribe}
						disabled={loading}
					>
						{loading
							? "Redirigiendo..."
							: isNewUser
								? "Suscribirme ahora"
								: "Reactivar suscripción"}
					</button>
				</div>
			</main>
		</div>
	);
}
