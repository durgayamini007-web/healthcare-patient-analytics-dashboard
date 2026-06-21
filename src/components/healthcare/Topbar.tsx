import { useFilters } from "@/lib/filters";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, FileText, Moon, Printer, Search, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV, downloadExcel, exportPDF, printDashboard } from "@/lib/export-utils";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { filters, setFilters, data } = useFilters();
  const { theme, toggle } = useTheme();
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search patients, doctors..."
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPDF}>
                <FileText className="mr-2 h-4 w-4" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExcel(data)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCSV(data)}>
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printDashboard}>
                <Printer className="mr-2 h-4 w-4" /> Print Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}