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
    LuShieldCheck 
} from "react-icons/lu";

type LoginRole = "PATIENT" | "HOSPITAL" | "DOCTOR";

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<LoginRole>("PATIENT");
    
    // Form fields
    const [phone, setPhone] = useState("");
    const [hospitalName, setHospitalName] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [docId, setDocId] = useState("");
    const [password, setPassword] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const payload: any = { password };
        if (role === "PATIENT") {
            payload.phone = phone;
        } else if (role === "HOSPITAL") {
            payload.hospitalName = hospitalName;
            payload.registrationNumber = registrationNumber;
        } else if (role === "DOCTOR") {
            payload.hospitalName = hospitalName;
            payload.docId = Number(docId);
        }

        try {
            const { data } = await api.post("/auth/login", payload);
            // Store token and role
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);

            // Role-based redirect
            if (data.role === "HOSPITAL") {
                localStorage.setItem("hospitalSlug", data.slug);
                router.push(`/${data.slug}/dashboard`);
            }
            else if (data.role === "DOCTOR") {
                localStorage.setItem("hospitalSlug", data.slug);
                router.push(`/${data.slug}/doctor/${data.doctorId}/dashboard`);
            }
            else if (data.role === "PATIENT") router.push("/patient/dashboard");
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

    const roles: { id: LoginRole; label: string; icon: any; color: string }[] = [
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
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f9fafb")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
            >
                <LuArrowLeft size={16} /> Back to Home
            </Link>

            {/* Card */}
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
                        Enter your credentials to access your portal
                    </p>
                </div>

                {/* Role Switcher */}
                <div 
                    style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(3, 1fr)", 
                        gap: 12, 
                        marginBottom: 32,
                        background: "rgba(255,255,255,0.03)",
                        padding: 6,
                        borderRadius: 14,
                        border: "1px solid var(--border)"
                    }}
                >
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => { setRole(r.id); setError(""); }}
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
                                letterSpacing: "0.02em"
                            }}
                        >
                            <r.icon size={20} />
                            {r.label}
                        </button>
                    ))}
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
                    
                    {role === "PATIENT" && (
                        <div className="animate-fade-in">
                            <label className="input-label">PHONE NUMBER</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="Enter registered phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {(role === "HOSPITAL" || role === "DOCTOR") && (
                        <div className="animate-fade-in">
                            <label className="input-label">HOSPITAL NAME</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Exact hospital name"
                                value={hospitalName}
                                onChange={(e) => setHospitalName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {role === "HOSPITAL" && (
                        <div className="animate-fade-in">
                            <label className="input-label">HOSPITAL REGISTRATION NUMBER</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter reg number"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {role === "DOCTOR" && (
                        <div className="animate-fade-in">
                            <label className="input-label">DOCTOR ID</label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Your numeric ID"
                                value={docId}
                                onChange={(e) => setDocId(e.target.value)}
                                required
                            />
                        </div>
                    )}

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
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease forwards;
                }
            `}</style>
        </div>
    );
}
