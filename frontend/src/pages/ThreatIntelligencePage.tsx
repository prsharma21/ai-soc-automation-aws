import { useState } from "react";
import { Radar } from "lucide-react";
import { Link } from "react-router-dom";
import type { IndicatorClassification, IndicatorQuery, ThreatIndicator } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { DetailDrawer, DrawerSection } from "@/components/common/DetailDrawer";
import { EmptyState } from "@/components/common/EmptyState";
import { KeyValueList } from "@/components/common/KeyValueList";
import { LoadingState } from "@/components/common/LoadingState";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { SeverityDot } from "@/components/common/SeverityBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { indicatorClassificationLabels, indicatorTypeLabels, optionsFrom } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { threatIntelligenceService } from "@/services";

const DEFAULTS = { search: "", type: "all", classification: "all" };
const typeOptions = optionsFrom(indicatorTypeLabels, "All types");
const classificationOptions = optionsFrom(indicatorClassificationLabels, "All classifications");

const classificationClass: Record<IndicatorClassification, string> = {
  test_malicious: "bg-red-50 text-red-700 ring-red-200",
  test_suspicious: "bg-amber-50 text-amber-800 ring-amber-200",
  test_benign: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  unclassified: "bg-slate-100 text-slate-700 ring-slate-200",
};

function ClassificationBadge({ value }: { value: IndicatorClassification }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", classificationClass[value])}>
      {indicatorClassificationLabels[value]}
    </span>
  );
}

const columns: DataTableColumn<ThreatIndicator>[] = [
  { id: "value", header: "Indicator", cell: (item) => <span className="block max-w-[18rem] truncate font-mono text-xs font-semibold">{item.value}</span> },
  { id: "type", header: "Type", cell: (item) => <span className="text-xs">{indicatorTypeLabels[item.type]}</span> },
  { id: "classification", header: "Classification", cell: (item) => <ClassificationBadge value={item.classification} /> },
  { id: "alerts", header: "Alerts", cell: (item) => <span className="tabular-nums">{item.relatedAlertIds.length}</span> },
  { id: "first", header: "First seen", cell: (item) => <Timestamp value={item.firstSeen} className="text-xs" /> },
  { id: "last", header: "Last seen", cell: (item) => <Timestamp value={item.lastSeen} relative className="text-xs" /> },
  { id: "source", header: "Source", cell: (item) => <span className="text-xs">{item.source}</span> },
];

function IndicatorDrawer({ indicatorId, onClose }: { indicatorId: string | null; onClose: () => void }) {
  const state = useAsync(() => (indicatorId ? threatIntelligenceService.get(indicatorId) : Promise.resolve(null)), [indicatorId]);
  const indicator = state.data?.indicator;

  return (
    <DetailDrawer
      open={indicatorId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={indicator?.value ?? indicatorId ?? "Indicator"}
      description={indicator ? `${indicator.id} · ${indicatorTypeLabels[indicator.type]}` : undefined}
      badges={indicator && <ClassificationBadge value={indicator.classification} />}
    >
      <AsyncView state={state} errorTitle="Could not load indicator" loading={<LoadingState rows={4} />}>
        {(detail) =>
          detail && (
            <>
              <p className="text-sm">{detail.indicator.description}</p>
              <KeyValueList
                items={[
                  { label: "Source", value: detail.indicator.source },
                  { label: "Synthetic", value: detail.indicator.synthetic ? "Yes — test indicator" : "No" },
                  { label: "First seen", value: <Timestamp value={detail.indicator.firstSeen} /> },
                  { label: "Last seen", value: <Timestamp value={detail.indicator.lastSeen} /> },
                ]}
              />
              <DrawerSection title="Reputation">
                <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  Not checked. No external reputation service is connected; the classification above is a label on synthetic test data.
                </p>
              </DrawerSection>
              <DrawerSection title={`Related alerts (${detail.alerts.length})`}>
                {detail.alerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No alerts reference this indicator.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {detail.alerts.map((alert) => (
                      <li key={alert.id}>
                        <Link to={`/alerts/${alert.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60">
                          <SeverityDot severity={alert.severity} />
                          <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                          <span className="truncate">{alert.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </DrawerSection>
              <DrawerSection title="Investigation evidence">
                <EvidenceList items={detail.indicator.evidence} emptyLabel="No evidence references this indicator." />
              </DrawerSection>
            </>
          )
        }
      </AsyncView>
    </DetailDrawer>
  );
}

export default function ThreatIntelligencePage() {
  const { values, setValues, reset, isFiltered } = useQueryState(DEFAULTS);
  const [selected, setSelected] = useState<string | null>(null);
  const query: IndicatorQuery = {
    search: values.search,
    type: values.type as IndicatorQuery["type"],
    classification: values.classification as IndicatorQuery["classification"],
  };
  const state = useAsync(() => threatIntelligenceService.list(query), [query.search, query.type, query.classification]);

  return (
    <>
      <PageHeader
        title="Threat Intelligence"
        description="IP addresses, domains, and file hashes observed in alerts and investigations."
        meta={<DataModeBadge />}
        breadcrumbs={[{ label: "Intelligence & Response" }, { label: "Threat Intelligence" }]}
      />
      <MockDataNotice className="mb-4">
        Synthetic indicators only: documentation IP ranges (RFC 5737), reserved domains (.example, .test, .invalid), and the harmless EICAR test hash. No
        indicator has been checked against a live threat intelligence service.
      </MockDataNotice>
      <Card>
        <SearchAndFilters
          searchValue={values.search}
          onSearchChange={(search) => setValues({ search })}
          searchLabel="Search indicators"
          searchPlaceholder="IP, domain, hash, or ID"
          isFiltered={isFiltered}
          onClear={reset}
          filters={[
            { id: "type", label: "Type", value: values.type, options: typeOptions, onChange: (type) => setValues({ type }) },
            {
              id: "classification",
              label: "Classification",
              value: values.classification,
              options: classificationOptions,
              onChange: (classification) => setValues({ classification }),
            },
          ]}
        />
        <AsyncView state={state} errorTitle="Could not load indicators" loading={<LoadingState rows={6} className="p-4" />}>
          {(rows) => (
            <DataTable
              caption="Threat indicators"
              columns={columns}
              rows={rows}
              getRowId={(item) => item.id}
              onRowClick={(item) => setSelected(item.id)}
              refreshing={state.status === "loading"}
              emptyState={<EmptyState icon={Radar} title={isFiltered ? "No indicators match these filters" : "No indicators"} bordered={false} />}
            />
          )}
        </AsyncView>
      </Card>
      <IndicatorDrawer indicatorId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
