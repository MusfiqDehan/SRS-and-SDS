<div align="center">
  <h1>📋 SDS / SRS Documentation Platform</h1>
  <p><strong>A full-stack platform for creating, managing and exporting Software Design Specification (SDS) and Software Requirements Specification (SRS) documents.</strong></p>
</div>

---

## 🏗️ Architecture

This project is a complete rewrite of the original static template into a modern full-stack application:

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| **Frontend** | Next.js 16 (App Router), TailwindCSS 4, Framer Motion |
| **Backend**  | Node.js + Express.js (ESM), JWT authentication        |
| **Database** | PostgreSQL (Docker)                                   |
| **Auth**     | JWT (register / login), role-based admin dashboard    |

```
.
├── backend/          # Express + PostgreSQL API
│   ├── src/
│   │   ├── config/         # env loading
│   │   ├── controllers/    # auth, documents, sections
│   │   ├── db/             # pool, migrate, seed (+ content.json)
│   │   ├── middleware/     # auth, error handling
│   │   ├── routes/         # API routes
│   │   ├── utils/          # response format, JWT
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   ├── docker-compose.local.yml
│   └── docker-compose.prod.yml
├── frontend/         # Next.js app
│   ├── src/
│   │   ├── app/            # routes: /docs/[slug], /login, /register, /admin
│   │   ├── components/     # DocViewer, Toast, icons, ThemeToggle
│   │   └── lib/            # api client, auth + theme context, export utils
│   ├── Dockerfile
│   ├── docker-compose.local.yml
│   └── docker-compose.prod.yml
├── docker-compose.local.yml   # full stack (db + backend + frontend)
├── docker-compose.prod.yml
├── .env.local
└── .env.prod
```

## ✨ Features

- **Dynamic content** – SDS & SRS documents and their sections are stored in PostgreSQL and rendered by the frontend.
- **Admin dashboard** – authenticated admins can create, edit, reorder, publish/unpublish and delete sections, and edit document metadata. Changes appear instantly on the public site.
- **Authentication** – register / login with JWT. The first registered user (and the seeded account) is an admin.
- **Public viewer** – left navigation with scroll-spy, SDS/SRS switching, dark/light theme (persisted), and smooth animations via Framer Motion.
- **Export** – download the current document as **PDF** (print dialog), **HTML**, or **DOCX** (Word/Google-Docs compatible) entirely on the client.
- **Standard API responses** – every endpoint returns `{ success, message, data, errors }`.

## 🚀 Quick start (Docker — recommended)

The whole stack (PostgreSQL + backend + frontend) runs with a single command.

```bash
# Local
docker compose -f docker-compose.local.yml --env-file .env.local up --build

# Production (edit .env.prod first!)
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

Then open:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:4000/api/health>

The database is automatically migrated and seeded with the SDS/SRS content and a default admin account on first boot.

**Default admin login (local):** `admin@example.com` / `Admin@12345`

> Each app also has its own `docker-compose.local.yml` / `docker-compose.prod.yml` inside `backend/` and `frontend/` if you want to run them independently.

## 🧑‍💻 Local development (without Docker)

### 1. Database

```bash
docker run -d --name srs_pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=srs_sds -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # adjust if needed
npm install
npm run db:setup          # migrate + seed
npm run dev               # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:3000
```

> The package manager is interchangeable — `bun install` / `bun run dev` work the same way wherever Bun is available.

## 🔌 API overview

Base URL: `/api`. All responses follow `{ success, message, data, errors }`.

| Method   | Endpoint                            | Auth  | Description                       |
| -------- | ----------------------------------- | ----- | -------------------------------- |
| `GET`    | `/health`                           | –     | Health check                     |
| `POST`   | `/auth/register`                    | –     | Register a new user              |
| `POST`   | `/auth/login`                       | –     | Login, returns a JWT             |
| `GET`    | `/auth/me`                          | user  | Current user                     |
| `GET`    | `/documents`                        | –     | List documents                   |
| `GET`    | `/documents/:slug`                  | –     | Document with published sections |
| `PATCH`  | `/documents/:slug`                  | admin | Update document metadata         |
| `POST`   | `/documents/:slug/sections`         | admin | Create a section                 |
| `PUT`    | `/documents/:slug/sections/reorder` | admin | Reorder sections                 |
| `PATCH`  | `/sections/:id`                     | admin | Update a section                 |
| `DELETE` | `/sections/:id`                     | admin | Delete a section                 |

## 🔒 Environment variables

See [`.env.local`](.env.local) and [`.env.prod`](.env.prod) for the full list. Always replace the secrets (`JWT_SECRET`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`) before deploying to production.

## 📝 License

MIT — open source and free to use.

## 👨‍💻 Author

**Musfiq Dehan** — [@MusfiqDehan](https://github.com/MusfiqDehan)
