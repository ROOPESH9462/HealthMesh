# Database Design

Collections

## Users

- _id
- name
- email
- password
- role
- phone

---

## Doctors

- doctorId
- specialization
- experience
- availability

---

## Patients

- patientId
- age
- bloodGroup
- allergies

---

## Appointments

- patientId
- doctorId
- date
- status

---

## Prescriptions

- doctorId
- patientId
- medicines

---

## Bills

- patientId
- amount
- paymentStatus

---

## Medicines

- medicineName
- quantity
- expiry

---

## Reports

- patientId
- file
- summary