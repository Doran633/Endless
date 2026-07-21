# 数据库设计

## 1. 设计目标

数据库设计服务于一期 MVP，优先支持：

- 钉钉用户登录。
- 单文件上传和解析。
- 单文件问答。
- 聊天记录保存。
- PPT 生成任务持久化。
- 后续替换任务执行器、存储后端、向量数据库时降低改动范围。

## 2. 通用规范

- 主键统一使用 UUID。
- 时间字段使用 `TIMESTAMPTZ`。
- 每张业务表必须包含 `created_at`、`updated_at`。
- Python 侧使用 timezone-aware UTC 时间。
- 扩展字段统一命名为 `metadata`，类型为 JSONB。
- 删除策略一期默认软删除仅在需要时使用，未确认前不强制每张表加 `deleted_at`。

决策结果：

- 软删除：**一期不实现**，所有删除操作为物理删除。
- 审计日志表：**一期不创建**。

（详见 `mvp_decision.md` 第 2.7 节）

## 3. 表清单

一期建议最小表：

- `users`
- `files`
- `file_chunks`
- `chat_sessions`
- `chat_messages`
- `ppt_jobs`

## 4. users

保存本地用户和钉钉身份映射。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 本地用户 ID |
| corp_id | VARCHAR | 钉钉企业 ID，待钉钉字段确认 |
| dingtalk_user_id | VARCHAR | 钉钉用户 ID |
| union_id | VARCHAR NULL | 钉钉 union id，是否必有待确认 |
| name | VARCHAR | 用户姓名 |
| avatar_url | TEXT NULL | 头像 |
| department_ids | JSONB NULL | 部门 ID 列表 |
| metadata | JSONB | 钉钉扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `(corp_id, dingtalk_user_id)` 唯一索引。
- `created_at DESC` 索引。

不包含：

- `password_hash`
- 注册相关字段

## 5. files

保存用户上传文件的元数据。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 文件 ID |
| user_id | UUID FK | 上传用户 |
| original_name | VARCHAR | 原始文件名 |
| storage_path | TEXT | 本地存储路径 |
| mime_type | VARCHAR NULL | MIME 类型 |
| extension | VARCHAR | 文件扩展名 |
| size_bytes | BIGINT | 文件大小 |
| status | VARCHAR | uploaded / parsing / ready / failed |
| parse_error | TEXT NULL | 解析失败原因 |
| metadata | JSONB | 扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `user_id` 索引。
- `status` 索引。
- `created_at DESC` 索引。

决策结果：

- 支持格式：**TXT、PDF、DOCX**。
- 单文件大小上限：**20 MB**。
- 文件 hash 去重：**一期不做**。

（详见 `mvp_decision.md` 第 2.3 节）

## 6. file_chunks

保存文件切分后的文本 chunk 和 embedding。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | chunk ID |
| file_id | UUID FK | 所属文件 |
| user_id | UUID FK | 冗余用户 ID，用于权限过滤 |
| chunk_index | INTEGER | chunk 顺序 |
| content | TEXT | chunk 文本 |
| embedding | VECTOR | 向量，维度待确认 |
| token_count | INTEGER NULL | token 数 |
| metadata | JSONB | 页码、段落等扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `file_id` 索引。
- `(file_id, chunk_index)` 唯一索引。
- `user_id` 索引。
- `embedding` 向量索引待数据规模确认。

关键约束：

- 所有检索必须带 `file_id`。
- 不做全局向量检索。

决策结果：

- embedding 维度：**1536**（text-embedding-3-small）。
- 向量索引：**ivfflat**，lists=100。
- chunk 大小：**512 tokens**，overlap：**64 tokens**。

（详见 `mvp_decision.md` 第 2.4 节）

## 7. chat_sessions

保存聊天会话。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 会话 ID |
| user_id | UUID FK | 所属用户 |
| file_id | UUID FK NULL | 绑定文件；普通对话可为空 |
| title | VARCHAR | 会话标题 |
| mode | VARCHAR | general / file |
| metadata | JSONB | 扩展信息 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `user_id` 索引。
- `file_id` 索引。
- `created_at DESC` 索引。

设计决策：

- 文件问答会话绑定一个 `file_id`。
- 一期不支持一个会话绑定多个文件。

## 8. chat_messages

保存聊天消息。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 消息 ID |
| session_id | UUID FK | 会话 ID |
| user_id | UUID FK | 所属用户 |
| role | VARCHAR | user / assistant / system |
| content | TEXT | 消息内容 |
| metadata | JSONB | 引用 chunk、token 用量等 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `session_id` 索引。
- `user_id` 索引。
- `created_at` 索引。

## 9. ppt_jobs

保存 PPT 生成任务。

字段建议：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | UUID PK | 任务 ID |
| user_id | UUID FK | 所属用户 |
| file_id | UUID FK | 来源文件 |
| status | VARCHAR | pending / running / succeeded / failed |
| progress | INTEGER | 0-100 |
| title | VARCHAR NULL | PPT 标题 |
| output_path | TEXT NULL | 生成文件路径 |
| error_message | TEXT NULL | 失败原因 |
| metadata | JSONB | 页数、模板、生成参数 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

约束与索引：

- `id` 主键。
- `user_id` 索引。
- `file_id` 索引。
- `status` 索引。
- `created_at DESC` 索引。

设计决策：

- PPT 任务状态必须持久化。
- 一期执行器使用 FastAPI BackgroundTasks。
- 后续可迁移 Celery，但不改变表和 API 语义。

## 10. 关系概览

```text
users 1 -> N files
users 1 -> N chat_sessions
users 1 -> N chat_messages
users 1 -> N ppt_jobs

files 1 -> N file_chunks
files 1 -> N chat_sessions
files 1 -> N ppt_jobs

chat_sessions 1 -> N chat_messages
```

## 11. 说明

所有此前待确认项已在 `mvp_decision.md` 中固化，此处不再保留为开放问题。

已落地的决策要点：
- 所有核心表不做软删除（物理删除）。
- 不创建审计日志表。
- 一期文件格式：TXT、PDF、DOCX，上限 20MB。
- embedding：BGE-M3，1024 维，ivfflat 索引。
- chunk：512 tokens，overlap 64 tokens。
- PPT 模板：固定模板（编码内统一风格）。
