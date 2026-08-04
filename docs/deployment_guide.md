# Beichen Agent VPS Deployment Guide

This guide is for a low-cost Ubuntu VPS deployment. It does not add AI features, change the RAG chain, or change the database schema.

## 1. Target Shape

```text
Browser
  -> https://example.com
  -> Nginx
     -> frontend_dist for the React app
     -> 127.0.0.1:8000 for FastAPI /api and /health
```

Runtime data stays on the server:

```text
/opt/beichen-agent/runtime/data
/opt/beichen-agent/runtime/uploads
/opt/beichen-agent/runtime/vector_store
```

Do not expose these runtime directories through Nginx.

## 2. Server Preparation

Recommended server:

- Ubuntu 22.04 LTS or 24.04 LTS
- 1-2 CPU cores
- 2 GB RAM
- 40 GB disk

Install base packages:

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip nodejs npm certbot python3-certbot-nginx
```

## 3. Directory Layout

```bash
sudo mkdir -p /opt/beichen-agent/app
sudo mkdir -p /opt/beichen-agent/frontend_dist
sudo mkdir -p /opt/beichen-agent/runtime/data
sudo mkdir -p /opt/beichen-agent/runtime/uploads
sudo mkdir -p /opt/beichen-agent/runtime/vector_store
sudo mkdir -p /opt/beichen-agent/logs
sudo mkdir -p /opt/beichen-agent/backups
sudo chown -R www-data:www-data /opt/beichen-agent
```

Clone the project:

```bash
cd /opt/beichen-agent
sudo -u www-data git clone https://github.com/Doran633/Endless.git app
```

## 4. Production Environment File

Create:

```text
/opt/beichen-agent/runtime/backend.env
```

Example:

```env
APP_NAME=Beichen Agent Backend
# Prefer invite codes for small-scope trials.
APP_INVITE_CODES=replace-with-six-digit-code,replace-with-another-code
APP_ACCESS_PASSWORD=
APP_ACCESS_HEADER=X-Beichen-Access

LLM_PROVIDER=openai
LLM_MODEL=replace-with-your-chat-model
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=replace-with-your-real-key
OPENAI_BASE_URL=https://api.example.com/v1

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=replace-with-your-embedding-model
EMBEDDING_DIMENSION=1536
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=replace-with-your-real-key
EMBEDDING_BASE_URL=https://api.example.com/v1

DATABASE_PATH=/opt/beichen-agent/runtime/data/beichen.db
UPLOAD_DIR=/opt/beichen-agent/runtime/uploads
VECTOR_STORE_DIR=/opt/beichen-agent/runtime/vector_store
MAX_UPLOAD_SIZE_MB=20
ALLOWED_UPLOAD_EXTENSIONS=txt,pdf,docx

