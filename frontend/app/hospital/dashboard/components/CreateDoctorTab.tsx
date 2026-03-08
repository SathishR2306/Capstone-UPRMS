"use client";

import { useState } from "react";
import api from "../../../../utils/api";

interface CreatedDoctor {
    doctorId: number;
    userId: number;
    fullName: string;
    phone: string;
    tempPassword: string;
    specialization?: string;
    department?: string;
    role: string;
}

const ROLE_OPTIONS = [
    { value: "JUNIOR_DOCTOR", label: "Junior Doctor" },
    { value: "SENIOR_CONSULTANT", label: "Senior Consultant" },
];

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

export default function CreateDoctorTab() {
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        aadhaarNumber: "",
        password: "",
        specialization: "",
        department: "",
        role: "JUNIOR_DOCTOR",
        licenseNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState<CreatedDoctor | null>(null);

    const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setCreated(null);
        if (!form.fullName || !form.phone || !form.aadhaarNumber || !form.password) {
            setError("Please fill in all required fields (Name, Phone, Aadhaar, Password).");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post("/hospitals/doctors", form);
            setCreated({
                ...res.data,
                fullName: form.fullName,
                phone: form.phone,
                tempPassword: form.password,
                specialization: form.specialization,
                department: form.department,
                role: form.role,
            });
            setForm({
                fullName: "", phone: "", aadhaarNumber: "", password: "",
                specialization: "", department: "", role: "JUNIOR_DOCTOR",
                licenseNumber: "",
            });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create doctor. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => { setCreated(null); setError(""); };

    const ROLE_LABEL: Record<string, string> = {
        JUNIOR_DOCTOR: "Junior Doctor",
        SENIOR_CONSULTANT: "Senior Consultant",
        RESIDENT: "Resident",
        READ_ONLY: "Read-Only",
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.3rem", boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
                    }}>👨‍⚕️</div>
                    <div>
                        <h2 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.2rem", margin: 0 }}>
                            Create Doctor Account
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "0.82rem", margin: "3px 0 0" }}>
                            Register a new doctor and assign them to your hospital
                        </p>
                    </div>
                </div>
                <div style={{
                    padding: "10px 16px",
                    background: "rgba(59,130,246,0.07)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 10,
                    fontSize: "0.81rem",
                    color: "#93c5fd",
                    lineHeight: 1.6,
                }}>
                    ℹ️ The doctor can log in immediately with the credentials you set below. You can manage roles and assign patients from the <strong>Doctor Management</strong> tab.
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
                            Doctor Account Created Successfully
                        </div>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Login Credentials — Share with Doctor
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "Doctor Name", value: created.fullName },
                            { label: "Doctor ID", value: `#${created.doctorId}` },
                            { label: "Phone (Login ID)", value: created.phone },
                            { label: "Temporary Password", value: created.tempPassword },
                            { label: "Role", value: ROLE_LABEL[created.role] ?? created.role },
                            { label: "Specialization", value: created.specialization || "—" },
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
                    <div style={{ marginTop: 16 }}>
                        <button
                            onClick={resetForm}
                            style={{
                                padding: "10px 22px", borderRadius: 8, border: "none",
                                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                                color: "#fff", fontSize: "0.88rem", fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            + Create Another Doctor
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
                            <input type="text" value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Dr. Priya Sharma" required style={inputStyle} />
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>Phone Number <span style={{ color: "#f87171" }}>*</span></label>
                            <input type="text" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="10-digit mobile number" required style={inputStyle} />
                        </div>

                        {/* Aadhaar */}
                        <div>
                            <label style={labelStyle}>Aadhaar Number <span style={{ color: "#f87171" }}>*</span></label>
                            <input type="text" value={form.aadhaarNumber} onChange={e => set("aadhaarNumber", e.target.value)} placeholder="12-digit Aadhaar" required style={inputStyle} />
                        </div>

                        {/* Password – full width */}
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={labelStyle}>Temporary Password <span style={{ color: "#f87171" }}>*</span></label>
                            <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Set an initial password for the doctor" required style={inputStyle} />
                        </div>

                        {/* Specialization */}
                        <div>
                            <label style={labelStyle}>Specialization</label>
                            <input type="text" value={form.specialization} onChange={e => set("specialization", e.target.value)} placeholder="e.g. Cardiology" style={inputStyle} />
                        </div>

                        {/* Department */}
                        <div>
                            <label style={labelStyle}>Department</label>
                            <input type="text" value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Cardiac ICU" style={inputStyle} />
                        </div>

                        {/* Role */}
                        <div>
                            <label style={labelStyle}>Role / Permission Level</label>
                            <select value={form.role} onChange={e => set("role", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                {ROLE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value} style={{ background: "#1e293b" }}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* License Number */}
                        <div>
                            <label style={labelStyle}>License Number</label>
                            <input type="text" value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} placeholder="MCI/State license ID" style={inputStyle} />
                        </div>
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
                                background: loading ? "rgba(59,130,246,0.3)" : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                                color: "#fff", fontSize: "0.9rem", fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                boxShadow: loading ? "none" : "0 4px 16px rgba(59,130,246,0.3)",
                            }}
                        >
                            {loading ? "Creating Account…" : "Create Doctor Account"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
