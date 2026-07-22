# 企业内部 AI 助手 MVP 下一阶段开发计划

> 本计划基于当前项目分析与 `architecture_review.md`。
> 目标是把当前“文档 + 前端 Mock 原型”升级为可联调、可演示、可验收的完整 AI 应用 MVP。
> 本计划只做工程规划，不直接编写业务代码。

## 1. 当前状态

当前项目处于 **架构冻结 + 前端 Mock 原型阶段**。

已完成：

- `docs/` 已包含需求、架构、模块、API、数据库、MVP 决策、状态和架构评审文档。
- `mvp_decision.md` 已冻结一期核心决策，是后续开发的最高优先级依据。
- `frontend/` 已创建 React + Vite + TypeScript 工程。
- 前端已覆盖登录页、聊天页、文件中心、PPT 任务中心、欢迎页和消息渲染组件。
- 前端状态管理使用 Zustand。
- 当前前端可以通过 Mock 数据模拟登录、聊天、文件解析和 PPT 任务进度。
- 前端 TypeScript 检查已通过：`npm exec tsc -- --noEmit`。

当前限制：

- 尚未创建 `backend/`。
- 尚未创建 Docker Compose。
- 尚未接入 PostgreSQL、pgvector、Alembic。
- 尚未实现钉钉登录、JWT、真实文件上传、文档解析、RAG、LLM 调用、PPT 生成。
- 前端仍直接依赖 `mock.ts` 和本地 store，未接真实 API。

当前整体判断：

- 文档完成度较高。
- 前端原型完成度中等。
- 后端工程实现尚未开始。
- MVP 主业务闭环尚未打通。

## 2. 缺失模块

### 2.1 后端工程基础

缺失内容：

- FastAPI 应用入口。
- 配置加载。
- 统一响应格式。
- 统一异常处理。
- 日志配置。
- CORS 配置。
- 健康检查接口。
- Docker Compose。
- `.env.example`。

目标：

- 建立可启动、可联调、可扩展的后端单体应用骨架。

### 2.2 数据库与迁移

缺失内容：

- PostgreSQL + pgvector 服务。
- SQLAlchemy 模型。
- Alembic migration。
- 数据库连接管理。
- 核心业务表。

最小表：

- `users`
- `files`
- `file_chunks`
- `chat_sessions`
- `chat_messages`
- `ppt_jobs`

目标：

- 支撑登录、文件、RAG、聊天记录和 PPT 任务持久化。

### 2.3 认证模块

缺失内容：

- 钉钉扫码登录。
- 用户创建或更新。
- JWT access token。
- refresh token。
- `/api/v1/auth/me`。
- 前端 token 保存与登录态恢复。

目标：

- 用户可以完成登录，并让所有业务接口基于当前用户做数据隔离。

### 2.4 文件上传与解析模块

缺失内容：

- 文件上传 API。
- 文件格式校验：TXT、PDF、DOCX。
- 文件大小限制：20 MB。
- 本地文件存储。
- TXT/PDF/DOCX parser。
- 文件解析异步任务。
- 文件状态流转：uploaded -> processing -> ready / failed。
- 删除文件时同步删除 chunks 和 PPT 产物。

目标：

- 用户可以上传文件，并让系统解析出可用于 RAG 的文本。

### 2.5 Embedding 与 RAG 模块

缺失内容：

- BGE-M3 embedding 服务。
- 后端 embedding HTTP client。
- chunk 切分。
- `file_chunks.embedding` 入库。
- pgvector 按 `file_id` 检索。
- RAG 上下文组装。

目标：

- 用户可以围绕自己上传的单个文件进行问答。

### 2.6 LLM 模块

缺失内容：

- LLM Provider 接口。
- Claude Provider 实现。
- LLM 请求超时。
- 失败重试 1 次。
- token 用量和错误信息记录。

目标：

- 支持普通 AI 对话和基于 RAG 上下文的文件问答。

### 2.7 聊天模块

缺失内容：

