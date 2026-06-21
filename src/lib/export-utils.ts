import type { Patient } from "./healthcare-data";

export function downloadCSV(rows: Patient[], filename = "patients.csv") {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]) as (keyof Patient)[];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function downloadExcel(rows: Patient[], filename = "patients.xls") {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]) as (keyof Patient)[];
  const html =
    `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${cols.map((c) => `<td>${r[c]}</td>`).join("")}</tr>`).join("") +
    `</tbody></table>`;
  triggerDownload(new Blob([html], { type: "application/vnd.ms-excel" }), filename);
}

export function exportPDF() {
  window.print();
}

export function printDashboard() {
  window.print();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}