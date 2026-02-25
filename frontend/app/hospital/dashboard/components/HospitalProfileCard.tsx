"use client";

import { useState } from "react";
import api from "@/utils/api";

interface Profile {
    id: number;
    hospitalName: string;
    registrationNumber: string;
    phone: string;
}

interface Stats {
    totalPatients: number;
    totalRecords: number;
    recentActivity: { id: number; type: string; patientName: string; date: string; diagnosis: string }[];
}

interface Props {
    profile: Profile;
    stats: Stats;
    onProfileUpdate: () => void;
}

export default function HospitalProfileCard({ profile, stats, onProfileUpdate }: Props) {
    const [editMode, setEditMode] = useState(false);
    const [phone, setPhone] = useState(profile.phone);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    async function savePhone() {
        setSaving(true);
        setMsg("");
        try {
            await api.patch("/hospitals/profile", { phone });
            setMsg("Contact info updated!");
            setEditMode(false);
            onProfileUpdate();
        } catch {
            setMsg("Failed to update. Try again.");
        } finally {
            setSaving(false);
        }
    }

    const initials = profile.hospitalName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Top Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                <div className="glass-strong" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="glow-blue" style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(59,130,246,0.15)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Patients Linked</div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stats.totalPatients}</div>
                    </div>
                </div>

                <div className="glass-strong" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="glow-violet" style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(139,92,246,0.15)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Records Uploaded</div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{stats.totalRecords}</div>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="glass-strong" style={{ padding: "32px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>Hospital Identity</h3>
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Avatar */}
                    <div className="glow-blue" style={{ width: 88, height: 88, borderRadius: 16, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", fontWeight: 800, flexShrink: 0 }}>
                        {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <h2 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#fff", margin: 0 }}>{profile.hospitalName}</h2>
                            <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(34,211,238,0.1)", color: "#22d3ee", fontSize: "0.75rem", fontWeight: 700, border: "1px solid rgba(34,211,238,0.3)", letterSpacing: "0.05em" }}>
                                AUTHORIZED PROVIDER
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                <span style={{ fontWeight: 500, width: 140 }}>Registration No:</span>
                                <span style={{ fontWeight: 600, color: "#fff" }}>{profile.registrationNumber}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                <span style={{ fontWeight: 500, width: 140 }}>Contact Phone:</span>

                                {editMode ? (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" style={{ padding: "6px 12px", width: 160 }} />
                                        <button onClick={savePhone} disabled={saving} className="btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                                            {saving ? "Saving…" : "Save"}
                                        </button>
                                        <button onClick={() => { setEditMode(false); setPhone(profile.phone); }} className="btn-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ fontWeight: 600, color: "#fff" }}>{profile.phone}</span>
                                        <button onClick={() => setEditMode(true)} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0 }}>Edit</button>
                                    </div>
                                )}
                            </div>
                            {msg && <div style={{ marginLeft: 164, marginTop: 4, fontSize: "0.85rem", color: msg.includes("Failed") ? "#fca5a5" : "#86efac", fontWeight: 500 }}>{msg}</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Upload Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div className="glass-strong" style={{ padding: "32px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Recent Upload Activity</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {stats.recentActivity.map((act) => (
                            <div key={act.id} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12 }}>
                                <div style={{ width: 44, height: 44, background: "rgba(59,130,246,0.1)", color: "#60a5fa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>Uploaded Medical Record for {act.patientName}</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Diagnosis: {act.diagnosis}</div>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                                    {new Date(act.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
