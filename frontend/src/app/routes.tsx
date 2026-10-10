import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoadingState } from "@/components/common/LoadingState";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AlertsPage = lazy(() => import("@/pages/AlertsPage"));
const AlertDetailsPage = lazy(() => import("@/pages/AlertDetailsPage"));
const IncidentsPage = lazy(() => import("@/pages/IncidentsPage"));
const IncidentDetailsPage = lazy(() => import("@/pages/IncidentDetailsPage"));
const InvestigationsPage = lazy(() => import("@/pages/InvestigationsPage"));
const InvestigationDetailsPage = lazy(() => import("@/pages/InvestigationDetailsPage"));
const ThreatIntelligencePage = lazy(() => import("@/pages/ThreatIntelligencePage"));
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"));
const PlaybooksPage = lazy(() => import("@/pages/PlaybooksPage"));
const EvaluationsPage = lazy(() => import("@/pages/EvaluationsPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

function page(element: ReactNode) {
  return <Suspense fallback={<PageLoadingState />}>{element}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={page(<DashboardPage />)} />
        <Route path="alerts" element={page(<AlertsPage />)} />
        <Route path="alerts/:alertId" element={page(<AlertDetailsPage />)} />
        <Route path="incidents" element={page(<IncidentsPage />)} />
        <Route path="incidents/:incidentId" element={page(<IncidentDetailsPage />)} />
        <Route path="investigations" element={page(<InvestigationsPage />)} />
        <Route path="investigations/:investigationId" element={page(<InvestigationDetailsPage />)} />
        <Route path="threat-intelligence" element={page(<ThreatIntelligencePage />)} />
        <Route path="approvals" element={page(<ApprovalsPage />)} />
        <Route path="playbooks" element={page(<PlaybooksPage />)} />
        <Route path="evaluations" element={page(<EvaluationsPage />)} />
        <Route path="audit-logs" element={page(<AuditLogsPage />)} />
        <Route path="settings" element={page(<SettingsPage />)} />
        <Route path="*" element={page(<NotFoundPage />)} />
      </Route>
    </Routes>
  );
}
