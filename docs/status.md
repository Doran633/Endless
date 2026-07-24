# 项目状态

> 本文档记录当前代码真实状态，不记录历史计划，不包含未来企业功能范围。

## 1. 当前版本

当前版本：`v0.6.1`

当前阶段：聊天侧文件接入体验优化阶段。

当前状态判断：

- 已完成前端 Mock 原型。
- 已完成后端基础聊天模块。
- 已完成前后端真实聊天联调。
- 已完成 Mock Provider 和 OpenAI-compatible Provider 的基础配置与错误处理。
- 已完成 `backend/.env` 安全配置读取。
- 已完成 `backend/.env.example` 示例配置。
- 已通过 DeepSeek OpenAI-compatible API 联调 `deepseek-v4-flash`。
- 已完成最小文件上传闭环：前端选择文件、后端保存到 `backend/uploads/`、前端展示真实上传结果。
- 已完成最小文档解析闭环：后端读取 `backend/uploads/` 中的文件，解析 TXT / DOCX / 可复制文本型 PDF，前端展示解析状态和文本预览。
- 已增强 DOCX 表格解析：保留行列分隔，支持表格单元格中的段落和嵌套表格文本。
- 已完成文本切块闭环：后端将解析全文切成 chunks，前端展示 chunk 数量和预览。
- 已完成 mock embedding 向量化闭环：后端为 chunks 生成稳定 mock vectors，前端展示 embedding 数量、维度和向量预览。
- 已完成聊天侧文件接入体验优化：聊天输入区可以上传文件，并自动串联上传、解析、切块和 mock 向量化流程。
- 已完成北辰agent UI 简化优化：统一产品命名，聚焦“对话 + 文件中心”，隐藏当前暂不实现的 PPT 入口。
- 向量存储、RAG 问答、数据库持久化尚未开始实现。

## 2. 当前 v1.0 目标

v1.0 目标是构建一个独立网页版 AI 助手。

核心能力：

- AI 聊天。
- 文件上传。
- RAG 知识问答。
- AI 数据分析规划能力。

支撑能力：

- LLM API 调用。
- 文档解析。
- Embedding。
- 向量检索。

当前 v1.0 不包含：

- 钉钉。
- 企业登录。
- 企业权限。
- PPT 生成。
- 多租户。
- 微服务。
- 复杂任务队列。

## 3. 已完成模块

### 3.1 前端基础原型

目录：`frontend/`

已完成：

- React + Vite 前端工程。
- 基础页面布局。
- 登录页 Mock。
- 侧边栏。
- 聊天区。
- 消息输入框。
- 消息渲染组件。
- 文件中心 UI。
- 文件解析触发入口。
- 文件解析结果预览。
- 文件切块触发入口。
- chunk 数量和 chunk 预览展示。
- 文件向量化触发入口。
- embedding 数量、维度和向量预览展示。
- 聊天输入区文件上传入口。
- 聊天侧文件自动处理状态展示。
- 北辰agent 品牌界面。
- Zustand 状态管理。
- 本地 Mock API：`frontend/src/api/mock.ts`。
- 聊天 API Client：`frontend/src/api/chatApi.ts`。
- 文件上传 API Client：`frontend/src/api/fileApi.ts`。

当前限制：

- 前端聊天已经调用后端 `/api/v1/chat`。
- 前端文件上传已经调用后端 `/api/v1/files`。
- 前端文件解析已经调用后端 `/api/v1/files/{file_id}/parse`。
- 前端文件切块已经调用后端 `/api/v1/files/{file_id}/chunks`。
- 前端文件向量化已经调用后端 `/api/v1/files/{file_id}/embeddings`。
- 聊天侧文件上传会自动串联 `/api/v1/files`、`/api/v1/files/{file_id}/parse`、`/api/v1/files/{file_id}/chunks` 和 `/api/v1/files/{file_id}/embeddings`。
- 前端会话、历史消息和初始文件列表仍使用 Mock 数据。
- 文件列表刷新、文件删除和文件持久化列表接口尚未实现。
- 解析结果只保存在当前前端状态中，刷新页面后不会恢复。
- chunk 结果只保存在当前前端状态中，刷新页面后不会恢复。
- embedding 结果只保存在当前前端状态中，刷新页面后不会恢复。

