# ORGANIA TASK MANAGER

A full-stack task management web application built for the Organia Innovations Labs internship assessment. It includes secure JWT authentication, OTP-based email verification and password reset, role-based task management, analytics, notifications, and activity tracking. The project is split into a React frontend and Spring Boot backend with MySQL and Flyway migrations.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6, Axios, TanStack Query v5, RHF + Zod, Zustand, Recharts, Lucide, date-fns |
| Backend | Spring Boot 3.2.x, Spring Security 6, Spring Data JPA, Flyway, JavaMailSender, jjwt 0.12.x, Lombok, MapStruct, Springdoc OpenAPI |
| Database | MySQL 8.0 (`organia_tasks_db`) |
| DevOps | Docker, Docker Compose, Vercel, Railway |

## Feature Checklist

- [x] JWT auth with access + refresh flow
- [x] OTP email verification and forgot-password flow
- [x] Password strength meter with `zxcvbn`
- [x] Full task CRUD with priority/status/due date
- [x] Admin task assignment and bulk actions
- [x] Role-based access control (ADMIN/USER)
- [x] Search/filter/sort/pagination
- [x] Dashboard analytics charts
- [x] Task activity logs
- [x] Notification bell + notifications page
- [x] Dark mode with persisted Zustand state
- [x] Swagger/OpenAPI docs
- [x] Unit tests + integration tests + frontend component tests
- [x] Docker local setup + Vercel/Railway deployment files

## Screenshots

- `docs/screenshots/login.png` (placeholder)
- `docs/screenshots/dashboard.png` (placeholder)
- `docs/screenshots/admin-tasks.png` (placeholder)

## Local Setup

### Prerequisites
- Node.js 20+
- Java 21
- Maven 3.9+ (or backend Maven wrapper)
- MySQL 8.0
- Docker Desktop (optional)

### Clone

```bash
git clone <repo-url>
cd Task-Management-Systaem
```

### Option A: Docker Compose

```bash
docker compose up --build
```

### Option B: Manual

1. Start MySQL and create DB `organia_tasks_db`
2. Backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

| Variable | Description | Example | Required |
|---|---|---|---|
| DB_URL | JDBC database URL | `jdbc:mysql://localhost:3306/organia_tasks_db?...` | Yes |
| DB_USERNAME | DB username | `root` | Yes |
| DB_PASSWORD | DB password | `root` | Yes |
| JWT_SECRET | JWT signing secret (>=64 chars) | `super-long-secret...` | Yes |
| JWT_ACCESS_EXPIRY | Access token expiry ms | `900000` | No |
| JWT_REFRESH_EXPIRY | Refresh token expiry ms | `604800000` | No |
| MAIL_USERNAME | SMTP username | `your@gmail.com` | Yes |
| MAIL_PASSWORD | SMTP app password | `xxxxx` | Yes |
| FRONTEND_URL | CORS allowed origin | `http://localhost:5173` | Yes |
| VITE_API_BASE_URL | Frontend API base URL | `http://localhost:8080/api` | Yes |

## API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`

### Error Format

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

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/verify-email | Public | Verify email OTP |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/refresh | Public (cookie) | Refresh access token |
| POST | /api/auth/logout | Public (cookie) | Logout |
| POST | /api/auth/forgot-password | Public | Send reset OTP |
| POST | /api/auth/verify-reset-otp | Public | Verify reset OTP |
| POST | /api/auth/reset-password | Public | Reset password |
| GET | /api/tasks | Bearer | List user tasks |
| POST | /api/tasks | Bearer | Create task |
| PUT | /api/tasks/{id} | Bearer | Update task |
| PATCH | /api/tasks/{id}/status | Bearer | Change status |
| DELETE | /api/tasks/{id} | Bearer | Delete task |
| GET | /api/tasks/{id}/activity | Bearer | Task activity |
| GET | /api/users/me | Bearer | Current profile |
| PUT | /api/users/me | Bearer | Update profile |
| PUT | /api/users/me/password | Bearer | Change password |
| DELETE | /api/users/me | Bearer | Delete account |
| GET | /api/notifications | Bearer | List notifications |
| GET | /api/notifications/unread-count | Bearer | Unread count |
| PATCH | /api/notifications/{id}/read | Bearer | Mark read |
| PATCH | /api/notifications/read-all | Bearer | Mark all read |
| DELETE | /api/notifications/{id} | Bearer | Delete notification |
| GET | /api/admin/users | ADMIN | Paged users |
| GET | /api/admin/users/list | ADMIN | User list |
| PUT | /api/admin/users/{id}/role | ADMIN | Change role |
| DELETE | /api/admin/users/{id} | ADMIN | Delete user |
| GET | /api/admin/tasks | ADMIN | Paged tasks |
| PATCH | /api/admin/tasks/{id}/assign | ADMIN | Assign task |
| POST | /api/admin/tasks/bulk-action | ADMIN | Bulk actions |
| GET | /api/admin/stats | ADMIN | Admin stats |

### Request Example (Register)

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password1!"
}
```

### Response Example (Login)

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "isVerified": true,
    "avatarUrl": null
  }
}
```

## Live URLs

- Frontend: `https://your-vercel-app.vercel.app`
- Backend: `https://your-railway-app.up.railway.app`
- Swagger: `https://your-railway-app.up.railway.app/swagger-ui.html`

## Demo Credentials

- User: `user@demo.com` / `User123!`
- Admin: `admin@organia.com` / `Admin123!`

## Commit Message Format

1. `#1,  project setup — monorepo structure, Vite React + Spring Boot scaffolded`
2. `#2,  database schema — 7 Flyway migration files, application.properties`
3. `#3,  auth backend — register, OTP email verify, login, JWT, refresh token, logout`
4. `#4,  password reset — forgot-password OTP flow, reset-password endpoint`
5. `#5,  task backend — full CRUD, status patch, activity logging, notifications`
6. `#6,  admin backend — user management, task assignment, bulk actions, stats endpoint`
7. `#7,  auth frontend — register+strength meter, OTP input, login, forgot-password wizard`
8. `#8,  task frontend — dashboard, task cards, filters, search, pagination, charts`
9. `#9,  admin frontend — users table, tasks table, assign dropdown, bulk actions`
10. `#10, advanced features — notifications bell, activity log, profile page, dark mode`
11. `#11, testing — JUnit unit tests, integration tests, Vitest frontend tests`
12. `#12, deployment — Dockerfile, docker-compose, Vercel config, Railway setup, README`

## Ports Summary

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- MySQL: `localhost:3306`
- DB: `organia_tasks_db`

## License

MIT
