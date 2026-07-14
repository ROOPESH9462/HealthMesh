# Platform Security Architecture

This document describes the security protocols and access controls implemented across the AI Healthcare Management Platform.

---

## 1. Authentication & Session Security

- **JWT Auth**: Client sessions are verified using JSON Web Tokens (JWT) signed with secure encryption keys.
- **Refresh Token Rotation (RTR)**:
  - Access tokens expire every 15 minutes.
  - Refresh tokens are rotated on every token refresh request.
  - Revoked or reused refresh tokens automatically trigger session de-authorization cascades, deactivating all active sessions for the associated account to prevent replay attacks.
- **Account Lockouts**: Accounts are temporarily locked for 15 minutes after 5 consecutive failed login attempts to prevent brute-force attacks.

---

## 2. Authorization (RBAC)

Access to REST APIs and database mutations is restricted by Role-Based Access Control (RBAC):

| Role | Permissions |
| :--- | :--- |
| **PATIENT** | Book visits, read own records/prescriptions, check symptoms, chat with AI |
| **DOCTOR** | Access clinic appointments list, write prescriptions, view diagnosis heatmaps |
| **RECEPTIONIST** | Manage appointments lists, upload laboratory documents, assign patients |
| **PHARMACIST** | Access medications inventory lists, fulfill prescriptions, review stock counts |
| **ADMIN** | System configurations, access audit registries, view analytics, manage toggles |

---

## 3. Data Protection & Defense

- **Password Hashing**: User credentials are encrypted using `bcrypt` with a work factor cost of 12 rounds.
- **Helmet**: Express gateway security headers are configured using `helmet` middleware.
- **Soft Deletes**: Critical clinical records and user accounts are soft-deleted rather than hard-removed from database tables, preventing accidental data loss.
