"use client";

import { useState } from "react";
import api from "../../../../utils/api";

interface Hospital { id: number; hospitalName: string; registrationNumber?: string; }
// Backend shape: { id, patientId, hospitalId, status, grantedAt, updatedAt, hospital: { id, hospitalName, slug, city } }
interface Permission {
    patientId: number;
    hospitalId: number;
    status: string; // 'APPROVED' | 'PENDING' | 'REVOKED' | 'REJECTED'
    grantedAt?: string;
    hospital: { id: number; hospitalName: string; slug?: string; city?: string };
}
interface Props {
    hospitals: Hospital[];
    permissions: Permission[];
    onRefresh: () => void;
}

export default function AccessManager({ hospitals, permissions, onRefresh }: Props) {
    const [accessLoading, setAccessLoading] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"manage" | "history">("manage");

    // Permissions keyed by hospitalId
    const permMap = Object.fromEntries(permissions.map(p => [p.hospitalId, p]));

    async function toggleAccess(hospitalId: number, currentlyGranted: boolean, action?: "reject") {
        setAccessLoading(hospitalId);
        try {
            if (action === "reject") {
                await api.post("/access/reject", { hospitalId });
            } else if (currentlyGranted) {
                await api.post("/access/revoke", { hospitalId });
            } else {
                await api.post("/access/grant", { hospitalId });
            }
            await onRefresh();
        } catch { /* ignore */ }
        finally { setAccessLoading(null); }
    }

    const history = [...permissions].sort((a, b) => {
        if (!a.grantedAt && !b.grantedAt) return 0;
        if (!a.grantedAt) return 1;
        if (!b.grantedAt) return -1;
        return new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime();
    });

    // Show hospitals that appear in permissions (via hospital.id)
    const permittedHospitalIds = new Set(permissions.map(p => p.hospitalId));
    // Merge permissions hospital data with hospitals list (or use directly from permissions)
    const hospsFromPerms = permissions.map(p => ({
        id: p.hospital.id,
        hospitalName: p.hospital.hospitalName,
        registrationNumber: '',
    }));
    const allHospitals = [...hospitals, ...hospsFromPerms].filter(
        (h, i, arr) => arr.findIndex(x => x.id === h.id) === i
    );
    const filteredHospitals = allHospitals.filter(h => permMap[h.id]);

    const sortedHospitals = filteredHospitals.sort((a, b) => {
        const statusA = permMap[a.id]?.status ?? 'NONE';
        const statusB = permMap[b.id]?.status ?? 'NONE';
        const weight = { PENDING: 0, APPROVED: 1, REVOKED: 2, REJECTED: 3, NONE: 4 };
        return (weight[statusA as keyof typeof weight] ?? 4) - (weight[statusB as keyof typeof weight] ?? 4);
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, }}>
            {/* Subtabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8, padding: 6, borderRadius: 12, width: "fit-content", background: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-card)" }}>
                {([["manage", "Manage Permissions"], ["history", "Audit History"]] as [typeof activeTab, string][]).map(([t, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", transition: "all 0.2s ease",
                        background: activeTab === t ? "var(--teal-light)" : "transparent",
                        color: activeTab === t ? "var(--teal-500)" : "var(--text-medium)",
                        boxShadow: activeTab === t ? "inset 0 0 12px rgba(26, 188, 156, 0.05)" : "none",
                    }}
                        onMouseOver={e => { if (activeTab !== t) { e.currentTarget.style.color = "var(--text-dark)"; e.currentTarget.style.background = "var(--border-light)"; } }}
                        onMouseOut={e => { if (activeTab !== t) { e.currentTarget.style.color = "var(--text-medium)"; e.currentTarget.style.background = "transparent"; } }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── MANAGE ACCESS ── */}
            {activeTab === "manage" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {sortedHospitals.length === 0 ? (
                        <div className="sh-card" style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)", borderRadius: 16, border: "1px dashed var(--border-light)" }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem" }}>No hospital access requests found.</p>
                        </div>
                    ) : sortedHospitals.map(h => {
                        const perm = permMap[h.id];
                        const granted = perm?.status === 'APPROVED';
                        const isPending = perm?.status === "PENDING";
                        const isRejected = perm?.status === "REJECTED";
                        const isLoading = accessLoading === h.id;

                        // Conditional styles based on status
                        let pillBg = "rgba(100, 116, 139, 0.15)";
                        let pillColor = "#94a3b8";
                        let pillBorder = "rgba(100, 116, 139, 0.3)";
                        let pillText = "No Access";
                        let pillIcon = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;

                        if (granted) {
                            pillBg = "rgba(35, 49, 44, 0.15)"; pillColor = "#34d399"; pillBorder = "rgba(16, 185, 129, 0.3)"; pillText = "Access Granted";
                            pillIcon = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
                        } else if (isPending) {
                            pillBg = "rgba(251, 191, 36, 0.15)"; pillColor = "#fbbf24"; pillBorder = "rgba(251, 191, 36, 0.3)"; pillText = "Request Pending";
                            pillIcon = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
                        } else if (isRejected) {
                            pillBg = "rgba(239, 68, 68, 0.15)"; pillColor = "#fca5a5"; pillBorder = "rgba(239, 68, 68, 0.3)"; pillText = "Request Rejected";
                            pillIcon = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
                        } else if (perm?.status === "REVOKED") {
                            pillBg = "rgba(239, 68, 68, 0.15)"; pillColor = "#fca5a5"; pillBorder = "rgba(239, 68, 68, 0.3)"; pillText = "Access Revoked";
                            pillIcon = <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
                        }

                        // Card background modification if pending
                        const cardBg = isPending ? "rgba(251, 191, 36, 0.05)" : "var(--bg-card)";
                        const cardBorder = isPending ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid var(--border-card)";

                        return (
                            <div key={h.id} className="sh-card" style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, borderRadius: 16, transition: "transform 0.2s ease, box-shadow 0.2s ease", background: cardBg, border: cardBorder }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 12, background: isPending ? "rgba(251, 191, 36, 0.1)" : "rgba(30, 42, 95, 0.06)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", color: isPending ? "#d97706" : "var(--navy-800)" }}>
                                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M12 7v6" /><path d="M9 10h6" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text-dark)", marginBottom: 6 }}>{h.hospitalName}</div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text-medium)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                                            {h.registrationNumber ? <>Reg: <span style={{ color: "var(--navy-900)" }}>{h.registrationNumber}</span></> : null}
                                            {perm?.grantedAt && <span style={{ color: "var(--border-light)" }}>|</span>}
                                            {perm?.grantedAt && <span>Updated {new Date(perm.grantedAt).toLocaleDateString("en-IN")}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    {/* Status pill */}
                                    <span style={{
                                        padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.08em",
                                        background: pillBg, color: pillColor, border: `1px solid ${pillBorder}`,
                                    }}>
                                        {pillIcon} {pillText}
                                    </span>

                                    {/* Actions */}
                                    {isPending ? (
                                        <div style={{ display: "flex", gap: 12 }}>
                                            <button onClick={() => toggleAccess(h.id, false)} disabled={isLoading} className="btn-teal" style={{ padding: "8px 24px", fontSize: "0.9rem", height: "auto" }}>
                                                {isLoading ? "..." : "Approve"}
                                            </button>
                                            <button onClick={() => toggleAccess(h.id, false, "reject")} disabled={isLoading} style={{ padding: "8px 24px", fontSize: "0.9rem", height: "auto", color: "var(--danger)", border: "1px solid var(--danger-light)", background: "transparent", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}
                                                onMouseOver={e => { e.currentTarget.style.background = "var(--danger-light)"; }}
                                                onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
                                                {isLoading ? "..." : "Reject"}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => toggleAccess(h.id, granted)} disabled={isLoading}
                                            className={granted ? "" : "btn-teal"}
                                            style={{
                                                padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, height: "auto", minWidth: 160, borderRadius: 10, cursor: "pointer",
                                                border: granted ? "1px solid rgba(231, 76, 60, 0.4)" : "none",
                                                color: granted ? "var(--danger)" : "#fff",
                                                background: granted ? "transparent" : undefined,
                                            }}
                                            onMouseOver={e => { if (granted && !isLoading) { e.currentTarget.style.background = "var(--danger-light)"; } }}
                                            onMouseOut={e => { if (granted && !isLoading) { e.currentTarget.style.background = "transparent"; } }}
                                        >
                                            {isLoading ? "Updating…" : (granted ? "Revoke Access" : "Grant Access")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div style={{ padding: "20px 24px", borderRadius: 12, fontSize: "0.9rem", color: "var(--text-medium)", display: "flex", gap: 16, alignItems: "center", marginTop: 16, borderLeft: "4px solid var(--navy-800)", background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ padding: 10, background: "rgba(30, 42, 95, 0.08)", borderRadius: "50%", color: "var(--navy-800)" }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        </div>
                        <span style={{ fontWeight: 500, lineHeight: 1.5 }}>
                            Hospitals with granted access can securely view and construct your medical timeline. Revoking prevents all future actions instantly.
                        </span>
                    </div>
                </div>
            )}

            {/* ── ACCESS HISTORY ── */}
            {activeTab === "history" && (
                <div>
                    {history.length === 0 ? (
                        <div className="sh-card" style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)", borderRadius: 16, border: "1px dashed var(--border-light)" }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem" }}>No access history events recorded yet.</p>
                        </div>
                    ) : (
                        <div style={{ position: "relative", paddingLeft: "24px" }}>
                            <div style={{ position: "absolute", left: 23, top: 16, bottom: 16, width: 2, background: "var(--border-light)" }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                {history.map(p => (
                                    <div key={p.hospitalId} style={{ display: "flex", gap: 24, alignItems: "flex-start", position: "relative" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: p.status === 'APPROVED' ? "var(--teal-light)" : "var(--danger-light)", color: p.status === 'APPROVED' ? "var(--teal-500)" : "var(--danger)", border: `2px solid ${p.status === 'APPROVED' ? "rgba(26, 188, 156, 0.4)" : "rgba(231, 76, 60, 0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: -22, zIndex: 2, boxShadow: "0 0 0 6px var(--bg-dashboard)" }}>
                                            {p.status === 'APPROVED' ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                                        </div>
                                        <div className="sh-card" style={{ flex: 1, padding: "24px", borderRadius: 16 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-dark)", marginBottom: 8 }}>{p.hospital?.hospitalName ?? "Unknown Hospital"}</div>
                                            <div style={{ fontSize: "0.9rem", color: "var(--text-medium)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                                                Action: <span style={{ color: p.status === 'APPROVED' ? "var(--teal-500)" : "var(--danger)", fontWeight: 700 }}>{p.status === 'APPROVED' ? "Access Granted" : p.status === 'REVOKED' ? "Access Revoked" : p.status}</span>
                                                {p.grantedAt && <span style={{ color: "var(--border-light)", margin: "0 6px" }}>|</span>}
                                                {p.grantedAt && <span>Timestamp: {new Date(p.grantedAt).toLocaleString("en-IN")}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
