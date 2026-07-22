# Backend 设计

> 本文档用于指导后端工程初始化和后续 MVP 开发。
> 目标是在保持 MVP 简单的前提下，为 OpenAI API、Embedding、Vector Database、Agent Workflow 预留清晰扩展边界。
> 所有与本文冲突的 MVP 范围决策，以 `mvp_decision.md` 为准。

## 1. 设计目标

后端一期目标是跑通企业内部 AI 助手的最小业务闭环：

```text
钉钉登录
  -> 单文件上传
  -> 单文件解析
  -> 单文件 RAG 问答
  -> PPT 生成任务
  -> PPT 下载
```

设计原则：

- 采用单体后端，不拆微服务。
- 分层清晰：API 层只处理 HTTP，Service 层编排业务，Repository 层访问数据。
- 真实复杂度集中在后端，但一期只实现必须能力。
- LLM、Embedding、Parser、Storage、Vector Search、Workflow 都保留接口边界。
- 一期不做多模型 UI、多文件知识库、Celery、MinIO、SSE、复杂 Agent。

## 2. Backend 目录结构

建议后端目录：

```text
backend/
  pyproject.toml
  alembic.ini
  app/
    main.py
    api/
      deps.py
      v1/
        auth.py
        files.py
        chat.py
        ppt.py
        health.py
    core/
      config.py
      database.py
      security.py
      responses.py
      exceptions.py
      logging.py
    models/
      user.py
      file.py
      file_chunk.py
      chat.py
      ppt_job.py
    schemas/
      common.py
      auth.py
      file.py
      chat.py
      ppt.py
    repositories/
      user_repository.py
      file_repository.py
      file_chunk_repository.py
      chat_repository.py
      ppt_job_repository.py
    services/
      auth_service.py
      file_service.py
      parser_service.py
      embedding_service.py
      rag_service.py
      chat_service.py
      ppt_service.py
      workflow_service.py
    llm/
      base.py
      claude_provider.py
      openai_provider.py
    embedding/
      base.py
      bge_m3_client.py
      openai_embedding_client.py
    vector_store/
      base.py
      pgvector_store.py
    parsers/
      base.py
      txt_parser.py
      pdf_parser.py
      docx_parser.py
    storage/
      base.py
      local_storage.py
    ppt/
      generator.py
      template.py
    tasks/
      file_tasks.py
      ppt_tasks.py
  alembic/
    versions/
  tests/
  uploads/
  ppt_outputs/
```

目录职责：

- `api/`：路由、依赖注入、请求参数校验、统一响应。
- `core/`：配置、数据库连接、安全工具、异常、日志、响应包装。
- `models/`：SQLAlchemy ORM 模型。
- `schemas/`：Pydantic 请求和响应模型。
- `repositories/`：数据库查询与持久化，不写业务流程。
- `services/`：业务编排，是后端核心。
- `llm/`：LLM Provider 抽象，先实现 Claude，预留 OpenAI。
- `embedding/`：Embedding Provider 抽象，先实现 BGE-M3，预留 OpenAI Embedding。
- `vector_store/`：向量检索抽象，先实现 pgvector，预留外部 Vector DB。
- `parsers/`：文档解析抽象，首期支持 TXT/PDF/DOCX。
- `storage/`：文件存储抽象，先实现本地文件系统。
- `ppt/`：PPT 文件生成逻辑。
- `tasks/`：BackgroundTasks 的实际任务函数。

## 3. API 接口设计

### 3.1 API 通用规范

路径规范：

- 业务 API 统一使用 `/api/v1` 前缀。
- 健康检查使用 `GET /health`。

认证规范：

- 登录接口除外，所有业务接口默认需要 JWT。
- 后端通过 `get_current_user` 依赖注入当前用户。
- 所有查询必须按 `user_id` 做数据隔离。

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

错误码：

- `40xxx`：通用错误。
- `41xxx`：认证错误。
- `42xxx`：文件错误。
- `43xxx`：聊天错误。
- `44xxx`：PPT 错误。

### 3.2 Health

`GET /health`

响应：

```json
{
  "status": "ok"
}
```

用途：

- 本地开发检查。
- Docker 健康检查。
- 前端代理连通性检查。

### 3.3 Auth API

`POST /api/v1/auth/dingtalk/login`

请求：

```json
{
  "auth_code": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string"
    }
  }
}
```

