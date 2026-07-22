# 企业内部 AI 助手 MVP 架构评审

> 本评审基于当前仓库代码态与文档态，不是历史设计评审。
> 当前项目定位：类似 WorkBuddy 的企业内部 AI 助手 MVP。
> 当前最高优先级决策文档：`mvp_decision.md`。

## 1. 总体结论

当前项目处于 **架构冻结 + 前端 Mock 原型阶段**，还不是可联调、可验收的 MVP。

项目已经完成了较完整的产品与架构文档，并实现了一套可编译的前端演示原型。前端覆盖登录、聊天、文件中心、PPT 任务中心等主要入口，适合用于早期体验验证、需求对齐和 UI 流程讨论。

但当前尚未创建 `backend/`，也没有真实数据库、认证、文件上传、文档解析、RAG、LLM 调用、PPT 生成或 Agent 工作流实现。后续工程化重点应放在后端单体架构落地、前端从 Mock 状态切换到真实 API、以及 RAG/PPT 等核心链路的最小可用闭环。

本次只读检查中，前端执行 `npm exec tsc -- --noEmit` 通过，说明当前 TypeScript 类型层面可编译。

## 2. 项目目录结构

当前项目根目录为：

```text
project/
  docs/
  frontend/
  .gitignore
```

### 2.1 `docs/`

`docs/` 是当前项目最成熟的部分，用于记录企业 AI 助手 MVP 的需求、架构和实施计划。

主要文档职责：

- `requirements.md`：描述项目定位、MVP 范围、核心业务流程和验收标准。
- `mvp_decision.md`：记录一期 MVP 的冻结决策，是当前最权威的架构依据。
- `architecture.md`：描述系统整体架构、后端分层、RAG、PPT、存储和基础设施设计。
- `module_design.md`：描述后端与前端模块职责。
- `api_design.md`：定义 REST API 路径、响应格式、认证、文件、聊天、PPT 等接口契约。
- `database_design.md`：定义用户、文件、chunk、聊天、PPT 任务等核心数据模型。
- `development_plan.md`：描述阶段计划和第一、第二周建议开发节奏。
- `status.md`：记录当前项目状态和下一步行动。
- `architecture_review.md`：记录本次当前代码态与文档态评审。

### 2.2 `frontend/`

`frontend/` 已经是一个 React + Vite 前端工程，包含：

- `package.json` / `package-lock.json`：前端依赖和脚本。
- `vite.config.ts`：Vite 配置，已设置 `/api` 代理到 `http://localhost:8000`。
- `tsconfig.json`：TypeScript 严格模式配置。
- `index.html`：前端入口 HTML。
- `src/`：应用源码。

当前 `frontend/dist/` 和 `node_modules/` 存在于本地目录，但已被根级 `.gitignore` 忽略，不属于核心评审对象。

### 2.3 `frontend/src/components/`

组件层负责当前前端原型的主要用户界面：

- `LoginPage.tsx`：模拟钉钉扫码登录入口。
- `ChatLayout.tsx`：登录后的整体布局，组合侧边栏、聊天区、文件中心和 PPT 任务中心。
- `Sidebar.tsx`：导航、会话列表、新建会话、退出登录。
- `ChatArea.tsx`：聊天消息区域、会话标题、输入框挂载和加载态。
- `ChatInput.tsx`：消息输入、Enter 发送、Shift+Enter 换行。
- `MessageBubble.tsx`：消息展示，包含简易 Markdown、代码块、表格、文件引用卡片和 PPT 卡片渲染。
- `FileCenter.tsx`：文件上传入口、文件列表、问答入口、PPT 生成入口。
- `PptTaskCenter.tsx`：PPT 任务列表、进度、下载按钮模拟。
- `WelcomePage.tsx`：欢迎页和快速开始入口。

### 2.4 `frontend/src/stores/`

状态层使用 Zustand，当前完全基于本地 Mock 数据：

- `authStore.ts`：保存模拟用户、登录状态、模拟登录和退出。
- `chatStore.ts`：保存会话、消息、当前会话、发送消息流程，并调用 Mock AI 回复。
- `fileStore.ts`：保存本地文件列表，模拟上传、解析中、解析完成状态。
- `pptStore.ts`：保存 PPT 任务列表，模拟 pending、running、succeeded 进度流转。

