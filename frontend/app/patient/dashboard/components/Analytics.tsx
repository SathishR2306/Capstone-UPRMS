"use client";

import { useMemo } from "react";
import {
    ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar,
    PieChart, Pie, Cell, Tooltip as PieTip, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

interface MedicalRecord {
    id: number;
    visitDate: string;
    diagnosis: string;
    prescription: string;
    hospital: { id: number; hospitalName: string };
}
interface Props { records: MedicalRecord[] }

const TEAL = "#1ABC9C";
const NAVY = "#1E2A5F";
const AMBER = "#F39C12";
const DANGER = "#E74C3C";
const VIOLET = "#8b5cf6";
const PIE_COLORS = [TEAL, NAVY, AMBER, DANGER, VIOLET, "#3b82f6"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#fff", border: "1px solid #E8EDF5", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "0.82rem" }}>
            <div style={{ fontWeight: 700, color: "#2C3E50", marginBottom: 4 }}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color ?? TEAL, fontWeight: 600 }}>{p.value} {p.name}</div>
            ))}
        </div>
    );
};

export default function Analytics({ records }: Props) {
    const { diagFreq, topHospitals, visitTrend } = useMemo(() => {
        const visitsByYear: Record<string, number> = {};
        const diagFreq: Record<string, number> = {};
        const hosp: Record<string, number> = {};

        records.forEach(r => {
            const y = new Date(r.visitDate).getFullYear().toString();
            visitsByYear[y] = (visitsByYear[y] || 0) + 1;
            const diag = r.diagnosis.toLowerCase().split(/[,./]/)[0].trim();
            diagFreq[diag] = (diagFreq[diag] || 0) + 1;
            const hName = r.hospital?.hospitalName ?? "Unknown";
            hosp[hName] = (hosp[hName] || 0) + 1;
        });

        const years = Object.keys(visitsByYear).sort();
        const visitTrend = years.map(y => ({ year: y, visits: visitsByYear[y] }));
        const topDiag = Object.entries(diagFreq).sort(([, a], [, b]) => b - a).slice(0, 6);
        const topHospitals = Object.entries(hosp).sort(([, a], [, b]) => b - a).slice(0, 5);
        return { diagFreq: topDiag, topHospitals, visitTrend };
    }, [records]);

    const diagData = diagFreq.map(([name, count]) => ({ name, count }));
    const hospPieData = topHospitals.map(([name, value]) => ({ name, value }));
    const maxDiag = Math.max(1, ...diagData.map(d => d.count));

    if (records.length === 0) return (
        <div className="sh-card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(26,188,156,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="28" height="28" fill="none" stroke={TEAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
            </div>
            <div style={{ fontWeight: 700, color: "#2C3E50", fontSize: "1rem", marginBottom: 8 }}>No Analytics Data Yet</div>
            <div style={{ color: "#8A9BAC", fontSize: "0.88rem" }}>Analytics will populate once medical records are uploaded.</div>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Area Chart — Visits Over Time */}
            <div className="sh-card">
                <div className="sh-card-header">
                    <div>
                        <div className="sh-card-title">Hospital Visits Over Time</div>
                        <div style={{ fontSize: "0.78rem", color: "#8A9BAC", marginTop: 2 }}>Annual visit trend across your records</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600, color: TEAL }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, display: "inline-block" }} />
                        Visits
                    </div>
                </div>
                <div className="sh-card-body">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={visitTrend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false} />
                            <XAxis dataKey="year" tick={{ fill: "#8A9BAC", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#8A9BAC", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="visits" name="visits" stroke={TEAL} strokeWidth={2.5} fill="url(#tealGrad)" dot={{ fill: TEAL, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bar + Donut row */}
            <div className="charts-grid">
                {/* Bar Chart */}
                <div className="sh-card">
                    <div className="sh-card-header">
                        <div>
                            <div className="sh-card-title">Top Diagnoses</div>
                            <div style={{ fontSize: "0.78rem", color: "#8A9BAC", marginTop: 2 }}>Most frequent conditions</div>
                        </div>
                    </div>
                    <div className="sh-card-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={diagData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#8A9BAC", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                                <YAxis tick={{ fill: "#8A9BAC", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="cases" radius={[6, 6, 0, 0]}>
                                    {diagData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? NAVY : TEAL} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="sh-card">
                    <div className="sh-card-header">
                        <div>
                            <div className="sh-card-title">Records by Hospital</div>
                            <div style={{ fontSize: "0.78rem", color: "#8A9BAC", marginTop: 2 }}>Distribution across providers</div>
                        </div>
                    </div>
                    <div className="sh-card-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={hospPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                                    {hospPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <PieTip formatter={(v: any, n: any) => [`${v} records`, n]} contentStyle={{ borderRadius: 10, fontSize: "0.82rem", border: "1px solid #E8EDF5" }} />
                                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: "0.78rem", color: "#5A6A7A" }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Progress Bars + Table */}
            <div className="charts-grid-3">
                {/* Progress bars */}
                <div className="sh-card">
                    <div className="sh-card-header">
                        <div className="sh-card-title">Diagnosis Frequency</div>
                    </div>
                    <div className="sh-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {diagData.map(({ name, count }, i) => {
                            const pct = Math.round((count / maxDiag) * 100);
                            const color = PIE_COLORS[i % PIE_COLORS.length];
                            return (
                                <div key={name}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2C3E50", textTransform: "capitalize" }}>{name}</span>
                                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color }}>
                                            {count}× <span style={{ color: "#8A9BAC", fontWeight: 500 }}>({pct}%)</span>
                                        </span>
                                    </div>
                                    <div style={{ height: 8, background: "#F0F4F8", borderRadius: 4, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Data Table */}
                <div className="sh-card" style={{ overflow: "hidden" }}>
                    <div className="sh-card-header">
                        <div className="sh-card-title">Recent Records</div>
                        <span className="badge badge-teal">{records.length} total</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="sh-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Diagnosis</th>
                                    <th>Hospital</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...records].reverse().slice(0, 6).map(r => (
                                    <tr key={r.id}>
                                        <td style={{ whiteSpace: "nowrap", color: "#5A6A7A", fontSize: "0.82rem" }}>
                                            {new Date(r.visitDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td>
                                            <span className="badge badge-navy" style={{ textTransform: "capitalize", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                                                {r.diagnosis.split(/[,./]/)[0].trim()}
                                            </span>
                                        </td>
                                        <td style={{ color: "#5A6A7A", fontSize: "0.82rem", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {r.hospital?.hospitalName ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
