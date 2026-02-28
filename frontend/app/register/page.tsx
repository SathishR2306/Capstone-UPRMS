"use client";

import Link from "next/link";

const FEATURES = [
    {
        icon: "🔒",
        title: "Secure & Compliant",
        desc: "End-to-end encrypted records with role-based access control",
    },
    {
        icon: "🤖",
        title: "AI-Powered Insights",
        desc: "Gemini AI clinical summaries, risk scores & predictive analytics",
    },
    {
        icon: "📋",
        title: "Unified Patient Records",
        desc: "Complete medical history across hospitals in one place",
    },
];

export default function RegisterPage() {
    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
            display: "flex",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Background orbs */}
            <div className="orb orb-violet" style={{ width: 500, height: 500, top: -120, right: -80, opacity: 0.25 }} />
            <div className="orb orb-cyan" style={{ width: 350, height: 350, bottom: -80, left: 300, animationDelay: "3s", opacity: 0.2 }} />
            <div className="orb orb-blue" style={{ width: 280, height: 280, top: "40%", left: -80, animationDelay: "1.5s", opacity: 0.18 }} />

            {/* ── LEFT PANEL ── */}
            <div style={{
                flex: "0 0 45%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "60px 56px",
                position: "relative",
                zIndex: 1,
            }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 64 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", fontWeight: 900, color: "#fff",
                        boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                    }}>U</div>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>UPRMS</span>
                </Link>

                {/* Headline */}
                <div style={{ marginBottom: 48 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "5px 14px",
                        background: "rgba(139,92,246,0.12)",
                        border: "1px solid rgba(139,92,246,0.25)",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#c4b5fd",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 20,
                    }}>
                        🏥 Hospital Portal
                    </div>
                    <h1 style={{
                        fontSize: "2.6rem",
                        fontWeight: 900,
                        lineHeight: 1.15,
                        margin: "0 0 16px",
                        color: "#f1f5f9",
                        letterSpacing: "-0.03em",
                    }}>
                        Unified Patient<br />
                        <span style={{
                            background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Record Management
                        </span>
                    </h1>
                    <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
                        A single platform for hospitals to manage doctors, patients, and complete medical records with AI assistance.
                    </p>
                </div>

                {/* Feature list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.1rem", flexShrink: 0,
                            }}>{f.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.92rem", marginBottom: 2 }}>{f.title}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 48px",
                position: "relative",
                zIndex: 1,
            }}>
                {/* Vertical divider */}
                <div style={{
                    position: "absolute", left: 0, top: "10%", bottom: "10%",
                    width: 1,
                    background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)",
                }} />

                <div style={{ width: "100%", maxWidth: 420 }}>
                    {/* Card */}
                    <div className="animate-fade-up" style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: 24,
                        padding: "44px 40px",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}>
                        {/* Card header */}
                        <div style={{ marginBottom: 36 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.6rem",
                                boxShadow: "0 8px 24px rgba(139,92,246,0.45)",
                                marginBottom: 20,
                            }}>🏥</div>
                            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                                Register your Hospital
                            </h2>
                            <p style={{ margin: "8px 0 0", fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                Only hospitals can self-register. Doctors &amp; patients are added by hospital admins.
                            </p>
                        </div>

                        {/* Perks */}
                        <div style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                "Manage all your doctors in one place",
                                "Create & control patient accounts",
                                "AI-assisted medical summaries",
                                "Complete audit trail & access logs",
                            ].map((perk) => (
                                <div key={perk} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: "50%",
                                        background: "rgba(139,92,246,0.2)",
                                        border: "1px solid rgba(139,92,246,0.35)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.65rem", color: "#c4b5fd", flexShrink: 0,
                                    }}>✓</div>
                                    <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{perk}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <Link
                            href="/register/hospital"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                width: "100%",
                                padding: "14px 24px",
                                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                borderRadius: 12,
                                textDecoration: "none",
                                transition: "all 0.22s ease",
                                boxShadow: "0 6px 24px rgba(139,92,246,0.4)",
                                letterSpacing: "-0.01em",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(139,92,246,0.55)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(139,92,246,0.4)";
                            }}
                        >
                            <span>Get Started — Register Hospital</span>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </Link>

                        {/* Divider */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            margin: "24px 0",
                        }}>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                            <span style={{ fontSize: "0.78rem", color: "#475569" }}>or</span>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                        </div>

                        <p style={{ textAlign: "center", margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            Already have an account?{" "}
                            <Link href="/login" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none" }}>
                                Sign in →
                            </Link>
                        </p>
                    </div>

                    {/* Trust badges */}
                    <div style={{
                        display: "flex", justifyContent: "center", gap: 24,
                        marginTop: 24,
                    }}>
                        {["🔐 Encrypted", "🇮🇳 Aadhaar-linked", "⚡ Real-time"].map(badge => (
                            <div key={badge} style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 500 }}>{badge}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
