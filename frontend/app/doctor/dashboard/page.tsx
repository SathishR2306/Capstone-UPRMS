"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";

import DoctorProfileCard from "./components/DoctorProfileCard";
import PatientSearchDoctor from "./components/PatientSearchDoctor";
import DoctorRecordViewer from "./components/DoctorRecordViewer";
import DoctorAISummary from "./components/DoctorAISummary";
import SmartTimeline from "./components/SmartTimeline";
import DoctorActivityLog from "./components/DoctorActivityLog";
import DoctorNotifications from "./components/DoctorNotifications";
import DoctorSchedule from "./components/DoctorSchedule";
import DoctorAssignedPatients from "./components/DoctorAssignedPatients";

type Tab =
    | "overview"
    | "search"
    | "records"
    | "ai"
    | "timeline"
    | "activity"
    | "notifications"
    | "schedule"
    | "assigned";

interface SelectedPatient {
    id: number;
    fullName: string;
}

interface LicenseStatus {
    status: string;
    daysRemaining: number | null;
    licenseNumber: string;
    licenseExpiry: string;
}

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes auto-logout

/* ─── SVG Icons ─────────────────────────────────────── */
const UserIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const SearchIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const FolderIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);
const BotIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
    </svg>
);
const TimelineIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" /><circle cx="6" cy="12" r="2" />
        <circle cx="12" cy="8" r="2" /><circle cx="18" cy="12" r="2" />
    </svg>
);
const ShieldIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const BellIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const ClockIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const PeopleIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const LogoutIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

/* ─── Tab definitions ────────────────────────────────── */
const TABS: { id: Tab; label: string; Icon: React.FC; color: string }[] = [
    { id: "overview", label: "My Profile", Icon: UserIcon, color: "#60a5fa" },
    { id: "search", label: "Patient Search", Icon: SearchIcon, color: "#a78bfa" },
    { id: "assigned", label: "Assigned Patients", Icon: PeopleIcon, color: "#f472b6" },
    { id: "records", label: "Record Viewer", Icon: FolderIcon, color: "#22d3ee" },
    { id: "ai", label: "AI Summary", Icon: BotIcon, color: "#a78bfa" },
    { id: "timeline", label: "Smart Timeline", Icon: TimelineIcon, color: "#60a5fa" },
    { id: "schedule", label: "Schedule", Icon: ClockIcon, color: "#10b981" },
    { id: "activity", label: "Activity Log", Icon: ShieldIcon, color: "#9ca3af" },
    { id: "notifications", label: "Notifications", Icon: BellIcon, color: "#fb923c" },
];

const TAB_INFO: Record<Tab, { title: string; subtitle: string; iconBg: string }> = {
    overview: { title: "My Profile", subtitle: "View and manage your doctor profile and credentials.", iconBg: "rgba(59,130,246,0.1)" },
    search: { title: "Patient Search", subtitle: "Search patients by name, phone, Aadhaar or ID and check consent status.", iconBg: "rgba(139,92,246,0.1)" },
    assigned: { title: "Assigned Patients", subtitle: "Patients assigned to you by your hospital admin. Click to view records.", iconBg: "rgba(244,114,182,0.1)" },
    records: { title: "Record Viewer", subtitle: "View complete medical history for patients who have granted access.", iconBg: "rgba(34,211,238,0.1)" },
    ai: { title: "AI Medical Summary", subtitle: "Gemini AI clinical overview — chronic conditions, risk indicators, medication patterns.", iconBg: "rgba(139,92,246,0.1)" },
    timeline: { title: "Smart Timeline", subtitle: "Year-wise health history with surgery, critical and recurring illness markers.", iconBg: "rgba(59,130,246,0.1)" },
    schedule: { title: "Schedule & Availability", subtitle: "Set working hours, mark leave days, and view your real-time availability.", iconBg: "rgba(16,185,129,0.1)" },
    activity: { title: "Activity Log", subtitle: "Full audit trail of your patient record access and downloads.", iconBg: "rgba(156,163,175,0.1)" },
    notifications: { title: "Notifications", subtitle: "Access alerts, AI risk flags, and system updates.", iconBg: "rgba(251,146,60,0.1)" },
};

