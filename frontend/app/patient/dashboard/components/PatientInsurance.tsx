"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { LuShieldPlus, LuTrash2, LuSave, LuPlus, LuSearch, LuExternalLink, LuSparkles, LuShieldCheck, LuBuilding2, LuHeart, LuRefreshCw } from "react-icons/lu";

/* ── Types ──────────────────────────────────────────── */
interface Insurance {
    id: number;
    providerName: string;
    policyNumber: string;
    groupNumber: string;
    validUntil: string;
    isActive: boolean;
}

interface InsuranceScheme {
    name: string;
    shortName: string;
    type: "government" | "private";
    category: "central" | "state" | "private";
    description: string;
    coverage: string;
    eligibility: string;
    keyBenefits: string[];
    officialWebsite: string;
    enrollmentUrl: string;
    tags: string[];
}

type Tab = "all" | "my";

/* ── Category colors ────────────────────────────────── */
const CATEGORY_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
    central: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Central Govt" },
    state: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", label: "State Govt" },
    private: { bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff", label: "Private" },
};

/* ── Tag colors ─────────────────────────────────────── */
const TAG_COLORS: Record<string, string> = {
    cashless: "#0d9488",
    family: "#2563eb",
    "senior citizen": "#d97706",
    surgery: "#dc2626",
    maternity: "#ec4899",
    accident: "#ef4444",
    hospitalization: "#6366f1",
    "pre-existing": "#8b5cf6",
    "day care": "#0891b2",
    "critical illness": "#be123c",
    default: "#64748b",
};