- 创建会话。
- 查询会话。
- 发送消息。
- 保存用户消息和助手消息。
- 普通对话模式。
- 文件问答模式。
- 会话绑定 `file_id`。

目标：

- 前端聊天界面从 Mock 回复切换到真实后端对话。

### 2.8 PPT 生成模块

缺失内容：

- `ppt_jobs` 任务 API。
- BackgroundTasks 执行器。
- 基于文件内容生成 PPT 大纲。
- 基于结构化内容生成 PPT。
- python-pptx 固定模板。
- 任务状态查询。
- PPT 下载接口。

目标：

- 用户可以基于已解析完成的文件生成 5-15 页 PPT 并下载结果。

### 2.9 前端真实 API 接入

缺失内容：

- `api/client.ts`。
- `authApi.ts`、`filesApi.ts`、`chatApi.ts`、`pptApi.ts`。
- DTO 到前端 view model 的映射。
- 401 处理。
- API 错误展示。
- 文件状态轮询。
- PPT 任务状态轮询。

目标：

- 保留现有 UI 结构，逐步把 Mock 数据替换为真实 API。

## 3. 开发优先级

优先级原则：

- 先打通主链路，再优化体验。
- 先单体应用，再考虑队列和对象存储。
- 先单文件 RAG，再考虑企业知识库。
- 先固定 PPT 模板，再考虑模板编辑。
- 先确定性 Workflow，再考虑开放式 Agent。

开发优先级：

1. 后端工程骨架与 Docker Compose。
2. 数据库模型与 migration。
3. 认证与前端 API client。
4. 文件上传、解析与状态流转。
5. Embedding、chunk 入库与单文件 RAG。
6. 真实聊天接口与前端联调。
7. PPT 生成任务与下载。
8. 稳定性、测试、错误码和文档收敛。
9. 最小 Agent / Workflow 编排抽象。

## 4. 每个阶段目标

### 阶段一：后端最小工程初始化

目标：

- 创建可启动的 FastAPI 后端。
- 建立后端目录结构。
- 建立 Docker Compose 开发环境。
- 跑通健康检查。

范围：

- 创建 `backend/`。
- 创建 FastAPI app。
- 创建配置模块。
- 创建统一响应结构。
- 创建统一异常处理。
- 创建 `GET /health`。
- 创建 Docker Compose：`db`、`app`、`embedding`。
- 创建 `.env.example`。
- 配置前端 Vite 代理与后端 CORS。

验收标准：

- 后端可以启动。
- `GET /health` 返回 `{ "status": "ok" }`。
- 前端本地 Vite 能通过 `/api` 代理访问后端。
- Docker Compose 可以启动 PostgreSQL + 后端基础服务。

### 阶段二：数据库与基础模型

目标：

- 建立 MVP 必需数据模型和 migration。

范围：

- 配置 SQLAlchemy 2.0。
- 配置 Alembic。
- 启用 pgvector。
- 创建核心表 migration。
- 统一 UUID、TIMESTAMPTZ、JSONB `metadata` 字段规范。
- 将 `file_chunks.embedding` 设计为 `VECTOR(1024)`。

验收标准：

- migration 可以执行和回滚。
- 数据库中存在核心表。
- pgvector 扩展可用。
- 所有核心表具备必要索引和用户隔离字段。

### 阶段三：认证闭环

目标：

- 实现真实用户登录与登录态恢复。

范围：

- 后端实现钉钉扫码登录接口。
- 创建或更新本地用户。
- 签发 access token 和 refresh token。
- 实现 `/api/v1/auth/me`。
- 前端新增 API client。
- 前端登录页从 Mock 登录切换到真实登录流程。
- 前端保存 token 并在启动时恢复登录态。

验收标准：

- 用户可以完成登录。
- 登录后可进入主界面。
- 刷新页面后可以恢复登录态。
- 业务接口可以获得当前用户。
- 未登录访问业务接口返回明确错误。

说明：

- 如果钉钉联调暂时受阻，可以临时提供 dev mock 登录接口，但正式接口路径和响应结构必须保持不变。

### 阶段四：文件上传与解析

目标：

