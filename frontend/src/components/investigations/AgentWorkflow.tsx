import { ChevronRight } from "lucide-react";
import type { AgentExecution, AgentId, AgentNodeStatus } from "@/types";
import { StatusBadge, ToneIcon, statusTone } from "@/components/common/StatusBadge";
import { agentDescriptions } from "@/lib/agents";
import { agentNodeStatusLabels } from "@/lib/labels";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const nodeRing: Record<AgentNodeStatus, string> = {
  pending: "border-dashed border-slate-300 bg-card",
  running: "border-indigo-400 bg-indigo-50/60 shadow-[0_0_0_3px_rgb(99_102_241/0.15)]",
  completed: "border-emerald-300 bg-emerald-50/50",
  failed: "border-red-300 bg-red-50/60",
  needs_review: "border-amber-300 bg-amber-50/60",
  skipped: "border-dashed border-slate-200 bg-muted/40 opacity-75",
};

const iconColor: Record<AgentNodeStatus, string> = {
  pending: "text-slate-400",
  running: "text-indigo-600 animate-spin motion-reduce:animate-none",
  completed: "text-emerald-600",
  failed: "text-red-600",
  needs_review: "text-amber-600",
  skipped: "text-slate-400",
};

interface AgentWorkflowProps {
  agents: AgentExecution[];
  currentAgent: AgentId | null;
  onSelect: (agentId: AgentId) => void;
}

/** LangGraph workflow rendered as an ordered list of nodes (accessible without a canvas library). */
export function AgentWorkflow({ agents, currentAgent, onSelect }: AgentWorkflowProps) {
  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0" aria-label="LangGraph agent workflow">
      {agents.map((agent, index) => {
        const isCurrent = agent.agentId === currentAgent;
        return (
          <li key={agent.agentId} className="flex flex-col items-stretch lg:flex-1 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={() => onSelect(agent.agentId)}
              aria-label={`Step ${index + 1}: ${agent.name}, ${agentNodeStatusLabels[agent.status]}. Open details.`}
              aria-current={isCurrent ? "step" : undefined}
              data-testid={`agent-node-${agent.agentId}`}
              data-status={agent.status}
              className={cn(
                "flex w-full flex-1 flex-col gap-1.5 rounded-lg border-2 px-3 py-2.5 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                nodeRing[agent.status],
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</span>
                <ToneIcon tone={statusTone({ kind: "agent", value: agent.status })} className={cn("h-4 w-4", iconColor[agent.status])} />
              </span>
              <span className="text-sm font-semibold leading-tight">{agent.name}</span>
              <span className="line-clamp-2 text-2xs text-muted-foreground">{agentDescriptions[agent.agentId]}</span>
              <span className="mt-auto flex items-center justify-between gap-2 pt-1">
                <StatusBadge kind="agent" value={agent.status} />
                <span className="text-2xs tabular-nums text-muted-foreground">{formatDuration(agent.durationMs)}</span>
              </span>
            </button>
            {index < agents.length - 1 && (
              <ChevronRight
                className="mx-auto h-4 w-4 rotate-90 text-muted-foreground lg:mx-1 lg:rotate-0"
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
