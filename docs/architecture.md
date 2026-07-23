# 独立网页版 AI 助手 MVP 架构设计

> 本文档描述当前 v1.0 架构范围。
> 本次更新不重新设计系统，只将既有工程思想同步到当前 v1.0 目标。
> 当前保持单体架构，不引入复杂微服务。

## 1. 架构目标

本架构服务于独立网页版 AI 助手 v1.0，优先保证核心链路可落地、可演示、可迭代。

当前 v1.0 核心目标：

- 支持 Web AI 聊天。
- 支持 LLM API 调用。
- 支持文件上传。
- 支持基于文档的 RAG 知识问答。
- 为 AI 数据分析保留规划边界。
- 保持单体后端架构，降低早期复杂度。
- 为后续 Embedding、Vector Database、Agent Workflow 和 AI 数据分析保留清晰边界。

其中，文档解析、Embedding 和向量检索是 RAG 知识问答的支撑链路，不单独扩展为企业知识库平台。

当前 v1.0 不包含：

- 钉钉。
- 企业登录。
- 企业权限。
- 多租户。
- 微服务拆分。
- 复杂任务队列。
- PPT 生成。

## 2. 当前架构范围

当前项目由三部分组成：

```text
frontend
  -> backend
    -> LLM Provider
    -> File Storage
    -> Parser
    -> Embedding Provider
    -> Vector Store
    -> Data Analysis Service (planned only)
```

当前已落地：

- `frontend/`：React + Vite 前端 Mock 原型。
- `backend/`：FastAPI 后端基础聊天模块。
- `LLMProvider` 抽象。
- `MockLLMProvider`。
- `OpenAIProvider`。
- `GET /health`。
- `POST /chat`。
- `POST /api/v1/chat`。

当前尚未落地：

- 前端真实调用后端聊天接口。
- 文件上传 API。
- 文档解析。
- Embedding。
- Vector Store。
- RAGService。
- 数据库和持久化。
- Data Analysis Service。当前只规划，不实现。

## 3. 技术栈

### 3.1 已落地技术栈

前端：

- React 18。
- TypeScript。
- Vite。
- Ant Design 5。
- Zustand。
- dayjs。

后端：

- Python。
- FastAPI。
- Pydantic。
- OpenAI-compatible HTTP 调用。
- 本地 Mock LLM Provider。

### 3.2 计划接入技术

以下技术用于支撑 v1.0 后续模块，但当前代码尚未完整实现：

- 数据库。
- ORM。
- 数据库迁移。
- 文件解析库。
- Embedding 模型。
- 向量数据库或本地向量存储。
- 后端自动化测试。

选型原则：

- v1.0 优先选择简单、可运行、可替换的实现。
- 不为了未来扩展提前引入微服务。
- 对 LLM、Parser、Embedding、Vector Store 保留接口边界。

## 4. 系统组件

### 4.1 Web Frontend

职责：

- 提供聊天界面。
- 提供文件上传入口。
- 展示文件状态。
- 展示普通聊天回答。
- 展示 RAG 问答回答。

当前状态：

- 已完成 Mock 原型。
- 聊天、文件状态仍主要依赖本地 Mock。
- 下一步应接入后端 `/api/v1/chat`。

不做：

- 直接调用 LLM API。
- 直接处理文档解析。
- 直接执行向量检索。

### 4.2 API Service

职责：

- 定义 HTTP API。
- 校验请求参数。
- 调用 Service 层。
- 返回统一响应结构。

当前状态：

- 已实现健康检查接口。
- 已实现基础聊天接口。

后续 v1.0 需要新增：

- 文件上传 API。
- 文件状态 API。
- RAG 问答 API。

### 4.3 Chat Service

职责：

- 编排普通聊天流程。
- 组织基础 prompt。
- 调用 LLM Service。
- 返回聊天结果。

当前状态：

- 已实现基础聊天编排。
- 尚未接入会话持久化。
- 尚未接入 RAG 上下文。

后续扩展：

- 普通聊天继续走 LLM Service。
- 文档问答时调用 RAG Service 获取上下文。
- Agent Workflow 不应直接塞入 Chat Service，应由独立 Workflow/Agent 边界承接。

### 4.4 LLM Service

职责：

- 屏蔽具体 LLM Provider。
- 根据配置选择模型调用方式。
- 统一向业务层提供聊天生成能力。

