# TaskFlow API (Extended)

> A RESTful Task Management API built with Node.js, Express & MongoDB — featuring JWT authentication, real-time reminders, categorization, and external service integrations.

## Setup & Run Locally

```bash
# 1. Clone & install
git clone https://github.com/dhiraj-p-k/task-management-api-extended.git
cd taskflow-api
npm install

# 2. Configure environment
cp .env.example .env       # edit values if needed
# Note: Add REMINDER_WEBHOOK_URL and ANALYTICS_WEBHOOK_URL to .env for testing

# 3. Start MongoDB (requires Docker)
docker-compose up -d

# 4. Start the server
npm run dev                # http://localhost:5000
```

### Environment Variables (`.env`)

```text
MONGO_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development

# Webhook URLs (for testing, e.g., https://webhook.site/...)
REMINDER_WEBHOOK_URL=
ANALYTICS_WEBHOOK_URL=
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

| Method | Endpoint           | Body / Query                                                                  | Response               |
| ------ | ------------------ | ----------------------------------------------------------------------------- | ---------------------- |
| POST   | `/api/tasks`       | `{ "title": "...", "description?": "...", "dueDate?": "ISO8601", "status?": "...", "categoryId?": "ID", "tags?": ["..."] }` | `201` — created task |
| GET    | `/api/tasks`       | Query: `?categoryId=...&tags=tag1,tag2` (all optional)                         | `200` — array of tasks |
| GET    | `/api/tasks/:id`   | —                                                                             | `200` — single task    |
| PATCH  | `/api/tasks/:id`   | Any subset of task fields (at least 1)                                        | `200` — updated task   |
| DELETE | `/api/tasks/:id`   | —                                                                             | `200` — success msg    |

### Categories (all 🔒)

| Method | Endpoint              | Body                                  | Response          |
| ------ | --------------------- | ------------------------------------- | ----------------- |
| POST   | `/api/categories`     | `{ "name": "...", "description?": "..." }` | `201` — created category |
| GET    | `/api/categories`     | —                                     | `200` — array of categories |
| GET    | `/api/categories/:id` | —                                     | `200` — single category |
| PUT    | `/api/categories/:id` | `{ "name?": "...", "description?": "..." }` | `200` — updated category |
| DELETE | `/api/categories/:id` | —                                     | `200` — success msg |

### Health

```text
GET /api/health  →  { "status": "ok" }
```

---

## Design Choices

### 1. Task Categorization & Tags
- **Dynamic Categorization**: I chose to implement **user-defined categories** rather than pre-defined ones. This offers maximum flexibility, allowing users to tailor the system to their specific workflows (e.g., "Freelance", "Household", "Gym"). To maintain order, I implemented a unique constraint on the category name per user.
- **Free-form Tags**: Tags are implemented as a simple array of strings. This allows for lightweight, unstructured metadata that can be easily queried using MongoDB's `$all` operator, enabling users to filter tasks by multiple tags simultaneously.

### 2. Real-time Reminders (Scheduling)
- **Agenda.js**: For scheduling reminders, I selected **Agenda.js**. Unlike `setTimeout`, Agenda is backed by MongoDB, meaning scheduled jobs persist even if the server restarts.
- **Automatic Lifecycle**: 
  - **Create/Update**: When a `dueDate` is set or changed, the system calculates the reminder time (1 hour prior) and uses Agenda's `schedule` method with a unique `taskId` filter to upsert the job.
  - **Completion/Deletion**: If a task is marked `completed` or deleted, the associated job is automatically removed from the queue to prevent "ghost" notifications.

### 3. External Service Integration (Webhooks)
- **Reliable Delivery**: On task completion, an external analytics service is notified via a POST request.
- **Retry Logic**: To handle intermittent network issues or external service downtime, I implemented a custom `WebhookService` using `axios` that features **exponential backoff**. If a request fails, the system waits (1s, 2s, 4s) before retrying, up to a maximum of 3 attempts.

---

## Folder Structure

```text
src/
├── config/         # DB connection (db.mongo.js)
├── middleware/      # auth.js, validate.js, errorHandler.js
├── models/          # Mongoose schemas (User, Task, Category)
├── controllers/     # Business logic (auth, user, task, category)
├── routes/          # Route definitions
├── services/        # External logic (agenda, webhook)
└── validators/      # Joi validation schemas
```
