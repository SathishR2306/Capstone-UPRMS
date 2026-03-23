"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../utils/api";
import {
    LuHospital,
    LuTriangleAlert,
    LuArrowRight,
    LuArrowLeft,
    LuUser,
    LuStethoscope,
} from "react-icons/lu";

type LoginRole = "PATIENT" | "HOSPITAL" | "DOCTOR";

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("PATIENT");

    // Backend POST /auth/login only accepts { phone, password } — same for all roles
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Universal payload — role is determined server-side from the JWT
        const payload = { phone: phone.trim(), password };

        try {
            const { data } = await api.post("/auth/login", payload);

            // Store credentials
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);

            // Route to the correct portal matching Next.js file routes
            if (data.role === "HOSPITAL") {
                if (data.slug) localStorage.setItem("hospitalSlug", data.slug);
                router.push("/hospital/dashboard");
            } else if (data.role === "DOCTOR") {
                router.push("/doctor/dashboard");
            } else if (data.role === "PATIENT") {
                router.push("/patient/dashboard");
            } else {
                router.push("/");
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? "Invalid credentials. Please try again.";
            setError(typeof msg === "string" ? msg : "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    const roles: { id: LoginRole; label: string; icon: React.ElementType; color: string }[] = [
        { id: "PATIENT", label: "Patient", icon: LuUser, color: "#60a5fa" },
        { id: "HOSPITAL", label: "Hospital", icon: LuHospital, color: "#a78bfa" },
        { id: "DOCTOR", label: "Doctor", icon: LuStethoscope, color: "#34d399" },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-primary)",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background orbs */}
            <div className="orb orb-blue" style={{ width: 450, height: 450, top: -80, left: -120 }} />
            <div className="orb orb-violet" style={{ width: 350, height: 350, bottom: -80, right: -80, animationDelay: "3s" }} />

            {/* Back to home */}
            <Link
                href="/"
                style={{
                    position: "fixed",
                    top: 24,
                    left: 28,
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    textDecoration: "none",
                    transition: "color 0.2s",
                    zIndex: 10,
                }}
            >
                <LuArrowLeft size={16} /> Back to Home
            </Link>

            {/* Login Card */}
            <div
                className="glass-strong animate-fade-up"
                style={{
                    width: "100%",
                    maxWidth: 480,
                    padding: "40px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8, color: "#fff" }}>
                        Sign in to UPRMS
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                        Use your registered phone number and password
                    </p>
                </div>

                {/* Role Selector — visual UX hint only, login is always phone + password */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                        marginBottom: 32,
                        background: "rgba(255,255,255,0.03)",
                        padding: 6,
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                    }}
                >
                    {roles.map((r) => {
                        const Icon = r.icon;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                    setRole(r.id);
                                    setError("");
                                }}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "12px 8px",
                                    borderRadius: 10,
                                    border: "none",
                                    background: role === r.id ? r.color : "transparent",
                                    color: role === r.id ? "#0f172a" : "var(--text-secondary)",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    fontWeight: 700,
                                    fontSize: "0.75rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                <Icon size={20} />
                                {r.label}
                            </button>
                        );
                    })}
                </div>

                {/* Error banner */}
                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: 10,
                            padding: "12px 16px",
                            color: "#fca5a5",
                            fontSize: "0.875rem",
                            marginBottom: 24,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <LuTriangleAlert size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Phone — universal identifier for all roles */}
                    <div>
                        <label className="input-label">PHONE NUMBER</label>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="Enter your registered phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="input-label">PASSWORD</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: 12, padding: "14px", width: "100%", fontSize: "1rem" }}
                    >
                        {loading ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <div className="spinner" /> Signing in…
                            </span>
                        ) : (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                Sign In <LuArrowRight size={18} />
                            </span>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 32, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Need a new account?{" "}
                    <Link href="/register" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none" }}>
                        Register here
                    </Link>
                </p>
            </div>

            <style jsx>{`
                .input-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }
            `}</style>
        </div>
    );
}
