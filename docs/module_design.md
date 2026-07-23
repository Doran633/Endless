# 模块设计

> 本文档按当前代码状态整理模块。
> 状态分为 `Implemented`、`Planned`、`Future`。
> 当前项目目标是独立网页版 AI 助手 MVP，不引入企业系统和复杂微服务。

## 1. 设计原则

- 保持单体应用。
- 后端遵循 `api -> service -> repository` 的演进方向。
- API 层只处理 HTTP、参数校验和响应。
- Service 层负责编排业务流程。
- Repository 层负责数据访问，当前尚未实现。
- LLM、Parser、Embedding、Vector Store 保留接口边界。
- 只实现 v1.0 必需能力，不提前实现复杂企业功能。

## 2. 状态说明

| 状态 | 含义 |
| --- | --- |
| `Implemented` | 当前代码中已经存在，并承担实际职责 |
| `Planned` | 当前 v1.0 主链路需要实现，或已确认的规划能力边界 |
| `Future` | 后续扩展能力，当前 v1.0 暂不实现 |

## 3. Implemented

### 3.1 Backend App

路径：

- `backend/app/main.py`

职责：

- 创建 FastAPI 应用。
- 注册健康检查路由。
- 注册聊天路由。
- 暴露当前后端 API 入口。

当前限制：

- 同时注册了 `/chat` 和 `/api/v1/chat`。
- `/chat` 应视为临时兼容路径，正式业务路径优先使用 `/api/v1/chat`。

### 3.2 Backend Chat API

路径：

- `backend/app/api/v1/chat.py`

职责：

- 定义聊天 HTTP 接口。
- 接收 `ChatRequest`。
- 调用 `ChatService`。
- 返回统一响应结构。

当前限制：

- API 层当前直接实例化 `ChatService`。
- 后续应通过依赖注入集中管理 Service。
- 当前只支持普通聊天，不支持 `file_id` 和 RAG 上下文。

### 3.3 Backend Health API

路径：

- `backend/app/api/v1/health.py`

职责：

- 提供后端健康检查接口。
- 用于确认 FastAPI 服务是否可用。

当前限制：

- 只检查应用进程可用性。
- 尚未检查数据库、LLM Provider、文件存储等依赖。

### 3.4 Backend Core

路径：

- `backend/app/core/config.py`
- `backend/app/core/responses.py`

职责：

- `config.py`：读取 LLM Provider、模型、API Key、Base URL 等配置。
- `responses.py`：封装统一成功响应结构。

当前限制：

- 尚未实现统一异常类型。
- 尚未实现全局异常处理。
- 尚未实现请求日志和 request id。

### 3.5 Backend Chat Schema

路径：

- `backend/app/schemas/chat.py`

职责：

- 定义聊天请求和响应数据结构。
- 为 API 层提供参数校验。

当前限制：

- 当前请求主要包含普通聊天消息。
- 后续 RAG 需要扩展 `file_id`、`session_id`、`mode`、`citations` 等字段。

### 3.6 Backend Chat Service

路径：

- `backend/app/services/chat_service.py`

职责：

- 编排普通聊天流程。
- 构造基础 system prompt。
- 调用 `LLMService`。
- 返回聊天回答。

当前限制：

- 当前同时承担 prompt 组装和结果拼装。
- 尚未接入会话历史。
- 尚未接入 RAG 上下文。
- 后续 Agent Workflow 不应直接塞入该服务。

### 3.7 Backend LLM Service

路径：

- `backend/app/services/llm_service.py`

职责：

- 根据配置选择 LLM Provider。
- 向 `ChatService` 提供统一的聊天生成入口。

当前限制：

- Provider 选择逻辑仍较简单。
- 未知 Provider 当前缺少严格配置错误处理。
- 尚未统一 timeout、重试、日志和调用 metadata。

### 3.8 Backend LLM Providers

路径：

- `backend/app/llm/base.py`
- `backend/app/llm/mock_provider.py`
- `backend/app/llm/openai_provider.py`

职责：

- `base.py`：定义 `LLMProvider` 抽象。
- `mock_provider.py`：提供本地开发和无 API Key 演示能力。
- `openai_provider.py`：提供 OpenAI-compatible LLM 调用能力。

当前限制：

- Provider 抽象只覆盖基础聊天。
- 尚未包含 temperature、max_tokens、request_id、metadata 等参数。
- OpenAI-compatible Provider 的错误处理还需要统一到应用错误响应。

### 3.9 Frontend App

路径：

- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/index.css`

职责：

- 启动 React 应用。
- 组织当前页面入口。
- 加载全局样式。

当前限制：

- 前端仍以 Mock 原型为主。
- 尚未接入后端真实聊天接口。

### 3.10 Frontend Components

路径：

- `frontend/src/components/LoginPage.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/ChatLayout.tsx`
- `frontend/src/components/ChatArea.tsx`
- `frontend/src/components/ChatInput.tsx`
- `frontend/src/components/MessageBubble.tsx`
- `frontend/src/components/FileCenter.tsx`
- `frontend/src/components/PptTaskCenter.tsx`
- `frontend/src/components/WelcomePage.tsx`

职责：

- 负责当前 Web 原型的页面和 UI 组件。
- 展示登录、聊天、文件中心、欢迎页等界面。

当前限制：

- 登录是 Mock。
- 文件中心是 Mock。
- `PptTaskCenter` 属于历史原型组件，不属于当前 v1.0 必做能力。

### 3.11 Frontend Stores

路径：

- `frontend/src/stores/authStore.ts`
- `frontend/src/stores/chatStore.ts`
- `frontend/src/stores/fileStore.ts`
- `frontend/src/stores/pptStore.ts`

职责：

- 使用 Zustand 管理前端本地状态。
- 管理登录状态、聊天状态、文件状态和历史 PPT Mock 状态。

当前限制：

- `chatStore` 仍直接依赖 Mock 回复。
- `fileStore` 仍模拟文件上传和解析状态。
- `pptStore` 属于历史原型状态，不属于当前 v1.0 必做能力。

### 3.12 Frontend Mock API

路径：

- `frontend/src/api/mock.ts`

职责：

- 提供本地 Mock 用户、消息、文件和任务数据。
- 支撑前端原型演示。

当前限制：

- 当前不是正式业务 API client。
- 后续应新增真实 API client，并将 Mock 限定为开发 fallback。

## 4. Planned

### 4.1 Frontend Chat API Client

计划路径：

- `frontend/src/api/chatApi.ts`

职责：

- 封装后端 `/api/v1/chat` 调用。
- 统一处理聊天响应和错误。
- 让 `chatStore` 不再直接绑定 Mock 回复。

v1.0 价值：

- 跑通真实 Web 聊天链路。
- 为后续 RAG 问答复用 API 调用边界。

### 4.2 Backend Dependency Layer

计划路径：

- `backend/app/api/deps.py`

职责：

- 集中创建和注入 Service。
- 后续统一注入数据库 session、当前请求上下文、RAG Service。

v1.0 价值：

- 降低 API 层和 Service 实现的耦合。
- 方便测试替换依赖。

### 4.3 Backend Error Handling

计划路径：

- `backend/app/core/errors.py`
- `backend/app/core/exception_handlers.py`

职责：

- 定义应用异常类型。
- 统一转换 LLM、文件、RAG 等错误。
- 保持 API 响应结构稳定。

v1.0 价值：

- 避免外部依赖失败直接暴露为未处理 500。
- 提升前端错误展示稳定性。

### 4.4 File API

计划路径：

- `backend/app/api/v1/files.py`
- `frontend/src/api/fileApi.ts`

职责：

- 提供文件上传接口。
- 提供文件列表或文件状态接口。
- 支撑前端文件中心接入真实后端。

v1.0 价值：

- 建立 RAG 的入口数据来源。

### 4.5 File Service

计划路径：

- `backend/app/services/file_service.py`

职责：

- 校验文件类型和大小。
- 保存原始文件。
- 管理文件状态。
- 屏蔽本地存储细节。

v1.0 价值：

- 让业务代码不直接操作文件路径。
- 后续可替换对象存储而不影响 API 层。

### 4.6 Parser Service

计划路径：

- `backend/app/services/parser_service.py`
- `backend/app/parsers/`

职责：

- 根据文件类型选择 Parser。
- 将文档解析为纯文本。
- 返回解析状态和错误原因。

v1.0 价值：

- 为 chunk、embedding、RAG 提供文本输入。

### 4.7 Embedding Module

计划路径：

- `backend/app/embedding/`

职责：

- 定义 Embedding Provider 抽象。
- 将文本转换为向量。
- 为文档 chunks 和用户问题提供统一向量化入口。

v1.0 价值：

- 支撑后续 Vector Store 检索。
- 保留替换 embedding 模型的边界。

### 4.8 Vector Store Module

计划路径：

- `backend/app/vector_store/`

职责：

- 保存 chunk 向量。
- 按 `file_id` 检索相关 chunks。
- 屏蔽具体向量存储实现。

v1.0 价值：

- 支撑单文件 RAG 问答。
- 避免业务层绑定具体数据库或向量库。

### 4.9 RAG Service

计划路径：

- `backend/app/services/rag_service.py`

职责：

- 接收问题和 `file_id`。
- 检索相关 chunks。
- 组装 RAG 上下文。
- 调用 LLM Service 生成回答。

v1.0 价值：

- 将普通聊天和文档问答的复杂度分离。
- 避免 `ChatService` 过早膨胀。

### 4.10 Repository Layer

计划路径：

- `backend/app/repositories/`

职责：

- 管理文件元数据。
- 管理文档 chunks。
- 管理聊天会话和消息。
- 屏蔽数据库或本地存储细节。

v1.0 价值：

- 为文件、RAG 和会话持久化提供统一数据访问边界。

### 4.11 Minimal Tests

计划路径：

- `backend/tests/`
- 可选：`frontend` 现有类型检查继续保持。

职责：

- 覆盖健康检查。
- 覆盖基础聊天接口。
- 覆盖 Mock Provider。
- 后续覆盖文件上传和 RAG 基础路径。

v1.0 价值：

- 降低后续接入 RAG 时的回归风险。

### 4.12 Data Analysis Service

计划路径：

- `backend/app/services/data_analysis_service.py`
- `backend/app/data_analysis/`
- `frontend/src/components/DataAnalysisPanel.tsx`

规划职责：

- 支持上传结构化数据。
- 识别字段、行列和数据类型。
- 执行基础统计、筛选、聚合和趋势分析。
- 生成图表数据。
- 调用 LLM Service 输出自然语言解释。

当前状态：

- 当前暂不实现。
- 当前只作为规划能力保留边界。
- 后续仍在单体后端内实现，不拆为微服务。

设计原则：

- 数据结论来自程序计算。
- LLM 只负责解释、总结和生成表达。
- 不让 LLM 凭空生成关键数值。

## 5. Future

### 5.1 Agent Workflow

未来路径：

- `backend/app/services/workflow_service.py`
- `backend/app/agent/`

规划职责：

- 编排多步骤 AI 工作流。
- 管理工具调用。
- 管理 step logs。
- 支持人工确认节点。

当前状态：

- 当前暂不实现。
- 不放入当前 `ChatService`。

设计原则：

- 先用确定性 Service 编排。
- 等 RAG 和文件主链路稳定后，再抽象 Agent Workflow。

### 5.2 Additional LLM Providers

未来路径：

- `backend/app/llm/claude_provider.py`
- `backend/app/llm/deepseek_provider.py`
- `backend/app/llm/qwen_provider.py`

规划职责：

- 支持更多 LLM Provider。
- 通过 Provider registry 管理模型实现。

当前状态：

- 当前已有 Mock 和 OpenAI-compatible Provider。
- v1.0 不做复杂多模型管理 UI。

### 5.3 Enterprise Features

规划能力：

- 钉钉。
- 企业登录。
- 企业权限。
- 多租户。
- 企业知识库。
- PPT 生成。

当前状态：

- 当前暂不实现。
- 不属于独立网页版 AI 助手 v1.0 范围。

## 6. 核心模块交互

### 6.1 普通聊天

```text
Frontend Chat UI
  -> Chat API
  -> ChatService
  -> LLMService
  -> LLMProvider