当前状态：

- 已有 `LLMProvider` 抽象。
- 已有 Mock Provider。
- 已有 OpenAI-compatible Provider。

后续扩展：

- 可新增更多 Provider。
- 可增加 timeout、错误处理、调用日志。
- 可为 RAG 和 Agent 调用增加 metadata。

### 4.5 File Service

职责：

- 接收上传文件。
- 校验文件大小和类型。
- 保存原始文件。
- 管理文件元数据和文件状态。

当前状态：

- 尚未实现。

设计原则：

- 业务代码不直接散落文件路径。
- 本地文件系统作为 v1.0 简单实现。
- 后续如需替换对象存储，只替换 File Service 的存储实现。

### 4.6 Parser Service

职责：

- 根据文件类型选择 Parser。
- 将文件解析为纯文本。
- 返回解析结果和解析状态。

当前状态：

- 尚未实现。

v1.0 建议：

- TXT 必须支持。
- PDF 建议支持。
- DOCX 根据进度实现。
- OCR 不进入当前 v1.0。

扩展边界：

- 使用 Parser 接口或注册表管理不同文件类型。
- 后续新增 CSV、Excel、JSON 解析时，不影响普通文档 Parser 主流程。

### 4.7 RAG Service

职责：

- 接收用户问题和 `file_id`。
- 调用 Embedding Provider 生成查询向量。
- 调用 Vector Store 检索相关 chunks。
- 组装上下文。
- 调用 LLM Service 生成基于文档的回答。

当前状态：

- 尚未实现。

v1.0 边界：

- 优先支持单文件问答。
- 检索范围限定在当前文件。
- 不做全局知识库。
- 不做多文件联合问答。

### 4.8 Embedding Provider

职责：

- 将文本转换为向量。
- 为文档 chunks 和用户问题提供统一 embedding 能力。

当前状态：

- 尚未实现。

设计原则：

- 先实现一个可用 Provider。
- 不在 v1.0 实现多 Provider UI。
- 通过接口保留后续替换模型的能力。

### 4.9 Vector Store

职责：

- 保存 chunk 向量。
- 按文件范围检索相关 chunks。
- 屏蔽具体向量库实现。

当前状态：

- 尚未实现。

设计原则：

- v1.0 可选择本地轻量向量存储或 PostgreSQL + pgvector。
- 无论使用哪种实现，Service 层只依赖 Vector Store 抽象。

### 4.10 Data Analysis Service

Data Analysis Service 是规划能力，当前暂不实现。

规划职责：

- 接收结构化数据文件。
- 识别字段和数据类型。
- 执行基础统计和聚合分析。
- 生成图表数据。
- 调用 LLM Service 生成自然语言解释。

设计边界：

- 不作为当前核心 MVP 闭环的必做功能。
- 不引入独立微服务。
- 后续仍放在单体后端的 Service 层中。
- 图表应基于程序计算结果生成，LLM 只负责解释和总结。

## 5. 后端分层

后端采用单体分层架构：

```text
api/v1
  -> services
  -> repositories
  -> database / storage / external providers
```

### 5.1 API 层

职责：

- 路由定义。
- 请求参数校验。
- 调用 Service。
- 返回统一响应。

不做：

- 业务逻辑。
- 直接访问数据库。
- 直接调用 LLM。
- 直接解析文件。

### 5.2 Service 层

职责：

- 编排业务流程。
- 调用 Repository。
- 调用 LLM Provider。
- 调用 Parser。
- 调用 File Service。
- 调用 Vector Store。

不做：

- 直接处理 HTTP Request / Response。
- 编写复杂 SQL。
- 保存前端 UI 状态。

### 5.3 Repository 层

职责：

- 数据访问。
- CRUD。
- 查询封装。
- 隐藏数据库细节。

不做：

- 业务判断。
- LLM 调用。
- 文件解析。
- prompt 组装。

## 6. 建议目录结构

当前项目结构已经包含 `frontend/` 和 `backend/`。

建议后续在现有结构上演进：

```text
project/
  docs/
  backend/
    app/
      api/v1/
        chat.py
        health.py
        files.py
      core/
      schemas/
      services/
        chat_service.py
        llm_service.py
        file_service.py
        parser_service.py
        rag_service.py
        data_analysis_service.py  # 未来扩展，当前暂不实现
      repositories/
      llm/
      parsers/
      embedding/
      vector_store/
    tests/
    uploads/
  frontend/
    src/
      api/
      components/
      stores/
      types/
```