- 打通真实文件上传、存储和解析。

范围：

- 实现 `POST /api/v1/files`。
- 实现 `GET /api/v1/files`。
- 实现 `GET /api/v1/files/{file_id}`。
- 实现 `DELETE /api/v1/files/{file_id}`。
- 支持 TXT、PDF、DOCX。
- 限制单文件最大 20 MB。
- 保存原始文件到本地存储。
- 使用 BackgroundTasks 解析文件。
- 解析失败时保存失败原因。
- 前端文件中心改为读取真实文件列表。
- 前端轮询文件解析状态。

验收标准：

- 用户可以上传 TXT/PDF/DOCX。
- 超大文件或不支持格式会被拒绝。
- 文件状态可从 processing 变为 ready 或 failed。
- 用户只能看到自己的文件。
- 删除文件会同步删除 chunks 和 PPT 产物。

### 阶段五：Embedding 与单文件 RAG

目标：

- 实现基于单文件的知识问答能力。

范围：

- 部署 BGE-M3 embedding 服务。
- 后端实现 EmbeddingClient。
- 实现 chunk 切分：512 tokens，overlap 64 tokens。
- 将 chunk 和 1024 维 embedding 写入 `file_chunks`。
- 实现 pgvector 相似度检索。
- 检索必须同时按 `user_id` 和 `file_id` 过滤。
- 实现 RAG 上下文组装。

验收标准：

- 文件 ready 后存在 chunk 和 embedding。
- 查询时只检索当前文件。
- 不同用户之间不能互相检索文件内容。
- RAG 检索结果可以传给 LLM 生成回答。

### 阶段六：真实聊天接口

目标：

- 前端聊天从 Mock 回复切换到真实后端。

范围：

- 实现创建会话接口。
- 实现发送消息接口。
- 实现查询会话消息接口。
- 支持 `general` 普通对话。
- 支持 `file` 文件问答。
- 文件问答会话绑定单个 `file_id`。
- 保存用户消息、助手消息和必要 metadata。
- 前端新增 chat API 接入。
- 前端保留当前 UI，但数据来自后端。

验收标准：

- 用户可以创建普通会话。
- 用户可以创建文件问答会话。
- 普通会话可以得到 LLM 回答。
- 文件会话可以基于文件内容回答。
- 聊天记录刷新后仍存在。

### 阶段七：PPT 生成任务

目标：

- 实现基于已上传文件生成 PPT 的完整链路。

范围：

- 实现 `POST /api/v1/ppt/jobs`。
- 实现 `GET /api/v1/ppt/jobs/{job_id}`。
- 实现 `GET /api/v1/ppt/jobs/{job_id}/download`。
- 使用 BackgroundTasks 执行 PPT 生成。
- 任务状态持久化到 `ppt_jobs`。
- LLM 生成结构化 PPT 大纲和页面内容。
- python-pptx 根据固定模板生成文件。
- 前端 PPT 任务中心轮询真实任务状态。
- 下载真实 PPT 文件。

验收标准：

- 用户可以基于自己的 ready 文件创建 PPT 任务。
- 任务状态可查询。
- 成功后可下载 PPT。
- 失败时可看到错误信息。
- 任务最多失败重试 1 次。

### 阶段八：稳定性与验收收敛

目标：

- 让 MVP 达到可演示、可验收状态。

范围：

- 整理错误码。
- 完善日志。
- 补充关键 API 测试。
- 修复前后端联调问题。
- 补充空状态、失败态和加载态。
- 更新 `status.md`。
- 保持 `mvp_decision.md` 与实现一致。

验收标准：

- 主链路可以完整演示：登录 -> 上传文件 -> 文件解析 -> 文件问答 -> PPT 生成 -> 下载。
- 核心接口有基础测试。
- 常见失败场景有明确错误信息。
- 文档与代码状态一致。

### 阶段九：最小 Agent / Workflow 抽象

目标：

- 为后续 Agent 工作流预留可扩展边界，但不引入复杂框架。

范围：

