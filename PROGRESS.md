# MIRA 项目开发进度记录

**最后更新**: 2026-01-17

## 项目概述

MIRA 是一个类 JIRA 的敏捷任务管理工具，支持小型团队（<20人）使用。

## 技术栈

### 后端
- **语言/框架**: Kotlin + Spring Boot 3.x
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7
- **实时通信**: Spring WebSocket + STOMP
- **认证**: Spring Security + JWT
- **文件存储**: 本地存储（开发）/ AWS S3（生产）
- **数据库迁移**: Flyway

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI组件**: Ant Design 5.x
- **拖拽**: @hello-pangea/dnd
- **实时通信**: SockJS + STOMP
- **构建工具**: Vite

### 部署
- **本地开发**: Docker Compose (PostgreSQL + Redis)
- **生产环境**: AWS (EC2/ECS, RDS, ElastiCache, S3)

---

## 已完成功能

### Phase 1: 基础设施 ✅

#### 认证系统
- [x] 用户注册 (邮箱验证)
- [x] 用户登录 (JWT Token)
- [x] Token 刷新机制
- [x] 密码重置功能

#### 项目管理
- [x] 项目 CRUD
- [x] 项目成员管理
- [x] 项目角色 (Owner/Admin/Member)

#### Sprint 管理
- [x] Sprint CRUD
- [x] 启动/完成 Sprint
- [x] 仅允许一个活跃 Sprint

#### Issue 系统
- [x] Issue CRUD
- [x] Issue 类型: Epic/Story/Task/Bug
- [x] Issue 状态: TODO/IN_PROGRESS/IN_REVIEW/DONE
- [x] Issue 优先级: Highest/High/Medium/Low/Lowest
- [x] Story Points (斐波那契: 1,2,3,5,8,13,21)
- [x] 父子任务关系
- [x] 标签系统
- [x] 历史记录追踪

#### 看板功能
- [x] 拖拽更改状态
- [x] 按 Sprint 筛选
- [x] 实时更新 (WebSocket)

---

### Phase 2: 功能完善 ✅

#### Issue 详情模态框
- [x] 完整 Issue 信息展示
- [x] 内联编辑 (标题、描述、优先级、Story Points、Due Date、Assignee)
- [x] 状态切换

#### 评论功能
- [x] 评论 CRUD
- [x] 评论列表展示
- [x] 实时评论更新

#### 附件功能
- [x] 文件上传 (本地存储)
- [x] 文件下载
- [x] 文件删除
- [x] 支持多种文件类型图标

#### 子任务功能
- [x] 创建子任务
- [x] 子任务状态切换
- [x] 子任务进度显示

#### 搜索和过滤
- [x] 关键字搜索 (标题、描述、Key)
- [x] 按状态过滤
- [x] 按优先级过滤
- [x] 按类型过滤
- [x] 按 Assignee 过滤

---

### Phase 3: 新增功能 ✅

#### Backlog 功能
- [x] Backlog 页面 (`/projects/:projectKey/backlog`)
- [x] 显示未分配 Sprint 的任务
- [x] 拖拽任务到 Sprint
- [x] Board/Backlog 视图切换 (Segmented 控件)
- [x] 在 Backlog 创建新任务

#### Sprint 管理增强
- [x] 完成 Sprint 时处理未完成任务
  - 移至 Backlog
  - 移至指定 Sprint
- [x] 创建下一个 Sprint (自动计算日期，默认2周)
- [x] Sprint 摘要 (总任务数/已完成/未完成)

#### Team 功能
- [x] 团队 CRUD
- [x] 团队成员列表
- [x] 邀请成员 (通过邮箱)
- [x] 接受/拒绝邀请
- [x] 成员角色管理 (Owner/Admin/Member)
- [x] 移除成员
- [x] 离开团队
- [x] Teams 页面 (`/teams`)

#### Notification 功能
- [x] 通知模型和存储
- [x] 通知铃铛组件 (显示未读数量)
- [x] 通知列表下拉面板
- [x] 标记单个已读
- [x] 标记全部已读
- [x] WebSocket 实时推送
- [x] 通知类型:
  - TEAM_INVITATION (团队邀请)
  - ISSUE_ASSIGNED (任务分配)
  - ISSUE_DUE_TODAY (今日到期)
  - ISSUE_DUE_TOMORROW (明日到期)
  - ISSUE_OVERDUE (已逾期)
  - ISSUE_COMMENTED (新评论)
  - SPRINT_STARTED (Sprint 开始)
  - SPRINT_ENDING_SOON (Sprint 即将结束)
  - SPRINT_COMPLETED (Sprint 完成)
- [x] 定时任务 (每天9:00发送到期提醒)

---

## 项目结构

