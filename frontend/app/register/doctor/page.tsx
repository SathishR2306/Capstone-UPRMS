"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../utils/api";

export default function RegisterDoctorPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        phone: "",
        aadhaar_number: "",
        password: "",
        confirmPassword: "",
        hospitalId: "",
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
        if (form.aadhaar_number.length !== 12) {
            setError("Aadhaar number must be exactly 12 digits.");
            return;
        }
        if (!form.hospitalId || isNaN(Number(form.hospitalId))) {
            setError("Please enter a valid Hospital ID.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register/doctor", {
                phone: form.phone,
                aadhaar_number: form.aadhaar_number,
                password: form.password,
                hospitalId: Number(form.hospitalId),
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
            <div className="orb orb-cyan" style={{ width: 400, height: 400, top: -80, left: -80 }} />
            <div className="orb orb-violet" style={{ width: 300, height: 300, bottom: -60, right: -60, animationDelay: "2s" }} />

            <Link href="/register" style={{ position: "fixed", top: 24, left: 28, color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none", zIndex: 10 }}>
                ← Back
            </Link>

            <div className="glass-strong animate-fade-up"
                style={{ width: "100%", maxWidth: 480, padding: "44px 40px", position: "relative", zIndex: 1 }}>

                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>👨‍⚕️</div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>Doctor Registration</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Created by <span className="gradient-text" style={{ fontWeight: 600 }}>hospital admin</span>
                    </p>
                </div>

                {/* Info banner */}
                <div style={{
                    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)",
                    borderRadius: 10, padding: "12px 16px", color: "#6ee7b7",
                    fontSize: "0.8rem", marginBottom: 24, display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                    <span>ℹ️</span>
                    <span>Doctor accounts are created by the hospital admin. You need your <strong>Hospital ID</strong> to register — provided by your hospital administrator.</span>
                </div>

                {success && (
                    <div style={{
                        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 10, padding: "14px 16px", color: "#86efac",
                        fontSize: "0.875rem", marginBottom: 24, textAlign: "center",
                    }}>
                        ✅ Doctor account created! Redirecting to login…
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
                            HOSPITAL ID
                        </label>
                        <input className="input-field" type="number" placeholder="Enter your Hospital ID (e.g. 1)"
                            value={form.hospitalId} onChange={set("hospitalId")} required min={1} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            PHONE NUMBER
                        </label>
                        <input className="input-field" type="tel" placeholder="9XXXXXXXXX"
                            value={form.phone} onChange={set("phone")} required maxLength={10} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7, letterSpacing: "0.04em" }}>
                            AADHAAR NUMBER
                        </label>
                        <input className="input-field" type="text" placeholder="12-digit Aadhaar"
                            value={form.aadhaar_number} onChange={set("aadhaar_number")}
                            required maxLength={12} pattern="\d{12}" />
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

                    <button type="submit" id="register-doctor-submit" className="btn-primary"
                        disabled={loading || success}
                        style={{ marginTop: 8, padding: "14px", width: "100%", fontSize: "0.95rem" }}>
                        {loading ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <div className="spinner" /> <span>Creating account…</span>
                            </span>
                        ) : (
                            <span>Create Doctor Account →</span>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "#34d399", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
