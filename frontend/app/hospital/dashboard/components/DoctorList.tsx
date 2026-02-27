"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";

interface Doctor {
    id: number;
    fullName: string;
    specialization: string;
    department: string;
    role: string;
    status: string;
    licenseNumber: string;
    licenseExpiry: string;
    licenseStatus: string;
    daysRemaining: number | null;
    phone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
}

interface Props {
    onSelectDoctor: (d: Doctor) => void;
    selectedDoctorId?: number;
    onAddDoctor: () => void;
    refreshKey: number;
}

const ROLE_COLORS: Record<string, string> = {
    SENIOR_CONSULTANT: "#10b981",
    JUNIOR_DOCTOR: "#3b82f6",
    RESIDENT: "#8b5cf6",
    READ_ONLY: "#6b7280",
};

const ROLE_LABELS: Record<string, string> = {
    SENIOR_CONSULTANT: "Senior Consultant",
    JUNIOR_DOCTOR: "Junior Doctor",
    RESIDENT: "Resident",
    READ_ONLY: "Read-Only",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    ACTIVE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Active" },
    SUSPENDED: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Suspended" },
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Pending" },
};

const LICENSE_CONFIG: Record<string, { color: string; icon: string }> = {
    VALID: { color: "#10b981", icon: "✓" },
    EXPIRING_SOON: { color: "#f59e0b", icon: "⚠" },
    EXPIRED: { color: "#ef4444", icon: "✕" },
    NO_EXPIRY_SET: { color: "#6b7280", icon: "–" },
};

export default function DoctorList({ onSelectDoctor, selectedDoctorId, onAddDoctor, refreshKey }: Props) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [msg, setMsg] = useState("");

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const r = await api.get("/hospitals/doctors");
            setDoctors(r.data);
        } catch { setDoctors([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDoctors(); }, [refreshKey]);

    const handleSuspend = async (doctorId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Suspend this doctor's account?")) return;
        setActionLoading(doctorId);
        try {
            await api.patch(`/hospitals/doctors/${doctorId}/suspend`);
            setMsg("Doctor suspended.");
            fetchDoctors();
        } catch { setMsg("Failed to suspend."); }
        finally { setActionLoading(null); setTimeout(() => setMsg(""), 3000); }
    };

    const handleReactivate = async (doctorId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setActionLoading(doctorId);
        try {
            await api.patch(`/hospitals/doctors/${doctorId}`, { status: "ACTIVE" });
            setMsg("Doctor reactivated.");
            fetchDoctors();
        } catch { setMsg("Failed to reactivate."); }
        finally { setActionLoading(null); setTimeout(() => setMsg(""), 3000); }
    };

    const handleRemove = async (doctorId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Permanently remove this doctor? This cannot be undone.")) return;
        setActionLoading(doctorId);
        try {
            await api.delete(`/hospitals/doctors/${doctorId}`);
            setMsg("Doctor removed.");
            fetchDoctors();
        } catch { setMsg("Failed to remove."); }
        finally { setActionLoading(null); setTimeout(() => setMsg(""), 3000); }
    };

    const filtered = doctors.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q || d.fullName?.toLowerCase().includes(q) || d.department?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q);
        const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>
                        Registered Doctors <span style={{ color: "#60a5fa", fontSize: "0.9rem" }}>({doctors.length})</span>
                    </h3>
                    <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "2px 0 0" }}>
                        Manage your hospital's medical staff
                    </p>
                </div>
                <button
                    onClick={onAddDoctor}
                    style={{ padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Add Doctor
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, department…"
                    style={{ flex: 1, minWidth: 200, padding: "8px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: "0.88rem", outline: "none" }}
                />
                {["ALL", "ACTIVE", "SUSPENDED", "PENDING"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", borderColor: filterStatus === s ? "#3b82f6" : "rgba(255,255,255,0.1)", background: filterStatus === s ? "rgba(59,130,246,0.15)" : "transparent", color: filterStatus === s ? "#60a5fa" : "#64748b" }}
                    >{s}</button>
                ))}
            </div>

            {msg && (
                <div style={{ marginBottom: 12, padding: "10px 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, color: "#6ee7b7", fontSize: "0.88rem" }}>{msg}</div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading doctors…</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    {doctors.length === 0 ? "No doctors registered yet. Add your first doctor." : "No doctors match the filter."}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map(d => {
                        const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.ACTIVE;
                        const lc = LICENSE_CONFIG[d.licenseStatus] || LICENSE_CONFIG.NO_EXPIRY_SET;
                        const rc = ROLE_COLORS[d.role] || "#6b7280";
                        const isSelected = d.id === selectedDoctorId;
                        const isLoading = actionLoading === d.id;

                        return (
                            <div
                                key={d.id}
                                onClick={() => onSelectDoctor(d)}
                                style={{ padding: "16px 20px", borderRadius: 12, border: `1px solid ${isSelected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.07)"}`, background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                            >
                                {/* Avatar */}
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${rc},#1e293b)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "1.1rem", flexShrink: 0 }}>
                                    {d.fullName?.[0]?.toUpperCase() || "D"}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.95rem" }}>{d.fullName || "—"}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                                        {d.specialization || "—"} {d.department ? `· ${d.department}` : ""}
                                    </div>
                                </div>

                                {/* Role badge */}
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, color: rc, background: `${rc}18`, border: `1px solid ${rc}40`, whiteSpace: "nowrap" }}>
                                    {ROLE_LABELS[d.role] || d.role}
                                </span>

                                {/* Status */}
                                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.color}30`, whiteSpace: "nowrap" }}>
                                    ● {sc.label}
                                </span>

                                {/* License */}
                                <span style={{ fontSize: "0.78rem", color: lc.color, whiteSpace: "nowrap", minWidth: 90 }}>
                                    {lc.icon} License {d.licenseStatus === "EXPIRING_SOON" ? `(${d.daysRemaining}d)` : d.licenseStatus === "EXPIRED" ? "EXPIRED" : d.licenseStatus === "VALID" ? "Valid" : "—"}
                                </span>

                                {/* Working hours */}
                                {d.workingHoursStart && (
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                                        🕐 {d.workingHoursStart}–{d.workingHoursEnd}
                                    </span>
                                )}

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    {d.status === "ACTIVE" ? (
                                        <button onClick={e => handleSuspend(d.id, e)} disabled={isLoading}
                                            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                                            Suspend
                                        </button>
                                    ) : d.status === "SUSPENDED" ? (
                                        <button onClick={e => handleReactivate(d.id, e)} disabled={isLoading}
                                            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#6ee7b7", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                                            Reactivate
                                        </button>
                                    ) : null}
                                    <button onClick={e => handleRemove(d.id, e)} disabled={isLoading}
                                        style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(100,116,139,0.3)", background: "rgba(100,116,139,0.08)", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
