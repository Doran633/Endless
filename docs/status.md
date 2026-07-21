# 项目状态

## 当前阶段

**架构冻结阶段已完成**，可进入工程初始化阶段。

## 当前工作范围更新

- 已创建 `mvp_decision.md` 作为工程初始化的唯一依据。
- 已清理所有设计文档中的待确认项，固化为决策结果。
- 下一步：创建 `backend/` 和 `frontend/` 工程代码。

## 已创建文档

- `requirements.md`
- `architecture.md`
- `architecture_review.md`
- `database_design.md`
- `module_design.md`
- `api_design.md`
- `development_plan.md`
- `mvp_decision.md` ← **新增，架构冻结决策记录**
- `status.md`

## 已确认决策（核心变更汇总）

| 决策项 | 决策结果 | 参考文档 |
|--------|---------|---------|
| 钉钉登录方式 | 扫码登录（Web 通用），内嵌免登二期 | mvp_decision.md 2.1 |
| JWT 策略 | access_token 24h + refresh_token 7d | mvp_decision.md 2.1 |
| 文件格式 | TXT、PDF、DOCX（上限 20MB） | mvp_decision.md 2.3 |
| 解析时机 | 上传后**异步解析**（BackgroundTask） | mvp_decision.md 2.3 |
| chunk | 512 tokens，overlap 64 | mvp_decision.md 2.4 |
| embedding | **BGE-M3（本地部署）**，1024 维，ivfflat | mvp_decision.md 2.4 |
| PPT 生成 | python-pptx，固定模板，5-15 页 | mvp_decision.md 2.5 |
| 任务执行 | FastAPI BackgroundTasks，任务状态持久化到数据库 | mvp_decision.md 2.5 |
| 前端轮询 | 不引入 SSE | mvp_decision.md 2.2 |
| 删除策略 | 物理删除（无软删除） | mvp_decision.md 2.7 |
| 错误码 | 4xxxx 格式，按模块分配区间 | mvp_decision.md 2.6 |
| 分页格式 | `{ items, total, page, page_size }` | mvp_decision.md 2.6 |
| Redis | 一期不强依赖，不在默认 Docker Compose 中 | mvp_decision.md 第 3 节 |
| 存储挂载 | 开发期 bind mount，生产 named volume | mvp_decision.md 第 3 节 |
| 配置加载 | pydantic-settings + .env | mvp_decision.md 第 3 节 |
| LLM 模型 | 通过环境变量配置，默认 claude-sonnet-5 | mvp_decision.md 2.7 |

## 已确认架构原则

- 前端不加入 Docker Compose，开发期通过宿主机 Vite 本地启动。
- 后端 Docker Compose 服务：`db`（PostgreSQL 16 + pgvector）、`app`（FastAPI）、`embedding`（BGE-M3）。
- 后端分层：`api → service → repository`，禁止跨层调用。
- 所有业务接口默认需要 JWT（登录接口除外）。
- 用户数据严格按 user_id 隔离。
- 所有设计文档中与此冲突的内容以 `mvp_decision.md` 为准。

## 下一步行动

启动工程初始化，按 `development_plan.md` 的阶段划分执行：

1. 创建 `backend/` 工程结构。
2. 创建 `frontend/` 工程结构。
3. 配置 Docker Compose。
4. 配置数据库和 Alembic 迁移。
5. 按阶段一至三逐步实现 MVP 功能。
