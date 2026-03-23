"use client";

import { useState } from "react";
import api from "@/utils/api";
import { LuUsers, LuFileText, LuCalendar, LuPhone, LuFilePlus } from "react-icons/lu";

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
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(15,27,63,0.06)", padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <LuUsers size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "#5F7285", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Patients Linked</div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>{stats.totalPatients}</div>
                    </div>
                </div>

                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(15,27,63,0.06)", padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <LuFileText size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "#5F7285", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Records Uploaded</div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>{stats.totalRecords}</div>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(15,27,63,0.06)", padding: "32px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #E8EDF5" }}>Hospital Identity</h3>
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Avatar */}
                    <div style={{ width: 88, height: 88, borderRadius: 16, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", fontWeight: 800, flexShrink: 0, boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}>
                        {initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <h2 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#1E293B", margin: 0 }}>{profile.hospitalName}</h2>
                            <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, border: "1px solid rgba(16,185,129,0.3)", letterSpacing: "0.05em" }}>
                                AUTHORIZED PROVIDER
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5F7285", fontSize: "0.95rem" }}>
                                <LuCalendar size={18} />
                                <span style={{ fontWeight: 500, width: 140 }}>Registration No:</span>
                                <span style={{ fontWeight: 600, color: "#1E293B" }}>{profile.registrationNumber}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5F7285", fontSize: "0.95rem" }}>
                                <LuPhone size={18} />
                                <span style={{ fontWeight: 500, width: 140 }}>Contact Phone:</span>

                                {editMode ? (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <input value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: "6px 12px", width: 160, border: "1px solid #d0d9e8", borderRadius: 6, color: "#1E293B" }} />
                                        <button onClick={savePhone} disabled={saving} className="btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                                            {saving ? "Saving…" : "Save"}
                                        </button>
                                        <button onClick={() => { setEditMode(false); setPhone(profile.phone); }} className="btn-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{profile.phone}</span>
                                        <button onClick={() => setEditMode(true)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, padding: 0 }}>Edit</button>
                                    </div>
                                )}
                            </div>
                            {msg && <div style={{ marginLeft: 164, marginTop: 4, fontSize: "0.85rem", color: msg.includes("Failed") ? "#ef4444" : "#10b981", fontWeight: 500 }}>{msg}</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Upload Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(15,27,63,0.06)", padding: "32px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", marginBottom: 20 }}>Recent Upload Activity</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {stats.recentActivity.map((act) => (
                            <div key={act.id} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px", background: "#f8fafc", border: "1px solid #E8EDF5", borderRadius: 12 }}>
                                <div style={{ width: 44, height: 44, background: "rgba(59,130,246,0.1)", color: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <LuFilePlus size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>Uploaded Medical Record for {act.patientName}</div>
                                    <div style={{ fontSize: "0.85rem", color: "#5F7285" }}>Diagnosis: {act.diagnosis}</div>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
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
