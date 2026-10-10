import { useId, useState } from "react";
import { CheckCircle2, Gauge, XCircle } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EvaluationMetric, EvaluationRun, ScenarioResult } from "@/types";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoadingState } from "@/components/common/LoadingState";
import { SectionCard } from "@/components/common/SectionCard";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { SimulationNotice } from "@/components/common/SimulationNotice";
import { Timestamp } from "@/components/common/Timestamp";
import { ChartCard, chartAxisProps, chartTooltipStyle } from "@/components/charts/ChartCard";
import { useAsync } from "@/hooks/useAsync";
import { formatDuration, formatPercent, formatUsd } from "@/lib/format";
import { classificationLabels, scenarioLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { evaluationService } from "@/services";

function formatMetric(metric: Pick<EvaluationMetric, "unit">, value: number | null): string {
  if (value === null) return "—";
  if (metric.unit === "ratio") return formatPercent(value);
  if (metric.unit === "ms") return formatDuration(value);
  return formatUsd(value);
}

function meetsTarget(metric: EvaluationMetric): boolean | null {
  if (metric.value === null || metric.target === null) return null;
  return metric.higherIsBetter ? metric.value >= metric.target : metric.value <= metric.target;
}

function MetricTile({ metric }: { metric: EvaluationMetric }) {
  const ok = meetsTarget(metric);
  return (
    <Card className="space-y-1 p-3.5">
      <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
      <p className="text-xl font-semibold tabular-nums">{metric.value === null ? "Not produced" : formatMetric(metric, metric.value)}</p>
      <p className={cn("flex items-center gap-1 text-2xs", ok === true && "text-emerald-700", ok === false && "text-red-700", ok === null && "text-muted-foreground")}>
        {ok === true && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
        {ok === false && <XCircle className="h-3 w-3" aria-hidden="true" />}
        {metric.target === null
          ? "No target set"
          : `Target ${metric.higherIsBetter ? "≥" : "≤"} ${formatMetric(metric, metric.target)}${ok === null ? "" : ok ? " · met" : " · missed"}`}
      </p>
    </Card>
  );
}

const resultColumns: DataTableColumn<ScenarioResult>[] = [
  { id: "case", header: "Case", cell: (row) => <span className="font-mono text-xs">{row.caseId}</span> },
  { id: "scenario", header: "Scenario", cell: (row) => <span className="text-xs">{scenarioLabels[row.scenario]}</span> },
  { id: "desc", header: "Description", cell: (row) => <span className="text-xs">{row.description}</span> },
  {
    id: "classification",
    header: "Expected → predicted",
    cell: (row) => (
      <span className={cn("text-xs", row.expected !== row.predicted && "font-semibold text-red-700")}>
        {classificationLabels[row.expected]} → {classificationLabels[row.predicted]}
      </span>
    ),
  },
  {
    id: "severity",
    header: "Severity (exp. / pred.)",
    cell: (row) => (
      <span className="inline-flex items-center gap-1">
        <SeverityBadge severity={row.expectedSeverity} />
        <span aria-hidden="true">/</span>
        <SeverityBadge severity={row.predictedSeverity} />
      </span>
    ),
  },
  { id: "latency", header: "Latency", cell: (row) => <span className="text-xs tabular-nums">{formatDuration(row.latencyMs)}</span> },
  {
    id: "result",
    header: "Result",
    cell: (row) =>
      row.passed ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Pass
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Fail
        </span>
      ),
  },
];

const runColumns: DataTableColumn<EvaluationRun>[] = [
  { id: "id", header: "Run", cell: (run) => <span className="font-mono text-xs font-semibold">{run.id}</span> },
  { id: "started", header: "Started", cell: (run) => <Timestamp value={run.startedAt} className="text-xs" /> },
  {
    id: "status",
    header: "Status",
    cell: (run) => (
      <span className={cn("text-xs font-medium", run.status === "failed" ? "text-red-700" : "text-emerald-700")}>
        {run.status === "failed" ? "Failed" : "Completed"}
      </span>
    ),
  },
  { id: "mode", header: "Mode", cell: (run) => <DataModeBadge mode={run.executionMode} /> },
  { id: "evaluator", header: "Evaluator", cell: (run) => <span className="text-xs">{run.evaluator}</span> },
  { id: "dataset", header: "Dataset", cell: (run) => <span className="text-xs">{run.dataset} · {run.caseCount} cases</span> },
  {
    id: "f1",
    header: "F1",
    cell: (run) => <span className="text-xs tabular-nums">{formatPercent(run.metrics.find((m) => m.key === "f1")?.value ?? null)}</span>,
  },
];

function TrendChart({ runs }: { runs: EvaluationRun[] }) {
  const keys = ["precision", "recall", "f1"] as const;
  const colors = { precision: "hsl(var(--primary))", recall: "hsl(var(--severity-medium))", f1: "hsl(var(--success))" };
  const rows = [...runs]
    .filter((run) => run.status === "completed")
    .reverse()
    .map((run) => {
      const row: Record<string, string | number | null> = { run: run.id };
      for (const key of keys) row[key] = run.metrics.find((metric) => metric.key === key)?.value ?? null;
      return row;
    });
  const summary = `Quality trend across ${rows.length} completed runs: ${rows
    .map((row) => `${row.run} F1 ${formatPercent(row.f1 as number | null)}`)
    .join(", ")}.`;

  return (
    <ChartCard title="Quality trend" description="Completed runs only" summary={summary} isEmpty={rows.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="run" {...chartAxisProps} />
          <YAxis domain={[0.6, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} {...chartAxisProps} />
          <Tooltip {...chartTooltipStyle} formatter={(value: number) => formatPercent(value)} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {keys.map((key) => (
            <Line key={key} type="monotone" dataKey={key} name={key === "f1" ? "F1" : key[0]?.toUpperCase() + key.slice(1)} stroke={colors[key]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function EvaluationContent({ runs }: { runs: EvaluationRun[] }) {
  const selectId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const run = runs.find((item) => item.id === selectedId) ?? runs[0];
  if (!run) return <EmptyState icon={Gauge} title="No evaluation runs recorded" />;
  const failedCases = run.scenarioResults.filter((row) => !row.passed);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor={selectId} className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evaluation run
          </label>
          <NativeSelect
            id={selectId}
            value={run.id}
            onChange={(event) => setSelectedId(event.target.value)}
            options={runs.map((item) => ({ value: item.id, label: `${item.id}${item.status === "failed" ? " (failed)" : ""}` }))}
            className="w-56"
          />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">
          Evaluator: <span className="font-medium text-foreground">{run.evaluator}</span> · Dataset: {run.dataset} · {run.caseCount} cases
        </p>
      </div>

      {run.status === "failed" && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          This run failed before producing metrics. No values are shown for it.
        </div>
      )}

      <section aria-label="Metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {run.metrics.map((metric) => (
          <MetricTile key={metric.key} metric={metric} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart runs={runs} />
        <SectionCard title="Run history" flush>
          <DataTable caption="Evaluation runs" columns={runColumns} rows={runs} getRowId={(item) => item.id} onRowClick={(item) => setSelectedId(item.id)} />
        </SectionCard>
      </div>

      <SectionCard title={`Failed cases (${failedCases.length})`} flush>
        <DataTable
          caption="Failed evaluation cases"
          columns={[...resultColumns.slice(0, 4), { id: "notes", header: "Notes", cell: (row) => <span className="text-xs">{row.notes || "—"}</span> }]}
          rows={failedCases}
          getRowId={(row) => row.caseId}
          emptyState={<EmptyState title={run.scenarioResults.length ? "All cases passed" : "No case results for this run"} bordered={false} className="py-6" />}
        />
      </SectionCard>

      <SectionCard title="Scenario results" description="Expected versus predicted classification and severity per test case." flush>
        <DataTable
          caption="Scenario results"
          columns={resultColumns}
          rows={run.scenarioResults}
          getRowId={(row) => row.caseId}
          rowClassName={(row) => (row.passed ? undefined : "bg-red-50/40")}
          emptyState={<EmptyState title="No case results for this run" bordered={false} className="py-6" />}
        />
      </SectionCard>
    </div>
  );
}

export default function EvaluationsPage() {
  const state = useAsync(() => evaluationService.listRuns(), []);
  const hasMockRuns = (state.data ?? []).some((run) => run.executionMode === "mock");

  return (
    <>
      <PageHeader
        title="Evaluation & Metrics"
        description="Quality of triage, retrieval, and reporting measured against labelled synthetic scenarios."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Governance" }, { label: "Evaluation & Metrics" }]}
      />
      {hasMockRuns && (
        <SimulationNotice className="mb-4">
          Illustrative sample values. No evaluator (such as DeepEval) has run against these cases; real results must come from the backend evaluation service.
        </SimulationNotice>
      )}
      <AsyncView state={state} errorTitle="Could not load evaluation runs" loading={<PageLoadingState />}>
        {(runs) => <EvaluationContent runs={runs} />}
      </AsyncView>
    </>
  );
}
