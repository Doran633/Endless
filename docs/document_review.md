# 项目文档同步审查

> 本报告基于当前 `docs/` 下所有 Markdown 文档和当前代码结构生成。
> 本次不修改业务代码，也不直接修改原文档。
> 目标是标注哪些文档与当前代码状态不一致，以及后续同步时应如何修改。

## 1. 当前代码状态摘要

当前项目已完成第一次 Git commit，代码结构已经不再是纯文档阶段。

当前实际结构：

```text
project/
  backend/
    requirements.txt
    app/
      main.py
      api/v1/
        chat.py
        health.py
      core/
        config.py
        responses.py
      schemas/
        chat.py
      services/
        chat_service.py
        llm_service.py
      llm/
        base.py
        mock_provider.py
        openai_provider.py
  frontend/
    src/
      api/mock.ts
      stores/
      components/
      types/
  docs/
  review_report.md
```

当前已实现能力：

- 前端 React/Vite 原型已存在，但聊天、文件、PPT 仍然使用 Mock 数据。
- 后端 FastAPI 骨架已存在。
- 后端已实现 `GET /health`。
- 后端已实现基础聊天接口：
  - `POST /chat`
  - `POST /api/v1/chat`
- 后端已实现基础 LLM 抽象：
  - `LLMProvider`
  - `MockLLMProvider`
  - `OpenAIProvider`
  - `LLMService`
  - `ChatService`

当前未实现能力：

- 前端未接入后端聊天接口。
- 没有数据库。
- 没有 SQLAlchemy / Alembic。
- 没有文件上传。
- 没有文档解析。
- 没有 embedding。
- 没有向量检索。
- 没有 RAG 问答。
- 没有钉钉登录、JWT、企业权限。
- 没有 PPT 真实生成。

当前最新路线：

- `docs/v1_roadmap.md` 已将 v1.0 目标调整为 **独立网页版 AI 助手**。
- v1.0 必须实现 Web 聊天、LLM API 调用、文件上传、文档解析、RAG 问答。
- v1.0 暂不实现钉钉登录、企业权限、多租户、微服务、复杂任务队列。

## 2. 文档整体同步结论

当前文档存在两套语境：

1. 旧语境：企业内部 AI 助手 MVP，包含钉钉登录、企业权限边界、PPT 生成。
2. 新语境：v1.0 独立网页版 AI 助手，优先 Web 聊天、LLM、文件上传、解析、RAG。

保留旧设计思想是有价值的，例如：

- 单体架构。
- API -> Service -> Repository 分层。
- LLM Provider 抽象。
- Parser / Storage / VectorStore 抽象。
- 不提前引入微服务、复杂队列、多租户。

但文档必须区分：

- **当前代码状态**：已经有前端原型和最小后端聊天模块。
- **v1.0 当前目标**：独立网页版 AI 助手。
- **企业版规划**：钉钉登录、企业权限、PPT 等应后置或标记为历史/后续方向。

建议后续同步原则：

- 不删除旧设计思想。
- 不把企业系统能力继续写成 v1.0 必做。
- 不把未来规划误写成当前已实现。
- 在每份文档顶部增加“当前适用阶段”说明。

## 3. `architecture.md` 审查

### 当前是否符合架构

部分符合，但不再准确反映当前代码状态和 v1.0 目标。

仍然符合的内容：

- 单体后端方向正确。
- API / Service / Repository 分层思想正确。
- LLM、Parser、FileService、存储抽象的设计思想仍可保留。
- RAG 的单文件问答边界仍适合 v1.0。

不符合当前状态的内容：

- 文档标题和目标仍是“企业内部 AI 助手 MVP”。
- 核心目标仍写“支持钉钉登录”和“基于文件生成 PPT”。
- LLM 部分写“一期唯一 LLM Provider：Claude API”，但当前代码实现的是 `MockLLMProvider` 和 `OpenAIProvider`。
- 基础设施写 Docker Compose、PostgreSQL、pgvector、Redis，但当前代码尚未实现这些。
- 系统组件写钉钉开放平台、PPT 输出、PostgreSQL 等，但当前代码没有这些能力。
- 目录结构部分写“当前阶段不创建 backend 和 frontend”，这与当前代码状态冲突。
- 当前阶段说明仍写“不创建后端工程、不创建前端工程、不写业务代码”，已经明显过期。

### 建议修改

建议将 `architecture.md` 调整为“当前 v1.0 架构设计”，并保留企业能力作为后续方向。

应修改：

- 标题从“企业内部 AI 助手 MVP 架构设计”调整为“独立网页版 AI 助手 v1.0 架构设计”。
- 当前目标改为：
  - Web 聊天。
  - LLM API 调用。
  - 文件上传。
  - 文档解析。
  - RAG 问答。