这些 store 目前既承担状态管理，也直接承担业务模拟逻辑。后续接真实后端时，应拆出 API client 和 DTO 映射层，避免组件与 Mock 实现继续耦合。

### 2.5 `frontend/src/api/mock.ts`

`mock.ts` 提供：

- 预设会话。
- 预设消息。
- 预设文件。
- 模拟 AI 回复模板。
- `generateAIResponse()` 异步模拟函数。

当前前端所有“AI 聊天、文件问答、PPT 结果”都来自这里或本地 store，并未调用真实 LLM、RAG 或后端 API。

### 2.6 `backend/`

当前仓库尚未创建 `backend/`。

这是当前最大实现缺口。企业 AI 助手 MVP 的真实复杂度主要集中在后端，包括：

- 钉钉 OAuth 登录。
- JWT access token / refresh token。
- 用户、文件、chunk、会话、消息、PPT 任务数据模型。
- 文件上传和本地存储。
- TXT/PDF/DOCX 解析。
- BGE-M3 embedding 服务调用。
- pgvector 检索。
- Claude API 调用。
- PPT 生成任务。
- 后续 Agent 工作流编排。

## 3. 模块职责说明

### 3.1 当前前端模块职责

当前前端承担的是演示原型职责：

- 展示企业 AI 助手的主界面信息架构。
- 验证登录、聊天、文件、PPT 三个主入口是否符合用户预期。
- 用本地状态模拟异步体验，如 AI 回复、文件解析、PPT 生成进度。
- 为后续后端 API 联调提供页面承载层。

当前前端不承担真实业务能力：

- 不做真实认证。
- 不持久化 token。
- 不上传文件到服务器。
- 不解析文档。
- 不调用 embedding 或 LLM。
- 不生成 PPT 文件。
- 不下载真实产物。

### 3.2 文档规划中的后端模块职责

根据 `architecture.md`、`module_design.md` 和 `mvp_decision.md`，后端应采用单体分层：

```text
api/v1
  -> services
  -> repositories
  -> database
```

建议职责边界：

- `api/v1`：HTTP 路由、参数校验、认证依赖、统一响应。
- `services`：业务流程编排，如登录、文件解析、RAG 问答、PPT 任务。
- `repositories`：数据库读写、CRUD、pgvector 查询封装。
- `models`：SQLAlchemy ORM 模型。
- `schemas`：Pydantic 请求/响应模型。
- `core`：配置、数据库连接、JWT、异常、日志。
- `llm`：Claude Provider 接口和实现。
- `embedding`：BGE-M3 embedding 服务客户端。
- `parsers`：TXT/PDF/DOCX 文档解析器。
- `storage` 或 `file_service`：本地文件保存、读取、删除，隔离未来 OSS/MinIO 替换。
- `background_tasks` 或 `jobs`：文件解析、PPT 生成等耗时任务入口。

### 3.3 当前模块边界评价

前端模块拆分清晰，页面和状态管理基本分离，适合 MVP 原型阶段。

但从可扩展性看，当前仍有三个问题：

- store 直接依赖 Mock 数据，后续替换真实 API 时会集中修改 store。
- 类型命名存在前后端风格混用，如 `fileId` 与 API 文档中的 `file_id`，后续需要 DTO 映射。
- UI、模拟异步流程和业务语义混在一起，后续接真实任务状态时需要收敛为后端驱动。

## 4. 当前技术栈

### 4.1 已落地技术栈

当前仓库实际已落地：

- React 18
- TypeScript
- Vite
- Ant Design 5
- `@ant-design/icons`
- Zustand
- dayjs

