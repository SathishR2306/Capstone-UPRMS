"use client";

import { useState } from "react";
import api from "@/utils/api";
import { LuSearch, LuUser, LuShieldCheck, LuClock, LuHash } from "react-icons/lu";

type PatientResult = {
    id: number;
    userId: number;
    fullName: string;
    phone: string;
    gender: string;
    dob: string;
    accessStatus: string;
    accessGranted: boolean;
};

export default function FindPatient() {
    const [aadhaar, setAadhaar] = useState("");
    const [results, setResults] = useState<PatientResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!aadhaar.trim()) return;

        setLoading(true);
        setError("");
        setResults([]);
        
        try {
            const res = await api.get(`/patient/find?q=${encodeURIComponent(aadhaar.trim())}`);
            setResults(res.data);
            if (res.data.length === 0) setError("No patient found with this Aadhaar Number.");
        } catch {
            setError("Failed to find patient. Please check the Aadhaar Number.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestAccess(patientId: number) {
        try {
            await api.post("/access/request", { patientId });
            // Refresh search results to show pending status
            const res = await api.get(`/patient/find?q=${encodeURIComponent(aadhaar.trim())}`);
            setResults(res.data);
        } catch {
            alert("Failed to request access. Please try again.");
        }
    }

    return (
        <div className="glass-strong" style={{ padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>
            <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Find Patient by Aadhaar Number</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Enter the patient's 12-digit Aadhaar number to request access to their clinical history.</p>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                        <LuHash size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Enter 12-digit Aadhaar Number"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 48, background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
                        maxLength={12}
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0 28px" }}>
                    {loading ? "Searching..." : "Find Patient"}
                </button>
            </form>

            {error && <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", borderRadius: 8, marginBottom: 24, fontSize: "0.9rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>{error}</div>}

            {results.length > 0 && (
                <div className="animate-fade-up">
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>Patient Record Found</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {results.map((patient) => (
                            <div key={patient.id} style={{ display: "flex", gap: 24, alignItems: "center", padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 16 }}>
                                <div style={{ width: 60, height: 60, borderRadius: "18px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.5rem" }}>
                                    <LuUser />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{patient.fullName}</div>
                                        <div style={{ fontSize: "0.75rem", padding: "3px 10px", background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", borderRadius: "6px", fontWeight: 700, border: "1px solid rgba(59, 130, 246, 0.2)" }}>Patient ID: {patient.id}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 20, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        <div>Gender: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{patient.gender}</span></div>
                                        <div>User ID: <span style={{ color: "var(--accent-violet)", fontWeight: 700 }}>{patient.userId}</span></div>
                                    </div>
                                </div>

                                <div style={{ minWidth: 180, textAlign: "right" }}>
                                    {patient.accessGranted ? (
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#4ade80", fontSize: "0.85rem", fontWeight: 700, padding: "8px 16px", background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", borderRadius: 10 }}>
                                            <LuShieldCheck size={16} />
                                            Already Linked
                                        </div>
                                    ) : patient.accessStatus === "PENDING" ? (
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fbbf24", fontSize: "0.85rem", fontWeight: 700, padding: "8px 16px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 10 }}>
                                            <LuClock size={16} />
                                            Request Sent
                                        </div>
                                    ) : (
                                        <button onClick={() => handleRequestAccess(patient.id)} className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                                            <LuShieldCheck size={16} />
                                            Request Access
                                        </button>
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
