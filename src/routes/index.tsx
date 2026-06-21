import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, BedDouble, DollarSign, Repeat, Smile, Users } from "lucide-react";
import { Topbar } from "@/components/healthcare/Topbar";
import { FiltersBar } from "@/components/healthcare/FiltersBar";
import { AIInsights } from "@/components/healthcare/AIInsights";
import { KpiCard } from "@/components/healthcare/KpiCard";
import { GlassCard } from "@/components/healthcare/GlassCard";
import { useFilters } from "@/lib/filters";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";
import { axisStyle, chartColors, tooltipStyle } from "@/components/healthcare/chart-helpers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — MediPulse" },
      { name: "description", content: "Hospital executive KPIs: patients, admissions, revenue, readmissions, satisfaction." },
    ],
  }),
  component: Executive,
});

function Executive() {
  const { data } = useFilters();

  const stats = useMemo(() => {
    const total = data.length;
    const revenue = data.reduce((s, p) => s + p.Treatment_Cost, 0);
    const los = data.reduce((s, p) => s + p.Length_Of_Stay, 0) / Math.max(1, total);
    const readmit = data.filter((p) => p.Readmitted).length;
    const sat = data.reduce((s, p) => s + p.Patient_Satisfaction, 0) / Math.max(1, total);
    return {
      total, revenue, los,
      readmitRate: total ? (readmit / total) * 100 : 0,
      sat,
    };
  }, [data]);

  const monthly = useMemo(() => {
    const map = new Map<string, { month: string; admissions: number; revenue: number }>();
    for (const p of data) {
      const m = p.Admission_Date.slice(0, 7);
      const e = map.get(m) ?? { month: m, admissions: 0, revenue: 0 };
      e.admissions += 1;
      e.revenue += p.Treatment_Cost;
      map.set(m, e);
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const byDept = useMemo(() => {
    const map = new Map<string, { dept: string; patients: number; revenue: number }>();
    for (const p of data) {
      const e = map.get(p.Department) ?? { dept: p.Department, patients: 0, revenue: 0 };
      e.patients += 1;
      e.revenue += p.Treatment_Cost;
      map.set(p.Department, e);
    }
    return [...map.values()].sort((a, b) => b.patients - a.patients);
  }, [data]);

  return (
    <>
      <Topbar title="Executive Dashboard" subtitle="Real-time hospital performance overview" />
      <div className="p-4 sm:p-6">
        <FiltersBar />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total Patients" value={fmtNum(stats.total)} delta={8.4} icon={Users} tone="primary" />
          <KpiCard label="Total Admissions" value={fmtNum(stats.total)} delta={6.2} icon={Activity} tone="info" />
          <KpiCard label="Total Revenue" value={fmtMoney(stats.revenue)} delta={12.7} icon={DollarSign} tone="success" />
          <KpiCard label="Avg Length of Stay" value={`${stats.los.toFixed(1)} d`} delta={-2.1} icon={BedDouble} tone="warning" />
          <KpiCard label="Readmission Rate" value={fmtPct(stats.readmitRate)} delta={-1.4} icon={Repeat} tone="danger" />
          <KpiCard label="Patient Satisfaction" value={`${stats.sat.toFixed(2)} / 5`} delta={1.8} icon={Smile} tone="success" />
        </div>
        <AIInsights />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard title="Monthly Admissions Trend" subtitle="Admissions per month">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="admissions" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Monthly Revenue Trend" subtitle="Treatment revenue per month">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="lg:col-span-2" title="Department Performance" subtitle="Patient volume and revenue by department">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dept" tick={axisStyle} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis yAxisId="l" tick={axisStyle} />
                <YAxis yAxisId="r" orientation="right" tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => (n === "revenue" ? fmtMoney(v) : v)} />
                <Bar yAxisId="l" dataKey="patients" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
                <Bar yAxisId="r" dataKey="revenue" fill={chartColors[1]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