/* ═══════════════════════════════════════════════════════
   Main Doctor Dashboard
═══════════════════════════════════════════════════════ */
export default function DoctorDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [profile, setProfile] = useState<any>(null);
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);

    /* ── auto-logout on inactivity ─────────────────── */
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetTimer = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            localStorage.clear();
            router.push("/login?reason=inactivity");
        }, INACTIVITY_MS);
    }, [router]);

    useEffect(() => {
        const events = ["mousemove", "keydown", "click", "touchstart"];
        events.forEach(e => window.addEventListener(e, resetTimer));
        resetTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetTimer));
            if (timer.current) clearTimeout(timer.current);
        };
    }, [resetTimer]);

    /* ── role guard + profile load ─────────────────── */
    const fetchProfile = useCallback(async () => {
        const role = localStorage.getItem("role");
        if (role !== "DOCTOR") { router.push("/login"); return; }
        try {
            const [profileRes, licenseRes] = await Promise.allSettled([
                api.get("/doctors/profile"),
                api.get("/doctors/license-status"),
            ]);
            if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
            if (licenseRes.status === "fulfilled") setLicenseStatus(licenseRes.value.data);
        } catch {
            setError("Failed to load profile. Please log in again.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    /* ── handlers ──────────────────────────────────── */
    const logout = () => { localStorage.clear(); router.push("/login"); };

    const handleSelectPatient = (p: { id: number; fullName: string }) => {
        setSelectedPatient(p);
        setActiveTab("records");
    };

    /* ── License warning config ────────────────────── */
    const licenseWarning = licenseStatus && (licenseStatus.status === "EXPIRING_SOON" || licenseStatus.status === "EXPIRED");
    const licenseWarnConfig = licenseWarning ? {
        EXPIRING_SOON: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#fbbf24", icon: "⚠️", msg: `License expires in ${licenseStatus!.daysRemaining} days` },
        EXPIRED: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", color: "#f87171", icon: "🚫", msg: "License EXPIRED — contact your hospital admin immediately" },
    }[licenseStatus!.status as "EXPIRING_SOON" | "EXPIRED"] : null;

    /* ── loading / error states ────────────────────── */
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: "#cbd5e1", borderTopColor: "#3b82f6" }} />
            <p style={{ color: "#475569", fontWeight: 500 }}>Loading Doctor Portal…</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#ef4444", fontWeight: 500 }}>⚠ {error}</div>
        </div>
    );

    const curInfo = TAB_INFO[activeTab];
    const curTabDef = TABS.find(t => t.id === activeTab)!;

    /* ── render ────────────────────────────────────── */
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "system-ui,-apple-system,sans-serif" }}>

            {/* Background orbs */}
            <div className="orb orb-violet" style={{ width: 500, height: 500, top: -150, right: -100 }} />
            <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: -100, left: -100, animationDelay: "2s" }} />
            <div className="orb orb-cyan" style={{ width: 300, height: 300, top: "40%", left: "30%", opacity: 0.12, animationDelay: "4s" }} />

            {/* ── Navbar ───────────────────────────────── */}
            <nav className="glass" style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid var(--border)", padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>

                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#10b981,#3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "white", fontSize: "1.1rem", boxShadow: "0 0 18px rgba(16,185,129,0.35)" }}>D</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#fff", lineHeight: 1.2 }}>UPRMS</div>
                        <div style={{ background: "linear-gradient(90deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "0.68rem", letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700 }}>Doctor Portal</div>
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

                    {/* License expiry warning in navbar */}
                    {licenseWarnConfig && (
                        <div style={{ padding: "5px 14px", background: licenseWarnConfig.bg, border: `1px solid ${licenseWarnConfig.border}`, borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, color: licenseWarnConfig.color, display: "flex", alignItems: "center", gap: 6 }}>
                            {licenseWarnConfig.icon} {licenseWarnConfig.msg}
                        </div>
                    )}

                    {/* Doctor badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "0.8rem" }}>
                            {profile?.fullName?.[0]?.toUpperCase() || "D"}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.85rem", lineHeight: 1.2 }}>{profile?.fullName || "Doctor"}</div>
                            <div style={{ fontSize: "0.7rem", color: "#6ee7b7" }}>{profile?.specialization || "General"}</div>
                        </div>
                    </div>

                    {/* Selected patient chip */}
                    {selectedPatient && (
                        <div style={{ padding: "4px 14px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, fontSize: "0.8rem", color: "#c4b5fd", display: "flex", alignItems: "center", gap: 8 }}>
                            👤 {selectedPatient.fullName}
                            <button onClick={() => setSelectedPatient(null)} style={{ background: "none", border: "none", color: "#c4b5fd", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                    )}

                    {/* Logout */}
                    <button onClick={logout} className="btn-outline" style={{ padding: "8px 18px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                        <LogoutIcon /> Sign Out
                    </button>
                </div>
            </nav>

            {/* ── Page body ─────────────────────────────── */}
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>

                <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>

                    {/* ── Sidebar ───────────────────────── */}
                    <div className="glass-strong" style={{ width: 230, flexShrink: 0, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, background: "rgba(15,23,42,0.5)" }}>

                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10, paddingLeft: 10 }}>Navigation</div>

                        {TABS.map(t => {
                            const active = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "none", fontSize: "0.88rem", fontWeight: active ? 600 : 500, cursor: "pointer", transition: "all 0.2s", textAlign: "left", width: "100%", background: active ? "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(139,92,246,0.05))" : "transparent", color: active ? "#fff" : "var(--text-secondary)", borderLeft: active ? `3px solid ${t.color}` : "3px solid transparent" }}
                                    onMouseOver={e => !active && (e.currentTarget.style.color = "#e2e8f0")}
                                    onMouseOut={e => !active && (e.currentTarget.style.color = "var(--text-secondary)")}
                                >
                                    <span style={{ color: active ? t.color : "inherit", transition: "color 0.2s" }}><t.Icon /></span>
                                    {t.label}
                                </button>
                            );
                        })}

                        {/* Hospital info */}
                        <div style={{ marginTop: 18, padding: "12px", background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 8 }}>
                            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6ee7b7", textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.07em" }}>HOSPITAL</div>
                            <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontWeight: 500 }}>{profile?.hospitalName || "—"}</div>
                        </div>

                        {/* Role + Status */}
                        {profile?.role && (
                            <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.07em" }}>Role</div>
                                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{profile.role?.replace(/_/g, " ")}</div>
                            </div>
                        )}

                        {/* Licence number */}
                        {profile?.licenseNumber && (
                            <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.07em" }}>Licence</div>
                                <div style={{ fontSize: "0.8rem", color: licenseStatus?.status === "EXPIRED" ? "#f87171" : licenseStatus?.status === "EXPIRING_SOON" ? "#fbbf24" : "#94a3b8", fontFamily: "monospace" }}>{profile.licenseNumber}</div>
                            </div>
                        )}
                    </div>

                    {/* ── Main content area ─────────────── */}
                    <div className="glass animate-fade-up" style={{ flex: 1, minWidth: 300, minHeight: 650, padding: 40, background: "rgba(17,24,39,0.6)" }}>

                        {/* License expiry alert banner (inside content) */}
                        {licenseWarnConfig && (
                            <div style={{ marginBottom: 24, padding: "12px 18px", borderRadius: 10, background: licenseWarnConfig.bg, border: `1px solid ${licenseWarnConfig.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: "1.2rem" }}>{licenseWarnConfig.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: licenseWarnConfig.color, fontSize: "0.9rem" }}>{licenseWarnConfig.msg}</div>
                                    <div style={{ fontSize: "0.78rem", color: licenseWarnConfig.color, opacity: 0.8, marginTop: 2 }}>License No: {licenseStatus?.licenseNumber} · Please renew immediately to avoid suspension.</div>
                                </div>
                            </div>
                        )}

                        {/* Tab header */}
                        <div style={{ marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                            <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 14 }}>
                                <div style={{ padding: 9, background: curInfo.iconBg, borderRadius: 10, color: curTabDef.color }}>
                                    <curTabDef.Icon />
                                </div>
                                {curInfo.title}
                            </h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "8px 0 0 54px" }}>{curInfo.subtitle}</p>
                        </div>

                        {/* Tab panels */}
                        {activeTab === "overview" && <DoctorProfileCard onProfileUpdate={fetchProfile} />}
                        {activeTab === "search" && <PatientSearchDoctor onSelectPatient={handleSelectPatient} />}
                        {activeTab === "assigned" && <DoctorAssignedPatients onSelectPatient={handleSelectPatient} />}
                        {activeTab === "records" && <DoctorRecordViewer patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "ai" && <DoctorAISummary patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "timeline" && <SmartTimeline patientId={selectedPatient?.id} patientName={selectedPatient?.fullName} />}
                        {activeTab === "schedule" && <DoctorSchedule />}
                        {activeTab === "activity" && <DoctorActivityLog />}
                        {activeTab === "notifications" && <DoctorNotifications />}
                    </div>
                </div>
            </div>
        </div>
    );
}
