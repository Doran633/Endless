# Backend 设计

> 本文档用于指导独立网页版 AI 助手 MVP 的后端开发。
> 当前保持单体后端，不引入复杂微服务。
> 后端继续遵循 `api -> service -> repository` 的工程分层思想。

## 1. 设计目标

后端 v1.0 目标是跑通独立网页版 AI 助手的核心业务闭环：

```text
AI 聊天
  -> 文件上传
  -> 文档解析
  -> 单文件 RAG 知识问答
```

AI 数据分析是规划能力，当前先保留模块边界，不作为核心 MVP 闭环的前置条件。

设计原则：

- 采用单体后端，不拆微服务。
- API 层只处理 HTTP、参数校验和统一响应。
- Service 层负责编排业务流程。
- Repository 层负责数据访问和持久化边界。
- LLM、Embedding、Parser、Storage、Vector Store、Data Analysis 都保留接口边界。
- 不提前引入企业登录、企业权限、多租户、PPT 生成、复杂任务队列或开放式 Agent。

## 2. Implementation Status

本节记录当前后端实现状态，用于区分已经落地的代码、v1.0 计划模块和后续扩展模块。

### 2.1 Implemented

当前已经实现：

- Chat API。
- LLM Provider。

已落地代码：

- `backend/app/main.py`：FastAPI 应用入口，注册健康检查和聊天路由。
- `backend/app/api/v1/health.py`：健康检查接口。
- `backend/app/api/v1/chat.py`：基础聊天接口。
- `backend/app/schemas/chat.py`：聊天请求和响应 Schema。
- `backend/app/services/chat_service.py`：基础聊天业务编排。
- `backend/app/services/llm_service.py`：LLM Provider 选择入口。
- `backend/app/llm/base.py`：LLM Provider 抽象。
- `backend/app/llm/mock_provider.py`：本地 Mock Provider。
- `backend/app/llm/openai_provider.py`：OpenAI-compatible Provider。
- `backend/app/core/config.py`：LLM 配置读取。
- `backend/app/core/responses.py`：统一成功响应。

当前限制：

- 前端尚未接入后端聊天接口。
- Chat API 当前只支持普通聊天，尚未接入文件、会话持久化和 RAG。
- LLM Provider 已有抽象，但错误处理、timeout、metadata 和 provider registry 仍需完善。

### 2.2 Planned

v1.0 主链路计划实现：

- File Service。
- Parser Service。
- Embedding Provider。
- Vector Store。
- RAG Service。
- Repository Layer。
- Minimal Tests。

规划能力：

- Data Analysis Service。

说明：

- File Service 用于支撑文件上传、文件状态、原始文件存储和后续文档解析。
- RAG 用于支撑单文件知识问答，是当前 v1.0 的核心目标之一。
- Data Analysis Service 先保留模块边界，后续启动时再定义最小闭环。

### 2.3 Future

后续扩展模块：

- Auth。
- Agent Workflow。
- PPT。
- 企业权限。
- 多租户。

说明：

- Auth 当前不作为独立网页版 AI 助手 v1.0 的必须能力。
- Agent Workflow 当前暂不实现，后续应从确定性 WorkflowService 演进。
- PPT 当前暂缓，不应挤占 Chat、File、Parser、RAG 主链路。
- Future 模块不应影响当前 v1.0 的接口和数据模型收敛。

## 3. Backend 目录结构

建议在当前 `backend/` 基础上演进：

```text
backend/
  requirements.txt
  app/
    main.py
    api/
      deps.py
      v1/
        chat.py
        files.py
        health.py
    core/
      config.py
      responses.py
      errors.py
      exception_handlers.py
      logging.py
    schemas/
      chat.py
      file.py
      rag.py
      data_analysis.py
    repositories/
      file_repository.py
      chunk_repository.py
      chat_repository.py
    services/
      chat_service.py
      llm_service.py
      file_service.py
      parser_service.py
      embedding_service.py
      rag_service.py
      data_analysis_service.py  # 规划能力，当前暂不实现
    llm/
      base.py
      mock_provider.py
      openai_provider.py
    embedding/
      base.py
      provider.py
    vector_store/
      base.py
      store.py
    parsers/
      base.py
      txt_parser.py
      pdf_parser.py
      docx_parser.py
    storage/
      base.py
      local_storage.py
  tests/
  uploads/
```

目录职责：

- `api/`：路由、依赖注入、请求参数校验、统一响应。
- `core/`：配置、异常、日志、响应包装。
- `schemas/`：Pydantic 请求和响应模型。
- `repositories/`：数据查询与持久化边界，不写业务流程。
- `services/`：业务编排，是后端核心。
- `llm/`：LLM Provider 抽象和具体实现。
- `embedding/`：Embedding Provider 抽象。
- `vector_store/`：向量检索抽象。
- `parsers/`：文档解析抽象。
- `storage/`：文件存储抽象，先实现本地文件系统。

