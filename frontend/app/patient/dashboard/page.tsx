"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import ProfileCard from "./components/ProfileCard";
import TimelineView from "./components/TimelineView";
import AIInsights from "./components/AIInsights";
import Analytics from "./components/Analytics";
import DocumentVault from "./components/DocumentVault";
import AccessManager from "./components/AccessManager";
import ChatBotEmbed from "./components/ChatBotEmbed";

type Tab = "timeline" | "ai" | "analytics" | "vault" | "access" | "privacy";

export default function PatientDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("timeline");

    const [profile, setProfile] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAll = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "PATIENT") { router.push("/login"); return; }
        try {
            const [p, r, h, perms] = await Promise.all([
                api.get("/patient/profile"),
                api.get("/medical-records/patient-records"),
                api.get("/hospitals"),
                api.get("/access/my-permissions"),
            ]);
            setProfile(p.data);
            setRecords(r.data);
            setHospitals(h.data);
            setPermissions(perms.data);
        } catch {
            setError("Failed to load dashboard data. Please log in again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: "#cbd5e1", borderTopColor: "#3b82f6" }} />
            <p style={{ color: "#475569", fontWeight: 500 }}>Loading Dashboard…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#ef4444", fontWeight: 500 }}>Warning: {error}</div>
        </div>
    );

    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: "timeline", label: "Medical Timeline", icon: "Clock" },
        { id: "ai", label: "Health Insights", icon: "Activity" },
        { id: "analytics", label: "Health Analytics", icon: "BarChart" },
        { id: "vault", label: "Document Vault", icon: "Folder" },
        { id: "access", label: "Hospital Access", icon: "Shield" },
    ];

    const IconMap: Record<string, any> = {
        Clock: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
        Activity: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
        BarChart: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
        Folder: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
        Shield: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    };

    return (
        <div className="min-h-screen text-slate-200 font-sans relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            {/* Background Orbs */}
            <div className="orb-violet" />
            <div className="orb-blue" />
            <div className="orb-cyan" />

            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 px-8 h-16 flex items-center justify-between border-b border-slate-700/50">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)" }}>
                        U
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.02em", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ fontSize: "0.65rem", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Patient Portal</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <button style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", transition: "color 0.2s" }}
                        onMouseOver={e => e.currentTarget.style.color = "#fff"}
                        onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: "2px solid var(--bg-primary)", boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)" }} />
                    </button>
                    <button onClick={logout} className="btn-outline" style={{ padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600 }}>
                        Sign Out
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 10 }}>
                {/* Profile Section */}
                {profile && <ProfileCard profile={profile} recordCount={records.length} hospitalCount={hospitals.length} onProfileUpdate={fetchAll} />}

                {/* Dynamic Dashboard Area */}
                <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", marginTop: 32 }}>

                    {/* Sidebar Tabs */}
                    <div className="glass-strong" style={{ width: 240, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, padding: "20px 16px", borderRadius: 16, background: "rgba(15, 23, 42, 0.4)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingLeft: 12 }}>Navigation</div>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8, border: "none",
                                fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
                                background: activeTab === t.id ? "rgba(59, 130, 246, 0.15)" : "transparent",
                                color: activeTab === t.id ? "#60a5fa" : "var(--text-secondary)",
                                borderLeft: activeTab === t.id ? "3px solid #3b82f6" : "3px solid transparent",
                                boxShadow: activeTab === t.id ? "inset 0 0 20px rgba(59, 130, 246, 0.05)" : "none"
                            }}
                                onMouseOver={e => { if (activeTab !== t.id) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; } }}
                                onMouseOut={e => { if (activeTab !== t.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                            >
                                <span style={{ color: activeTab === t.id ? "#60a5fa" : "inherit", opacity: activeTab === t.id ? 1 : 0.7 }}>{IconMap[t.icon]}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="glass" style={{ flex: 1, minWidth: 300, minHeight: 400, borderRadius: 16, padding: 32 }}>
                        {activeTab === "timeline" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(59, 130, 246, 0.1)", borderRadius: 8, color: "#60a5fa" }}>
                                            {IconMap["Clock"]}
                                        </div>
                                        Medical Timeline
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "8px 0 0 52px" }}>Chronological history of hospital visits and treatments.</p>
                                </div>
                                <TimelineView records={records} />
                            </div>
                        )}

                        {activeTab === "ai" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(168, 85, 247, 0.1)", borderRadius: 8, color: "#c084fc" }}>
                                            {IconMap["Activity"]}
                                        </div>
                                        Health Insights
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "8px 0 0 52px" }}>Automated analysis based on your medical records.</p>
                                </div>
                                <AIInsights records={records} />
                            </div>
                        )}

                        {activeTab === "analytics" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(16, 185, 129, 0.1)", borderRadius: 8, color: "#34d399" }}>
                                            {IconMap["BarChart"]}
                                        </div>
                                        Health Analytics
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "8px 0 0 52px" }}>Statistical overview of your medical history.</p>
                                </div>
                                <Analytics records={records} />
                            </div>
                        )}

                        {activeTab === "vault" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(245, 158, 11, 0.1)", borderRadius: 8, color: "#fbbf24" }}>
                                            {IconMap["Folder"]}
                                        </div>
                                        Document Vault
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "8px 0 0 52px" }}>Secure repository for your medical reports and prescriptions.</p>
                                </div>
                                <DocumentVault records={records} />
                            </div>
                        )}

                        {activeTab === "access" && (
                            <div className="animate-fade-up">
                                <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ padding: 8, background: "rgba(239, 68, 68, 0.1)", borderRadius: 8, color: "#f87171" }}>
                                            {IconMap["Shield"]}
                                        </div>
                                        Hospital Access Management
                                    </h2>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "8px 0 0 52px" }}>Control permissions for healthcare providers.</p>
                                </div>
                                <AccessManager hospitals={hospitals} permissions={permissions} onRefresh={fetchAll} />
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* AI Chat Bot */}
            <ChatBotEmbed />
        </div>
    );
}
