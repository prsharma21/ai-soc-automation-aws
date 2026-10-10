import { FlaskConical, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function AppSidebar({ collapsed = false, onToggleCollapsed, onNavigate, className }: AppSidebarProps) {
  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-highlight/15 text-sidebar-highlight">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{appConfig.shortName}</p>
            <p className="truncate text-2xs text-sidebar-muted">Security Operations Center</p>
          </div>
        )}
      </div>

      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex justify-center text-amber-400" title="Simulated environment">
            <FlaskConical className="h-4 w-4" aria-label="Simulated environment" />
          </div>
        ) : (
          <div className="rounded-md bg-amber-400/10 px-3 py-2 text-2xs leading-relaxed text-sidebar-muted">
            <p className="font-semibold uppercase tracking-wider text-amber-400">Simulated environment</p>
            <p>Synthetic data only. Response actions are never executed against real systems.</p>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-highlight",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" /> Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
