# taskflow-API

> A RESTful Task Management API built with Node.js, Express & MongoDB — featuring JWT authentication, role-based task isolation, and global error handling.

## Setup & Run Locally

```bash
# 1. Clone & install
git clone https://github.com/<your-username>/taskflow-api.git
cd taskflow-api
npm install

# 2. Configure environment
cp .env.example .env       # edit values if needed

# 3. Start MongoDB (requires Docker)
docker-compose up -d

# 4. Start the server
npm run dev                # http://localhost:5000
```

### Environment Variables (`.env`)

```
MONGO_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

---

## API Documentation

**Base URL:** `http://localhost:5000/api`

Protected routes (🔒) require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint              | Body                                  | Response          |
| ------ | --------------------- | ------------------------------------- | ----------------- |
| POST   | `/api/auth/register`  | `{ "email": "...", "password": "..." }` | `201` — user data |
| POST   | `/api/auth/login`     | `{ "email": "...", "password": "..." }` | `200` — `{ token }` |

### User

| Method | Endpoint              | Auth | Response                |
| ------ | --------------------- | ---- | ----------------------- |
| GET    | `/api/users/profile`  | 🔒   | `200` — id, email, date |

### Tasks (all 🔒)

| Method | Endpoint           | Body                                                                  | Response               |
| ------ | ------------------ | --------------------------------------------------------------------- | ---------------------- |
| POST   | `/api/tasks`       | `{ "title": "...", "description?": "...", "dueDate?": "YYYY-MM-DD", "status?": "pending\|completed" }` | `201` — created task |
| GET    | `/api/tasks`       | —                                                                     | `200` — array of tasks |
| GET    | `/api/tasks/:id`   | —                                                                     | `200` — single task    |
| PATCH  | `/api/tasks/:id`   | Any subset of task fields (at least 1)                                | `200` — updated task   |
| DELETE | `/api/tasks/:id`   | —                                                                     | `200` — success msg    |

### Health

```
GET /api/health  →  { "status": "ok" }
```

### Error Codes

| Code  | Meaning                                              |
| ----- | ---------------------------------------------------- |
| `400` | Validation error / invalid ID format                 |
| `401` | Missing/invalid/expired token or wrong credentials   |
| `403` | Accessing another user's task                        |
| `404` | Resource not found                                   |
| `409` | Duplicate email                                      |
| `500` | Internal server error                                |

---

## Folder Structure

```
src/
├── config/         # DB connection (db.mongo.js)
├── middleware/      # auth.js, validate.js, errorHandler.js
├── models/          # Mongoose schemas (User, Task)
├── controllers/     # Business logic (auth, user, task)
├── routes/          # Route definitions
└── validators/      # Joi validation schemas
```

**Key design decisions:**
- **Layered architecture** — Routes → Validation → Auth → Controller → Model — each layer has one job.
- **Ownership isolation** — Every task query filters by `userId` from the JWT, so users can never access others' tasks.
- **Password security** — Hashed via bcrypt pre-save hook; `select: false` hides the hash from all queries by default.
- **Global error handler** — All errors flow through one middleware, producing a consistent JSON shape. Stack traces hidden in production.