LOG_LEVEL=INFO
LOG_TO_FILE=true
LOG_DIR=/opt/beichen-agent/logs
```

Never commit this file. Never put real API keys, real invite codes, or real access passwords into docs.

## 5. Backend Setup

```bash
cd /opt/beichen-agent/app/backend
sudo -u www-data python3 -m venv /opt/beichen-agent/venv
sudo -u www-data /opt/beichen-agent/venv/bin/pip install -r requirements.txt
sudo -u www-data /opt/beichen-agent/venv/bin/python -m compileall app
```

Manual test:

```bash
sudo -u www-data /opt/beichen-agent/venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/health
```

Stop the manual Uvicorn process before enabling systemd.

## 6. systemd Backend Service

```bash
sudo cp /opt/beichen-agent/app/deploy/systemd/beichen-agent.service.example /etc/systemd/system/beichen-agent.service
sudo systemctl daemon-reload
sudo systemctl enable beichen-agent
sudo systemctl start beichen-agent
sudo systemctl status beichen-agent
```

Logs:

```bash
tail -f /opt/beichen-agent/logs/backend.log
tail -f /opt/beichen-agent/logs/backend.err.log
journalctl -u beichen-agent -f
```

## 7. Frontend Build

The recommended production mode uses same-origin API requests, so `VITE_API_BASE_URL` can stay empty.

```bash
cd /opt/beichen-agent/app/frontend
sudo -u www-data npm install
sudo -u www-data npm run build
sudo rm -rf /opt/beichen-agent/frontend_dist/*
sudo cp -r dist/* /opt/beichen-agent/frontend_dist/
sudo chown -R www-data:www-data /opt/beichen-agent/frontend_dist
```

## 8. Nginx

Copy the example and replace `example.com` with your real domain:

```bash
sudo cp /opt/beichen-agent/app/deploy/nginx/beichen-agent.conf.example /etc/nginx/sites-available/beichen-agent
sudo nano /etc/nginx/sites-available/beichen-agent
sudo ln -s /etc/nginx/sites-available/beichen-agent /etc/nginx/sites-enabled/beichen-agent
sudo nginx -t
sudo systemctl reload nginx
```

Nginx responsibilities:

- Serve `/opt/beichen-agent/frontend_dist` for the React app.
- Forward `/api/` to FastAPI on `127.0.0.1:8000`.
- Forward `/health` to FastAPI for health checks.
- Avoid exposing `runtime/data`, `runtime/uploads`, or `runtime/vector_store`.

## 9. Domain and HTTPS

In your domain provider, create an A record:

```text
host: @ or agent
value: your VPS public IP
```

After DNS resolves:

```bash
sudo certbot --nginx -d example.com
```

HTTPS is required for public use because the access password, chat content, and uploaded files should not travel over plain HTTP.

## 10. Semi-Automated Update Deployment

After v1.7.5, the recommended update path is to push code to GitHub from your local machine, then run one deployment script on the VPS.

Local machine:

```powershell
git status
git add .
git commit -m "your commit message"
git push origin main
```

VPS:

```bash
ssh root@your-server-ip
cd /opt/beichen-agent/app
sudo bash deploy/scripts/deploy-vps.sh.example
```

The script does the following:

1. Checks required directories and commands.
2. Confirms the server Git working tree is clean.
3. Shows the current commit.
4. Creates a runtime backup by default.
5. Pulls `origin/main`.
6. Installs backend dependencies.
7. Runs backend `compileall`.
8. Installs frontend dependencies.
9. Builds frontend assets.
10. Publishes frontend `dist` to `/opt/beichen-agent/frontend_dist`.
11. Restarts the `beichen-agent` systemd service.
12. Checks `/health` and `/health/config`.
13. Runs `nginx -t`.
14. Reloads Nginx.

If you intentionally want to skip backup:

```bash
sudo bash deploy/scripts/deploy-vps.sh.example --skip-backup
```

If you also want to include recent logs in the backup:

```bash
sudo bash deploy/scripts/deploy-vps.sh.example --include-logs
```

Use `--skip-backup` only for low-risk redeploys. Runtime backups may contain uploaded documents, chunks, embeddings, and chat metadata, so keep them private.

The script is semi-automated, not full CI/CD:

- You still decide when to deploy.
- You still SSH into the server.
- It does not modify production `.env`.
- It does not change Nginx domain settings.
- It does not apply database migrations.
- It does not delete runtime data or backups.

## 11. Manual Update Deployment

Use this section when debugging the deployment script or when you want to run each step manually.

Before updating code, create a runtime backup:

```bash
cd /opt/beichen-agent/app
sudo bash deploy/scripts/backup-runtime.sh.example
```

If you also want to keep recent application logs:

```bash
sudo bash deploy/scripts/backup-runtime.sh.example --include-logs
```

Then update the application:

```bash
cd /opt/beichen-agent/app
sudo -u www-data git pull

cd backend
sudo -u www-data /opt/beichen-agent/venv/bin/pip install -r requirements.txt
sudo -u www-data /opt/beichen-agent/venv/bin/python -m compileall app

cd ../frontend
sudo -u www-data npm install
sudo -u www-data npm run build
sudo rm -rf /opt/beichen-agent/frontend_dist/*
sudo cp -r dist/* /opt/beichen-agent/frontend_dist/
sudo chown -R www-data:www-data /opt/beichen-agent/frontend_dist

sudo systemctl restart beichen-agent
sudo nginx -t
sudo systemctl reload nginx
```

## 12. Backup

Runtime data is private production data. It should not be committed to GitHub and should not be shared casually.

The required runtime backup set is:

```text
/opt/beichen-agent/runtime/data
/opt/beichen-agent/runtime/uploads
/opt/beichen-agent/runtime/vector_store
```

These three directories should be backed up together:

- `data` contains SQLite metadata, sessions, messages, and file status.
- `uploads` contains original uploaded documents.
- `vector_store` contains local JSON indexes, chunks, and embeddings.

If one of them is missing after restore, the app may show inconsistent state. For example, SQLite may still list a file while the original upload or vector index no longer exists.

Use the script template:

```bash
cd /opt/beichen-agent/app
sudo bash deploy/scripts/backup-runtime.sh.example
```

The script writes a timestamped archive to:

```text
/opt/beichen-agent/backups/
```

The archive name looks like:

```text
beichen-runtime-YYYYMMDD-HHMMSS.tar.gz
```

Optional logs backup:

```bash
sudo bash deploy/scripts/backup-runtime.sh.example --include-logs
```

Remember: `uploads` and `vector_store` may contain document text. Treat backup archives as private data.

## 13. Restore Runtime Data

Restore only when needed. Restore will overwrite current runtime data.

Before restoring:

1. Confirm the backup archive is the one you want.
2. Understand that current SQLite, uploads, and vector_store data will be replaced.
3. Avoid restoring during active user testing.

Run:

```bash
cd /opt/beichen-agent/app
sudo bash deploy/scripts/restore-runtime.sh.example /opt/beichen-agent/backups/beichen-runtime-YYYYMMDD-HHMMSS.tar.gz
```

The restore script:

- Requires you to type `RESTORE`.
- Stops the `beichen-agent` systemd service.
- Creates a safety pre-restore archive when possible.
- Extracts runtime data back into `/opt/beichen-agent/runtime`.
- Fixes ownership to `www-data:www-data`.
- Starts the backend service again.

After restore, verify:

```bash
sudo systemctl status beichen-agent
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/health/config
```

Then check the web UI:

- File list can be loaded.
- Existing sessions can be loaded.
- Indexed files can still answer RAG questions.

## 14. Rollback Code

```bash
cd /opt/beichen-agent/app
git log --oneline -5
sudo -u www-data git checkout <stable-commit>
```

Then rebuild frontend and restart backend using the update steps above.

If runtime data was also damaged, restore from `/opt/beichen-agent/backups` using the restore script above.

## 15. Troubleshooting

```bash
sudo systemctl status beichen-agent
journalctl -u beichen-agent -f
tail -f /opt/beichen-agent/logs/backend.err.log
sudo nginx -t
tail -f /var/log/nginx/error.log
curl http://127.0.0.1:8000/health
```

Common symptoms:

- `502 Bad Gateway`: backend is not running, systemd failed, or port 8000 is unavailable.
- `404 on refresh`: Nginx SPA fallback is missing.
- `413 Payload Too Large`: Nginx `client_max_body_size` is too small.
- `401`: invite code or legacy access password is missing or wrong.
- RAG answer fails: check API keys, embedding settings, vector_store path, and backend logs.

## 16. Deployment Verification

After deployment, verify the server from the VPS:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/health/config
```

Then verify through Nginx:

```bash
curl https://example.com/health
curl https://example.com/health/config
```

Open the browser and test:

- Invite code entry.
- Normal chat.
- Upload a small TXT file.
- Automatic parsing, chunking, embedding, and indexing.
- Single-file RAG answer.

The Windows smoke test script is for local development. On Ubuntu VPS, use the curl checks above plus manual browser verification unless PowerShell is installed on the server.

## 17. Security Boundary

This deployment is still an MVP:

- It has invite code protection, not a real user system.
- It has anonymous browser-level `client_id` isolation, not a formal account system.
- It has no rate limit.
- It uses SQLite and local files.
- It is suitable for personal or trusted small-scope trials, not public high-traffic use.
