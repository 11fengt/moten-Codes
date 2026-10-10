# API 文档

本文件对应当前 `packages/server/src` 实现。示例 ID、日期、用户名与 token 均为说明占位值，不是可用凭据。

## 通用约定

- Base URL：`http://localhost:8082`。
- JSON 请求：`Content-Type: application/json`。
- 鉴权：`Authorization: Bearer <token>`，不是 Cookie 会话。
- 正常业务响应：`{ message, data }`；业务错误通常为 `{ message }`。
- Express 默认 JSON 解析 / 请求体超限错误未完全统一为 JSON。
- JSON 请求体限制 5 MB。页面 ID 为正安全整数。
- 页面接口需要登录，当前没有按用户或角色隔离页面数据。

## 1. 服务健康检查

### `GET /api/health`

公开访问，HTTP 200：

```json
{ "message": "服务运行正常" }
```

此接口只说明 HTTP 服务运行，不执行数据库查询。

### `GET /api/health/db`

需要鉴权。查询 `pages` 总数，HTTP 200：

```json
{
  "message": "数据库连接成功",
  "data": { "pageCount": 3 }
}
```

鉴权失败 401；查询失败 500。认证中间件也会查询 `users`。

## 2. 注册

### `POST /api/auth/register`

公开访问，每 IP 每分钟最多 5 次请求。

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `username` | string | trim 后满足 `[A-Za-z0-9_]{3,32}` |
| `password` | string | 长度 12～128；不会自动 trim |

```json
{ "username": "demo_user", "password": "replace-with-your-local-password" }
```

HTTP 201：

```json
{
  "message": "注册成功，请登录",
  "data": {
    "user": { "id": 1, "username": "demo_user", "role": "editor" }
  }
}
```

角色由后端固定为 `editor`，提交额外角色字段不会赋予管理员身份。注册不会签发 token，需要单独登录。

| 状态码 | 情况 |
| --- | --- |
| 400 | 用户名/密码类型或格式不合法 |
| 409 | 用户名已存在 |
| 429 | 注册频率超限 |
| 500 | 密码处理或数据库操作失败 |

## 3. 登录

### `POST /api/auth/login`

公开访问，每 IP 每分钟最多 10 次请求。请求字段和规则与注册一致。

```json
{ "username": "demo_user", "password": "replace-with-your-local-password" }
```

HTTP 200：

```json
{
  "message": "登录成功",
  "data": {
    "token": "<JWT_TOKEN>",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": { "id": 1, "username": "demo_user", "role": "editor" }
  }
}
```

使用 HS256，token 有效期 2 小时。账号不存在或密码错误均返回 401 `账号或密码错误`，格式错误为 400，限流为 429，服务错误为 500。

服务端仅保存 scrypt 哈希；原始密码不写入 `users`。JWT 密钥由本机 `.env` 提供，至少 32 个 UTF-8 字节。

## 4. 当前用户

### `GET /api/auth/me`

需要鉴权，HTTP 200：

```json
{
  "message": "当前用户查询成功",
  "data": {
    "user": { "id": 1, "username": "demo_user", "role": "editor" }
  }
}
```

认证时按 JWT 的用户 ID 查询数据库，返回当前数据库身份；不会信任客户端自行提供的 role。缺少 / 无效 / 过期 token，或对应用户不存在时返回 401，并设置 `WWW-Authenticate: Bearer`。认证数据库查询失败返回 500。

当前没有 refresh、revoke 或服务端 logout 接口。前端退出通过删除本地会话状态实现。

## 5. 创建页面草稿

### `POST /api/pages`

需要鉴权。请求体直接为 `SavedPage`，示例：

```json
{
  "version": 1,
  "pageName": "我的欢迎页",
  "content": {
    "block": [
      {
        "id": "title-01",
        "code": "text",
        "name": "文本",
        "icon": "text",
        "formData": {
          "text": { "desktop": "欢迎来到我的主页", "mobile": "欢迎访问" },
          "fontSize": { "desktop": 28, "mobile": 20 },
          "color": { "desktop": "#1f2329", "mobile": "#1f2329" }
        }
      }
    ],
    "page": { "background": { "desktop": "#ffffff", "mobile": "#ffffff" } }
  }
}
```

也可以提交 `examples/welcome-page.json` 的完整内容。HTTP 201：

```json
{
  "message": "页面创建成功",
  "data": { "id": 8, "pageName": "我的欢迎页" }
}
```

服务端先复用 `parsePage` 验证，再保存 `name` 与完整 JSON `draft_content`。空组件数组允许保存；页面名称不能为空。

典型文档错误为 HTTP 400：

```json
{ "message": "页面文档版本或结构不正确" }
```

属性错误会进一步包含节点位置和错误描述。重复节点 ID、未知物料、缺少双端属性、错误的容器层级也会被拒绝。查询/写入失败返回 500。

## 6. 分页列表

