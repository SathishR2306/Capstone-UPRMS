"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";

import HospitalProfileCard from "./components/HospitalProfileCard";
import PatientSearch from "./components/PatientSearch";
import UploadRecordForm from "./components/UploadRecordForm";
import HospitalTimelineView from "./components/HospitalTimelineView";
import AIPatientSummary from "./components/AIPatientSummary";
import AuditLogs from "./components/AuditLogs";

type Tab = "overview" | "search" | "upload" | "timeline" | "ai" | "audit";

export default function HospitalDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfileAndStats = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "HOSPITAL") { router.push("/login"); return; }
        try {
            const [p, s] = await Promise.all([
                api.get("/hospitals/profile"),
                api.get("/hospitals/stats"),
            ]);
            setProfile(p.data);
            setStats(s.data);
        } catch {
            setError("Failed to load dashboard data. Please log in again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchProfileAndStats(); }, [fetchProfileAndStats]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: "#cbd5e1", borderTopColor: "#3b82f6" }} />
            <p style={{ color: "#475569", fontWeight: 500 }}>Loading Hospital Portal…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#ef4444", fontWeight: 500 }}>Warning: {error}</div>
        </div>
    );

    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: "overview", label: "Overview", icon: "Grid" },
        { id: "search", label: "Patient Search & Access", icon: "Users" },
        { id: "upload", label: "Upload Record", icon: "Upload" },
        { id: "timeline", label: "Patient Timeline", icon: "Clock" },
        { id: "ai", label: "AI Health Assistant", icon: "Bot" },
        { id: "audit", label: "Audit Logs", icon: "Shield" },
    ];

    const IconMap: Record<string, any> = {
        Grid: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
        Users: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        Upload: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
        Clock: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
        Bot: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>,
        Shield: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
    };

    return (
        <div style={{
            minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)",
            fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflowX: "hidden"
        }}>
            {/* Animated Background Orbs */}
            <div className="orb orb-violet" style={{ width: 500, height: 500, top: -150, right: -100 }} />
            <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: -100, left: -100, animationDelay: "2s" }} />
            <div className="orb orb-cyan" style={{ width: 300, height: 300, top: "40%", left: "30%", opacity: 0.15, animationDelay: "4s" }} />

            {/* Navbar */}
            <nav className="glass" style={{
                position: "sticky", top: 0, zIndex: 50,
                borderBottom: "1px solid var(--border)",
                padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between",
                borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="glow-blue" style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white", fontSize: "1.1rem" }}>
                        H
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "0.02em", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div className="gradient-text" style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Hospital Staff Portal</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <button onClick={logout} className="btn-outline" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Sign Out
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
                {/* Dynamic Dashboard Area */}
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", marginTop: 12 }}>

                    {/* Sidebar Tabs */}
                    <div className="glass-strong" style={{ width: 260, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, padding: "24px 16px", background: "rgba(15, 23, 42, 0.4)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, paddingLeft: 12 }}>Menu</div>
                        {TABS.map(t => {
                            const isActive = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                                    display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, border: "none",
                                    fontSize: "0.95rem", fontWeight: isActive ? 600 : 500, cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
                                    background: isActive ? "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(139,92,246,0.05))" : "transparent",
                                    color: isActive ? "#fff" : "var(--text-secondary)",
                                    borderLeft: isActive ? "3px solid #60a5fa" : "3px solid transparent",
                                    boxShadow: isActive ? "inset 0 0 20px rgba(59, 130, 246, 0.05)" : "none"
                                }}
                                    onMouseOver={e => !isActive && (e.currentTarget.style.color = "#fff")}
                                    onMouseOut={e => !isActive && (e.currentTarget.style.color = "var(--text-secondary)")}>
                                    <span style={{ color: isActive ? "#60a5fa" : "var(--text-secondary)", transition: "color 0.2s" }}>{IconMap[t.icon]}</span>
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content Area */}
                    <div className="glass animate-fade-up" style={{ flex: 1, minWidth: 300, minHeight: 650, padding: 40, background: "rgba(17, 24, 39, 0.6)" }}>
                        {activeTab === "overview" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(59,130,246,0.1)", borderRadius: 8, color: "#60a5fa" }}>{IconMap.Grid}</div>
                                        Dashboard Overview
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>Manage hospital profile and view summary statistics.</p>
                                </div>
                                {profile && stats && <HospitalProfileCard profile={profile} stats={stats} onProfileUpdate={fetchProfileAndStats} />}
                            </div>
                        )}

                        {activeTab === "search" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(139,92,246,0.1)", borderRadius: 8, color: "#a78bfa" }}>{IconMap.Users}</div>
                                        Patient Search & Access
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>Search patient database and manage access permissions.</p>
                                </div>
                                <PatientSearch />
                            </div>
                        )}

                        {activeTab === "upload" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(34,211,238,0.1)", borderRadius: 8, color: "#22d3ee" }}>{IconMap.Upload}</div>
                                        Upload Medical Record
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>Create new medical entries for patients who have granted access.</p>
                                </div>
                                <UploadRecordForm onUploadSuccess={() => setActiveTab("timeline")} />
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(59,130,246,0.1)", borderRadius: 8, color: "#60a5fa" }}>{IconMap.Clock}</div>
                                        Patient Timeline Viewer
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>View chronological health history for authorized patients.</p>
                                </div>
                                <HospitalTimelineView />
                            </div>
                        )}

                        {activeTab === "ai" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(139,92,246,0.1)", borderRadius: 8, color: "#a78bfa" }}>{IconMap.Bot}</div>
                                        AI Health Assistant
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>Generate clinical summaries and risk analysis using Gemini AI.</p>
                                </div>
                                <AIPatientSummary />
                            </div>
                        )}

                        {activeTab === "audit" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                                    <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(156,163,175,0.1)", borderRadius: 8, color: "#9ca3af" }}>{IconMap.Shield}</div>
                                        Audit Logs
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "8px 0 0 52px" }}>Track record uploads and access requests made by this hospital.</p>
                                </div>
                                <AuditLogs />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
