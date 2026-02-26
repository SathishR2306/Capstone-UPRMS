"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface Record {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: { hospitalName: string };
}

const isSurgery = (diag: string) => /surg|operation|oper|procedure/i.test(diag);
const isCritical = (diag: string) => /cancer|cardiac|attack|stroke|fracture|icu|critical|emerg/i.test(diag);
const isRecurring = (diag: string, all: Record[]) =>
    all.filter(r => r.diagnosis.split(" ").slice(0, 3).some(w => w.length > 4 && diag.toLowerCase().includes(w.toLowerCase()))).length >= 2;

const getYear = (date: string) => date?.split("-")?.[0] || "Unknown";

export default function SmartTimeline({ patientId, patientName }: { patientId?: number; patientName?: string }) {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [popup, setPopup] = useState<Record | null>(null);

    useEffect(() => {
        if (!patientId) { setRecords([]); return; }
        setLoading(true); setErr("");
        api.get(`/doctors/patients/${patientId}/records`)
            .then(r => setRecords(r.data))
            .catch(e => setErr(e?.response?.data?.message || "Failed to load records."))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (!patientId) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No patient selected</div>
            <div style={{ fontSize: "0.88rem" }}>Select a patient from the search tab first.</div>
        </div>
    );

    if (loading) return <div style={{ padding: 20, color: "var(--text-secondary)" }}>Building timeline…</div>;
    if (err) return <div style={{ padding: 24, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#fca5a5" }}>🔒 {err}</div>;

    // Group by year descending
    const byYear: Record<string, Record[]> = {};
    [...records].sort((a, b) => b.visitDate.localeCompare(a.visitDate)).forEach(r => {
        const y = getYear(r.visitDate);
        (byYear[y] ||= []).push(r);
    });

    const getBadge = (r: Record) => {
        if (isSurgery(r.diagnosis)) return { icon: "🏥", label: "Surgery", color: "#f87171", bg: "rgba(239,68,68,0.1)" };
        if (isCritical(r.diagnosis)) return { icon: "⚠️", label: "Critical", color: "#facc15", bg: "rgba(234,179,8,0.1)" };
        if (isRecurring(r.diagnosis, records)) return { icon: "🔄", label: "Recurring", color: "#60a5fa", bg: "rgba(59,130,246,0.1)" };
        return null;
    };

    return (
        <div style={{ position: "relative" }}>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 20 }}>
                Smart Timeline: <span style={{ color: "#a78bfa" }}>{patientName}</span>
                <span style={{ marginLeft: 12, fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 400 }}>{records.length} visits</span>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[["🏥", "Surgery", "#f87171"], ["⚠️", "Critical", "#facc15"], ["🔄", "Recurring", "#60a5fa"], ["🩺", "General", "#94a3b8"]].map(([icon, label, color]) => (
                    <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: color as string, fontWeight: 600 }}>
                        {icon} {label}
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div style={{ position: "relative", paddingLeft: 32 }}>
                <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #3b82f6, #8b5cf6, rgba(139,92,246,0.1))" }} />

                {Object.entries(byYear).map(([year, recs]) => (
                    <div key={year} style={{ marginBottom: 32 }}>
                        {/* Year header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                            <div style={{ position: "absolute", left: 2, width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 12px rgba(59,130,246,0.6)", border: "3px solid #1e3a5f" }} />
                            <div style={{ marginLeft: 8, fontWeight: 800, fontSize: "1.2rem", color: "#fff" }}>{year}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{recs.length} visit{recs.length !== 1 ? "s" : ""}</div>
                        </div>

                        {/* Records in this year */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {recs.map(r => {
                                const badge = getBadge(r);
                                return (
                                    <div key={r.id} className="glass" style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.2s" }}
                                        onClick={() => setPopup(popup?.id === r.id ? null : r)}
                                        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                                        onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "0.9rem" }}>
                                                    {new Date(r.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {r.hospital?.hospitalName}
                                                </div>
                                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                                                    {r.diagnosis.length > 80 ? r.diagnosis.slice(0, 80) + "…" : r.diagnosis}
                                                </div>
                                            </div>
                                            {badge && (
                                                <span style={{ padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color, fontSize: "0.75rem", fontWeight: 700, border: `1px solid ${badge.color}40`, whiteSpace: "nowrap" }}>
                                                    {badge.icon} {badge.label}
                                                </span>
                                            )}
                                            <span style={{ fontSize: "0.75rem", color: r.reportFileURL ? "#4ade80" : "var(--text-secondary)" }}>{r.reportFileURL ? "📎" : ""}</span>
                                        </div>

                                        {/* Quick popup */}
                                        {popup?.id === r.id && (
                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="animate-fade-up">
                                                <div>
                                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Diagnosis</div>
                                                    <div style={{ fontSize: "0.87rem", color: "#e2e8f0", lineHeight: 1.6 }}>{r.diagnosis}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Medications</div>
                                                    <div style={{ fontSize: "0.87rem", color: "#e2e8f0", lineHeight: 1.6 }}>{r.prescription}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
