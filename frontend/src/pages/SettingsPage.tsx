import { useId, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { HealthStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnvironmentBadge } from "@/components/layout/EnvironmentBadge";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { DataModeBadge } from "@/components/common/DataModeBadge";
import { KeyValueList } from "@/components/common/KeyValueList";
import { SectionCard } from "@/components/common/SectionCard";
import { Timestamp } from "@/components/common/Timestamp";
import { usePreferences } from "@/hooks/usePreferences";
import { appConfig, dataMode } from "@/lib/config";
import { notifyDataChanged } from "@/lib/dataEvents";
import type { TimeZonePreference } from "@/lib/format";
import type { TableDensity } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { demoDataService, healthService } from "@/services";

type FeatureState = "available" | "simulated" | "requires_backend" | "not_configured";

const featureStateLabel: Record<FeatureState, string> = {
  available: "Available",
  simulated: "Simulated",
  requires_backend: "Requires backend",
  not_configured: "Not configured",
};

const featureStateClass: Record<FeatureState, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  simulated: "bg-amber-50 text-amber-800 ring-amber-200",
  requires_backend: "bg-slate-100 text-slate-700 ring-slate-200",
  not_configured: "bg-slate-100 text-slate-700 ring-slate-200",
};

const mock = appConfig.useMockData;
const features: Array<{ name: string; state: FeatureState; note: string }> = [
  { name: "Alerts, incidents, audit data", state: mock ? "simulated" : "available", note: mock ? "Synthetic dataset generated in the browser." : "Read from the FastAPI backend." },
  { name: "LangGraph investigations", state: mock ? "simulated" : "requires_backend", note: "Workflow status is read from the investigation API; the frontend never runs agents." },
  { name: "Amazon Bedrock RAG retrieval", state: "requires_backend", note: "Retrieval and scores must come from a Bedrock Knowledge Base via the backend." },
  { name: "Amazon Bedrock AgentCore runtime", state: "requires_backend", note: "Agent hosting and invocation are backend concerns." },
  { name: "Response action execution", state: "simulated", note: "The frontend only records decisions. Execution must be enforced and performed by the backend." },
  { name: "Evaluation (e.g. DeepEval)", state: mock ? "simulated" : "requires_backend", note: "Sample values in mock mode; no evaluator runs in the browser." },
  { name: "Authentication & RBAC", state: "not_configured", note: "Demo identity only. Add an identity provider before any shared deployment." },
];

function HealthCard() {
  const [result, setResult] = useState<HealthStatus | null>(null);
  const [pending, setPending] = useState(false);

  async function handleTest() {
    setPending(true);
    try {
      setResult(await healthService.check());
    } finally {
      setPending(false);
    }
  }

  return (
    <SectionCard
      title="Backend connection"
      description={`Calls GET ${appConfig.apiBaseUrl}/health. This always uses the network, even in mock mode.`}
      actions={
        <Button size="sm" variant="outline" onClick={handleTest} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
        </Button>
      }
    >
      {result === null ? (
        <p className="text-sm text-muted-foreground">Not tested yet.</p>
      ) : (
        <div role="status" className={cn("flex gap-2 rounded-md border px-3 py-2 text-sm", result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800")}>
          {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-semibold">{result.ok ? "Backend reachable" : "Backend unreachable"}</p>
            <p className="text-xs">{result.detail}</p>
            <p className="text-2xs opacity-80">
              {result.latencyMs} ms · checked <Timestamp value={result.checkedAt} pattern="HH:mm:ss" />
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function DemoDataCard() {
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState(() => demoDataService.localChangeCount());

  function handleReset() {
    demoDataService.reset();
    setChanges(0);
    setOpen(false);
    notifyDataChanged();
    toast.success("Demo data reset", { description: "Synthetic data restored to its original state." });
  }

  return (
    <SectionCard
      title="Demo data"
      description="Approval decisions, started investigations, reports, and audit events you create are stored in this browser."
      actions={
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!demoDataService.available}>
          <RotateCcw /> Reset demo data
        </Button>
      }
    >
      <p className="text-sm">
        {demoDataService.available ? `${changes} locally recorded change${changes === 1 ? "" : "s"}.` : "Not applicable in live mode."}
      </p>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset demo data?"
        description="All decisions, investigations, reports, and audit events created in this browser will be discarded. Synthetic seed data is restored."
        confirmLabel="Reset"
        confirmVariant="destructive"
        onConfirm={handleReset}
      />
    </SectionCard>
  );
}

function PreferencesCard() {
  const { preferences, updatePreferences } = usePreferences();
  const tzId = useId();
  const densityId = useId();
  const sidebarId = useId();
  const themeId = useId();

  return (
    <SectionCard title="Display preferences" description="Saved in this browser only.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={tzId}>Time zone</Label>
          <NativeSelect
            id={tzId}
            value={preferences.timeZone}
            onChange={(event) => updatePreferences({ timeZone: event.target.value as TimeZonePreference })}
            options={[
              { value: "utc", label: "UTC" },
              { value: "local", label: "Browser local time" },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={densityId}>Table density</Label>
          <NativeSelect
            id={densityId}
            value={preferences.density}
            onChange={(event) => updatePreferences({ density: event.target.value as TableDensity })}
            options={[
              { value: "compact", label: "Compact" },
              { value: "comfortable", label: "Comfortable" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <Label htmlFor={sidebarId}>Collapse sidebar</Label>
          <Switch id={sidebarId} checked={preferences.sidebarCollapsed} onCheckedChange={(checked) => updatePreferences({ sidebarCollapsed: checked })} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
          <div>
            <Label htmlFor={themeId}>Dark theme</Label>
            <p id={`${themeId}-hint`} className="text-2xs text-muted-foreground">
              Not available yet: severity and status colours are only validated for contrast on the light theme.
            </p>
          </div>
          <Switch id={themeId} checked={false} disabled aria-describedby={`${themeId}-hint`} />
        </div>
      </div>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Application, environment, and display configuration." breadcrumbs={[{ label: "Governance" }, { label: "Settings" }]} />
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Application">
          <KeyValueList
            items={[
              { label: "Application", value: appConfig.appName },
              { label: "Version", value: appConfig.version },
              { label: "Environment", value: <EnvironmentBadge /> },
              { label: "Data mode", value: <DataModeBadge mode={dataMode} /> },
              { label: "API base URL", value: <span className="font-mono text-xs">{appConfig.apiBaseUrl}</span> },
              { label: "Request timeout", value: `${appConfig.requestTimeoutMs / 1000} s` },
            ]}
          />
          <p className="mt-4 text-2xs text-muted-foreground">
            Configured at build time with VITE_API_BASE_URL and VITE_USE_MOCK_DATA. The frontend stores no credentials, tokens, or AWS keys.
          </p>
        </SectionCard>
        <HealthCard />
        <PreferencesCard />
        <DemoDataCard />
        <SectionCard title="Feature status" className="xl:col-span-2" flush>
          <ul className="divide-y">
            {features.map((feature) => (
              <li key={feature.name} className="flex flex-col gap-1 px-5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm font-medium sm:w-64">{feature.name}</span>
                <span className={cn("w-fit rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", featureStateClass[feature.state])}>
                  {featureStateLabel[feature.state]}
                </span>
                <span className="text-xs text-muted-foreground sm:flex-1">{feature.note}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
