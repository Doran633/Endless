# 模块设计

## 1. 设计原则

- 保持单体应用。
- 后端遵循 `api -> service -> repository`。
- 模块职责清晰，避免跨层调用。
- 只实现 MVP 必需能力。
- 对 LLM、文件存储、文档解析保留接口边界，但不提前实现多套方案。

## 2. 后端模块

### 2.1 api/v1

职责：

- 定义 HTTP API。
- 做请求参数校验。
- 调用 Service。
- 返回统一响应结构。

不做：

- 业务编排。
- 数据库访问。
- 文件解析。
- LLM 调用。

建议子模块：

- `auth.py`
- `files.py`
- `chat.py`
- `ppt.py`
- `health.py`

### 2.2 core

职责：

- 应用配置。
- 数据库连接。
- JWT 工具。
- 统一异常。
- 日志配置。

决策结果：

- 配置加载：**pydantic-settings** + `.env` 文件。
- JWT access_token 有效期：**24 小时**，refresh_token 有效期：**7 天**。

（详见 `mvp_decision.md` 第 2.7 节 / 第 2.1 节）

### 2.3 models

职责：

- SQLAlchemy ORM 模型。
- 与数据库 migration 保持一致。

建议模型：

- `User`
- `File`
- `FileChunk`
- `ChatSession`
- `ChatMessage`
- `PptJob`

### 2.4 schemas

职责：

- Pydantic 请求和响应模型。
- API 层参数校验。

约束：

- 不放业务逻辑。
- 不直接依赖 ORM session。

### 2.5 repositories

职责：

- 封装数据库读写。
- 提供清晰的数据访问方法。

建议仓储：

- `UserRepository`
- `FileRepository`
- `FileChunkRepository`
- `ChatRepository`
- `PptJobRepository`

约束：

- 不调用 LLM。
- 不做文件解析。
- 不做复杂业务判断。

### 2.6 services

职责：

- 编排业务流程。
- 组合 Repository、LLM、Parser、FileService。

建议服务：

- `AuthService`
- `FileService`
- `ChatService`
- `PptService`
- `EmbeddingService`

### 2.7 llm

职责：

- 封装 Claude API 调用。
- 定义 LLM Provider 接口。
- 对上层屏蔽具体 SDK 或 HTTP 细节。

一期约束：

- 只实现 Claude Provider。
- 不实现第二个 Provider。
- 不做模型切换 UI。

决策结果：

- Claude 模型版本：通过环境变量 `LLM_MODEL` 配置，默认 `claude-sonnet-5`。
- 超时和重试策略：一期实现基础超时设置（可通过环境变量配置），失败重试 1 次。
- embedding：使用 BGE-M3（本地部署，独立容器），不由 Claude 提供。

（详见 `mvp_decision.md` 第 2.7 节 / 第 2.4 节）

### 2.8 parsers

职责：

- 根据文件类型解析文本。
- 输出统一文本结构。

一期约束：

- 只支持已确认文件格式。
- 未支持格式返回明确错误。

决策结果：

- 一期格式：**TXT、PDF、DOCX**。
- PDF 解析使用 **PyMuPDF (fitz)**，DOCX 解析使用 **python-docx**。
- 未支持格式返回明确错误信息。

（详见 `mvp_decision.md` 第 2.3 节）

### 2.9 background_tasks

职责：

- 执行 PPT 生成等耗时任务。
- 更新数据库任务状态。

一期约束：

- 使用 FastAPI BackgroundTasks。
- 不引入 Celery。
- 不使用内存保存关键任务状态。

## 3. 前端模块

前端不加入 Docker Compose，开发期通过宿主机 Vite 本地启动。

### 3.1 api

职责：

- 封装后端 API 调用。
- 注入 JWT。
- 统一处理响应结构和错误。

### 3.2 pages

建议页面：

- 登录页。
- 聊天页。
- 文件问答页可合并在聊天页内。
- PPT 任务结果入口可合并在聊天页或文件详情区域。

### 3.3 components

建议组件：

- 聊天消息列表。
- 输入框。
- 文件上传组件。
- 文件状态组件。
- PPT 任务状态组件。

### 3.4 stores

职责：

- 保存登录态。
- 保存当前用户。
- 保存当前会话。

约束：

- 使用 Zustand。
- 不引入 Redux。

## 4. 核心模块交互

### 4.1 登录

```text
Auth API
  -> AuthService
  -> Dingtalk client
  -> UserRepository
  -> JWT
```

### 4.2 上传文件

```text
Files API
  -> FileService
  -> local storage
  -> Parser
  -> EmbeddingService
  -> FileChunkRepository
```

### 4.3 文件问答

```text
Chat API
  -> ChatService
  -> ChatRepository
  -> FileChunkRepository search by file_id
  -> LLM Provider
  -> ChatRepository save messages
```

### 4.4 PPT 生成

```text
PPT API
  -> PptService create job
  -> PptJobRepository
  -> BackgroundTasks
  -> LLM Provider
  -> PPT generator
  -> local storage
  -> PptJobRepository update status
```

## 5. 不允许的模块扩张

一期不要新增：

- 密码注册模块。
- 用户后台管理模块。
- 企业知识库模块。
- 多 Provider 管理模块。
- 对象存储模块实现。
- Celery worker。
- 微服务网关。
- 微前端。

## 6. 说明

所有此前待确认项已在 `mvp_decision.md` 中固化，此处不再保留为开放问题。

已落地决策概要：
- Parser 首批格式：TXT、PDF、DOCX。
- PPT 生成库：python-pptx，固定模板。
- Claude 模型版本通过环境变量配置。
- 错误码采用 `4xxxx` 格式，按模块分配区间。
