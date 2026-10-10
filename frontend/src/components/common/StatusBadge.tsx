import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock,
  Eye,
  Loader2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  AgentNodeStatus,
  AlertStatus,
  AuditOutcome,
  IncidentStatus,
  InvestigationStatus,
  PlaybookStatus,
  RecommendationStatus,
} from "@/types";
import {
  agentNodeStatusLabels,
  alertStatusLabels,
  auditOutcomeLabels,
  incidentStatusLabels,
  investigationStatusLabels,
  playbookStatusLabels,
  recommendationStatusLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "info" | "progress" | "warning" | "success" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

const toneIcon: Record<Tone, LucideIcon> = {
  neutral: CircleSlash,
  info: CircleDashed,
  progress: Loader2,
  warning: Clock,
  success: CheckCircle2,
  danger: XCircle,
};

type StatusKind =
  | { kind: "alert"; value: AlertStatus }
  | { kind: "incident"; value: IncidentStatus }
  | { kind: "investigation"; value: InvestigationStatus }
  | { kind: "agent"; value: AgentNodeStatus }
  | { kind: "recommendation"; value: RecommendationStatus }
  | { kind: "outcome"; value: AuditOutcome }
  | { kind: "playbook"; value: PlaybookStatus };

const tones = {
  alert: {
    new: "info",
    triaging: "progress",
    investigating: "progress",
    escalated: "danger",
    resolved: "success",
    false_positive: "neutral",
  },
  incident: {
    open: "danger",
    investigating: "progress",
    contained: "warning",
    resolved: "success",
    closed: "neutral",
  },
  investigation: {
    queued: "neutral",
    running: "progress",
    completed: "success",
    failed: "danger",
    needs_review: "warning",
  },
  agent: {
    pending: "neutral",
    running: "progress",
    completed: "success",
    failed: "danger",
    needs_review: "warning",
    skipped: "neutral",
  },
  recommendation: {
    pending: "warning",
    approved: "info",
    rejected: "danger",
    deferred: "neutral",
    executed_simulated: "success",
    failed_simulated: "danger",
  },
  outcome: {
    success: "success",
    failure: "danger",
    pending: "warning",
    info: "info",
  },
  playbook: {
    published: "success",
    draft: "neutral",
    under_review: "warning",
  },
} satisfies { [K in StatusKind["kind"]]: Record<Extract<StatusKind, { kind: K }>["value"], Tone> };

const labels = {
  alert: alertStatusLabels,
  incident: incidentStatusLabels,
  investigation: investigationStatusLabels,
  agent: agentNodeStatusLabels,
  recommendation: recommendationStatusLabels,
  outcome: auditOutcomeLabels,
  playbook: playbookStatusLabels,
};

export function statusTone(status: StatusKind): Tone {
  return (tones[status.kind] as Record<string, Tone>)[status.value] ?? "neutral";
}

type StatusBadgeProps = StatusKind & { className?: string; showIcon?: boolean };

export function StatusBadge({ className, showIcon = false, ...status }: StatusBadgeProps) {
  const tone = statusTone(status);
  const label = (labels[status.kind] as Record<string, string>)[status.value] ?? status.value;
  const Icon = status.kind === "agent" && status.value === "needs_review" ? Eye : toneIcon[tone];
  const spinning = status.value === "running";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClass[tone],
        className,
      )}
    >
      {showIcon && (
        <Icon className={cn("h-3 w-3", spinning && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

export function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  const Icon = tone === "danger" ? AlertCircle : toneIcon[tone];
  return <Icon className={className} aria-hidden="true" />;
}
