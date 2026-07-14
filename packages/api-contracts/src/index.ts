import { IUser, IDoctor, IPatient, IAppointment, IMedicine, IPrescription, IMedicalDocument, IBill, IPayment, INotification, IAIPrediction, UserRole } from '@healthcare/shared-types';

// ====================================================
// DTO DEFINITIONS (Data Transfer Objects)
// ====================================================

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface DoctorDTO {
  id: string;
  userId: string;
  user?: UserDTO;
  specialization: string;
  departmentId: string;
  qualification: string[];
  experienceYears: number;
  consultationFee: number;
  availableDays: string[];
  timeSlots: string[];
  isActive: boolean;
}

export interface PatientDTO {
  id: string;
  userId: string;
  user?: UserDTO;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  allergies?: string[];
  medicalConditions?: string[];
}

export interface AppointmentDTO {
  id: string;
  patientId: string;
  patient?: PatientDTO;
  doctorId: string;
  doctor?: DoctorDTO;
  date: Date;
  timeSlot: string;
  status: string;
  symptomsDescription?: string;
  cancellationReason?: string;
  createdAt: Date;
}

export interface SlotDTO {
  timeSlot: string;
  isAvailable: boolean;
}

export interface MedicineDTO {
  id: string;
  name: string;
  manufacturer: string;
  composition: string[];
  dosageForm: string;
  strength: string;
  stockCount: number;
  pricePerUnit: number;
  expiryDate: Date;
  lowStockThreshold: number;
  barcode?: string;
}

export interface PrescriptionDTO {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medicines: Array<{
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string;
  isFilled: boolean;
  issuedDate: Date;
}

export interface MedicalDocumentDTO {
  id: string;
  patientId: string;
  doctorId?: string;
  documentType: string;
  title: string;
  fileUrl: string;
  uploadDate: Date;
  summary?: string;
  abnormalitiesHighlighted?: string[];
  isVerifiedByDoctor: boolean;
}

export interface BillDTO {
  id: string;
  patientId: string;
  appointmentId?: string;
  prescriptionId?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  taxAmount: number;
  totalAmount: number;
  insuranceCoveredAmount: number;
  netPayableAmount: number;
  status: string;
  createdAt: Date;
}

export interface PaymentDTO {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  status: string;
  createdAt: Date;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AIPredictionDTO {
  id: string;
  modelType: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  confidenceScore?: number;
  isReviewedByDoctor: boolean;
  reviewedNotes?: string;
  createdAt: Date;
}

// ====================================================
// CONVERSION MAPPERS
// ====================================================

export function mapUserToDTO(user: IUser): UserDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt
  };
}

export function mapDoctorToDTO(doctor: IDoctor): DoctorDTO {
  return {
    id: doctor.id,
    userId: doctor.userId,
    user: doctor.user ? mapUserToDTO(doctor.user) : undefined,
    specialization: doctor.specialization,
    departmentId: doctor.departmentId,
    qualification: doctor.qualification,
    experienceYears: doctor.experienceYears,
    consultationFee: doctor.consultationFee,
    availableDays: doctor.availableDays,
    timeSlots: doctor.timeSlots,
    isActive: doctor.isActive
  };
}

export function mapPatientToDTO(patient: IPatient): PatientDTO {
  return {
    id: patient.id,
    userId: patient.userId,
    user: patient.user ? mapUserToDTO(patient.user) : undefined,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    address: patient.address,
    allergies: patient.allergies,
    medicalConditions: patient.medicalConditions
  };
}

export function mapAppointmentToDTO(appt: IAppointment): AppointmentDTO {
  return {
    id: appt.id,
    patientId: appt.patientId,
    patient: appt.patient ? mapPatientToDTO(appt.patient) : undefined,
    doctorId: appt.doctorId,
    doctor: appt.doctor ? mapDoctorToDTO(appt.doctor) : undefined,
    date: appt.date,
    timeSlot: appt.timeSlot,
    status: appt.status,
    symptomsDescription: appt.symptomsDescription,
    cancellationReason: appt.cancellationReason,
    createdAt: appt.createdAt
  };
}

export function mapMedicineToDTO(med: IMedicine): MedicineDTO {
  return {
    id: med.id,
    name: med.name,
    manufacturer: med.manufacturer,
    composition: med.composition,
    dosageForm: med.dosageForm,
    strength: med.strength,
    stockCount: med.stockCount,
    pricePerUnit: med.pricePerUnit,
    expiryDate: med.expiryDate,
    lowStockThreshold: med.lowStockThreshold,
    barcode: med.barcode
  };
}

export function mapPrescriptionToDTO(prescription: IPrescription): PrescriptionDTO {
  return {
    id: prescription.id,
    appointmentId: prescription.appointmentId,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    medicines: prescription.medicines.map((m: any) => ({
      medicineId: m.medicineId,
      medicineName: m.medicineName,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
    })),
    instructions: prescription.instructions,
    isFilled: prescription.isFilled,
    issuedDate: prescription.issuedDate
  };
}

export function mapBillToDTO(bill: IBill): BillDTO {
  return {
    id: bill.id,
    patientId: bill.patientId,
    appointmentId: bill.appointmentId,
    prescriptionId: bill.prescriptionId,
    items: bill.items.map((i: any) => ({
      description: i.description,
      amount: i.amount
    })),
    taxAmount: bill.taxAmount,
    totalAmount: bill.totalAmount,
    insuranceCoveredAmount: bill.insuranceCoveredAmount,
    netPayableAmount: bill.netPayableAmount,
    status: bill.status,
    createdAt: bill.createdAt
  };
}

export function mapMedicalDocumentToDTO(doc: IMedicalDocument): MedicalDocumentDTO {
  return {
    id: doc.id,
    patientId: doc.patientId,
    doctorId: doc.doctorId,
    documentType: doc.documentType,
    title: doc.title,
    fileUrl: doc.fileUrl,
    uploadDate: doc.uploadDate,
    summary: doc.summary,
    abnormalitiesHighlighted: doc.abnormalitiesHighlighted,
    isVerifiedByDoctor: doc.isVerifiedByDoctor
  };
}
