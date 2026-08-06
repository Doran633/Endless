# 项目状态

本文档记录当前代码和部署的真实状态，不记录历史流水账。

## 1. 当前版本

当前阶段：v1.8.8 Evidence-aware Retrieval。

项目定位：北辰agent 是一个面向小范围可信试用的独立网页版 AI 助手 MVP，核心能力包括普通聊天、文件上传、文档解析、单文件 RAG 问答、会话持久化、匿名用户隔离、邀请码访问保护和基础部署运维。

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
- RAG 引用片段、相关度、Section、chunk_type、ranking_reason 和 debug trace 展示。
- RAG 质量摘要展示 answer_policy 和 no_answer_reason。
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
- 邀请码访问保护。
- 匿名 client_id 数据隔离。

### 2.3 文件处理和 RAG

- TXT 解析。
- DOCX 段落解析。
- DOCX 表格文本解析。
- 文本型 PDF 解析。
- 固定长度切块 fallback。
- 标题感知切块。
- section_summary chunk。
- chunk metadata 支持 `section_title`、`section_path` 和 `chunk_type`。
- OpenAI-compatible embedding 生成。
- 本地向量索引保存。
- cosine similarity 单文件检索。
- score threshold、relative score gap 和 keyword bonus。
- query intent 识别，包括 overview、capability、limit、deployment、usage、quantity、general。
- section boost / penalty。
- short chunk length penalty。
- 数值型问题 answerability bonus。
- RetrievalResult 返回 raw_score、keyword_bonus、final_score、relevance_level、query_intent 和 ranking_reason。
- RetrievalResult 返回 evidence_score、evidence_level 和 evidence_reason，用于区分“语义相关”和“可作为证据”。
- 检索排序已纳入 evidence-aware scoring，对 title-only chunk、过短片段和意图噪声片段进行降权。
- 单文件 RAG 问答。
- RAG 连续追问使用当前会话短上下文。
- RAG prompt 已要求模型只基于检索片段回答，并优先使用 strong / medium evidence chunks。
- answer_policy 支持 grounded_answer、low_confidence_answer、no_answer。
- no_answer_reason 支持 empty_retrieval、low_score、weak_chunks、model_refusal。
- RAG debug trace 返回 trace_id、score 摘要、token、confidence、no_answer 和 answer_policy。
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

当前 RAG 已具备可用闭环，但检索质量仍处于优化阶段。v1.8 已陆续增加标题感知切块、section metadata、检索评分诊断、query intent、summary chunk 和严格 no-answer policy。后续仍需要继续用固定测试文档记录 Top-1 Accuracy、Citation Score、No-answer Accuracy 和噪声片段比例。

### 6.2 数据风险

SQLite、uploads 和 vector_store 是当前核心运行时数据。部署更新前应先执行 runtime 备份，避免误操作造成历史会话、上传文件或索引丢失。

### 6.3 部署风险

当前部署仍以单机半自动脚本为主。每次更新需要确认代码拉取、后端重启、前端 build、Nginx reload、health 检查和 smoke test。

### 6.4 安全风险

邀请码和匿名 client_id 只适合小范围可信试用，不是正式用户系统。邀请码泄露后仍可能造成 API 消耗。

## 7. 下一步建议

优先级建议：

1. 使用固定测试文档重新索引并测评 v1.8.8 的 Citation Score、Top-1 Accuracy 和噪声片段比例。
2. 针对更复杂长文档准备新的 RAG 测试集，覆盖标题噪声、配置噪声、限制类事实和无答案问题。
3. 备案通过后配置域名、HTTPS 和正式 Nginx server_name。
4. 单文件 RAG 质量稳定后，再规划 Hybrid Retrieval、多文件 RAG 或正式账号密码登录系统。
