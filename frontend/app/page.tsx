"use client";

import Link from "next/link";

const features = [
  {
    icon: "🔐",
    title: "Patient-Controlled Access",
    desc: "You decide which hospitals can view and upload your records. Full consent, always.",
  },
  {
    icon: "🏥",
    title: "Multi-Hospital Support",
    desc: "Records from any hospital in one place. No more carrying physical files.",
  },
  {
    icon: "👨‍⚕️",
    title: "Doctor Read Access",
    desc: "Doctors linked to hospitals can view your records securely — read-only.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    desc: "Smart diagnosis summaries and pattern detection powered by ML models.",
  },
  {
    icon: "📄",
    title: "Permanent & Tamper-Proof",
    desc: "Medical records are immutable once uploaded — no edits, no deletions.",
  },
  {
    icon: "⚡",
    title: "Instant Access",
    desc: "Emergency? Doctors can request access and get records in seconds.",
  },
];

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ── Animated background orbs ──────────────────── */}
      <div
        className="orb orb-blue"
        style={{ width: 500, height: 500, top: -100, left: -150 }}
      />
      <div
        className="orb orb-violet"
        style={{
          width: 400,
          height: 400,
          top: 200,
          right: -100,
          animationDelay: "2s",
        }}
      />
      <div
        className="orb orb-cyan"
        style={{
          width: 300,
          height: 300,
          bottom: 100,
          left: "40%",
          animationDelay: "4s",
        }}
      />

      {/* ── Navbar ────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(3, 7, 18, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700,
            fontSize: "1.15rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🏥</span>
          <span className="gradient-text">UPRMS</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" className="btn-outline" style={{ padding: "9px 22px", fontSize: "0.875rem" }}>
            <span>Login</span>
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "9px 22px", fontSize: "0.875rem" }}>
            <span>Register</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Badge */}
        <div
          className="glass animate-fade-up"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 18px",
            marginBottom: 32,
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#a78bfa",
            letterSpacing: "0.05em",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#8b5cf6",
              display: "inline-block",
              boxShadow: "0 0 8px #8b5cf6",
            }}
          />
          AI-POWERED • PATIENT-FIRST • SECURE
        </div>

        {/* Heading */}
        <h1
          className="animate-fade-up-delay-1"
          style={{
            fontSize: "clamp(2.8rem, 6vw, 5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 820,
            marginBottom: 24,
          }}
        >
          Your Medical Records,{" "}
          <span className="gradient-text">Your Control</span>
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-up-delay-2"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: 600,
            lineHeight: 1.75,
            marginBottom: 48,
          }}
        >
          UPRMS gives patients complete ownership of their health data. Grant
          hospitals access, view records anytime, and let AI surface meaningful
          medical insights — all in one secure platform.
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-up-delay-3"
          style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link href="/register" className="btn-primary" style={{ padding: "15px 36px", fontSize: "1rem" }}>
            <span>Get Started Free →</span>
          </Link>
          <Link href="/login" className="btn-outline" style={{ padding: "15px 36px", fontSize: "1rem" }}>
            <span>Sign In</span>
          </Link>
        </div>

        {/* Stats row */}
        <div
          className="animate-fade-up-delay-4"
          style={{
            display: "flex",
            gap: 48,
            marginTop: 80,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { n: "100%", label: "Patient Controlled" },
            { n: "3 Roles", label: "Patient · Hospital · Doctor" },
            { n: "Zero", label: "Unauthorized Access" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                className="gradient-text"
                style={{ fontSize: "2rem", fontWeight: 800 }}
              >
                {n}
              </div>
              <div
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 120px",
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, marginBottom: 16 }}
          >
            Everything you need,{" "}
            <span className="gradient-text">nothing you don't</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            A complete ecosystem for modern healthcare record management.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass"
              style={{
                padding: "32px 28px",
                transition: "transform 0.25s, box-shadow 0.25s",
                cursor: "default",
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 20px 60px rgba(139,92,246,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 10 }}>
                {f.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="glass-strong glow-violet"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "60px 40px",
          }}
        >
          <h2
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, marginBottom: 16 }}
          >
            Ready to take control of your health data?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: 36,
              fontSize: "1rem",
              lineHeight: 1.7,
            }}
          >
            Join patients, hospitals, and doctors already using UPRMS to
            manage medical records securely.
          </p>
          <Link href="/register" className="btn-primary" style={{ padding: "15px 40px", fontSize: "1rem" }}>
            <span>Create Your Account →</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "28px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          🏥 <span className="gradient-text">UPRMS</span> — Unified Patient Record Management System
        </div>
        <div>© 2026 UPRMS. Built for the Capstone Project.</div>
      </footer>
    </div>
  );
}