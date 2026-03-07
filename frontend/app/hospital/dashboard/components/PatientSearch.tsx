import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuSearch, LuCalendar, LuPhone, LuShieldCheck, LuClock } from "react-icons/lu";

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

export default function PatientSearch({ onlyLinked = false }: { onlyLinked?: boolean }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PatientResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Initial fetch for linked patients
    useEffect(() => {
        if (onlyLinked) {
            handleSearch();
        }
    }, [onlyLinked]);


    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        
        // Allow empty query if onlyLinked is true to show all linked patients
        if (!onlyLinked && query.trim().length < 2) return;

        setLoading(true);
        setError("");
        try {
            const url = `/patient/search?q=${encodeURIComponent(query)}&linked=${onlyLinked}`;
            const res = await api.get(url);
            setResults(res.data);
            if (res.data.length === 0) {
                setError(onlyLinked ? "No linked patients found." : "No patients found matching your search.");
            }
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
                        <LuSearch size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Patient Name, Aadhaar, or Phone Number..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 48, background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
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
                                            <LuCalendar size={14} />
                                            {patient.maskedAadhaar}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <LuPhone size={14} />
                                            {patient.phone}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions & Status */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 160 }}>
                                    {patient.accessGranted ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4ade80", fontSize: "0.85rem", fontWeight: 700, padding: "6px 12px", background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)", borderRadius: 6 }}>
                                            <LuShieldCheck size={14} />
                                            Access Granted
                                        </div>
                                    ) : patient.accessStatus === "PENDING" ? (
                                        <>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fbbf24", fontSize: "0.85rem", fontWeight: 700, padding: "6px 12px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 6 }}>
                                                <LuClock size={14} />
                                                Request Pending
                                            </div>
                                            <button onClick={() => handleAccessAction(patient.id, "cancel")} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", textDecoration: "underline", cursor: "pointer", fontWeight: 500 }}>
                                                Cancel Request
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleAccessAction(patient.id, "request")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                                            <LuShieldCheck size={14} />
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