- 当前已实现部分新增：
  - FastAPI backend skeleton。
  - `GET /health`。
  - `POST /chat` / `POST /api/v1/chat`。
  - LLM Provider 基础抽象。
  - Mock/OpenAI Provider。
- 钉钉登录、企业权限、PPT 生成从当前目标移到“后续方向”或“暂不实现”。
- 技术栈区分“已落地”和“计划接入”。
- 删除或改写“当前阶段不创建 backend/frontend”的旧表述。

### 新增/修改原因

- 当前项目已经进入代码实现阶段，继续保留“纯文档阶段”描述会误导后续开发。
- v1.0 目标已经调整为独立网页版 AI 助手，架构文档应成为当前路线的主依据之一。
- 保留分层与抽象思想，有利于后续 RAG 和 Agent，但应避免把企业集成写成当前范围。

## 4. `module_design.md` 审查

### 当前是否包含当前模块

部分包含，但缺少当前已经落地的模块细节。

已覆盖的设计思想：

- `api/v1`、`core`、`schemas`、`services`、`llm` 等模块职责方向正确。
- “API 层不直接访问数据库、不直接调用 LLM”的原则正确。
- Zustand 作为前端状态管理的选择与当前代码一致。

缺失或不准确之处：

- 当前后端已存在：
  - `backend/app/main.py`
  - `api/v1/chat.py`
  - `api/v1/health.py`
  - `core/config.py`
  - `core/responses.py`
  - `schemas/chat.py`
  - `services/chat_service.py`
  - `services/llm_service.py`
  - `llm/base.py`
  - `llm/mock_provider.py`
  - `llm/openai_provider.py`
- 文档仍以建议模块为主，没有标注哪些模块已经落地。
- `llm` 部分仍写只实现 Claude Provider，但当前代码实际实现了 Mock 和 OpenAI Provider。
- `background_tasks`、PPT 相关设计仍写成一期模块，但 v1.0 暂不实现复杂任务队列和 PPT。
- 前端模块没有反映当前真实情况：`api/` 里只有 `mock.ts`，store 仍直接依赖 Mock。

### 建议修改

建议在 `module_design.md` 中增加“当前已落地模块”和“v1.0 待落地模块”两节。

应新增当前已落地模块：

- `main.py`：FastAPI 应用入口。
- `api/v1/health.py`：健康检查。
- `api/v1/chat.py`：基础聊天接口。
- `core/config.py`：LLM 配置读取。
- `core/responses.py`：统一成功响应。
- `schemas/chat.py`：聊天请求/响应 schema。
- `services/chat_service.py`：聊天业务编排。
- `services/llm_service.py`：LLM Provider 选择。
- `llm/base.py`：LLM 抽象。
- `llm/mock_provider.py`：本地开发 provider。
- `llm/openai_provider.py`：OpenAI-compatible provider。

应调整当前 v1.0 待落地模块：

- `frontend/src/api/chatApi.ts`
- `files` API
- `parsers`
- `embedding`
- `vector_store`
- `rag_service`

应后置或标记暂不实现：

- `AuthService` / 钉钉。
- `PptService`。
- `background_tasks` 中复杂任务。

### 新增/修改原因

- 当前模块设计应帮助开发者理解已经存在的代码，而不是只描述未来建议。
- 明确 Mock/OpenAI Provider 现状，可以避免继续按“Claude-only”错误路线实现。
- 将 RAG 相关模块标记为待落地，有助于下一阶段按 v1.0 路线推进。

## 5. `database_design.md` 审查

### 当前是否与数据库状态一致

不一致。

当前代码状态：

- 没有数据库。
- 没有 SQLAlchemy。
- 没有 Alembic。
- 没有 models。
- 没有 migration。
- 没有 `users`、`files`、`file_chunks`、`chat_sessions`、`chat_messages`、`ppt_jobs` 表。

当前文档状态：

- 文档是目标数据库设计，而不是当前数据库状态。
- 表结构大多仍围绕企业版/钉钉/PPT 设计。
- `file_chunks` 部分出现 embedding 维度冲突：
  - 中间写 `1536` / `text-embedding-3-small`。
  - 结尾又写 BGE-M3 / `1024`。

### 建议修改

建议将 `database_design.md` 明确标记为“目标设计，当前尚未实现”。

应修改：

- 开头增加当前状态：
  - 当前无数据库实现。
  - 当前无 ORM/migration。
  - v1.0 可以先选择轻量本地存储或正式 PostgreSQL + pgvector。