### 3.2 后端基础聊天模块

目录：`backend/`

已完成：

- FastAPI 后端工程骨架。
- 健康检查接口：`GET /health`。
- 基础聊天接口：
  - `POST /chat`
  - `POST /api/v1/chat`
- 聊天请求和响应 Schema。
- `ChatService` 聊天业务编排。
- `LLMService` LLM Provider 选择。
- `LLMProvider` 抽象接口。
- `MockLLMProvider` 本地开发模型。
- `OpenAIProvider` OpenAI-compatible 调用实现。
- 统一成功响应工具。
- 应用级错误类型。
- LLM 配置错误和调用错误的统一 JSON 响应。
- `backend/.env` 本地敏感配置读取。
- `backend/.env.example` 示例配置。

当前限制：

- `/chat` 是临时兼容路径，正式业务路径应优先使用 `/api/v1/chat`。
- LLM 错误处理已覆盖 v0.2 的配置错误和 Provider 调用错误，但尚未覆盖全局未知异常。
- API 层当前直接实例化 Service，后续需要引入依赖注入。
- 目前以手动验证和类型检查为主，尚未建立自动化测试目录。

### 3.3 后端基础文件模块

目录：`backend/`

已完成：

- 文件上传接口：`POST /api/v1/files`。
- `UploadedFileResponse` 文件上传响应 Schema。
- `FileService` 文件上传业务边界。
- 上传文件扩展名校验。
- 上传文件大小限制。
- 上传文件保存到本地 `backend/uploads/`。
- 文件相关错误类型：
  - `FileValidationError`
  - `FileStorageError`
- 上传配置：
  - `UPLOAD_DIR`
  - `MAX_UPLOAD_SIZE_MB`
  - `ALLOWED_UPLOAD_EXTENSIONS`
- 文件上传依赖：`python-multipart`。
- 文件解析接口：`POST /api/v1/files/{file_id}/parse`。
- `DocumentParserService` 文档解析业务边界。
- TXT 文本解析。
- DOCX 段落和基础表格文本解析。
- DOCX 表格行列结构化文本输出。
- DOCX 嵌套表格文本解析。
- 可复制文本型 PDF 解析实现。
- 文件切块接口：`POST /api/v1/files/{file_id}/chunks`。
- `ChunkService` 文本切块业务边界。
- 字符数切块策略：`chunk_size=800`，`chunk_overlap=120`。
- chunk 预览响应字段：
  - `chunk_id`
  - `file_id`
  - `chunk_index`
  - `content`
  - `char_count`
- 文件向量化接口：`POST /api/v1/files/{file_id}/embeddings`。
- `EmbeddingService` embedding 业务边界。
- `EmbeddingProvider` 抽象接口。
- `MockEmbeddingProvider` 稳定 mock embedding 实现。
- mock embedding 默认维度：`16`。
- embedding 响应字段：
  - `embedding_count`
  - `embedding_dimension`
  - `embedding_preview`
- 文档解析响应字段：
  - `file_id`
  - `status`
  - `extension`
  - `text_preview`
  - `char_count`
- 文档解析相关错误类型：
  - `DocumentNotFoundError`
  - `DocumentParseError`
- 文档解析依赖：
  - `python-docx`
  - `pypdf`

当前限制：

- 文件元数据只在上传响应中返回，尚未写入数据库。
- 服务重启后，前端不能从后端恢复文件列表。
- 文档解析结果尚未写入数据库。
- 暂不支持文件下载、文件删除、文件列表查询。
- 暂不支持 OCR、病毒扫描、对象存储。
- PDF 解析仅支持可复制文本型 PDF，不支持扫描件 OCR。
- chunk 结果尚未写入数据库或向量存储。
- 当前切块策略是字符数切块，不是 tokenizer-aware 或 semantic chunk。
- embedding 结果尚未写入向量数据库。
- 当前 embedding 是 mock vector，不代表真实语义。

### 3.4 项目文档

目录：`docs/`

已完成：

