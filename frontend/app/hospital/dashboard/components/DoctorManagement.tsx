"use client";

import { useState } from "react";
import DoctorList from "./DoctorList";
import DoctorDetailPanel from "./DoctorDetailPanel";

interface Doctor {
    id: number;
    fullName: string;
    specialization: string;
    department: string;
    role: string;
    status: string;
    licenseNumber: string;
    licenseStatus: string;
    daysRemaining: number | null;
    workingHoursStart: string;
    workingHoursEnd: string;
}

export default function DoctorManagement() {
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(k => k + 1);

    return (
        <div>
            <DoctorList
                selectedDoctorId={selectedDoctor?.id}
                onSelectDoctor={d => setSelectedDoctor(prev => prev?.id === d.id ? null : d)}
                refreshKey={refreshKey}
            />

            {selectedDoctor && (
                <DoctorDetailPanel
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                />
            )}
        </div>
    );
}
