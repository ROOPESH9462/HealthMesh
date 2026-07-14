# Installation and Deployment Guide

This document explains how to set up, build, and deploy the AI Healthcare Management Platform.

---

## 1. Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- Python (3.10+)
- MongoDB (running locally or via Atlas)
- Redis Server (running locally)

---

## 2. Local Setup and Seeding

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/username/AI-Healthcare-Management-Platform.git
   cd AI-Healthcare-Management-Platform
   ```

2. **Configure Environment Variables**:
   Create a `.env` file at the root:
   ```env
   MONGO_URI=mongodb://localhost:27017/healthcare_management_db
   REDIS_URL=redis://localhost:6379
   JWT_ACCESS_SECRET=your_jwt_access_secret_key_change_me
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_me
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Seed Database Mock Records**:
   ```bash
   npm run seed --workspace=apps/backend
   ```

5. **Start Services (Development mode)**:
   - Backend gateway: `npm run dev --workspace=apps/backend`
   - Frontend client: `npm run dev --workspace=apps/frontend`
   - Python AI service:
     ```bash
     cd apps/ai-service
     pip install -r requirements.txt
     python run.py
     ```

---

## 3. Docker Compose Deployment

To deploy the entire platform (including database, cache, and services) with a single command:

```bash
docker-compose up --build
```

The services will mount under:
- Frontend Client: `http://localhost` (port 80)
- Backend gateway: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`
