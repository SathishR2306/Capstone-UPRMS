"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

interface Profile {
    id: number;
    fullName: string;
    specialization: string;
    licenseNumber: string;
    phone: string;
    maskedAadhaar: string;
    hospitalName: string;
}

export default function DoctorProfileCard({ onProfileUpdate }: { onProfileUpdate?: () => void }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [editing, setEditing] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [form, setForm] = useState({ fullName: "", specialization: "", licenseNumber: "", phone: "" });
    const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/doctors/profile").then((r) => {
            setProfile(r.data);
            setForm({
                fullName: r.data.fullName || "",
                specialization: r.data.specialization || "",
                licenseNumber: r.data.licenseNumber || "",
                phone: r.data.phone || "",
            });
        }).catch(() => setErr("Failed to load profile")).finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        try {
            await api.patch("/doctors/profile", form);
            setMsg("Profile updated successfully!");
            setEditing(false);
            const r = await api.get("/doctors/profile");
            setProfile(r.data);
            onProfileUpdate?.();
        } catch { setErr("Failed to update profile."); }
    };

    const savePwd = async () => {
        if (pwdForm.newPassword !== pwdForm.confirm) { setErr("Passwords do not match."); return; }
        try {
            await api.patch("/doctors/change-password", { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
            setMsg("Password changed successfully!");
            setChangingPwd(false);
            setPwdForm({ currentPassword: "", newPassword: "", confirm: "" });
        } catch (e: any) { setErr(e?.response?.data?.message || "Failed to change password."); }
    };

    const infoRow = (label: string, value: string) => (
        <div style={{ display: "flex", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 180, fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{label}</div>
            <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: "0.95rem" }}>{value || "—"}</div>
        </div>
    );

    if (loading) return <div style={{ color: "var(--text-secondary)", padding: 20 }}>Loading profile…</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {msg && <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#4ade80", fontSize: "0.9rem" }}>✓ {msg}</div>}
            {err && <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#fca5a5", fontSize: "0.9rem" }}>⚠ {err}</div>}

            {/* Profile card */}
            <div className="glass" style={{ padding: 28, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                        {profile?.fullName?.[0]?.toUpperCase() || "D"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>{profile?.fullName || "Doctor"}</div>
                        <div style={{ color: "#a78bfa", fontSize: "0.9rem", fontWeight: 600 }}>{profile?.specialization || "General Practitioner"}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: 4 }}>🏥 {profile?.hospitalName}</div>
                    </div>
                </div>

                {!editing ? (
                    <>
                        {infoRow("License #", profile?.licenseNumber || "")}
                        {infoRow("Phone", profile?.phone || "")}
                        {infoRow("Aadhaar", profile?.maskedAadhaar || "")}
                        {infoRow("Hospital", profile?.hospitalName || "")}
                        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={() => { setEditing(true); setMsg(""); setErr(""); }}>Edit Profile</button>
                            <button className="btn-outline" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={() => { setChangingPwd(!changingPwd); setMsg(""); setErr(""); }}>Change Password</button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {(["fullName", "specialization", "licenseNumber", "phone"] as const).map((field) => (
                            <div key={field}>
                                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "capitalize" }}>{field.replace(/([A-Z])/g, " $1")}</label>
                                <input className="input-field" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={saveProfile}>Save Changes</button>
                            <button className="btn-outline" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Change password */}
            {changingPwd && (
                <div className="glass" style={{ padding: 28, background: "rgba(255,255,255,0.03)" }}>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: 20 }}>🔐 Change Password</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                            { label: "Current Password", key: "currentPassword" as const },
                            { label: "New Password", key: "newPassword" as const },
                            { label: "Confirm New Password", key: "confirm" as const },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</label>
                                <input className="input-field" type="password" value={pwdForm[key]} onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })} placeholder="••••••••" />
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 12 }}>
                            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={savePwd}>Update Password</button>
                            <button className="btn-outline" style={{ padding: "10px 24px", fontSize: "0.875rem" }} onClick={() => setChangingPwd(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
