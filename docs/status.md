# 项目状态

本文档记录当前代码和部署的真实状态，不记录历史流水账。

## 1. 当前版本

当前阶段：v1.8.4 Retrieval Precision Tuning。

项目定位：

北辰agent 是一个面向小范围可信试用的独立网页版 AI 助手 MVP，核心能力包括普通聊天、文件上传、文档解析、单文件 RAG 问答、会话持久化、匿名用户隔离和基础部署运维。

当前部署状态：

- 已完成 Ubuntu VPS + Nginx + systemd 公网部署验证。
- 已支持邀请码访问保护和匿名 client_id 数据隔离。
- 域名、备案和 HTTPS 属于正式上线前的部署收尾事项。

## 2. 已完成模块

### 2.1 前端应用

- React + Vite + TypeScript 前端工程。
- Ant Design 组件体系。
- Zustand 状态管理。
- 北辰agent 品牌界面。
- 聊天页面和文件中心页面。
- 邀请码入口页面。
- 会话列表、会话切换和历史消息恢复。
- 文件上传、自动处理、状态展示和删除交互。
- 文件中心单文件检索和 RAG 问答。
- 聊天侧基于当前会话绑定文件进行 RAG 问答。
- RAG 引用片段、相关度和 debug trace 摘要展示。
- API client 自动携带邀请码和匿名 client_id。
- 前端统一解析 API 错误，并在可用时展示 request_id。

### 2.2 后端应用

- FastAPI 后端。
- OpenAI-compatible LLM Provider。
- Mock LLM Provider。
- OpenAI-compatible Embedding Provider。
- Mock Embedding Provider。
- SQLite + SQLAlchemy 持久化。
- 本地 uploads 文件存储。
- 本地 JSON VectorStore。
- request_id 日志链路。
- `/health` 和 `/health/config` 健康检查。

### 2.3 文件和 RAG

- TXT 解析。
- DOCX 段落解析。
- DOCX 表格文本解析。
- 可复制文本型 PDF 解析。
- 文本切块。
- 标题感知切块。
- chunk metadata 支持 `section_title` 和 `section_path`。
- embedding 生成。
- 本地向量索引保存。
- cosine similarity 单文件检索。
- score threshold、relative score gap 和 keyword bonus 检索调优。
- 检索结果返回 raw_score、keyword_bonus、final_score 和 relevance_level。
- 单文件 RAG 问答。
- RAG 连续追问使用当前会话短上下文。
- RAG debug trace 返回 trace_id、score 摘要、token 和无答案判断。
- RAG 人工测评工作表和测试用例模板。

### 2.4 数据持久化和隔离

- `files` 表保存文件元数据、处理状态、索引路径和 client_id。
- `chat_sessions` 表保存会话、标题、绑定文件和 client_id。
- `chat_messages` 表保存用户消息、助手消息和 RAG metadata。
- 按匿名 client_id 隔离文件、会话和消息。
- 删除文件时同步清理原始文件、本地向量索引和数据库记录。

### 2.5 部署和运维

- Windows 本地检查、启动、停止和 smoke test 脚本。
- Nginx 示例配置。
- systemd 服务模板。
- VPS 部署指南。
- Ubuntu VPS runtime 备份和恢复脚本模板。
- Ubuntu VPS 半自动部署脚本模板。
- 后端 pytest 基础测试。
- GitHub Safety Check 文档。

## 3. 当前技术栈

前端：

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand
- dayjs

后端：

- Python 3
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite
- python-dotenv
- python-multipart
- python-docx
- pypdf

AI 和 RAG：

- OpenAI-compatible LLM Provider
- OpenAI-compatible Embedding Provider
- 本地 JSON VectorStore
- cosine similarity Retrieval
- 单文件 RAG

部署：

- Ubuntu VPS
- Nginx
- systemd
- GitHub
- PowerShell 本地脚本

## 4. 当前线上试用边界

适合：

- 个人学习展示。
- 1-5 人可信小范围试用。
- 低并发访问。
- 小型 TXT / DOCX / 文本型 PDF 文档。
- 单文件 RAG 问答。

不适合：

- 公开大范围传播。
- 高并发生产使用。
- 企业级权限管理。
- 多租户系统。
- 多文件知识库。
- 扫描件 PDF OCR。
- 大规模长期文档存储。

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

### 6.1 RAG 质量风险

当前 RAG 已具备可用闭环，但检索质量仍处于持续优化阶段。v1.8.3 已增加标题感知切块和 section metadata，v1.8.4 已增加 score threshold、relative score gap、keyword bonus 和高/中/弱相关标记，用于减少弱相关噪声片段进入 RAG prompt。后续仍需要继续评估无答案策略、overview 问题处理和更高级的 rerank 方案。

### 6.2 数据风险

SQLite、uploads 和 vector_store 是当前核心运行时数据。部署更新前应先执行 runtime 备份，避免误操作造成历史会话、上传文件或索引丢失。

### 6.3 部署风险

当前部署仍以单机手动或半自动脚本为主。每次更新需要确认代码拉取、后端重启、前端 build、Nginx reload、health 检查和 smoke test。

### 6.4 安全风险

邀请码和匿名 client_id 只适合小范围可信试用，不是正式用户系统。邀请码泄露后仍可能造成 API 消耗。

## 7. 下一步建议

优先级建议：

1. 使用固定测试文档重新索引，比较 v1.8.2、v1.8.3 和 v1.8.4 的 Top-1 Accuracy、Citation Score 和噪声片段比例。
2. 根据测评结果微调 `RAG_SCORE_THRESHOLD`、`RAG_RELATIVE_SCORE_GAP` 和 `RAG_KEYWORD_BONUS_MAX`。
3. 进入 v1.8.5 RAG Prompt and No-answer Improvement，强化基于资料回答和无答案处理。
4. 备案通过后配置域名和 HTTPS。
5. 在 RAG 质量稳定后，再规划正式账号密码登录系统。
