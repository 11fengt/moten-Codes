# Ubuntu 云服务器部署（Docker Compose）

适用：用于演示编辑器、登录、页面保存的单台 Linux 服务器。建议至少 2 核、2 GB 内存、2 GB Swap、10 GB 可用磁盘。Docker、Compose 与 Buildx 应已安装。使用 Ubuntu 软件源的安装方式时，可执行 `sudo apt install -y docker.io docker-compose-v2 docker-buildx git curl`。所有 Linux 命令都在服务器的项目根目录执行。

部署服务：Nginx 提供编辑器静态页面和 `/api/` 反向代理，Node.js 运行 Express，MySQL 8.4 保存用户和页面。独立 JSON 预览应用不包含在这套部署中；编辑器自带的预览路由仍可使用。

## 1. 获取项目

```bash
cd ~
git clone https://github.com/11fengt/moten-Codes.git
cd moten-Codes
```

如果已有此目录，先检查 `git status`，确认无本机代码改动，再进入目录执行 `git pull --ff-only`，不要重复克隆或直接覆盖旧目录。

## 2. 创建服务器配置

```bash
bash deploy/setup.sh
```

脚本在项目根目录生成权限为 `600` 的 `.env`：两个数据库密码与 JWT 密钥独立随机生成，不在终端输出，重复执行会保留原文件。这里使用 Compose 注入环境变量，不需要另建 `packages/server/.env`。实际配置文件已被 Git 和 Docker 构建上下文忽略。

不要将 `.env` 的内容截图、提交或发给他人。备份该文件时，按密码文件管理。

## 3. 构建并启动

```bash
# 小内存机器先逐个构建，完成后再启动数据库和应用。
sudo docker compose build server
sudo docker compose build web
sudo docker compose up -d --wait --wait-timeout 300
sudo docker compose ps
curl -f http://127.0.0.1:8080/api/health
curl -I http://127.0.0.1:8080/login
```

首次构建会从 Docker Hub 获取基础镜像，并安装 npm 依赖，需要可用的网络连接。构建失败时保留错误输出，不要把下载超时当成业务代码错误。前端构建步骤限制 Node.js 堆内存为 768 MB，生产镜像只提供构建后的静态文件。服务器上无须另装 Node.js 或 MySQL。

`db` 和 `server` 应显示健康；健康检查分别验证数据库中已存在业务表、API 可响应。HTTP `/api/health` 本身不查询数据库；登录后可使用 `/api/health/db` 做进一步检查。

## 4. 在自己电脑浏览器验收

默认只监听服务器本机 `127.0.0.1:8080`。先在自己的 Windows PowerShell 建立 SSH 隧道：

```powershell
# 把占位内容替换为腾讯云控制台显示的公网 IP。
ssh -L 18080:127.0.0.1:8080 ubuntu@你的服务器公网IP
```

保持这个窗口打开，在本机浏览器访问 `http://localhost:18080`。SSH 使用你自己的服务器登录方式；不需要向他人提供密码。云安全组只需允许你连接 SSH，无须开放 8080、8082 或 3306。

验收流程：注册一个演示账号（密码 12～128 位）→ 登录 → 新建页面并拖入组件 → 保存数据库草稿 → 查看列表并重新编辑 → 退出并重新登录，确认数据仍存在。刷新 `/login`、`/pages` 等路由也应能正常显示。

## 5. 提供面试演示地址

SSH 隧道地址只供自己验收，面试官无法用这个 localhost 地址访问。

对外展示时应为入口配置域名与 HTTPS。推荐保持当前本机监听，在宿主机上另设 HTTPS 入口并反向代理到 `http://127.0.0.1:8080`；这部分的域名、证书及云安全组需按实际环境配置，并未由本仓库自动完成。若该入口负责转发真实 IP，需要同时调整可信代理配置；当前部署入口只信任紧邻的单个 Nginx，默认按直接访问此 Nginx 的客户端限流。

如果仅需临时通过公网 IP 检查页面是否可达，可以在根目录 `.env` 中改为 `HTTP_BIND=0.0.0.0`、`HTTP_PORT=80`，然后执行 `sudo docker compose up -d web`，并在腾讯云安全组放行 TCP 80。此时地址为 `http://公网IP`，属于明文 HTTP；在配置 HTTPS 前，勿输入真实个人密码或敏感资料。

当前应用所有登录账号共享页面池，且开放注册。演示环境只放示例内容；不要把它当成具备用户数据隔离的正式业务系统。编辑器“发布”按钮仍表示保存草稿，不会生成独立公开页面。

## 更新、日志和数据

更新前保留 `.env` 和数据库备份，再执行：

```bash
git pull --ff-only
sudo docker compose build server
sudo docker compose build web
sudo docker compose up -d --wait --wait-timeout 300
```

正常更新仅重建应用镜像，不删除 MySQL 数据。数据库保存在命名卷 `moten-codes_mysql_data` 中；SQL 初始化文件只在空数据卷首次启动时执行。后续修改数据库密码、表结构不会因编辑 `.env` 或 SQL 自动生效，需要相应数据库操作或迁移。

```bash
# 查看状态和最近日志（分享前检查是否含业务数据）
sudo docker compose ps
sudo docker compose logs --tail=100 server db web

# 停止整套应用，保留数据库卷
sudo docker compose down

# 重启应用
sudo docker compose up -d
```

不要使用 `docker compose down -v` 或清理数据库卷的命令；这会删除数据。日志已限制为每服务最多 3 份、每份 10 MB。

数据库备份（输出到当前服务器目录，不上传仓库）：

```bash
umask 077
sudo docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --no-tablespaces -u "$MYSQL_USER" "$MYSQL_DATABASE"' > "moten-backup-$(date +%F-%H%M%S).sql"
```

应另存一份到服务器外，并实际验证恢复流程；只留在同一台服务器上不能防止实例到期释放造成的数据丢失。

## 已做与待做的验证

部署文件准备时检查了配置关系，编辑器生产构建通过，并实际运行部署专用 Node.js 入口，验证了健康检查、页面接口鉴权、代理后按客户端 IP 分别限流。编写环境没有 Docker 引擎，未在本机执行 Compose 解析、容器构建或真实 MySQL 联调。首次在服务器启动时，仍需按上述流程验证配置、镜像下载、构建、初始化、注册登录、草稿持久化和重启后的数据保留。

参考：[Docker Compose 启动顺序](https://docs.docker.com/compose/how-tos/startup-order/)、[MySQL 官方镜像](https://hub.docker.com/_/mysql)、[Nginx 代理配置](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)。