`GET /api/v1/auth/me`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "name": "string",
    "avatar_url": "string"
  }
}
```

`POST /api/v1/auth/refresh`

请求：

```json
{
  "refresh_token": "string"
}
```

说明：

- `access_token` 有效期 24 小时。
- `refresh_token` 有效期 7 天。
- 一期不做密码注册和手机号登录。
- 如果钉钉联调受阻，可以临时加 dev mock 登录，但不要改变正式接口形状。

### 3.4 Files API

`POST /api/v1/files`

请求：

- `multipart/form-data`
- 字段：`file`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "original_name": "string",
    "status": "uploaded"
  }
}
```

`GET /api/v1/files`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "uuid",
        "original_name": "string",
        "status": "ready",
        "size_bytes": 12345,
        "extension": "pdf",
        "created_at": "2026-07-22T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

`GET /api/v1/files/{file_id}`

用途：

- 查询文件详情。
- 前端轮询解析状态。
- 只能查询当前用户自己的文件。

`DELETE /api/v1/files/{file_id}`

行为：

- 删除当前用户自己的文件。
- 同步删除关联 `file_chunks`。
- 同步删除关联 PPT 产物。
- 聊天消息内容保留，但关联文件不再可用。

文件限制：

- 一期支持 TXT、PDF、DOCX。
- 单文件最大 20 MB。
- 上传后异步解析：uploaded -> processing -> ready / failed。

### 3.5 Chat API

`POST /api/v1/chat/sessions`

创建普通会话：

```json
{
  "mode": "general",
  "file_id": null
}
```

创建文件问答会话：

```json
{
  "mode": "file",
  "file_id": "uuid"
}
```

约束：

- `mode=file` 时 `file_id` 必填。
- 文件必须属于当前用户。
- 文件状态必须为 `ready`。
- 一期一个会话最多绑定一个文件。

`GET /api/v1/chat/sessions`

用途：

- 查询当前用户会话列表。

`GET /api/v1/chat/sessions/{session_id}/messages`

用途：

- 查询当前用户某个会话的消息。

`POST /api/v1/chat/sessions/{session_id}/messages`

请求：

```json
{
  "content": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "user_message": {
      "id": "uuid",
      "role": "user",
      "content": "string"
    },
    "assistant_message": {
      "id": "uuid",
      "role": "assistant",
      "content": "string",
      "metadata": {
        "chunk_ids": ["uuid"],
        "token_count": 100
      }
    }
  }
}
```

说明：

- 普通会话直接调用 LLM。
- 文件会话先执行 RAG 检索，再调用 LLM。
- 一期不支持 SSE，接口返回完整回答。

### 3.6 PPT API

`POST /api/v1/ppt/jobs`

请求：

```json
{
  "file_id": "uuid",
  "title": "string",
  "topic": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "job_id": "uuid",
    "status": "pending"
  }
}
```

约束：

- `file_id` 必须属于当前用户。
- 文件状态必须为 `ready`。
- `title` 必填。
- `topic` 选填。

`GET /api/v1/ppt/jobs`

用途：

- 查询当前用户 PPT 任务列表。

