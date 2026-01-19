# MIRA - 敏捷任务管理系统

MIRA 是一个轻量级的类 JIRA 敏捷项目管理工具，专为小型团队设计。

## 功能特性

### 用户系统
- 用户注册与邮箱验证
- JWT 认证登录
- 密码重置
- 个人资料管理

### 项目管理
- 创建/编辑/归档项目
- 项目级权限控制 (Owner / Admin / Member)
- 成员邀请与角色管理

### Sprint 管理
- 可配置的 Sprint 周期（默认 2 周）
- Sprint 计划、启动、完成流程
- Sprint 看板视图

### 任务系统
- **任务类型层级**: Epic → Story → Task / Bug
- **任务字段**:
  - 标题、描述（富文本）
  - 状态: To Do / In Progress / In Review / Done
  - Story Points (1, 2, 3, 5, 8, 13, 21)
  - 优先级: Highest / High / Medium / Low / Lowest
  - 创建者、负责人 (Assignee)
  - 标签、截止日期
- **任务关系**: 父子关系、阻塞关系
- **协作功能**: 评论、附件上传、变更历史

### 看板 Dashboard
- 拖拽更改任务状态
- 按 Sprint / Assignee / 标签筛选
- 实时同步更新（WebSocket）

### 实时协作
- 任务变更即时推送
- 在线用户状态显示
- 评论实时更新

---

## 技术栈

### 后端
| 技术 | 用途 |
|------|------|
| Kotlin | 编程语言 |
| Spring Boot 3.x | Web 框架 |
| Spring Security | 认证授权 |
| PostgreSQL 15+ | 主数据库 |
| Redis | 缓存/会话/消息 |
| Spring WebSocket | 实时通信 |
| AWS S3 | 附件存储 |
| Flyway | 数据库迁移 |
| Springdoc OpenAPI | API 文档 |

### 前端
| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Ant Design | UI 组件库 |
| Zustand | 状态管理 |
| @hello-pangea/dnd | 拖拽功能 |
| SockJS + STOMP | WebSocket 客户端 |

### 部署
| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 本地开发编排 |
| AWS EC2/ECS | 应用部署 |
| AWS RDS | 托管 PostgreSQL |
| AWS ElastiCache | 托管 Redis |
| AWS S3 | 文件存储 |

---

## 快速开始

### 环境要求
- Docker & Docker Compose
- JDK 17+ (本地开发)
- Node.js 18+ (本地开发)

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repo-url>
   cd mira
   ```

2. **启动依赖服务**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **启动后端**
   ```bash
   cd backend
   cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
   # 编辑配置文件，设置数据库连接等
   ./gradlew bootRun --args='--spring.profiles.active=local'
   ```

4. **启动前端**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **访问应用**
   - 前端: http://localhost:5173
   - 后端 API: http://localhost:8080
   - API 文档: http://localhost:8080/swagger-ui.html

### Docker 一键启动

```bash
docker-compose up -d
```

访问 http://localhost:3000

---

## 项目结构

```
mira/
├── backend/                    # 后端服务
│   ├── src/main/kotlin/com/mira/
│   │   ├── MiraApplication.kt
│   │   ├── config/            # 配置类
│   │   ├── controller/        # REST 控制器
│   │   ├── service/           # 业务逻辑
│   │   ├── repository/        # 数据访问层
│   │   ├── model/             # 实体类
│   │   ├── dto/               # 数据传输对象
│   │   ├── security/          # 认证授权
│   │   └── websocket/         # WebSocket 处理
│   ├── src/main/resources/
│   │   ├── application.yml    # 主配置
│   │   └── db/migration/      # Flyway 迁移脚本
│   ├── build.gradle.kts
│   └── Dockerfile
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # 通用组件
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── stores/            # Zustand 状态
│   │   ├── services/          # API 服务
│   │   ├── types/             # TypeScript 类型
│   │   └── utils/             # 工具函数
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml          # 本地开发
├── docker-compose.prod.yml     # 生产部署
└── README.md
```

---

## API 概览

### 认证
| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/forgot-password` | 忘记密码 |

