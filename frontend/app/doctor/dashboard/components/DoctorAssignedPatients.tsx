"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";

interface AssignedPatient {
    assignmentId: number;
    patientId: number;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    phone: string;
    isEmergency: boolean;
    assignedAt: string;
}

interface Props {
    onSelectPatient?: (p: { id: number; fullName: string }) => void;
}

export default function DoctorAssignedPatients({ onSelectPatient }: Props) {
    const [patients, setPatients] = useState<AssignedPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/doctors/assigned-patients")
            .then(r => setPatients(r.data))
            .catch(() => setPatients([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return !q || p.fullName?.toLowerCase().includes(q) || String(p.patientId).includes(q);
    });

    const age = (dob: string): string => {
        if (!dob) return "—";
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + "y";
    };

    return (
        <div>
            <div style={{ marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ padding: 9, background: "rgba(139,92,246,0.1)", borderRadius: 10, color: "#a78bfa" }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    My Assigned Patients
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "8px 0 0 54px" }}>Patients assigned to you by your hospital. Click to view records.</p>
            </div>

            {/* Search */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or ID…"
                        style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: "0.88rem", outline: "none", boxSizing: "border-box" }}
                    />
                    <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", whiteSpace: "nowrap" }}>
                    {patients.length} patient{patients.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Emergency alert */}
            {patients.some(p => p.isEmergency) && (
                <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.1rem" }}>🚨</span>
                    <span style={{ color: "#fca5a5", fontSize: "0.88rem", fontWeight: 600 }}>
                        {patients.filter(p => p.isEmergency).length} emergency patient(s) assigned. Please prioritize.
                    </span>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading patients…</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>👥</div>
                    <div style={{ fontWeight: 600 }}>{patients.length === 0 ? "No patients assigned yet" : "No results found"}</div>
                    <div style={{ fontSize: "0.82rem", marginTop: 6 }}>Your hospital admin will assign patients to you</div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                    {filtered.map(p => (
                        <div key={p.assignmentId}
                            onClick={() => onSelectPatient?.({ id: p.patientId, fullName: p.fullName })}
                            style={{ padding: "18px 20px", borderRadius: 12, border: `1px solid ${p.isEmergency ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`, background: p.isEmergency ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.03)", cursor: onSelectPatient ? "pointer" : "default", transition: "all 0.2s", position: "relative", overflow: "hidden" }}>

                            {/* Emergency accent */}
                            {p.isEmergency && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />}

                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{ width: 42, height: 42, borderRadius: "50%", background: p.isEmergency ? "rgba(239,68,68,0.2)" : "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: p.isEmergency ? "#f87171" : "#a78bfa", fontSize: "1rem", flexShrink: 0, marginTop: 2 }}>
                                    {p.isEmergency ? "🚨" : (p.fullName?.[0]?.toUpperCase() || "P")}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.fullName || "—"}</div>
                                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                                        ID: {p.patientId} · {p.gender || "—"} · {age(p.dateOfBirth)}
                                    </div>
                                    {p.phone && <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: 2 }}>📞 {p.phone}</div>}
                                </div>
                            </div>

                            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                {p.isEmergency ? (
                                    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>EMERGENCY</span>
                                ) : <span />}
                                <div style={{ fontSize: "0.72rem", color: "#475569" }}>Assigned {new Date(p.assignedAt).toLocaleDateString()}</div>
                            </div>

                            {onSelectPatient && (
                                <div style={{ marginTop: 10, padding: "6px 0 0", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.78rem", color: "#8b5cf6", fontWeight: 600 }}>
                                    View Records →
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
