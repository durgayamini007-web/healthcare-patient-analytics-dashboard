import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BriefcaseMedical, HeartPulse, LayoutDashboard, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Executive", icon: LayoutDashboard },
  { to: "/demographics", label: "Demographics", icon: Users },
  { to: "/clinical", label: "Clinical", icon: HeartPulse },
  { to: "/financial", label: "Financial", icon: Wallet },
  { to: "/operations", label: "Operations", icon: Activity },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-lg">
          <BriefcaseMedical className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">MediPulse</p>
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Patient Analytics</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <p className="px-2 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Dashboards
        </p>
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs">
        <p className="font-semibold text-sidebar-foreground">Need help?</p>
        <p className="mt-0.5 text-sidebar-foreground/60">Reach the analytics team for custom reports.</p>
      </div>
    </aside>
  );
}