export default function PatientInsurance() {
    const [activeTab, setActiveTab] = useState<Tab>("all");

    /* ── My Insurance State ─────────────────────────── */
    const [insurances, setInsurances] = useState<Insurance[]>([]);
    const [myLoading, setMyLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [providerName, setProviderName] = useState("");
    const [policyNumber, setPolicyNumber] = useState("");
    const [groupNumber, setGroupNumber] = useState("");
    const [validUntil, setValidUntil] = useState("");

    /* ── All Insurance State ────────────────────────── */
    const [schemes, setSchemes] = useState<InsuranceScheme[]>([]);
    const [schemesLoading, setSchemesLoading] = useState(false);
    const [schemesError, setSchemesError] = useState("");
    const [schemesFetched, setSchemesFetched] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "government" | "private">("all");

    /* ── Fetch My Insurances ────────────────────────── */
    const fetchInsurances = async () => {
        try {
            setMyLoading(true);
            const res = await api.get("/patient/insurance");
            setInsurances(res.data);
            setError("");
        } catch (err) {
            setError("Failed to load insurance details.");
        } finally {
            setMyLoading(false);
        }
    };

    useEffect(() => { fetchInsurances(); }, []);

    /* ── Fetch All Schemes via Gemini ────────────────── */
    const fetchSchemes = async () => {
        if (schemesLoading) return;
        try {
            setSchemesLoading(true);
            setSchemesError("");
            const res = await fetch("/api/insurance-schemes");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSchemes(data.schemes || []);
            setSchemesFetched(true);
        } catch (err: any) {
            setSchemesError(err.message || "Failed to fetch insurance schemes.");
        } finally {
            setSchemesLoading(false);
        }
    };

    // Fetch schemes when switching to "All Insurance" tab for the first time
    useEffect(() => {
        if (activeTab === "all" && !schemesFetched && !schemesLoading) {
            fetchSchemes();
        }
    }, [activeTab]);

    /* ── My Insurance handlers ──────────────────────── */
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
            setProviderName(""); setPolicyNumber(""); setGroupNumber(""); setValidUntil("");
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

    /* ── Filtered schemes ───────────────────────────── */
    const filteredSchemes = useMemo(() => {
        return schemes.filter(s => {
            if (filterType !== "all" && s.type !== filterType) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    s.name.toLowerCase().includes(q) ||
                    s.shortName.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q) ||
                    s.tags.some(t => t.toLowerCase().includes(q)) ||
                    s.coverage.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [schemes, searchQuery, filterType]);

    const govtCount = schemes.filter(s => s.type === "government").length;
    const privateCount = schemes.filter(s => s.type === "private").length;

    /* ── Render ──────────────────────────────────────── */
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Tab Switcher */}
            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 4, borderRadius: 12, width: "fit-content" }}>
                <button
                    onClick={() => setActiveTab("all")}
                    style={{
                        padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                        fontSize: "0.9rem", fontWeight: 600, transition: "all 0.2s ease",
                        background: activeTab === "all" ? "#fff" : "transparent",
                        color: activeTab === "all" ? "#1E293B" : "#64748b",
                        boxShadow: activeTab === "all" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                        display: "flex", alignItems: "center", gap: 8,
                    }}
                >
                    <LuSearch size={16} /> All Insurance Schemes
                </button>
                <button
                    onClick={() => setActiveTab("my")}
                    style={{
                        padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                        fontSize: "0.9rem", fontWeight: 600, transition: "all 0.2s ease",
                        background: activeTab === "my" ? "#fff" : "transparent",
                        color: activeTab === "my" ? "#1E293B" : "#64748b",
                        boxShadow: activeTab === "my" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                        display: "flex", alignItems: "center", gap: 8,
                    }}
                >
                    <LuShieldPlus size={16} /> My Insurance
                    {insurances.length > 0 && (
                        <span style={{ background: "#22c55e", color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 700 }}>
                            {insurances.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ━━━━━━━━ ALL INSURANCE TAB ━━━━━━━━ */}
            {activeTab === "all" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#000", display: "flex", alignItems: "center", gap: 10 }}>
                                <LuSparkles size={20} color="#f59e0b" /> Explore Health Insurance Schemes
                            </h2>
                            <p style={{ fontSize: "0.85rem", color: "#5F7285", marginTop: 4 }}>
                                Discover government and private health insurance plans powered by AI • Click any scheme to learn more
                            </p>
                        </div>
                        <button
                            onClick={fetchSchemes}
                            disabled={schemesLoading}
                            className="btn-outline"
                            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", opacity: schemesLoading ? 0.6 : 1 }}
                        >
                            <LuRefreshCw size={14} style={{ animation: schemesLoading ? "spin 1s linear infinite" : "none" }} />
                            {schemesLoading ? "Fetching…" : "Refresh"}
                        </button>
                    </div>

                    {/* Search + Filter Row */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
                            <LuSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                            <input
                                placeholder="Search by name, coverage, tags…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="input-field"
                                style={{ width: "100%", paddingLeft: 40 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            {([
                                { key: "all", label: "All", count: schemes.length },
                                { key: "government", label: "Government", count: govtCount },
                                { key: "private", label: "Private", count: privateCount },
                            ] as const).map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilterType(f.key)}
                                    style={{
                                        padding: "8px 16px", borderRadius: 8, border: "1px solid",
                                        borderColor: filterType === f.key ? "#3b82f6" : "#e2e8f0",
                                        background: filterType === f.key ? "#eff6ff" : "#fff",
                                        color: filterType === f.key ? "#1d4ed8" : "#64748b",
                                        cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading State */}
                    {schemesLoading && (
                        <div style={{ padding: 60, textAlign: "center" }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: "50%",
                                background: "linear-gradient(135deg, #22c55e, #3b82f6)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 16px", animation: "spin 2s linear infinite",
                            }}>
                                <LuSparkles size={22} color="#fff" />
                            </div>
                            <p style={{ color: "#3D5166", fontWeight: 600, fontSize: "1rem" }}>AI is fetching insurance schemes…</p>
                            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 4 }}>This may take a few seconds</p>
                        </div>
                    )}

                    {/* Error State */}
                    {schemesError && (
                        <div style={{ padding: 16, borderRadius: 10, background: "#fef2f2", color: "#ef4444", fontSize: "0.9rem", border: "1px solid #fecaca" }}>
                            ⚠ {schemesError}
                            <button onClick={fetchSchemes} style={{ marginLeft: 12, color: "#1d4ed8", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Scheme Cards */}
                    {!schemesLoading && !schemesError && filteredSchemes.length === 0 && schemesFetched && (
                        <div style={{ padding: 60, textAlign: "center", background: "#f8fafc", borderRadius: 16, border: "1px dashed #d0d9e8" }}>
                            <LuSearch size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
                            <p style={{ color: "#3D5166", fontWeight: 600 }}>No schemes match your search.</p>
                            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 4 }}>Try different keywords or clear the filter.</p>
                        </div>
                    )}

                    {!schemesLoading && filteredSchemes.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
                            {filteredSchemes.map((scheme, i) => {
                                const cat = CATEGORY_STYLE[scheme.category] || CATEGORY_STYLE.private;
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                                            padding: 0, overflow: "hidden",
                                            transition: "box-shadow 0.2s ease",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)")}
                                        onMouseOut={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
                                    >
                                        <div style={{ padding: "20px 24px" }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                                        background: scheme.type === "government" ? "rgba(34,197,94,0.1)" : "rgba(139,92,246,0.1)",
                                                        color: scheme.type === "government" ? "#16a34a" : "#7c3aed",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                    }}>
                                                        {scheme.type === "government" ? <LuBuilding2 size={22} /> : <LuHeart size={22} />}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1E293B", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                            {scheme.name}
                                                        </div>
                                                        <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                                                            {scheme.shortName} • {scheme.coverage}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
                                                    background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`,
                                                    whiteSpace: "nowrap", flexShrink: 0,
                                                }}>
                                                    {cat.label}
                                                </span>
                                            </div>

                                            <p style={{ fontSize: "0.85rem", color: "#5F7285", marginTop: 12, lineHeight: 1.5 }}>
                                                {scheme.description}
                                            </p>

                                            {/* Tags */}
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                                                {scheme.tags.slice(0, 5).map((tag, j) => (
                                                    <span key={j} style={{
                                                        padding: "3px 8px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600,
                                                        background: `${TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default}15`,
                                                        color: TAG_COLORS[tag.toLowerCase()] || TAG_COLORS.default,
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Always-visible Enroll / Visit button */}
                                            <div style={{ marginTop: 14 }}>
                                                <a
                                                    href={scheme.enrollmentUrl || scheme.officialWebsite}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    style={{
                                                        display: "inline-flex", alignItems: "center", gap: 6,
                                                        padding: "8px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                                                        background: "linear-gradient(135deg, #0fd4b0, #1a8fff)", color: "#fff",
                                                        textDecoration: "none", transition: "all 0.2s ease",
                                                        boxShadow: "0 2px 10px rgba(15, 212, 176, 0.25)",
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(15, 212, 176, 0.35)"; }}
                                                    onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(15, 212, 176, 0.25)"; }}
                                                >
                                                    <LuExternalLink size={14} /> Enroll / Visit
                                                </a>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Info Banner */}
                    {!schemesLoading && schemesFetched && (
                        <div style={{
                            padding: "16px 20px", borderRadius: 10, background: "#fffbeb",
                            border: "1px solid #fde68a", fontSize: "0.82rem", color: "#92400e",
                            display: "flex", alignItems: "center", gap: 10,
                        }}>
                            <LuSparkles size={16} style={{ flexShrink: 0 }} />
                            Insurance data is generated by AI and may not reflect the latest updates. Always verify details on the official government websites before applying.
                        </div>
                    )}
                </div>
            )}

            {/* ━━━━━━━━ MY INSURANCE TAB ━━━━━━━━ */}
            {activeTab === "my" && (
                <div className="dark-panel" style={{ background: "#fff", padding: "28px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#000" }}>My Insurance Details</h2>
                            <p style={{ fontSize: "0.85rem", color: "#5F7285", marginTop: 4 }}>Manage your health insurance plans for seamless hospital billing.</p>
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
                            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#000", marginBottom: 16 }}>New Insurance Detail</h3>
                            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "#5F7285" }}>Provider Name</label>
                                        <input required type="text" className="input-field" placeholder="e.g. Star Health, HDFC Ergo" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "#5F7285" }}>Policy Number</label>
                                        <input required type="text" className="input-field" placeholder="Policy ID" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "#5F7285" }}>Group Number (Optional)</label>
                                        <input type="text" className="input-field" placeholder="Group ID" value={groupNumber} onChange={(e) => setGroupNumber(e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6, color: "#5F7285" }}>Valid Until</label>
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

                    {myLoading ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#5F7285" }}>Loading insurance records...</div>
                    ) : insurances.length === 0 && !showForm ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                            <LuShieldPlus size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
                            <div style={{ fontWeight: 600, color: "#000", fontSize: "1rem" }}>No Insurance Added</div>
                            <div style={{ color: "#5F7285", fontSize: "0.85rem", marginTop: 4 }}>Add your insurance details to share them easily with linked hospitals.</div>
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
                                            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#000" }}>{ins.providerName}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#5F7285" }}>
                                                {ins.isActive ? <span style={{ color: "#22c55e", fontWeight: 600 }}>Active</span> : <span style={{ color: "#ef4444", fontWeight: 600 }}>Expired</span>}
                                                {ins.validUntil && ` • Valid till ${new Date(ins.validUntil).toLocaleDateString()}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <span style={{ fontSize: "0.75rem", color: "#5F7285", fontWeight: 600 }}>Policy Number</span>
                                            <span style={{ fontSize: "0.85rem", color: "#000", fontWeight: 600, letterSpacing: "0.05em" }}>{ins.policyNumber}</span>
                                        </div>
                                        {ins.groupNumber && (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: "0.75rem", color: "#5F7285", fontWeight: 600 }}>Group Number</span>
                                                <span style={{ fontSize: "0.85rem", color: "#000", fontWeight: 600, letterSpacing: "0.05em" }}>{ins.groupNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
