"use client";

import { useState, useMemo } from "react";

interface Hospital { id: number; hospitalName: string }
interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: Hospital;
}

interface Props { records: MedicalRecord[]; }

const SEVERITY_KEYWORDS: Record<"high" | "medium" | "low", string[]> = {
    high: ["cancer", "cardiac arrest", "stroke", "fracture", "icu", "surgery", "emergency", "critical", "sepsis", "tumor", "haemorrhage"],
    medium: ["diabetes", "hypertension", "chronic", "asthma", "infection", "pneumonia", "anemia", "thyroid"],
    low: ["fever", "cold", "flu", "cough", "headache", "allergy", "sprain", "viral", "routine"],
};

function getSeverity(diagnosis: string): "high" | "medium" | "low" {
    const d = diagnosis.toLowerCase();
    if (SEVERITY_KEYWORDS.high.some(k => d.includes(k))) return "high";
    if (SEVERITY_KEYWORDS.medium.some(k => d.includes(k))) return "medium";
    return "low";
}

const SEVERITY_STYLE = {
    high: { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", label: "Critical", dot: "#ef4444" },
    medium: { bg: "#fefce8", border: "#fde047", color: "#a16207", label: "Moderate", dot: "#eab308" },
    low: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "Mild", dot: "#22c55e" },
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function TimelineView({ records }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filterYear, setFilterYear] = useState("all");
    const [filterHospital, setFilterHospital] = useState("all");
    const [filterSeverity, setFilterSeverity] = useState("all");

    const years = useMemo(() => [...new Set(records.map(r => new Date(r.visitDate).getFullYear().toString()))].sort((a, b) => +b - +a), [records]);
    const hospitals = useMemo(() => [...new Map(records.map(r => [r.hospital?.id, r.hospital])).values()].filter(Boolean), [records]);

    const filtered = useMemo(() => records.filter(r => {
        if (filterYear !== "all" && new Date(r.visitDate).getFullYear().toString() !== filterYear) return false;
        if (filterHospital !== "all" && String(r.hospital?.id) !== filterHospital) return false;
        if (filterSeverity !== "all" && getSeverity(r.diagnosis) !== filterSeverity) return false;
        return true;
    }), [records, filterYear, filterHospital, filterSeverity]);

    const selectStyle = { padding: "8px 16px", background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer", outline: "none", fontWeight: 600, backdropFilter: "blur(12px)" };

    return (
        <div>
            {/* Filters */}
            <div className="glass-strong" style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap", alignItems: "center", padding: "20px 24px", borderRadius: 12, background: "rgba(15, 23, 42, 0.4)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.1em", marginRight: 8 }}>FILTERS</span>
                <select style={selectStyle} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                    <option value="all">All Years</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select style={selectStyle} value={filterHospital} onChange={e => setFilterHospital(e.target.value)}>
                    <option value="all">All Hospitals</option>
                    {hospitals.map(h => <option key={h.id} value={String(h.id)}>{h.hospitalName}</option>)}
                </select>
                <select style={selectStyle} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                    <option value="all">All Severities</option>
                    <option value="high">Critical</option>
                    <option value="medium">Moderate</option>
                    <option value="low">Mild</option>
                </select>
                <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    <span style={{ color: "#fff" }}>{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""} found
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass" style={{ padding: "64px", textAlign: "center", color: "var(--text-secondary)", border: "1px dashed var(--border)", borderRadius: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", color: "#475569" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "1.05rem" }}>No records match your filters.</p>
                </div>
            ) : (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                    <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {filtered.map(rec => {
                            const sev = getSeverity(rec.diagnosis);
                            const style = SEVERITY_STYLE[sev];
                            const expanded = expandedId === rec.id;

                            // Adjust colors for dark mode
                            const bgCard = expanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
                            const borderColorCard = expanded ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)";
                            const bgBadge = sev === "high" ? "rgba(239, 68, 68, 0.15)" : sev === "medium" ? "rgba(234, 179, 8, 0.15)" : "rgba(34, 197, 94, 0.15)";
                            const textBadge = sev === "high" ? "#fca5a5" : sev === "medium" ? "#fde047" : "#86efac";
                            const borderBadge = sev === "high" ? "rgba(239, 68, 68, 0.3)" : sev === "medium" ? "rgba(234, 179, 8, 0.3)" : "rgba(34, 197, 94, 0.3)";


                            return (
                                <div key={rec.id} style={{ display: "flex", gap: 24, position: "relative", zIndex: 1 }}>
                                    {/* Timeline Node */}
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: style.dot, border: "4px solid var(--bg-primary)", boxShadow: `0 0 0 1px ${style.dot}, 0 0 12px ${style.dot}80`, marginTop: 6, flexShrink: 0, marginLeft: -10 }} />

                                    {/* Content Card */}
                                    <div className="glass" style={{ flex: 1, padding: "24px", cursor: "pointer", transition: "all 0.2s ease", background: bgCard, border: "1px solid", borderColor: borderColorCard, borderRadius: 12 }}
                                        onClick={() => setExpandedId(expanded ? null : rec.id)}
                                        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = bgCard; }}>

                                        {/* Header row */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                                            <div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                    {formatDate(rec.visitDate)}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#fff" }}>
                                                    {rec.hospital?.hospitalName ?? "Unknown Hospital"}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                {rec.reportFileURL && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: 6, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}>
                                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                        File Att.
                                                    </span>
                                                )}
                                                <span style={{ padding: "6px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, background: bgBadge, color: textBadge, border: `1px solid ${borderBadge}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                    {style.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        {!expanded && (
                                            <div style={{ marginTop: 16, fontSize: "0.95rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                <span style={{ fontWeight: 600, color: "#fff", marginRight: 8 }}>Diagnosis:</span>
                                                {rec.diagnosis}
                                            </div>
                                        )}

                                        {/* Expanded details */}
                                        {expanded && (
                                            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                                                <div>
                                                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#60a5fa" }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                        Diagnosis
                                                    </div>
                                                    <div style={{ fontSize: "0.95rem", color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: 8 }}>{rec.diagnosis}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#34d399" }}><path d="M10.5 20.5 4 14l6.5-6.5a7.78 7.78 0 0 1 11 11 7.78 7.78 0 0 1-11 0z" /><line x1="14" y1="10" x2="10" y2="14" /></svg>
                                                        Prescription
                                                    </div>
                                                    <div style={{ fontSize: "0.95rem", color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: 8 }}>{rec.prescription}</div>
                                                </div>
                                                {rec.reportFileURL && (
                                                    <div style={{ gridColumn: "1/-1", marginTop: 8 }}>
                                                        <a href={`http://localhost:3001/medical-records/download/${rec.reportFileURL.replace("uploads/", "").replace("uploads\\", "")}`}
                                                            target="_blank" rel="noreferrer"
                                                            className="btn-outline"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}
                                                            onClick={e => e.stopPropagation()}>
                                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                            Download Attached Report
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
