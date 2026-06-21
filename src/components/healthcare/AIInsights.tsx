import { useMemo } from "react";
import { useFilters } from "@/lib/filters";
import { Sparkles, TrendingUp, AlertTriangle, Award, HeartPulse, Lightbulb } from "lucide-react";
import { fmtMoney, fmtPct } from "@/lib/format";

export function AIInsights() {
  const { data, all } = useFilters();

  const insights = useMemo(() => {
    if (!data.length) return null;
    const byDept = new Map<string, { revenue: number; readmitted: number; total: number; sat: number }>();
    for (const p of data) {
      const d = byDept.get(p.Department) ?? { revenue: 0, readmitted: 0, total: 0, sat: 0 };
      d.revenue += p.Treatment_Cost;
      d.readmitted += p.Readmitted ? 1 : 0;
      d.total += 1;
      d.sat += p.Patient_Satisfaction;
      byDept.set(p.Department, d);
    }
    let best: [string, number] = ["", -Infinity];
    let worstReadmit: [string, number] = ["", -1];
    for (const [k, v] of byDept) {
      const score = (v.sat / v.total) * 20 - (v.readmitted / v.total) * 100 + v.revenue / 1_000_000;
      if (score > best[1]) best = [k, score];
      const rRate = (v.readmitted / v.total) * 100;
      if (rRate > worstReadmit[1]) worstReadmit = [k, rRate];
    }

    const half = Math.floor(all.length / 2);
    const prevRev = all.slice(0, half).reduce((s, p) => s + p.Treatment_Cost, 0);
    const curRev = data.reduce((s, p) => s + p.Treatment_Cost, 0);
    const growth = prevRev ? ((curRev - prevRev) / prevRev) * 100 : 0;

    const avgSat = data.reduce((s, p) => s + p.Patient_Satisfaction, 0) / data.length;
    const satTrend = avgSat >= 4.3 ? "Excellent and rising" : avgSat >= 4 ? "Stable, positive" : "Needs attention";

    const recs: string[] = [];
    if (worstReadmit[1] > 18) recs.push(`Investigate ${worstReadmit[0]} readmissions (${worstReadmit[1].toFixed(1)}%) — review discharge protocols.`);
    const icu = byDept.get("ICU");
    if (icu && icu.total / data.length > 0.12) recs.push("ICU utilization is elevated — consider expanding step-down capacity.");
    if (avgSat < 4.2) recs.push("Roll out service-recovery program; bedside rounding cadence may be insufficient.");
    if (growth > 8) recs.push(`Revenue growth strong at ${growth.toFixed(1)}% — prioritize staffing in top departments.`);
    if (!recs.length) recs.push("All key metrics within healthy ranges. Maintain current operational cadence.");

    return { best: best[0], worstReadmit, growth, avgSat, satTrend, recs, curRev };
  }, [data, all]);

  if (!insights) return null;

  const items = [
    { icon: Award, label: "Best Performing Dept", value: insights.best, tone: "text-success" },
    { icon: AlertTriangle, label: "Highest Readmissions", value: `${insights.worstReadmit[0]} • ${fmtPct(insights.worstReadmit[1])}`, tone: "text-warning" },
    { icon: TrendingUp, label: "Revenue Growth", value: fmtPct(insights.growth), tone: insights.growth >= 0 ? "text-success" : "text-danger" },
    { icon: HeartPulse, label: "Satisfaction Trend", value: `${insights.avgSat.toFixed(2)} / 5 — ${insights.satTrend}`, tone: "text-primary" },
  ];

  return (
    <div className="glass-card mb-6 rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Auto-generated from current filter selection ({fmtMoney(insights.curRev)} attributed)</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <i.icon className={`h-4 w-4 ${i.tone}`} /> {i.label}
            </div>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{i.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Lightbulb className="h-3.5 w-3.5" /> Operational Recommendations
        </div>
        <ul className="space-y-1.5 text-sm text-foreground">
          {insights.recs.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}