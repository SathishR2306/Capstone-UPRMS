"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface Record {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    reportFileURL: string | null;
    hospital: { id: number; hospitalName: string };
}

const TYPE_OPTIONS = ["All", "Lab Report", "Prescription", "Scan", "Surgery", "General"];

export default function DoctorRecordViewer({ patientId, patientName }: { patientId?: number; patientName?: string }) {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [expanded, setExpanded] = useState<number | null>(null);

    // Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedHospital, setSelectedHospital] = useState("");
    const [selectedType, setSelectedType] = useState("All");

    useEffect(() => {
        if (!patientId) { setRecords([]); return; }
        setLoading(true); setErr("");
        api.get(`/doctors/patients/${patientId}/records`)
            .then((r) => setRecords(r.data))
            .catch((e) => setErr(e?.response?.data?.message || "Failed to load records or access was denied."))
            .finally(() => setLoading(false));
    }, [patientId]);

    if (!patientId) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No patient selected</div>
            <div style={{ fontSize: "0.88rem" }}>Use Patient Search to find a patient, then click "View Records".</div>
        </div>
    );

    if (loading) return <div style={{ padding: 20, color: "var(--text-secondary)" }}>Loading records…</div>;

    if (err) return (
        <div style={{ padding: 24, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#fca5a5" }}>
            🔒 {err}
        </div>
    );

    const hospitals = [...new Set(records.map((r) => r.hospital?.hospitalName).filter(Boolean))];
    const filtered = records.filter((r) => {
        if (dateFrom && r.visitDate < dateFrom) return false;
        if (dateTo && r.visitDate > dateTo) return false;
        if (selectedHospital && r.hospital?.hospitalName !== selectedHospital) return false;
        return true;
    });

    const viewOrDownloadFile = async (url: string, action: "preview" | "download") => {
        const filename = url.split("/").pop() || "report";
        try {
            const res = await api.get(`/medical-records/download/${filename}`, { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: res.headers["content-type"] || "application/octet-stream" }));

            if (action === "preview") {
                window.open(blobUrl, "_blank");
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000); // Cleanup after a minute
            } else {
                const link = document.createElement("a");
                link.href = blobUrl;
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
            }
        } catch (error) {
            console.error("Failed to fetch file");
            alert("Failed to access the file. It might have been deleted or you don't have permission.");
        }

        // Log download
        if (patientId && action === "download") {
            api.post(`/doctors/patients/${patientId}/log-download`, { fileName: filename }).catch(() => { });
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
                Records for: <span style={{ color: "#a78bfa" }}>{patientName}</span>
                <span style={{ marginLeft: 12, fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 400 }}>{records.length} records total</span>
            </div>

            {/* Filters */}
            <div className="glass" style={{ padding: 16, background: "rgba(255,255,255,0.02)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>FROM DATE</label>
                    <input type="date" className="input-field" style={{ padding: "8px 12px", fontSize: "0.85rem" }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>TO DATE</label>
                    <input type="date" className="input-field" style={{ padding: "8px 12px", fontSize: "0.85rem" }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>HOSPITAL</label>
                    <select className="input-field" style={{ padding: "8px 12px", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", cursor: "pointer" }} value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)}>
                        <option value="">All Hospitals</option>
                        {hospitals.map((h) => <option key={h} value={h} style={{ color: "#0f172a" }}>{h}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>RECORD TYPE</label>
                    <select className="input-field" style={{ padding: "8px 12px", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", cursor: "pointer" }} value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        {TYPE_OPTIONS.map((t) => <option key={t} value={t} style={{ color: "#0f172a" }}>{t}</option>)}
                    </select>
                </div>
                <button className="btn-outline" style={{ padding: "8px 18px", fontSize: "0.82rem" }} onClick={() => { setDateFrom(""); setDateTo(""); setSelectedHospital(""); setSelectedType("All"); }}>
                    Clear Filters
                </button>
            </div>

            {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>No records match the current filters.</div>
            )}

            {/* Records list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map((r) => (
                    <div key={r.id} className="glass" style={{ background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                            onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                🩺
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>Visit on {r.visitDate}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                                    🏥 {r.hospital?.hospitalName} · {r.diagnosis.length > 60 ? r.diagnosis.slice(0, 60) + "…" : r.diagnosis}
                                </div>
                            </div>
                            {r.reportFileURL && (
                                <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#4ade80", fontSize: "0.75rem", fontWeight: 700, border: "1px solid rgba(34,197,94,0.2)" }}>📎 Report</span>
                            )}
                            <div style={{ color: "var(--text-secondary)", transition: "transform 0.2s", transform: expanded === r.id ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
                        </div>

                        {expanded === r.id && (
                            <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }} className="animate-fade-up">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 8 }}>Diagnosis</div>
                                        <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "0.9rem" }}>{r.diagnosis}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 8 }}>Prescription / Medication</div>
                                        <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "0.9rem" }}>{r.prescription}</div>
                                    </div>
                                </div>
                                {r.reportFileURL && (
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.82rem" }} onClick={() => viewOrDownloadFile(r.reportFileURL!, "download")}>
                                            ⬇ Download Report
                                        </button>
                                        <button className="btn-outline" style={{ padding: "8px 20px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center" }} onClick={() => viewOrDownloadFile(r.reportFileURL!, "preview")}>
                                            👁 Preview
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