- 将企业版 `users` / 钉钉字段标记为后续企业系统接入需要，而非 v1.0 当前必需。
- v1.0 最小数据模型建议调整为：
  - `files`
  - `document_chunks`
  - `chat_sessions`（可选，若 v1.0 需要会话持久化）
  - `chat_messages`（可选）
- 如果暂时不做登录，`user_id` 可后置或使用本地匿名 workspace/session 标识，但要明确这是 v1.0 简化。
- 统一 embedding 维度描述，删除或标记 `1536 text-embedding-3-small` 为历史方案。
- 保留 `VectorStore` 抽象，避免数据库设计绑定死 pgvector。

### 新增/修改原因

- 文档目前容易让开发者误以为数据库已经存在或必须立即实现完整企业版表结构。
- v1.0 目标是独立网页版 AI 助手，数据库设计应优先支撑文件、chunk、RAG。
- embedding 维度冲突会直接导致 migration 错误，必须在实现前消除。

## 6. `mvp_decision.md` 审查

### 是否需要更新当前阶段决策

需要，但不建议直接覆盖原有内容。

原因：

- `mvp_decision.md` 是此前企业内部 AI 助手的冻结决策记录。
- 它仍有历史价值，记录了企业版方向的边界和技术原则。
- 但当前 v1.0 目标已经调整为独立网页版 AI 助手，不再接入钉钉、企业权限、多租户，也暂不做 PPT。

当前不一致点：

- 项目定位仍是企业内部 AI 助手。
- 核心闭环仍包含钉钉登录和 PPT 生成。
- 技术选型仍默认 Claude、BGE-M3、PostgreSQL + pgvector、Docker Compose。
- 暂不实现列表没有体现“v1.0 暂不做企业系统集成”的新决策。
- 当前代码已实现 Mock/OpenAI Provider，而文档仍写 LLM 为 Claude API。

### 建议修改

建议不要把旧企业版决策直接删除，而是增加顶部状态说明：

```text
本文为企业内部 AI 助手 MVP 的历史冻结决策。
当前 v1.0 路线已调整为独立网页版 AI 助手。
v1.0 当前依据以 docs/v1_roadmap.md 为准。
```

建议新增一节“v1.0 当前阶段决策覆盖”：

- v1.0 不接入钉钉。
- v1.0 不实现企业权限。
- v1.0 不实现多租户。
- v1.0 不实现 PPT。
- v1.0 必须实现 Web 聊天、LLM API、文件上传、文档解析、RAG。
- 当前 LLM Provider 现状：Mock + OpenAI-compatible，Claude 可作为后续 provider。
- 数据库方案未最终落地，可在轻量本地存储与 PostgreSQL + pgvector 间选择，但必须保留 `VectorStore` 抽象。

### 新增/修改原因

- 保留历史企业版决策，避免丢失设计思想。
- 明确 v1.0 当前依据，避免后续开发继续误以为钉钉/PPT 是当前必做。
- 不随意扩大项目范围，只做目标收敛。

## 7. 其他文档同步建议

### 7.1 `requirements.md`

当前状态：

- 仍完整围绕企业内部 AI 助手、钉钉登录、PPT 生成。
- 当前约束仍写“不创建 backend 和 frontend 工程代码”，已过期。

建议：

- 标记为“企业版历史需求”或更新为 v1.0 独立网页版需求。
- v1.0 必须范围改为 Web 聊天、LLM、文件上传、解析、RAG。
- 钉钉和 PPT 移出 v1.0 必须范围。

原因：

- 需求文档是开发入口，当前最容易误导范围。

### 7.2 `api_design.md`

当前状态：

- 仍默认所有业务接口需要 JWT。
- 认证接口以钉钉为主。
- 聊天接口设计是完整会话 API，但当前代码只有 `POST /chat` 和 `POST /api/v1/chat`。

建议：

- 增加“当前已实现 API”小节：
  - `GET /health`
  - `POST /chat`
  - `POST /api/v1/chat`
- 增加“v1.0 目标 API”小节：
  - 普通聊天。
  - 文件上传。
  - 文件解析状态。
  - 文件 RAG 问答。
- JWT/钉钉相关接口标记为后续企业版。

原因：

- API 文档应区分当前实现、v1.0 目标、后续企业功能。

### 7.3 `status.md`

当前状态：

- 写“架构冻结阶段已完成，可进入工程初始化阶段”。
- 写“下一步创建 backend 和 frontend 工程代码”。
- 与当前已有 `backend/`、`frontend/` 冲突。

建议：

