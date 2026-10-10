import { Check, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { ApprovalDecisionType, ResponseRecommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { actionTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: ResponseRecommendation;
  onDecide?: (recommendation: ResponseRecommendation, decision: ApprovalDecisionType) => void;
  compact?: boolean;
}

export function isAwaitingDecision(rec: ResponseRecommendation): boolean {
  return rec.status === "pending" || rec.status === "deferred";
}

export function RecommendationCard({ recommendation: rec, onDecide, compact = false }: RecommendationCardProps) {
  const awaiting = isAwaitingDecision(rec);

  return (
    <Card className="space-y-3 p-4" data-testid={`recommendation-${rec.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{rec.id}</span>
            <SeverityBadge severity={rec.severity} />
            <StatusBadge kind="recommendation" value={rec.status} showIcon />
          </div>
          <p className="text-sm font-semibold">{rec.action}</p>
          <p className="text-xs text-muted-foreground">
            {actionTypeLabels[rec.actionType]} · target <span className="font-mono text-foreground">{rec.target}</span>
          </p>
        </div>
        <div className="text-right text-2xs text-muted-foreground">
          <p>
            Incident{" "}
            <Link to={`/incidents/${rec.incidentId}`} className="font-medium text-primary hover:underline">
              {rec.incidentId}
            </Link>
          </p>
          {rec.investigationId && (
            <p>
              Investigation{" "}
              <Link to={`/investigations/${rec.investigationId}`} className="font-medium text-primary hover:underline">
                {rec.investigationId}
              </Link>
            </p>
          )}
          <p>
            Proposed <Timestamp value={rec.createdAt} relative />
          </p>
        </div>
      </div>

      {!compact && (
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div className="sm:col-span-3">
            <dt className="font-semibold text-muted-foreground">Reason</dt>
            <dd>{rec.reason}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Risk</dt>
            <dd>{rec.risk}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Impact</dt>
            <dd>{rec.impact}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Evidence</dt>
            <dd>{rec.evidence.length ? rec.evidence.map((item) => item.title).join("; ") : "None attached"}</dd>
          </div>
        </dl>
      )}

      {rec.decision && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
          <p>
            <span className="font-semibold capitalize">{rec.decision.decision}</span> by {rec.decision.analyst} ·{" "}
            <Timestamp value={rec.decision.decidedAt} />
            {rec.decision.simulated && <span className="ml-1 text-amber-700">(simulated)</span>}
          </p>
          {rec.decision.note && <p className="mt-0.5 text-muted-foreground">“{rec.decision.note}”</p>}
        </div>
      )}

      {rec.executionResult && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            rec.status === "failed_simulated" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800",
          )}
        >
          {rec.executionResult}
        </p>
      )}

      {onDecide && awaiting && (
        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="success" onClick={() => onDecide(rec, "approve")}>
            <Check /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDecide(rec, "reject")}>
            <X /> Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecide(rec, "defer")}
            disabled={rec.status === "deferred"}
            title={rec.status === "deferred" ? "Already deferred" : undefined}
          >
            <Clock /> Defer
          </Button>
        </div>
      )}
    </Card>
  );
}