### 项目
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/{key}` | 获取项目详情 |
| PUT | `/api/projects/{key}` | 更新项目 |
| POST | `/api/projects/{key}/members` | 添加成员 |

### Sprint
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects/{key}/sprints` | 获取 Sprint 列表 |
| POST | `/api/projects/{key}/sprints` | 创建 Sprint |
| POST | `/api/projects/{key}/sprints/{id}/start` | 启动 Sprint |
| POST | `/api/projects/{key}/sprints/{id}/complete` | 完成 Sprint |

### Issue
| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/projects/{key}/issues` | 获取任务列表 |
| POST | `/api/projects/{key}/issues` | 创建任务 |
| GET | `/api/projects/{key}/issues/{issueKey}` | 获取任务详情 |
| PUT | `/api/projects/{key}/issues/{issueKey}` | 更新任务 |
| POST | `/api/projects/{key}/issues/{issueKey}/comments` | 添加评论 |
| POST | `/api/projects/{key}/issues/{issueKey}/attachments` | 上传附件 |

### WebSocket
- 连接端点: `/ws`
- 订阅项目更新: `/topic/project/{key}`

完整 API 文档请访问: http://localhost:8080/swagger-ui.html

---

## 部署指南

### AWS 部署架构

```
                    ┌─────────────┐
                    │ CloudFront  │ (可选CDN)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │
                    └──────┬──────┘
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐┌──────▼──────┐┌──────▼──────┐
     │   ECS/EC2   ││   ECS/EC2   ││   ECS/EC2   │
     │  (Backend)  ││  (Backend)  ││  (Frontend) │
     └──────┬──────┘└──────┬──────┘└─────────────┘
            │              │
     ┌──────▼──────────────▼──────┐
     │        ElastiCache         │
     │          (Redis)           │
     └────────────────────────────┘
            │
     ┌──────▼──────────────────────┐
     │           RDS               │
     │       (PostgreSQL)          │
     └─────────────────────────────┘
            │
     ┌──────▼──────────────────────┐
     │            S3               │
     │     (附件存储)               │
     └─────────────────────────────┘
```

### 部署步骤

1. **创建 AWS 资源**
   - RDS PostgreSQL 实例
   - ElastiCache Redis 集群
   - S3 存储桶
   - ECR 镜像仓库

2. **构建 Docker 镜像**
   ```bash
   # 后端
   cd backend
   docker build -t mira-backend .

   # 前端
   cd frontend
   docker build -t mira-frontend .
   ```

3. **推送到 ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker tag mira-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/mira-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/mira-backend:latest
   ```

4. **配置环境变量**
   ```yaml
   # 生产环境配置
   SPRING_DATASOURCE_URL: jdbc:postgresql://<rds-endpoint>:5432/mira
   SPRING_REDIS_HOST: <elasticache-endpoint>
   AWS_S3_BUCKET: mira-attachments
   JWT_SECRET: <your-secret-key>
   ```

5. **部署到 ECS/EC2**
   - 使用 `docker-compose.prod.yml` 或 ECS Task Definition

---

## 开发指南

### 运行测试

```bash
# 后端测试
cd backend
./gradlew test

# 前端测试
cd frontend
npm test
```

### 代码规范
- 后端: Kotlin 官方代码风格 + ktlint
- 前端: ESLint + Prettier

### 提交规范
使用 Conventional Commits:
- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关

---

## 实施路线图

- [x] 项目规划
- [ ] **Phase 1**: 基础设施搭建
- [ ] **Phase 2**: 用户认证系统
- [ ] **Phase 3**: 项目管理功能
- [ ] **Phase 4**: Sprint 和任务系统
- [ ] **Phase 5**: 看板和拖拽
- [ ] **Phase 6**: 实时协作
- [ ] **Phase 7**: 部署上线

---

## License

MIT
