import { BrainCircuit, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SecurityAlert } from "@/types";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { appConfig } from "@/lib/config";
import { notifyDataChanged } from "@/lib/dataEvents";
import { investigationService } from "@/services";

const closedStatuses = new Set<SecurityAlert["status"]>(["resolved", "false_positive"]);

export function StartInvestigationButton({ alert }: { alert: SecurityAlert }) {
  const navigate = useNavigate();
  const { run, pending, error } = useAsyncAction((alertId: string) => investigationService.start(alertId));

  if (alert.investigationId) {
    return (
      <Button asChild variant="outline">
        <Link to={`/investigations/${alert.investigationId}`}>
          <BrainCircuit /> View investigation
        </Link>
      </Button>
    );
  }

  const closed = closedStatuses.has(alert.status);

  async function handleStart() {
    try {
      const result = await run(alert.id);
      toast.success(
        result.simulated ? `Simulated investigation ${result.investigationId} started` : `Investigation ${result.investigationId} started`,
        { description: result.simulated ? "Mock workflow — no AI agents are invoked." : undefined },
      );
      notifyDataChanged();
      navigate(`/investigations/${result.investigationId}`);
    } catch (caught) {
      toast.error("Could not start the investigation", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button onClick={handleStart} disabled={pending || closed} aria-busy={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
        {pending ? "Starting…" : appConfig.useMockData ? "Start investigation (simulated)" : "Start investigation"}
      </Button>
      {closed && <p className="text-2xs text-muted-foreground">Closed alerts cannot start a new investigation.</p>}
      {error && (
        <p role="alert" className="text-2xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
