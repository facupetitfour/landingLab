"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { checkSubscriptionStatus } from "@/app/actions/projects";
import styles from "./page.module.css";

export default function SuscribirPage() {
	const router = useRouter();
	const { isLoaded, user } = useUser();

	const [loading, setLoading] = useState(false);
	const [isNewUser, setIsNewUser] = useState<boolean>(false);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [useAccountEmail, setUseAccountEmail] = useState(true);
	const [checkingSubscription, setCheckingSubscription] = useState(true);

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

	useEffect(() => {
		if (isLoaded && user) {
			checkSubscriptionStatus().then(({ isSubscribed }) => {
				if (isSubscribed) {
					router.push('/dashboard');
				} else {
					setCheckingSubscription(false);
				}
			}).catch(() => {
				setCheckingSubscription(false);
			});
		}
	}, [isLoaded, user, router]);

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

	if (!isLoaded || checkingSubscription) {
		return (
			<div className="app-shell">
				<div className={`${styles.loadingOverlay} ${styles.spinner}`}>
					<div className={styles.spinnerIcon}></div>
					<p className={styles.loadingText}>Cargando...</p>
				</div>
			</div>
		);
	}

	// 📧 COMPONENTE EMAIL REUTILIZABLE
	const EmailInput = (
		<div className={styles.emailInputContainer}>
			<label className={styles.emailLabel}>
				Email para la suscripción
			</label>

			{/* Opción 1: Email de la cuenta */}
			<div
				onClick={() => !loading && setUseAccountEmail(true)} // Bloquear si está cargando
				className={`${styles.emailOption} ${useAccountEmail ? styles.selected : styles.unselected}`}
			>
				<input
					type="radio"
					checked={useAccountEmail}
					readOnly
					className={styles.radioInput}
				/>
				<div className={styles.emailOptionContent}>
					<div className={styles.emailOptionTitle}>
						Usar mi email de cuenta
					</div>
					<div className={styles.emailOptionSubtitle}>
						<Mail size={14} /> {user?.primaryEmailAddress?.emailAddress}
					</div>
				</div>
				{useAccountEmail && (
					<CheckCircle2 className={styles.checkIcon} size={20} />
				)}
			</div>

			{/* Opción 2: Otro Email */}
			<div
				onClick={() => setUseAccountEmail(false)}
				className={`${styles.customEmailContainer} ${!useAccountEmail ? styles.selected : styles.unselected}`}
			>
				<div className={styles.customEmailHeader}>
					<input
						type="radio"
						checked={!useAccountEmail}
						readOnly
						className={styles.radioInput}
						style={{ marginTop: "2px" }}
					/>
					<div style={{ flex: 1 }}>
						<div className={styles.customEmailTitle}>
							Usar un email diferente de Mercado Pago
						</div>
						<div className={styles.customEmailSubtitle}>
							Elige esta opción si tu cuenta de MP es distinta.
						</div>
					</div>
				</div>

				{/* Input Condicional para el nuevo email */}
				{!useAccountEmail && (
					<div className={styles.customEmailInputContainer}>
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
							className={`${styles.customEmailInput} ${error ? styles.error : ""}`}
						/>
						{error && (
							<div className={styles.errorMessage}>
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

			<main className={styles.main}>
				<div className={`card ${styles.card}`}>
					<h1 className={styles.title}>
						{isNewUser
							? "✨ Bienvenido a LandingLab"
							: "👋 Reactivá tu suscripción"}
					</h1>

					<p className={styles.description}>
						{isNewUser
							? "Desbloqueá todas las funciones premium y empezá a crear sin límites."
							: "Volvé a tener acceso completo a todas las herramientas."}
					</p>

					{EmailInput}

					<button
						className={`btn btn-primary ${styles.subscribeButton}`}
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
