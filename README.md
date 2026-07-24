# 北辰agent

北辰agent 是一个独立网页版 AI 助手 MVP，当前聚焦：

- AI 聊天
- 文件上传
- TXT / DOCX / 可复制文本型 PDF 解析
- 文本切块
- Mock / OpenAI-compatible Embedding
- 本地 JSON VectorStore
- 单文件 RAG 问答
- 聊天侧上传文件后直接基于文件提问

当前项目不包含企业登录、多租户、复杂权限、数据库、pgvector、Agent Workflow 或 PPT 生成。

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
- python-dotenv
- python-multipart
- python-docx
- pypdf

## 本地启动

### 1. 后端

```bash
cd backend
pip install -r requirements.txt
```

复制配置文件：

```text
backend/.env.example -> backend/.env
```

启动后端：

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

访问：

```text
http://127.0.0.1:5173/
```

## LLM 配置

无 API Key 本地开发：

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat
```

使用 OpenAI-compatible LLM：

```env
LLM_PROVIDER=openai
LLM_MODEL=deepseek-v4-flash
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=你的 API Key
OPENAI_BASE_URL=https://api.deepseek.com
```

不要把真实 API Key 提交到 Git。

## Embedding 配置

无 API Key 本地开发：

```env
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
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

## 重新索引

切换到真实 embedding 后，旧的 mock 索引不再代表真实语义检索效果。

推荐流程：

1. 更新 `backend/.env`。
2. 重启后端。
3. 重新上传文件。
4. 等待自动解析、切块、向量化和索引完成。
5. 在聊天框中基于文件提问。

## 不要提交的文件

以下内容不应进入 Git：

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `.claude/`
- `node_modules/`
- `__pycache__/`
- `*.log`

## 当前限制

- 当前使用本地 JSON VectorStore，不适合生产级大规模数据。
- 当前只支持最近一个 indexed 文件的单文件 RAG 问答。
- 前端会话和文件状态尚未数据库持久化。
- PDF 解析仅支持可复制文本型 PDF，不支持 OCR。
- Agent Workflow、企业权限、多租户和 PPT 生成暂未实现。

