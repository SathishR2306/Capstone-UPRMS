"use client";

import Link from "next/link";
import { LuHospital, LuStethoscope, LuBot, LuFileText, LuZap, LuArrowRight, LuShieldCheck } from "react-icons/lu";

const features = [
  {
    icon: <LuShieldCheck size={32} />,
    title: "Patient-Controlled Access",
    desc: "You decide which hospitals can view and upload your records. Full consent, always.",
    accent: "rgba(15, 212, 176, 0.12)",
    border: "rgba(15, 212, 176, 0.2)",
  },
  {
    icon: <LuHospital size={32} />,
    title: "Multi-Hospital Support",
    desc: "Records from any hospital in one place. No more carrying physical files.",
    accent: "rgba(26, 143, 255, 0.1)",
    border: "rgba(26, 143, 255, 0.18)",
  },
  {
    icon: <LuStethoscope size={32} />,
    title: "Doctor Read Access",
    desc: "Doctors linked to hospitals can view your records securely — read-only.",
    accent: "rgba(125, 211, 252, 0.09)",
    border: "rgba(125, 211, 252, 0.18)",
  },
  {
    icon: <LuBot size={32} />,
    title: "AI-Powered Insights",
    desc: "Smart diagnosis summaries and pattern detection powered by ML models.",
    accent: "rgba(15, 212, 176, 0.12)",
    border: "rgba(15, 212, 176, 0.2)",
  },
  {
    icon: <LuFileText size={32} />,
    title: "Permanent & Tamper-Proof",
    desc: "Medical records are immutable once uploaded — no edits, no deletions.",
    accent: "rgba(26, 143, 255, 0.1)",
    border: "rgba(26, 143, 255, 0.18)",
  },
  {
    icon: <LuZap size={32} />,
    title: "Instant Access",
    desc: "Emergency? Doctors can request access and get records in seconds.",
    accent: "rgba(125, 211, 252, 0.09)",
    border: "rgba(125, 211, 252, 0.18)",
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
      {/* ── Subtle grid overlay ────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(15,212,176,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,212,176,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Animated background orbs ──────────────────── */}
      <div
        className="orb orb-blue"
        style={{ width: 560, height: 560, top: -120, left: -180 }}
      />
      <div
        className="orb orb-violet"
        style={{
          width: 420,
          height: 420,
          top: 220,
          right: -120,
          animationDelay: "2.5s",
        }}
      />
      <div
        className="orb orb-cyan"
        style={{
          width: 320,
          height: 320,
          bottom: 120,
          left: "38%",
          animationDelay: "5s",
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
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(2, 11, 24, 0.82)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(15, 212, 176, 0.08)",
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
          <span style={{ fontSize: "1.4rem", color: "#1bd1ab", display: "flex" }}><LuHospital /></span>
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
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--accent-teal)",
            letterSpacing: "0.08em",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent-teal)",
              display: "inline-block",
              boxShadow: "0 0 10px var(--accent-teal)",
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
            color: "var(--text-primary)",
          }}
        >
          Your Medical Records,{" "}
          <span className="gradient-text">Your Control</span>
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-up-delay-2"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: 580,
            lineHeight: 1.8,
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
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>Get Started Free <LuArrowRight /></span>
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
            gap: 56,
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
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  letterSpacing: "0.02em",
                }}
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
            style={{
              fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
              fontWeight: 800,
              marginBottom: 16,
              color: "var(--text-primary)",
            }}
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
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{
                padding: "32px 28px",
                background: f.accent,
                border: `1px solid ${f.border}`,
                borderRadius: 16,
                backdropFilter: "blur(16px)",
                transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
                cursor: "default",
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 20px 50px rgba(15, 212, 176, 0.14)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(15, 212, 176, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
                (e.currentTarget as HTMLElement).style.borderColor = f.border;
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 16 }}>{f.icon}</div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  marginBottom: 10,
                  color: "var(--text-primary)",
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.75 }}>
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
          className="glow-teal"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "64px 48px",
            background: "rgba(15, 212, 176, 0.05)",
            border: "1px solid rgba(15, 212, 176, 0.18)",
            borderRadius: 24,
            backdropFilter: "blur(24px)",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 800,
              marginBottom: 16,
              color: "var(--text-primary)",
            }}
          >
            Ready to take control of your health data?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: 36,
              fontSize: "1rem",
              lineHeight: 1.75,
            }}
          >
            Join patients, hospitals, and doctors already using UPRMS to
            manage medical records securely.
          </p>
          <Link href="/register" className="btn-primary" style={{ padding: "15px 40px", fontSize: "1rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>Create Your Account <LuArrowRight /></span>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(15, 212, 176, 0.08)",
          padding: "28px 40px",
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
        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <LuHospital color="#1bd1ab" /> <span className="gradient-text">UPRMS</span> — Unified Patient Record Management System
        </div>
        <div>© 2026 UPRMS. Built for the Capstone Project.</div>
      </footer>
    </div>
  );
}
