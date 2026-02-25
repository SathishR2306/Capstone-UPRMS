"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

type ApprovedPatient = {
    patientId: number;
    fullName: string;
    maskedAadhaar: string;
};

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    hospital: { id: number; hospitalName: string };
}

const RISK_STYLE: Record<string, { bg: string, border: string, color: string, label: string }> = {
    high: { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", label: "HIGH RISK" },
    medium: { bg: "#fefce8", border: "#fde047", color: "#a16207", label: "MODERATE" },
    low: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "LOW RISK" },
};

const SCORE_COLOR = (s: number) => s >= 75 ? "#16a34a" : s >= 50 ? "#ca8a04" : "#dc2626";

export default function AIPatientSummary() {
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState("");

    const [ai, setAi] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);

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
        if (!selectedPatient) { setRecords([]); setAi(null); return; }
        setLoadingRecords(true);
        setError("");
        api.get(`/medical-records/patient/${selectedPatient}`).then((res: any) => {
            setRecords(res.data);
            setLoadingRecords(false);
        }).catch(() => {
            setError("Failed to load records or access was revoked.");
            setLoadingRecords(false);
        });
    }, [selectedPatient]);

    useEffect(() => {
        if (!records || records.length === 0) { setAi(null); return; }
        let isMounted = true;
        setLoadingAi(true);

        fetch("/api/analyze-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        })
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    setAi(data);
                    setLoadingAi(false);
                }
            })
            .catch(err => {
                console.error("Gemini AI API Error:", err);
                if (isMounted) setLoadingAi(false);
            });

        return () => { isMounted = false; };
    }, [records]);

    const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", backdropFilter: "blur(12px)" };
    const headerStyle = { fontWeight: 700, fontSize: "0.95rem", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 };

    if (loadingPatients) return <div style={{ padding: 20, color: "var(--text-secondary)" }}>Loading AI module...</div>;

    const risk = ai && ai.riskLevel ? RISK_STYLE[ai.riskLevel] || RISK_STYLE.low : RISK_STYLE.low;

    return (
        <div className="glass-strong" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>

            {/* Patient Selector */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Select Patient for AI Analysis</label>
                <select
                    value={selectedPatient}
                    onChange={e => setSelectedPatient(e.target.value)}
                    className="input-field"
                    style={{ maxWidth: 400, padding: "12px", cursor: "pointer", background: "rgba(255, 255, 255, 0.05)" }}
                >
                    <option value="" disabled>-- Choose Authorized Patient --</option>
                    {patients.map(p => (
                        <option key={p.patientId} value={p.patientId} style={{ color: "#0f172a" }}>
                            {p.fullName} (Aadhaar: {p.maskedAadhaar})
                        </option>
                    ))}
                </select>
                {patients.length === 0 && <p style={{ fontSize: "0.85rem", color: "#fca5a5", marginTop: 8 }}>No patients available for analysis.</p>}
            </div>

            {error && <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", borderRadius: 8, fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{error}</div>}

            {selectedPatient && !loadingRecords && loadingAi && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ marginBottom: 16 }}>
                        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", color: "#60a5fa" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    </div>
                    Gemini AI is analyzing medical records...
                </div>
            )}

            {selectedPatient && !loadingRecords && !loadingAi && ai && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fade-up">
                    <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 8, padding: "12px 16px", fontSize: "0.85rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: 12 }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        Generated by Gemini AI. Summaries are based on patient history. Always consult the raw clinical data.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        <div style={{ ...cardStyle, textAlign: "center" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>Patient Vitality Score</div>
                            <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 12px" }}>
                                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={SCORE_COLOR(ai.healthScore)} strokeWidth="3"
                                        strokeDasharray={`${ai.healthScore} ${100 - ai.healthScore}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                                </svg>
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: "1.6rem", fontWeight: 800, color: SCORE_COLOR(ai.healthScore) }}>{ai.healthScore}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>out of 100</div>
                        </div>

                        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, background: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 0.1)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 0.1)" : "rgba(34, 197, 94, 0.1)", borderColor: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 0.2)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                            <svg width="32" height="32" stroke={risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80"} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            <div style={{ fontWeight: 800, fontSize: "1.2rem", color: risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80", letterSpacing: "0.05em" }}>{risk.label}</div>
                            <div style={{ fontSize: "0.85rem", color: risk.color === "#b91c1c" ? "#fca5a5" : risk.color === "#a16207" ? "#fde047" : "#86efac", textAlign: "center", opacity: 0.9, fontWeight: 500 }}>
                                Derived from {records.length} total records
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h4 style={headerStyle}>
                            <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            <span>Detected Chronic Conditions</span>
                        </h4>
                        {!ai.chronicConditions || ai.chronicConditions.length === 0 ? (
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>No major chronic conditions detected in the history.</p>
                        ) : (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {ai.chronicConditions.map((c: string) => (
                                    <span key={c} style={{ padding: "6px 16px", borderRadius: 6, background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.2)", color: "#facc15", fontSize: "0.85rem", fontWeight: 700, textTransform: "capitalize" }}>
                                        {c}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {ai.topMeds && ai.topMeds.length > 0 && (
                        <div style={cardStyle}>
                            <h4 style={headerStyle}>
                                <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 4 14l6.5-6.5a7.78 7.78 0 0 1 11 11 7.78 7.78 0 0 1-11 0z" /><line x1="14" y1="10" x2="10" y2="14" /></svg>
                                <span>High Frequency Medications</span>
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {ai.topMeds.map(([med, count]: [string, number]) => (
                                    <div key={med} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ flex: 1, fontSize: "0.9rem", color: "#e2e8f0", fontWeight: 500, textTransform: "capitalize" }}>{med}</div>
                                        <div style={{ width: 140, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${Math.min(100, count * 33)}%`, background: "#3b82f6", borderRadius: 4 }} />
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", width: 40, textAlign: "right", fontWeight: 600 }}>{count}×</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={cardStyle}>
                        <h4 style={headerStyle}>
                            <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            <span>Clinical Recommendations</span>
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {ai.suggestions && ai.suggestions.map((s: string, i: number) => (
                                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                    <span style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </span>
                                    <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#e2e8f0", fontWeight: 500 }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