## 4. API 接口设计

### 4.1 API 通用规范

路径规范：

- 业务 API 统一使用 `/api/v1` 前缀。
- 健康检查使用 `GET /health`。
- 当前 `/chat` 是临时兼容路径，正式业务路径优先使用 `/api/v1/chat`。

统一成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

统一错误响应：

```json
{
  "code": 40001,
  "message": "error message",
  "data": null
}
```

错误码建议：

- `40xxx`：通用错误。
- `42xxx`：文件错误。
- `43xxx`：聊天错误。
- `45xxx`：RAG 错误。
- `46xxx`：数据分析错误。

### 4.2 Health API

`GET /health`

用途：

- 本地开发检查。
- 前端代理连通性检查。
- 部署健康检查。

### 4.3 Chat API

当前已实现：

- `POST /chat`
- `POST /api/v1/chat`

当前请求：

```json
{
  "message": "string"
}
```

当前响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "answer": "string"
  }
}
```

后续 RAG 扩展建议：

```json
{
  "message": "string",
  "file_id": "uuid",
  "mode": "general"
}
```

说明：

- 没有 `file_id` 时走普通聊天。
- 有 `file_id` 时由 Chat Service 调用 RAG Service。
- v1.0 先返回完整回答，不引入 SSE/WebSocket。

### 4.4 Files API

计划接口：

- `POST /api/v1/files`
- `GET /api/v1/files`
- `GET /api/v1/files/{file_id}`
- `DELETE /api/v1/files/{file_id}`

职责：

- 上传文件。
- 查询文件列表。
- 查询文件解析状态。
- 删除文件及其关联 chunks。

文件范围：

- TXT：必须支持。
- PDF：建议支持。
- DOCX：根据进度实现。

### 4.5 RAG API

RAG 可以先复用 Chat API 的扩展字段，不必立即增加独立复杂接口。

推荐入口：

```text
POST /api/v1/chat
  message + file_id
```

后续如果 RAG 逻辑复杂，再拆分：

```text
POST /api/v1/rag/query
```

约束：

- v1.0 优先单文件问答。
- 检索范围限定在当前 `file_id`。
- 不做全局知识库。
- 不做多文件联合问答。

### 4.6 Data Analysis API

Data Analysis 是规划能力，当前暂不实现。

后续可规划接口：

- `POST /api/v1/data/files`
- `GET /api/v1/data/files/{file_id}/summary`
- `POST /api/v1/data/files/{file_id}/analyze`
- `POST /api/v1/data/files/{file_id}/charts`

约束：

- 不进入当前核心 MVP 验收。
- 不引入独立微服务。
- 分析结果必须来自程序计算，LLM 只负责解释。

## 5. 数据模型设计

当前代码尚未实现数据库、ORM 和迁移。

v1.0 最小数据模型建议：

### 5.1 `files`

职责：

- 保存上传文件元数据。
- 跟踪解析状态。

建议字段：

- `id`
- `original_name`
- `storage_path`
- `mime_type`
- `extension`
- `size_bytes`
- `status`
- `parse_error`
- `metadata`
- `created_at`
- `updated_at`

### 5.2 `document_chunks`

职责：

- 保存切分后的文本 chunk。
- 保存 embedding 或向量索引引用。
- 支撑单文件 RAG 检索。

建议字段：

- `id`
- `file_id`
- `chunk_index`
- `content`
- `embedding`
- `token_count`
- `metadata`
- `created_at`

### 5.3 `chat_sessions`

职责：

- 保存会话。
- 区分普通聊天和文件问答。

当前 v1.0 可以根据实现节奏决定是否立即持久化会话。

### 5.4 `chat_messages`

职责：

- 保存用户与助手消息。
- 保存 RAG 引用、模型和 token metadata。

当前 v1.0 可以先完成无持久化聊天，再逐步接入。

### 5.5 `data_files`

Data Analysis 规划模型，当前暂不实现。

职责：

- 保存结构化数据文件元数据。
- 保存字段识别结果和数据摘要。

## 6. Service 层划分

### 6.1 `ChatService`

职责：

- 编排普通聊天。
- 后续根据 `file_id` 分流到 RAG Service。
- 调用 LLM Service 生成回答。

当前状态：

- 已实现基础普通聊天。

### 6.2 `LLMService`

职责：

- 根据配置选择 LLM Provider。
- 对 Service 层屏蔽具体模型调用细节。

当前状态：

- 已实现 Mock Provider 和 OpenAI-compatible Provider。

后续需要：

- Provider registry。
- timeout。
- 统一错误处理。
- request metadata。

### 6.3 `FileService`

职责：

- 校验文件格式和大小。
- 调用 Storage 保存原始文件。
- 记录文件状态。
- 触发或调用 Parser Service。

当前状态：

- Planned。

### 6.4 `ParserService`

职责：

- 根据扩展名选择 parser。
- 输出统一文本结果。
- 处理解析失败。

当前状态：

- Planned。

### 6.5 `EmbeddingService`

职责：

- 对 chunks 和 query 生成 embedding。
- 屏蔽具体 embedding provider。

当前状态：

- Planned。

### 6.6 `RagService`

职责：

- 对文档文本做 chunk 切分。
- 写入向量存储。
- 根据问题检索相关 chunks。
- 组装 LLM 上下文。

当前状态：

- Planned。

关键约束：

- v1.0 检索必须限定在单个 `file_id`。
- 不做全局知识库。

### 6.7 `DataAnalysisService`

职责：

- 接收结构化数据。
- 执行基础统计和聚合分析。
- 生成图表数据。
- 调用 LLM Service 输出自然语言解释。

当前状态：

- Planned as capability boundary。
- 当前暂不实现。

约束：

- 计算结果必须来自程序逻辑。
- LLM 只负责解释和总结。

### 6.8 `WorkflowService`

职责：

- 后续承接确定性多步骤任务。
- 为 Agent Workflow 预留演进位置。

当前状态：

- Future。
- 不进入当前 v1.0。

## 7. LLM 调用抽象方式

LLM 抽象目标：

- ChatService 不关心具体模型 SDK。
- RAG 和 Data Analysis 后续复用同一 LLMService。
- 统一处理 timeout、错误、模型参数和 metadata。

建议接口语义：

```text
LLMProvider
  chat(messages, model, temperature, max_tokens, metadata) -> LLMResponse
