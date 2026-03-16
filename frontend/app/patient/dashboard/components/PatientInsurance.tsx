"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuShieldPlus, LuTrash2, LuSave, LuPlus } from "react-icons/lu";

interface Insurance {
    id: number;
    providerName: string;
    policyNumber: string;
    groupNumber: string;
    validUntil: string;
    isActive: boolean;
}

export default function PatientInsurance() {
    const [insurances, setInsurances] = useState<Insurance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [providerName, setProviderName] = useState("");
    const [policyNumber, setPolicyNumber] = useState("");
    const [groupNumber, setGroupNumber] = useState("");
    const [validUntil, setValidUntil] = useState("");

    const fetchInsurances = async () => {
        try {
            setLoading(true);
            const res = await api.get("/patient/insurance");
            setInsurances(res.data);
            setError("");
        } catch (err) {
            setError("Failed to load insurance details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsurances();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/patient/insurance", {
                providerName,
                policyNumber,
                groupNumber,
                validUntil: validUntil || null,
                isActive: true
            });
            setShowForm(false);
            setProviderName("");
            setPolicyNumber("");
            setGroupNumber("");
            setValidUntil("");
            fetchInsurances();
        } catch (err) {
            setError("Failed to add insurance.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this insurance detail?")) return;
        try {
            await api.delete(`/patient/insurance/${id}`);
            fetchInsurances();
        } catch (err) {
            setError("Failed to delete insurance.");
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading insurance records...</div>;
    }

    return (
        <div className="dark-panel" style={{ background: "#fff", padding: "28px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--bg-dark)" }}>My Insurance Details</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Manage your health insurance plans for seamless hospital billing.</p>
                </div>
                {!showForm && (
                    <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LuPlus size={18} /> Add Insurance
                    </button>
                )}
            </div>

            {error && <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#ef4444", marginBottom: 20, fontSize: "0.9rem" }}>{error}</div>}

            {showForm && (
                <div style={{ padding: 24, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 24 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--bg-dark)", marginBottom: 16 }}>New Insurance Detail</h3>
                    <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Provider Name</label>
                                <input required type="text" className="input-field" placeholder="e.g. Star Health, HDFC Ergo" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Policy Number</label>
                                <input required type="text" className="input-field" placeholder="Policy ID" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Group Number (Optional)</label>
                                <input type="text" className="input-field" placeholder="Group ID" value={groupNumber} onChange={(e) => setGroupNumber(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Valid Until</label>
                                <input type="date" className="input-field" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <LuSave size={16} /> Save Insurance
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {insurances.length === 0 && !showForm ? (
                <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    <LuShieldPlus size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, color: "var(--bg-dark)", fontSize: "1rem" }}>No Insurance Added</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>Add your insurance details to share them easily with linked hospitals.</div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                    {insurances.map(ins => (
                        <div key={ins.id} style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", position: "relative" }}>
                            <button 
                                onClick={() => handleDelete(ins.id)}
                                style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, borderRadius: 4 }}
                                title="Delete Insurance"
                            >
                                <LuTrash2 size={16} />
                            </button>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e" }}>
                                    <LuShieldPlus size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--bg-dark)" }}>{ins.providerName}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                        {ins.isActive ? <span style={{ color: "#22c55e", fontWeight: 600 }}>Active</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>Expired</span>}
                                        {ins.validUntil && ` • Valid till ${new Date(ins.validUntil).toLocaleDateString()}`}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Policy Number</span>
                                    <span style={{ fontSize: "0.85rem", color: "var(--bg-dark)", fontWeight: 600, letterSpacing: "0.05em" }}>{ins.policyNumber}</span>
                                </div>
                                {ins.groupNumber && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Group Number</span>
                                        <span style={{ fontSize: "0.85rem", color: "var(--bg-dark)", fontWeight: 600, letterSpacing: "0.05em" }}>{ins.groupNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
