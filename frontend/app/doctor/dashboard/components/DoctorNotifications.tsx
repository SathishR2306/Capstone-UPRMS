"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface Notification {
    id: string;
    type: "emergency" | "assignment" | "access" | "activity" | "info";
    title: string;
    message: string;
    time: string; // ISO string from backend
    patientName?: string;
    patientId?: number;
    isEmergency?: boolean;
    assignedBy?: string;
    read: boolean;
}

const TYPE_STYLE: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    emergency: { icon: "🚨", color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)" },
    assignment: { icon: "👥", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
    access: { icon: "🔓", color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
    activity: { icon: "⏰", color: "#facc15", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.25)" },
    info: { icon: "ℹ️", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
};

function formatTimeAgo(isoString: string) {
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
}

export default function DoctorNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get("/doctors/notifications");
                setNotifications(res.data);
            } catch (err: any) {
                console.error("Failed to load notifications", err);
                setError("Could not load notifications.");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading notifications...</div>;
    }

    if (error) {
        return <div style={{ padding: 20, color: "#fca5a5", background: "rgba(239, 68, 68, 0.1)", borderRadius: 12 }}>{error}</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}>Notifications & Alerts</div>
                    {unreadCount > 0 && (
                        <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "0.8rem", fontWeight: 700 }}>
                            {unreadCount} unread
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className="btn-outline" style={{ padding: "6px 16px", fontSize: "0.8rem", borderColor: "rgba(255,255,255,0.2)" }} onClick={markAllRead}>
                        Mark all read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", borderRadius: 16 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔔</div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "#e2e8f0" }}>No notifications right now</div>
                    <div style={{ fontSize: "0.85rem", marginTop: 4 }}>You will be alerted here when new patients are assigned.</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {notifications.map((n) => {
                        const s = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                        return (
                            <div
                                key={n.id}
                                style={{
                                    padding: "20px",
                                    background: n.read ? "rgba(255,255,255,0.03)" : s.bg,
                                    border: `1px solid ${n.read ? "var(--border)" : s.border}`,
                                    borderRadius: 14,
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "flex-start",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow: !n.read && n.type === "emergency" ? "0 4px 20px rgba(239,68,68,0.15)" : "none",
                                }}
                                onClick={() => markRead(n.id)}
                            >
                                <div style={{ fontSize: "1.5rem", flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: n.read ? "rgba(255,255,255,0.05)" : s.bg, display: "flex", alignItems: "center", justifyContent: "center", border: n.read ? "none" : `1px solid ${s.border}` }}>
                                    {s.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
                                        <div style={{ fontWeight: n.read ? 600 : 800, color: n.read ? "rgba(255,255,255,0.7)" : n.type === "emergency" ? "#fca5a5" : "#fff", fontSize: "0.95rem" }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: n.read ? "rgba(255,255,255,0.4)" : s.color, flexShrink: 0, fontWeight: n.read ? 500 : 700 }}>
                                            {formatTimeAgo(n.time)}
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: "0.88rem", color: n.read ? "rgba(255,255,255,0.5)" : "#e2e8f0", lineHeight: 1.6 }}>
                                        {n.message}
                                    </div>

                                    {!n.read && n.type === "emergency" && (
                                        <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                                            Acknowledge Emergency Alert
                                        </button>
                                    )}
                                </div>
                                {!n.read && (
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0, marginTop: 6, boxShadow: `0 0 10px ${s.color}` }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
