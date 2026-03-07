"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuUser, LuStethoscope, LuPlus, LuShieldCheck, LuTriangleAlert } from "react-icons/lu";

type Doctor = {
    id: number;
    fullName: string;
    specialization: string;
    department: string;
    status: string;
};

type ApprovedPatient = {
    patientId: number;
    fullName: string;
    maskedAadhaar: string;
    status: string;
};

export default function AssignPatient() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("");
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [isEmergency, setIsEmergency] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [doctorPatients, setDoctorPatients] = useState<any[]>([]);
    const [fetchingPatients, setFetchingPatients] = useState(false);

    // Active doctors only for the dropdown
    const activeDoctors = doctors.filter(d => d.status === "ACTIVE");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docsRes, permsRes] = await Promise.all([
                    api.get("/hospitals/doctors"),
                    api.get("/access/hospital-requests")
                ]);
                setDoctors(docsRes.data);
                setPatients(permsRes.data.filter((p: any) => p.status === "APPROVED"));
            } catch (err) {
                console.error("Failed to fetch assignment data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedDoctor) {
            setDoctorPatients([]);
            return;
        }

        const fetchDoctorPatients = async () => {
            setFetchingPatients(true);
            try {
                const res = await api.get(`/hospitals/doctors/${selectedDoctor}/patients`);
                setDoctorPatients(res.data);
            } catch (err) {
                console.error("Failed to fetch doctor patients", err);
            } finally {
                setFetchingPatients(false);
            }
        };
        fetchDoctorPatients();
    }, [selectedDoctor]);

    async function handleUnassign(patientId: number) {
        if (!confirm("Unassign this patient?")) return;
        try {
            await api.delete(`/hospitals/doctors/${selectedDoctor}/unassign-patient/${patientId}`);
            setDoctorPatients(prev => prev.filter(p => p.patientId !== patientId));
            setMessage({ type: "success", text: "Patient unassigned successfully." });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to unassign.";
            setMessage({ type: "error", text: msg });
        }
    }

    async function handleAssign(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedDoctor || !selectedPatient) return;

        setSubmitting(true);
        setMessage(null);

        try {
            await api.post(`/hospitals/doctors/${selectedDoctor}/assign-patient`, {
                patientId: Number(selectedPatient),
                isEmergency
            });
            setMessage({ type: "success", text: "Patient successfully assigned to doctor." });
            setSelectedPatient("");
            setIsEmergency(false);
            
            // Refresh list
            const res = await api.get(`/hospitals/doctors/${selectedDoctor}/patients`);
            setDoctorPatients(res.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to assign patient. Please try again.";
            setMessage({ type: "error", text: msg });
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading doctors and patients...</div>;

    return (
        <div className="glass-strong" style={{ padding: "32px", background: "rgba(15, 23, 42, 0.4)" }}>
            <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Assign Patient to Doctor</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Link authorized patients to medical staff. <strong>Note: A patient can be assigned to only one doctor at a time.</strong></p>
            </div>

            <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
                {/* Select Doctor */}
                <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Doctor</label>
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }}>
                            <LuStethoscope size={18} />
                        </div>
                        <select
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: 48, background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
                            required
                        >
                            <option value="" style={{ background: "#1e293b" }}>-- Choose an Active Doctor --</option>
                            {activeDoctors.map(d => (
                                <option key={d.id} value={d.id} style={{ background: "#1e293b" }}>
                                    {d.fullName} ({d.specialization} - {d.department})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Select Patient */}
                <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Patient</label>
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }}>
                            <LuUser size={18} />
                        </div>
                        <select
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: 48, background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
                            required
                        >
                            <option value="" style={{ background: "#1e293b" }}>-- Choose an Authorized Patient --</option>
                            {patients.map(p => (
                                <option key={p.patientId} value={p.patientId} style={{ background: "#1e293b" }}>
                                    {p.fullName} (Aadhaar: {p.maskedAadhaar})
                                </option>
                            ))}
                        </select>
                    </div>
                    {patients.length === 0 && (
                        <p style={{ fontSize: "0.8rem", color: "#fca5a5", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <LuTriangleAlert size={14} /> No patients have approved your hospital's access request yet.
                        </p>
                    )}
                </div>

                {/* Emergency Flag */}
                <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", width: "fit-content" }}>
                    <div style={{ position: "relative", width: 22, height: 22 }}>
                        <input
                            type="checkbox"
                            checked={isEmergency}
                            onChange={(e) => setIsEmergency(e.target.checked)}
                            style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer", zIndex: 2 }}
                        />
                        <div style={{ 
                            width: "100%", 
                            height: "100%", 
                            borderRadius: 6, 
                            border: "2px solid", 
                            borderColor: isEmergency ? "#ef4444" : "rgba(255,255,255,0.2)",
                            background: isEmergency ? "#ef4444" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            transition: "all 0.2s"
                        }}>
                            {isEmergency && <LuPlus size={14} strokeWidth={4} />}
                        </div>
                    </div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: isEmergency ? "#f87171" : "var(--text-secondary)" }}>Mark as Emergency Case</span>
                </label>

                {message && (
                    <div style={{ 
                        padding: "16px", 
                        borderRadius: 12, 
                        background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        border: "1px solid",
                        borderColor: message.type === "success" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: message.type === "success" ? "#86efac" : "#fca5a5",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}>
                        {message.type === "success" ? <LuShieldCheck size={20} /> : <LuTriangleAlert size={20} />}
                        {message.text}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={submitting || !selectedDoctor || !selectedPatient} 
                    className="btn-primary" 
                    style={{ padding: "14px", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                >
                    {submitting ? "Assigning..." : (
                        <>
                            <LuShieldCheck size={20} />
                            Assign Patient to Doctor
                        </>
                    )}
                </button>
            </form>

            {/* Current Assignments for Selected Doctor */}
            {selectedDoctor && (
                <div style={{ marginTop: 40, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 32 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 20 }}>Current Assignments for {doctors.find(d => d.id === Number(selectedDoctor))?.fullName}</h3>
                    
                    {fetchingPatients ? (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading assignments...</div>
                    ) : doctorPatients.length === 0 ? (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
                            No patients currently assigned to this doctor.
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                            {doctorPatients.map(p => (
                                <div key={p.assignmentId} style={{ 
                                    padding: "16px", 
                                    background: "rgba(255,255,255,0.03)", 
                                    borderRadius: 12, 
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.95rem" }}>{p.fullName}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>ID: {p.patientId}</div>
                                        {p.isEmergency && (
                                            <div style={{ marginTop: 8, fontSize: "0.7rem", fontWeight: 800, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: 4, width: "fit-content", textTransform: "uppercase" }}>Emergency</div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleUnassign(p.patientId)}
                                        style={{ background: "none", border: "none", color: "#fca5a5", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "all 0.2s" }}
                                        onMouseOver={e => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)")}
                                        onMouseOut={e => (e.currentTarget.style.background = "none")}
                                    >
                                        Unassign
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
