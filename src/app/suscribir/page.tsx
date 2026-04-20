"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";

export default function SuscribirPage() {
	const router = useRouter();
	const { isLoaded, user } = useUser();

	const [loading, setLoading] = useState(false);
	const [isNewUser, setIsNewUser] = useState<boolean>(false);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");

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
			const res = await fetch("/api/suscribir", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: user.id,
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
		<div style={{ marginBottom: "20px", textAlign: "left" }}>
			<label style={{ fontSize: "14px", marginBottom: "6px", display: "block" }}>
				Email para la suscripción
			</label>

			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				disabled={loading}
				style={{
					width: "100%",
					padding: "12px",
					borderRadius: "8px",
					border: error ? "1px solid red" : "1px solid var(--border)",
					background: "var(--bg-main)",
					fontSize: "14px",
				}}
			/>

			{email === user?.primaryEmailAddress?.emailAddress && (
				<p style={{ fontSize: "12px", color: "green", marginTop: "4px" }}>
					Email de tu cuenta
				</p>
			)}

			{error && (
				<p style={{ fontSize: "12px", color: "red", marginTop: "4px" }}>
					{error}
				</p>
			)}
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
			<header className="app-header" style={{ borderBottom: "1px solid var(--border)" }}>
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
						{isNewUser ? "✨ Bienvenido a LandingLab" : "👋 Reactivá tu suscripción"}
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