```
MIRA/
├── backend/
│   ├── src/main/kotlin/com/mira/
│   │   ├── MiraApplication.kt
│   │   ├── config/
│   │   │   ├── SecurityConfig.kt
│   │   │   ├── WebSocketConfig.kt
│   │   │   └── CorsConfig.kt
│   │   ├── controller/
│   │   │   ├── AuthController.kt
│   │   │   ├── ProjectController.kt
│   │   │   ├── SprintController.kt
│   │   │   ├── IssueController.kt
│   │   │   ├── CommentController.kt
│   │   │   ├── AttachmentController.kt
│   │   │   ├── TeamController.kt
│   │   │   └── NotificationController.kt
│   │   ├── service/
│   │   │   ├── AuthService.kt
│   │   │   ├── ProjectService.kt
│   │   │   ├── SprintService.kt
│   │   │   ├── IssueService.kt
│   │   │   ├── CommentService.kt
│   │   │   ├── AttachmentService.kt
│   │   │   ├── StorageService.kt
│   │   │   ├── TeamService.kt
│   │   │   ├── NotificationService.kt
│   │   │   └── WebSocketService.kt
│   │   ├── repository/
│   │   │   ├── UserRepository.kt
│   │   │   ├── ProjectRepository.kt
│   │   │   ├── SprintRepository.kt
│   │   │   ├── IssueRepository.kt
│   │   │   ├── CommentRepository.kt
│   │   │   ├── AttachmentRepository.kt
│   │   │   ├── TeamRepository.kt
│   │   │   └── NotificationRepository.kt
│   │   ├── model/
│   │   │   ├── User.kt
│   │   │   ├── Project.kt
│   │   │   ├── ProjectMember.kt
│   │   │   ├── Sprint.kt
│   │   │   ├── Issue.kt
│   │   │   ├── Comment.kt
│   │   │   ├── Attachment.kt
│   │   │   ├── IssueLabel.kt
│   │   │   ├── IssueHistory.kt
│   │   │   ├── Team.kt
│   │   │   ├── TeamInvitation.kt
│   │   │   └── Notification.kt
│   │   ├── dto/
│   │   │   ├── AuthDto.kt
│   │   │   ├── ProjectDto.kt
│   │   │   ├── SprintDto.kt
│   │   │   ├── IssueDto.kt
│   │   │   ├── CommentDto.kt
│   │   │   ├── AttachmentDto.kt
│   │   │   ├── TeamDto.kt
│   │   │   └── NotificationDto.kt
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.kt
│   │   │   ├── JwtAuthenticationFilter.kt
│   │   │   └── UserPrincipal.kt
│   │   └── scheduler/
│   │       └── NotificationScheduler.kt
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │       ├── V1__initial_schema.sql
│   │       └── V2__teams_and_notifications.sql
│   ├── build.gradle.kts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   ├── IssueDetailModal.tsx
│   │   │   ├── CommentList.tsx
│   │   │   ├── AttachmentList.tsx
│   │   │   ├── SubtaskList.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── NotificationBell.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── BoardPage.tsx
│   │   │   ├── BacklogPage.tsx
│   │   │   └── TeamsPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── sprintService.ts
│   │   │   ├── issueService.ts
│   │   │   ├── commentService.ts
│   │   │   ├── attachmentService.ts
│   │   │   ├── teamService.ts
│   │   │   └── notificationService.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   └── projectStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── PROGRESS.md (本文件)
└── README.md
```

---

## 数据库表结构

### V1 (初始)
- users
- projects
- project_members
- sprints
- issues
- comments
- attachments
- issue_labels
- issue_label_assignments
- issue_history

### V2 (团队和通知)
- teams
- team_members
- team_invitations
- notifications
- projects.team_id (新增外键)

---

## API 端点

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 Token

### 用户
- `GET /api/users/me` - 当前用户信息
- `PUT /api/users/me` - 更新个人资料

