import { AlertTriangle } from "lucide-react";
import type { AgentExecution, EvidenceItem } from "@/types";
import { DetailDrawer, DrawerSection } from "@/components/common/DetailDrawer";
import { KeyValueList } from "@/components/common/KeyValueList";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { agentDescriptions } from "@/lib/agents";
import { formatDuration } from "@/lib/format";
import { ToolCallList } from "./ToolCallList";

interface AgentDetailDrawerProps {
  agent: AgentExecution | null;
  evidence: EvidenceItem[];
  simulated: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailDrawer({ agent, evidence, simulated, onOpenChange }: AgentDetailDrawerProps) {
  const linkedEvidence = agent ? evidence.filter((item) => agent.evidenceIds.includes(item.id)) : [];

  return (
    <DetailDrawer
      open={agent !== null}
      onOpenChange={onOpenChange}
      title={agent?.name ?? "Agent"}
      description={agent ? agentDescriptions[agent.agentId] : undefined}
      badges={
        agent && (
          <>
            <StatusBadge kind="agent" value={agent.status} showIcon />
            {simulated && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-2xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                Simulated
              </span>
            )}
          </>
        )
      }
    >
      {agent && (
        <>
          <KeyValueList
            items={[
              { label: "Started", value: <Timestamp value={agent.startedAt} pattern="MMM dd, HH:mm:ss" /> },
              { label: "Completed", value: <Timestamp value={agent.completedAt} pattern="MMM dd, HH:mm:ss" /> },
              { label: "Duration", value: formatDuration(agent.durationMs) },
              { label: "Tool calls", value: agent.toolCalls.length },
            ]}
          />

          {agent.error && (
            <div role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Agent error</p>
                <p>{agent.error.message}</p>
                <p className="text-2xs">
                  Attempts: {agent.error.attempts} · {agent.error.retryable ? "Retryable" : "Not retryable"}
                </p>
              </div>
            </div>
          )}

          <DrawerSection title="Input">
            <p className="text-sm">{agent.inputSummary || "—"}</p>
          </DrawerSection>
          <DrawerSection title="Output">
            <p className="text-sm">{agent.outputSummary || (agent.status === "pending" ? "Not started yet." : "—")}</p>
          </DrawerSection>
          <DrawerSection title="Tool calls">
            <ToolCallList calls={agent.toolCalls} />
          </DrawerSection>
          <DrawerSection title="Evidence produced">
            <EvidenceList items={linkedEvidence} emptyLabel="No evidence linked to this stage." />
          </DrawerSection>
          <p className="text-2xs text-muted-foreground">
            Only summarised inputs, outputs, and tool results are shown. Internal model reasoning is not displayed.
          </p>
        </>
      )}
    </DetailDrawer>
  );
}