### `GET /api/pages?page=1&size=10`

需要鉴权。

| 参数 | 默认值 | 规则 |
| --- | --- | --- |
| `page` | 1 | 单个参数，可转换为正安全整数 |
| `size` | 10 | 单个参数，整数 1～100 |

偏移量 `(page - 1) * size` 也必须是安全整数。列表按 `id DESC` 排序，列表不会返回完整文档，需另调详情接口。

HTTP 200：

```json
{
  "message": "页面列表查询成功",
  "data": {
    "list": [
      {
        "id": 8,
        "name": "我的欢迎页",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 10
  }
}
```

日期示例仅展示序列化形式，实际时间与数据库/运行环境有关。空结果时 `list` 为 `[]`。非法分页返回 400，数据库查询失败返回 500。

## 7. 页面详情

### `GET /api/pages/:id`

需要鉴权。HTTP 200：

```json
{
  "message": "页面查询成功",
  "data": {
    "id": 8,
    "document": {
      "version": 1,
      "pageName": "我的欢迎页",
      "content": {
        "block": [],
        "page": { "background": { "desktop": "#ffffff", "mobile": "#ffffff" } }
      }
    }
  }
}
```

`document` 来自 MySQL JSON 列。编辑器收到详情后再次调用共享解析器，验证文档再写入状态。

非法 ID 返回 400；无记录返回 404 `{ "message": "页面不存在" }`；数据库错误返回 500。

## 8. 更新页面

### `PUT /api/pages/:id`

需要鉴权。请求体与创建相同，提交完整 `SavedPage`，不是部分字段 PATCH。

HTTP 200：

```json
{
  "message": "页面更新成功",
  "data": { "id": 8, "pageName": "修改后的页面" }
}
```

非法 ID 或文档为 400，无匹配记录为 404，数据库错误为 500。当前没有乐观锁 / 版本冲突检测，多个编辑者保存同一页面时会覆盖。

## 9. 删除页面

### `DELETE /api/pages/:id`

需要鉴权，无请求体。HTTP 200：

```json
{ "message": "页面删除成功", "data": { "id": 8 } }
```

非法 ID 为 400，无记录为 404，数据库错误为 500。接口执行实际删除，当前没有回收站或恢复接口。

## 10. 调试接收接口

### `POST /api/pages/receive`

需要鉴权。至少提交非空 `pageName` 字符串及数组 `content.block`：

```json
{ "pageName": "调试页面", "content": { "block": [] } }
```

HTTP 200：

```json
{
  "message": "页面数据接收成功",
  "data": { "pageName": "调试页面", "rootBlockCount": 0 }
}
```

仅用于验证数据传输、输出根节点数量，不调用完整文档校验、不写数据库。创建页面应使用 `POST /api/pages`。

## PowerShell 调用示例

先完成数据库和服务端配置，在项目根目录运行。示例会提示输入本机账号密码，密码不硬编码在脚本中。

```powershell
$apiBase = 'http://localhost:8082'
$credential = Get-Credential -Message '输入已注册的本地测试账号'
$loginBody = @{
  username = $credential.UserName
  password = $credential.GetNetworkCredential().Password
} | ConvertTo-Json

$loginResult = Invoke-RestMethod -Uri "$apiBase/api/auth/login" `
  -Method Post -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($loginBody))
$authHeaders = @{ Authorization = "Bearer $($loginResult.data.token)" }

Invoke-RestMethod -Uri "$apiBase/api/auth/me" -Headers $authHeaders

$pageJson = Get-Content -LiteralPath 'examples/welcome-page.json' -Raw -Encoding UTF8
$created = Invoke-RestMethod -Uri "$apiBase/api/pages" -Method Post `
  -Headers $authHeaders -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($pageJson))
$pageId = $created.data.id

Invoke-RestMethod -Uri "$apiBase/api/pages?page=1&size=10" -Headers $authHeaders
Invoke-RestMethod -Uri "$apiBase/api/pages/$pageId" -Headers $authHeaders

# 完整文档更新示例；按需修改 pageJson 后提交
Invoke-RestMethod -Uri "$apiBase/api/pages/$pageId" -Method Put `
  -Headers $authHeaders -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($pageJson))

# 删除会移除刚创建的测试页面，需要时再执行：
# Invoke-RestMethod -Uri "$apiBase/api/pages/$pageId" -Method Delete -Headers $authHeaders
```

## 已知接口边界

- 页面表没有 owner 字段，鉴权只限制是否登录，没有实现按用户或角色的资源授权。
- 登录和注册限流使用当前进程内存状态，不是分布式限流。
- CORS 当前使用 `cors()` 默认设置；部署需要按实际访问来源配置。
- 无公共发布 / 图片上传 / 全文搜索 / 页面历史 / Refresh Token 接口。
- 当前测试模拟数据库，真实 MySQL 的连通性、索引和持久化仍需本机验证。
