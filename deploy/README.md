# MIRA AWS Lightsail 部署指南

极简部署方案，适合2人小团队使用。预估成本：**$10-12/月**

## 架构

```
[用户] → Lightsail 静态IP → Lightsail 实例 ($10/月)
                            ┌─────────────────────────────┐
                            │  Docker Compose             │
                            │  ┌─────────┐ ┌─────────┐   │
                            │  │ Nginx   │ │ Backend │   │
                            │  │ :80/443 │→│ :8080   │   │
                            │  └─────────┘ └────┬────┘   │
                            │       ↓           ↓        │
                            │  ┌─────────┐ ┌─────────┐   │
                            │  │PostgreSQL│ │  Redis  │   │
                            │  │  :5432  │ │  :6379  │   │
                            │  └─────────┘ └─────────┘   │
                            │  [40GB SSD - 已包含]        │
                            └─────────────────────────────┘
```

## 快速开始

### 1. 创建 Lightsail 实例

1. 登录 AWS Console → 搜索 "Lightsail"
2. 创建实例:
   - **区域**: ap-northeast-1 (东京) 或其他靠近你的区域
   - **平台**: Linux/Unix
   - **蓝图**: OS Only → Amazon Linux 2023
   - **套餐**: $10/月 (2GB RAM, 1 vCPU, 40GB SSD)
   - **名称**: mira-server

3. 配置防火墙 (网络 → 添加规则):
   - HTTP (80)
   - HTTPS (443)
   - Custom TCP 3000 (临时，用于IP访问)

4. 创建并附加静态IP

### 2. 服务器初始化

SSH 连接到服务器后运行：

```bash
# 下载并运行初始化脚本
curl -sSL https://raw.githubusercontent.com/<your-repo>/main/deploy/lightsail-setup.sh | bash

# 退出并重新连接 (使docker组生效)
exit
```

### 3. 部署应用

```bash
# 克隆代码
git clone <your-repo-url> ~/mira
cd ~/mira

# 运行部署脚本
chmod +x deploy/*.sh
./deploy/deploy.sh

# 或者手动部署
docker compose --profile full up -d
```

### 4. 访问验证

访问 `http://<静态IP>:3000` 验证:
- [ ] 页面加载正常
- [ ] 注册/登录正常
- [ ] 创建项目正常
- [ ] 看板拖拽正常

## 配置选项

### 使用域名 (推荐)

```bash
# 1. 将域名A记录指向静态IP

# 2. 部署时指定域名
./deploy/deploy.sh --domain yourdomain.com

# 3. 配置SSL
sudo dnf install certbot -y
docker compose --profile full down
sudo certbot certonly --standalone -d yourdomain.com
# 然后使用 nginx-ssl.conf 配置
```

### 自定义JWT密钥

```bash
./deploy/deploy.sh --jwt-secret "your-secure-secret-key"
```

### 更新部署

```bash
./deploy/deploy.sh --pull
```

## 备份

### 手动备份

```bash
./deploy/backup.sh
```

备份存储在 `~/mira-backups/`

### 使用 Lightsail 快照

推荐方式：AWS Console → Lightsail → 实例 → 快照 → 创建快照

## 文件说明

| 文件 | 用途 |
|------|------|
| `lightsail-setup.sh` | 服务器初始化脚本 (安装Docker等) |
| `deploy.sh` | 应用部署脚本 |
| `backup.sh` | 数据库备份脚本 |
| `nginx-ssl.conf` | HTTPS Nginx配置模板 |

## 常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
docker compose logs -f backend  # 只看后端日志

# 重启服务
docker compose --profile full restart

# 停止服务
docker compose --profile full down

# 更新并重启
git pull && docker compose --profile full up -d --build
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker compose logs backend
docker compose logs postgres
```

### 数据库连接失败

```bash
# 检查postgres是否健康
docker exec mira-postgres pg_isready -U mira
```

### WebSocket连接失败

检查 `ALLOWED_ORIGINS` 环境变量是否包含正确的访问地址。

## 成本明细

| 项目 | 费用 |
|------|------|
| Lightsail 实例 (2GB) | $10/月 |
| 静态IP | 免费 (绑定实例时) |
| 快照备份 (可选) | ~$0.05/GB |
| **总计** | **~$10-12/月** |
