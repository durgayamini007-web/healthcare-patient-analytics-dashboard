export type Patient = {
  Patient_ID: string;
  Patient_Name: string;
  Age: number;
  Gender: "Male" | "Female";
  Admission_Date: string;
  Discharge_Date: string;
  Department: string;
  Diagnosis: string;
  Doctor: string;
  Treatment_Cost: number;
  Insurance_Type: string;
  Readmitted: boolean;
  Length_Of_Stay: number;
  State: string;
  City: string;
  Patient_Satisfaction: number;
};

export const DEPARTMENTS = [
  "Emergency",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "ICU",
  "General Medicine",
  "Surgery",
  "Radiology",
];

export const INSURANCE_TYPES = [
  "Private Insurance",
  "Medicare",
  "Medicaid",
  "Employer Sponsored",
  "Self Pay",
];

const DIAGNOSES_BY_DEPT: Record<string, string[]> = {
  Emergency: ["Trauma", "Acute Pain", "Sepsis", "Fracture", "Allergic Reaction"],
  Cardiology: ["Heart Failure", "Arrhythmia", "Hypertension", "Coronary Artery Disease", "Myocardial Infarction"],
  Neurology: ["Stroke", "Epilepsy", "Migraine", "Parkinson's", "Multiple Sclerosis"],
  Orthopedics: ["Hip Fracture", "Knee Replacement", "Spinal Injury", "Arthritis", "Tendonitis"],
  Pediatrics: ["Asthma", "Bronchitis", "Ear Infection", "Pneumonia", "Gastroenteritis"],
  Oncology: ["Breast Cancer", "Lung Cancer", "Leukemia", "Lymphoma", "Colon Cancer"],
  ICU: ["Respiratory Failure", "Septic Shock", "Multi-Organ Failure", "Post-Op Recovery", "Cardiac Arrest"],
  "General Medicine": ["Diabetes", "Hypertension", "UTI", "Pneumonia", "Anemia"],
  Surgery: ["Appendectomy", "Cholecystectomy", "Hernia Repair", "Bypass Surgery", "Tumor Resection"],
  Radiology: ["Imaging Procedure", "CT Scan", "MRI", "Biopsy", "Interventional Procedure"],
};

const STATES = [
  ["California", "Los Angeles"], ["California", "San Francisco"], ["California", "San Diego"],
  ["Texas", "Houston"], ["Texas", "Dallas"], ["Texas", "Austin"],
  ["New York", "New York"], ["New York", "Buffalo"],
  ["Florida", "Miami"], ["Florida", "Orlando"], ["Florida", "Tampa"],
  ["Illinois", "Chicago"], ["Pennsylvania", "Philadelphia"], ["Ohio", "Columbus"],
  ["Georgia", "Atlanta"], ["North Carolina", "Charlotte"], ["Michigan", "Detroit"],
  ["Washington", "Seattle"], ["Massachusetts", "Boston"], ["Arizona", "Phoenix"],
  ["Colorado", "Denver"], ["Virginia", "Richmond"], ["Tennessee", "Nashville"],
] as const;

const FIRST_NAMES = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Daniel","Nancy","Matthew","Lisa","Anthony","Margaret","Mark","Sandra","Donald","Ashley"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker"];
const DOCTOR_FIRST = ["Dr. Alice","Dr. Brian","Dr. Carol","Dr. Daniel","Dr. Eva","Dr. Frank","Dr. Grace","Dr. Henry","Dr. Iris","Dr. Jacob","Dr. Kate","Dr. Liam","Dr. Maya","Dr. Noah","Dr. Olivia"];
const DOCTOR_LAST = ["Patel","Khan","Nguyen","Park","Cohen","Reyes","Singh","Ivanov","Murphy","Adler","Bauer","Chen","Diaz","Ferrari","Goldberg"];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(count = 10000): Patient[] {
  const rng = mulberry32(20240615);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];
  const out: Patient[] = [];
  const start = new Date("2023-01-01").getTime();
  const end = new Date("2024-12-31").getTime();
  const doctorsByDept = new Map<string, string[]>();
  for (const d of DEPARTMENTS) {
    const list: string[] = [];
    for (let i = 0; i < 5; i++) list.push(`${pick(DOCTOR_FIRST)} ${pick(DOCTOR_LAST)}`);
    doctorsByDept.set(d, list);
  }

  for (let i = 0; i < count; i++) {
    const dept = pick(DEPARTMENTS);
    const diagnosis = pick(DIAGNOSES_BY_DEPT[dept]);
    const admMs = start + Math.floor(rng() * (end - start));
    const los = Math.max(1, Math.round((dept === "ICU" ? 7 : dept === "Surgery" ? 5 : 3) + rng() * 8));
    const disMs = admMs + los * 86400000;
    const [state, city] = pick(STATES);
    const ageBase = dept === "Pediatrics" ? 5 + rng() * 12 : 18 + rng() * 72;
    const baseCost = { ICU: 18000, Surgery: 22000, Oncology: 19000, Cardiology: 14000, Neurology: 13000, Orthopedics: 12000, Emergency: 4000, Pediatrics: 3500, "General Medicine": 5000, Radiology: 2500 }[dept] ?? 6000;
    const cost = Math.round(baseCost * (0.6 + rng() * 1.4));
    const readmitProb = { ICU: 0.22, Oncology: 0.2, Cardiology: 0.18, "General Medicine": 0.15, Surgery: 0.12, Neurology: 0.14, Orthopedics: 0.1, Emergency: 0.08, Pediatrics: 0.06, Radiology: 0.04 }[dept] ?? 0.12;
    out.push({
      Patient_ID: `PT${String(100000 + i)}`,
      Patient_Name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      Age: Math.round(ageBase),
      Gender: rng() < 0.51 ? "Female" : "Male",
      Admission_Date: new Date(admMs).toISOString().slice(0, 10),
      Discharge_Date: new Date(disMs).toISOString().slice(0, 10),
      Department: dept,
      Diagnosis: diagnosis,
      Doctor: pick(doctorsByDept.get(dept)!),
      Treatment_Cost: cost,
      Insurance_Type: pick(INSURANCE_TYPES),
      Readmitted: rng() < readmitProb,
      Length_Of_Stay: los,
      State: state,
      City: city,
      Patient_Satisfaction: Math.min(5, Math.max(1, Math.round((3.8 + rng() * 1.4) * 10) / 10)),
    });
  }
  return out;
}

let cached: Patient[] | null = null;
export function getPatients(): Patient[] {
  if (!cached) cached = generate(10000);
  return cached;
}

export const AGE_GROUPS = [
  { label: "0-17", min: 0, max: 17 },
  { label: "18-34", min: 18, max: 34 },
  { label: "35-49", min: 35, max: 49 },
  { label: "50-64", min: 50, max: 64 },
  { label: "65+", min: 65, max: 200 },
];

export function ageGroup(age: number) {
  return AGE_GROUPS.find((g) => age >= g.min && age <= g.max)?.label ?? "Unknown";
}