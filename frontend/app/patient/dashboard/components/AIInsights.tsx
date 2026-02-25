"use client";

import { useState, useEffect } from "react";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    hospital: { id: number; hospitalName: string };
}

interface Props { records: MedicalRecord[]; }

const RISK_STYLE: Record<string, { bg: string, border: string, color: string, label: string }> = {
    high: { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c", label: "HIGH RISK" },
    medium: { bg: "#fefce8", border: "#fde047", color: "#a16207", label: "MODERATE" },
    low: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "LOW RISK" },
};

const SCORE_COLOR = (s: number) => s >= 75 ? "#16a34a" : s >= 50 ? "#ca8a04" : "#dc2626";

export default function AIInsights({ records }: Props) {
    const [ai, setAi] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);

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
                console.error("Gemini AI Error:", err);
                if (isMounted) setLoadingAi(false);
            });

        return () => { isMounted = false; };
    }, [records]);

    const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", backdropFilter: "blur(12px)" };
    const headerStyle = { fontWeight: 700, fontSize: "0.95rem", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 };

    if (loadingAi) {
        return (
            <div className="glass-strong" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)", background: "rgba(15, 23, 42, 0.4)", borderRadius: 12 }}>
                <div style={{ marginBottom: 16 }}>
                    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", color: "#60a5fa" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                </div>
                Generating personalized insights using Gemini AI...
            </div>
        );
    }

    if (!ai) return null;

    const risk = RISK_STYLE[ai.riskLevel] || RISK_STYLE.low;

    return (
        <div className="glass-strong" style={{ display: "flex", flexDirection: "column", gap: 24, padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>
            {/* AI disclaimer */}
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 8, padding: "12px 16px", fontSize: "0.85rem", color: "#93c5fd", display: "flex", alignItems: "center", gap: 12 }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                AI insights are derived from your medical record history by Gemini. Not a substitute for professional medical advice.
            </div>

            {/* Top row: Health Score + Risk Level */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Health Score */}
                <div style={{ ...cardStyle, textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>Health Score</div>
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

                {/* Risk Level */}
                <div style={{ ...cardStyle, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12, background: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 0.1)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 0.1)" : "rgba(34, 197, 94, 0.1)", borderColor: risk.bg === "#fef2f2" ? "rgba(239, 68, 68, 0.2)" : risk.bg === "#fefce8" ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)" }}>
                    <svg width="32" height="32" stroke={risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80"} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", color: risk.color === "#b91c1c" ? "#f87171" : risk.color === "#a16207" ? "#facc15" : "#4ade80", letterSpacing: "0.05em" }}>{risk.label}</div>
                    <div style={{ fontSize: "0.85rem", color: risk.color === "#b91c1c" ? "#fca5a5" : risk.color === "#a16207" ? "#fde047" : "#86efac", textAlign: "center", opacity: 0.9, fontWeight: 500 }}>
                        Based on {records.length} medical record{records.length !== 1 ? "s" : ""}
                    </div>
                </div>
            </div>

            {/* Chronic Conditions */}
            <div style={cardStyle}>
                <h4 style={headerStyle}>
                    <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    <span>Chronic Conditions Detected</span>
                </h4>
                {!ai.chronicConditions || ai.chronicConditions.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>No chronic conditions detected in your records.</p>
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

            {/* Medication Patterns */}
            {ai.topMeds && ai.topMeds.length > 0 && (
                <div style={cardStyle}>
                    <h4 style={headerStyle}>
                        <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5 4 14l6.5-6.5a7.78 7.78 0 0 1 11 11 7.78 7.78 0 0 1-11 0z" /><line x1="14" y1="10" x2="10" y2="14" /></svg>
                        <span>Medication Pattern Analysis</span>
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

            {/* Health Suggestions */}
            <div style={cardStyle}>
                <h4 style={headerStyle}>
                    <svg width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    <span>Health Improvement Suggestions</span>
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

            {/* Checkup Reminder */}
            <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ padding: "10px", background: "rgba(34, 197, 94, 0.2)", borderRadius: "50%", color: "#4ade80" }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#4ade80", marginBottom: 4 }}>Preventive Checkup Reminder</div>
                    <div style={{ fontSize: "0.85rem", color: "#86efac", fontWeight: 500 }}>
                        Schedule a full-body checkup at least once per year. Stay ahead of preventable conditions.
                    </div>
                </div>
            </div>
        </div>
    );
}
