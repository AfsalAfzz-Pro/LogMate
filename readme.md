# LogMate

Click to expand your preferred version:

<details open>
<summary>👔 Professional Version</summary>

## 🚀 Overview

LogMate is a scalable, real-time log processing platform built with Django, React, Celery, Redis, and WebSockets. It enables users to upload large log files and receive structured, visual insights in real-time.

### ✅ Key Features

- Upload and process `.log`/`.txt` files (up to 50 MB)  
- Asynchronous processing using Celery & Redis  
- Real-time status updates with Django Channels & WebSockets  
- React-based frontend with animated statistics  
- Exportable insights and dynamic visualizations  
- Containerized deployment with Docker & Docker Compose  

### 🚀 Quick Start (Docker)

```bash
git clone https://github.com/AfsalAfzz-Pro/LogMate
cd logmate
docker-compose up
```

- **Frontend UI:** [http://localhost:5173](http://localhost:5173/)
- **Backend API:** [http://localhost:8000](http://localhost:8000/)

To stop:

```bash
docker-compose down
```

### 🧑‍💻 Manual Local Setup

**Backend:**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 logmate.asgi:application
```

**Celery Worker:**

```bash
celery -A logmate worker --loglevel=info --concurrency=4
```

**Frontend:**

```bash
cd logmate_frontend
npm install
npm run dev
```

### 🧩 Tech Stack

- Django (ASGI backend)
- Celery + Redis (task queue)
- React + Vite (frontend)
- Tailwind CSS (styling)
- WebSockets for real-time updates

### 🔌 API Endpoints

- `POST /upload/` – upload log file
- `GET /csrf-token/` – CSRF protection
- `GET /task_status/<task_id>/` – check processing status
- `WS /ws/logstatus/` – WebSocket real-time updates

### 📊 Architecture

1. Django backend receives and validates files
2. Celery workers process logs in the background
3. Redis broker coordinates tasks
4. WebSocket pushes live progress to the frontend
5. React displays final insights
</details>

<details>
<summary>🔥 Anime Version</summary>

# 🔥 LogMate: Super-Powered Log Processing App 🔥

![Goku Powering Up](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2lxdWp5MDhndnRxOTEyNXJobzZxMDNnZ3g5c3p3dzE4NXplaXE3cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/977YesTjNfQC7vQiph/giphy.gif)

> "The difference between ordinary and extraordinary is that little extra."  
> Just like how Goku trains at 100x gravity, this app processes logs at **extraordinary speed**!

## 💫 Power Levels (Overview)

This isn't your average log processor! LogMate harnesses the power of Django, Celery, Redis, and WebSockets to process log files with the speed of Instant Transmission. Upload a log file and watch in real-time as it analyzes patterns faster than Vegeta can say "It's over 9000!"

## 🐉 Summon The Dragon (Getting Started)

### 🧙‍♂️ Prerequisites (Power Level Requirements)

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)
- Git (to collect the Dragon Balls... er, code)

### 🐳 Fusion Technique: Docker Edition

```bash
git clone <repository-url>
cd logmate
docker-compose up
```

- Builds all containers
- Starts Redis messenger
- Powers up Django backend
- Activates Celery warriors
- Launches React frontend

**⚡ Access Your Power:**  
Frontend: [http://localhost:5173](http://localhost:5173/)  
Backend: [http://localhost:8000](http://localhost:8000/)

**🛑 Suppress Your Power Level:**

```bash
docker-compose down
```

**🔄 Rebuild (Training Arc):**

```bash
docker-compose down
docker-compose up --build
```

### 🥋 Manual Training Mode

#### Backend

```bash
cd logmate
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
redis-server
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 logmate.asgi:application
celery -A logmate worker --loglevel=info --concurrency=4
```

#### Frontend

```bash
cd logmate_frontend
npm install
npm run dev
```

## 📱 Frontend Magic

![UI Animation](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYms1eWsyc3d5eXV3eDVzMzV3M2U0ZWJkcWMwNGFmNWE5d2t1eHB3YiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/WOb8EeFziTQNE02WXs/giphy.gif)
- **App**: Master controller
- **LogUpload**: Portal for files
- **ProcessingStatus**: Energy gauge
- **TaskDetails**: Ki analyzer
- **ActionButtons**: Magical toolkit

## 🔮 Magical Endpoints

- `POST /upload/` – upload logs
- `GET /csrf-token/` – CSRF shield
- `GET /task_status/<task_id>/` – power level check
- `WS /ws/logstatus/` – instant updates

## 🏗️ Architecture

![System Architecture](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWQ1dHA0MmpiZWZpbHoxYjFzb3V2NHduMXc1ZTdhcGgxOXg3MmN0dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GRSnxyhJnPsaQy9YLn/giphy.gif)

1. **Django** = Kami
2. **Redis** = Whis
3. **Celery** = Saiyan squad
4. **React** = Chi UI

## 🔧 Troubleshooting

- Port conflicts → tweak `docker-compose.yml`
- Redis issues → `redis-cli ping` should return `PONG`
- Frontend errors → open your Scouter (dev console)

## 🚀 Future Power-Ups

- Multi-file upload
- Streamed log analysis
- User dashboards & auth
- Advanced visualizations

_Kamehameha your logs into actionable insights!_

**P.S.** I may not have watched every episode of Dragon Ball, but I do love anime—and I hope this makes the docs more fun!
</details>
