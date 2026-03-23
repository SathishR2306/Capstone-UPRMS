"use client";

import { useMemo, useState } from "react";
import api from "@/utils/api";

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

    async function handleDownload(rec: typeof filtered[0]) {
        const filename = rec.reportFileURL?.replace("uploads/", "").replace("uploads\\", "") ?? "";
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

            setDownloadLog(prev => ({ ...prev, [rec.id]: new Date().toLocaleTimeString("en-IN") }));
        } catch (error) {
            alert("Failed to access the file.");
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Search + Filter */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                    <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input placeholder="Search by diagnosis or hospital…" value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: 12, background: "#fff", border: "1.5px solid #E8EDF5", color: "#1E293B", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }} />
                </div>
            </div>

            {/* Category tabs */}
            <div className="glass-strong" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px", borderRadius: 12, width: "fit-content" }}>
                {(["all", "lab", "scan", "prescription", "other"] as Category[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} style={{
                        padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, transition: "all 0.2s ease",
                        background: category === cat ? "rgba(139, 92, 246, 0.12)" : "transparent",
                        color: category === cat ? "#7c3aed" : "#5F7285",
                        boxShadow: category === cat ? "inset 0 0 12px rgba(139, 92, 246, 0.08)" : "none",
                    }}
                        onMouseOver={e => { if (category !== cat) { e.currentTarget.style.color = "#1E293B"; e.currentTarget.style.background = "rgba(0,0,0,0.04)"; } }}
                        onMouseOut={e => { if (category !== cat) { e.currentTarget.style.color = "#5F7285"; e.currentTarget.style.background = "transparent"; } }}
                    >
                        {cat === "all" ? "All Documents" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        <span style={{ marginLeft: 10, opacity: category === cat ? 1 : 0.8, background: category === cat ? "rgba(139, 92, 246, 0.15)" : "rgba(15, 27, 63, 0.06)", color: category === cat ? "#7c3aed" : "#5F7285", padding: "2px 8px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 700 }}>
                            {counts[cat] || 0}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="glass" style={{ padding: "80px", textAlign: "center", color: "#5F7285", borderRadius: 16, border: "1px dashed #d0d9e8", background: "rgba(255,255,255,0.6)" }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", color: "#94a3b8" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "1.1rem", color: "#3D5166" }}>{search ? "No documents match your search." : "No documents in this category."}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filtered.map(rec => {
                        const theme = CAT_THEME[rec.category];

                        // Badge colors tuned for light backgrounds
                        const bgBadge = theme.bg;
                        const textBadge = theme.color;
                        const borderBadge = theme.border;

                        return (
                            <div key={rec.id} className="glass" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", borderRadius: 16, transition: "transform 0.2s ease, box-shadow 0.2s ease", border: "1px solid #E8EDF5", background: "#fff" }}
                                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,27,63,0.10)"; }}
                                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,27,63,0.06)"; }}>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 240 }}>
                                    <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#1E293B", marginBottom: 8 }}>{rec.hospital?.hospitalName ?? "Unknown Hospital"}</div>
                                    <div style={{ fontSize: "0.9rem", color: "#5F7285", fontWeight: 500, display: "flex", alignItems: "center", gap: 12 }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            {formatDate(rec.visitDate)}
                                        </span>
                                        <span style={{ color: "#d0d9e8" }}>|</span>
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
                                    <span style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "10px 20px", background: "#F4F7FE", borderRadius: 8, border: "1px solid #E8EDF5", fontWeight: 600 }}>No File Attached</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="glass-strong" style={{ padding: "20px 24px", borderRadius: 12, fontSize: "0.9rem", color: "#3D5166", display: "flex", gap: 16, alignItems: "center", borderLeft: "4px solid #8b5cf6", backgroundColor: "#fff", borderTop: "1px solid #E8EDF5", borderRight: "1px solid #E8EDF5", borderBottom: "1px solid #E8EDF5" }}>
                <div style={{ padding: 10, background: "rgba(139,92,246,0.1)", borderRadius: "50%", color: "#7c3aed" }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <span style={{ fontWeight: 500, lineHeight: 1.5 }}>All downloads are tracked automatically. Files are served securely from the internal hospital servers.</span>
            </div>
        </div>
    );
}
