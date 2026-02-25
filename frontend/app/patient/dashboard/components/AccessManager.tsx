"use client";

import { useState } from "react";
import api from "../../../../utils/api";

interface Hospital { id: number; hospitalName: string; registrationNumber: string }
interface Permission { hospitalId: number; accessGranted: boolean; grantedAt?: string; hospital: Hospital; status: string; }
interface Props {
    hospitals: Hospital[];
    permissions: Permission[];
    onRefresh: () => void;
}

export default function AccessManager({ hospitals, permissions, onRefresh }: Props) {
    const [accessLoading, setAccessLoading] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"manage" | "history">("manage");

    const permMap = Object.fromEntries(permissions.map(p => [p.hospitalId, p]));

    // Added action parameter to support "reject"
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

    // Helper to sort hospitals: Pending first, then Granted, then others
    const sortedHospitals = [...hospitals].sort((a, b) => {
        const pA = permMap[a.id];
        const pB = permMap[b.id];
        const statusA = pA?.status || "NONE";
        const statusB = pB?.status || "NONE";

        const weight = { PENDING: 0, APPROVED: 1, REVOKED: 2, REJECTED: 3, NONE: 4 };
        return weight[statusA as keyof typeof weight] - weight[statusB as keyof typeof weight];
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Subtabs */}
            <div className="glass-strong" style={{ display: "flex", gap: 8, marginBottom: 8, padding: 6, borderRadius: 12, width: "fit-content" }}>
                {([["manage", "Manage Permissions"], ["history", "Audit History"]] as [typeof activeTab, string][]).map(([t, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", transition: "all 0.2s ease",
                        background: activeTab === t ? "rgba(59, 130, 246, 0.2)" : "transparent",
                        color: activeTab === t ? "#fff" : "var(--text-secondary)",
                        boxShadow: activeTab === t ? "inset 0 0 12px rgba(59, 130, 246, 0.1)" : "none",
                    }}
                        onMouseOver={e => { if (activeTab !== t) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
                        onMouseOut={e => { if (activeTab !== t) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; } }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── MANAGE ACCESS ── */}
            {activeTab === "manage" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {sortedHospitals.length === 0 ? (
                        <div className="glass" style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)", borderRadius: 16, border: "1px dashed var(--border)" }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem" }}>No hospitals registered yet.</p>
                        </div>
                    ) : sortedHospitals.map(h => {
                        const perm = permMap[h.id];
                        const granted = perm?.accessGranted === true;
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
                            pillBg = "rgba(16, 185, 129, 0.15)"; pillColor = "#34d399"; pillBorder = "rgba(16, 185, 129, 0.3)"; pillText = "Access Granted";
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
                        const cardBg = isPending ? "rgba(251, 191, 36, 0.03)" : "rgba(255,255,255,0.02)";
                        const cardBorder = isPending ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid var(--border)";

                        return (
                            <div key={h.id} className="glass" style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, borderRadius: 16, transition: "transform 0.2s ease, background 0.2s ease", background: cardBg, border: cardBorder }}
                                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = isPending ? "rgba(251, 191, 36, 0.06)" : "rgba(255,255,255,0.04)"; }}
                                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = cardBg; }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 12, background: isPending ? "rgba(251, 191, 36, 0.1)" : "rgba(255,255,255,0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: isPending ? "#fbbf24" : "#60a5fa" }}>
                                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /><path d="M12 7v6" /><path d="M9 10h6" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginBottom: 6 }}>{h.hospitalName}</div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                                            Reg: <span style={{ color: "#e2e8f0" }}>{h.registrationNumber}</span>
                                            {perm?.grantedAt && <span style={{ color: "var(--border)" }}>|</span>}
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
                                            <button onClick={() => toggleAccess(h.id, false)} disabled={isLoading} className="btn-primary" style={{ padding: "8px 24px", fontSize: "0.9rem", height: "auto" }}>
                                                {isLoading ? "..." : "Approve"}
                                            </button>
                                            <button onClick={() => toggleAccess(h.id, false, "reject")} disabled={isLoading} className="btn-outline" style={{ padding: "8px 24px", fontSize: "0.9rem", height: "auto", color: "#fca5a5", borderColor: "rgba(239, 68, 68, 0.5)" }}
                                                onMouseOver={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
                                                onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
                                                {isLoading ? "..." : "Reject"}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => toggleAccess(h.id, granted)} disabled={isLoading}
                                            className={granted ? "btn-outline" : "btn-primary"}
                                            style={{
                                                padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, height: "auto", minWidth: 160,
                                                border: granted ? "1px solid rgba(239, 68, 68, 0.5)" : undefined,
                                                color: granted ? "#fca5a5" : undefined,
                                            }}
                                            onMouseOver={e => { if (granted && !isLoading) { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#f87171"; } }}
                                            onMouseOut={e => { if (granted && !isLoading) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fca5a5"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"; } }}
                                        >
                                            {isLoading ? "Updating…" : (granted ? "Revoke Access" : "Grant Access")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="glass-strong" style={{ padding: "20px 24px", borderRadius: 12, fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", gap: 16, alignItems: "center", marginTop: 16, borderLeft: "4px solid #64748b" }}>
                        <div style={{ padding: 10, background: "rgba(255,255,255,0.05)", borderRadius: "50%", color: "#94a3b8" }}>
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
                        <div className="glass" style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)", borderRadius: 16, border: "1px dashed var(--border)" }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem" }}>No access history events recorded yet.</p>
                        </div>
                    ) : (
                        <div style={{ position: "relative", paddingLeft: "24px" }}>
                            <div style={{ position: "absolute", left: 23, top: 16, bottom: 16, width: 2, background: "rgba(255,255,255,0.1)" }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                {history.map(p => (
                                    <div key={p.hospitalId} style={{ display: "flex", gap: 24, alignItems: "flex-start", position: "relative" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: p.accessGranted ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", color: p.accessGranted ? "#34d399" : "#fca5a5", border: `2px solid ${p.accessGranted ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: -22, zIndex: 2, boxShadow: "0 0 0 6px var(--bg-primary)" }}>
                                            {p.accessGranted ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                                        </div>
                                        <div className="glass" style={{ flex: 1, padding: "24px", borderRadius: 16 }}>
                                            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>{p.hospital?.hospitalName ?? "Unknown Hospital"}</div>
                                            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                                                Action: <span style={{ color: p.accessGranted ? "#34d399" : "#fca5a5", fontWeight: 700 }}>{p.accessGranted ? "Access Granted" : "Access Revoked"}</span>
                                                {p.grantedAt && <span style={{ color: "var(--border)", margin: "0 6px" }}>|</span>}
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
