import { ClipboardCheck } from "lucide-react";
import type { RecommendationStatus } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { SIMULATION_ONLY_WARNING, SimulationNotice } from "@/components/common/SimulationNotice";
import { ApprovalDialog } from "@/components/approvals/ApprovalDialog";
import { RecommendationCard } from "@/components/approvals/RecommendationCard";
import { useApprovalFlow } from "@/hooks/useApprovalFlow";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { useQueryState } from "@/hooks/useQueryState";
import { recommendationStatusLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { approvalService } from "@/services";

const DEFAULTS = { status: "pending" };
const statusTabs: Array<RecommendationStatus | "all"> = ["pending", "deferred", "approved", "executed_simulated", "failed_simulated", "rejected", "all"];

export default function ApprovalsPage() {
  const version = useDataVersion();
  const { values, setValues } = useQueryState(DEFAULTS);
  const status = values.status as RecommendationStatus | "all";
  const all = useAsync(() => approvalService.list({ status: "all" }), [version]);
  const approval = useApprovalFlow();

  const counts = new Map<string, number>();
  for (const rec of all.data ?? []) counts.set(rec.status, (counts.get(rec.status) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Response Approvals"
        description="Human-in-the-loop review of proposed response actions. Every decision is written to the audit log."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Intelligence & Response" }, { label: "Response Approvals" }]}
      />
      <div className="mb-4 space-y-2">
        <SimulationNotice variant="warning">{SIMULATION_ONLY_WARNING}</SimulationNotice>
        <p className="text-xs text-muted-foreground">
          This page records decisions only. It is not a security boundary: the backend must independently verify approval before any response action runs.
        </p>
      </div>

      <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1.5">
        {statusTabs.map((value) => {
          const active = status === value;
          const count = value === "all" ? (all.data?.length ?? 0) : (counts.get(value) ?? 0);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setValues({ status: value })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {value === "all" ? "All" : recommendationStatusLabels[value]}
              <span className={cn("rounded px-1 tabular-nums", active ? "bg-white/20" : "bg-muted")}>{count}</span>
            </button>
          );
        })}
      </div>

      <AsyncView state={all} errorTitle="Could not load the approval queue" loading={<LoadingState rows={4} />}>
        {(recs) => {
          const visible = status === "all" ? recs : recs.filter((rec) => rec.status === status);
          return visible.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={status === "pending" ? "No actions awaiting approval" : "Nothing in this status"}
              description={status === "pending" ? "New recommendations from investigations will appear here." : undefined}
            />
          ) : (
            <div className="grid gap-3 xl:grid-cols-2" aria-busy={all.status === "loading"}>
              {visible.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} onDecide={approval.open} />
              ))}
            </div>
          );
        }}
      </AsyncView>
      <ApprovalDialog {...approval.dialogProps} />
    </>
  );
}
