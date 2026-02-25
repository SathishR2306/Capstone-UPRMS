"use client";

import { useState } from "react";
import api from "../../../../utils/api";

interface Profile {
    id: number;
    fullName: string;
    phone: string;
    maskedAadhaar: string;
    dateOfBirth: string;
    gender: string;
}

interface Props {
    profile: Profile;
    recordCount: number;
    hospitalCount: number;
    onProfileUpdate: () => void;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfileCard({ profile, recordCount, hospitalCount, onProfileUpdate }: Props) {
    const [editMode, setEditMode] = useState(false);
    const [phone, setPhone] = useState(profile.phone);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    async function savePhone() {
        setSaving(true);
        setMsg("");
        try {
            await api.patch("/patient/profile", { phone });
            setMsg("Phone updated!");
            setEditMode(false);
            onProfileUpdate();
        } catch {
            setMsg("Failed to update. Try again.");
        } finally {
            setSaving(false);
        }
    }

    const initials = profile.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const age = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    return (
        <div className="glass animate-fade-up" style={{ padding: "24px 32px", borderRadius: 16 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, flexShrink: 0, boxShadow: "0 8px 16px rgba(37, 99, 235, 0.25)" }}>
                        {initials}
                    </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{profile.fullName}</h2>
                        <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", fontSize: "0.75rem", fontWeight: 700, border: "1px solid rgba(59, 130, 246, 0.2)", letterSpacing: "0.05em" }}>
                            PATIENT
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
                        {/* Phone — editable */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            {editMode ? (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" style={{ padding: "6px 12px", fontSize: "0.85rem", width: 150 }} />
                                    <button onClick={savePhone} disabled={saving} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem", height: "auto" }}>
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button onClick={() => { setEditMode(false); setPhone(profile.phone); }} className="btn-outline" style={{ padding: "6px 14px", fontSize: "0.8rem", height: "auto" }}>
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <span>{profile.phone} <button onClick={() => setEditMode(true)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.8rem", padding: "0 0 0 8px", fontWeight: 600, transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "#93c5fd"} onMouseOut={e => e.currentTarget.style.color = "#60a5fa"}>Edit</button></span>
                            )}
                        </div>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {profile.maskedAadhaar}
                        </span>
                        <span>{formatDate(profile.dateOfBirth)} <span style={{ color: "#64748b", marginLeft: 4 }}>({age} yrs)</span></span>
                        <span style={{ textTransform: "capitalize", display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            {profile.gender}
                        </span>
                    </div>
                    {msg && <p style={{ marginTop: 8, fontSize: "0.85rem", color: msg.includes("Failed") ? "#f87171" : "#4ade80", fontWeight: 500 }}>{msg}</p>}
                </div>

                {/* Quick stats */}
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
                    {[
                        { n: recordCount, label: "Records", color: "#60a5fa" },
                        { n: hospitalCount, label: "Hospitals", color: "#c084fc" },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: "center", minWidth: 72 }}>
                            <div style={{ fontWeight: 800, fontSize: "1.75rem", color: "#fff", lineHeight: 1, textShadow: `0 0 12px ${s.color}40` }}>{s.n}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
