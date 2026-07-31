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
APP_ACCESS_PASSWORD=replace-with-a-long-random-password
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
```

Never commit this file. Never put real API keys or real access passwords into docs.

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

## 10. Update Deployment

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

## 11. Backup

Before every update, back up runtime data:

```bash
backup_dir=/opt/beichen-agent/backups/$(date +%Y%m%d-%H%M%S)
sudo mkdir -p "$backup_dir"
sudo cp -r /opt/beichen-agent/runtime/data "$backup_dir/"
sudo cp -r /opt/beichen-agent/runtime/uploads "$backup_dir/"
sudo cp -r /opt/beichen-agent/runtime/vector_store "$backup_dir/"
```

Remember: `vector_store` JSON files contain document chunk text. Treat them as private data.

## 12. Rollback

```bash
cd /opt/beichen-agent/app
git log --oneline -5
sudo -u www-data git checkout <stable-commit>
```

Then rebuild frontend and restart backend using the update steps above.

If runtime data was damaged, restore from `/opt/beichen-agent/backups`.

## 13. Troubleshooting

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
- `401`: access password is missing or wrong.
- RAG answer fails: check API keys, embedding settings, vector_store path, and backend logs.

## 14. Security Boundary

This deployment is still an MVP:

- It has shared access password protection, not a real user system.
- It has no per-user isolation.
- It has no rate limit.
- It uses SQLite and local files.
- It is suitable for personal or trusted small-scope trials, not public high-traffic use.