当前前端脚本：

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview"
}
```

### 4.2 文档规划技术栈

文档规划的一期 MVP 技术栈：

- 后端：Python 3.12、FastAPI、SQLAlchemy 2.0、Alembic。
- 数据库：PostgreSQL 16 + pgvector。
- Embedding：BGE-M3，本地部署，1024 维。
- LLM：Claude API，通过环境变量配置模型、API Key 和 Base URL。
- 文件解析：TXT、PDF、DOCX；PDF 使用 PyMuPDF，DOCX 使用 python-docx。
- PPT 生成：python-pptx，固定模板。
- 存储：本地文件系统。
- 部署：Docker Compose，服务包括 `db`、`app`、`embedding`。
- Redis：一期不强依赖，不作为默认业务依赖。

### 4.3 当前未落地技术栈

以下能力目前只有文档规划，没有代码实现：

- FastAPI 后端。
- PostgreSQL / pgvector。
- SQLAlchemy / Alembic。
- 钉钉 OAuth。
- JWT 签发、刷新和鉴权。
- 文件上传和本地存储。
- 文件解析。
- BGE-M3 embedding 服务调用。
- Claude API 调用。
- RAG 检索与上下文组装。
- PPT 文件生成。
- Agent / Workflow 编排。
- Docker Compose。

## 5. 当前完成度评估

### 5.1 文档完成度：较高

文档已经覆盖需求、架构、模块、API、数据库、开发计划和冻结决策，方向比较清晰。

尤其 `mvp_decision.md` 已经把一期边界固化下来，对避免过度设计有帮助。

需要注意：部分设计文档仍存在历史表述，与当前代码态或最新决策不完全一致。后续工程初始化前，应以 `mvp_decision.md` 为准，并逐步清理冲突描述。

### 5.2 前端原型完成度：中等

前端已覆盖主要界面：

- 登录页。
- 聊天主界面。
- 会话列表。
- 消息渲染。
- 文件中心。
- 文件上传模拟。
- 文件问答入口。
- PPT 任务入口。
- PPT 进度模拟。

这已经足够用于演示信息架构和交互方向。

但它仍是 Mock 原型，缺少：

- 真实 API client。
- 登录 token 管理。
- 错误处理策略。
- 文件上传前端真实限制校验。
- 服务端状态轮询。
- 空状态、失败态、权限失败态的真实联调。

### 5.3 后端完成度：未开始

当前没有 `backend/` 目录，因此真实业务能力尚未开始。

企业 AI 助手 MVP 的核心链路依赖后端落地。没有后端前，当前项目不能完成：

- 用户登录。
- 真实聊天。
- 文件上传。
- 文档解析。
- RAG 知识库问答。
- PPT 生成。
- Agent 工作流。

### 5.4 整体完成度判断

当前整体完成度建议判断为：

- 产品与架构设计：约 70%。
- 前端演示原型：约 45%。
- 后端工程实现：0%。
- MVP 可验收业务闭环：0%。

因此当前阶段不是“可联调 MVP”，而是“文档较完整 + 前端 Mock 原型可演示”。

## 6. 当前架构问题

### 6.1 文档状态与代码状态不一致

部分文档仍写着当前阶段“不创建 frontend”或“下一步创建 frontend”，但实际仓库中已经存在 `frontend/`，并且已经包含完整 Vite 工程。

建议：

- 后续更新 `status.md` 和 `development_plan.md`，把当前状态修正为“已创建前端 Mock 原型，后端未创建”。
- 继续保留 `mvp_decision.md` 作为最高优先级决策文档。

### 6.2 前端缺少真实 API 边界

当前 store 直接读取 `mock.ts`，没有独立 API client 层。

风险：

- 后续联调时 store 会同时承担状态、请求、DTO 转换、错误处理，容易膨胀。
- 组件可能被迫适配后端字段变化。

建议：

- 新增 `frontend/src/api/client.ts` 封装请求、JWT 注入和统一响应处理。
- 新增按领域拆分的 API 文件，如 `authApi.ts`、`filesApi.ts`、`chatApi.ts`、`pptApi.ts`。
- 保留 Mock 作为开发模式后备，但不要让业务 store 直接绑定 Mock 数据结构。

### 6.3 认证只有模拟登录

当前 `authStore` 只保存内存态用户，没有：

- 钉钉 auth code 获取。
- 后端登录 API。
- access token。
- refresh token。
- token 过期处理。
- `/api/v1/auth/me` 恢复登录态。
- 401 后退出或刷新策略。

建议：

- 按 `api_design.md` 实现 `POST /api/v1/auth/dingtalk/login`。
- 前端保存 access token，并在启动时调用 `/api/v1/auth/me` 恢复用户状态。
- refresh token 是否前端持久化，需要结合安全策略再实现，但接口语义应与 `mvp_decision.md` 保持一致。

### 6.4 文件上传仍是浏览器内模拟

当前 `fileStore.uploadFile()` 只在本地创建一条 `FileItem`，然后用 `setTimeout` 模拟解析完成。

缺少：

- 真实 multipart 上传。
- 20 MB 文件大小限制校验。
- TXT/PDF/DOCX 格式校验闭环。
- 后端 `files.status` 状态轮询。
- 解析失败原因展示。
- 删除文件时同步清理 chunk 和 PPT 产物。

建议：

- 后端先实现 `POST /api/v1/files`、`GET /api/v1/files`、`GET /api/v1/files/{file_id}`、`DELETE /api/v1/files/{file_id}`。
- 前端 FileCenter 改为以后端文件状态为准，而不是本地计时器。

### 6.5 PPT 任务只是本地进度模拟

当前 `pptStore.createJob()` 只在浏览器内模拟进度，没有真实任务。

缺少：

- `POST /api/v1/ppt/jobs`。
- `GET /api/v1/ppt/jobs/{job_id}`。
- `GET /api/v1/ppt/jobs/{job_id}/download`。
- 数据库持久化任务状态。
- 失败原因。
- 最多重试 1 次。
- 文件状态必须为 `ready` 的后端约束。

建议：

- 后端先实现 `ppt_jobs` 表和任务 API。
- 前端以轮询为准展示进度。
- 下载按钮必须指向真实下载接口，不再使用 message 模拟。

### 6.6 后端核心边界尚未落地

未来接 LLM、RAG、Agent 的复杂度不在前端，而在后端。

如果后端一开始没有明确边界，容易出现：

- API 层直接调用 LLM。
- Service 层直接写复杂 SQL。
- 文件路径散落在业务逻辑里。
- Parser、Embedding、LLM 强耦合。
- PPT 任务状态只保存在内存中。

建议严格按文档中的单体分层落地，不提前拆微服务，但要保留接口边界。

### 6.7 embedding 维度历史表述需统一

`mvp_decision.md` 已明确 embedding 使用 BGE-M3，向量维度为 1024。

`database_design.md` 中历史内容曾出现与其他 embedding 方案相关的表述。后续实现数据库 migration 时必须以 `mvp_decision.md` 为准：

- 模型：BGE-M3。
- 维度：1024。
- pgvector 字段：`VECTOR(1024)`。
- 检索范围：必须按 `file_id` 过滤。

### 6.8 当前前端存在可维护性隐患

当前前端大量使用行内样式，适合快速原型，但随着页面增多会带来维护成本。

建议 MVP 阶段不急于重构设计系统，但在接真实 API 前至少收敛：

- API 与 store 边界。
- 后端 DTO 与前端 view model 映射。
- 通用错误提示。
- loading / empty / failed 状态。
- 日期、文件大小、状态标签等格式化工具。

## 7. LLM / RAG / Agent 扩展建议

### 7.1 LLM 扩展

一期只实现 Claude Provider，不做多 Provider UI。

建议后端结构：

```text
backend/app/llm/
  base.py
  claude.py
