"use client";

import { useMemo } from "react";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    hospital: { id: number; hospitalName: string };
}
interface Props { records: MedicalRecord[] }

export default function Analytics({ records }: Props) {
    const { visitsByYear, diagFreq, topHospitals } = useMemo(() => {
        const visitsByYear: Record<string, number> = {};
        const diagFreq: Record<string, number> = {};
        const hosp: Record<string, number> = {};

        records.forEach(r => {
            const y = new Date(r.visitDate).getFullYear().toString();
            visitsByYear[y] = (visitsByYear[y] || 0) + 1;

            const diag = r.diagnosis.toLowerCase().split(/[,./]/)[0].trim();
            diagFreq[diag] = (diagFreq[diag] || 0) + 1;

            const hName = r.hospital?.hospitalName ?? "Unknown";
            hosp[hName] = (hosp[hName] || 0) + 1;
        });

        const topHospitals = Object.entries(hosp).sort(([, a], [, b]) => b - a).slice(0, 5);
        return { visitsByYear, diagFreq: Object.entries(diagFreq).sort(([, a], [, b]) => b - a).slice(0, 6), topHospitals };
    }, [records]);

    const years = Object.keys(visitsByYear).sort();
    const maxVisit = Math.max(1, ...Object.values(visitsByYear));
    const maxDiag = Math.max(1, ...Object.values(diagFreq.map ? diagFreq.map(([, v]) => v) : [1]));
    const maxHosp = Math.max(1, ...topHospitals.map(([, v]) => v));

    const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", backdropFilter: "blur(12px)" };
    const headerStyle = { fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: 24, letterSpacing: "0.02em" };

    if (records.length === 0) return (
        <div className="glass" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "64px", borderRadius: 16 }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", color: "#475569" }}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "1.05rem" }}>No records yet. Analytics will appear once records are uploaded.</p>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* ── Summary Stats ────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
                {[
                    { label: "Total Records", value: records.length, color: "#3b82f6" },
                    { label: "Active Years", value: years.length, color: "#10b981" },
                    { label: "Hospitals Visited", value: topHospitals.length, color: "#8b5cf6" },
                ].map(s => (
                    <div key={s.label} className="glass" style={{ padding: "24px", textAlign: "center", borderRadius: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: "2.5rem", color: "#fff", lineHeight: 1, marginBottom: 12, textShadow: `0 0 16px ${s.color}40` }}>{s.value}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Visits Per Year ─────────────────────────────────── */}
            <div className="glass-strong" style={cardStyle}>
                <h4 style={headerStyle}>Hospital Visits Per Year</h4>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 180, paddingBottom: 8, borderBottom: "1px solid var(--border)", paddingTop: 16 }}>
                    {years.map(year => {
                        const count = visitsByYear[year];
                        const pct = (count / maxVisit) * 100;
                        return (
                            <div key={year} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flex: 1, group: "true" }}>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, transition: "color 0.2s" }}>{count}</span>
                                <div style={{ width: "100%", maxWidth: 64, height: `${pct}%`, minHeight: 12, background: "linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.2) 100%)", borderRadius: "6px 6px 0 0", position: "relative", transition: "all 0.3s ease", cursor: "pointer" }}
                                    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(180deg, #60a5fa 0%, rgba(96, 165, 250, 0.3) 100%)"}
                                    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.2) 100%)"}
                                />
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>{year}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                {/* ── Diagnosis Frequency ─────────────────────────────── */}
                <div className="glass-strong" style={cardStyle}>
                    <h4 style={headerStyle}>Diagnosis Frequency</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {(diagFreq as [string, number][]).map(([diag, count]) => (
                            <div key={diag}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: 8, fontWeight: 600, color: "#e2e8f0" }}>
                                    <span style={{ textTransform: "capitalize" }}>{diag}</span>
                                    <span style={{ color: "#94a3b8" }}>{count}×</span>
                                </div>
                                <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 5, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${(count / maxDiag) * 100}%`, background: "linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)", borderRadius: 5, transition: "width 1s ease-out" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Hospital Visits ─────────────────────────────────── */}
                <div className="glass-strong" style={cardStyle}>
                    <h4 style={headerStyle}>Records by Hospital</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {topHospitals.map(([name, count]) => (
                            <div key={name}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: 8, fontWeight: 600, color: "#e2e8f0" }}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{name}</span>
                                    <span style={{ color: "#94a3b8", flexShrink: 0 }}>{count}</span>
                                </div>
                                <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 5, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${(count / maxHosp) * 100}%`, background: "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)", borderRadius: 5, transition: "width 1s ease-out" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
