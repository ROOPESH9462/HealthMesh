import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: '../../.env' });

import UserModel from '../modules/auth/User.model';
import DoctorModel from '../modules/doctor/Doctor.model';
import PatientModel from '../modules/patient/Patient.model';
import AppointmentModel from '../modules/appointment/Appointment.model';
import PrescriptionModel from '../modules/appointment/Prescription.model';
import BillModel from '../modules/billing/Bill.model';
import MedicineModel from '../modules/pharmacy/Medicine.model';
import MedicalDocumentModel from '../modules/lab/MedicalDocument.model';
import AIPredictionModel from '../modules/ai/AIPrediction.model';
import { UserRole, AppointmentStatus, PaymentStatus } from '@healthcare/shared-types';

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_management_db';
const SALT_ROUNDS = 12;

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB.');

  // Clear existing databases collections
  console.log('Clearing existing collections...');
  await UserModel.deleteMany({});
  await DoctorModel.deleteMany({});
  await PatientModel.deleteMany({});
  await AppointmentModel.deleteMany({});
  await PrescriptionModel.deleteMany({});
  await BillModel.deleteMany({});
  await MedicineModel.deleteMany({});
  await MedicalDocumentModel.deleteMany({});
  await AIPredictionModel.deleteMany({});
  console.log('Collections cleared.');

  // Hash password
  const passwordHash = await bcrypt.hash('Password@123', SALT_ROUNDS);

  // 1. Seed Admins
  console.log('Seeding administrative users...');
  await UserModel.create({
    email: 'admin@healthcare.com',
    passwordHash,
    role: UserRole.ADMIN,
    firstName: 'Super',
    lastName: 'Administrator',
    isEmailVerified: true
  });

  // 2. Seed Receptionists
  console.log('Seeding receptionist users...');
  await UserModel.create({
    email: 'receptionist1@healthcare.com',
    passwordHash,
    role: UserRole.RECEPTIONIST,
    firstName: 'Jane',
    lastName: 'Doe',
    isEmailVerified: true
  });

  // 3. Seed Pharmacists
  console.log('Seeding pharmacist users...');
  await UserModel.create({
    email: 'pharmacist@healthcare.com',
    passwordHash,
    role: UserRole.PHARMACIST,
    firstName: 'Alice',
    lastName: 'Smith',
    isEmailVerified: true
  });

  // 4. Seed Doctors
  console.log('Seeding doctor and clinician users...');
  const specialties = ['Cardiology', 'Pulmonology', 'General Medicine', 'Neurology', 'Pediatrics'];
  const doctorDocs = [];
  for (let i = 0; i < specialties.length; i++) {
    const userDoc = await UserModel.create({
      email: `doctor${i + 1}@healthcare.com`,
      passwordHash,
      role: UserRole.DOCTOR,
      firstName: `Dr. Clinician`,
      lastName: `${i + 1}`,
      isEmailVerified: true
    });

    const docProfile = await DoctorModel.create({
      userId: userDoc._id,
      specialization: specialties[i],
      departmentId: `DEP-00${i + 1}`,
      qualification: ['MD', 'MBBS'],
      experienceYears: 5 + i,
      consultationFee: 500 + i * 100,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['09:00 - 09:30', '10:00 - 10:30', '11:00 - 11:30', '14:00 - 14:30', '15:00 - 15:30'],
      isActive: true
    });
    doctorDocs.push(docProfile);
  }

  // 5. Seed Patients
  console.log('Seeding patient users...');
  const patientsList = [];
  for (let i = 0; i < 30; i++) {
    const userDoc = await UserModel.create({
      email: `patient${i + 1}@healthcare.com`,
      passwordHash,
      role: UserRole.PATIENT,
      firstName: `Patient_${i + 1}`,
      lastName: `User`,
      isEmailVerified: true
    });

    const patientProfile = await PatientModel.create({
      userId: userDoc._id,
      dateOfBirth: new Date(1975 + i, i % 12, 10 + i),
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      bloodGroup: i % 4 === 0 ? 'O+' : i % 4 === 1 ? 'A+' : i % 4 === 2 ? 'B+' : 'AB+',
      address: `Mock housing block #${i + 1}, Healthcare City`,
      emergencyContact: {
        name: `Emergency Contact ${i + 1}`,
        relationship: 'Spouse',
        phone: `98765432${i.toString().padStart(2, '0')}`
      },
      allergies: ['Penicillin', 'Dust'],
      medicalConditions: ['Hypertension']
    });
    patientsList.push(patientProfile);
  }

  // 6. Seed Medicines inventory
  console.log('Seeding pharmacy medications catalog...');
  const medicines = [
    { name: 'Metformin', category: 'Diabetes', pricePerUnit: 15, stockCount: 120, barcode: '8901234567890', manufacturer: 'Cipla', composition: ['Metformin Hydrochloride'], dosageForm: 'TABLET', strength: '500mg' },
    { name: 'Atorvastatin', category: 'Cholesterol', pricePerUnit: 25, stockCount: 8, barcode: '8901234567891', manufacturer: 'Pfizer', composition: ['Atorvastatin Calcium'], dosageForm: 'TABLET', strength: '10mg' }, // Low stock
    { name: 'Amlodipine', category: 'Blood Pressure', pricePerUnit: 9, stockCount: 200, barcode: '8901234567892', manufacturer: 'Sun Pharma', composition: ['Amlodipine Besylate'], dosageForm: 'TABLET', strength: '5mg' },
    { name: 'Paracetamol', category: 'General', pricePerUnit: 3, stockCount: 500, barcode: '8901234567893', manufacturer: 'GSK', composition: ['Paracetamol'], dosageForm: 'TABLET', strength: '650mg' },
    { name: 'Amoxicillin', category: 'Antibiotic', pricePerUnit: 18, stockCount: 4, barcode: '8901234567894', manufacturer: 'Abbott', composition: ['Amoxicillin Trihydrate'], dosageForm: 'CAPSULE', strength: '250mg' }, // Low stock
    { name: 'Ibuprofen', category: 'Painkiller', pricePerUnit: 5, stockCount: 300, barcode: '8901234567895', manufacturer: 'AstraZeneca', composition: ['Ibuprofen'], dosageForm: 'TABLET', strength: '400mg' }
  ];

  const medDocs = [];
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);

  for (const med of medicines) {
    const medDoc = await MedicineModel.create({
      ...med,
      expiryDate,
      isDeleted: false
    });
    medDocs.push(medDoc);
  }

  // 7. Seed Appointments & Invoices
  console.log('Seeding appointments history log...');
  for (let i = 0; i < 20; i++) {
    const patient = patientsList[i % patientsList.length];
    const doctor = doctorDocs[i % doctorDocs.length];
    const date = new Date();
    date.setDate(date.getDate() - (i % 7)); // past few days

    const appt = await AppointmentModel.create({
      patientId: patient._id,
      doctorId: doctor._id,
      date,
      timeSlot: '10:00 - 10:30',
      status: i % 3 === 0 ? AppointmentStatus.COMPLETED : i % 3 === 1 ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED,
      symptomsDescription: 'Chronic dry cough and mild fever symptoms.'
    });

    // Seed Bills/Invoices for completed appointments
    if (appt.status === AppointmentStatus.COMPLETED) {
      const totalAmount = doctor.consultationFee + 120 + i * 10 + 50;
      await BillModel.create({
        appointmentId: appt._id,
        patientId: patient._id,
        items: [
          { description: 'Consultation Fee', amount: doctor.consultationFee },
          { description: 'Medication Charges', amount: 120 + i * 10 },
          { description: 'Other Charges', amount: 50 }
        ],
        taxAmount: 0,
        totalAmount,
        insuranceCoveredAmount: 0,
        netPayableAmount: totalAmount,
        status: i % 2 === 0 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING
      });

      // Seed Prescription
      await PrescriptionModel.create({
        appointmentId: appt._id,
        patientId: patient._id,
        doctorId: doctor._id,
        medicines: [
          {
            medicineId: medDocs[0]._id,
            medicineName: medDocs[0].name,
            dosage: '1-0-1',
            frequency: 'After food',
            duration: '5 days'
          }
        ],
        instructions: 'Drink plenty of warm water and rest well.',
        isFilled: true
      });
    }
  }

  // 8. Seed AI predictions
  console.log('Seeding AI prediction logs...');
  for (let i = 0; i < 10; i++) {
    const patient = patientsList[i % patientsList.length];
    await AIPredictionModel.create({
      patientId: patient._id,
      modelName: 'XGBoost Symptom Classifier',
      modelVersion: 'v1.4.2',
      confidence: 0.85 - i * 0.03,
      executionTimeMs: 12 + i * 2,
      prediction: i % 2 === 0 ? 'Hypertension Risk Detected' : 'Diabetes Suspect Alert',
      status: 'COMPLETED'
    });
  }

  console.log('Database seeding operation completed successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