### 项目
- `GET /api/projects` - 项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/{key}` - 项目详情
- `PUT /api/projects/{key}` - 更新项目
- `GET /api/projects/{key}/members` - 成员列表
- `POST /api/projects/{key}/members` - 添加成员
- `DELETE /api/projects/{key}/members/{id}` - 移除成员

### Sprint
- `GET /api/projects/{key}/sprints` - Sprint 列表
- `POST /api/projects/{key}/sprints` - 创建 Sprint
- `POST /api/projects/{key}/sprints/next` - 创建下一个 Sprint
- `GET /api/projects/{key}/sprints/{id}` - Sprint 详情
- `GET /api/projects/{key}/sprints/{id}/summary` - Sprint 摘要
- `PUT /api/projects/{key}/sprints/{id}` - 更新 Sprint
- `POST /api/projects/{key}/sprints/{id}/start` - 启动 Sprint
- `POST /api/projects/{key}/sprints/{id}/complete` - 完成 Sprint

### Issue
- `GET /api/projects/{key}/issues` - Issue 列表 (支持过滤)
- `GET /api/projects/{key}/issues/backlog` - Backlog Issues
- `POST /api/projects/{key}/issues` - 创建 Issue
- `GET /api/projects/{key}/issues/{issueKey}` - Issue 详情
- `PUT /api/projects/{key}/issues/{issueKey}` - 更新 Issue
- `POST /api/projects/{key}/issues/{issueKey}/move` - 移动 Issue
- `DELETE /api/projects/{key}/issues/{issueKey}` - 删除 Issue

### 评论
- `GET /api/projects/{key}/issues/{issueKey}/comments` - 评论列表
- `POST /api/projects/{key}/issues/{issueKey}/comments` - 添加评论
- `PUT /api/projects/{key}/issues/{issueKey}/comments/{id}` - 编辑评论
- `DELETE /api/projects/{key}/issues/{issueKey}/comments/{id}` - 删除评论

### 附件
- `GET /api/projects/{key}/issues/{issueKey}/attachments` - 附件列表
- `POST /api/projects/{key}/issues/{issueKey}/attachments` - 上传附件
- `GET /api/projects/{key}/issues/{issueKey}/attachments/{id}/download` - 下载附件
- `DELETE /api/projects/{key}/issues/{issueKey}/attachments/{id}` - 删除附件

### 团队
- `GET /api/teams` - 我的团队列表
- `POST /api/teams` - 创建团队
- `GET /api/teams/{id}` - 团队详情
- `PUT /api/teams/{id}` - 更新团队
- `DELETE /api/teams/{id}` - 删除团队
- `GET /api/teams/{id}/members` - 成员列表
- `POST /api/teams/{id}/invitations` - 发送邀请
- `PUT /api/teams/{id}/members/{memberId}/role` - 修改角色
- `DELETE /api/teams/{id}/members/{memberId}` - 移除成员
- `POST /api/teams/{id}/leave` - 离开团队
- `GET /api/teams/invitations` - 我的待处理邀请
- `POST /api/teams/invitations/{id}/accept` - 接受邀请
- `POST /api/teams/invitations/{id}/decline` - 拒绝邀请

### 通知
- `GET /api/notifications` - 通知列表
- `GET /api/notifications/unread-count` - 未读数量
- `POST /api/notifications/{id}/read` - 标记已读
- `POST /api/notifications/read-all` - 全部标记已读

### WebSocket
- `/ws` - STOMP 端点
- `/topic/project/{key}` - 项目更新订阅
- `/topic/user/{id}/notifications` - 用户通知订阅

---

## 启动方式

### 前置条件
- Java 17+
- Node.js 18+
- Docker Desktop

### 1. 启动数据库服务
```bash
cd /Users/johnsmith/Code/MIRA
docker compose up -d
```

### 2. 启动后端
```bash
cd /Users/johnsmith/Code/MIRA/backend
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
./gradlew bootRun
```
后端运行在: http://localhost:8080

### 3. 启动前端
```bash
cd /Users/johnsmith/Code/MIRA/frontend
npm install  # 首次运行
npm run dev
```
前端运行在: http://localhost:5173

---

## 待完成功能 (Future)

### 功能增强
- [x] 排序功能 (按创建时间、截止时间、优先级、Story Points)
- [x] Sprint 管理 UI (启动 Sprint、完成 Sprint、创建下一个 Sprint)
- [x] Sprint 燃尽图
- [ ] Issue 活动历史展示
- [ ] 标签管理 UI (创建/编辑/删除项目标签)
- [ ] 项目仪表盘统计
- [ ] 用户头像上传
- [ ] 邮件通知
- [ ] 项目与团队关联

### 技术优化
- [ ] 前端代码分割 (减少 bundle 大小)
- [ ] 后端单元测试
- [ ] 前端单元测试
- [ ] E2E 测试
- [ ] S3 文件存储实现
- [ ] 生产环境 Dockerfile 优化
- [ ] CI/CD 流水线

---

## 已知问题

1. 前端 bundle 大小超过 500KB (建议进行代码分割)
2. 附件存储目前仅支持本地存储，需要实现 S3 支持用于生产环境
3. 邮件发送功能尚未实现

---

## 环境变量配置

### 后端 (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mira
    username: mira
    password: mira123
  redis:
    host: localhost
    port: 6379

jwt:
  secret: your-secret-key
  expiration: 86400000

storage:
  type: local
  local:
    path: ./uploads
```

### 前端 (.env)
```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

---

## 贡献者

- John Smith (项目创建者)
- Claude (AI 开发助手)
