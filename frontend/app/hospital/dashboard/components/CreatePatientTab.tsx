"use client";

import { useState } from "react";
import api from "../../../../utils/api";

interface CreatedPatient {
    patientId: number;
    userId: number;
    fullName: string;
    phone: string;
    tempPassword: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: "0.88rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
};

export default function CreatePatientTab() {
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        aadhaarNumber: "",
        dateOfBirth: "",
        gender: "Male",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState<CreatedPatient | null>(null);

    const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setCreated(null);
        if (!form.fullName || !form.phone || !form.aadhaarNumber || !form.dateOfBirth) {
            setError("Please fill in all required fields.");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/hospitals/patients", form);
            setCreated(res.data);
            setForm({ fullName: "", phone: "", aadhaarNumber: "", dateOfBirth: "", gender: "Male" });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create patient. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => { setCreated(null); setError(""); };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.3rem", boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
                    }}>👤</div>
                    <div>
                        <h2 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.2rem", margin: 0 }}>
                            Create Patient Account
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "3px 0 0" }}>
                            Register a new patient and generate their login credentials
                        </p>
                    </div>
                </div>
                <div style={{
                    padding: "10px 16px",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 10,
                    fontSize: "0.81rem",
                    color: "#93c5fd",
                    lineHeight: 1.6,
                }}>
                    ℹ️ A temporary password will be auto-generated. Share the credentials with the patient so they can log in and change their password.
                </div>
            </div>

            {/* Success panel */}
            {created && (
                <div style={{
                    marginBottom: 28,
                    padding: "22px 24px",
                    background: "rgba(16,185,129,0.07)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 14,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                        <span style={{ fontSize: "1.4rem" }}>✅</span>
                        <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1rem" }}>
                            Patient Account Created Successfully
                        </div>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Login Credentials — Share with Patient
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "Patient Name", value: created.fullName },
                            { label: "Patient ID", value: `#${created.patientId}` },
                            { label: "Phone (Login ID)", value: created.phone },
                            { label: "Temporary Password", value: created.tempPassword },
                        ].map(item => (
                            <div key={item.label} style={{
                                padding: "12px 16px",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 10,
                            }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</div>
                                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", fontFamily: item.label.includes("Password") ? "monospace" : "inherit", letterSpacing: item.label.includes("Password") ? "0.1em" : "normal" }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                        <button
                            onClick={resetForm}
                            style={{
                                padding: "10px 22px", borderRadius: 8, border: "none",
                                background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                                color: "#fff", fontSize: "0.88rem", fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            + Create Another Patient
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            {!created && (
                <form onSubmit={handleSubmit} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "28px 28px",
                }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
                        {/* Full Name – full width */}
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Full Name <span style={{ color: "#f87171" }}>*</span></label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={e => set("fullName", e.target.value)}
                                placeholder="e.g. Ramesh Kumar"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>Phone Number <span style={{ color: "#f87171" }}>*</span></label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => set("phone", e.target.value)}
                                placeholder="10-digit mobile number"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Aadhaar */}
                        <div>
                            <label style={labelStyle}>Aadhaar Number <span style={{ color: "#f87171" }}>*</span></label>
                            <input
                                type="text"
                                value={form.aadhaarNumber}
                                onChange={e => set("aadhaarNumber", e.target.value)}
                                placeholder="12-digit Aadhaar"
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label style={labelStyle}>Date of Birth <span style={{ color: "#f87171" }}>*</span></label>
                            <input
                                type="date"
                                value={form.dateOfBirth}
                                onChange={e => set("dateOfBirth", e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label style={labelStyle}>Gender <span style={{ color: "#f87171" }}>*</span></label>
                            <select
                                value={form.gender}
                                onChange={e => set("gender", e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            >
                                {GENDER_OPTIONS.map(g => (
                                    <option key={g} value={g} style={{ background: "#1e293b" }}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Auto-generate notice */}
                    <div style={{
                        marginTop: 18,
                        padding: "10px 14px",
                        background: "rgba(16,185,129,0.06)",
                        border: "1px solid rgba(16,185,129,0.15)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                        color: "#6ee7b7",
                    }}>
                        🔑 Patient ID and temporary password will be auto-generated on submission.
                    </div>

                    {error && (
                        <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#fca5a5", fontSize: "0.85rem" }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "11px 32px", borderRadius: 10, border: "none",
                                background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                                color: "#fff", fontSize: "0.9rem", fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                boxShadow: loading ? "none" : "0 4px 16px rgba(59,130,246,0.3)",
                            }}
                        >
                            {loading ? "Creating Account…" : "Create Patient Account"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
