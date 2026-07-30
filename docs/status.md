# 项目状态

> 本文档记录当前代码真实状态，不记录历史计划，不包含未来企业功能范围。

## 1. 当前版本

当前版本：`v1.2.3`

当前阶段：Persistent Conversations 普通聊天与 RAG 消息持久化阶段。

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
- 已完成真实 embedding provider 接入：后端支持 OpenAI-compatible Embedding Provider，并可通过 `.env` 在 `mock` 与 `openai` 间切换。
- 已完成聊天侧文件接入体验优化：聊天输入区可以上传文件，并自动串联上传、解析、切块和向量化流程。
- 已完成本地 VectorStore 闭环：后端将 chunks 和 embeddings 保存到 `backend/vector_store/` 的 JSON 索引文件，前端展示 indexed 状态和索引摘要。
- 已完成最小 Retrieval 检索闭环：后端基于本地 VectorStore 和 query embedding 计算 cosine similarity，前端文件中心展示 top_k chunks 和 score。
- 已完成最小 RAG 单文件问答闭环：后端基于 RetrievalService 返回的 top_k chunks 组装 RAG prompt，调用现有 LLMProvider 生成答案，前端文件中心展示回答和引用 chunks。
- 已完成聊天侧 RAG 问答体验优化：聊天框上传文件并完成 indexed 后，当前对话会绑定最近一个文件，用户继续提问时调用 `/api/v1/files/{file_id}/ask`，回答作为聊天消息展示，并附带引用 chunks 摘要。
- 已完成 GitHub 分享前基础整理：新增 `README.md`，更新 `backend/.env.example` 和 `.gitignore`，明确 API Key、上传文件和本地向量索引不应提交。
- 已完成 v1.0.1 发布前检查：后端编译检查、前端类型检查、敏感文件忽略检查和基础密钥扫描均已通过。
- 已完成北辰agent UI 简化优化：统一产品命名，聚焦“对话 + 文件中心”，隐藏当前暂不实现的 PPT 入口。
- 已完成 SQLite + SQLAlchemy 数据库基础接入。
- 已新增 `files` 表，用于保存文件元数据和基础处理状态。
- 已完成上传文件元数据持久化：文件保存到 `backend/uploads/` 后，会同步写入 SQLite。
- 已新增 `GET /api/v1/files`，用于从后端恢复文件列表。
- 已完成文件中心刷新恢复：前端文件中心打开时会从后端读取真实文件列表。
- 已完成文件处理状态持久化：解析、切块、向量化和本地索引保存成功后，会更新 SQLite 中的文件处理状态。
- 已完成文件处理失败状态记录：处理失败时会尽量写入 `failed` 和 `error_message`，同时保留原始错误继续返回给调用方。
- 已完成轻量 UI 丰富：文件中心新增状态概览，上传区、状态标签、空状态和 RAG 引用片段展示更面向用户。
- 已完成文件中心自动处理：上传后自动执行解析、切块、embedding 和本地索引保存，并展示当前处理阶段。
- 已新增 `DELETE /api/v1/files/{file_id}`：删除对应原始文件、本地 JSON 索引和 SQLite 文件记录。
- 已完成前端真实删除闭环：删除前确认，成功后同步文件列表；删除当前会话绑定文件时会解除 RAG 绑定。
- 已新增 `chat_sessions` 表，用于保存聊天会话基础信息和当前会话绑定文件字段。
- 已新增 `chat_messages` 表，用于保存会话消息正文和 RAG 引用等消息 metadata。
- 已新增 `ChatRepository`，支持创建会话、查询会话列表、查询单个会话、删除会话、创建消息和查询会话消息。
- 已完成删除会话时同步删除其消息的 Repository 层基础能力。
- 已新增 `ConversationService`，用于编排会话创建、列表查询、消息查询、会话删除和文件绑定校验。
- 已新增会话 API：`GET /api/v1/chat/sessions`、`POST /api/v1/chat/sessions`、`DELETE /api/v1/chat/sessions/{session_id}`、`GET /api/v1/chat/sessions/{session_id}/messages`、`PATCH /api/v1/chat/sessions/{session_id}/file`。
- 已支持会话绑定或解除单个文件，绑定时会校验文件存在且状态为 `indexed`。
- 已支持删除文件时清除数据库中绑定该文件的会话字段。
- 已支持 `POST /api/v1/chat` 携带可选 `session_id` 时，将普通聊天的 user 和 assistant 消息写入 `chat_messages`。
- 已支持 `POST /api/v1/files/{file_id}/ask` 携带可选 `session_id` 时，将 RAG 问答的 user 和 assistant 消息写入 `chat_messages`。
- 已支持在 RAG assistant 消息 `metadata_json` 中保存 `rag_file_id`、`rag_file_name`、`used_chunks` 和 `token_count`。

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
- 文件中心状态概览区。
- 文件中心上传工作台式组件。
- 文件中心上传后自动解析、切块、向量化和保存索引。
- 文件自动处理阶段与失败原因展示。
- 文件真实删除与删除确认。
- 文件解析触发入口。
- 文件解析结果预览。
- 文件切块触发入口。
- chunk 数量和 chunk 预览展示。
- 文件向量化触发入口。
- embedding 数量、维度和向量预览展示。
- 聊天输入区文件上传入口。
- 聊天侧文件自动处理状态展示。
- 聊天侧文件自动本地索引保存。
- 聊天侧最近 indexed 文件绑定。
- 聊天消息流中的 RAG 回答展示。
- RAG 回答引用 chunks 摘要展示。
- RAG 回答参考片段展示优化。
- 文件中心本地索引保存触发入口。
- indexed 状态和本地索引路径摘要展示。
- 文件中心检索测试入口。
- query、score 和 top_k chunk 内容展示。
- 北辰agent 品牌界面。
- Zustand 状态管理。
- 本地 Mock API：`frontend/src/api/mock.ts`。
- 聊天 API Client：`frontend/src/api/chatApi.ts`。
- 文件上传 API Client：`frontend/src/api/fileApi.ts`。

