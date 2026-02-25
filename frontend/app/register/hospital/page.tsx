"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../utils/api";

export default function RegisterHospitalPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        phone: "",
        aadhaar_number: "",
        password: "",
        confirmPassword: "",
        hospitalName: "",
        registrationNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value }));

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (form.aadhaar_number && form.aadhaar_number.length !== 12) {
            setError("Aadhaar number must be exactly 12 digits.");
            return;
        }

        setLoading(true);
        const randomAadhaar = form.aadhaar_number || Math.floor(100000000000 + Math.random() * 900000000000).toString();

        try {
            await api.post("/auth/register/hospital", {
                phone: form.phone,
                aadhaar_number: randomAadhaar,
                password: form.password,
                hospitalName: form.hospitalName,
                registrationNumber: form.registrationNumber,
            });
            setSuccess(true);
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(typeof msg === "string" ? msg : "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

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
            <div className="orb orb-violet" style={{ width: 420, height: 420, top: -80, right: -100 }} />
            <div className="orb orb-blue" style={{ width: 280, height: 280, bottom: -60, left: -60, animationDelay: "2s" }} />

            <Link href="/register" style={{ position: "fixed", top: 24, left: 28, color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none", zIndex: 10 }}>
                ← Back
            </Link>

            <div className="glass-strong animate-fade-up"
                style={{ width: "100%", maxWidth: 500, padding: "44px 40px", position: "relative", zIndex: 1 }}>

                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏥</div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>Hospital Registration</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Register your hospital on <span className="gradient-text" style={{ fontWeight: 600 }}>UPRMS</span>
                    </p>
                </div>

                {/* Note banner */}
                <div style={{
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: 10, padding: "12px 16px", color: "#c4b5fd",
                    fontSize: "0.8rem", marginBottom: 24, display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                    <span>ℹ️</span>
                    <span>Hospital accounts are created by system administrators. Please contact us if you need assistance.</span>
                </div>

                {success && (
                    <div style={{
                        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 10, padding: "14px 16px", color: "#86efac",
                        fontSize: "0.875rem", marginBottom: 24, textAlign: "center",
                    }}>
                        ✅ Hospital registered! Redirecting to login…
                    </div>
                )}

                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10, padding: "12px 16px", color: "#fca5a5",
                        fontSize: "0.875rem", marginBottom: 24,
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            HOSPITAL NAME
                        </label>
                        <input className="input-field" placeholder="Apollo Hospital" value={form.hospitalName}
                            onChange={set("hospitalName")} required />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            REGISTRATION NUMBER
                        </label>
                        <input className="input-field" placeholder="MCI-2024-XXXXX" value={form.registrationNumber}
                            onChange={set("registrationNumber")} required />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            CONTACT PHONE
                        </label>
                        <input className="input-field" type="tel" placeholder="9XXXXXXXXX" value={form.phone}
                            onChange={set("phone")} required maxLength={10} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            ADMIN AADHAAR NUMBER (Optional)
                        </label>
                        <input className="input-field" type="text" placeholder="12-digit Aadhaar number"
                            value={form.aadhaar_number} onChange={set("aadhaar_number")}
                            maxLength={12} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            PASSWORD
                        </label>
                        <input className="input-field" type="password" placeholder="Min 6 characters"
                            value={form.password} onChange={set("password")} required minLength={6} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            CONFIRM PASSWORD
                        </label>
                        <input className="input-field" type="password" placeholder="Re-enter password"
                            value={form.confirmPassword} onChange={set("confirmPassword")} required />
                    </div>

                    <button type="submit" id="register-hospital-submit" className="btn-primary"
                        disabled={loading || success}
                        style={{ marginTop: 8, padding: "14px", width: "100%", fontSize: "0.95rem" }}>
                        {loading ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <div className="spinner" /> <span>Registering hospital…</span>
                            </span>
                        ) : (
                            <span>Register Hospital →</span>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
