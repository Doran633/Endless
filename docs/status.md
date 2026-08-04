# 项目状态

本文档记录当前代码和部署的真实状态，不记录历史计划，不堆叠旧版本流水账。

## 1. 当前版本

当前阶段：v1.7.2 Runtime Backup and Restore。

上一稳定能力版本：v1.6.3 Anonymous Client Isolation。

当前项目定位：

**北辰agent 是一个面向 1-5 人可信试用的独立网页版 AI 助手 MVP，核心能力是普通聊天、文件上传、单文件 RAG 问答、会话持久化和公网小范围试用。**

当前部署状态：

- 已完成 Ubuntu VPS + Nginx + systemd 的公网部署验证。
- 已通过公网 IP 完成可访问性验证。
- 域名、ICP备案和 HTTPS 仍属于正式上线前的部署收尾事项。

## 2. 已完成模块

### 2.1 前端应用

- React + Vite + TypeScript 前端工程。
- Ant Design 组件体系。
- Zustand 状态管理。
- 北辰agent 品牌界面。
- 聊天页面。
- 文件中心页面。
- 邀请码入口页。
- 会话侧边栏。
- 普通聊天消息展示。
- RAG 回答引用片段展示。
- 文件上传、处理状态和删除交互。
- API client 自动携带访问邀请码和匿名 `client_id`。

### 2.2 普通聊天

- FastAPI 聊天接口：`POST /api/v1/chat`。
- Mock LLM Provider。
- OpenAI-compatible LLM Provider。
- `.env` 配置 API Key、模型和 Base URL。
- 普通聊天支持当前会话最近 6 条消息作为短上下文。
- 无 `session_id` 时仍支持单轮聊天兼容路径。

### 2.3 文件处理

- 文件上传到后端运行时上传目录。
- TXT 解析。
- DOCX 段落解析。
- DOCX 表格文本解析。
- 可复制文本型 PDF 解析。
- 文本切块。
- 文件处理状态持久化。
- 文件删除 API。
- 删除文件时同步清理原始文件、本地 JSON 索引和数据库记录。

### 2.4 Embedding / VectorStore / Retrieval

- Mock Embedding Provider。
- OpenAI-compatible Embedding Provider。
- `.env` 配置 embedding provider、模型、维度、API Key 和 Base URL。
- 文件切块后可生成 embedding。
- 本地 JSON VectorStore 保存 chunks 和 embeddings。
- RetrievalService 基于 query embedding 和 cosine similarity 返回 top_k chunks。

### 2.5 单文件 RAG

- 文件问答接口：`POST /api/v1/files/{file_id}/ask`。
- RagService 复用 RetrievalService 和 LLMProvider。
- RAG prompt 包含系统身份说明、检索片段、最近对话上下文和当前问题。
- 文件中心支持单文件问答。
- 聊天侧支持基于当前会话最近 indexed 文件进行 RAG 问答。
- RAG 问答支持当前会话内连续追问。

### 2.6 数据持久化

- SQLite + SQLAlchemy。
- `files` 表保存文件元数据、处理状态、索引路径和 `client_id`。
- `chat_sessions` 表保存会话、标题、绑定文件和 `client_id`。
- `chat_messages` 表保存用户消息、助手消息和 RAG metadata。
- 前端刷新后恢复会话列表。
- 切换会话后恢复历史消息。
- 当前会话绑定文件可恢复。
- 自动会话标题。

### 2.7 访问保护和匿名隔离

- 邀请码访问保护。
- `APP_INVITE_CODES` 支持多个 6 位邀请码。
- 兼容旧 `APP_ACCESS_PASSWORD` 单口令模式。
- 前端邀请码保存在 localStorage。
- 前端首次访问生成匿名 `client_id`。
- 所有业务 API 请求携带 `X-Beichen-Client-Id`。
- 后端按 `client_id` 隔离文件、会话和消息。
- 邀请码只作为访问门票，不作为正式用户身份。

### 2.8 部署和运维

- Windows 本地检查、启动、停止和 smoke test 脚本。
- Nginx 示例配置。
- systemd 服务模板。
- VPS 部署指南。
- Ubuntu VPS runtime 备份脚本模板。
- Ubuntu VPS runtime 恢复脚本模板。
- `/health` 健康检查。
- `/health/config` 非敏感配置健康检查。
- request_id 日志。
- 可选文件日志配置。
- GitHub Safety Check 文档。

## 3. 当前技术栈

### 前端

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand
- dayjs

### 后端

- Python 3
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite
- python-dotenv
- python-multipart
- python-docx
- pypdf

### AI 能力

- OpenAI-compatible LLM Provider
- OpenAI-compatible Embedding Provider
- Mock LLM Provider
- Mock Embedding Provider
- 本地 JSON VectorStore
- 单文件 RAG

### 部署

- Ubuntu VPS
- Nginx
- systemd
- GitHub
- PowerShell 本地脚本

## 4. 当前线上试用边界

当前适合：

- 个人学习展示。
- 可信任小范围试用。
- 1-5 人低并发访问。
- 单文件 RAG 问答。
- 小型 TXT / DOCX / 文本型 PDF 文档。

当前不适合：

- 公开大范围传播。
- 高并发生产使用。
- 企业级权限管理。
- 多租户系统。
- 多文件知识库。
- 长期大规模文件存储。
- 对扫描件 PDF 做 OCR。

## 5. 当前未实现模块

- 正式用户注册和登录。
- JWT / session cookie 认证系统。
- 跨设备账号同步。
- 多文件 RAG。
- PostgreSQL。
- pgvector 或生产向量数据库。
- 文件处理异步任务队列。
- 文件处理进度推送。
- 会话摘要。
- 历史消息语义检索。
- 长期记忆。
- Agent Workflow。
- AI 数据分析。
- PPT 生成。
- 企业权限、企业系统接入和多租户。

## 6. 当前主要风险

### 6.1 数据风险

SQLite、uploads 和 vector_store 是当前核心运行时数据。当前已新增 Ubuntu VPS 备份和恢复脚本模板，但仍需在真实服务器更新前养成固定备份习惯。

### 6.2 部署风险

部署流程已经跑通，但仍以手动操作为主。后续每次更新都需要确保：

- 代码已拉取。
- 前端已重新 build。
- 后端已重启。
- Nginx 配置已 reload。
- `/health` 和 `/health/config` 正常。
- smoke test 通过。

### 6.3 安全风险

邀请码和匿名 `client_id` 适合小范围可信试用，但不是正式用户系统。邀请码泄露后仍可能造成 API 消耗。

### 6.4 可维护性风险

历史文档较多，部分旧文档可能仍包含早期规划、旧命名或过期描述。当前阶段需要优先保证 README、status 和部署入口文档准确。

## 7. 当前 v1.7 目标

v1.7 是 Production Hardening 阶段，目标不是新增 AI 能力，而是提升现有系统的稳定性和可维护性。

核心工作：

- 清理状态文档乱码和旧描述。
- 清理 WorkBuddy 旧命名残留。
- 整理服务器备份和恢复方案。
- 增加基础后端自动化测试。
- 优化前端错误提示和 request_id 展示。
- 固化部署更新流程。

## 8. 下一步建议

优先级顺序：

1. 完成 v1.7.2 服务器备份与恢复方案验证。
2. 进入 v1.7.3 后端基础测试。
3. 进入 v1.7.4 前端错误提示优化。
4. 备案通过后配置域名和 HTTPS。
5. 小范围试用期间坚持部署前备份和部署后 smoke test。
