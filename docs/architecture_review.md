# 架构评审记录

> 本文档为架构评审历史记录，保留供回溯参考。
> 所有待确认项已在 `mvp_decision.md` 中固化，本文档中的待确认问题不阻塞工程初始化。

## 1. 评审结论

当前架构方向总体合理，适合 3 人左右团队开发企业内部 AI 助手 MVP。

主要判断：

- 单体架构合理。
- FastAPI + PostgreSQL + pgvector 的组合适合一期。
- 钉钉 OAuth 作为唯一认证方式合理。
- 本地文件存储适合 MVP。
- 不引入 Celery、MinIO、微服务、多 Provider 的边界是正确的。

但当前设计仍存在若干可能导致后期返工的风险，需要在正式编码前确认或收敛。

## 2. 架构优点

### 2.1 MVP 边界相对清晰

当前设计明确排除了密码注册、企业知识库、多模型、多 Provider、微服务、微前端、对象存储、消息队列等能力，能避免早期过度设计。

### 2.2 技术栈务实

FastAPI、PostgreSQL、pgvector、React、Vite、AntD 都是成熟且团队上手成本较低的技术。

对于“单文件问答”场景，pgvector 已经足够，不需要一开始引入独立向量数据库。

### 2.3 分层清晰

`api -> service -> repository` 的分层适合当前规模。

LLM、Parser、FileService 保留接口边界，有利于后续替换实现。

### 2.4 文档先行是正确方向

当前阶段先整理 `requirements.md`、`architecture.md`、`architecture_review.md`，有助于后续 Claude / Codex 开发时减少错误假设。

## 3. 主要风险

### 3.1 MVP 范围仍然偏大

“钉钉登录 + 聊天 + 文件解析 + RAG + PPT 生成”已经包含多个高风险模块。

风险点：

- 钉钉联调可能耗时。
- 文件解析质量不稳定。
- embedding 和检索效果需要调参。
- PPT 生成的样式和稳定性不容易一次做好。

建议：

- 第一阶段优先跑通“钉钉登录 + 单文件问答”。
- PPT 生成可以作为 MVP 后半段，但不要阻塞第一条业务闭环验收。

### 3.2 异步任务策略需要统一

此前设计中出现过“BackgroundTasks + 内存进度”和“Redis 用于 SSE 进度”的不同表述。

风险：

- 如果只用内存保存任务进度，服务重启后任务状态丢失。
- 如果多实例部署，内存状态无法共享。
- 后续接 Celery 时可能改动 API。

建议：

- 一期不引入 Celery。
- PPT 任务状态持久化到数据库。
- Redis 仅作为可选临时进度缓存。
- API 始终围绕 `job_id` 查询任务状态。

### 3.3 Redis 定位需要明确

当前 Redis 可能承担 session、SSE 进度、任务进度等职责，但 JWT 登录通常不需要 Redis session。

建议：

- 一期 JWT 不依赖 Redis session。
- Redis 只用于任务进度或 SSE 临时状态。
- 如果暂时没有 SSE，可以先不强依赖 Redis 业务逻辑。

### 3.4 前端开发环境已确认

当前技术方案提到 React + Vite，但 Docker Compose 初始方案可能只包含后端、数据库、Redis。

已确认：

- 前端不加入 Docker Compose。
- 前端开发期通过宿主机 Vite 本地启动。

建议：

- 后端 Docker Compose 只负责 `db`、`redis`、`app`。
- 后端配置 CORS 允许前端本地开发地址。

### 3.5 文件存储映射需要确认

如果 Docker 使用 named volume 保存 `/app/uploads` 和 `/app/ppt_outputs`，开发者在宿主机项目目录下可能看不到文件。

建议：

- 开发期优先使用 bind mount。
- 生产或类生产环境再考虑 named volume。
- FileService 不依赖具体存储路径细节。

### 3.6 时间规范需要修正

此前曾出现 `datetime.utcnow()` 作为 Python 时间规范的表述。

风险：

- `datetime.utcnow()` 返回 naive datetime。
- 与 `TIMESTAMPTZ` 搭配容易产生时区问题。

建议：

- Python 统一使用 `datetime.now(timezone.utc)`。
- 数据库字段使用 `TIMESTAMPTZ`。

### 3.7 企业身份模型需要提前考虑

即使一期只服务一个企业，也建议在用户表中保留企业身份字段。

建议预留：

- `corp_id` 或 `tenant_id`。
- `dingtalk_user_id`。
- `union_id`。
- `department_ids`。
- `metadata`。

待确认：

- 一期是否只接入单个钉钉企业。
- 是否需要部门级权限。

### 3.8 文件安全边界需要补充

企业文件上传涉及权限和安全边界。

待确认：

- 支持的文件格式。
- 单文件大小限制。
- 是否保留原始文件。
- 删除文件时是否删除 chunks 和 embedding。
- 是否需要病毒扫描。
- 文件是否有过期清理策略。

### 3.9 LLM 合规和网络访问需要确认

一期只接 Claude API 是合理的，但企业环境可能存在网络和合规风险。

待确认：

- 企业是否允许调用 Claude API。
- 是否需要代理或网关。
- 是否存在数据出境要求。
- 是否需要脱敏处理。

## 4. 建议调整项

### 4.1 明确 MVP 优先级

建议把 MVP 拆成两个验收阶段：

阶段一：

- 钉钉登录。
- 基础聊天界面。
- 普通 AI 对话。
- 单文件上传。
- 单文件问答。

阶段二：

- PPT 生成任务。
- PPT 状态查询。
- PPT 下载。
- 简单重新生成。

### 4.2 先设计最小数据模型

正式写代码前应先完成 `database_design.md`。

建议至少包含：

- `users`
- `files`
- `file_chunks`
- `chat_sessions`
- `chat_messages`
- `ppt_jobs`

### 4.3 固化单文件问答边界

建议从 API、数据库和 UI 三层共同约束：

- 一个聊天会话绑定一个 `file_id`，或每次提问必须携带 `file_id`。
- 检索必须按 `file_id` 过滤。
- 不提供全局知识库入口。

具体方案待 `api_design.md` 和 `database_design.md` 确认。

### 4.4 PPT 任务持久化

即使一期使用 BackgroundTasks，也建议设计 `ppt_jobs` 表。

原因：

- 支持任务状态查询。
- 支持失败原因记录。
- 支持生成结果下载。
- 后续迁移 Celery 时 API 不需要大改。

### 4.5 明确文档职责

建议：

- `requirements.md` 记录做什么、不做什么。
- `architecture.md` 记录系统如何组织。
- `database_design.md` 记录表结构。
- `module_design.md` 记录模块职责。
- `api_design.md` 记录接口契约。
- `development_plan.md` 记录阶段计划。
- `architecture_review.md` 记录风险、争议和决策。
- `status.md` 记录当前项目状态。

## 5. 当前待确认清单

- 钉钉登录方式：扫码、内嵌免登，还是两者都要。
- JWT 过期时间。
- 是否需要 refresh token。
- 一期支持的文件格式。
- 单文件大小限制。
- embedding 模型选择。
- PPT 生成库和模板策略。
- Redis 一期是否必须启用，或仅作为可选临时状态组件。
- Claude API 网络访问和数据合规要求。
- 是否只接入单个钉钉企业。
- 是否需要部门级权限。

## 6. 当前结论

架构评审已完成，所有待确认项已在 `mvp_decision.md` 中固化。

状态：**架构已冻结，可进入工程初始化阶段**。
