import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Topbar } from "@/components/healthcare/Topbar";
import { FiltersBar } from "@/components/healthcare/FiltersBar";
import { GlassCard } from "@/components/healthcare/GlassCard";
import { AGE_GROUPS, ageGroup } from "@/lib/healthcare-data";
import { useFilters } from "@/lib/filters";
import { axisStyle, chartColors, tooltipStyle } from "@/components/healthcare/chart-helpers";

export const Route = createFileRoute("/demographics")({
  head: () => ({
    meta: [
      { title: "Patient Demographics — MediPulse" },
      { name: "description", content: "Patient demographics: age, gender, insurance, and geography distributions." },
    ],
  }),
  component: Demographics,
});

function Demographics() {
  const { data } = useFilters();

  const ageHist = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${i * 10 + 9}`, count: 0 }));
    for (const p of data) buckets[Math.min(9, Math.floor(p.Age / 10))].count += 1;
    return buckets;
  }, [data]);

  const gender = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.Gender, (m.get(p.Gender) ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [data]);

  const insurance = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.Insurance_Type, (m.get(p.Insurance_Type) ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [data]);

  const byState = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) m.set(p.State, (m.get(p.State) ?? 0) + 1);
    return [...m.entries()].map(([state, patients]) => ({ state, patients })).sort((a, b) => b.patients - a.patients).slice(0, 12);
  }, [data]);

  const ageGroups = useMemo(() => {
    const m = new Map<string, number>(AGE_GROUPS.map((g) => [g.label, 0]));
    for (const p of data) m.set(ageGroup(p.Age), (m.get(ageGroup(p.Age)) ?? 0) + 1);
    return [...m.entries()].map(([group, patients]) => ({ group, patients }));
  }, [data]);

  return (
    <>
      <Topbar title="Patient Demographics" subtitle="Population composition and distribution" />
      <div className="p-4 sm:p-6">
        <FiltersBar />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GlassCard title="Age Distribution" subtitle="Patients per 10-year age band">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageHist}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Gender Distribution" subtitle="Share of patients">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Pie data={gender} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {gender.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Insurance Type Breakdown" subtitle="Coverage mix">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Pie data={insurance} dataKey="value" nameKey="name" outerRadius={100}>
                  {insurance.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Patient Volume by Age Group">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageGroups}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="group" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="patients" fill={chartColors[2]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="lg:col-span-2" title="Geographic Distribution" subtitle="Top states by patient volume">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byState} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={axisStyle} />
                <YAxis dataKey="state" type="category" tick={axisStyle} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="patients" fill={chartColors[4]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </>
  );
}