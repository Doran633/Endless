# API 设计

## 1. 设计原则

- API 路径统一使用 `/api/v1` 前缀。
- 所有业务接口默认需要 JWT，登录接口除外。
- 响应结构统一。
- API 不暴露内部存储路径。
- 文件问答必须显式绑定 `file_id` 或绑定到含 `file_id` 的会话。

## 2. 统一响应格式

成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败响应：

```json
{
  "code": 40001,
  "message": "error message",
  "data": null
}
```

### 2.1 决策结果

错误码范围：`4xxxx`，前两位标识模块：
- `40xxx`：通用错误
- `41xxx`：认证错误
- `42xxx`：文件错误
- `43xxx`：聊天错误
- `44xxx`：PPT 错误

分页响应格式：
```json
{
  "items": [],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

（详见 `mvp_decision.md` 第 2.6 节）

## 3. 认证

### 3.1 钉钉登录

`POST /api/v1/auth/dingtalk/login`

请求：

```json
{
  "auth_code": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "access_token": "string",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string"
    }
  }
}
```

决策结果：

- 钉钉 auth code 字段名称：后端接口接收字段名为 `auth_code`，与钉钉开放平台文档对齐。
- JWT access_token 有效期：**24 小时**。
- refresh_token：**提供**，有效期 **7 天**。

（详见 `mvp_decision.md` 第 2.1 节）

### 3.2 当前用户

`GET /api/v1/auth/me`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "name": "string",
    "avatar_url": "string"
  }
}
```

## 4. 健康检查

`GET /health`

响应：

```json
{
  "status": "ok"
}
```

## 5. 文件接口

### 5.1 上传文件

`POST /api/v1/files`

认证：需要 JWT。

请求类型：`multipart/form-data`

字段：

- `file`：上传文件。

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "original_name": "string",
    "status": "uploaded"
  }
}
```

说明：

- 上传后可以同步解析，也可以立即创建文件记录后由后台解析。
- 一期建议文件解析状态写入 `files.status`。

说明：

- 上传后**后台异步解析**，解析状态通过 `files.status` 跟踪（uploaded → processing → ready / failed）。
- 单文件大小上限：**20 MB**。
- 支持格式：**TXT、PDF、DOCX**。

（详见 `mvp_decision.md` 第 2.3 节）

### 5.2 查询文件列表

`GET /api/v1/files`

认证：需要 JWT。

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "uuid",
        "original_name": "string",
        "status": "ready",
        "created_at": "2026-07-21T00:00:00Z"
      }
    ]
  }
}
```

### 5.3 查询文件详情

`GET /api/v1/files/{file_id}`

认证：需要 JWT。

权限：

- 只能查询当前用户自己的文件。

### 5.4 删除文件

`DELETE /api/v1/files/{file_id}`

认证：需要 JWT。

权限：只能删除当前用户自己的文件。

行为：

- 同步删除关联的 `file_chunks`。
- 同步删除关联的 PPT 生成结果。
- 保留该文件相关的聊天记录（消息内容保留，但关联文件标记为已删除）。

## 6. 聊天接口

### 6.1 创建普通会话

`POST /api/v1/chat/sessions`

请求：

```json
{
  "mode": "general",
  "file_id": null
}
```

### 6.2 创建文件问答会话

`POST /api/v1/chat/sessions`

请求：

```json
{
  "mode": "file",
  "file_id": "uuid"
}
```

约束：

- `mode=file` 时 `file_id` 必填。
- `file_id` 必须属于当前用户。
- 一期一个会话只绑定一个文件。

### 6.3 发送消息

`POST /api/v1/chat/sessions/{session_id}/messages`

请求：

```json
{
  "content": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "user_message": {
      "id": "uuid",
      "role": "user",
      "content": "string"
    },
    "assistant_message": {
      "id": "uuid",
      "role": "assistant",
      "content": "string"
    }
  }
}
```

说明：

- 普通会话直接调用 LLM。
- 文件会话必须按会话绑定的 `file_id` 检索 chunk。

### 6.4 查询会话消息

`GET /api/v1/chat/sessions/{session_id}/messages`

认证：需要 JWT。

权限：

- 只能查询当前用户自己的会话。

## 7. PPT 接口

### 7.1 创建 PPT 生成任务

`POST /api/v1/ppt/jobs`

请求：

```json
{
  "file_id": "uuid",
  "title": "string"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "job_id": "uuid",
    "status": "pending"
  }
}
```

约束：

- `file_id` 必须属于当前用户。
- 文件状态必须为 `ready`。
- 一期不做大纲审批。

### 7.2 查询 PPT 任务状态

`GET /api/v1/ppt/jobs/{job_id}`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "uuid",
    "status": "running",
    "progress": 50,
    "error_message": null
  }
}
```

说明：

- 一期前端使用轮询。
- 不引入 SSE。

### 7.3 下载 PPT

`GET /api/v1/ppt/jobs/{job_id}/download`

约束：

- 任务必须属于当前用户。
- 任务状态必须为 `succeeded`。

## 8. 权限规则

所有接口必须基于当前用户过滤数据：

- 文件按 `user_id` 过滤。
- 会话按 `user_id` 过滤。
- 消息按 `user_id` 或会话所属用户过滤。
- PPT 任务按 `user_id` 过滤。

## 9. 说明

所有此前待确认项已在 `mvp_decision.md` 及各节中固化，此处不再保留为开放问题。

已落地的决策要点：
- 错误码采用 `4xxxx` 格式，按模块分配区间。
- 分页响应 `{ "items", "total", "page", "page_size" }`。
- 文件删除接口一期实现，同步清理关联数据。
- 上传后同步解析。
- PPT 标题为必填字段。
