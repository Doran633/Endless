# 北辰agent

北辰agent 是一个独立网页版 AI 助手 MVP，当前聚焦个人本地试运行和单文件 RAG 问答。

当前已支持：

- AI 聊天
- 真实 LLM API 调用
- 文件上传
- TXT / DOCX / 可复制文本型 PDF 解析
- 文本切块
- Mock / OpenAI-compatible Embedding
- 本地 JSON VectorStore
- 单文件 Retrieval 检索
- 单文件 RAG 问答
- 聊天侧上传文件后直接基于文件提问
- 普通聊天短上下文
- RAG 文件问答连续追问
- SQLite + SQLAlchemy 文件、会话和消息持久化
- Windows 本地检查、启动和停止脚本

当前不包含：

- 企业登录
- 企业权限
- 多租户
- 多文件 RAG
- Agent Workflow
- PPT 生成
- 正式线上部署方案
- 生产级向量数据库

## 技术栈

Frontend:

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand

Backend:

- Python
- FastAPI
- Pydantic
- SQLite
- SQLAlchemy
- python-dotenv
- python-multipart
- python-docx
- pypdf

Storage:

- `backend/uploads/` 保存原始上传文件
- `backend/vector_store/` 保存本地 JSON 向量索引
- `backend/data/` 保存 SQLite 数据库

这些运行数据默认不会提交到 Git。

## Windows 推荐启动方式

第一次运行前，请先安装：

- Python
- Node.js / npm

然后安装依赖：

```powershell
cd backend
pip install -r requirements.txt
```

```powershell
cd frontend
npm install
```

复制后端配置：

```powershell
copy backend\.env.example backend\.env
```

检查环境：

```powershell
scripts\check-local.ps1
```

启动项目：

```powershell
scripts\start-local.ps1
```

访问：

```text
http://127.0.0.1:5173/
```

停止项目：

```powershell
scripts\stop-local.ps1
```

## 手动启动方式

后端：

```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

前端：

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

访问：

```text
http://127.0.0.1:5173/
```

## Mock 模式

如果没有 API Key，可以先使用 Mock 模式。

`backend/.env`:

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

Mock 模式适合检查页面和流程，但不代表真实回答质量。

## 真实 API 模式

使用 OpenAI-compatible LLM：

```env
LLM_PROVIDER=openai
LLM_MODEL=deepseek-v4-flash
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=你的 API Key
OPENAI_BASE_URL=https://api.deepseek.com
```

使用 OpenAI-compatible Embedding：

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=你的 Embedding API Key
EMBEDDING_BASE_URL=https://api.openai.com/v1
```

如果 `EMBEDDING_API_KEY` 或 `EMBEDDING_BASE_URL` 未设置，后端会回退使用 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL`。

不要把真实 API Key 提交到 Git。

## 文件问答流程

推荐流程：

1. 启动后端和前端。
2. 打开 `http://127.0.0.1:5173/`。
3. 在聊天输入区上传 TXT / DOCX / PDF。
4. 等待文件自动完成解析、切块、embedding 和索引。
5. 在聊天框里基于该文件提问。
6. 如果继续追问，当前会话会携带最近上下文。

切换 Embedding Provider 后，建议重新上传文件或重新索引文件，否则旧索引不能代表新 embedding 的语义效果。

## 不要提交到 GitHub 的文件

以下内容不应进入 Git：

- `backend/.env`
- `frontend/.env`
- `.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
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

## 不要发给别人的文件

如果要把项目发给可信任的人试运行，默认不要包含：

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `frontend/node_modules/`
- `.git/`
- 任何压缩包里混入的数据库、上传文件或 API Key

如果你允许对方使用你的 API Key，建议单独私发 `.env`，不要放进源码压缩包，也不要上传 GitHub。

## 常见问题

查看：

```text
docs/troubleshooting.md
```

本地试运行说明：

```text
docs/local_trial_guide.md
```

## 当前限制

- 当前只支持最近一个 indexed 文件的单文件 RAG 问答。
- 当前本地 JSON VectorStore 不适合生产级大规模数据。
- 当前 SQLite 适合本地 MVP，不适合作为多人生产数据库。
- PDF 解析仅支持可复制文本型 PDF，不支持 OCR。
- 当前没有用户登录和权限隔离。
- 当前没有正式部署方案。
- Agent Workflow、企业权限、多租户和 PPT 生成暂未实现。