- 架构评审文档。
- 开发计划文档。
- 后端设计文档。
- 聊天模块说明文档。
- v0.2 LLM 聊天集成计划。
- v0.2 聊天集成报告。
- v0.2.1 DeepSeek 配置报告。
- v0.3 文件上传计划。
- v0.3 文件上传报告。
- v0.4 文档解析计划。
- v0.4 文档解析报告。
- v0.4.1 DOCX 表格解析增强报告。
- v0.5 文本切块计划。
- v0.5 文本切块报告。
- v0.6 Embedding 抽象与调用计划。
- v0.6 Embedding 抽象与调用报告。
- v0.6.1 聊天侧文件接入体验优化计划。
- v0.6.1 聊天侧文件接入体验优化报告。
- v0.4.2 北辰agent UI 简化优化。
- v1.0 路线图。
- 文档同步审查报告。

当前限制：

- 部分历史文档仍未同步到当前 v1.0 范围。
- 后续需要继续同步架构、模块、API 和数据库设计文档。

## 4. 正在开发模块

当前正在推进的模块：

- v0.6.1 聊天侧文件接入体验优化收尾。
- 文档状态同步。
- RAG 前置模块规划。

下一步最适合推进：

- 进行 v0.6.1 浏览器联调：在聊天输入区上传文件，确认自动完成上传、解析、切块和 mock 向量化。
- 补充后端文件上传和解析接口的最小自动化测试。
- 进入 v0.7 VectorStore 向量存储设计。

## 5. 未开始模块

当前尚未开始实现：

- 向量数据库或向量存储抽象。
- RAG 检索服务。
- 基于文件的问答接口。
- 聊天会话持久化。
- 文件元数据数据库持久化。
- 文件列表后端 API。
- 文件删除后端 API。
- 数据库模型。
- 数据库迁移。
- 全局异常处理。
- 请求日志和 request id。
- AI 数据分析服务。
- 结构化数据上传。
- 自动图表生成。
- 数据自然语言解释。

## 6. 当前技术栈

### 6.1 已落地技术栈

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
- python-dotenv。
- python-multipart。
- python-docx。
- pypdf。
- OpenAI-compatible HTTP 调用。
- 本地 Mock LLM Provider。
- 本地文件存储。

工程：

- Git。
- npm。
- TypeScript 类型检查。
- Python 编译检查。

### 6.2 尚未落地技术栈

以下技术尚未在当前代码中真正实现：

- 数据库。
- ORM。
- 数据库迁移。
- Embedding 模型。
- 向量数据库。
- RAG 检索链路。
- 后端自动化测试框架。

## 7. 当前代码状态结论

当前项目不是完整可用的 AI 应用 MVP，而是：

**北辰agent 简洁 UI + 后端真实 LLM 聊天闭环 + 后端本地文件上传闭环 + 最小文档解析闭环 + 文本切块闭环 + mock embedding 闭环 + 聊天侧文件自动接入体验 + v1.0 文档规划。**

项目已经具备继续演进的基础边界：

- 前端有聚焦对话和文件中心的主要页面与状态管理。
- 后端有 API、Schema、Service、LLM Provider、FileService 的基本分层。
- LLM 调用已经通过 Provider 抽象预留扩展点。
- 前端聊天已经接入后端 `/api/v1/chat`。
- 后端已经通过 `.env` 安全读取 DeepSeek API 配置。
- 文件上传已经通过 `FileService` 预留后续文档解析、RAG 索引和数据库持久化入口。
- 文档解析已经通过 `DocumentParserService` 预留后续 chunk、embedding 和 RAG 入口。
- 文本切块已经通过 `ChunkService` 预留后续 embedding 和向量检索入口。
- Embedding 已经通过 `EmbeddingService` 和 `EmbeddingProvider` 预留后续真实 embedding provider、VectorStore 和 RAG 入口。
- 聊天侧文件上传已经通过前端 `fileStore.ingestFile()` 串联现有文件处理 API，但仍不提供文件问答能力。

当前最大缺口是：

- 向量存储、向量检索和 RAG 主链路尚未开始。
- 数据库和持久化能力尚未建立。
- AI 数据分析仍只是规划能力，尚未进入实现。

因此，下一阶段应进入 v0.7 VectorStore 向量存储规划；AI 数据分析继续保留规划边界，不挤占当前主链路。
