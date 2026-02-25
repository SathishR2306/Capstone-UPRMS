"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DoctorDashboard() {
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (role !== "DOCTOR") router.push("/login");
    }, [router]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--bg-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
            }}
        >
            <div style={{ fontSize: "3rem" }}>👨‍⚕️</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>
                Doctor <span className="gradient-text">Dashboard</span>
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
                Coming soon — full dashboard in next phase.
            </p>
            <button
                className="btn-outline"
                style={{ marginTop: 12 }}
                onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                }}
            >
                <span>Logout</span>
            </button>
        </div>
    );
}
