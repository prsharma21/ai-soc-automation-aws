# ai-soc-automation-aws

## Repository layout

```
frontend/             React SOC console (Vite)
backend/              FastAPI service (see backend/README.md)
mock-services/        simulated SIEM, identity, asset and response APIs
data/                 synthetic logs, alerts and threat indicators
security-knowledge/   RAG corpus: incident response, playbooks, policies, threat intel
tests/                cross-service unit, integration and evaluation tests
infra/terraform/      AWS infrastructure (modules, environments/dev)
scripts/, docs/
```

Copy `.env.example` to `.env` for local configuration. AWS credentials come from IAM roles or AWS SSO profiles, never from `.env` files.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/health
python -m pytest
```

## Frontend

React + TypeScript + Vite SOC console (Tailwind CSS, shadcn/ui, Recharts, React Router). By default it runs entirely on deterministic synthetic data in the browser; every response action is simulated.

```bash
cd frontend
cp .env.example .env.local   # optional; defaults to mock data
npm install
npm run dev                  # http://localhost:5173
npm run typecheck
npm run lint
npm test
npm run build                # typecheck + production build (dist/)
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI base URL |
| `VITE_USE_MOCK_DATA` | `true` | `true` serves synthetic data from the browser; `false` calls the backend. Live failures are shown as errors and never replaced with mock data. |

`VITE_*` values are embedded in the browser bundle, so never put credentials or tokens in them.

### Backend contract (live mode)

JSON bodies use the camelCase shapes in `frontend/src/types`.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/health` | any 2xx |
| GET | `/api/dashboard/summary` | `DashboardSummary` |
| GET | `/api/alerts`, `/api/alerts/{id}` | `PaginatedResponse<SecurityAlert>`, `AlertDetail` |
| GET | `/api/incidents`, `/api/incidents/{id}` | `PaginatedResponse<Incident>`, `IncidentDetail` |
| GET / POST | `/api/incidents/{id}/report` | `IncidentReport` (GET 404 = none yet) |
| GET | `/api/investigations`, `/api/investigations/{id}` | `Investigation[]`, `InvestigationDetail` |
| POST | `/api/investigations` `{ alertId }` | `StartInvestigationResult` |
| GET | `/api/threat-intel/indicators`, `/api/threat-intel/indicators/{id}` | `ThreatIndicator[]`, `IndicatorDetail` |
| GET | `/api/approvals?status=` | `ResponseRecommendation[]` |
| POST | `/api/approvals/{id}/decision` `{ decision, note }` | `ResponseRecommendation` |
| GET | `/api/playbooks`, `/api/playbooks/{id}`, `/api/rag/retrievals` | `Playbook[]`, `Playbook`, `RetrievedDocument[]` |
| GET | `/api/evaluations/runs` | `EvaluationRun[]` |
| GET | `/api/audit-events` | `PaginatedResponse<AuditEvent>` |
| GET | `/api/notifications` | `HeaderNotification[]` |

The approval UI is not a security boundary: the backend must authorise and enforce approval before executing any response action.
