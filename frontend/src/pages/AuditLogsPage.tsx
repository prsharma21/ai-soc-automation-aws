import { useState } from "react";
import { ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuditEvent, AuditQuery } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { DetailDrawer, DrawerSection } from "@/components/common/DetailDrawer";
import { EmptyState } from "@/components/common/EmptyState";
import { KeyValueList } from "@/components/common/KeyValueList";
import { LoadingState } from "@/components/common/LoadingState";
import { Pagination } from "@/components/common/Pagination";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { useQueryState } from "@/hooks/useQueryState";
import { appConfig } from "@/lib/config";
import { actorTypeLabels, auditEventTypeLabels, auditOutcomeLabels, optionsFrom, timeRangeLabels } from "@/lib/labels";
import { auditService } from "@/services";

const PAGE_SIZE = 20;
const DEFAULTS = { search: "", eventType: "all", actorType: "all", outcome: "all", timeRange: "all", page: "1" };
const eventTypeOptions = optionsFrom(auditEventTypeLabels, "All events");
const actorOptions = optionsFrom(actorTypeLabels, "All actors");
const outcomeOptions = optionsFrom(auditOutcomeLabels, "All outcomes");
const timeRangeOptions = (Object.keys(timeRangeLabels) as (keyof typeof timeRangeLabels)[]).map((value) => ({
  value,
  label: timeRangeLabels[value],
}));

const columns: DataTableColumn<AuditEvent>[] = [
  { id: "time", header: "Time", cell: (event) => <Timestamp value={event.timestamp} pattern="MMM dd, HH:mm:ss" className="text-xs" /> },
  { id: "type", header: "Event", cell: (event) => <span className="whitespace-nowrap text-xs font-medium">{auditEventTypeLabels[event.eventType]}</span> },
  {
    id: "actor",
    header: "Actor",
    cell: (event) => (
      <span className="text-xs">
        {event.actor} <span className="text-muted-foreground">({actorTypeLabels[event.actorType]})</span>
      </span>
    ),
  },
  { id: "action", header: "Action", cell: (event) => <span className="block max-w-md truncate text-xs">{event.action}</span> },
  { id: "incident", header: "Incident", cell: (event) => <span className="font-mono text-xs">{event.incidentId ?? "—"}</span> },
  { id: "outcome", header: "Outcome", cell: (event) => <StatusBadge kind="outcome" value={event.outcome} /> },
];

function AuditDrawer({ event, onClose }: { event: AuditEvent | null; onClose: () => void }) {
  return (
    <DetailDrawer
      open={event !== null}
      onOpenChange={(open) => !open && onClose()}
      title={event ? auditEventTypeLabels[event.eventType] : "Audit event"}
      description={event?.id}
      badges={event && <StatusBadge kind="outcome" value={event.outcome} />}
    >
      {event && (
        <>
          <p className="text-sm">{event.action}</p>
          <KeyValueList
            items={[
              { label: "Timestamp", value: <Timestamp value={event.timestamp} pattern="yyyy-MM-dd HH:mm:ss" /> },
              { label: "Actor", value: `${event.actor} (${actorTypeLabels[event.actorType]})` },
              { label: "Environment", value: event.environment },
              {
                label: "Incident",
                value: event.incidentId ? (
                  <Link to={`/incidents/${event.incidentId}`} className="text-primary hover:underline">
                    {event.incidentId}
                  </Link>
                ) : (
                  "—"
                ),
              },
              {
                label: "Investigation",
                value: event.investigationId ? (
                  <Link to={`/investigations/${event.investigationId}`} className="text-primary hover:underline">
                    {event.investigationId}
                  </Link>
                ) : (
                  "—"
                ),
              },
            ]}
          />
          <DrawerSection title="Details">
            {Object.keys(event.details).length === 0 ? (
              <p className="text-xs text-muted-foreground">No additional details.</p>
            ) : (
              <KeyValueList columns={1} items={Object.entries(event.details).map(([label, value]) => ({ label, value: value || "—" }))} />
            )}
          </DrawerSection>
        </>
      )}
    </DetailDrawer>
  );
}

export default function AuditLogsPage() {
  const version = useDataVersion();
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const query: AuditQuery = {
    search: values.search,
    eventType: values.eventType as AuditQuery["eventType"],
    actorType: values.actorType as AuditQuery["actorType"],
    outcome: values.outcome as AuditQuery["outcome"],
    timeRange: values.timeRange as AuditQuery["timeRange"],
    page: Math.max(1, Number(values.page) || 1),
    pageSize: PAGE_SIZE,
  };
  const state = useAsync(() => auditService.list(query), [JSON.stringify(query), version]);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Record of alert ingestion, agent activity, tool calls, approvals, and simulated response actions."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Governance" }, { label: "Audit Logs" }]}
      />
      <p className="mb-4 text-xs text-muted-foreground">
        {appConfig.useMockData
          ? "Mock mode: audit events are synthetic and analyst actions are stored in this browser, where they can be reset from Settings. They are not tamper-proof."
          : "Displayed as returned by the backend. Retention and tamper-evidence are enforced server-side, not by this interface."}
      </p>
      <Card>
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search audit events"
          searchPlaceholder="Actor, action, incident, or investigation ID"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[
            { id: "eventType", label: "Event", value: values.eventType, options: eventTypeOptions, onChange: (eventType) => setValues({ eventType }) },
            { id: "actorType", label: "Actor", value: values.actorType, options: actorOptions, onChange: (actorType) => setValues({ actorType }) },
            { id: "outcome", label: "Outcome", value: values.outcome, options: outcomeOptions, onChange: (outcome) => setValues({ outcome }) },
            { id: "timeRange", label: "Time range", value: values.timeRange, options: timeRangeOptions, onChange: (timeRange) => setValues({ timeRange }) },
          ]}
        />
        <AsyncView state={state} errorTitle="Could not load audit events" loading={<LoadingState rows={8} className="p-4" />}>
          {(result) => (
            <>
              <DataTable
                caption="Audit events"
                columns={columns}
                rows={result.items}
                getRowId={(event) => event.id}
                onRowClick={setSelected}
                refreshing={state.status === "loading"}
                emptyState={<EmptyState icon={ScrollText} title={isFiltered ? "No audit events match these filters" : "No audit events"} bordered={false} />}
              />
              {result.total > 0 && (
                <Pagination
                  page={result.page}
                  pageSize={result.pageSize}
                  total={result.total}
                  itemLabel="events"
                  onPageChange={(next) => setValues({ page: String(next) })}
                />
              )}
            </>
          )}
        </AsyncView>
      </Card>
      <AuditDrawer event={selected} onClose={() => setSelected(null)} />
    </>
  );
}