```

当前状态：

- 后端链路已实现基础版本。
- 前端尚未接入真实 API。

### 6.2 文件上传和解析

```text
Frontend File UI
  -> File API
  -> FileService
  -> ParserService
  -> Parser
  -> Repository
```

当前状态：

- 计划实现。

### 6.3 RAG 问答

```text
Frontend Chat UI
  -> Chat/RAG API
  -> ChatService
  -> RAGService
  -> EmbeddingProvider
  -> VectorStore
  -> LLMService
  -> LLMProvider
```

当前状态：

- 计划实现。

## 7. 不允许的模块扩张

当前 v1.0 不新增：

- 企业登录模块。
- 企业权限模块。
- 多租户模块。
- PPT 生成模块。
- Celery worker。
- 微服务网关。
- 微前端。
- 复杂多模型管理后台。

## 8. 当前结论

当前模块状态可以概括为：

- `Implemented`：前端 Mock 原型、后端基础聊天、LLM Provider 基础抽象。
- `Planned`：前端真实聊天接入、文件上传、解析、Embedding、Vector Store、RAG、Repository、测试、AI 数据分析规划边界。
- `Future`：Agent Workflow、更多 LLM Provider、企业能力、PPT 生成。

下一阶段应优先完成前端接入后端聊天接口，再进入文件上传、文档解析和单文件 RAG；AI 数据分析先保留模块边界，不进入当前代码开发。
