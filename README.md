# Beichen Agent

Beichen Agent is an independent web AI assistant MVP. It focuses on local and small-scope deployment for AI chat, file ingestion, single-file RAG question answering, and persistent conversations.

The project is designed for learning, iteration, and trusted small-group trials. It is not an enterprise permission system or a high-traffic production platform.

## Current Features

- Web chat with a real OpenAI-compatible LLM provider.
- Mock LLM provider for local development without API keys.
- File upload to the FastAPI backend.
- TXT, DOCX, and text-based PDF parsing.
- DOCX table text extraction.
- Text chunking.
- Mock and OpenAI-compatible embedding providers.
- Local JSON VectorStore.
- Single-file retrieval.
- Single-file RAG question answering.
- Chat-side file upload and automatic ingestion.
- Chat-side RAG question answering for the latest indexed file in the current session.
- Short context window for normal chat.
- RAG follow-up context for file question answering.
- SQLite persistence for files, processing status, chat sessions, and chat messages.
- Invite code access protection for small-scope public trials.
- Anonymous client isolation through `X-Beichen-Client-Id` for trusted public trials.
- Runtime config health check through `/health/config`.
- Request logging with `X-Request-Id`.
- Windows local check, start, stop, and smoke test scripts.
- Ubuntu VPS deployment templates for Nginx and systemd.

## Tech Stack

Frontend:

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand
- dayjs

Backend:

- Python 3
- FastAPI
- Pydantic
- SQLite
- SQLAlchemy
- python-dotenv
- python-multipart
- python-docx
- pypdf

Storage:

- `backend/data/` stores the SQLite database.
- `backend/uploads/` stores uploaded source files.
- `backend/vector_store/` stores local JSON vector indexes.
- `backend/logs/` can store local app logs when file logging is enabled.

These runtime directories are ignored by Git.

## Local Run

Install Python and Node.js first.

Install backend dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

Install frontend dependencies:

```powershell
cd frontend
npm install
```

Create backend config:

```powershell
copy backend\.env.example backend\.env
```

Check local environment:

```powershell
scripts\check-local.ps1
```

Start local services:

```powershell
scripts\start-local.ps1
```

Open:

```text
http://127.0.0.1:5173/
```

Stop local services:

```powershell
scripts\stop-local.ps1
```

Run a local smoke test after the services are started:

```powershell
scripts\smoke-test-local.ps1
```

Use the lower-cost mode when you do not want to call chat/RAG LLM endpoints:

```powershell
scripts\smoke-test-local.ps1 -SkipAiCalls
```

## Environment Configuration

Backend configuration is loaded from:

```text
backend/.env
```

Use this example as the starting point:

```text
backend/.env.example
```

Do not commit real API keys, invite codes, passwords, uploaded files, vector indexes, SQLite databases, or logs.

## Mock Mode

Mock mode is useful for UI and workflow checks without external API keys.

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

Mock mode does not represent real answer quality or semantic retrieval quality.

## Real API Mode

Use an OpenAI-compatible chat provider:

```env
LLM_PROVIDER=openai
LLM_MODEL=your-chat-model
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=replace-with-your-key
OPENAI_BASE_URL=https://api.example.com
```

Use an OpenAI-compatible embedding provider:

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=your-embedding-model
EMBEDDING_DIMENSION=1024
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=replace-with-your-key
EMBEDDING_BASE_URL=https://api.example.com/v1
```

If `EMBEDDING_API_KEY` or `EMBEDDING_BASE_URL` is empty, the backend falls back to `OPENAI_API_KEY` and `OPENAI_BASE_URL`.

## Invite Code Access

For small-scope public trials, configure invite codes:

```env
APP_ACCESS_HEADER=X-Beichen-Access
APP_INVITE_CODES=replace-with-code-one,replace-with-code-two
APP_ACCESS_PASSWORD=
```

`APP_INVITE_CODES` takes precedence over the legacy `APP_ACCESS_PASSWORD`. If both are empty, access protection is disabled for local development.

This is not a full login system. It does not provide accounts, roles, audit logs, JWT refresh tokens, or formal multi-user permission management. Anonymous `client_id` isolation only separates local browser data spaces for trusted trials.

## File Question Answering Flow

Recommended flow:

1. Start backend and frontend.
2. Open `http://127.0.0.1:5173/`.
3. Enter an invite code if access protection is enabled.
4. Upload a TXT, DOCX, or text-based PDF file in the chat input or file center.
5. Wait for automatic parsing, chunking, embedding, and vector-store indexing.
6. Ask questions about the indexed file in the chat window.
7. Continue asking follow-up questions in the same session.

When switching embedding providers or embedding models, re-index files so the stored vectors match the active embedding model.

## Windows Local Scripts

```text
scripts/check-local.ps1       Check local tools, config, and fixed ports.
scripts/start-local.ps1       Start backend and frontend on fixed local ports.
scripts/stop-local.ps1        Stop only LISTENING processes on fixed ports.
scripts/smoke-test-local.ps1  Verify local runtime health and main MVP flows.
```

Default local ports:

```text
Backend: 127.0.0.1:8000
Frontend: 127.0.0.1:5173
```

The scripts intentionally do not open backend port `8000` to the public internet. In production, Nginx should proxy to `127.0.0.1:8000`.

## VPS Deployment

Recommended MVP deployment shape:

```text
Browser
-> Nginx
   -> frontend static files
   -> FastAPI on 127.0.0.1:8000
-> systemd keeps the backend running
-> SQLite, uploads, vector_store, and logs stay on the server
```

Read:

- `docs/v1.6_vps_deployment_checklist.md`
- `docs/deployment_guide.md`
- `deploy/nginx/beichen-agent.conf.example`
- `deploy/systemd/beichen-agent.service.example`

Production environment variables should live outside the repository, for example:

```text
/opt/beichen-agent/runtime/backend.env
```

Use HTTPS before sharing the app publicly.

## Do Not Commit

Never commit:

- `backend/.env`
- `frontend/.env`
- `.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `backend/logs/`
- `.claude/`
- `node_modules/`
- `__pycache__/`
- `*.log`
- `*.db`
- `*.sqlite`
- `*.sqlite3`
- `*.zip`
- `release/`
- `local_trial_package/`

`backend/vector_store/` may contain document chunk text. Treat it as private runtime data.

## Current Limits

- Single-file RAG only.
- The current chat-side RAG flow binds the latest indexed file in the current session.
- No multi-file RAG.
- No enterprise login.
- No formal user accounts or role-based permission isolation.
- No multi-tenant architecture.
- No Agent workflow.
- No PPT generation.
- No OCR for scanned PDFs.
- No production vector database.
- SQLite is acceptable for MVP and small trusted trials, but not for high-concurrency production use.
- Local JSON VectorStore is suitable for MVP validation, not large-scale retrieval.

## Project Status

The project has completed the core single-file RAG MVP loop and has passed public IP deployment verification on a small Ubuntu VPS with Nginx, systemd, invite code protection, anonymous client isolation, logging, and smoke-test support. It is currently being hardened for small trusted trials, domain/HTTPS setup, and safer maintenance.
