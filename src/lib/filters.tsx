import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getPatients, ageGroup, type Patient } from "./healthcare-data";

export type Filters = {
  dateFrom: string;
  dateTo: string;
  department: string;
  doctor: string;
  diagnosis: string;
  gender: string;
  ageGroup: string;
  insurance: string;
  state: string;
  search: string;
};

const ALL = "All";

const defaults: Filters = {
  dateFrom: "2023-01-01",
  dateTo: "2024-12-31",
  department: ALL,
  doctor: ALL,
  diagnosis: ALL,
  gender: ALL,
  ageGroup: ALL,
  insurance: ALL,
  state: ALL,
  search: "",
};

type Ctx = {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  reset: () => void;
  data: Patient[];
  all: Patient[];
};

const FilterCtx = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setF] = useState<Filters>(defaults);
  const all = useMemo(() => getPatients(), []);

  const data = useMemo(() => {
    const from = filters.dateFrom;
    const to = filters.dateTo;
    const q = filters.search.trim().toLowerCase();
    return all.filter((p) => {
      if (p.Admission_Date < from || p.Admission_Date > to) return false;
      if (filters.department !== ALL && p.Department !== filters.department) return false;
      if (filters.doctor !== ALL && p.Doctor !== filters.doctor) return false;
      if (filters.diagnosis !== ALL && p.Diagnosis !== filters.diagnosis) return false;
      if (filters.gender !== ALL && p.Gender !== filters.gender) return false;
      if (filters.insurance !== ALL && p.Insurance_Type !== filters.insurance) return false;
      if (filters.state !== ALL && p.State !== filters.state) return false;
      if (filters.ageGroup !== ALL && ageGroup(p.Age) !== filters.ageGroup) return false;
      if (q) {
        const hay = `${p.Patient_Name} ${p.Patient_ID} ${p.Diagnosis} ${p.Doctor}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filters]);

  return (
    <FilterCtx.Provider
      value={{
        filters,
        setFilters: (f) => setF((prev) => ({ ...prev, ...f })),
        reset: () => setF(defaults),
        data,
        all,
      }}
    >
      {children}
    </FilterCtx.Provider>
  );
}

export function useFilters() {
  const v = useContext(FilterCtx);
  if (!v) throw new Error("FiltersProvider missing");
  return v;
}

export const ALL_OPTION = ALL;