`GET /api/v1/ppt/jobs/{job_id}`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "status": "running",
    "progress": 50,
    "error_message": null
  }
}
```

`GET /api/v1/ppt/jobs/{job_id}/download`

约束：

- 任务必须属于当前用户。
- 任务状态必须为 `succeeded`。
- 不暴露内部 `output_path`。

## 4. 数据模型设计

### 4.1 通用规范

- 主键：UUID。
- 时间字段：`TIMESTAMPTZ`。
- Python 时间：`datetime.now(timezone.utc)`。
- 扩展字段：统一命名 `metadata`，数据库类型 JSONB。
- 一期删除策略：物理删除。
- 一期不创建审计日志表。

### 4.2 `users`

职责：

- 保存本地用户。
- 保存钉钉身份映射。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 本地用户 ID |
| corp_id | VARCHAR | 钉钉企业 ID |
| dingtalk_user_id | VARCHAR | 钉钉用户 ID |
| union_id | VARCHAR NULL | 钉钉 union id |
| name | VARCHAR | 用户姓名 |
| avatar_url | TEXT NULL | 头像 |
| department_ids | JSONB NULL | 部门 ID |
| metadata | JSONB | 钉钉扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

索引：

- `(corp_id, dingtalk_user_id)` 唯一索引。
- `created_at DESC`。

### 4.3 `files`

职责：

- 保存用户上传文件元数据。
- 跟踪解析状态。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 文件 ID |
| user_id | UUID FK | 上传用户 |
| original_name | VARCHAR | 原始文件名 |
| storage_path | TEXT | 内部存储路径 |
| mime_type | VARCHAR NULL | MIME 类型 |
| extension | VARCHAR | 扩展名 |
| size_bytes | BIGINT | 文件大小 |
| status | VARCHAR | uploaded / processing / ready / failed |
| parse_error | TEXT NULL | 解析失败原因 |
| metadata | JSONB | 页数、解析统计等 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

索引：

- `user_id`。
- `status`。
- `created_at DESC`。

### 4.4 `file_chunks`

职责：

- 保存切分后的文本 chunk。
- 保存 embedding。
- 支撑单文件 RAG 检索。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | chunk ID |
| file_id | UUID FK | 所属文件 |
| user_id | UUID FK | 冗余用户 ID，用于权限过滤 |
| chunk_index | INTEGER | chunk 顺序 |
| content | TEXT | chunk 文本 |
| embedding | VECTOR(1024) | BGE-M3 dense vector |
| token_count | INTEGER NULL | token 数 |
| metadata | JSONB | 页码、段落等来源信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

索引：

- `file_id`。
- `user_id`。
- `(file_id, chunk_index)` 唯一索引。
- `embedding` 使用 ivfflat，lists=100。

说明：

- 以 `mvp_decision.md` 为准，embedding 维度为 BGE-M3 的 1024。
- 未来接 OpenAI Embedding 或外部 Vector DB 时，通过 `EmbeddingProvider` 和 `VectorStore` 抽象替换，不直接改 ChatService。

### 4.5 `chat_sessions`

职责：

- 保存会话。
- 区分普通对话和文件问答。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 会话 ID |
| user_id | UUID FK | 所属用户 |
| file_id | UUID FK NULL | 文件问答绑定文件 |
| title | VARCHAR | 会话标题 |
| mode | VARCHAR | general / file |
| metadata | JSONB | 扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束：

- `mode=file` 时必须有 `file_id`。
- 一期不支持一个会话绑定多个文件。

### 4.6 `chat_messages`

职责：

- 保存用户与助手消息。
- 保存 RAG 引用和 token 用量。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 消息 ID |
| session_id | UUID FK | 会话 ID |
| user_id | UUID FK | 所属用户 |
| role | VARCHAR | user / assistant / system |
| content | TEXT | 消息内容 |
| metadata | JSONB | chunk_ids、token_count、model 等 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### 4.7 `ppt_jobs`

职责：

- 保存 PPT 生成任务。
- 支撑状态轮询和下载。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 任务 ID |
| user_id | UUID FK | 所属用户 |
| file_id | UUID FK | 来源文件 |
| status | VARCHAR | pending / running / succeeded / failed |
| progress | INTEGER | 0-100 |
| title | VARCHAR | PPT 标题 |
| topic | TEXT NULL | 用户主题要求 |
| output_path | TEXT NULL | 内部输出路径 |
| error_message | TEXT NULL | 失败原因 |
| retry_count | INTEGER | 已重试次数 |
| metadata | JSONB | 页数、模板、LLM 输出摘要 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束：

- 任务必须属于当前用户。
- 来源文件必须属于当前用户且状态为 `ready`。
- 失败最多重试 1 次。

## 5. Service 层划分

### 5.1 `AuthService`

职责：

- 处理钉钉 auth code。
- 调用钉钉 API 获取用户信息。
- 创建或更新本地用户。
- 签发 access token / refresh token。
- 获取当前用户信息。

依赖：

- `UserRepository`
- `security.py`
- Dingtalk client

### 5.2 `FileService`

职责：

- 校验文件格式和大小。
- 调用 Storage 保存原始文件。
- 创建 `files` 记录。
- 触发后台解析任务。
- 查询文件列表和详情。
- 删除文件、chunks 和 PPT 产物。

依赖：

- `FileRepository`
- `FileChunkRepository`
- `PptJobRepository`
- `LocalStorage`
- BackgroundTasks

### 5.3 `ParserService`

职责：

- 根据扩展名选择 parser。
- 输出统一文本结果。
- 处理解析失败。

依赖：

- `TxtParser`
- `PdfParser`
- `DocxParser`

输出建议：

```text
ParsedDocument
  text: string
  metadata: dict