- 更新为：
  - 已完成第一次 Git commit。
  - 已有 frontend Mock 原型。
  - 已有 backend 基础聊天模块。
  - v1.0 路线已调整为独立网页版 AI 助手。
  - 下一步：前端接入后端 `/api/v1/chat`。

原因：

- `status.md` 应反映当前项目状态，而不是历史阶段。

### 7.4 `development_plan.md`

当前状态：

- 已比旧文档新，但仍包含认证、钉钉、PPT 生成等企业版目标。

建议：

- 保留工程分层思想。
- 当前 v1.0 路线应以 `v1_roadmap.md` 为准。
- 后续可将 `development_plan.md` 改为更通用的工程计划，或标记为企业版 MVP 计划。

原因：

- 当前开发重点已经从企业版闭环转为独立 AI 助手 RAG 闭环。

### 7.5 `backend_design.md`

当前状态：

- 设计结构清晰，但仍以钉钉、用户权限、PPT 为一期目标。
- 与当前 v1.0 独立网页版路线部分冲突。

建议：

- 增加“v1.0 当前后端范围”：
  - Chat。
  - LLM。
  - Files。
  - Parsers。
  - Embedding。
  - VectorStore。
  - RAG。
- Auth、PPT、Workflow 标记为后续扩展。
- 当前实现状态补充为已存在 Mock/OpenAI Provider。

原因：

- 该文档会指导后端实现，必须与 v1.0 当前目标一致。

### 7.6 `architecture_review.md`

当前状态：

- 它反映的是生成时的“前端 Mock 原型 + 后端未创建”状态。
- 现在后端基础聊天模块已创建，因此部分结论过期。

建议：

- 不必立刻重写全文。
- 可在顶部追加“状态更新”：
  - backend 已创建。
  - 基础聊天模块已实现。
  - v1.0 路线已调整。

原因：

- 保留当时审查价值，同时避免与当前代码冲突。

### 7.7 `chat_module.md`

当前状态：

- 与当前代码基本一致。
- 清楚说明了基础聊天模块、Mock/OpenAI Provider 和后续扩展。

建议：

- 暂不需要修改。

原因：

- 它是当前后端聊天模块最准确的说明文档。

### 7.8 `v1_roadmap.md`

当前状态：

- 与最新目标一致。
- 是当前 v1.0 路线最准确的文档。

建议：

- 可作为当前阶段最高优先级路线依据。
- 后续同步其他文档时引用它。

原因：

- 它明确收敛了当前范围，没有扩大项目目标。

## 8. 建议的文档优先级

当前建议文档优先级：

1. `docs/v1_roadmap.md`：当前 v1.0 路线依据。
2. `docs/chat_module.md`：当前后端聊天模块事实说明。
3. `review_report.md`：当前代码审查问题清单。
4. `docs/backend_design.md`：后端目标设计，但需同步 v1.0 范围。
5. `docs/architecture.md`：总体架构设计，但需从企业版同步到 v1.0。
6. `docs/module_design.md`：模块职责设计，但需补充当前已落地模块。
7. `docs/database_design.md`：目标数据库设计，但当前尚未实现。
8. `docs/mvp_decision.md`：企业版历史冻结决策，应标记为历史/后续依据。

## 9. 建议后续同步顺序

建议不要一次性重写所有文档，按以下顺序小步同步：

1. 更新 `status.md`，先让项目状态准确。
2. 更新 `requirements.md`，明确 v1.0 独立网页版 AI 助手范围。
3. 更新 `architecture.md`，把当前架构从企业版调整为 v1.0。
4. 更新 `module_design.md`，补充已落地后端聊天模块。
5. 更新 `api_design.md`，区分当前已实现 API 和 v1.0 目标 API。
6. 更新 `backend_design.md`，将 Auth/PPT 后置，突出 Chat/File/RAG。
7. 更新 `database_design.md`，标注当前无数据库实现并消除 embedding 维度冲突。
8. 更新 `mvp_decision.md`，增加历史说明和 v1.0 决策覆盖。

## 10. 本次审查结论

当前项目文档已经有较好的设计积累，但与代码状态和 v1.0 目标存在明显不同步：

- 多份文档仍写纯文档阶段，但项目已经有前端和后端代码。
- 多份文档仍写企业内部 AI 助手一期，但 v1.0 已调整为独立网页版 AI 助手。
- 多份文档仍把钉钉登录、企业权限、PPT 生成写成当前目标，但它们已被 v1.0 暂缓。
- 数据库文档存在目标设计与当前实现状态不一致，以及 embedding 维度冲突。

建议下一步先同步 `status.md` 和 `requirements.md`，再同步架构与模块文档。这样能让后续开发更稳，不会被旧范围带偏。
