"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

type AuditRecord = {
    id: number | string;
    type: "UPLOAD" | "ACCESS_REQUEST";
    details: string;
    patientName: string;
    date: string;
    status: string;
};

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                // Fetch Access Requests
                const accessRes = await api.get("/access/hospital-requests");
                const accessLogs = accessRes.data.map((r: any) => ({
                    id: `req-${r.patientId}-${new Date(r.grantedAt).getTime()}`,
                    type: "ACCESS_REQUEST",
                    details: `Requested access to patient records`,
                    patientName: r.fullName,
                    date: r.grantedAt,
                    status: r.status
                }));

                // Fetch Uploaded Records
                const recordsRes = await api.get("/medical-records/hospital-records");
                const uploadLogs = recordsRes.data.map((r: any) => ({
                    id: `upl-${r.id}`,
                    type: "UPLOAD",
                    details: `Uploaded medical document: ${r.diagnosis}`,
                    patientName: r.patient.fullName,
                    date: r.createdAt || r.visitDate,
                    status: "COMPLETED"
                }));

                const combined = [...accessLogs, ...uploadLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setLogs(combined);
            } catch (err) {
                console.error("Failed to load audit logs", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) return <div style={{ padding: 20, color: "#64748b" }}>Loading audit records...</div>;

    const exportLogs = () => {
        const headers = ["Date", "Type", "Patient", "Details", "Status"];
        const rows = logs.map(l => [
            new Date(l.date).toLocaleString("en-IN").replace(",", ""),
            l.type,
            l.patientName,
            `"${l.details}"`,
            l.status
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hospital-audit-logs.csv";
        a.click();
    };

    return (
        <div className="glass-strong" style={{ padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>System Audit Trail</h3>
                <button onClick={exportLogs} className="btn-outline" style={{ padding: "8px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export CSV
                </button>
            </div>

            {logs.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)" }}>
                    No audit logs available for this hospital.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.08em" }}>
                                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Timestamp</th>
                                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Action Type</th>
                                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Patient Identity</th>
                                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Activity Detail</th>
                                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}
                                    onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                    onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "16px", color: "var(--text-secondary)", fontWeight: 500 }}>
                                        {new Date(log.date).toLocaleString("en-IN", {
                                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700, background: log.type === "UPLOAD" ? "rgba(2, 132, 199, 0.15)" : "rgba(147, 51, 234, 0.15)", color: log.type === "UPLOAD" ? "#38bdf8" : "#c084fc", border: `1px solid ${log.type === "UPLOAD" ? "rgba(2, 132, 199, 0.3)" : "rgba(147, 51, 234, 0.3)"}` }}>
                                            {log.type.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>{log.patientName}</td>
                                    <td style={{ padding: "16px", color: "var(--text-secondary)" }}>{log.details}</td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{
                                            fontSize: "0.8rem", fontWeight: 700, padding: "4px 10px", borderRadius: 12, border: "1px solid",
                                            ...(log.status === "COMPLETED" || log.status === "APPROVED" ? { background: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" } :
                                                log.status === "PENDING" ? { background: "rgba(234, 179, 8, 0.1)", borderColor: "rgba(234, 179, 8, 0.2)", color: "#facc15" } :
                                                    { background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" })
                                        }}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
