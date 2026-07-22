# 代码审查报告

> 审查范围：当前项目文档、前端 Mock 原型、已新增的基础后端聊天模块。
> 审查重点：模块职责、高耦合、单一职责、RAG 接入、Agent 扩展、技术债。
> 本报告只记录问题和建议，不直接重构代码。

## 严重问题

### 1. 当前前端聊天仍完全绕过后端聊天模块

位置：

- `frontend/src/stores/chatStore.ts:3`
- `frontend/src/stores/chatStore.ts:4`
- `frontend/src/stores/chatStore.ts:81`
- `frontend/src/stores/chatStore.ts:83`

问题：

前端聊天仍直接依赖 `mock.ts` 和 `generateAIResponse()`，没有调用新实现的 `POST /chat` 或 `POST /api/v1/chat`。

影响：

- 当前“Frontend -> POST /chat -> FastAPI -> LLM Service -> Return answer”链路只在后端测试中成立，产品实际界面仍未接入。
- 后续接入真实 LLM、RAG、Agent 时，前端状态层会继续绕过后端，导致业务链路分裂。
- Mock 会话、真实会话、文件问答会话未来会出现两套状态来源。

建议：

- 新增 `frontend/src/api/chatApi.ts`。
- 让 `chatStore.sendMessage()` 调用后端 API。
- Mock 数据保留为开发演示模式，但不要作为默认业务路径。

### 2. 路由注册方式会制造重复接口语义

位置：

- `backend/app/main.py:20`
- `backend/app/main.py:21`
- `backend/app/api/v1/chat.py:11`

问题：

同一个 `chat_router` 被注册了两次：

- `/chat`
- `/api/v1/chat`

这满足了当前临时目标，但会让后续 API 规范变得混乱。`backend_design.md` 和 `api_design.md` 都强调业务 API 使用 `/api/v1` 前缀，而当前又保留了无版本路径。

影响：

- 前端、测试、文档可能分别依赖不同路径。
- 后续鉴权、中间件、限流、日志统计按 API 前缀治理时，`/chat` 会成为例外。
- Agent、RAG、会话接口扩展时，路径兼容成本会持续增加。

建议：

- MVP 过渡期可以保留 `/chat`，但应在文档中标记为临时兼容路径。
- 正式业务路径统一收敛到 `/api/v1/chat` 或后续的 `/api/v1/chat/sessions/{id}/messages`。

### 3. OpenAI Provider 的异常会直接冒泡为 500，缺少统一错误边界

位置：

- `backend/app/llm/openai_provider.py:13`
- `backend/app/llm/openai_provider.py:34`
- `backend/app/llm/openai_provider.py:37`
- `backend/app/api/v1/chat.py:13`

问题：

`OpenAIProvider` 在缺少 API Key 或请求失败时抛出 `RuntimeError`，API 层没有捕获并转换为统一错误响应。

影响：

- 前端会收到非规范化 500 响应。
- 不符合 `{ code, message, data }` 的统一响应约定。
- 未来接入 RAG 和 Agent 后，外部服务失败会更频繁，如果没有错误边界，会导致用户体验不可控。

建议：

- 定义 `AppError` / `LLMError`。
- 增加 FastAPI 全局异常处理。
- LLM 失败返回明确错误码，例如 `43xxx` 聊天错误或 `40xxx` 外部依赖错误。

## 中等问题

### 1. API 层直接实例化 Service，依赖注入边界不足

位置：

- `backend/app/api/v1/chat.py:13`

问题：

API 路由中直接 `ChatService()`，而 `ChatService` 内部又直接创建 `LLMService()`。

影响：

- 单元测试不容易替换 mock service。
- 未来加入用户鉴权、数据库 session、RAG service、Agent service 时，构造逻辑会散落。
- 生命周期管理不清晰，例如 HTTP client、连接池、配置热切换。

建议：

- 在 `backend/app/api/deps.py` 中提供 `get_chat_service()`。
- 后续通过 FastAPI `Depends()` 注入 service。
- 数据库 session、当前用户、RAG service 也通过依赖层集中管理。

### 2. `ChatService` 同时负责 prompt 组装和响应 DTO 拼装

位置：

- `backend/app/services/chat_service.py:9`
- `backend/app/services/chat_service.py:10`
- `backend/app/services/chat_service.py:18`

问题：

`ChatService.answer()` 当前同时做了三件事：

- 构造 system prompt。
- 调用 LLM。
- 拼装 API 返回数据。

影响：

- 后续加入会话历史、RAG 上下文、Agent 工具调用时，这个方法会快速膨胀。
- system prompt 难以按场景复用，例如普通对话、文件问答、PPT 生成、Agent Workflow。
- API 返回结构与业务服务绑定，未来数据库消息模型接入时需要拆分。

建议：

- 将 prompt 构造拆到 `PromptBuilder` 或私有方法。
- `ChatService` 返回领域结果对象，API 层或 schema 层负责响应序列化。
- 为 RAG 预留 `context_chunks`、`citations`、`metadata` 字段。

### 3. LLM Provider 选择逻辑硬编码在 `LLMService`

位置：

- `backend/app/services/llm_service.py:14`
- `backend/app/services/llm_service.py:15`
- `backend/app/services/llm_service.py:17`

问题：

`LLMService._build_provider()` 只识别 `openai`，其他情况全部回落到 mock。

影响：

- 如果配置 `LLM_PROVIDER=claude`，系统会静默使用 mock。
- 未来新增 Claude、DeepSeek、Qwen 时需要持续修改 `LLMService`。
- 配置错误不会快速失败，容易在演示或联调时误以为接入了真实模型。

建议：