```

当前已实现：

- `MockLLMProvider`
- `OpenAIProvider`

后续建议：

- 未知 provider 应快速失败。
- 不在前端做复杂模型切换 UI。
- 不在测试中真实调用外部 LLM。

## 8. 文件处理流程

### 8.1 上传流程

```text
POST /api/v1/files
  -> File API
  -> FileService 校验格式和大小
  -> Storage 保存原始文件
  -> Repository 记录文件状态
  -> ParserService 解析文本
  -> 返回 file_id 和 status
```

### 8.2 RAG 索引流程

```text
ParserService 输出文本
  -> RagService chunk 切分
  -> EmbeddingService 生成向量
  -> VectorStore 写入 chunks
  -> 文件状态更新为 ready
```

### 8.3 RAG 问答流程

```text
POST /api/v1/chat(message, file_id)
  -> ChatService
  -> RagService 检索 chunks
  -> ChatService 组装上下文
  -> LLMService
  -> LLMProvider
  -> 返回 answer 和 citations
```

## 9. RAG 接入位置

RAG 在后端内部实现，入口在：

```text
ChatService
  -> RagService
  -> EmbeddingService
  -> VectorStore
  -> LLMService
```

关键要求：

- ChatService 不直接写向量检索逻辑。
- RagService 不直接处理 HTTP。
- VectorStore 屏蔽具体向量存储。
- EmbeddingProvider 屏蔽具体 embedding 模型。
- 外部 Vector Database 接入时不改变前端 API。

## 10. Agent Workflow 预留方式

当前不做复杂 Agent。

不做：

- 开放式工具调用。
- 自主规划多步任务。
- 多 Agent 协作。
- Agent 记忆系统。
- 可视化工作流编辑器。

后续如果加入 Agent Workflow，再逐步增加：

- workflow runs。
- workflow steps。
- tool registry。
- step logs。
- human approval。
- retry / resume。

## 11. MVP 开发顺序建议

推荐实现顺序：

1. 前端接入后端 `/api/v1/chat`。
2. 稳定 LLM Provider 和错误边界。
3. 增加最小后端测试。
4. 实现文件上传和本地存储。
5. 实现 TXT/PDF 文档解析。
6. 实现 chunk 和 embedding。
7. 实现 VectorStore 检索。
8. 将 ChatService 扩展为支持 `file_id` 的单文件 RAG。
9. 同步前端文件问答交互。
10. 再评估 AI 数据分析最小闭环。

## 12. 测试策略

优先测试：

- `GET /health`。
- `POST /api/v1/chat`。
- Mock Provider。
- OpenAI Provider 的配置错误。
- FileService 文件格式和大小限制。
- ParserService 成功和失败路径。
- RagService 按 `file_id` 检索。

测试边界：

- 单元测试中 mock LLM 和 embedding 服务。
- 不在测试中真实调用外部 LLM。
- Data Analysis 当前只规划，不需要测试。

## 13. 明确不做

Backend v1.0 不做：

- 钉钉。
- 企业登录。
- 企业权限。
- 多租户。
- PPT 生成。
- 多 LLM Provider 切换 UI。
- 企业全局知识库。
- 多文件联合问答。
- Celery。
- Redis 强依赖。
- MinIO / OSS。
- SSE / WebSocket。
- 审计日志。
- 病毒扫描。
- OCR。
- 开放式 Agent。
