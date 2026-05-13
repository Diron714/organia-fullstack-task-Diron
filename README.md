# Organia Task Manager

A full-stack task management web application built for the Organia Innovations Labs internship assessment. This application provides a complete solution for managing tasks, teams, and productivity with modern technologies and best practices.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://organia-fullstack-task-diron.vercel.app |
| Backend API | https://organia-fullstack-task-diron-production.up.railway.app |
| Swagger UI | https://organia-fullstack-task-diron-production.up.railway.app/swagger-ui/index.html |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@organia.com | Organia@Admin1 |
| User | register a new account via the app | — |

---

## Project Overview

Organia Task Manager is a production-ready full-stack application that allows users to:

- Register and verify their account via email OTP
- Create, manage, and track tasks with priorities, due dates, and labels
- View tasks in list or kanban board view with drag and drop
- Collaborate through task comments, assignments, and dependencies
- Track time spent on tasks with a built-in timer
- Receive real-time notifications for task updates
- View productivity analytics and completion streaks
- Export tasks to CSV
- Manage users and tasks as an Admin

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v3 | Styling |
| shadcn/ui | Component library |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management |
| Axios | HTTP client |
| React Hook Form + Zod | Form validation |
| Zustand | Global state management |
| Recharts | Analytics charts |
| @dnd-kit | Kanban drag and drop |
| zxcvbn | Password strength scoring |
| date-fns | Date formatting |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Spring Boot 3.2 | Main framework |
| Spring Security 6 | JWT authentication |
| Spring Data JPA + Hibernate | ORM |
| Spring Mail | Email sending |
| Flyway | Database migrations |
| Lombok | Boilerplate reduction |
| MapStruct | DTO mapping |
| Springdoc OpenAPI 3 | Swagger documentation |
| Spring Boot Actuator | Health checks |
| Maven | Build tool |

### Database
| Technology | Purpose |
|------------|---------|
| MySQL 8.0 | Primary database |
| 19 Flyway migrations | Schema versioning |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development |
| Vercel | Frontend hosting |
| Railway | Backend and database hosting |
| GitHub | Source control |

---

## Features

### Authentication
- User registration with email and password
- Email OTP verification (6-digit code, 10 min expiry)
- JWT access tokens (15 min) + refresh tokens (7 days)
- Forgot password with 3-step OTP wizard
- Password strength meter with live scoring
- BCrypt password hashing (rounds 12)
- Role-based access control (Admin / User)

### Task Management
- Create, view, edit, delete tasks
- Task fields: title, description, status, priority, due date
- Task status: Todo / In Progress / Completed
- Task priority: Low / Medium / High
- Overdue task detection with visual indicators
- Quick status toggle from task card
- Recurring tasks (Daily / Weekly / Monthly)
- Task assignment by Admin to specific users
- Task dependencies (blocked by relationships)
- Task labels with custom colors
- Task comments
- Task time tracking with start/stop timer
- Task activity audit log

### Dashboard
- Stats cards with task counts
- Doughnut chart by status
- Bar chart by priority
- Productivity score with circular progress ring
- Completion streak tracker
- Filter by status, priority, label
- Debounced search (300ms)
- URL-synced filters (shareable links)
- Pagination (10 per page)
- Export to CSV
- Customizable dashboard widgets
- Dark mode

### Kanban Board
- Drag and drop between columns
- Three columns: Todo / In Progress / Completed
- Visual indicators for overdue, blocked, recurring tasks

### Analytics
- Tasks completed per day (last 7/30/90 days)
- Completion rate by priority
- Most productive day of week
- Average completion time
- Summary metrics

### Notifications
- In-app notification bell with unread badge
- Real-time notification popover
- Full notifications page
- Mark as read / delete
- Daily email reminders for tasks due tomorrow (8AM)
- Weekly summary email (Monday 9AM)

### Admin Panel
- User management (view, change role, delete)
- All tasks across all users
- Task assignment and bulk actions
- System statistics and activity feed