```

设计原则：

- `ChatService` 依赖 LLM Provider 接口，而不是直接依赖具体 SDK。
- 模型名、超时、Base URL、API Key 通过环境变量配置。
- 一期只实现基础超时和失败重试 1 次。
- LLM 调用结果应记录 token 用量、错误信息和必要 metadata，便于排查。

### 7.2 RAG 扩展

一期 RAG 只做单文件问答，不做企业知识库。

推荐流程：

```text
文件上传
  -> 本地存储
  -> Parser 解析文本
  -> Chunker 切分
  -> EmbeddingClient 调用 BGE-M3
  -> FileChunkRepository 写入 pgvector
  -> ChatService 按 file_id 检索
  -> 组装上下文
  -> Claude Provider 生成回答
```

关键约束：

- 每次文件问答必须绑定 `file_id`。
- 检索 SQL 必须同时过滤 `user_id` 和 `file_id`。
- 不暴露全局知识库入口。
- 不允许用户访问其他用户上传文件的 chunk。
- Parser、Chunker、EmbeddingClient、FileChunkRepository 要保持边界清晰。

这样未来扩展多文件问答或企业知识库时，可以新增 `knowledge_base_id` 或多文件检索策略，而不破坏一期单文件问答。

### 7.3 Agent 扩展

当前阶段不建议直接引入复杂 Agent 框架。

更适合 MVP 的做法是先实现确定性 `WorkflowService`：

```text
WorkflowService
  -> 解析文件
  -> 生成摘要
  -> 生成 PPT 大纲
  -> 生成 PPT 内容 JSON
  -> 调用 PPTGenerator
  -> 更新 PptJob 状态
