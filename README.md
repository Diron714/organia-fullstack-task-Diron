# Organia Task Manager

Full-stack task management application (Spring Boot backend, React + Vite frontend).

## Email reminders

Users receive email reminders for tasks due tomorrow at **8:00 AM** daily (server time), in addition to in-app notifications.

## Setup

- **Backend:** Java 21+, Maven. Configure MySQL and copy `backend/.env` as needed. Run `mvn spring-boot:run` from `backend`.
- **Frontend:** Node 18+. From `frontend`, run `npm install` then `npm run dev`.