### Profile
- Edit name and profile photo upload
- Change password with strength meter
- Account statistics
- Delete account

---

## Local Setup

### Prerequisites
- Java 21 or higher
- Maven 3.9 or higher
- MySQL 8.0
- Node.js 18 or higher
- npm 9 or higher

### Step 1 — Clone the repository
```bash
git clone https://github.com/Diron714/organia-fullstack-task-Diron.git
cd organia-fullstack-task-Diron
```

### Step 2 — Create MySQL database
```sql
CREATE DATABASE organia_tasks_db;
```

### Step 3 — Configure backend environment
Create a file `backend/.env` with these values:
```
DB_URL=jdbc:mysql://localhost:3306/organia_tasks_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-64-character-random-secret-key-here-minimum-64-chars-long
SENDGRID_API_KEY=SG.your-sendgrid-api-key
MAIL_USERNAME=your@gmail.com
FRONTEND_URL=http://localhost:5173
```

### Step 4 — Start the backend
```bash
cd backend
mvn spring-boot:run
```

Backend starts at: http://localhost:8080

Flyway will automatically create all tables and seed the admin user.

### Step 5 — Configure frontend environment
Create a file `frontend/.env.development` with:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

### Step 6 — Start the frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: http://localhost:5173

### Docker (alternative — runs everything with one command)
```bash
docker compose up --build
```

This starts MySQL, backend, and frontend together.

---

## Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| DB_URL | MySQL JDBC connection URL | Yes |
| DB_USERNAME | MySQL username | Yes |
| DB_PASSWORD | MySQL password | Yes |
| JWT_SECRET | 64+ character secret for JWT signing | Yes |
| SENDGRID_API_KEY | SendGrid API key for transactional email | Yes |
| MAIL_USERNAME | Gmail address used as sender | Yes |
| FRONTEND_URL | Frontend URL for CORS | Yes |
| PORT | Server port (default 8080) | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_BASE_URL | Backend API base URL | Yes |

---

## API Documentation

Full interactive API documentation available at:
https://organia-fullstack-task-diron-production.up.railway.app/swagger-ui/index.html

### Authentication Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/verify-email | Public | Verify OTP after registration |
| POST | /api/auth/login | Public | Login and get tokens |
| POST | /api/auth/refresh | Public | Refresh access token |
| POST | /api/auth/logout | Required | Logout and invalidate token |
| POST | /api/auth/forgot-password | Public | Send password reset OTP |
| POST | /api/auth/verify-reset-otp | Public | Verify reset OTP |
| POST | /api/auth/reset-password | Public | Set new password |
| POST | /api/auth/resend-otp | Public | Resend OTP email |

### Task Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/tasks | Required | Get tasks (paginated, filtered) |
| POST | /api/tasks | Required | Create task |
| GET | /api/tasks/:id | Required | Get single task |
| PUT | /api/tasks/:id | Required | Update task |
| DELETE | /api/tasks/:id | Required | Delete task |
| PATCH | /api/tasks/:id/status | Required | Quick status update |
| GET | /api/tasks/:id/activity | Required | Get task activity log |
| GET | /api/tasks/:id/comments | Required | Get task comments |
| POST | /api/tasks/:id/comments | Required | Add comment |
| DELETE | /api/tasks/:id/comments/:commentId | Required | Delete comment |
| GET | /api/tasks/:id/time | Required | Get time summary |
| POST | /api/tasks/:id/time/start | Required | Start timer |
| POST | /api/tasks/:id/time/stop | Required | Stop timer |
| GET | /api/tasks/:id/dependencies | Required | Get dependencies |
| POST | /api/tasks/:id/dependencies | Required | Add dependency |
| DELETE | /api/tasks/:id/dependencies/:depId | Required | Remove dependency |
| GET | /api/tasks/export | Required | Export tasks as CSV |

