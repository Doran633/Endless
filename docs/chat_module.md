# 基础聊天模块说明

## 1. 修改内容

本次新增了最小后端聊天链路：

```text
Frontend
  -> POST /chat
  -> FastAPI
  -> ChatService
  -> LLMService
  -> LLMProvider
  -> Return answer
```

同时也注册了兼容当前后端架构的 `/api/v1/chat` 路径，方便后续前端从 Vite `/api` 代理迁移。

新增文件：

- `backend/requirements.txt`
- `backend/app/main.py`
- `backend/app/api/v1/health.py`
- `backend/app/api/v1/chat.py`
- `backend/app/core/config.py`
- `backend/app/core/responses.py`
- `backend/app/schemas/chat.py`
- `backend/app/services/chat_service.py`
- `backend/app/services/llm_service.py`
- `backend/app/llm/base.py`
- `backend/app/llm/mock_provider.py`
- `backend/app/llm/openai_provider.py`
- 必要的 `__init__.py`

## 2. 设计原因

### 2.1 保持 MVP 简单

当前没有数据库、登录、RAG 和文件系统依赖，因此基础聊天模块先实现无状态问答。

默认使用 `MockLLMProvider`，这样即使没有外部 API Key、没有网络，也可以验证 FastAPI 路由、Service 分层和响应格式。

### 2.2 遵循当前项目架构

代码按 `backend_design.md` 中的后端分层组织：

- API 层：`backend/app/api/v1/chat.py`
- Schema 层：`backend/app/schemas/chat.py`
- Service 层：`backend/app/services/chat_service.py`
- LLM 抽象层：`backend/app/llm/`
- Core 层：`backend/app/core/`

API 层只负责接收请求和返回响应，不直接调用具体 LLM Provider。

### 2.3 为 OpenAI 接入预留接口

`LLMProvider` 定义在 `backend/app/llm/base.py`。

当前支持：

- `mock`：默认本地开发 Provider。
- `openai`：OpenAI-compatible chat provider，通过环境变量启用。

配置方式：

```text
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
```

没有配置时默认使用 mock，不影响本地开发。

## 3. 每个修改文件的原因

- `backend/requirements.txt`：记录后端最小依赖，方便后续安装运行。
- `backend/app/main.py`：创建 FastAPI 应用，注册 CORS、健康检查和聊天路由。
- `backend/app/api/v1/health.py`：提供 `GET /health`，用于验证后端可启动。
- `backend/app/api/v1/chat.py`：提供 `POST /chat` 和 `/api/v1/chat` 的路由处理。
- `backend/app/core/config.py`：集中读取 LLM 相关环境变量。
- `backend/app/core/responses.py`：统一成功响应结构 `{ code, message, data }`。
- `backend/app/schemas/chat.py`：定义聊天请求和响应数据结构。
- `backend/app/services/chat_service.py`：编排聊天业务流程，构造 system/user messages。
- `backend/app/services/llm_service.py`：根据配置选择 LLM Provider。
- `backend/app/llm/base.py`：定义 LLMProvider 抽象和标准响应结构。
- `backend/app/llm/mock_provider.py`：提供无需外部依赖的本地回复能力。
- `backend/app/llm/openai_provider.py`：预留 OpenAI-compatible API 调用实现。
- `__init__.py`：保证 Python 包结构清晰，方便后续导入和测试。

## 4. 后续扩展方式

### 4.1 接入真实前端

前端可以先新增 `frontend/src/api/chatApi.ts`，调用：

```text
POST /api/v1/chat
```

请求：

```json
{
  "message": "你好"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "answer": "string",
    "model": "string",
    "usage": {
      "input_tokens": null,
      "output_tokens": null
    }
  }
}
```

### 4.2 接入 Claude

后续新增 `ClaudeProvider`，并在 `LLMService._build_provider()` 中加入：

```text
LLM_PROVIDER=claude
```

ChatService 不需要改动。

### 4.3 接入聊天会话

后续增加数据库后，可以把 `ChatService.answer()` 扩展为：

```text
创建/读取 session
  -> 保存 user message
  -> 调用 LLM
  -> 保存 assistant message
  -> 返回消息
```

### 4.4 接入 RAG

后续文件模块完成后，ChatService 可以根据请求中的 `file_id` 调用：

```text
RagService.retrieve_context()
  -> LLMService.chat()
```

当前 LLM 抽象无需变化。

### 4.5 接入 Agent Workflow

未来 Agent 不应直接写在 API 层。

建议路径：

```text
Chat API
  -> ChatService
  -> WorkflowService / AgentService
  -> Tools
  -> LLMService
```

这样可以保持 API 稳定，同时逐步增加工具调用、步骤状态和人工确认能力。
