import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area, AreaChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Topbar } from "@/components/healthcare/Topbar";
import { FiltersBar } from "@/components/healthcare/FiltersBar";
import { GlassCard } from "@/components/healthcare/GlassCard";
import { KpiCard } from "@/components/healthcare/KpiCard";
import { useFilters } from "@/lib/filters";
import { axisStyle, tooltipStyle } from "@/components/healthcare/chart-helpers";
import { AlertCircle, BedDouble, HeartPulse, Stethoscope } from "lucide-react";
import { fmtPct, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/operations")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — MediPulse" },
      { name: "description", content: "Bed occupancy, ICU utilization, ED traffic, and hospital capacity metrics." },
    ],
  }),
  component: Operations,
});

const BED_CAPACITY = 500;
const ICU_CAPACITY = 60;

function Gauge({ value, label, danger = 85 }: { value: number; label: string; danger?: number }) {
  const v = Math.min(100, Math.max(0, value));
  const color = v >= danger ? "var(--danger)" : v >= 70 ? "var(--warning)" : "var(--success)";
  const data = [{ name: "v", value: v }, { name: "rest", value: 100 - v }];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" startAngle={210} endAngle={-30} innerRadius={70} outerRadius={95} stroke="none">
            <Cell fill={color} />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">{v.toFixed(0)}%</span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function Operations() {
  const { data } = useFilters();

  const stats = useMemo(() => {
    const icu = data.filter((p) => p.Department === "ICU").length;
    const ed = data.filter((p) => p.Department === "Emergency").length;
    const days = Math.max(1, (new Date(data[data.length - 1]?.Admission_Date ?? Date.now()).getTime() - new Date(data[0]?.Admission_Date ?? Date.now()).getTime()) / 86400000);
    const occRate = Math.min(100, (data.reduce((s, p) => s + p.Length_Of_Stay, 0) / (BED_CAPACITY * days)) * 100);
    const icuRate = Math.min(100, (data.filter((p) => p.Department === "ICU").reduce((s, p) => s + p.Length_Of_Stay, 0) / (ICU_CAPACITY * days)) * 100);
    return { icu, ed, occRate, icuRate, edPerDay: ed / days };
  }, [data]);

  const trend = useMemo(() => {
    const m = new Map<string, { date: string; admissions: number; discharges: number }>();
    for (const p of data) {
      const a = p.Admission_Date.slice(0, 7);
      const d = p.Discharge_Date.slice(0, 7);
      const ea = m.get(a) ?? { date: a, admissions: 0, discharges: 0 };
      ea.admissions += 1;
      m.set(a, ea);
      const ed = m.get(d) ?? { date: d, admissions: 0, discharges: 0 };
      ed.discharges += 1;
      m.set(d, ed);
    }
    return [...m.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const edTraffic = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data.filter((x) => x.Department === "Emergency")) {
      const k = p.Admission_Date.slice(0, 7);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([month, visits]) => ({ month, visits })).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  return (
    <>
      <Topbar title="Operations" subtitle="Capacity, throughput, and resource planning" />
      <div className="p-4 sm:p-6">
        <FiltersBar />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Bed Occupancy" value={fmtPct(stats.occRate)} icon={BedDouble} tone={stats.occRate > 85 ? "danger" : "success"} delta={2.3} />
          <KpiCard label="ICU Utilization" value={fmtPct(stats.icuRate)} icon={HeartPulse} tone={stats.icuRate > 80 ? "warning" : "info"} delta={-1.1} />
          <KpiCard label="ED Patients" value={fmtNum(stats.ed)} icon={AlertCircle} tone="warning" delta={4.6} hint={`${stats.edPerDay.toFixed(1)} / day`} />
          <KpiCard label="ICU Patients" value={fmtNum(stats.icu)} icon={Stethoscope} tone="primary" delta={0.9} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GlassCard title="Bed Occupancy Rate"><Gauge value={stats.occRate} label="Capacity used" danger={90} /></GlassCard>
          <GlassCard title="ICU Utilization"><Gauge value={stats.icuRate} label="ICU capacity" danger={85} /></GlassCard>
          <GlassCard title="Hospital Capacity">
            <div className="space-y-3 py-3">
              <CapBar label="General Beds" value={stats.occRate} />
              <CapBar label="ICU Beds" value={stats.icuRate} />
              <CapBar label="Emergency" value={Math.min(100, stats.edPerDay * 4)} />
              <CapBar label="Surgery" value={68} />
              <CapBar label="Radiology" value={54} />
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2" title="Admissions vs Discharges" subtitle="Monthly throughput">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="admissions" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="discharges" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Emergency Department Traffic">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={edTraffic}>
                <defs>
                  <linearGradient id="edFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="visits" stroke="var(--chart-4)" strokeWidth={2.5} fill="url(#edFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

function CapBar({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, value));
  const color = v >= 85 ? "bg-danger" : v >= 70 ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{v.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}