当前限制：

- 前端聊天已经调用后端 `/api/v1/chat`。
- 前端文件上传已经调用后端 `/api/v1/files`。
- 文件中心与聊天侧上传均会自动串联完整文件处理 API。
- 前端文件解析已经调用后端 `/api/v1/files/{file_id}/parse`。
- 前端文件切块已经调用后端 `/api/v1/files/{file_id}/chunks`。
- 前端文件向量化已经调用后端 `/api/v1/files/{file_id}/embeddings`。
- 前端文件本地索引保存已经调用后端 `/api/v1/files/{file_id}/vector-store`。
- 前端文件检索测试已经调用后端 `/api/v1/files/{file_id}/retrieve`。
- 聊天侧文件上传会自动串联 `/api/v1/files`、`/api/v1/files/{file_id}/parse`、`/api/v1/files/{file_id}/chunks`、`/api/v1/files/{file_id}/embeddings` 和 `/api/v1/files/{file_id}/vector-store`。
- 聊天侧存在最近 indexed 文件时，用户发送消息会调用 `/api/v1/files/{file_id}/ask`；没有当前文件时仍调用 `/api/v1/chat`。
- 前端会话和历史消息仍使用 Mock / 前端内存状态。
- 文件中心初始文件列表已开始从后端 `GET /api/v1/files` 恢复。
- 前端文件删除已经调用后端 `DELETE /api/v1/files/{file_id}`。
- 解析文本预览、字符数和各处理阶段摘要可从 SQLite 恢复；chunk 与 embedding 的详细预览仍只存在于当前前端状态或本地 JSON 索引中。
- chunk 与 embedding 内容已经可以写入本地 JSON 索引，解析、切块、embedding 和 indexed 状态也可以从 SQLite 恢复。

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
- 本地向量索引接口：
  - `POST /api/v1/files/{file_id}/vector-store`
  - `GET /api/v1/files/{file_id}/vector-store`
- `VectorStoreService` 本地向量存储业务边界。
- 本地索引目录：`backend/vector_store/`。
- 本地索引文件结构包含：
  - `file_id`
  - `chunk_id`
  - `chunk_index`
  - `content`
  - `char_count`
  - `embedding`
  - `embedding_dimension`
  - `embedding_model`
  - `created_at`
- 文件检索接口：`POST /api/v1/files/{file_id}/retrieve`。
- `RetrievalService` 本地检索业务边界。
- 检索结果响应字段包含：
  - `query`
  - `top_k`
  - `result_count`
  - `results[].chunk_id`
  - `results[].chunk_index`
  - `results[].content`
  - `results[].score`
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

