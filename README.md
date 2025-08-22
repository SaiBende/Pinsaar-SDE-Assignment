# DropLater — Take-Home Assignment

A small service where users create **notes** that get delivered to a webhook **at/after a scheduled time**.
Guarantees **exactly-once delivery** via idempotency keys, with **retries + exponential backoff** on failure.

**Stack:** Node.js + Express • MongoDB • Redis (Bull/BullMQ) • React (Admin) • Docker & Compose

---

## 📦 Project Structure

```
/api     → Express API (create, list, replay notes)
/worker  → Queue worker (delivers notes)
/sink    → Webhook receiver for testing
/admin   → React admin UI
```

**Ports**

* API: `8000`
* Admin: `5173`
* Sink: `4000`
* Mongo: `27017`
* Redis: `6379`
* Worker: no exposed port

---

## ⚙️ Prerequisites

* Docker & Docker Compose installed

---

## 🚀 Quick Start (Docker)

1. **Create a `.env` at the repo root** (same level as `docker-compose.yml`):

   ```env
   # Database & Cache
   MONGO_URI=mongodb://mongo:27017/droplater
   REDIS_URL=redis://redis:6379

   # API
   PORT=8000
   ADMIN_TOKEN=supersecret

   # Worker
   WORKER_CONCURRENCY=5

   # Sink
   SINK_PORT=4000
   ```

2. **Start everything**

   ```bash
   docker-compose up --build
   ```

   This brings up: Mongo, Redis, API, Worker, Sink, and Admin.

3. **Open the Admin UI**

   * [http://localhost:5173](http://localhost:5173)

---

## 🔎 Health Check

```bash
curl http://localhost:8000/health
# → { "ok": true }
```

---

## ✍️ Create & Manage Notes

> **Important:** When running in Docker, set `webhookUrl` to `http://sink:4000/sink`
> (use the **service name** `sink`, not `localhost`, so containers can talk to each other).

### Create a note

```bash
curl -X POST http://localhost:8000/api/notes \
  -H "Authorization: Bearer supersecret" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello",
    "body": "Ship me later",
    "releaseAt": "2025-01-01T00:00:10.000Z",
    "webhookUrl": "http://sink:4000/sink"
  }'
```

### List notes (paginated, 20/page)

```bash
curl -H "Authorization: Bearer supersecret" \
"http://localhost:8000/api/notes?status=pending&page=1"
```

### Replay a failed/dead note

```bash
curl -X POST \
  -H "Authorization: Bearer supersecret" \
"http://localhost:8000/api/notes/<id>/replay"
```

---

## 🌐 Admin UI

* Visit **[http://localhost:5173](http://localhost:5173)**
* Create notes (title, body, releaseAt, webhookUrl)
* View statuses, last attempt code, and **Replay** failed/dead notes

---

## 🧰 Development (without Docker)

```bash
# Run MongoDB & Redis yourself (or via Docker), then:

# API
cd api && npm install && npm run dev

# Worker
cd worker && npm install && npm run dev

# Sink
cd sink && npm install && npm run dev

# Admin
cd admin && npm install && npm run dev
```

Update local envs to use:

```
MONGO_URI=mongodb://localhost:27017/droplater
REDIS_URL=redis://localhost:6379
```

---

## 🛠️ Troubleshooting

* **Notes stay failed / dead**
  Check that `webhookUrl` is `http://sink:4000/sink` (not `http://localhost:4000/sink`) when using Docker.

* **Check worker logs**

  ```bash
  docker logs -f worker
  ```

* **Reset everything**

  ```bash
  docker-compose down -v --rmi all --remove-orphans
  docker-compose up --build
  ```

---

## ✅ Acceptance (Self-Check)

* `docker-compose up` starts api, worker, mongo, redis, sink, admin
* `GET /health` → `200 { ok: true }`
* Past `releaseAt` delivers promptly
* Retries with backoff, marks **dead** after max attempts
* **Replay** works
* Idempotency ensures exactly-once at the sink
* API is rate-limited (expect 429 on spam)

---


 ## 📹 Demo & Extras
 * Screencast: *https://www.loom.com/share/54adc918ae754530bdad103cb5e89f27?sid=c0f36143-eedc-49d5-834f-e50f3936f89a*
 * Architecture sketch: *![alt text](<Img1.jpg>)
 ![alt text](<Img2.jpg>)*
 * Debug diary: *
 to fastly and quickly test my Use the commands
 first docker-compose up
 when it is running, use in terminal ./test.ps1   as per my test given*