说明：

- `data_analysis_service.py` 只是未来扩展位置说明，当前不创建实现。
- 当前不增加独立服务目录或微服务工程。
- 先在单体后端内保持清晰模块边界。

## 7. 数据流

### 7.1 普通聊天数据流

```text
用户输入
  -> Web Frontend
  -> POST /api/v1/chat
  -> Chat API
  -> Chat Service
  -> LLM Service
  -> LLM Provider
  -> LLM Service
  -> Chat Service
  -> API Response
  -> Web Frontend 展示回答
```

当前状态：

- 后端链路已基本存在。
- 前端尚未接入后端聊天接口。

### 7.2 文件上传与解析数据流

```text
用户选择文件
  -> Web Frontend
  -> File API
  -> File Service
  -> 本地文件存储
  -> Parser Service
  -> Parser
  -> 解析文本
  -> 文件状态更新
```

当前状态：

- 尚未实现。

v1.0 原则：

- 先保证文件可上传、可解析、状态可见。
- 不引入复杂任务队列。
- 如解析耗时较短，可先同步或简单后台处理。

### 7.3 RAG 问答数据流

```text
用户选择已解析文件并提问
  -> Web Frontend
  -> Chat/RAG API
  -> Chat Service
  -> RAG Service
  -> Embedding Provider 生成查询向量
  -> Vector Store 按 file_id 检索 chunks
  -> RAG Service 组装上下文
  -> LLM Service
  -> LLM Provider
  -> 返回基于文档的回答
  -> Web Frontend 展示回答和来源
```

当前状态：

- 尚未实现。

v1.0 原则：

- 单文件 RAG 优先。
- 检索必须限定在当前文件。
- 回答应保留可追溯来源信息。

### 7.4 AI 数据分析数据流

AI 数据分析是规划能力，当前暂不实现。

规划数据流：

```text
用户上传结构化数据
  -> Data File API
  -> File Service
  -> Data Analysis Service
  -> 结构化数据解析
  -> 程序计算统计结果
  -> 图表数据生成
  -> LLM Service 生成自然语言解释
  -> Web Frontend 展示表格、图表和解释
```

设计原则：

- 分析结果由程序计算产生。
- LLM 负责解释，不负责凭空生成数值。
- 继续使用单体后端内的 Service 模块，不拆微服务。

## 8. 存储架构

v1.0 优先使用简单本地存储。

职责边界：

- File Service 负责文件保存和读取。
- Repository 负责文件元数据、chunk、消息等数据访问。
- Vector Store 负责向量写入和检索。

当前状态：

- 尚未建立数据库。
- 尚未实现真实文件存储链路。

后续选择：

- 若优先快速演示，可使用轻量本地存储。
- 若优先贴近生产，可使用 PostgreSQL + pgvector。

无论选择哪种方式，业务层都不应直接绑定具体存储实现。

## 9. 异步任务策略

v1.0 不引入复杂任务队列。

建议策略：

- 文件解析优先保持简单。
- 短任务可同步执行。
- 稍长任务可使用 FastAPI BackgroundTasks。
- 状态需要可查询，不能只存在内存里。

需要避免：

- 为 MVP 提前引入 Celery、Kafka、RabbitMQ。
- API 与具体任务执行器强绑定。
- 使用内存保存关键业务状态。

## 10. API 响应规范

统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

当前已实现的聊天接口应继续保持该响应风格。

后续建议：

- 普通聊天错误归入聊天模块错误。
- 文件上传和解析错误归入文件模块错误。
- RAG 检索失败应返回可理解的业务错误。
- 前端不应依赖后端未处理异常文本。

## 11. 当前阶段说明

当前项目处于：

**前端 Mock 原型 + 后端基础聊天模块 + v1.0 文档同步阶段。**

下一阶段最重要的工程目标：

1. 前端接入后端 `/api/v1/chat`。
2. 稳定 LLM Provider 和错误边界。
3. 实现文件上传。
4. 实现文档解析。
5. 实现单文件 RAG 问答。

架构原则保持不变：

- 单体优先。
- 模块边界清晰。
- MVP 范围收敛。
- 规划能力只保留扩展位置，不提前实现复杂系统。