- 文件元数据已在上传成功后写入 SQLite。
- 服务重启或页面刷新后，前端文件中心可以从后端恢复文件基础列表。
- 文档解析状态、文本预览和字符数已写入数据库。
- 文本切块数量已写入数据库。
- embedding 数量、维度和模型已写入数据库。
- 本地索引状态和索引路径已写入数据库。
- 暂不支持文件下载；文件删除已支持原始文件、JSON 索引和数据库记录的同步清理。
- 暂不支持 OCR、病毒扫描、对象存储。
- PDF 解析仅支持可复制文本型 PDF，不支持扫描件 OCR。
- chunk 和 embedding 结果已经可以写入本地 JSON VectorStore，但尚未写入数据库或 pgvector。
- 当前切块策略是字符数切块，不是 tokenizer-aware 或 semantic chunk。
- embedding 结果尚未写入向量数据库。
- 当前可使用 mock 或 OpenAI-compatible embedding；mock 模式仍不代表真实语义。

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
- v0.7 VectorStore 向量存储计划。
- v0.7 VectorStore 向量存储报告。
- v0.8 Retrieval 检索服务计划。
- v0.8 Retrieval 检索服务报告。
- v0.4.2 北辰agent UI 简化优化。
- v1.0 路线图。
- v1.1.4 文件生命周期闭环报告。
- 文档同步审查报告。

当前限制：

- 部分历史文档仍未同步到当前 v1.0 范围。
- 后续需要继续同步架构、模块、API 和数据库设计文档。

## 4. 正在开发模块

当前正在推进的模块：

- v1.2 Persistent Conversations 持久会话。
- 前端刷新恢复、会话切换和当前会话文件绑定恢复。

下一步最适合推进：

- 前端接入会话 API。
- 刷新后恢复当前会话、历史消息与 RAG 文件绑定。

## 5. 未开始模块

当前尚未开始实现：

- 前端刷新后恢复会话和消息。
- 当前会话绑定文件的前端恢复接入。
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
- SQLite。
- SQLAlchemy。
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

- 数据库迁移。
- 向量数据库。
- 后端自动化测试框架。

## 7. 当前代码状态结论

当前项目不是完整可用的 AI 应用 MVP，而是：

**北辰agent 简洁 UI + 文件中心轻量工作台体验 + 后端真实 LLM 聊天闭环 + 后端本地文件上传闭环 + 文件元数据 SQLite 持久化 + 文件处理状态持久化 + 文件列表刷新恢复 + 最小文档解析闭环 + 文本切块闭环 + Mock / OpenAI-compatible embedding 闭环 + 本地 VectorStore 闭环 + Retrieval 检索闭环 + 单文件 RAG 问答闭环 + 聊天侧 RAG 问答体验。**

项目已经具备继续演进的基础边界：

- 前端有聚焦对话和文件中心的主要页面与状态管理。
- 后端有 API、Schema、Service、LLM Provider、FileService 的基本分层。
- 后端已新增 DB 和 Repository 分层，开始承接文件元数据持久化。
- LLM 调用已经通过 Provider 抽象预留扩展点。
- 前端聊天已经接入后端 `/api/v1/chat`。
- 后端已经通过 `.env` 安全读取 DeepSeek API 配置。
- 文件上传已经通过 `FileService` 预留后续文档解析、RAG 索引和数据库持久化入口。
- 文档解析已经通过 `DocumentParserService` 预留后续 chunk、embedding 和 RAG 入口。
- 文本切块已经通过 `ChunkService` 预留后续 embedding 和向量检索入口。
- Embedding 已经通过 `EmbeddingService` 和 `EmbeddingProvider` 支持 MockEmbeddingProvider 与 OpenAI-compatible Embedding Provider 切换。
- VectorStore 已经通过 `VectorStoreService` 预留后续 RetrievalService 和 pgvector 替换入口。
- Retrieval 已经通过 `RetrievalService` 预留后续 RagService 和文件问答入口。
- RAG 已经通过 `RagService` 复用 RetrievalService 和 LLMProvider，实现单文件问答入口。
- 聊天侧文件上传已经通过前端 `fileStore.ingestFile()` 串联现有文件处理 API 并保存本地索引；索引完成后，当前对话可直接基于最近一个 indexed 文件提问。

当前最大缺口是：

- RAG 当前仅支持最近一个 indexed 文件的单文件问答。
- 文件生命周期已经闭环，聊天会话和消息表已创建，Repository 层基础读写能力已完成。
- 聊天会话 API 和普通聊天/RAG 消息落库已完成，前端刷新恢复和当前文件绑定前端接入尚未完成。
- AI 数据分析仍只是规划能力，尚未进入实现。

因此，下一阶段应继续推进 v1.2 持久会话：前端接入会话 API，恢复刷新前的会话列表、历史消息和当前 RAG 文件绑定。AI 数据分析继续保留规划边界，不挤占当前主链路。
