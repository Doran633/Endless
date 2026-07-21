# 企业内部 AI 助手 MVP 架构设计

## 1. 架构目标

本架构服务于一期 MVP，优先保证核心链路可落地、可迭代、低运维成本。

核心目标：

- 支持钉钉登录。
- 支持单文件上传、解析、问答。
- 支持基于文件生成 PPT。
- 保持单体架构，降低早期复杂度。
- 为后续对象存储、任务队列、企业知识库、多模型扩展保留接口边界。

## 2. 技术栈

### 2.1 后端

- Python 3.12
- FastAPI
- SQLAlchemy 2.0
- Alembic
- PostgreSQL 16
- pgvector

### 2.2 前端

- React 18
- TypeScript
- Vite
- Ant Design 5
- Zustand

### 2.3 基础设施

- Docker Compose
- PostgreSQL 16 + pgvector
- Redis 7
- 本地文件存储

### 2.4 LLM

- 一期唯一 LLM Provider：Claude API。
- 代码结构预留 Provider 接口。
- 不提前实现第二个 Provider。

决策结果：

- Claude API：通过环境变量 `ANTHROPIC_API_KEY` 和 `ANTHROPIC_BASE_URL` 配置，企业需保证网络可达。
- embedding 模型：**BGE-M3**（本地部署，独立容器），维度 1024。企业数据不出域。
- 可选接入：如需切换 Qwen / DeepSeek embedding API，通过 EmbeddingProvider 接口替换实现。

（详见 `mvp_decision.md` 第 2.4 节 / 第 3 节）

### 2.3 基础设施

- Docker Compose：PostgreSQL 16 + pgvector、FastAPI 后端、BGE-M3 embedding 服务
- Redis：**一期不强依赖**，不在默认 Docker Compose 中。需要时（限流、Celery 等）再加入

## 3. 系统边界

### 3.1 一期系统组件

- Web 前端：用户登录、聊天、文件上传、PPT 任务查看和下载。
- API 服务：认证、文件、聊天、PPT 任务、LLM 编排。
- PostgreSQL：业务数据、文件元数据、聊天记录、chunk、向量。
- Redis：任务进度或临时状态，不用于 JWT session。
- 本地文件系统：上传文件、PPT 输出
- 钉钉开放平台：企业用户认证
- Claude API：AI 对话和内容生成

### 3.2 外部依赖

- 钉钉开放平台。
- Claude API。

## 4. 后端分层

后端采用单体三层架构：

```text
api/v1
  -> services
  -> repositories
  -> database
```

### 4.1 API 层

职责：

- 路由定义。
- 请求参数校验。
- 调用 Service。
- 返回统一响应。

不做：

- 业务逻辑。
- 直接访问数据库。
- 直接调用 LLM。

### 4.2 Service 层

职责：

- 编排业务流程。
- 调用 Repository。
- 调用 LLM Provider。
- 调用 Parser。
- 调用 FileService。

不做：

- 直接处理 HTTP Request / Response。
- 编写复杂 SQL。

### 4.3 Repository 层

职责：

- 数据访问。
- CRUD。
- 明确的查询封装。

不做：

- 业务判断。
- LLM 调用。
- 文件解析。

## 5. 建议目录结构

后续进入工程初始化阶段时，建议结构如下：

```text
project/
  docs/
  backend/
    app/
      api/v1/
      core/
      models/
      schemas/
      repositories/
      services/
      llm/
      parsers/
    tests/
    alembic/
    uploads/
    ppt_outputs/
  frontend/
    src/
      api/
      components/
      pages/
      hooks/
      stores/
      types/
```

当前阶段不创建 `backend/` 和 `frontend/`。

## 6. 认证架构

一期只支持钉钉 OAuth / 免登。

流程：

1. 前端获取钉钉 auth code。
2. 前端提交 auth code 到后端。
3. 后端调用钉钉接口换取用户身份。
4. 后端创建或更新本地用户。
5. 后端签发 JWT。
6. 前端携带 JWT 访问 API。

认证决策：