```

### 5.4 `EmbeddingService`

职责：

- 对 chunk 批量生成 embedding。
- 屏蔽具体 embedding provider。
- 一期调用本地 BGE-M3。
- 未来可切换 OpenAI Embedding。

依赖：

- `EmbeddingProvider`

### 5.5 `RagService`

职责：

- 对文件文本做 chunk 切分。
- 调用 `EmbeddingService`。
- 写入 `file_chunks`。
- 根据问题检索相关 chunks。
- 组装 LLM 上下文。

依赖：

- `FileChunkRepository`
- `EmbeddingService`
- `VectorStore`

关键约束：

- 检索必须带 `user_id` 和 `file_id`。
- 一期不做全局知识库。

### 5.6 `ChatService`

职责：

- 创建普通会话和文件问答会话。
- 保存用户消息。
- 普通会话直接调用 LLM。
- 文件会话调用 `RagService` 获取上下文后再调用 LLM。
- 保存助手消息。
- 返回消息结果。

依赖：

- `ChatRepository`
- `FileRepository`
- `RagService`
- `LLMProvider`

### 5.7 `PptService`

职责：

- 创建 PPT 任务。
- 校验文件归属和状态。
- 查询任务状态。
- 下载生成结果。
- 调用后台任务生成 PPT。

依赖：

- `PptJobRepository`
- `FileRepository`
- `WorkflowService`
- `LocalStorage`

### 5.8 `WorkflowService`

职责：

- 编排固定工作流。
- 一期主要服务 PPT 生成。
- 为未来 Agent Workflow 预留步骤状态和工具边界。

一期流程：

```text
读取文件内容
  -> 生成摘要
  -> 生成 PPT 大纲
  -> 生成页面 JSON
  -> 调用 PPTGenerator
  -> 保存文件
  -> 更新任务状态
```

说明：

- 一期不实现开放式 Agent。
- 不让 LLM 自主选择任意工具。
- Agent 扩展从这个服务演进，而不是从 API 层硬编码。

## 6. LLM 调用抽象方式

### 6.1 抽象目标

LLM 抽象要满足：

- 一期只接 Claude API。
- 未来可接 OpenAI API。
- ChatService 不关心具体模型 SDK。
- 统一处理 timeout、retry、token usage、错误。

### 6.2 Provider 接口

建议接口语义：

```text
LLMProvider
  chat(messages, model, temperature, max_tokens) -> LLMResponse
```

输入：

- `messages`：标准消息数组。
- `model`：环境变量配置。
- `temperature`：调用参数。
- `max_tokens`：最大输出长度。

输出：

```text
LLMResponse
  content: string
  model: string
  input_tokens: int | null
  output_tokens: int | null
  raw: dict | null
```

### 6.3 Provider 实现

一期启用：

- `ClaudeProvider`

预留但不默认启用：

- `OpenAIProvider`

配置建议：

```text
LLM_PROVIDER=claude
LLM_MODEL=claude-sonnet-5
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=...
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
```

说明：

- 一期不做前端模型选择。
- Provider 选择只通过后端环境变量。
- OpenAI Provider 可先保留文件位置和接口设计，实际实现可以后置。

## 7. 文件处理流程

### 7.1 上传流程

```text
POST /api/v1/files
  -> API 校验登录态
  -> FileService 校验格式和大小
  -> Storage 保存原始文件
  -> FileRepository 创建 files 记录(status=uploaded)
  -> BackgroundTasks 添加 parse_file_task
  -> 返回 file_id
```

### 7.2 解析流程

```text
parse_file_task(file_id)
  -> files.status = processing
  -> Storage 读取文件
  -> ParserService 解析文本
  -> RagService chunk 切分
  -> EmbeddingService 批量生成向量
  -> FileChunkRepository 写入 chunks
  -> files.status = ready
```

失败处理：

```text
解析失败
  -> files.status = failed
  -> files.parse_error = error message
  -> 日志记录异常
```

### 7.3 删除流程

```text
DELETE /api/v1/files/{file_id}
  -> 校验文件属于当前用户
  -> 删除 file_chunks
  -> 删除关联 PPT 输出文件
  -> 删除 ppt_jobs 或标记不可下载
  -> 删除原始文件
  -> 删除 files 记录
