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
    licenseStatus: string;
    daysRemaining: number | null;
    workingHoursStart: string;
    workingHoursEnd: string;
}

interface Performance {
    totalActions: number;
    breakdownByAction: Record<string, number>;
    outOfHoursAccess: number;
    assignedPatients: number;
}

interface ActivityLog {
    id: number;
    action: string;
    detail: string;
    timestamp: string;
    isOutsideWorkHours: boolean;
    patient?: { fullName: string };
}

interface AssignedPatient {
    assignmentId: number;
    patientId: number;
    fullName: string;
    gender: string;
    isEmergency: boolean;
    assignedAt: string;
}

interface Props {
    doctor: Doctor;
    onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
    VIEW_RECORDS: "Record Views",
    DOWNLOAD_REPORT: "Downloads",
    VIEW_AI_SUMMARY: "AI Summaries",
    LOGIN: "Logins",
};

export default function DoctorDetailPanel({ doctor, onClose }: Props) {
    const [activeTab, setActiveTab] = useState<"performance" | "activity" | "patients">("performance");
    const [performance, setPerformance] = useState<Performance | null>(null);
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [patients, setPatients] = useState<AssignedPatient[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignPatientId, setAssignPatientId] = useState("");
    const [assignEmergency, setAssignEmergency] = useState(false);
    const [assignMsg, setAssignMsg] = useState("");

    const fetchPerformance = async () => {
        try {
            const r = await api.get(`/hospitals/doctors/${doctor.id}/performance`);
            setPerformance(r.data);
        } catch { }
    };

    const fetchActivityLog = async () => {
        try {
            const r = await api.get(`/hospitals/doctors/${doctor.id}/activity`);
            setActivityLog(r.data);
        } catch { }
    };

    const fetchPatients = async () => {
        try {
            const r = await api.get(`/hospitals/doctors/${doctor.id}/patients`);
            setPatients(r.data);
        } catch { }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchPerformance(), fetchActivityLog(), fetchPatients()]).finally(() => setLoading(false));
    }, [doctor.id]);

    const handleAssign = async () => {
        if (!assignPatientId) { setAssignMsg("Enter a patient ID."); return; }
        try {
            await api.post(`/hospitals/doctors/${doctor.id}/assign-patient`, {
                patientId: Number(assignPatientId),
                isEmergency: assignEmergency,
            });
            setAssignMsg("Patient assigned successfully!");
            setAssignPatientId("");
            fetchPatients();
            fetchPerformance(); // Update count
        } catch (err: any) {
            setAssignMsg(err?.response?.data?.message || "Failed to assign.");
        }
        setTimeout(() => setAssignMsg(""), 3000);
    };

    const handleUnassign = async (patientId: number) => {
        if (!confirm("Are you sure you want to unassign this patient?")) return;
        try {
            await api.delete(`/hospitals/doctors/${doctor.id}/unassign-patient/${patientId}`);
            setPatients(prev => prev.filter(p => p.patientId !== patientId));
            fetchPerformance(); // Update count
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to unassign.");
        }
    };

    const lc = {
        VALID: { color: "#10b981" },
        EXPIRING_SOON: { color: "#f59e0b" },
        EXPIRED: { color: "#ef4444" },
        NO_EXPIRY_SET: { color: "#64748b" },
    }[doctor.licenseStatus] || { color: "#64748b" };

    return (
        <div style={{ marginTop: 24 }}>
            {/* Doctor Summary Header */}
            <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", marginBottom: 20, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "1.3rem" }}>
                    {doctor.fullName?.[0]?.toUpperCase() || "D"}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f1f5f9" }}>{doctor.fullName}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 2 }}>
                        {doctor.specialization} {doctor.department ? `· ${doctor.department}` : ""} · {doctor.role?.replace(/_/g, " ")}
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981" }}>
                        License: VERIFIED
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2 }}>{doctor.licenseNumber}</div>
                    {doctor.workingHoursStart && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                            Hours: {doctor.workingHoursStart} – {doctor.workingHoursEnd}
                        </div>
                    )}
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.4rem" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 2 }}>
                {(["performance", "activity", "patients"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{ padding: "8px 18px", borderRadius: "8px 8px 0 0", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: activeTab === tab ? "rgba(59,130,246,0.15)" : "transparent", color: activeTab === tab ? "#60a5fa" : "#64748b", borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent", textTransform: "capitalize" }}>
                        {tab === "performance" ? "📊 Performance" : tab === "activity" ? "📋 Activity Log" : "👥 Assigned Patients"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 32, color: "#64748b" }}>Loading…</div>
            ) : (
                <>
                    {/* Performance */}
                    {activeTab === "performance" && performance && (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: "Total Actions", value: performance.totalActions, color: "#60a5fa" },
                                    { label: "Assigned Patients", value: performance.assignedPatients, color: "#10b981" },
                                    { label: "Out-of-Hours Access", value: performance.outOfHoursAccess, color: performance.outOfHoursAccess > 0 ? "#f59e0b" : "#6b7280" },
                                ].map(s => (
                                    <div key={s.label} style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Action Breakdown</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {Object.entries(performance.breakdownByAction).map(([action, count]) => {
                                    const total = performance.totalActions || 1;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={action}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                                                <span style={{ color: "#cbd5e1" }}>{ACTION_LABELS[action] || action}</span>
                                                <span style={{ color: "#64748b" }}>{count} &nbsp;({pct}%)</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                                                <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", transition: "width 0.4s" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {Object.keys(performance.breakdownByAction).length === 0 && (
                                    <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No activity recorded yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activity Log */}
                    {activeTab === "activity" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                            {activityLog.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.85rem", padding: 12 }}>No activity recorded yet.</div>
                            ) : activityLog.map(log => (
                                <div key={log.id} style={{ padding: "10px 14px", borderRadius: 8, background: log.isOutsideWorkHours ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${log.isOutsideWorkHours ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", gap: 14 }}>
                                    {log.isOutsideWorkHours && <span title="Outside working hours" style={{ fontSize: "0.9rem" }}>⚠️</span>}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
                                            {ACTION_LABELS[log.action] || log.action}
                                            {log.patient ? ` — ${log.patient.fullName}` : ""}
                                        </div>
                                        {log.detail && <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>{log.detail}</div>}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", color: "#475569", whiteSpace: "nowrap" }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Assigned Patients */}
                    {activeTab === "patients" && (
                        <div>
                            {/* Assign form */}
                            <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", marginBottom: 16 }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Assign Patient</div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                    <input
                                        value={assignPatientId}
                                        onChange={e => setAssignPatientId(e.target.value)}
                                        placeholder="Patient ID"
                                        type="number"
                                        style={{ flex: 1, minWidth: 120, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#e2e8f0", fontSize: "0.85rem", outline: "none" }}
                                    />
                                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#94a3b8", cursor: "pointer" }}>
                                        <input type="checkbox" checked={assignEmergency} onChange={e => setAssignEmergency(e.target.checked)} />
                                        Emergency
                                    </label>
                                    <button onClick={handleAssign}
                                        style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                                        Assign
                                    </button>
                                </div>
                                {assignMsg && <div style={{ marginTop: 8, fontSize: "0.82rem", color: assignMsg.includes("success") ? "#6ee7b7" : "#fca5a5" }}>{assignMsg}</div>}
                            </div>

                            {/* Patients list */}
                            {patients.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No patients assigned yet.</div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {patients.map(p => (
                                        <div key={p.assignmentId} style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${p.isEmergency ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", gap: 14 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.isEmergency ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: p.isEmergency ? "#f87171" : "#60a5fa", fontSize: "0.9rem" }}>
                                                {p.isEmergency ? "🚨" : (p.fullName?.[0]?.toUpperCase() || "P")}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.9rem" }}>{p.fullName}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ID: {p.patientId} · {p.gender || "—"}</div>
                                            </div>
                                            {p.isEmergency && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}>EMERGENCY</span>}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                                <div style={{ fontSize: "0.72rem", color: "#475569" }}>{new Date(p.assignedAt).toLocaleDateString()}</div>
                                                <button 
                                                    onClick={() => handleUnassign(p.patientId)}
                                                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}
                                                    onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                                    onMouseOut={e => e.currentTarget.style.background = "none"}
                                                >
                                                    Unassign
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
