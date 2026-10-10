import { BrainCircuit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Investigation, InvestigationQuery } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { StartInvestigationDialog } from "@/components/investigations/StartInvestigationDialog";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { useQueryState } from "@/hooks/useQueryState";
import { agentNames } from "@/lib/agents";
import { investigationStatusLabels, optionsFrom } from "@/lib/labels";
import { investigationService } from "@/services";

const DEFAULTS = { search: "", status: "all" };
const statusOptions = optionsFrom(investigationStatusLabels, "All statuses");

const columns: DataTableColumn<Investigation>[] = [
  {
    id: "id",
    header: "Investigation",
    cell: (item) => (
      <Link
        to={`/investigations/${item.id}`}
        onClick={(event) => event.stopPropagation()}
        className="font-mono text-xs font-semibold text-primary hover:underline"
      >
        {item.id}
      </Link>
    ),
  },
  {
    id: "title",
    header: "Title",
    cell: (item) => (
      <div className="min-w-[14rem] max-w-md">
        <p className="truncate font-medium">{item.title}</p>
        <p className="text-2xs text-muted-foreground">
          {item.alertId}
          {item.incidentId && ` · ${item.incidentId}`}
          {item.simulated && " · simulated"}
        </p>
      </div>
    ),
  },
  { id: "severity", header: "Severity", cell: (item) => <SeverityBadge severity={item.severity} /> },
  { id: "status", header: "Status", cell: (item) => <StatusBadge kind="investigation" value={item.status} showIcon /> },
  {
    id: "stage",
    header: "Current stage",
    cell: (item) => <span className="text-xs">{item.currentAgent ? agentNames[item.currentAgent] : "—"}</span>,
  },
  { id: "confidence", header: "Confidence", cell: (item) => <ConfidenceMeter value={item.confidence} /> },
  { id: "started", header: "Started", cell: (item) => <Timestamp value={item.startedAt} className="text-xs" /> },
];

export default function InvestigationsPage() {
  const navigate = useNavigate();
  const version = useDataVersion();
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const query: InvestigationQuery = { search: values.search, status: values.status as InvestigationQuery["status"] };
  const state = useAsync(() => investigationService.list(query), [query.search, query.status, version]);

  return (
    <>
      <PageHeader
        title="AI Investigations"
        description="LangGraph multi-agent workflows: triage, investigation, threat intelligence, response recommendation, and reporting."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Operations" }, { label: "AI Investigations" }]}
        actions={<StartInvestigationDialog />}
      />
      <MockDataNotice className="mb-4">
        Sample investigations are synthetic. They were not produced by LangGraph, Amazon Bedrock, or any AI model.
      </MockDataNotice>
      <Card>
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search investigations"
          searchPlaceholder="ID, title, alert, or incident"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[{ id: "status", label: "Status", value: values.status, options: statusOptions, onChange: (status) => setValues({ status }) }]}
        />
        <AsyncView state={state} errorTitle="Could not load investigations" loading={<LoadingState rows={6} className="p-4" />}>
          {(rows) => (
            <DataTable
              caption="Investigations"
              columns={columns}
              rows={rows}
              getRowId={(item) => item.id}
              onRowClick={(item) => navigate(`/investigations/${item.id}`)}
              refreshing={state.status === "loading"}
              emptyState={
                <EmptyState
                  icon={BrainCircuit}
                  title={isFiltered ? "No investigations match these filters" : "No investigations yet"}
                  bordered={false}
                />
              }
            />
          )}
        </AsyncView>
      </Card>
    </>
  );
}
