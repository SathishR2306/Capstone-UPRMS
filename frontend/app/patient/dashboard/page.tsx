"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import TimelineView from "./components/TimelineView";
import AIInsights from "./components/AIInsights";
import Analytics from "./components/Analytics";
import DocumentVault from "./components/DocumentVault";
import AccessManager from "./components/AccessManager";
import ChatBotEmbed from "./components/ChatBotEmbed";

type Tab = "timeline" | "ai" | "analytics" | "vault" | "access";

const TABS: { id: Tab; label: string; icon: JSX.Element; color: string }[] = [
    {
        id: "timeline", label: "Medical Timeline", color: "#1ABC9C",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    },
    {
        id: "ai", label: "Health Insights", color: "#8b5cf6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    },
    {
        id: "analytics", label: "Health Analytics", color: "#F39C12",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>,
    },
    {
        id: "vault", label: "Document Vault", color: "#3b82f6",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    },
    {
        id: "access", label: "Hospital Access", color: "#E74C3C",
        icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    },
];

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
    timeline: { title: "Medical Timeline", subtitle: "Chronological history of hospital visits and treatments" },
    ai: { title: "Health Insights", subtitle: "Automated AI analysis based on your medical records" },
    analytics: { title: "Health Analytics", subtitle: "Statistical overview and trends in your medical history" },
    vault: { title: "Document Vault", subtitle: "Secure repository for your medical reports and prescriptions" },
    access: { title: "Hospital Access Manager", subtitle: "Control which healthcare providers can access your records" },
};

export default function PatientDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("analytics");
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
        } finally { setLoading(false); }
    }, [router]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#1ABC9C,#2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <div className="spinner" />
            <p style={{ color: "#5A6A7A", fontWeight: 500, fontSize: "0.9rem" }}>Loading Dashboard…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#F4F7FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", padding: "32px 40px", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", color: "#E74C3C", fontWeight: 600 }}>⚠ {error}</div>
        </div>
    );

    const currentTab = TABS.find(t => t.id === activeTab)!;
    const initials = profile?.fullName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "P";

    return (
        <div className="dashboard-shell">
            {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
            <aside className="dashboard-sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">U</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Patient Portal</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main Menu</div>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`sidebar-nav-btn${activeTab === t.id ? " active" : ""}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <span className="nav-icon">{t.icon}</span>
                            {t.label}
                            {activeTab === t.id && (
                                <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--teal-500)", flexShrink: 0 }} />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Profile at bottom */}
                <div className="sidebar-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1ABC9C,#2ECC71)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>{initials}</div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.fullName ?? "Patient"}</div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Patient ID #{profile?.id ?? "—"}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn-outline" style={{
                        width: "100%", marginTop: 8, borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                        fontSize: "0.82rem", padding: "9px 14px", justifyContent: "flex-start", gap: 8
                    }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── RIGHT BODY ───────────────────────────────────── */}
            <div className="dashboard-body">
                {/* Top Header */}
                <header className="dashboard-topbar">
                    <div>
                        <div className="topbar-title">{TAB_META[activeTab].title}</div>
                        <div className="topbar-subtitle">{TAB_META[activeTab].subtitle}</div>
                    </div>
                    <div className="topbar-actions">
                        {/* Notification bell */}
                        <button className="topbar-icon-btn">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            <span className="notification-dot" />
                        </button>
                        {/* Avatar */}
                        <div className="topbar-avatar" title={profile?.fullName}>{initials}</div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-content">
                    {/* Quick stats row at top of every page */}
                    <div className="kpi-grid animate-fade-up" style={{ marginBottom: 28 }}>
                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(26,188,156,0.12)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#1ABC9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                </div>
                                <span className="kpi-trend up">↑ Active</span>
                            </div>
                            <div className="kpi-value">{records.length}</div>
                            <div className="kpi-label">Total Records</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(30,42,95,0.08)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#1E2A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <span className="kpi-trend neutral">Linked</span>
                            </div>
                            <div className="kpi-value">{hospitals.length}</div>
                            <div className="kpi-label">Hospitals</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(243,156,18,0.1)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#F39C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <span className="kpi-trend up">Granted</span>
                            </div>
                            <div className="kpi-value">{permissions.filter((p: any) => p.accessGranted).length}</div>
                            <div className="kpi-label">Active Permissions</div>
                        </div>

                        <div className="kpi-card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div className="kpi-icon-wrap" style={{ background: "rgba(139,92,246,0.1)" }}>
                                    <svg width="20" height="20" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                                </div>
                                <span className="kpi-trend neutral">
                                    {records.length > 0
                                        ? new Date(records[records.length - 1]?.visitDate).getFullYear()
                                        : "—"}
                                </span>
                            </div>
                            <div className="kpi-value" style={{ fontSize: "1.5rem" }}>
                                {records.length > 0
                                    ? new Date(records[records.length - 1]?.visitDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                                    : "—"}
                            </div>
                            <div className="kpi-label">Last Visit</div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-up-delay-1">
                        {activeTab === "timeline" && <TimelineView records={records} />}
                        {activeTab === "ai" && <AIInsights records={records} />}
                        {activeTab === "analytics" && <Analytics records={records} />}
                        {activeTab === "vault" && <DocumentVault records={records} />}
                        {activeTab === "access" && <AccessManager hospitals={hospitals} permissions={permissions} onRefresh={fetchAll} />}
                    </div>
                </main>
            </div>

            <ChatBotEmbed />
        </div>
    );
}
