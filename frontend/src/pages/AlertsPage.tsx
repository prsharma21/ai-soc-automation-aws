import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AlertQuery, AlertSortKey, SortDirection } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { Pagination } from "@/components/common/Pagination";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { alertColumns } from "@/components/alerts/alertColumns";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { alertStatusLabels, categoryLabels, optionsFrom, severityLabels, timeRangeLabels } from "@/lib/labels";
import { alertService } from "@/services";

const PAGE_SIZE = 15;

const DEFAULTS = {
  search: "",
  severity: "all",
  category: "all",
  status: "all",
  timeRange: "all",
  sortBy: "detectedAt",
  sortDirection: "desc",
  page: "1",
};

const severityOptions = optionsFrom(severityLabels, "All severities");
const categoryOptions = optionsFrom(categoryLabels, "All categories");
const statusOptions = optionsFrom(alertStatusLabels, "All statuses");
const timeRangeOptions = (Object.keys(timeRangeLabels) as (keyof typeof timeRangeLabels)[]).map((value) => ({
  value,
  label: timeRangeLabels[value],
}));

export default function AlertsPage() {
  const navigate = useNavigate();
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const page = Math.max(1, Number(values.page) || 1);

  const query: AlertQuery = {
    search: values.search,
    severity: values.severity as AlertQuery["severity"],
    category: values.category as AlertQuery["category"],
    status: values.status as AlertQuery["status"],
    timeRange: values.timeRange as AlertQuery["timeRange"],
    sortBy: values.sortBy as AlertSortKey,
    sortDirection: values.sortDirection as SortDirection,
    page,
    pageSize: PAGE_SIZE,
  };

  const state = useAsync(() => alertService.list(query), [JSON.stringify(query)]);

  function handleSort(key: string) {
    const direction = values.sortBy === key && values.sortDirection === "desc" ? "asc" : "desc";
    setValues({ sortBy: key, sortDirection: direction });
  }

  return (
    <>
      <PageHeader
        title="Security Alerts"
        description="Triage detections, filter by severity and status, and open an alert to start an investigation."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Operations" }, { label: "Security Alerts" }]}
      />
      <MockDataNotice className="mb-4" />
      <Card>
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search alerts"
          searchPlaceholder="ID, title, user, host, or IP"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[
            { id: "severity", label: "Severity", value: values.severity, options: severityOptions, onChange: (severity) => setValues({ severity }) },
            { id: "category", label: "Category", value: values.category, options: categoryOptions, onChange: (category) => setValues({ category }) },
            { id: "status", label: "Status", value: values.status, options: statusOptions, onChange: (status) => setValues({ status }) },
            { id: "timeRange", label: "Time range", value: values.timeRange, options: timeRangeOptions, onChange: (timeRange) => setValues({ timeRange }) },
          ]}
        />
        <AsyncView state={state} errorTitle="Could not load alerts" loading={<LoadingState rows={8} className="p-4" />}>
          {(result) => (
            <>
              <DataTable
                caption="Security alerts"
                columns={alertColumns}
                rows={result.items}
                getRowId={(alert) => alert.id}
                onRowClick={(alert) => navigate(`/alerts/${alert.id}`)}
                sort={{ key: values.sortBy, direction: values.sortDirection as SortDirection }}
                onSortChange={handleSort}
                refreshing={state.status === "loading"}
                emptyState={
                  <EmptyState
                    icon={ShieldAlert}
                    title={isFiltered ? "No alerts match these filters" : "No alerts yet"}
                    description={isFiltered ? "Try widening the time range or clearing filters." : undefined}
                    bordered={false}
                  />
                }
              />
              {result.total > 0 && (
                <Pagination
                  page={result.page}
                  pageSize={result.pageSize}
                  total={result.total}
                  itemLabel="alerts"
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
