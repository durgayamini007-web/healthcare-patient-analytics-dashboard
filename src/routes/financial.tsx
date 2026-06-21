import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Topbar } from "@/components/healthcare/Topbar";
import { FiltersBar } from "@/components/healthcare/FiltersBar";
import { GlassCard } from "@/components/healthcare/GlassCard";
import { useFilters } from "@/lib/filters";
import { axisStyle, chartColors, tooltipStyle } from "@/components/healthcare/chart-helpers";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/financial")({
  head: () => ({
    meta: [
      { title: "Financial Analytics — MediPulse" },
      { name: "description", content: "Revenue by department, insurance mix, monthly trends, and 12-month forecast." },
    ],
  }),
  component: Financial,
});

function Financial() {
  const { data } = useFilters();

  const byDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.Department, (m.get(p.Department) ?? 0) + p.Treatment_Cost);
    return [...m.entries()].map(([dept, revenue]) => ({ dept, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const byIns = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.Insurance_Type, (m.get(p.Insurance_Type) ?? 0) + p.Treatment_Cost);
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [data]);

  const monthly = useMemo(() => {
    const m = new Map<string, { month: string; revenue: number; cost: number }>();
    for (const p of data) {
      const k = p.Admission_Date.slice(0, 7);
      const e = m.get(k) ?? { month: k, revenue: 0, cost: 0 };
      e.revenue += p.Treatment_Cost;
      e.cost += p.Treatment_Cost * 0.72;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const forecast = useMemo(() => {
    if (monthly.length < 3) return [];
    const last = monthly.slice(-6);
    const avg = last.reduce((s, m) => s + m.revenue, 0) / last.length;
    const growth = last.length > 1 ? (last[last.length - 1].revenue - last[0].revenue) / Math.max(1, last.length - 1) : 0;
    const base = new Date(monthly[monthly.length - 1].month + "-01");
    const out: { month: string; forecast: number }[] = [];
    for (let i = 1; i <= 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      out.push({ month: d.toISOString().slice(0, 7), forecast: Math.max(0, avg + growth * i) });
    }
    return out;
  }, [monthly]);

  const costByDept = useMemo(() => {
    return byDept.map((d) => ({ dept: d.dept, revenue: d.revenue, cost: d.revenue * 0.72 }));
  }, [byDept]);

  return (
    <>
      <Topbar title="Financial Analytics" subtitle="Revenue, cost, and forecast" />
      <div className="p-4 sm:p-6">
        <FiltersBar />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard title="Revenue by Department">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dept" tick={axisStyle} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="revenue" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Insurance Revenue Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Legend />
                <Pie data={byIns} dataKey="value" nameKey="name" innerRadius={50} outerRadius={100} paddingAngle={2}>
                  {byIns.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="lg:col-span-2" title="Monthly Financial Trends" subtitle="Revenue vs operating cost (est. 72%)">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="cst2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev2)" />
                <Area type="monotone" dataKey="cost" stroke="var(--chart-4)" strokeWidth={2} fill="url(#cst2)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="12-Month Revenue Forecast" subtitle="Linear projection from last 6 months">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Line type="monotone" dataKey="forecast" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Cost vs Revenue by Department">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dept" tick={axisStyle} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={axisStyle} tickFormatter={(v) => fmtMoney(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtMoney(v)} />
                <Legend />
                <Bar dataKey="revenue" fill={chartColors[1]} radius={[6, 6, 0, 0]} />
                <Bar dataKey="cost" fill={chartColors[3]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </>
  );
}