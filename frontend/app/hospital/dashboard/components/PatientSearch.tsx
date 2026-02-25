"use client";

import { useState } from "react";
import api from "@/utils/api";

type PatientResult = {
    id: number;
    fullName: string;
    phone: string;
    maskedAadhaar: string;
    gender: string;
    dob: string;
    accessStatus: string;
    accessGranted: boolean;
};

export default function PatientSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PatientResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (query.trim().length < 2) return;

        setLoading(true);
        setError("");
        try {
            const res = await api.get(`/patient/search?q=${encodeURIComponent(query)}`);
            setResults(res.data);
            if (res.data.length === 0) setError("No patients found matching your search.");
        } catch {
            setError("Failed to search patients. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleAccessAction(patientId: number, action: "request" | "cancel") {
        try {
            if (action === "request") {
                await api.post("/access/request", { patientId });
            } else {
                await api.post("/access/cancel-request", { patientId });
            }
            // Re-trigger search to update status
            handleSearch();
        } catch {
            alert(`Failed to ${action} access. Please try again.`);
        }
    }

    return (
        <div className="glass-strong" style={{ padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Patient Name, Aadhaar, or Phone Number..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 48, background: "rgba(255, 255, 255, 0.05)" }}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0 28px" }}>
                    {loading ? "Searching..." : "Search"}
                </button>
            </form>

            {error && <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", borderRadius: 8, marginBottom: 24, fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{error}</div>}

            {results.length > 0 && (
                <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>Search Results ({results.length})</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {results.map((patient) => (
                            <div key={patient.id} style={{ display: "flex", gap: 24, alignItems: "center", padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12 }}>
                                {/* Patient Icon */}
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(59,130,246,0.1)", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                                    {patient.fullName.charAt(0).toUpperCase()}
                                </div>

                                {/* Patient Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{patient.fullName}</div>
                                        <div style={{ fontSize: "0.75rem", padding: "2px 8px", background: "rgba(255,255,255,0.1)", color: "#e2e8f0", borderRadius: 4, fontWeight: 600 }}>{patient.gender}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 16, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            {patient.maskedAadhaar}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                            {patient.phone}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Status */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 160 }}>
                                    {patient.accessGranted ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4ade80", fontSize: "0.85rem", fontWeight: 700, padding: "6px 12px", background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", borderRadius: 6 }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            Access Granted
                                        </div>
                                    ) : patient.accessStatus === "PENDING" ? (
                                        <>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fbbf24", fontSize: "0.85rem", fontWeight: 700, padding: "6px 12px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 6 }}>
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                                Request Pending
                                            </div>
                                            <button onClick={() => handleAccessAction(patient.id, "cancel")} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}>
                                                Cancel Request
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleAccessAction(patient.id, "request")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                            Request Access
                                        </button>
                                    )}
                                    {patient.accessStatus === "REJECTED" && !patient.accessGranted && (
                                        <div style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 600 }}>Previous request rejected</div>
                                    )}
                                    {patient.accessStatus === "REVOKED" && !patient.accessGranted && (
                                        <div style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 600 }}>Access previously revoked</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
