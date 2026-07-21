# MVP 架构冻结决策记录

> 本文档记录一期 MVP 所有固化决策，作为工程初始化的唯一依据。
> 所有设计文档中与此冲突的内容以此为准。
> 创建日期：2026-07-21

---

## 1. 项目定位

企业内部 AI 助手一期 MVP，核心目标：跑通 **"钉钉登录 → 单文件上传 → 单文件解析 → 单文件问答 → PPT 生成"** 业务闭环。

---

## 2. 一期实现范围

### 2.1 认证

| 决策项 | 决策结果 |
|--------|---------|
| 钉钉登录方式 | **扫码登录**（Web 端通用，不依赖钉钉内嵌环境） |
| 钉钉内嵌免登 | 二期实现 |
| JWT access_token 有效期 | **24 小时** |
| JWT refresh_token | **提供**，有效期 **7 天** |
| 管理员后台 | **一期不做**。最小运维操作通过数据库直接管理 |
| 登录日志 | **一期不实现** |

### 2.2 聊天

| 决策项 | 决策结果 |
|--------|---------|
| 普通 AI 对话 | 一期支持 |
| 单文件问答 | 一期支持，会话绑定 `file_id` |
| 流式输出（SSE） | **一期不支持**，API 返回完整回答 |
| 聊天记录 | 持久化到数据库 |

### 2.3 文件

| 决策项 | 决策结果 |
|--------|---------|
| 支持格式 | **TXT、PDF、DOCX**（三种最核心的文本格式） |
| XLSX / PPTX 解析 | 二期 |
| 单文件大小上限 | **20 MB** |
| 文件解析时机 | **上传后异步解析**。流程：uploaded → processing → ready / failed |
| 文件删除 | **一期实现删除接口**，同步删除：chunks + PPT 产物 |
| 保留原始文件 | **是** |
| 文件 hash 去重 | **一期不做** |
| 文件自动过期清理 | **一期不做** |

### 2.4 文件解析与向量化

| 决策项 | 决策结果 |
|--------|---------|
| chunk 大小 | **512 tokens** |
| chunk overlap | **64 tokens** |
| embedding 模型 | **BGE-M3**（BAAI），本地部署，支持中文 + 英文 |
| 向量维度 | **1024**（dense vector） |
| pgvector 索引 | **ivfflat**，lists=100（MVP 数据量级下足够） |
| 检索范围 | 必须按 `file_id` 精确过滤 |
| 全局向量检索 | **一期不做** |
| embedding 服务部署 | 独立容器封装 BGE-M3，后端通过内部 HTTP 调用；避免数据出域 |

### 2.5 PPT 生成

| 决策项 | 决策结果 |
|--------|---------|
| 生成库 | **python-pptx** |
| 模板策略 | **固定模板**（编码内统一风格），二期支持多模板 |
| 页数范围 | **5-15 页** |
| 用户输入 | 用户可指定 **标题（必填）** 和主题要求（选填） |
| 执行方式 | **FastAPI BackgroundTasks**（异步，不阻塞 API） |
| 任务状态 | **持久化到数据库**（不依赖内存或 Redis） |
| 状态查询 | **前端轮询**（不引入 SSE） |
| 失败重试 | **最多重试 1 次** |
| 大纲审批流程 | **一期不做** |

### 2.6 API 规范

| 决策项 | 决策结果 |
|--------|---------|
| 统一响应格式 | `{ "code": 0, "message": "ok", "data": {} }` |
| 错误码范围 | `4xxxx`，前两位标识模块 |
| 模块错误码划分 | `40xxx` 通用、`41xxx` 认证、`42xxx` 文件、`43xxx` 聊天、`44xxx` PPT |
| 分页响应格式 | `{ "items": [], "total": int, "page": int, "page_size": int }` |
| 健康检查 | `GET /health` → `{ "status": "ok" }` |

### 2.7 技术规范

| 决策项 | 决策结果 |
|--------|---------|
| Python 时间处理 | 统一使用 `datetime.now(timezone.utc)` |
| 数据库时间字段 | `TIMESTAMPTZ` |
| 主键 | UUID |
| 扩展字段 | JSONB，统一命名 `metadata` |
| 删除策略 | **物理删除**（一期不实现软删除） |
| 审计日志 | **一期不实现** |
| 日志输出 | 应用日志输出到 **stdout**（Docker 日志驱动） |
| 配置加载 | **pydantic-settings** + `.env` 文件 |
| LLM 模型版本 | 通过环境变量 `LLM_MODEL` 配置，默认 `claude-sonnet-5` |
| Claude API 访问 | 通过环境变量配置 API Key 和 Base URL，企业需保证网络可达 |

---

## 3. 技术选型总表

