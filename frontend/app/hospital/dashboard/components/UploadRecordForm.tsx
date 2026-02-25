"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";

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
        <div className="glass-strong" style={{ padding: "32px", maxWidth: 700, background: "rgba(15, 23, 42, 0.4)" }}>
            {patients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>No Authorized Patients Found</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>You cannot upload records because no patient has granted you active access. Please search for a patient and request access first.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Select Patient *</label>
                        <select
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", cursor: "pointer", background: "rgba(255, 255, 255, 0.05)" }}
                            required
                        >
                            <option value="" disabled>-- Select a patient --</option>
                            {patients.map(p => (
                                <option key={p.patientId} value={p.patientId} style={{ color: "#0f172a" }}>
                                    {p.fullName} (Aadhaar: {p.maskedAadhaar})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Visit Date *</label>
                        <input
                            type="date"
                            value={visitDate}
                            onChange={e => setVisitDate(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", colorScheme: "dark" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Clinical Diagnosis *</label>
                        <input
                            type="text"
                            placeholder="e.g. Acute Bronchitis, Hypertension"
                            value={diagnosis}
                            onChange={e => setDiagnosis(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px" }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Prescription / Treatment Plan</label>
                        <textarea
                            placeholder="List prescribed medicines, dosage, and instructions..."
                            value={prescription}
                            onChange={e => setPrescription(e.target.value)}
                            className="input-field"
                            style={{ padding: "12px", minHeight: 100, resize: "vertical" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Attach File (Lab Report / Scan / PDF)</label>
                        <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
                            <input
                                type="file"
                                accept=".pdf,.png,.jpeg,.jpg"
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
                            />
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 8 }}>Max file size: 5MB. PDF, JPG, PNG allowed.</p>
                        </div>
                    </div>

                    {msg && (
                        <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, background: msg.includes("Failed") || msg.includes("Please") ? "rgba(239, 68, 68, 0.1)" : "rgba(74, 222, 128, 0.1)", color: msg.includes("Failed") || msg.includes("Please") ? "#fca5a5" : "#86efac", border: `1px solid ${msg.includes("Failed") || msg.includes("Please") ? "rgba(239, 68, 68, 0.2)" : "rgba(74, 222, 128, 0.2)"}` }}>
                            {msg}
                        </div>
                    )}

                    <div style={{ marginTop: 12, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: "12px 24px", fontSize: "1rem" }}>
                            {submitting ? "Uploading..." : "Submit Record"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
