"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";

type ApprovedPatient = {
    patientId: number;
    fullName: string;
    maskedAadhaar: string;
};

interface Hospital { id: number; hospitalName: string }
interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: Hospital;
}

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
    high: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", color: "#fca5a5", label: "Critical", dot: "#ef4444" },
    medium: { bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.3)", color: "#fde047", label: "Moderate", dot: "#eab308" },
    low: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", color: "#86efac", label: "Mild", dot: "#22c55e" },
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function HospitalTimelineView() {
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState("");

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filterYear, setFilterYear] = useState("all");
    const [filterSeverity, setFilterSeverity] = useState("all");

    useEffect(() => {
        api.get("/access/hospital-requests").then((res: any) => {
            setPatients(res.data.filter((r: any) => r.status === "APPROVED"));
            setLoadingPatients(false);
        }).catch(() => {
            setError("Failed to load authorized patients.");
            setLoadingPatients(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedPatient) { setRecords([]); return; }
        setLoadingRecords(true);
        setError("");
        api.get(`/medical-records/patient/${selectedPatient}`).then((res: any) => {
            setRecords(res.data);
            setLoadingRecords(false);
        }).catch(() => {
            setError("Failed to load records. Patient may have revoked access.");
            setLoadingRecords(false);
        });
    }, [selectedPatient]);

    const years = useMemo(() => [...new Set(records.map(r => new Date(r.visitDate).getFullYear().toString()))].sort((a, b) => +b - +a), [records]);

    const filtered = useMemo(() => records.filter(r => {
        if (filterYear !== "all" && new Date(r.visitDate).getFullYear().toString() !== filterYear) return false;
        if (filterSeverity !== "all" && getSeverity(r.diagnosis) !== filterSeverity) return false;
        return true;
    }), [records, filterYear, filterSeverity]);

    const selectStyle = { padding: "8px 12px", background: "var(--input-bg)", border: "1px solid var(--border-light)", borderRadius: 6, color: "var(--text-dark)", fontSize: "0.85rem", cursor: "pointer", outline: "none", fontWeight: 500 };

    const handleDownload = async (fileUrl: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const filename = fileUrl.replace("uploads/", "").replace("uploads\\", "");
        try {
            const res = await api.get(`/medical-records/download/${filename}`, { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error("Failed to fetch file");
            alert("Failed to access the file.");
        }
    };

    if (loadingPatients) return <div style={{ padding: 20, color: "var(--text-muted)" }}>Loading Patient Selector...</div>;

    return (
        <div className="glass-strong" style={{ padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>

            {/* Patient Selector */}
            <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-medium)", marginBottom: 8 }}>Select Authorized Patient</label>
                <select
                    value={selectedPatient}
                    onChange={e => setSelectedPatient(e.target.value)}
                    className="input-field"
                    style={{ maxWidth: 400, padding: "12px", cursor: "pointer", color: "var(--text-dark)", background: "var(--input-bg)" }}
                >
                    <option value="" disabled style={{ background: "var(--bg-card)" }}>-- Choose Patient --</option>
                    {patients.map(p => (
                        <option key={p.patientId} value={p.patientId} style={{ background: "var(--bg-card)", color: "var(--text-dark)" }}>
                            {p.fullName} (Aadhaar: {p.maskedAadhaar})
                        </option>
                    ))}
                </select>
                {patients.length === 0 && <p style={{ fontSize: "0.85rem", color: "#fca5a5", marginTop: 8 }}>No patients have granted you access yet.</p>}
            </div>

            {error && <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", borderRadius: 8, marginBottom: 24, fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{error}</div>}

            {selectedPatient && !loadingRecords && (
                <>
                    {/* Filters */}
                    <div className="glass" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center", padding: "16px", borderRadius: 12 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginRight: 8 }}>FILTERS:</span>
                        <select className="input-field" style={{ padding: "8px 12px", width: "auto", background: "var(--input-bg)" }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                            <option value="all" style={{ background: "var(--bg-card)" }}>All Years</option>
                            {years.map(y => <option key={y} value={y} style={{ background: "var(--bg-card)" }}>{y}</option>)}
                        </select>
                        <select className="input-field" style={{ padding: "8px 12px", width: "auto", background: "var(--input-bg)" }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                            <option value="all" style={{ background: "var(--bg-card)" }}>All Severities</option>
                            <option value="high" style={{ background: "var(--bg-card)" }}>Critical</option>
                            <option value="medium" style={{ background: "var(--bg-card)" }}>Moderate</option>
                            <option value="low" style={{ background: "var(--bg-card)" }}>Mild</option>
                        </select>
                        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="glass" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border-light)", borderRadius: 12 }}>
                            <div style={{ marginBottom: 16 }}>
                                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", color: "var(--text-muted)" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            </div>
                            <p style={{ margin: 0, fontWeight: 500 }}>No medical records found for this patient.</p>
                        </div>
                    ) : (
                        <div style={{ position: "relative", paddingLeft: 20 }}>
                            <div style={{ position: "absolute", left: 7, top: 12, bottom: 12, width: 2, background: "var(--border-light)", zIndex: 0 }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {filtered.map(rec => {
                                    const sev = getSeverity(rec.diagnosis);
                                    const style = SEVERITY_STYLE[sev];
                                    const expanded = expandedId === rec.id;

                                    return (
                                        <div key={rec.id} style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
                                            {/* Timeline Node */}
                                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: style.dot, border: "3px solid var(--bg-dashboard)", boxShadow: `0 0 10px ${style.dot}`, marginTop: 4, flexShrink: 0 }} />

                                            {/* Content Card */}
                                            <div style={{ flex: 1, padding: "20px", cursor: "pointer", transition: "all 0.2s ease", background: expanded ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: "1px solid", borderColor: expanded ? "rgba(255,255,255,0.15)" : "var(--border-card)", borderRadius: 12, backdropFilter: "blur(12px)" }}
                                                onClick={() => setExpandedId(expanded ? null : rec.id)}
                                                onMouseEnter={e => { if (!expanded) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                                                onMouseLeave={e => { if (!expanded) e.currentTarget.style.borderColor = "var(--border-card)"; }}>

                                                {/* Header row */}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                                                    <div>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 2 }}>
                                                            {formatDate(rec.visitDate)}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-dark)" }}>
                                                            {rec.hospital?.hospitalName ?? "Unknown Hospital"}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        {rec.reportFileURL && (
                                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-medium)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>
                                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                                File Att.
                                                            </span>
                                                        )}
                                                        <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                                                            {style.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Preview */}
                                                {!expanded && (
                                                    <div style={{ marginTop: 12, fontSize: "0.9rem", color: "var(--text-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        <span style={{ fontWeight: 600, color: "var(--text-dark)", marginRight: 6 }}>Diagnosis:</span>
                                                        {rec.diagnosis}
                                                    </div>
                                                )}

                                                {/* Expanded details */}
                                                {expanded && (
                                                    <div style={{ marginTop: 20, borderTop: "1px solid var(--border-light)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                                                        <div>
                                                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Diagnosis</div>
                                                            <div style={{ fontSize: "0.95rem", color: "var(--text-dark)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{rec.diagnosis}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Prescription</div>
                                                            <div style={{ fontSize: "0.95rem", color: "var(--text-dark)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{rec.prescription}</div>
                                                        </div>
                                                        {rec.reportFileURL && (
                                                            <div style={{ gridColumn: "1/-1", marginTop: 8 }}>
                                                                <button onClick={e => handleDownload(rec.reportFileURL!, e)}
                                                                    className="btn-outline"
                                                                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: "0.85rem", border: "1px solid var(--border)", background: "transparent", color: "#e2e8f0", borderRadius: 6, cursor: "pointer" }}>
                                                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                                    Download Attached Report
                                                                </button>
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
                </>
            )}
        </div>
    );
}