- 不做密码注册。
- 不做手机号登录。
- 用户表主键使用 UUID。
- 钉钉身份字段单独保存。
- 扩展字段使用 JSONB metadata。

决策结果：

- JWT access_token 有效期：**24 小时**。
- refresh_token：**提供**，有效期 **7 天**。
- 登录日志：**一期不实现**。

（详见 `mvp_decision.md` 第 2.1 节）

## 7. 文件与 RAG 架构

一期只做“单文件问答”。

流程：

```text
上传文件
  -> 本地存储
  -> 解析文本
  -> chunk 切分
  -> embedding
  -> 写入 file_chunks
  -> 按 file_id 检索
  -> 组装上下文
  -> 调用 Claude API
```

关键约束：

- 不做企业知识库。
- 不做全局向量检索。
- 检索必须带 `file_id`。
- 文件数据必须按用户隔离。

扩展边界：

- Parser 使用接口或注册表管理。
- FileService 封装本地存储。
- Repository 封装 pgvector 查询。

## 8. PPT 生成架构

PPT 生成为异步任务。

建议流程：

1. 创建 `ppt_jobs` 任务记录。
2. 后台任务执行内容生成。
3. 后台任务生成 PPT 文件。
4. 更新任务状态。
5. 前端轮询获取状态。
6. 用户下载 PPT。

一期不引入 Celery。

建议：

- 即使用 FastAPI BackgroundTasks，也应持久化任务状态。
- 任务状态持久化到数据库，Redis 仅作为可选临时进度缓存。
- 后续迁移 Celery 时保持 API 不变。

决策结果：

- PPT 生成库：**python-pptx**。
- 模板策略：**固定模板**，二期支持多模板选择和编辑。

（详见 `mvp_decision.md` 第 2.5 节）

## 9. 存储架构

一期使用本地文件系统。

路径建议：

- 上传文件：`uploads/`
- PPT 输出：`ppt_outputs/`

设计原则：

- 不直接在业务代码散落文件路径。
- 通过 FileService 封装存储行为。
- 后续替换 OSS / MinIO 时修改 FileService 实现。

决策结果：

- 文件保留周期：**一期不自动删除**。
- 删除策略：用户显式删除时，**同步删除 chunks 和 PPT 产物**。
- 保留原始文件：**是**。

（详见 `mvp_decision.md` 第 2.3 节）

## 10. 异步任务策略

一期不使用 Celery 或消息队列。

建议策略：

- 执行器：FastAPI BackgroundTasks。
- 任务状态：数据库持久化。
- 临时进度：Redis 可选。
- 查询方式：一期使用前端轮询，不引入 SSE。

需要避免：

- 仅使用内存保存关键任务状态。
- API 与具体任务执行器强绑定。

## 11. Docker Compose 架构

一期建议服务：

- `db`：PostgreSQL + pgvector。
- `app`：FastAPI 后端。
- `embedding`：BGE-M3 embedding 服务（本地部署）。

前端开发方式：

- 前端不加入 Docker Compose。
- 前端开发期在宿主机通过 Vite 本地启动。
- 后端需要配置 CORS 允许前端本地开发地址。

决策结果：开发期使用 **bind mount**，生产环境使用 **named volume**。

（详见 `mvp_decision.md` 第 3 节）

## 12. 时间与 ID 规范

- 主键使用 UUID。
- 数据库时间字段使用 `TIMESTAMPTZ`。
- Python 使用 timezone-aware UTC 时间，例如 `datetime.now(timezone.utc)`。
- 扩展字段统一命名为 `metadata`，类型使用 JSONB。

## 13. API 响应规范

统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

决策结果：

- 错误码范围：`4xxxx`，前两位标识模块（`40xxx` 通用、`41xxx` 认证、`42xxx` 文件、`43xxx` 聊天、`44xxx` PPT）。
- 分页响应格式：`{ "items": [], "total": int, "page": int, "page_size": int }`。

（详见 `mvp_decision.md` 第 2.6 节）

## 14. 当前阶段说明

当前仍处于架构设计和文档整理阶段。

本阶段不创建后端工程、不创建前端工程、不写业务代码。
