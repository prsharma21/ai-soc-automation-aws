import { FlaskConical } from "lucide-react";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EnvironmentBadgeProps {
  compact?: boolean;
  className?: string;
}

export function EnvironmentBadge({ compact = false, className }: EnvironmentBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="status"
          tabIndex={0}
          aria-label={`Environment: ${appConfig.environmentLabel}. All data and response actions are simulated.`}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-simulated/50 bg-simulated/15 px-2 py-1 text-2xs font-bold uppercase tracking-wider text-simulated-foreground",
            className,
          )}
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          {compact ? "Simulated" : appConfig.environmentLabel}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Synthetic data only. No real accounts, hosts, IP addresses, or firewall rules are changed.
      </TooltipContent>
    </Tooltip>
  );
}
