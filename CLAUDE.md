# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EasyTalk is a full-stack English learning platform with a Node.js/Express backend (`apps/`) and a React/Vite frontend (`webapp/`).

## Commands

### Backend (`apps/`)
```bash
cd apps
npm install
npm start         # Start server on http://localhost:3000
```

### Frontend (`webapp/`)
```bash
cd webapp
npm install
npm run dev       # Dev server on http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Architecture

### Backend (`apps/`)

The server follows a **Repository → Service → Controller → Router** layered pattern with dependency injection.

- `apps/app.js` — Express entry point: registers middleware, mounts all module routers, starts Socket.IO and cron jobs.
- `apps/src/modules/` — Each feature is a self-contained module with its own `model/`, `repository/`, `service/`, `controller/`, and `router/` subdirectories.
- `apps/src/repositories/` — Base repository class that wraps raw MongoDB operations; module repositories extend it.
- `apps/src/middlewares/` — JWT verification (`verifyToken.js`), Redis cache middleware, CORS, error handler.
- `apps/src/utils/AppError.js` — Custom error class; all thrown errors use this. The global error middleware converts it to JSON responses.
- Database: **MongoDB Atlas** (native driver, no Mongoose). Collections map 1-to-1 to module models.
- Caching: **Redis** (optional). Cache middleware wraps GET routes; misses fall through to DB.
- Real-time: **Socket.IO** for notifications, online status, and live chat.
- Background jobs: **node-cron** for reminders and scheduled tasks.

### Frontend (`webapp/`)

- `webapp/src/app/` — Redux store setup and root App component with React Router routes.
- `webapp/src/store/` — Redux Toolkit slices per feature (auth, user, notifications, grammar, etc.).
- `webapp/src/services/` — Fetch-based API clients, one file per backend module. All calls include `Authorization: Bearer <token>` from localStorage.
- `webapp/src/layouts/` — Two top-level layouts: `UserLayout` (learner UI) and `AdminLayout` (admin dashboard).
- `webapp/src/pages/` — Route-level components, organized under `user/` and `admin/` subdirectories.
- i18n: Vietnamese (`vi`) and English (`en`) via `react-i18next`; translation files in `webapp/src/locales/`.

### API Response Format

All backend endpoints return:
```json
{ "success": true|false, "message": "...", "data": {}, "code": "OPTIONAL_ERROR_CODE" }
```

### Authentication Flow

JWT access + refresh tokens stored in `localStorage`. The frontend attaches the access token as a Bearer header; the backend `verifyToken` middleware validates it. Refresh is handled automatically by the frontend service layer.

Social login (Google, Facebook) redirects through OAuth then issues the same JWT pair.

### Key External Services

| Service | Purpose |
|---|---|
| MongoDB Atlas | Primary database |
| Redis | Response caching |
| OpenAI API | `chatAI` and `writingAI` modules |
| Cloudinary | Image/media uploads |
| Nodemailer (Gmail SMTP) | Email verification & notifications |
| Google OAuth + Dialogflow | Social login and chatbot |
| Facebook OAuth | Social login |

### Backend Module List

`user`, `userprogress`, `journey`, `gate`, `stage`, `flashcard`, `flashcardList`, `grammar`, `pronunciation`, `story`, `grammarexercise`, `pronunciationexercise`, `vocabularyexercise`, `dictationexercise`, `chatAI`, `writingAI`, `notification`, `reminder`, `prize`, `dashboard`, `usersetting`

Each new module must be registered in `apps/controllers/index.js` and mounted in `apps/app.js`.

## Environment Files

Both workspaces use separate files per environment:
- `apps/.env.development` / `apps/.env.production`
- `webapp/.env.development` / `webapp/.env.production`