- 将 PPT 生成中的固定步骤抽象为 `WorkflowService`。
- 记录任务步骤状态。
- 保留 tool registry 的未来扩展位置。
- 不实现开放式自主 Agent。
- 不实现多工具自由调用。

建议步骤：

```text
解析文件
  -> 生成摘要
  -> 生成 PPT 大纲
  -> 生成 PPT 内容 JSON
  -> 生成 PPT 文件
  -> 更新任务状态
```

验收标准：

- PPT 工作流步骤清晰。
- 单步失败能记录错误。
- 未来可扩展人工确认、大纲编辑、更多工具调用。

## 5. 技术方案选择

### 5.1 后端

选择：

- Python 3.12
- FastAPI
- SQLAlchemy 2.0
- Alembic
- Pydantic / pydantic-settings

理由：

- 开发效率高。
- 适合 AI 应用后端。
- 与文档规划一致。
- 生态中有成熟的文件解析、PPT 生成和 LLM SDK 支持。

### 5.2 数据库

选择：

- PostgreSQL 16
- pgvector

理由：

- 同时保存业务数据和向量数据，降低 MVP 运维复杂度。
- 单文件 RAG 场景不需要独立向量数据库。
- 后续数据规模扩大时仍可迁移到专用向量库。

### 5.3 Embedding

选择：

- BGE-M3
- 本地独立容器部署
- 向量维度 1024

理由：

- 中文和英文支持较好。
- 企业文档 embedding 不出域。
- 与 `mvp_decision.md` 一致。

### 5.4 LLM

选择：

- Claude API
- 一期只实现一个 Provider

理由：

- 减少早期复杂度。
- Provider 接口可预留，但不做多模型切换。
- 模型名、Base URL、API Key 通过环境变量配置。

### 5.5 文件解析

选择：

- TXT：直接文本读取。
- PDF：PyMuPDF。
- DOCX：python-docx。

理由：

- 覆盖 MVP 核心文本格式。
- 实现简单。
- XLSX / PPTX 留到二期。

### 5.6 PPT 生成

选择：

- python-pptx
- 固定模板
- LLM 生成结构化 JSON，再由代码生成 PPT

理由：

- 输出可控。
- 避免让 LLM 直接控制文件生成逻辑。
- 固定模板符合 MVP 优先原则。

### 5.7 异步任务

选择：

- FastAPI BackgroundTasks
- 任务状态持久化到数据库
- 前端轮询

理由：

- 一期不引入 Celery。
- API 可以围绕 `job_id` 设计，后续迁移 Celery 时减少改动。
- 数据库持久化避免关键状态只存在内存中。

### 5.8 前端

选择：

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand

理由：

- 当前已落地。
- 适合快速开发企业内部工具。
- Zustand 足够支撑 MVP 状态管理，不需要 Redux。

## 6. 文件结构变化建议

建议目标结构：

```text
project/
  docs/
  docker-compose.yml
  .env.example
  backend/
    pyproject.toml
    alembic.ini
    app/
      main.py
      api/
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
        auth.py
        file.py
        chat.py
        ppt.py
        common.py
      repositories/
        user_repository.py
        file_repository.py
        file_chunk_repository.py
        chat_repository.py
        ppt_job_repository.py
      services/
        auth_service.py
        file_service.py
        chat_service.py
        ppt_service.py
        workflow_service.py
      llm/
        base.py
        claude.py
      embedding/
        client.py
      parsers/
        base.py
        txt_parser.py
        pdf_parser.py
        docx_parser.py
      storage/
        local_storage.py
      tasks/
        file_tasks.py
        ppt_tasks.py
    alembic/
    tests/
    uploads/
    ppt_outputs/
  frontend/
    src/
      api/
        client.ts
        authApi.ts
        filesApi.ts
        chatApi.ts
        pptApi.ts
        mock.ts
      components/
      stores/
      types/
      utils/
```

结构原则：

- 后端保持单体，不拆微服务。
- API 层不直接访问数据库。
- Service 层负责业务编排。
- Repository 层负责数据访问。
- LLM、Embedding、Parser、Storage 都要有明确边界。
- 前端先保留现有组件，优先增加 API client 和真实数据接入。
- `mock.ts` 可以保留为开发演示后备，但不应成为真实业务状态来源。

