# System Architecture Document

This document outlines the technical design, architectural patterns, and communication structures of the AI Healthcare Management Platform.

---

## 1. Monorepo Structure

The platform is configured as a type-safe npm workspaces monorepo:

```text
├── apps/
│   ├── backend/          # Express API Gateway & Business Logic
│   ├── frontend/         # React SPA dashboard workstation
│   └── ai-service/       # FastAPI Python inference service
├── packages/
│   ├── shared-types/     # Shared TS typings & database schemas DTOs
│   ├── shared-utils/     # Common helper libraries (HTTP, exceptions)
│   └── api-contracts/    # Reusable mapper contracts
```

### Benefits of the Monorepo Design
- **Single Source of Truth**: Shared types and schema validation files prevent contract drifting.
- **Atomic Commits**: Code changes spanning contracts and services are modified in single commits.

---

## 2. System Architecture Topology

The application leverages a modular service-oriented architecture:

```text
       ┌──────────────┐
       │ React Client │
       └──────┬───────┘
              │ WebRTC / Socket.IO / REST HTTP
              ▼
    ┌──────────────────┐
    │ Express Backend  │
    └────┬─────────┬───┘
         │         │ REST HTTP
         │         ▼
         │   ┌────────────┐
         │   │ AI Service │ (FastAPI Python)
         │   └────────────┘
         ▼
 ┌───────────────┐
 │ MongoDB/Redis │
 └───────────────┘
```

---

## 3. Communication Protocols

- **REST APIs**: Used for resource CRUD utilities, auth handshakes, and analytics aggregations.
- **Socket.IO**: Acts as the signaling broker for WebRTC, transmitting session text chat logs, and broadcasting connection statuses.
- **WebRTC**: Peer-to-peer media streams transmission (video/audio) establishing secure, encrypted consultations directly between clinician and patient browsers.

---

## 4. Background Processing Queue

For compute-heavy inference processing:
1. Patient uploads diagnostic files.
2. The backend registers the document and pushes a job payload to **BullMQ**.
3. **BullMQ** worker pulls the job, relays files to the **FastAPI AI service**, updates prediction logs in MongoDB, and triggers real-time updates via Socket.IO.
