# REST API Documentation

Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/profile

---

Appointments

GET /appointments

POST /appointments

PUT /appointments/:id

DELETE /appointments/:id

---

Doctors

GET /doctors

GET /doctors/:id

---

Patients

GET /patients

POST /patients

PUT /patients/:id

---

Billing

POST /billing

GET /billing/:id

---

AI

POST /predict-disease

POST /ocr

POST /summarize-report

POST /chatbot

POST /xray-detection