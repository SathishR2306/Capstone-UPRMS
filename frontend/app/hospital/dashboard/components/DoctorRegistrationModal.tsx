"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../../utils/api";

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

const ROLE_OPTIONS = [
    { value: "JUNIOR_DOCTOR", label: "Junior Doctor" },
    { value: "SENIOR_CONSULTANT", label: "Senior Consultant" },
    { value: "RESIDENT", label: "Resident" },
    { value: "READ_ONLY", label: "Read-Only" },
];

interface Field { name: string; label: string; type: string; required?: boolean; options?: { value: string; label: string }[] }

const FIELDS: Field[] = [
    { name: "fullName", label: "Full Name", type: "text", required: true },
    { name: "phone", label: "Phone Number", type: "text", required: true },
    { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
    { name: "password", label: "Temporary Password", type: "password", required: true },
    { name: "specialization", label: "Specialization", type: "text" },
    { name: "department", label: "Department", type: "text" },
    { name: "role", label: "Role", type: "select", options: ROLE_OPTIONS },
    { name: "licenseNumber", label: "License Number", type: "text" },
    { name: "licenseExpiry", label: "License Expiry Date", type: "date" },
];

export default function DoctorRegistrationModal({ onSuccess, onClose }: Props) {
    const [form, setForm] = useState<Record<string, string>>({
        role: "JUNIOR_DOCTOR",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (!form.fullName || !form.phone || !form.aadhaarNumber || !form.password) {
            setError("Please fill in all required fields."); return;
        }
        setLoading(true);
        try {
            await api.post("/hospitals/doctors", form);
            setSuccess("Doctor registered successfully! They can now log in.");
            setTimeout(() => { onSuccess(); onClose(); }, 1800);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Registration failed.");
        } finally { setLoading(false); }
    };

    if (!mounted) return null;

    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div className="glass-strong" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", borderRadius: 18, padding: "32px 36px", background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.2)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <h2 style={{ color: "#fff", fontWeight: 800, fontSize: "1.25rem", margin: 0 }}>Register New Doctor</h2>
                        <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "4px 0 0" }}>Add a new doctor to your hospital staff</p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.5rem", lineHeight: 1, padding: 4 }}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                        {FIELDS.map(f => (
                            <div key={f.name} style={{ gridColumn: ["fullName", "aadhaarNumber", "password"].includes(f.name) ? "1 / -1" : "auto" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {f.label}{f.required && <span style={{ color: "#f87171" }}> *</span>}
                                </label>
                                {f.type === "select" ? (
                                    <select
                                        value={form[f.name] || ""}
                                        onChange={e => set(f.name, e.target.value)}
                                        style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.88rem", outline: "none" }}
                                    >
                                        {f.options?.map(o => <option key={o.value} value={o.value} style={{ background: "#1e293b" }}>{o.label}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={f.type}
                                        value={form[f.name] || ""}
                                        onChange={e => set(f.name, e.target.value)}
                                        required={f.required}
                                        style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#fca5a5", fontSize: "0.85rem" }}>{error}</div>}
                    {success && <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#6ee7b7", fontSize: "0.85rem" }}>{success}</div>}

                    <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose}
                            style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                            {loading ? "Registering…" : "Register Doctor"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
