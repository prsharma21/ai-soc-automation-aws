import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  FolderOpen,
  RotateCw,
  ScrollText,
  ShieldAlert,
  Timer,
  TimerReset,
  Radar,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { AsyncView } from "@/components/common/AsyncView";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { MockDataNotice } from "@/components/common/MockDataNotice";
import { SectionCard } from "@/components/common/SectionCard";
import { SeverityBadge, SeverityDot } from "@/components/common/SeverityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Timestamp } from "@/components/common/Timestamp";
import { AlertVolumeChart } from "@/components/charts/AlertVolumeChart";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { IncidentStatusChart } from "@/components/charts/IncidentStatusChart";
import { SeverityDistributionChart } from "@/components/charts/SeverityDistributionChart";
import { useAsync } from "@/hooks/useAsync";
import { useDataVersion } from "@/hooks/useDataVersion";
import { agentNames } from "@/lib/agents";
import { appConfig } from "@/lib/config";
import { formatMinutes, formatNumber } from "@/lib/format";
import { dashboardService } from "@/services";
import { PageLoadingState } from "@/components/common/LoadingState";

function ViewAll({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to} aria-label={label}>
        View all <ArrowRight />
      </Link>
    </Button>
  );
}

const quickActions = [
  { to: "/alerts?severity=critical", label: "Review critical alerts", icon: AlertOctagon },
  { to: "/approvals", label: "Open approval queue", icon: ClipboardCheck },
  { to: "/investigations?status=running", label: "Running investigations", icon: BrainCircuit },
  { to: "/threat-intelligence", label: "Search indicators", icon: Radar },
  { to: "/audit-logs", label: "Review audit log", icon: ScrollText },
];

function DashboardContent({ data }: { data: DashboardSummary }) {
  const { kpis } = data;
  return (
    <div className="space-y-5">
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Total alerts" value={formatNumber(kpis.totalAlerts)} icon={ShieldAlert} href="/alerts" hint="All time" />
        <MetricCard
          label="Critical"
          value={formatNumber(kpis.criticalAlerts)}
          icon={AlertOctagon}
          href="/alerts?severity=critical"
          accentClassName="bg-red-50 text-red-700"
        />
        <MetricCard
          label="High"
          value={formatNumber(kpis.highAlerts)}
          icon={AlertTriangle}
          href="/alerts?severity=high"
          accentClassName="bg-orange-50 text-orange-700"
        />
        <MetricCard
          label="Open incidents"
          value={formatNumber(kpis.openIncidents)}
          icon={FolderOpen}
          href="/incidents"
          hint="Not resolved or closed"
          accentClassName="bg-indigo-50 text-indigo-700"
        />
        <MetricCard label="MTTA" value={formatMinutes(kpis.mttaMinutes)} icon={Timer} hint="Mean time to acknowledge" />
        <MetricCard label="MTTR" value={formatMinutes(kpis.mttrMinutes)} icon={TimerReset} hint="Mean time to resolve" />
        <MetricCard
          label="Pending approvals"
          value={formatNumber(kpis.pendingApprovals)}
          icon={ClipboardCheck}
          href="/approvals"
          accentClassName="bg-amber-50 text-amber-700"
        />
      </section>

      <section aria-label="Charts" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AlertVolumeChart data={data.alertVolume} description="Daily alerts by severity, last 14 days (UTC)" />
        <SeverityDistributionChart data={data.severityDistribution} />
        <CategoryChart data={data.categoryDistribution} />
        <IncidentStatusChart data={data.incidentStatus} />
        <SectionCard title="Quick actions">
          <ul className="space-y-1">
            {quickActions.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section aria-label="Activity" className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Recent alerts" actions={<ViewAll to="/alerts" label="View all alerts" />} flush>
          <ul className="divide-y">
            {data.recentAlerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  to={`/alerts/${alert.id}`}
                  className="flex items-center gap-3 px-5 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <SeverityDot severity={alert.severity} />
                  <span className="font-mono text-xs text-muted-foreground">{alert.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{alert.title}</span>
                  <StatusBadge kind="alert" value={alert.status} className="hidden sm:inline-flex" />
                  <Timestamp value={alert.detectedAt} relative className="text-2xs text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Latest incidents" actions={<ViewAll to="/incidents" label="View all incidents" />} flush>
          <ul className="divide-y">
            {data.latestIncidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  to={`/incidents/${incident.id}`}
                  className="flex items-center gap-3 px-5 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{incident.title}</span>
                  <SeverityBadge severity={incident.severity} className="hidden sm:inline-flex" />
                  <StatusBadge kind="incident" value={incident.status} />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Active investigations" actions={<ViewAll to="/investigations" label="View all investigations" />} flush>
          {data.activeInvestigations.length === 0 ? (
            <EmptyState title="No active investigations" bordered={false} className="py-6" />
          ) : (
            <ul className="divide-y">
              {data.activeInvestigations.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/investigations/${item.id}`}
                    className="flex items-center gap-3 px-5 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {item.title}
                      {item.currentAgent && (
                        <span className="block text-2xs text-muted-foreground">At: {agentNames[item.currentAgent]}</span>
                      )}
                    </span>
                    <StatusBadge kind="investigation" value={item.status} showIcon />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Pending approvals" actions={<ViewAll to="/approvals" label="View approval queue" />} flush>
          {data.pendingApprovals.length === 0 ? (
            <EmptyState title="Nothing awaiting approval" bordered={false} className="py-6" />
          ) : (
            <ul className="divide-y">
              {data.pendingApprovals.map((rec) => (
                <li key={rec.id}>
                  <Link
                    to="/approvals"
                    className="flex items-center gap-3 px-5 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <SeverityDot severity={rec.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{rec.id}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {rec.action} <span className="text-muted-foreground">· {rec.target}</span>
                    </span>
                    <span className="text-2xs text-muted-foreground">{rec.incidentId}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent analyst actions"
          actions={<ViewAll to="/audit-logs?actorType=analyst" label="View analyst audit events" />}
          flush
          className="xl:col-span-2"
        >
          {data.recentAnalystActions.length === 0 ? (
            <EmptyState title="No analyst actions recorded" bordered={false} className="py-6" />
          ) : (
            <ul className="divide-y">
              {data.recentAnalystActions.map((event) => (
                <li key={event.id} className="flex items-center gap-3 px-5 py-2 text-sm">
                  <StatusBadge kind="outcome" value={event.outcome} />
                  <span className="min-w-0 flex-1 truncate">{event.action}</span>
                  <span className="hidden text-xs text-muted-foreground md:inline">{event.actor}</span>
                  <Timestamp value={event.timestamp} relative className="text-2xs text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const version = useDataVersion();
  const state = useAsync(() => dashboardService.getSummary(), [version]);

  return (
    <>
      <PageHeader
        title="SOC Overview"
        description="Alert, incident, investigation, and approval activity at a glance."
        meta={<DataModeBadge />}
        actions={
          <Button variant="outline" size="sm" onClick={state.reload} disabled={state.status === "loading"}>
            <RotateCw className={state.status === "loading" ? "animate-spin" : undefined} /> Refresh
          </Button>
        }
      />
      <MockDataNotice className="mb-4">
        Metrics are computed in the browser from synthetic demonstration data. They do not come from live systems.
      </MockDataNotice>
      <AsyncView state={state} errorTitle={`Could not load the dashboard from ${appConfig.apiBaseUrl}`} loading={<PageLoadingState />}>
        {(data) => <DashboardContent data={data} />}
      </AsyncView>
    </>
  );
}
