# Backend

Minimal FastAPI service. Only `GET /health` exists so far; agents, orchestration, and AWS integrations are added in later phases.

## Setup (Python 3.11+)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check it with `curl http://127.0.0.1:8000/health` or open http://127.0.0.1:8000/docs.

## Test

```powershell
python -m pytest
```

## Configuration

Read from environment variables (see the root `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `ai-soc-automation-aws` | Service name in API metadata and `/health` |
| `APP_ENV` | `development` | Deployment environment label |
| `BACKEND_CORS_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed to call the API (the Vite dev server) |

Use IAM roles or AWS Secrets Manager for credentials; never put AWS keys in `.env` files.

## Layout

```
app/
  api/routes/     HTTP route modules
  core/           configuration
  models/         Pydantic schemas
  services/       domain services
  agents/         LangGraph agent nodes
  orchestration/  LangGraph workflow wiring
  tools/          agent tools (SIEM, identity, asset, response clients)
tests/
```