| 层级 | 选型 | 说明 |
|------|------|------|
| 后端框架 | **FastAPI** | Python 3.12 |
| ORM | **SQLAlchemy 2.0** | 异步支持 |
| 数据库迁移 | **Alembic** | - |
| 数据库 | **PostgreSQL 16 + pgvector** | - |
| 缓存 | **Redis 7** | 可选基础设施，一期不强依赖；Docker Compose 保留 |
| 前端框架 | **React 18** | - |
| 前端语言 | **TypeScript** | - |
| 构建工具 | **Vite** | - |
| UI 组件库 | **Ant Design 5** | - |
| 状态管理 | **Zustand** | - |
| LLM | **Claude API** | 模型版本通过环境变量配置 |
| Embedding | **BGE-M3** | 本地部署（独立容器），1024 维，sentence-transformers |
| PDF 解析 | **PyMuPDF (fitz)** | - |
| DOCX 解析 | **python-docx** | - |
| PPT 生成 | **python-pptx** | 固定模板 |
| 容器编排 | **Docker Compose** | 服务：db / app / embedding |
| 存储方式 | **本地文件系统** | 开发期绑定 `uploads/` 和 `ppt_outputs/` |
| 挂载方式 | 开发期 **bind mount**；生产环境 **named volume** | - |
| 配置加载 | **pydantic-settings** | 通过 `.env` + 环境变量 |

### Docker Compose 服务构成

```yaml
services:
  db:         # PostgreSQL 16 + pgvector
  app:        # FastAPI 后端
  embedding:  # BGE-M3 embedding 服务（本地部署，避免数据出域）
```

- 前端不在 Docker Compose 中，开发期通过宿主机 Vite 本地启动。
- Redis：**一期不强依赖**，不在默认 Docker Compose 中，需要时（如限流、Celery）再加入。

---

## 4. 架构分层

```
api/v1/        ← 路由 + 参数校验 + 调用 Service
  services/    ← 业务流程编排（调用 Repository / LLM / Parser / FileService）
  repositories/ ← 数据访问封装（CRUD + pgvector 查询）
  database/    ← 模型、迁移、连接
```

- `llm/` — LLM Provider 接口 + Claude 实现
- `parsers/` — 文件解析器（PDF / DOCX / TXT）
- `core/` — 配置、JWT 工具、统一异常、日志

禁止跨层调用。

---

## 5. 二期规划（仅记录方向，不做详细设计）

以下内容确认在一期之后规划，不在本期工程初始化范围内：

| 方向 | 说明 |
|------|------|
| 钉钉内嵌免登 | 减少用户操作步骤 |
| XLSX 文件解析 | 扩展文件格式支持 |
| 多文件联合问答 | 跨文件上下文检索 |
| 全局知识库 | 企业级全局向量检索 |
| PPT 模板选择 | 多套模板 + 大纲编辑 |
| 消息队列 | Celery 替代 BackgroundTasks |
| 对象存储 | MinIO 或 OSS 替代本地文件系统 |
| 可选 embedding | 接入 Qwen / DeepSeek embedding API（如需切换外部服务） |
| 管理员后台 | 用户管理、任务监控 |

---

## 6. 暂不实现（明确排除）

以下内容一期不做，也不在二期规划中讨论：

- 密码注册 / 手机号登录
- 多 LLM Provider 切换
- 多模型选择 UI
- 微服务架构拆分
- 微前端架构
- 多租户商业化能力
- 部门级权限管理
- SSE / WebSocket 流式推送
- 软删除
- 审计日志表
- 请求链路追踪（APM）
- 文件 hash 去重
- 外部日志系统（ELK / Loki）
- 文件病毒扫描
- 文件自动过期清理
- Kafka / RabbitMQ 等消息中间件
- Redis（一期不强依赖，不作为默认基础设施）

---

## 7. 风险备忘

以下风险在架构评审中已识别，当前阶段接受，不阻塞工程初始化：

| 风险 | 影响 | 接受理由 |
|------|------|---------|
| BackgroundTasks 无持久化队列 | 进程重启导致 PPT 任务/文件解析丢失 | MVP 体量可接受，二期迁移 Celery |
| PDF 解析质量不稳定 | 影响 RAG 检索效果 | 一期只支持文本型 PDF，扫描件/复杂版式二期 |
| PPT 输出样式有限 | 用户可能不满意视觉质量 | 固定模板保底，二期优化样式 |
| BGE-M3 部署资源 | 本地 embedding 容器需要 CPU/内存 | 模型量化后 ≤ 2GB 内存可运行，开发机可承受 |
| 无流式输出 | 对话响应不够流畅 | MVP 阶段可接受，二期评估 SSE |

---

## 8. 生效说明

- 本文档自创建之日起生效，作为工程初始化的唯一依据。
- 所有设计文档中的待确认项以此为准，不再保留为开放问题。
- 后续修改需要团队评审并更新本文档。
- 工程初始化阶段严格遵循本文档范围，不扩大需求。
