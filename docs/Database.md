# Database Schema and Indices

This document describes the MongoDB collections, field relationships, and indexing strategies used in the platform.

---

## 1. Collections & Relationships

- **User**:
  - Properties: `email` (unique, indexed), `passwordHash`, `role` (enum: ADMIN, DOCTOR, PATIENT, etc.), `isDeleted`, `isLocked`.
- **Doctor**:
  - Properties: `userId` (references User), `specialization`, `consultationFee`, `licenseNumber`.
- **Patient**:
  - Properties: `userId` (references User), `dateOfBirth`, `gender`, `bloodType`, `medicalConditions`.
- **Appointment**:
  - Properties: `patientId` (references Patient), `doctorId` (references Doctor), `date`, `timeSlot`, `status`.
- **Prescription**:
  - Properties: `appointmentId` (references Appointment, unique), `patientId`, `doctorId`, `medicines` array, `instructions`.
- **Consultation**:
  - Properties: `appointmentId` (references Appointment, unique), `doctorId`, `patientId`, `durationSeconds`, `messages` array (session chats).
- **Bill**:
  - Properties: `appointmentId`, `patientId`, `doctorId`, `consultationFee`, `medicineCharges`, `totalAmount`, `status` (PAID/UNPAID).
- **Medicine**:
  - Properties: `name`, `category`, `price`, `quantity`, `expiryDate` (indexed).
- **MedicalDocument**:
  - Properties: `patientId`, `doctorId` (optional), `documentType`, `fileUrl`, `isVerifiedByDoctor` (boolean).
- **AIPrediction**:
  - Properties: `patientId`, `modelName`, `confidence`, `prediction`, `status`.

---

## 2. Indexing Strategy

To keep query latencies low under concurrent reads:
- **Unique Indexes**:
  - `User.email`
  - `Prescription.appointmentId`
  - `Consultation.appointmentId`
- **Query Filters Indexes**:
  - `Appointment` compound index: `{ doctorId: 1, date: 1 }` to fetch daily schedules quickly.
  - `Medicine` index: `{ expiryDate: 1 }` to scan expiring medications.
  - `AIPrediction` index: `{ patientId: 1 }` to load historical diagnostic logs.
