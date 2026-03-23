"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { LuUserPlus, LuFileUp } from "react-icons/lu";

type ApprovedPatient = {
    patientId: number;
    fullName: string;
    maskedAadhaar: string;
};

export default function UploadRecordForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [patients, setPatients] = useState<ApprovedPatient[]>([]);
    const [loading, setLoading] = useState(true);

    const [patientId, setPatientId] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [prescription, setPrescription] = useState("");
    const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        async function loadPatients() {
            try {
                const res = await api.get("/access/hospital-requests");
                // Only allow uploads to patients who currently have APPROVED (Granted) access
                const approved = res.data.filter((r: any) => r.status === "APPROVED");
                setPatients(approved);
            } catch (err) {
                console.error("Failed to load accessible patients", err);
            } finally {
                setLoading(false);
            }
        }
        loadPatients();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!patientId || !diagnosis || !visitDate) {
            setMsg("Please fill all required fields.");
            return;
        }

        setSubmitting(true);
        setMsg("");

        const formData = new FormData();
        formData.append("patientId", patientId);
        formData.append("diagnosis", diagnosis);
        formData.append("prescription", prescription);
        formData.append("visitDate", visitDate);
        if (file) formData.append("report", file);

        try {
            // Must use axios config for multipart/form-data
            await api.post("/medical-records/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsg("Record uploaded successfully!");
            setTimeout(onUploadSuccess, 1500);
        } catch {
            setMsg("Failed to upload record. Please ensure patient access is still valid.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ padding: "32px", width: "100%", background: "#fff", borderRadius: 16, border: "1px solid #E8EDF5", boxShadow: "0 2px 12px rgba(15,27,63,0.06)" }}>
            {patients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ width: 64, height: 64, background: "rgba(26,188,156,0.08)", color: "#1ABC9C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <LuUserPlus size={32} />
                    </div>
                    <h3 style={{ fontSize: "1.1rem", color: "#1E293B", marginBottom: 8 }}>No Authorized Patients Found</h3>
                    <p style={{ color: "#5F7285", fontSize: "0.95rem" }}>You cannot upload records because no patient has granted you active access. Please search for a patient and request access first.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#3D5166", marginBottom: 6 }}>Select Patient *</label>
                        <select
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", cursor: "pointer", background: "#fff", color: "#1E293B", border: "1.5px solid #E8EDF5" }}
                            required
                        >
                            <option value="" disabled>-- Select a patient --</option>
                            {patients.map(p => (
                                <option key={p.patientId} value={p.patientId} style={{ color: "#1E293B" }}>
                                    {p.fullName} (Aadhaar: {p.maskedAadhaar})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#3D5166", marginBottom: 6 }}>Visit Date *</label>
                        <input
                            type="date"
                            value={visitDate}
                            onChange={e => setVisitDate(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", colorScheme: "light", color: "#1E293B", background: "#fff", border: "1.5px solid #E8EDF5" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#3D5166", marginBottom: 6 }}>Clinical Diagnosis *</label>
                        <input
                            type="text"
                            placeholder="e.g. Acute Bronchitis, Hypertension"
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", color: "#1E293B", background: "#fff", border: "1.5px solid #E8EDF5" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#3D5166", marginBottom: 6 }}>Prescription / Treatment Plan</label>
                        <textarea
                            placeholder="List prescribed medicines, dosage, and instructions..."
                            value={prescription}
                            onChange={e => setPrescription(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", minHeight: 100, resize: "vertical", color: "#1E293B", background: "#fff", border: "1.5px solid #E8EDF5" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "#3D5166", marginBottom: 6 }}>Attach File (Lab Report / Scan / PDF)</label>
                        <div style={{ border: "2px dashed #d0d9e8", borderRadius: 8, padding: "20px", textAlign: "center", background: "#f8fafc" }}>
                            <input
                                type="file"
                                accept=".pdf,.png,.jpeg,.jpg"
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                style={{ fontSize: "0.9rem", color: "#3D5166" }}
                            />
                            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 8 }}>Max file size: 5MB. PDF, JPG, PNG allowed.</p>
                        </div>
                    </div>

                    {msg && (
                        <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, background: msg.includes("Failed") || msg.includes("Please") ? "#fef2f2" : "#f0fdf4", color: msg.includes("Failed") || msg.includes("Please") ? "#ef4444" : "#16a34a", border: `1px solid ${msg.includes("Failed") || msg.includes("Please") ? "#fecaca" : "#bbf7d0"}` }}>
                            {msg}
                        </div>
                    )}

                    <div style={{ marginTop: 12, paddingTop: 20, borderTop: "1px solid #E8EDF5", display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: "12px 24px", fontSize: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
                            <LuFileUp size={18} />
                            {submitting ? "Uploading..." : "Submit Record"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
