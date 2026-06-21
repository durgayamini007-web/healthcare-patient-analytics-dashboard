import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Topbar } from "@/components/healthcare/Topbar";
import { FiltersBar } from "@/components/healthcare/FiltersBar";
import { GlassCard } from "@/components/healthcare/GlassCard";
import { useFilters } from "@/lib/filters";
import { axisStyle, chartColors, tooltipStyle } from "@/components/healthcare/chart-helpers";
import { fmtPct, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/clinical")({
  head: () => ({
    meta: [
      { title: "Clinical Performance — MediPulse" },
      { name: "description", content: "Clinical KPIs: top diagnoses, readmissions, LOS by department, doctor performance." },
    ],
  }),
  component: Clinical,
});

function Clinical() {
  const { data } = useFilters();

  const topDiag = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.Diagnosis, (m.get(p.Diagnosis) ?? 0) + 1);
    return [...m.entries()].map(([diagnosis, count]) => ({ diagnosis, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [data]);

  const deptMetrics = useMemo(() => {
    const m = new Map<string, { dept: string; total: number; readmit: number; los: number; sat: number }>();
    for (const p of data) {
      const e = m.get(p.Department) ?? { dept: p.Department, total: 0, readmit: 0, los: 0, sat: 0 };
      e.total += 1;
      e.readmit += p.Readmitted ? 1 : 0;
      e.los += p.Length_Of_Stay;
      e.sat += p.Patient_Satisfaction;
      m.set(p.Department, e);
    }
    return [...m.values()].map((e) => ({
      dept: e.dept,
      readmitRate: (e.readmit / e.total) * 100,
      avgLOS: e.los / e.total,
      avgSat: e.sat / e.total,
      total: e.total,
    }));
  }, [data]);

  const doctors = useMemo(() => {
    const m = new Map<string, { doctor: string; dept: string; patients: number; sat: number; readmit: number; los: number }>();
    for (const p of data) {
      const e = m.get(p.Doctor) ?? { doctor: p.Doctor, dept: p.Department, patients: 0, sat: 0, readmit: 0, los: 0 };
      e.patients += 1;
      e.sat += p.Patient_Satisfaction;
      e.readmit += p.Readmitted ? 1 : 0;
      e.los += p.Length_Of_Stay;
      m.set(p.Doctor, e);
    }
    return [...m.values()]
      .map((e) => ({
        ...e,
        avgSat: e.sat / e.patients,
        readmitRate: (e.readmit / e.patients) * 100,
        avgLOS: e.los / e.patients,
      }))
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 12);
  }, [data]);

  return (
    <>
      <Topbar title="Clinical Performance" subtitle="Quality and outcome analytics" />
      <div className="p-4 sm:p-6">
        <FiltersBar />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard title="Top 10 Diagnoses" subtitle="Most frequent admissions">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topDiag} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={axisStyle} />
                <YAxis dataKey="diagnosis" type="category" tick={axisStyle} width={150} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={chartColors[0]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Readmission Rate by Department" subtitle="% readmitted">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={deptMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dept" tick={axisStyle} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={axisStyle} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtPct(v)} />
                <Bar dataKey="readmitRate" fill={chartColors[3]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Average LOS by Department" subtitle="Days">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dept" tick={axisStyle} angle={-15} textAnchor="end" height={60} interval={0} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)} d`} />
                <Bar dataKey="avgLOS" fill={chartColors[1]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Department Quality Scorecard">
            <div className="space-y-2">
              {deptMetrics.sort((a, b) => b.avgSat - a.avgSat).map((d) => (
                <div key={d.dept} className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{d.dept}</span>
                    <span className="text-xs text-muted-foreground">{fmtNum(d.total)} pts</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Sat</span> <span className="font-semibold text-success">{d.avgSat.toFixed(2)}</span></div>
                    <div><span className="text-muted-foreground">Readmit</span> <span className="font-semibold text-danger">{fmtPct(d.readmitRate)}</span></div>
                    <div><span className="text-muted-foreground">LOS</span> <span className="font-semibold text-foreground">{d.avgLOS.toFixed(1)}d</span></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2" title="Doctor Performance" subtitle="Top doctors by case volume">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="px-3 py-2">Doctor</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2 text-right">Patients</th>
                    <th className="px-3 py-2 text-right">Avg Sat</th>
                    <th className="px-3 py-2 text-right">Readmit %</th>
                    <th className="px-3 py-2 text-right">Avg LOS</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.doctor} className="border-b border-border/40 hover:bg-accent/40">
                      <td className="px-3 py-2 font-medium text-foreground">{d.doctor}</td>
                      <td className="px-3 py-2 text-muted-foreground">{d.dept}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNum(d.patients)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-success">{d.avgSat.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-danger">{fmtPct(d.readmitRate)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.avgLOS.toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}