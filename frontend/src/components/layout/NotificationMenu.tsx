import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SeverityDot } from "@/components/common/SeverityBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { notificationService } from "@/services";

export function NotificationMenu() {
  const navigate = useNavigate();
  const version = useDataVersion();
  const state = useAsync(() => notificationService.list(), [version]);
  const items = state.data ?? [];
  const count = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={count ? `Notifications, ${count} items` : "Notifications"}
        >
          <Bell aria-hidden="true" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <span className="text-2xs font-normal text-muted-foreground">Derived from current data</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {state.status === "error" && (
          <p role="alert" className="px-2 py-3 text-xs text-destructive">
            Could not load notifications: {state.error.message}
          </p>
        )}
        {state.status !== "error" && state.data === undefined && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Loading…</p>
        )}
        {state.data !== undefined && count === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Nothing needs your attention.</p>
        )}
        {items.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => navigate(item.href)} className="items-start gap-2 py-2">
            <SeverityDot severity={item.severity} className="mt-1.5" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
              <Timestamp value={item.timestamp} relative className="text-2xs text-muted-foreground" />
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
