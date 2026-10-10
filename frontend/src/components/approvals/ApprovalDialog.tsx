import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { ApprovalDecisionType, ResponseRecommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { SIMULATION_ONLY_WARNING, SimulationNotice } from "@/components/common/SimulationNotice";

export const NOTE_MAX_LENGTH = 500;

const schema = z.object({
  note: z.string().trim().max(NOTE_MAX_LENGTH, `Keep the note under ${NOTE_MAX_LENGTH} characters.`),
});

type FormValues = z.infer<typeof schema>;

const copy: Record<ApprovalDecisionType, { title: string; confirm: string; variant: "success" | "destructive" | "outline" }> = {
  approve: { title: "Approve response action", confirm: "Approve (simulated)", variant: "success" },
  reject: { title: "Reject response action", confirm: "Reject", variant: "destructive" },
  defer: { title: "Defer response action", confirm: "Defer", variant: "outline" },
};

interface ApprovalDialogProps {
  recommendation: ResponseRecommendation | null;
  decision: ApprovalDecisionType | null;
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
}

export function ApprovalDialog({ recommendation, decision, pending, error, onOpenChange, onConfirm }: ApprovalDialogProps) {
  const noteId = useId();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { note: "" } });
  const open = recommendation !== null && decision !== null;
  const noteLength = form.watch("note").length;

  useEffect(() => {
    if (open) form.reset({ note: "" });
  }, [open, form]);

  if (!recommendation || !decision) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }
  const text = copy[decision];
  const noteError = form.formState.errors.note?.message;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={form.handleSubmit((values) => onConfirm(values.note))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{text.title}</DialogTitle>
            <DialogDescription>
              {recommendation.id} · {recommendation.action} on <span className="font-mono">{recommendation.target}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={recommendation.severity} />
              <span className="text-muted-foreground">Incident {recommendation.incidentId}</span>
            </div>
            <p>
              <span className="font-semibold">Reason: </span>
              {recommendation.reason}
            </p>
            <p>
              <span className="font-semibold">Risk: </span>
              {recommendation.risk}
            </p>
          </div>

          <SimulationNotice variant="warning">{SIMULATION_ONLY_WARNING}</SimulationNotice>

          <div className="space-y-1.5">
            <Label htmlFor={noteId}>Analyst note (optional)</Label>
            <Textarea
              id={noteId}
              rows={3}
              placeholder="Context for the audit trail"
              aria-invalid={noteError ? true : undefined}
              aria-describedby={`${noteId}-hint`}
              disabled={pending}
              {...form.register("note")}
            />
            <p id={`${noteId}-hint`} className={noteError ? "text-2xs text-destructive" : "text-2xs text-muted-foreground"}>
              {noteError ?? `${noteLength}/${NOTE_MAX_LENGTH} characters · recorded in the audit log`}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              The decision was not recorded: {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant={text.variant} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {text.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