```

一期采用物理删除。

### 7.4 安全边界

- 不向前端返回 `storage_path` 或 `output_path`。
- 所有文件操作必须校验 `user_id`。
- 日志中不要输出完整文件内容。
- 不支持格式直接返回明确错误。
- 超过 20 MB 直接拒绝。

## 8. RAG 未来接入位置

### 8.1 一期 RAG 位置

一期 RAG 在后端内部实现，入口在：

```text
ChatService
  -> RagService
  -> VectorStore
  -> LLMProvider
```

数据写入入口在：

```text
FileService
  -> parse_file_task
  -> ParserService
  -> RagService.index_file()
```

### 8.2 VectorStore 抽象

建议接口语义：

```text
VectorStore
  upsert_chunks(file_id, user_id, chunks)
  search(file_id, user_id, query_embedding, top_k) -> list[ChunkMatch]
  delete_by_file(file_id, user_id)
```

一期实现：

- `PgVectorStore`

未来可替换：

- Milvus
- Qdrant
- Weaviate
- Pinecone
- Elasticsearch vector search

关键要求：

- `ChatService` 不直接写 pgvector SQL。
- `RagService` 只依赖 `VectorStore` 接口。
- 外部 Vector Database 接入时不改变 API 接口。

### 8.3 EmbeddingProvider 抽象

建议接口语义：

```text
EmbeddingProvider
  embed_texts(texts) -> list[list[float]]
  embed_query(text) -> list[float]
```

一期实现：

- `BgeM3EmbeddingProvider`

未来可替换：

- `OpenAIEmbeddingProvider`
- Qwen embedding
- DeepSeek embedding
- 企业内部 embedding 服务

注意：

- 不同 embedding 模型维度不同。
- 一期数据库字段固定为 `VECTOR(1024)`。
- 未来切换模型时需要 migration 或新增 embedding profile 机制。
- MVP 不提前设计多 embedding profile，只保留 Provider 接口。

## 9. Agent Workflow 预留方式

### 9.1 MVP 不做复杂 Agent

一期不要直接引入复杂 Agent 框架。

不做：

- 开放式工具调用。
- 自主规划多步任务。
- 多 Agent 协作。
- Agent 记忆系统。
- 可视化工作流编辑器。

### 9.2 先做确定性 Workflow

把 PPT 生成视为第一个确定性工作流：

```text
WorkflowService.run_ppt_generation(job_id)
  -> load source document
  -> summarize
  -> generate outline
  -> generate slides JSON
  -> validate JSON
  -> generate pptx
  -> save output
  -> mark job succeeded
```

这能保留未来 Agent 的核心位置，但不会把 MVP 复杂化。

### 9.3 未来扩展点

后续如果加入 Agent Workflow，可以逐步增加：

- `workflow_runs` 表。
- `workflow_steps` 表。
- tool registry。
- tool permission。
- step logs。
- human approval。
- retry / resume。
- workflow templates。

这些都不进入一期 MVP。

## 10. MVP 开发顺序建议

推荐实现顺序：

1. 创建 `backend/` 骨架和 `GET /health`。
2. 配置 PostgreSQL、pgvector、SQLAlchemy、Alembic。
3. 实现核心表 migration。
4. 实现认证和 JWT。
5. 实现文件上传和本地存储。
6. 实现文件解析和状态流转。
7. 实现 BGE-M3 embedding client。
8. 实现 pgvector chunk 入库和检索。
9. 实现普通聊天和文件问答。
10. 实现 PPT 任务、生成和下载。
11. 前端逐步替换 Mock API。
12. 补充测试、错误码、日志和文档状态。

## 11. 测试策略

优先测试：

- `AuthService`：用户创建或更新、JWT 签发。
- `FileService`：文件格式、大小限制、用户隔离。
- `ParserService`：TXT/PDF/DOCX parser happy path 和失败路径。
- `RagService`：按 `file_id` 和 `user_id` 检索。
- `ChatService`：普通对话、文件问答、消息保存。
- `PptService`：任务创建、状态流转、下载权限。

测试边界：

- 单元测试中 mock 钉钉、LLM、embedding 服务。
- 集成测试使用测试数据库。
- 不在测试中真实调用 Claude 或 OpenAI。
- 不测试复杂 PPT 样式，只测试文件生成和任务状态。

## 12. 明确不做

Backend 一期不做：

- 密码注册。
- 手机号登录。
- 钉钉内嵌免登。
- 多租户商业化能力。
- 部门级权限管理。
- 多 LLM Provider 切换 UI。
- 多模型选择 UI。
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
