"use client";

import { useState, useEffect } from "react";

interface Notification {
    id: number;
    type: "access" | "risk" | "expiry" | "info";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const TYPE_STYLE: Record<string, { icon: string; color: string; bg: string; border: string }> = {
    access: { icon: "🔓", color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
    risk: { icon: "⚠️", color: "#facc15", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
    expiry: { icon: "⏰", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
    info: { icon: "ℹ️", color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" },
};

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 1, type: "access", title: "New Access Granted", message: "Patient has approved access to their medical records. You can now view their complete history.", time: "5 min ago", read: false },
    { id: 2, type: "risk", title: "AI Risk Alert", message: "AI analysis detected elevated cardiac risk indicators in a recently accessed patient profile. Review recommended.", time: "1 hour ago", read: false },
    { id: 3, type: "expiry", title: "Access Expiry Warning", message: "Your access to a patient's records may expire soon. Renew if follow-up is needed.", time: "2 hours ago", read: false },
    { id: 4, type: "info", title: "System Update", message: "UPRMS Doctor Portal has been updated. Smart Timeline and AI Summary are now available for all authorized patients.", time: "1 day ago", read: true },
];

export default function DoctorNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        // Simulate loading notifications (in a real system this would be an API call)
        setTimeout(() => setNotifications(MOCK_NOTIFICATIONS), 300);
    }, []);

    const markRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>Notifications</div>
                    {unreadCount > 0 && (
                        <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.78rem", fontWeight: 700 }}>
                            {unreadCount} unread
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className="btn-outline" style={{ padding: "6px 16px", fontSize: "0.8rem" }} onClick={markAllRead}>Mark all read</button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🔔</div>
                    No notifications at this time.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {notifications.map(n => {
                        const s = TYPE_STYLE[n.type];
                        return (
                            <div key={n.id} style={{ padding: 18, background: n.read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", border: `1px solid ${n.read ? "var(--border)" : s.border}`, borderRadius: 12, display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer", transition: "all 0.2s" }}
                                onClick={() => markRead(n.id)}>
                                <div style={{ fontSize: "1.5rem", flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {s.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                        <div style={{ fontWeight: 700, color: n.read ? "var(--text-secondary)" : "#fff", fontSize: "0.92rem" }}>{n.title}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flexShrink: 0, marginLeft: 12 }}>{n.time}</div>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{n.message}</div>
                                </div>
                                {!n.read && (
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0, marginTop: 6 }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ padding: "12px 16px", background: "rgba(59,130,246,0.05)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                💡 Future integration: Real-time notifications via WebSocket will be enabled in the next release.
            </div>
        </div>
    );
}
