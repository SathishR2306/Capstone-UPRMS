"use client";

import { useState } from "react";
import api from "@/utils/api";

interface PatientResult {
    id: number;
    fullName: string;
    phone: string;
    gender: string;
    dob: string;
    maskedAadhaar: string;
    accessStatus: string;
    accessGranted: boolean;
    grantedAt: string | null;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    APPROVED: { label: "✅ Access Granted", bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
    PENDING: { label: "⏳ Pending", bg: "rgba(234,179,8,0.1)", color: "#facc15", border: "rgba(234,179,8,0.2)" },
    REJECTED: { label: "❌ Rejected", bg: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "rgba(239,68,68,0.2)" },
    REVOKED: { label: "🚫 Revoked", bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
    NOT_REQUESTED: { label: "🔒 No Access", bg: "rgba(100,116,139,0.1)", color: "#94a3b8", border: "rgba(100,116,139,0.2)" },
};

export default function PatientSearchDoctor({ onSelectPatient }: { onSelectPatient?: (patient: PatientResult) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PatientResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [searched, setSearched] = useState(false);

    const doSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || query.trim().length < 2) return;
        setLoading(true);
        setErr("");
        setSearched(true);
        try {
            const r = await api.get(`/doctors/search-patient?q=${encodeURIComponent(query.trim())}`);
            setResults(r.data);
        } catch { setErr("Search failed. Please try again."); }
        finally { setLoading(false); }
    };

    const badge = (status: string) => {
        const s = STATUS_BADGE[status] || STATUS_BADGE.NOT_REQUESTED;
        return (
            <span style={{ padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                {s.label}
            </span>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Search bar */}
            <form onSubmit={doSearch} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                        Search by Name · Phone Number · Aadhaar Number · Patient ID
                    </label>
                    <input
                        className="input-field"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. 9876543210 or AADHAAR or patient name..."
                        style={{ fontSize: "0.95rem" }}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: "12px 28px", fontSize: "0.9rem", flexShrink: 0 }} disabled={loading}>
                    {loading ? "Searching…" : "Search"}
                </button>
            </form>

            {err && <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#fca5a5", fontSize: "0.88rem" }}>⚠ {err}</div>}

            {/* Results */}
            {searched && !loading && results.length === 0 && !err && (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</div>
                    No patients found matching your search.
                </div>
            )}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>{results.length} result{results.length !== 1 ? "s" : ""} found</div>
                    {results.map((p) => (
                        <div key={p.id} className="glass" style={{ padding: 20, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 20, transition: "background 0.2s" }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "1.1rem", flexShrink: 0 }}>
                                {p.fullName?.[0]?.toUpperCase() || "P"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>{p.fullName}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 4 }}>
                                    ID: {p.id} · {p.gender} · DOB: {p.dob} · Phone: {p.phone} · Aadhaar: {p.maskedAadhaar}
                                </div>
                                {p.grantedAt && (
                                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>
                                        Access since: {new Date(p.grantedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                                {badge(p.accessStatus)}
                                {p.accessGranted && onSelectPatient && (
                                    <button className="btn-primary" style={{ padding: "6px 16px", fontSize: "0.78rem" }} onClick={() => onSelectPatient(p)}>
                                        View Records →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Help text */}
            <div style={{ padding: "16px 20px", background: "rgba(59,130,246,0.05)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.1)", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <strong style={{ color: "#60a5fa" }}>🔍 Search Tips:</strong> You can search by patient name, 10‑digit phone number, Aadhaar number, or Patient ID.
                Only patients who have granted access to your hospital will allow you to view their records.
            </div>
        </div>
    );
}
