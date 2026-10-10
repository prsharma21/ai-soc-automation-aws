import { useState } from "react";
import { toast } from "sonner";
import type { ApprovalDecisionType, ResponseRecommendation } from "@/types";
import { notifyDataChanged } from "@/lib/dataEvents";
import { recommendationStatusLabels } from "@/lib/labels";
import { approvalService } from "@/services";
import { useAsyncAction } from "./useAsyncAction";

const pastTense: Record<ApprovalDecisionType, string> = { approve: "approved", reject: "rejected", defer: "deferred" };

/**
 * Drives the confirm → submit → refresh cycle. Status only changes after the
 * service succeeds; on failure the dialog stays open with the error. Views that
 * read `useDataVersion` reload automatically after a successful decision.
 */
export function useApprovalFlow(onDecided?: () => void) {
  const [target, setTarget] = useState<{ recommendation: ResponseRecommendation; decision: ApprovalDecisionType } | null>(null);
  const action = useAsyncAction((id: string, decision: ApprovalDecisionType, note: string) =>
    approvalService.decide(id, { decision, note }),
  );

  function open(recommendation: ResponseRecommendation, decision: ApprovalDecisionType) {
    action.resetError();
    setTarget({ recommendation, decision });
  }

  async function confirm(note: string) {
    if (!target) return;
    try {
      const updated = await action.run(target.recommendation.id, target.decision, note);
      const message = `${updated.id} ${pastTense[target.decision]}`;
      if (updated.status === "failed_simulated") {
        toast.error(`${message} — simulated execution failed`, { description: updated.executionResult ?? undefined });
      } else {
        toast.success(message, { description: `Status: ${recommendationStatusLabels[updated.status]}` });
      }
      setTarget(null);
      notifyDataChanged();
      onDecided?.();
    } catch (caught) {
      toast.error("Decision not recorded", { description: caught instanceof Error ? caught.message : undefined });
    }
  }

  return {
    open,
    dialogProps: {
      recommendation: target?.recommendation ?? null,
      decision: target?.decision ?? null,
      pending: action.pending,
      error: action.error?.message ?? null,
      onOpenChange: (next: boolean) => {
        if (!next && !action.pending) setTarget(null);
      },
      onConfirm: confirm,
    },
  };
}