## 7. 风险点

### 7.1 钉钉联调风险

风险：

- 钉钉应用配置、回调地址、企业权限可能拖慢开发。

应对：

- 先按正式接口形状实现 dev mock 登录。
- 钉钉真实联调独立收敛。
- 不让钉钉阻塞文件/RAG/PPT 后端开发。

### 7.2 BGE-M3 本地部署资源风险

风险：

- 本地 embedding 服务可能占用较多内存和启动时间。

应对：

- embedding client 保持接口化。
- 开发期允许使用小样本文档测试。
- 必要时提供 dev stub，但生产路径仍以 BGE-M3 为准。

### 7.3 PDF 解析质量风险

风险：

- 扫描件、复杂排版 PDF 解析质量不稳定。

应对：

- MVP 明确只支持文本型 PDF。
- 解析失败给出清晰错误。
- OCR 留到二期。

### 7.4 RAG 效果风险

风险：

- chunk 策略、检索数量、上下文组装会影响回答质量。

应对：

- 一期固定 chunk 512 tokens、overlap 64。
- 按 `file_id` 精确过滤。
- 保留 chunk metadata 和引用信息，便于调试。

### 7.5 PPT 输出质量风险

风险：

- 固定模板可能无法满足所有业务汇报场景。

应对：

- 一期只保证结构清晰、可下载、可编辑。
- 输出 5-15 页。
- 二期再做模板选择和大纲编辑。

### 7.6 BackgroundTasks 可靠性风险

风险：

- 服务重启会中断正在执行的任务。

应对：

- 任务状态必须持久化。
- 失败原因必须记录。
- 一期接受该限制。
- 二期再迁移 Celery。

### 7.7 前端 Mock 切换风险

风险：

- 当前 store 与 Mock 数据耦合，直接切换真实 API 可能造成较多改动。

应对：

- 先新增 API client 和 DTO 映射。
- 按模块逐步替换：auth -> files -> chat -> ppt。
- 保留 UI，不先做大规模重构。

### 7.8 企业数据安全风险

风险：

- 企业文件、聊天内容、LLM 请求可能涉及敏感数据。

应对：

- embedding 本地化。
- 所有业务查询按 `user_id` 隔离。
- 文件路径不暴露给前端。
- Claude API 合规要求需在上线前确认。
- 一期不做审计日志，但日志中避免输出完整文件内容。

## 8. 明确不做

下一阶段仍然不做：

- 密码注册 / 手机号登录。
- 钉钉内嵌免登。
- 多 LLM Provider 切换。
- 多模型选择 UI。
- 企业全局知识库。
- 多文件联合问答。
- XLSX / PPTX 解析。
- Celery。
- MinIO / OSS。
- SSE / WebSocket 流式输出。
- 微服务。
- 微前端。
- 管理员后台。
- 部门级权限。
- 审计日志。
- 文件病毒扫描。
- 文件自动过期清理。

## 9. MVP 验收标准

MVP 完成时必须能演示以下闭环：

1. 用户进入前端并完成登录。
2. 登录后进入企业 AI 助手主界面。
3. 用户上传一个 TXT/PDF/DOCX 文件。
4. 后端保存文件并异步解析。
5. 文件状态变为 ready。
6. 用户围绕该文件提问。
7. 后端按 `file_id` 检索 chunk，并调用 LLM 返回回答。
8. 聊天记录可保存和再次查看。
9. 用户基于该文件创建 PPT 生成任务。
10. 前端可以查看任务状态。
11. 任务成功后用户可以下载 PPT。

MVP 完成的最低质量要求：

- 所有业务数据按当前用户隔离。
- 所有业务接口默认需要 JWT。
- 常见错误有明确提示。
- 文件格式和大小限制生效。
- RAG 检索必须按 `file_id` 过滤。
- PPT 任务状态必须持久化。
- 文档与代码状态保持一致。