### User Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/users/me | Required | Get current user profile |
| PUT | /api/users/me | Required | Update profile |
| PUT | /api/users/me/password | Required | Change password |
| POST | /api/users/me/avatar | Required | Upload profile photo |
| DELETE | /api/users/me | Required | Delete account |
| GET | /api/users/me/productivity | Required | Get productivity score |
| GET | /api/users/me/streak | Required | Get completion streak |
| GET | /api/users/me/dashboard-preferences | Required | Get widget preferences |
| PUT | /api/users/me/dashboard-preferences | Required | Save widget preferences |

### Notification Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/notifications | Required | Get notifications (paginated) |
| GET | /api/notifications/unread-count | Required | Get unread count |
| PATCH | /api/notifications/:id/read | Required | Mark as read |
| PATCH | /api/notifications/read-all | Required | Mark all as read |
| DELETE | /api/notifications/:id | Required | Delete notification |

### Admin Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/admin/users | Admin | Get all users |
| GET | /api/admin/users/list | Admin | Get users for dropdowns |
| PUT | /api/admin/users/:id/role | Admin | Change user role |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| GET | /api/admin/tasks | Admin | Get all tasks |
| PATCH | /api/admin/tasks/:id/assign | Admin | Assign task to user |
| POST | /api/admin/tasks/bulk-action | Admin | Bulk task actions |
| GET | /api/admin/stats | Admin | System statistics |

### Analytics Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/analytics/summary | Required | Analytics summary |
| GET | /api/analytics/completion-trend | Required | Daily completion trend |
| GET | /api/analytics/completion-by-priority | Required | Completion by priority |
| GET | /api/analytics/productive-days | Required | Most productive days |
| GET | /api/analytics/avg-completion-time | Required | Average completion time |

### Search Endpoint
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/search?q= | Required | Global search across tasks, comments, labels |

### Standard Error Response Format
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/register",
  "fieldErrors": {
    "email": "must be a valid email",
    "password": "must be at least 8 characters"
  }
}
```

---

## Database Schema

The database uses 19 Flyway migrations creating these tables:

| Table | Purpose |
|-------|---------|
| users | User accounts with roles and streak data |
| tasks | Tasks with all fields including recurrence |
| task_comments | Comments on tasks |
| task_activity | Audit log of all task changes |
| task_dependencies | Task dependency relationships |
| labels | Custom colored labels |
| task_labels | Many-to-many task to label relationships |
| time_entries | Time tracking entries per task |
| notifications | In-app notifications |
| otp_tokens | OTP codes for email verification and password reset |
| refresh_tokens | JWT refresh tokens |

---

## Commit History

| Commit | Description |
|--------|-------------|
| #1 | Project setup — monorepo, Vite React frontend, Spring Boot backend |
| #2 | Fix authentication system |
| #3 | Adding additional features to the system |
| #4 | Main feature bug fixes |
| #12 | Deployment fix — Dockerfile, railway.json, bug fixes |
| #13 | Trigger Railway redeploy with database variables |
| #14 | Mobile responsive — all pages fixed for mobile screens |
| #15 | README — complete documentation with live URLs and API docs |

---

## Project Structure

```
organia-fullstack-task-Diron/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/organia/taskmanager/
│   │   │   │   ├── config/     # Security, CORS, Mail config
│   │   │   │   ├── controller/ # REST controllers
│   │   │   │   ├── dto/        # Request and response DTOs
│   │   │   │   ├── entity/     # JPA entities
│   │   │   │   ├── repository/ # Spring Data repositories
│   │   │   │   ├── security/   # JWT filter and auth
│   │   │   │   └── service/    # Business logic
│   │   │   └── resources/
│   │   │       ├── db/migration/ # Flyway SQL migrations
│   │   │       └── application.properties
│   │   └── test/               # Unit and integration tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                   # React application
│   ├── src/
│   │   ├── api/                # Axios API services
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   ├── store/              # Zustand state stores
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Helper functions
│   ├── vercel.json
│   └── vite.config.ts
├── Dockerfile                  # Root Dockerfile for Railway
├── railway.json                # Railway deployment config
├── docker-compose.yml          # Local development setup
└── README.md
```

---

## License

MIT License — feel free to use this project for learning and reference.