- 使用 provider registry，例如 `{ "mock": MockLLMProvider, "openai": OpenAIProvider }`。
- 未知 provider 直接抛出配置错误。
- 新增 ClaudeProvider 时只注册 provider，不改变 ChatService。

### 4. LLM 抽象缺少调用参数和 metadata，后续 RAG/Agent 可观测性不足

位置：

- `backend/app/llm/base.py:17`
- `backend/app/llm/base.py:18`

问题：

`LLMProvider.chat()` 当前只接收 `messages`，没有 `model`、`temperature`、`max_tokens`、`metadata`、`request_id` 等参数。

影响：

- RAG 问答无法按场景控制输出长度。
- PPT 生成无法使用更结构化的生成参数。
- Agent Workflow 难以记录 step-level 调用信息。
- 调试 LLM 成本、token、失败重试会比较困难。

建议：

- 增加 `LLMRequest` 数据结构。
- 将模型参数、业务场景、trace metadata 放入请求对象。
- `LLMResponse` 保留 raw metadata 或 provider response id。

### 5. OpenAI Provider 使用同步标准库 HTTP，会阻塞 FastAPI worker

位置：

- `backend/app/llm/openai_provider.py:34`
- `backend/app/llm/openai_provider.py:35`

问题：

`urllib.request.urlopen()` 是同步阻塞调用。当前路由也是同步函数，短期可用，但 LLM 请求通常耗时较长。

影响：

- 并发聊天时容易阻塞 worker。
- 未来 RAG + LLM + Agent 多步调用会进一步放大阻塞。
- 超时、重试、连接池控制能力弱。

建议：

- MVP 可以暂时接受同步实现。
- 下一步接真实模型时建议使用官方 SDK 或 `httpx`。
- 如果继续同步，至少统一 timeout、错误类型、重试策略。

### 6. 当前后端没有测试文件，验证依赖人工命令

位置：

- 当前未发现 `backend/tests/` 或 pytest 测试文件。

问题：

基础聊天模块已经有可测试行为，但没有固化成自动化测试。

影响：

- 后续调整 Provider、响应格式、路由路径时容易回归。
- RAG 和 Agent 接入后问题定位成本增加。

建议：

- 增加最小测试：
  - `GET /health`
  - `POST /chat`
  - `POST /api/v1/chat`
  - 空 message 返回 422
  - mock provider 返回统一响应结构

## 优化建议

### 1. 明确 `/chat` 是临时接口还是正式接口

位置：

- `backend/app/main.py:20`
- `backend/app/main.py:21`

建议：

- 如果是为了满足当前演示目标，文档中标注 `/chat` 为临时兼容路径。
- 如果项目进入正式 MVP，建议只保留 `/api/v1` 业务路径。

### 2. 统一后端响应模型

位置：

- `backend/app/core/responses.py:4`
- `backend/app/schemas/chat.py:11`

建议：

- 当前 `ChatResponse` 没有被路由声明使用。
- 后续可以定义 `ApiResponse[T]` 或至少在路由上声明 `response_model`。
- 这样 OpenAPI 文档会更准确，前端也更容易生成类型。

### 3. 把 system prompt 移出业务代码

位置：

- `backend/app/services/chat_service.py:11`
- `backend/app/services/chat_service.py:13`

建议：

- 将 system prompt 放到配置、prompt 模板文件或 `PromptBuilder`。
- 后续可以为普通聊天、RAG 问答、PPT 生成、Agent Workflow 分别管理 prompt。

### 4. 增加请求级日志与 request id

位置：

- 当前后端尚未实现请求日志和 request id。

建议：

- 后续增加基础日志中间件。
- LLM 调用记录 provider、model、耗时、成功/失败，不记录完整敏感内容。
- Agent Workflow 后续可复用同一 trace id。

### 5. 前端 store 需要逐步瘦身

位置：

- `frontend/src/stores/chatStore.ts:46`
- `frontend/src/stores/chatStore.ts:81`
- `frontend/src/stores/chatStore.ts:83`

建议：

- store 只管理 UI 状态和数据状态。
- API 调用放入 `frontend/src/api/chatApi.ts`。
- Mock 逻辑移到开发模式适配层。

### 6. Provider 配置应快速失败

位置：

- `backend/app/services/llm_service.py:14`
- `backend/app/services/llm_service.py:17`

建议：

- 未知 `LLM_PROVIDER` 不应静默 fallback 到 mock。
- 开发环境可默认 mock；显式配置错误应直接报错。

### 7. 为 RAG 预留请求字段

位置：

- `backend/app/schemas/chat.py:4`

建议：

- 当前 `ChatRequest` 只有 `message`。
- 后续可以扩展为：

```json
{
  "message": "string",
  "session_id": "uuid",
  "file_id": "uuid",
  "mode": "general"
}
```

MVP 当前不必立刻实现，但接口演进应避免破坏现有前端。

### 8. 为 Agent 预留服务边界，不要塞进 ChatService

位置：

- `backend/app/services/chat_service.py:5`

建议：

- ChatService 负责聊天主流程。
- Agent 后续放入 `WorkflowService` 或 `AgentService`。
- ChatService 只根据请求模式决定是否调用 Agent，不直接承载工具注册和步骤执行。

## 总体结论

当前基础聊天模块的方向是正确的：已经出现 API、Schema、Service、LLM Provider 的基本分层，适合作为 MVP 的起点。

主要技术债集中在：

- 前端仍未接入后端。
- 路由路径存在临时/正式双轨。
- API 层直接创建 Service。
- LLM Provider 选择和错误处理还比较粗。
- ChatService 很快会因会话、RAG、Agent 接入而膨胀。

建议下一步优先处理接口收敛和依赖注入边界，然后再接前端真实 API。不要急着上 RAG 或 Agent，否则当前这些小债会被放大。
