"use client";

import { useMemo, useState } from "react";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: { id: number; hospitalName: string };
}
interface Props { records: MedicalRecord[] }

type Category = "all" | "lab" | "scan" | "prescription" | "other";

function categorize(rec: MedicalRecord): Exclude<Category, "all"> {
    const d = rec.diagnosis.toLowerCase();
    const p = rec.prescription.toLowerCase();
    if (d.includes("scan") || d.includes("mri") || d.includes("xray") || d.includes("x-ray") || d.includes("ct") || d.includes("ultrasound")) return "scan";
    if (d.includes("lab") || d.includes("blood") || d.includes("urine") || d.includes("biopsy") || d.includes("test")) return "lab";
    if (p.length > 10 && d.includes("prescri")) return "prescription";
    return "other";
}

const CAT_THEME: Record<string, { bg: string, color: string, border: string }> = {
    lab: { bg: "#f0fdfa", color: "#0d9488", border: "#ccfbf1" },
    scan: { bg: "#f5f3ff", color: "#7c3aed", border: "#ede9fe" },
    prescription: { bg: "#f0fdf4", color: "#16a34a", border: "#dcfce7" },
    other: { bg: "#eff6ff", color: "#2563eb", border: "#dbeafe" }
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function DocumentVault({ records }: Props) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<Category>("all");
    const [downloadLog, setDownloadLog] = useState<Record<number, string>>({});

    const categorized = useMemo(() => records.map(r => ({ ...r, category: categorize(r) })), [records]);

    const filtered = useMemo(() => categorized.filter(r => {
        if (category !== "all" && r.category !== category) return false;
        if (search && !r.diagnosis.toLowerCase().includes(search.toLowerCase()) &&
            !r.hospital?.hospitalName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [categorized, category, search]);

    const counts: Record<string, number> = useMemo(() => {
        const c: Record<string, number> = { all: records.length };
        categorized.forEach(r => { c[r.category] = (c[r.category] || 0) + 1; });
        return c;
    }, [categorized, records.length]);

    function handleDownload(rec: typeof filtered[0]) {
        const filename = rec.reportFileURL?.replace("uploads/", "").replace("uploads\\", "") ?? "";
        window.open(`http://localhost:3001/medical-records/download/${filename}`, "_blank");
        setDownloadLog(prev => ({ ...prev, [rec.id]: new Date().toLocaleTimeString("en-IN") }));
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Search + Filter */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                    <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input placeholder="Search by diagnosis or hospital…" value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, fontSize: "0.95rem" }} />
                </div>
            </div>

            {/* Category tabs */}
            <div className="glass-strong" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px", borderRadius: 12, width: "fit-content" }}>
                {(["all", "lab", "scan", "prescription", "other"] as Category[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, transition: "all 0.2s ease",
                        background: category === cat ? "rgba(59, 130, 246, 0.2)" : "transparent",
                        color: category === cat ? "#fff" : "var(--text-secondary)",
                        boxShadow: category === cat ? "inset 0 0 12px rgba(59, 130, 246, 0.1)" : "none",
                    }}
                        onMouseOver={e => { if (category !== cat) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; } }}
                        onMouseOut={e => { if (category !== cat) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; } }}
                    >
                        {cat === "all" ? "All Documents" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        <span style={{ marginLeft: 10, opacity: category === cat ? 1 : 0.8, background: category === cat ? "rgba(59, 130, 246, 0.3)" : "rgba(255,255,255,0.1)", color: category === cat ? "#93c5fd" : "var(--text-secondary)", padding: "2px 8px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 700 }}>
                            {counts[cat] || 0}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="glass" style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)", borderRadius: 16, border: "1px dashed var(--border)" }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", color: "#475569" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem" }}>{search ? "No documents match your search." : "No documents in this category."}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filtered.map(rec => {
                        const theme = CAT_THEME[rec.category];

                        // Adjust colors for dark mode
                        const bgBadge = rec.category === "lab" ? "rgba(13, 148, 136, 0.15)" : rec.category === "scan" ? "rgba(124, 58, 237, 0.15)" : rec.category === "prescription" ? "rgba(22, 163, 74, 0.15)" : "rgba(37, 99, 235, 0.15)";
                        const textBadge = rec.category === "lab" ? "#2dd4bf" : rec.category === "scan" ? "#a78bfa" : rec.category === "prescription" ? "#4ade80" : "#60a5fa";
                        const borderBadge = rec.category === "lab" ? "rgba(13, 148, 136, 0.3)" : rec.category === "scan" ? "rgba(124, 58, 237, 0.3)" : rec.category === "prescription" ? "rgba(22, 163, 74, 0.3)" : "rgba(37, 99, 235, 0.3)";

                        return (
                            <div key={rec.id} className="glass" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", borderRadius: 16, transition: "transform 0.2s ease, background 0.2s ease" }}
                                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 240 }}>
                                    <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#fff", marginBottom: 8 }}>{rec.hospital?.hospitalName ?? "Unknown Hospital"}</div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            {formatDate(rec.visitDate)}
                                        </span>
                                        <span style={{ color: "var(--border)" }}>|</span>
                                        <span>{rec.diagnosis.slice(0, 60)}{rec.diagnosis.length > 60 ? "…" : ""}</span>
                                    </div>
                                    {downloadLog[rec.id] && (
                                        <div style={{ fontSize: "0.8rem", color: "#34d399", marginTop: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: 6, width: "fit-content" }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Downloaded at {downloadLog[rec.id]}
                                        </div>
                                    )}
                                </div>

                                {/* Category badge */}
                                <span style={{ padding: "6px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, background: bgBadge, color: textBadge, border: `1px solid ${borderBadge}`, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {rec.category}
                                </span>

                                {/* Download button */}
                                {rec.reportFileURL ? (
                                    <button onClick={() => handleDownload(rec)} className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, height: "auto" }}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                        Download File
                                    </button>
                                ) : (
                                    <span style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "10px 20px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600 }}>No File Attached</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="glass-strong" style={{ padding: "20px 24px", borderRadius: 12, fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", gap: 16, alignItems: "center", borderLeft: "4px solid #3b82f6" }}>
                <div style={{ padding: 10, background: "rgba(59, 130, 246, 0.1)", borderRadius: "50%", color: "#60a5fa" }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <span style={{ fontWeight: 500, lineHeight: 1.5 }}>All downloads are tracked automatically. Files are served securely from the internal hospital servers.</span>
            </div>
        </div>
    );
}
