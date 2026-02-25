"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../utils/api";

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/auth/login", { phone, password });
            // Store token and role
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);

            // Role-based redirect
            if (data.role === "PATIENT") router.push("/patient/dashboard");
            else if (data.role === "HOSPITAL") router.push("/hospital/dashboard");
            else if (data.role === "DOCTOR") router.push("/doctor/dashboard");
            else router.push("/");
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ?? "Invalid credentials. Please try again.";
            setError(typeof msg === "string" ? msg : "Login failed.");
        } finally {
            setLoading(false);
        }
    }

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
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f9fafb")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
            >
                ← Back to Home
            </Link>

            {/* Card */}
            <div
                className="glass-strong animate-fade-up"
                style={{
                    width: "100%",
                    maxWidth: 440,
                    padding: "44px 40px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏥</div>
                    <h1
                        style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}
                    >
                        Welcome back
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Sign in to your <span className="gradient-text" style={{ fontWeight: 600 }}>UPRMS</span> account
                    </p>
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
                            gap: 8,
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Phone */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: 8,
                                letterSpacing: "0.04em",
                            }}
                        >
                            PHONE NUMBER
                        </label>
                        <input
                            id="login-phone"
                            type="tel"
                            className="input-field"
                            placeholder="9XXXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            autoComplete="tel"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: 8,
                                letterSpacing: "0.04em",
                            }}
                        >
                            PASSWORD
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className="input-field"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        id="login-submit"
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: 8, padding: "14px", width: "100%", fontSize: "0.95rem" }}
                    >
                        {loading ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="spinner" />
                                <span>Signing in…</span>
                            </span>
                        ) : (
                            <span>Sign In →</span>
                        )}
                    </button>
                </form>

                {/* Role hint */}
                <div
                    className="glass"
                    style={{
                        marginTop: 24,
                        padding: "14px 16px",
                        borderRadius: 12,
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        textAlign: "center",
                    }}
                >
                    You will be automatically redirected to your dashboard based on your role.
                    <br />
                    <span style={{ color: "#60a5fa" }}>Patient</span> ·{" "}
                    <span style={{ color: "#a78bfa" }}>Hospital</span> ·{" "}
                    <span style={{ color: "#34d399" }}>Doctor</span>
                </div>

                {/* Register link */}
                <p
                    style={{
                        textAlign: "center",
                        marginTop: 24,
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                    }}
                >
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        style={{
                            color: "#a78bfa",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
