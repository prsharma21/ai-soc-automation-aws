import { Wrench } from "lucide-react";
import type { ToolCall } from "@/types";
import { EmptyState } from "@/components/common/EmptyState";
import { Timestamp } from "@/components/common/Timestamp";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ToolCallList({ calls }: { calls: ToolCall[] }) {
  if (!calls.length) return <EmptyState icon={Wrench} title="No tool calls recorded." bordered={false} className="py-4" />;

  return (
    <ul className="space-y-2" aria-label="Tool calls">
      {calls.map((call) => (
        <li key={call.id} className="space-y-1 rounded-md border px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <code className="text-xs font-semibold">{call.tool}</code>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-2xs font-semibold ring-1 ring-inset",
                call.status === "success" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200",
              )}
            >
              {call.status === "success" ? "Success" : "Error"}
            </span>
          </div>
          <p className="text-xs">
            <span className="font-medium text-muted-foreground">Input: </span>
            {call.inputSummary}
          </p>
          <p className="text-xs">
            <span className="font-medium text-muted-foreground">Result: </span>
            {call.outputSummary}
          </p>
          <p className="flex gap-3 text-2xs text-muted-foreground">
            <Timestamp value={call.startedAt} pattern="HH:mm:ss" />
            <span>{formatDuration(call.durationMs)}</span>
            <span className="font-mono">{call.id}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
