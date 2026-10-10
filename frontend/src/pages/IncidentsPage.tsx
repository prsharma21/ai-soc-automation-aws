import { FolderKanban } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Incident, IncidentQuery, IncidentSortKey, SortDirection } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { Pagination } from "@/components/common/Pagination";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { incidentStatusLabels, optionsFrom, severityLabels, timeRangeLabels } from "@/lib/labels";
import { incidentService } from "@/services";

const PAGE_SIZE = 10;
const DEFAULTS = {
  search: "",
  severity: "all",
  status: "all",
  timeRange: "all",
  sortBy: "updatedAt",
  sortDirection: "desc",
  page: "1",
};

const severityOptions = optionsFrom(severityLabels, "All severities");
const statusOptions = optionsFrom(incidentStatusLabels, "All statuses");
const timeRangeOptions = (Object.keys(timeRangeLabels) as (keyof typeof timeRangeLabels)[]).map((value) => ({
  value,
  label: timeRangeLabels[value],
}));

const columns: DataTableColumn<Incident>[] = [
  {
    id: "id",
    header: "Incident",
    sortKey: "id",
    cell: (incident) => (
      <Link
        to={`/incidents/${incident.id}`}
        onClick={(event) => event.stopPropagation()}
        className="font-mono text-xs font-semibold text-primary hover:underline"
      >
        {incident.id}
      </Link>
    ),
  },
  {
    id: "title",
    header: "Title",
    cell: (incident) => (
      <div className="min-w-[14rem] max-w-md">
        <p className="truncate font-medium">{incident.title}</p>
        <p className="truncate text-2xs text-muted-foreground">{incident.affectedEntities.join(", ")}</p>
      </div>
    ),
  },
  { id: "severity", header: "Severity", sortKey: "severity", cell: (incident) => <SeverityBadge severity={incident.severity} /> },
  { id: "status", header: "Status", cell: (incident) => <StatusBadge kind="incident" value={incident.status} /> },
  { id: "alerts", header: "Alerts", cell: (incident) => <span className="tabular-nums">{incident.alertIds.length}</span> },
  { id: "owner", header: "Owner", cell: (incident) => <span className="text-xs">{incident.assignedTo ?? "Unassigned"}</span> },
  { id: "createdAt", header: "Created", sortKey: "createdAt", cell: (incident) => <Timestamp value={incident.createdAt} className="text-xs" /> },
  { id: "updatedAt", header: "Updated", sortKey: "updatedAt", cell: (incident) => <Timestamp value={incident.updatedAt} relative className="text-xs" /> },
];

export default function IncidentsPage() {
  const navigate = useNavigate();
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const query: IncidentQuery = {
    search: values.search,
    severity: values.severity as IncidentQuery["severity"],
    status: values.status as IncidentQuery["status"],
    timeRange: values.timeRange as IncidentQuery["timeRange"],
    sortBy: values.sortBy as IncidentSortKey,
    sortDirection: values.sortDirection as SortDirection,
    page: Math.max(1, Number(values.page) || 1),
    pageSize: PAGE_SIZE,
  };
  const state = useAsync(() => incidentService.list(query), [JSON.stringify(query)]);

  return (
    <>
      <PageHeader
        title="Incident Management"
        description="Correlated incidents with ownership, status, and linked alerts."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Operations" }, { label: "Incident Management" }]}
      />
      <MockDataNotice className="mb-4" />
      <Card>
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search incidents"
          searchPlaceholder="ID, title, owner, or affected entity"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[
            { id: "severity", label: "Severity", value: values.severity, options: severityOptions, onChange: (severity) => setValues({ severity }) },
            { id: "status", label: "Status", value: values.status, options: statusOptions, onChange: (status) => setValues({ status }) },
            { id: "timeRange", label: "Created", value: values.timeRange, options: timeRangeOptions, onChange: (timeRange) => setValues({ timeRange }) },
          ]}
        />
        <AsyncView state={state} errorTitle="Could not load incidents" loading={<LoadingState rows={6} className="p-4" />}>
          {(result) => (
            <>
              <DataTable
                caption="Incidents"
                columns={columns}
                rows={result.items}
                getRowId={(incident) => incident.id}
                onRowClick={(incident) => navigate(`/incidents/${incident.id}`)}
                sort={{ key: values.sortBy, direction: values.sortDirection as SortDirection }}
                onSortChange={(key) =>
                  setValues({ sortBy: key, sortDirection: values.sortBy === key && values.sortDirection === "desc" ? "asc" : "desc" })
                }
                refreshing={state.status === "loading"}
                emptyState={
                  <EmptyState
                    icon={FolderKanban}
                    title={isFiltered ? "No incidents match these filters" : "No incidents yet"}
                    bordered={false}
                  />
                }
              />
              {result.total > 0 && (
                <Pagination
                  page={result.page}
                  pageSize={result.pageSize}
                  total={result.total}
                  itemLabel="incidents"
                  onPageChange={(next) => setValues({ page: String(next) })}
                />
              )}
            </>
          )}
        </AsyncView>
      </Card>
    </>
  );
}
