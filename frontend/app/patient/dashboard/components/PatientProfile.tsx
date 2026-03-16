"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuUser, LuPhone, LuActivity, LuPen, LuSave, LuX } from "react-icons/lu";

export default function PatientProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [phone, setPhone] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [emergencyContactName, setEmergencyContactName] = useState("");
    const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
    const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get("/patient/profile");
            setProfile(res.data);
            setPhone(res.data.phone || "");
            setBloodGroup(res.data.bloodGroup || "");
            setEmergencyContactName(res.data.emergencyContactName || "");
            setEmergencyContactPhone(res.data.emergencyContactPhone || "");
            setEmergencyContactRelation(res.data.emergencyContactRelation || "");
            setError("");
        } catch (err: any) {
            console.error(err);
            setError("Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            await api.patch("/patient/profile", {
                phone,
                bloodGroup,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelation
            });
            setIsEditing(false);
            fetchProfile(); // Refresh
        } catch (err: any) {
            console.error(err);
            setError("Failed to update profile.");
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading profile...</div>;
    }

    if (error) {
        return <div style={{ padding: 20, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", borderRadius: 12 }}>{error}</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--bg-dark)" }}>My Profile</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Manage your personal details and emergency contacts.</p>
                </div>
                {!isEditing ? (
                    <button className="btn-outline" onClick={() => setIsEditing(true)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LuPen size={16} /> Edit Profile
                    </button>
                ) : (
                    <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn-outline" onClick={() => { setIsEditing(false); fetchProfile(); }} style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <LuSave size={16} /> Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Personal Information */}
                <div className="dark-panel" style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <LuUser size={20} />
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--bg-dark)" }}>Personal Information</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Full Name</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.fullName}</div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Date of Birth</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "—"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Gender</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.gender}</div>
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Aadhaar Number (Masked)</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.maskedAadhaar}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Phone Number</div>
                            {isEditing ? (
                                <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" />
                            ) : (
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.phone || "—"}</div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Blood Group</div>
                            {isEditing ? (
                                <select className="input-field" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                                    <option value="">Select Blood Group...</option>
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            ) : (
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.bloodGroup || "—"}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="dark-panel" style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <LuPhone size={20} />
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--bg-dark)" }}>Emergency Contact</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Contact Name</div>
                            {isEditing ? (
                                <input type="text" className="input-field" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} placeholder="Full Name" />
                            ) : (
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.emergencyContactName || "Not Provided"}</div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Contact Phone</div>
                            {isEditing ? (
                                <input type="tel" className="input-field" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} placeholder="Phone Number" />
                            ) : (
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.emergencyContactPhone || "Not Provided"}</div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Relationship</div>
                            {isEditing ? (
                                <select className="input-field" value={emergencyContactRelation} onChange={e => setEmergencyContactRelation(e.target.value)}>
                                    <option value="">Select Relationship...</option>
                                    {["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"].map(rel => <option key={rel} value={rel}>{rel}</option>)}
                                </select>
                            ) : (
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--bg-dark)" }}>{profile?.emergencyContactRelation || "Not Provided"}</div>
                            )}
                        </div>
                        
                        {!isEditing && !profile?.emergencyContactPhone && (
                            <div style={{ padding: 12, background: "rgba(245,158,11,0.1)", color: "#d97706", borderRadius: 8, fontSize: "0.85rem", marginTop: "auto" }}>
                                ⚠️ Please add an emergency contact in case of urgent medical situations.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
