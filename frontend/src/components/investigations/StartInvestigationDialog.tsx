import { useId, useState } from "react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AlertQuery } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { useAsync } from "@/hooks/useAsync";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { appConfig } from "@/lib/config";
import { notifyDataChanged } from "@/lib/dataEvents";
import { severityLabels } from "@/lib/labels";
import { alertService, investigationService } from "@/services";

const candidateQuery: AlertQuery = {
  search: "",
  severity: "all",
  category: "all",
  status: "new",
  timeRange: "all",
  sortBy: "severity",
  sortDirection: "desc",
  page: 1,
  pageSize: 50,
};

function CandidatePicker({ onStarted }: { onStarted: (investigationId: string) => void }) {
  const selectId = useId();
  const state = useAsync(() => alertService.list(candidateQuery), []);
  const candidates = (state.data?.items ?? []).filter((alert) => !alert.investigationId);
  const [chosenId, setAlertId] = useState("");
  const alertId = chosenId || candidates[0]?.id || "";
  const start = useAsyncAction((id: string) => investigationService.start(id));

  async function handleStart() {
    try {
      const result = await start.run(alertId);
      toast.success(`${result.simulated ? "Simulated investigation" : "Investigation"} ${result.investigationId} started`);
      notifyDataChanged();
      onStarted(result.investigationId);
    } catch (caught) {
      toast.error("Could not start the investigation", { description: caught instanceof Error ? caught.message : undefined });
    }
  }

  if (state.status === "error") return <ErrorState title="Could not load alerts" message={state.error.message} onRetry={state.reload} />;
  if (state.data === undefined) return <LoadingState rows={2} />;
  if (!candidates.length) return <p className="text-sm text-muted-foreground">Every new alert already has an investigation.</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={selectId}>New alert</Label>
        <NativeSelect
          id={selectId}
          value={alertId}
          onChange={(event) => setAlertId(event.target.value)}
          options={candidates.map((alert) => ({
            value: alert.id,
            label: `${alert.id} · ${severityLabels[alert.severity]} · ${alert.title}`,
          }))}
        />
      </div>
      {start.error && (
        <p role="alert" className="text-xs text-destructive">
          {start.error.message}
        </p>
      )}
      <DialogFooter>
        <Button onClick={handleStart} disabled={!alertId || start.pending}>
          {start.pending ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
          {start.pending ? "Starting…" : "Start"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function StartInvestigationDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <BrainCircuit /> Start investigation
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start investigation</DialogTitle>
            <DialogDescription>
              {appConfig.useMockData
                ? "Mock mode creates a simulated workflow. No AI agents or models are invoked."
                : "Sends the selected alert to the investigation workflow."}
            </DialogDescription>
          </DialogHeader>
          {open && (
            <CandidatePicker
              onStarted={(investigationId) => {
                setOpen(false);
                navigate(`/investigations/${investigationId}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
