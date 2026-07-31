# 北辰agent 本地试运行指南

本文档面向可信任的本地试用者。

目标是让你在 Windows 电脑上尽量顺利启动北辰agent。

## 1. 你需要准备什么

需要安装：

- Python
- Node.js / npm

需要准备：

- 一个可用的 LLM API Key，或者使用 Mock 模式
- 一个可用的 Embedding API Key，或者使用 Mock 模式

如果你只是想先看看页面和流程，可以使用 Mock 模式，不需要 API Key。

## 2. 解压项目后先不要做什么

不要删除这些目录：

- `backend/`
- `frontend/`
- `docs/`
- `scripts/`

不要把这些文件上传到 GitHub 或公开网盘：

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `.git/`

## 3. 安装依赖

后端依赖：

```powershell
cd backend
pip install -r requirements.txt
```

前端依赖：

```powershell
cd frontend
npm install
```

## 4. 创建后端配置文件

在项目根目录执行：

```powershell
copy backend\.env.example backend\.env
```

然后打开：

```text
backend/.env
```

## 5. Mock 模式

如果没有 API Key，可以先使用：

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-chat

EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

Mock 模式能验证页面、上传、解析和流程，但回答质量和检索质量不代表真实 AI 效果。

## 6. 真实 API 模式

如果使用 OpenAI-compatible LLM：

```env
LLM_PROVIDER=openai
LLM_MODEL=你的模型名
LLM_TIMEOUT_SECONDS=60
OPENAI_API_KEY=你的 API Key
OPENAI_BASE_URL=你的服务商 base url
```

如果使用 OpenAI-compatible Embedding：

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=你的 embedding 模型名
EMBEDDING_DIMENSION=模型维度
EMBEDDING_TIMEOUT_SECONDS=60
EMBEDDING_API_KEY=你的 Embedding API Key
EMBEDDING_BASE_URL=你的 Embedding base url
```

不要把真实 API Key 发给不可信的人。

不要把 `.env` 上传到 GitHub。

## 7. 检查环境

在项目根目录执行：

```powershell
scripts\check-local.ps1
```

如果看到 `[OK]`，说明对应项目正常。

如果看到 `[WARN] Port 8000 is already in use` 或 `[WARN] Port 5173 is already in use`，可以先运行：

```powershell
scripts\stop-local.ps1
```

## 8. 启动项目

在项目根目录执行：

```powershell
scripts\start-local.ps1
```

启动后打开：

```text
http://127.0.0.1:5173/
```

## 9. 停止项目

在项目根目录执行：

```powershell
scripts\stop-local.ps1
```

停止脚本只会停止监听固定端口的进程：

- `8000`
- `5173`

它不会删除上传文件、数据库或向量索引。

## 10. 使用文件问答

推荐流程：

1. 打开网页。
2. 在聊天输入区上传 TXT / DOCX / PDF。
3. 等待文件处理完成。
4. 直接在聊天框提问。
5. 可以继续追问，例如“继续解释第二点”。

注意：

- PDF 仅支持可复制文本型 PDF。
- 扫描件 PDF 暂不支持 OCR。
- 当前只支持最近一个 indexed 文件的单文件问答。

## 11. 如果运行失败

先查看：

```text
docs/troubleshooting.md
```

最常见处理方式：

```powershell
scripts\stop-local.ps1
scripts\check-local.ps1
scripts\start-local.ps1
```
