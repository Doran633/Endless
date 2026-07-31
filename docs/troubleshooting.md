# 北辰agent 常见问题

## 1. PowerShell 不允许运行脚本

现象：

```text
running scripts is disabled on this system
```

处理：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-local.ps1
```

启动脚本也可以这样运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

## 2. 端口被占用

现象：

```text
Port 5173 is already in use
```

或：

```text
Port 8000 is already in use
```

处理：

```powershell
scripts\stop-local.ps1
scripts\start-local.ps1
```

说明：

- `8000` 是后端端口。
- `5173` 是前端端口。
- 停止脚本只处理监听这两个端口的进程，不会批量结束所有 Python 或 Node。

## 3. 前端打不开

请确认打开的是：

```text
http://127.0.0.1:5173/
```

如果打不开：

1. 运行 `scripts\check-local.ps1`。
2. 确认 `5173` 是否被占用。
3. 运行 `scripts\stop-local.ps1`。
4. 再运行 `scripts\start-local.ps1`。

## 4. 后端不可用

检查：

```text
http://127.0.0.1:8000/health
```

正常结果应该包含：

```text
ok
```

如果不正常：

- 后端可能没启动。
- Python 依赖可能没安装。
- `backend/.env` 可能不存在。
- 后端启动窗口里可能有错误日志。

## 5. 页面显示 Failed to fetch

常见原因：

- 后端没启动。
- 前端打开了错误端口。
- 后端端口不是 `8000`。
- 前端 Vite proxy 没有转发到后端。

处理：

```powershell
scripts\stop-local.ps1
scripts\check-local.ps1
scripts\start-local.ps1
```

然后重新打开：

```text
http://127.0.0.1:5173/
```

## 6. API Key 配置错误

现象：

- AI 回复失败。
- 后端窗口显示 provider request failed。
- 后端提示 `OPENAI_API_KEY is not configured`。

检查：

```text
backend/.env
```

真实 LLM 模式至少需要：

```env
LLM_PROVIDER=openai
LLM_MODEL=你的模型名
OPENAI_API_KEY=你的 API Key
OPENAI_BASE_URL=你的服务商 base url
```

注意：

- 不要把真实 API Key 提交到 GitHub。
- 不要把 `.env` 放进公开压缩包。

## 7. Embedding 配置错误

现象：

- 文件可以上传，但向量化失败。
- 文件无法变成 indexed 状态。

检查：

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=你的 embedding 模型名
EMBEDDING_DIMENSION=模型维度
EMBEDDING_API_KEY=你的 Embedding API Key
EMBEDDING_BASE_URL=你的 Embedding base url
```

如果只是本地试流程，可以先改为：

```env
EMBEDDING_PROVIDER=mock
EMBEDDING_MODEL=mock-embedding
EMBEDDING_DIMENSION=16
```

## 8. 上传文件后不能问答

请检查：

- 文件类型是否为 TXT / DOCX / PDF。
- PDF 是否为可复制文本型 PDF。
- 文件是否完成 indexed。
- Embedding 配置是否正确。
- 是否切换了 embedding provider 后没有重新索引。

建议：

1. 重新上传文件。
2. 等待自动处理完成。
3. 再基于该文件提问。

## 9. 回答质量不稳定

可能原因：

- 使用了 Mock LLM。
- 使用了 Mock Embedding。
- 文档 chunk 不够相关。
- 当前 query 太省略。
- 文档本身没有包含答案。

建议：

- 使用真实 LLM。
- 使用真实 Embedding。
- 尝试更明确的问题。
- 如果切换 embedding 模型，重新上传或重新索引文件。

## 10. 临时公网网址打不开

临时公网隧道不属于当前稳定运行方案。

它可能出现：

- 地址变化。
- HTTPS 兼容问题。
- 服务端连接中断。
- 本机可运行但公网地址打不开。

当前推荐：

- 本地使用 `http://127.0.0.1:5173/`。
- 先完成本地试运行整理。
- 后续再规划正式部署。

## 11. 什么文件不能发给别人

默认不要发送：

- `backend/.env`
- `backend/uploads/`
- `backend/vector_store/`
- `backend/data/`
- `.claude/`
- `.git/`
- `frontend/node_modules/`

原因：

- `.env` 可能包含 API Key。
- uploads 保存原始上传文件。
- vector_store 保存文档 chunk 原文。
- SQLite 数据库保存会话和消息。