```

一期 Agent 能力应表现为“系统能自动完成一组固定步骤”，而不是开放式自主规划。

后续如果要扩展 Agent，再逐步引入：

- tool registry。
- step state。
- step logs。
- job event。
- 人工确认节点。
- 可恢复任务。
- 更强的权限边界。

### 7.4 PPT 生成扩展

PPT 生成建议先走固定模板和结构化 JSON。

后端流程：

```text
PptService.create_job()
  -> 创建 ppt_jobs 记录
  -> BackgroundTasks 执行
  -> LLM 生成结构化大纲和页面内容
  -> 校验 JSON schema
  -> python-pptx 生成文件
  -> FileService 保存输出
  -> 更新任务状态
```

不要让 LLM 直接决定文件路径、模板路径或任意执行逻辑。

### 7.5 后续可扩展但一期不实现

以下扩展方向可以保留边界，但不应在 MVP 一期实现：

- Celery 替代 BackgroundTasks。
- MinIO / OSS 替代本地文件系统。
- 多文件联合问答。
- 企业全局知识库。
- 多 PPT 模板。
- 大纲审批。
- SSE / WebSocket 流式输出。
- 多 LLM Provider 切换。
- 部门级权限。
- 审计日志。

## 8. MVP 下一步优先级

### 8.1 第一优先级：创建后端最小骨架

建议先创建：

```text
backend/
  app/
    api/v1/
    core/
    models/
    schemas/
    repositories/
    services/
    llm/
    embedding/
    parsers/
  tests/
  alembic/
```

并完成：

- FastAPI 应用启动。
- `GET /health`。
- 配置加载。
- 数据库连接。
- Alembic 初始化。
- Docker Compose 中的 `db`、`app`、`embedding`。

### 8.2 第二优先级：打通认证和前端 API client

建议实现：

- `POST /api/v1/auth/dingtalk/login`。
- `GET /api/v1/auth/me`。
- JWT access token。
- refresh token 基础接口。
- 前端 API client。
- 前端登录态恢复。

如果钉钉联调暂时受阻，可以先做后端 dev mock 登录，但接口形状必须和正式钉钉登录保持一致。

### 8.3 第三优先级：单文件上传与解析

建议实现：

- 文件上传接口。
- 本地文件存储。
- 文件元数据入库。
- TXT/PDF/DOCX parser。
- 文件状态：uploaded -> processing -> ready / failed。
- 前端文件列表从后端读取。

### 8.4 第四优先级：单文件 RAG 问答

建议实现：

- chunk 切分。
- BGE-M3 embedding 服务调用。
- `file_chunks` 写入。
- pgvector 按 `file_id` 检索。
- Claude API 回答生成。
- 聊天记录入库。
- 前端发送消息调用真实 API。

### 8.5 第五优先级：PPT 生成任务

建议实现：

- `ppt_jobs` 表。
- 创建 PPT 任务。
- BackgroundTasks 执行。
- python-pptx 固定模板生成。
- 任务状态查询。
- 下载接口。
- 前端轮询。

## 9. 代码审查结论

当前代码层面的主要结论：

- 前端 TypeScript 类型检查通过。
- 前端组件拆分适合原型阶段。
- Zustand store 清晰但与 Mock 数据耦合较重。
- 目前没有真实 API、后端、数据库、RAG、LLM、PPT 或 Agent 实现。
- 当前仓库与文档存在状态不一致，应在后续开发前修正文档状态。
- 后续实现应优先保持 MVP 简单，不引入 Celery、MinIO、多 Provider、微服务或复杂 Agent 框架。

建议下一步不要继续增强 Mock 原型，而是进入后端最小工程初始化，并让前端逐步从 Mock store 切换到真实 API。
