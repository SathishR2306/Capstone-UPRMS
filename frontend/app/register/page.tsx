"use client";

import Link from "next/link";

export default function RegisterPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--bg-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div className="orb orb-violet" style={{ width: 400, height: 400, top: -80, right: -80 }} />
            <div className="orb orb-cyan" style={{ width: 300, height: 300, bottom: -60, left: -60, animationDelay: "2s" }} />

            <Link
                href="/"
                style={{
                    position: "fixed",
                    top: 24,
                    left: 28,
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    zIndex: 10,
                }}
            >
                ← Back to Home
            </Link>

            <div
                className="glass-strong animate-fade-up"
                style={{ width: "100%", maxWidth: 480, padding: "44px 40px", position: "relative", zIndex: 1 }}
            >
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏥</div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Create an account</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Choose your role to get started with <span className="gradient-text" style={{ fontWeight: 600 }}>UPRMS</span>
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                        { role: "Patient", icon: "👤", desc: "Manage your own health records", href: "/register/patient", color: "#60a5fa" },
                        { role: "Hospital", icon: "🏥", desc: "Upload and manage patient records", href: "/register/hospital", color: "#a78bfa" },
                        { role: "Doctor", icon: "👨‍⚕️", desc: "View records as a linked doctor", href: "/register/doctor", color: "#34d399" },
                    ].map((r) => (
                        <Link
                            key={r.role}
                            href={r.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 18,
                                padding: "20px 24px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 14,
                                textDecoration: "none",
                                color: "inherit",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                                (e.currentTarget as HTMLElement).style.borderColor = r.color + "55";
                                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                            }}
                        >
                            <div style={{ fontSize: "2rem" }}>{r.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4, color: r.color }}>{r.role}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{r.desc}</div>
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>→</div>
                        </Link>
                    ))}
                </div>

                <p style={{ textAlign: "center", marginTop: 28, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
