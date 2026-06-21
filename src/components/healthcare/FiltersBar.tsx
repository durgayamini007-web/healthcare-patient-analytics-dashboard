import { useMemo } from "react";
import { useFilters, ALL_OPTION } from "@/lib/filters";
import { DEPARTMENTS, INSURANCE_TYPES, AGE_GROUPS } from "@/lib/healthcare-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

export function FiltersBar() {
  const { filters, setFilters, reset, all } = useFilters();

  const { doctors, diagnoses, states } = useMemo(() => {
    const doc = new Set<string>();
    const diag = new Set<string>();
    const st = new Set<string>();
    for (const p of all) {
      if (filters.department === ALL_OPTION || p.Department === filters.department) doc.add(p.Doctor);
      diag.add(p.Diagnosis);
      st.add(p.State);
    }
    return {
      doctors: [...doc].sort(),
      diagnoses: [...diag].sort(),
      states: [...st].sort(),
    };
  }, [all, filters.department]);

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  const mkSelect = (
    value: string,
    onChange: (v: string) => void,
    options: string[],
    placeholder: string,
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={ALL_OPTION}>All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="glass-card no-print mb-6 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Global Filters
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <F label="From">
          <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} className="h-9" />
        </F>
        <F label="To">
          <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} className="h-9" />
        </F>
        <F label="Department">
          {mkSelect(filters.department, (v) => setFilters({ department: v, doctor: ALL_OPTION }), DEPARTMENTS, "All")}
        </F>
        <F label="Doctor">{mkSelect(filters.doctor, (v) => setFilters({ doctor: v }), doctors, "All")}</F>
        <F label="Diagnosis">{mkSelect(filters.diagnosis, (v) => setFilters({ diagnosis: v }), diagnoses, "All")}</F>
        <F label="Gender">{mkSelect(filters.gender, (v) => setFilters({ gender: v }), ["Male", "Female"], "All")}</F>
        <F label="Age Group">
          {mkSelect(filters.ageGroup, (v) => setFilters({ ageGroup: v }), AGE_GROUPS.map((a) => a.label), "All")}
        </F>
        <F label="Insurance">{mkSelect(filters.insurance, (v) => setFilters({ insurance: v }), INSURANCE_TYPES, "All")}</F>
        <F label="State">{mkSelect(filters.state, (v) => setFilters({ state: v }), states, "All")}</F>
      </div>
    </div>
  );
}