"use client";

import { useState, useEffect } from "react";
import api from "../../../../utils/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

function getAvailabilityStatus(start?: string, end?: string): "available" | "unavailable" | "unset" {
    if (!start || !end) return "unset";
    const now = new Date();
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    return nowMins >= startMins && nowMins <= endMins ? "available" : "unavailable";
}

// Get next 14 days for leave picker
function getNext14Days(): { date: string; label: string; dayName: string }[] {
    const days = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        days.push({
            date: iso,
            label: d.getDate().toString(),
            dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        });
    }
    return days;
}

export default function DoctorSchedule() {
    const [schedule, setSchedule] = useState<{ workingHoursStart: string; workingHoursEnd: string; leaveDays: string[] }>({ workingHoursStart: "", workingHoursEnd: "", leaveDays: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error">("success");

    useEffect(() => {
        api.get("/doctors/schedule").then(r => setSchedule(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const toggleLeaveDay = (date: string) => {
        setSchedule(s => ({
            ...s,
            leaveDays: s.leaveDays.includes(date) ? s.leaveDays.filter(d => d !== date) : [...s.leaveDays, date],
        }));
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.patch("/doctors/schedule", schedule);
            setMsg("Schedule saved successfully!"); setMsgType("success");
        } catch { setMsg("Failed to save schedule."); setMsgType("error"); }
        finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
    };

    const status = getAvailabilityStatus(schedule.workingHoursStart, schedule.workingHoursEnd);
    const statusConfig = {
        available: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Available Now", dot: "●" },
        unavailable: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Outside Work Hours", dot: "●" },
        unset: { color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: "Hours Not Set", dot: "○" },
    }[status];

    const days14 = getNext14Days();

    if (loading) return <div style={{ color: "#64748b", padding: 20 }}>Loading schedule…</div>;

    return (
        <div>
            <div style={{ marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                <h2 style={{ fontSize: "1.55rem", fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ padding: 9, background: "rgba(16,185,129,0.1)", borderRadius: 10, color: "#10b981" }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    Schedule & Availability
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "8px 0 0 54px" }}>Set your working hours, mark leave days, and see your real-time availability.</p>
            </div>

            {/* Availability indicator */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 20, background: statusConfig.bg, border: `1px solid ${statusConfig.color}30`, marginBottom: 28 }}>
                <span style={{ color: statusConfig.color, fontSize: "1.1rem" }}>{statusConfig.dot}</span>
                <span style={{ color: statusConfig.color, fontWeight: 600, fontSize: "0.9rem" }}>{statusConfig.label}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
                {/* Working Hours */}
                <div className="glass" style={{ padding: "24px", borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Working Hours</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: 6 }}>Start</label>
                            <input type="time" value={schedule.workingHoursStart || ""} onChange={e => setSchedule(s => ({ ...s, workingHoursStart: e.target.value }))}
                                style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem", outline: "none" }} />
                        </div>
                        <span style={{ color: "#64748b", marginTop: 22 }}>→</span>
                        <div>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: 6 }}>End</label>
                            <input type="time" value={schedule.workingHoursEnd || ""} onChange={e => setSchedule(s => ({ ...s, workingHoursEnd: e.target.value }))}
                                style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem", outline: "none" }} />
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="glass" style={{ padding: "24px", borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Leave Days Selected</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: schedule.leaveDays.length > 0 ? "#f59e0b" : "#10b981" }}>{schedule.leaveDays.length}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
                        {schedule.leaveDays.length === 0 ? "No leave days in the next 14 days" : `${schedule.leaveDays.slice(0, 3).join(", ")}${schedule.leaveDays.length > 3 ? "…" : ""}`}
                    </div>
                </div>
            </div>

            {/* 14-day leave picker */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Mark Leave Days (Next 14 Days)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {days14.map(d => {
                        const isLeave = schedule.leaveDays.includes(d.date);
                        const isToday = d.date === new Date().toISOString().slice(0, 10);
                        return (
                            <button key={d.date} onClick={() => toggleLeaveDay(d.date)}
                                style={{ width: 52, padding: "8px 4px", borderRadius: 10, border: `1px solid ${isLeave ? "rgba(245,158,11,0.5)" : isToday ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.09)"}`, background: isLeave ? "rgba(245,158,11,0.15)" : isToday ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                                <div style={{ fontSize: "0.65rem", color: isLeave ? "#f59e0b" : "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{d.dayName}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: isLeave ? "#fde68a" : isToday ? "#60a5fa" : "#e2e8f0", marginTop: 2 }}>{d.label}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {msg && (
                <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 8, background: msgType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msgType === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, color: msgType === "success" ? "#6ee7b7" : "#fca5a5", fontSize: "0.88rem" }}>{msg}</div>
            )}

            <button onClick={save} disabled={saving}
                style={{ padding: "11px 32px", borderRadius: 10, border: "none", background: saving ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg,#10b981,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: "0.92rem", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : "Save Schedule"}
            </button>
        </div>
    );
}
