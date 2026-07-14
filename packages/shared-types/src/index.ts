// ====================================================
// ROLES & ACCESS CONTROL
// ====================================================
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  PHARMACIST = 'PHARMACIST',
  LAB_STAFF = 'LAB_STAFF',
  RECEPTIONIST = 'RECEPTIONIST'
}

// ====================================================
// USER TYPES
// ====================================================
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isValid: boolean;
  createdAt: Date;
}

// ====================================================
// CLINICAL ENTITIES
// ====================================================
export interface IDoctor {
  id: string;
  userId: string;
  user?: IUser;
  specialization: string;
  departmentId: string;
  qualification: string[];
  experienceYears: number;
  consultationFee: number;
  availableDays: string[]; // e.g. ["Monday", "Wednesday"]
  timeSlots: string[]; // e.g. ["09:00 - 09:30", "10:00 - 10:30"]
  isActive: boolean;
}

export interface IPatient {
  id: string;
  userId: string;
  user?: IUser;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  medicalConditions?: string[];
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export interface IAppointment {
  id: string;
  patientId: string;
  patient?: IPatient;
  doctorId: string;
  doctor?: IDoctor;
  date: Date; // date without time
  timeSlot: string; // e.g., "09:00 - 09:30"
  status: AppointmentStatus;
  symptomsDescription?: string;
  cancellationReason?: string;
  createdAt: Date;
}

// ====================================================
// PHARMACY & INVENTORY
// ====================================================
export interface IMedicine {
  id: string;
  name: string;
  manufacturer: string;
  composition: string[];
  dosageForm: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'CREAM' | 'OTHER';
  strength: string; // e.g. "500mg"
  stockCount: number;
  pricePerUnit: number;
  expiryDate: Date;
  supplierName?: string;
  supplierContact?: string;
  lowStockThreshold: number;
  barcode?: string;
}

export interface IPrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;      // e.g. "1-0-1"
  frequency: string;   // e.g. "After food"
  duration: string;    // e.g. "5 days"
}

export interface IPrescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medicines: IPrescriptionItem[];
  instructions?: string;
  isFilled: boolean;
  issuedDate: Date;
}

// ====================================================
// LABORATORY & REPORTS
// ====================================================
export enum DocumentType {
  BLOOD_TEST = 'BLOOD_TEST',
  X_RAY = 'X_RAY',
  MRI = 'MRI',
  CT_SCAN = 'CT_SCAN',
  OTHER = 'OTHER'
}

export interface IMedicalDocument {
  id: string;
  patientId: string;
  doctorId?: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  uploadDate: Date;
  summary?: string;
  abnormalitiesHighlighted?: string[];
  isVerifiedByDoctor: boolean;
}

// ====================================================
// BILLING & PAYMENTS
// ====================================================
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface IBill {
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
  status: PaymentStatus;
  createdAt: Date;
}

export interface IPayment {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: 'STRIPE' | 'UPI' | 'CASH';
  stripePaymentIntentId?: string;
  status: PaymentStatus;
  createdAt: Date;
}

// ====================================================
// REAL-TIME & NOTIFICATIONS
// ====================================================
export enum NotificationChannel {
  WEBSOCKET = 'WEBSOCKET',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel[];
  isRead: boolean;
  createdAt: Date;
}

// ====================================================
// AUDIT & SYSTEM LOGS
// ====================================================
export interface IActivityLog {
  id: string;
  userId?: string;
  userRole?: UserRole;
  action: string;
  entity: string; // e.g. "Appointment"
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: Date;
}

// ====================================================
// AI AND PREDICTIONS
// ====================================================
export enum AIModelType {
  SYMPTOM_CHECKER = 'SYMPTOM_CHECKER',
  PRESCRIPTION_OCR = 'PRESCRIPTION_OCR',
  CHATBOT = 'CHATBOT',
  XRAY_CLASSIFIER = 'XRAY_CLASSIFIER'
}

export interface IAIPrediction {
  id: string;
  userId?: string;
  modelType: AIModelType;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  confidenceScore?: number;
  isReviewedByDoctor: boolean;
  reviewedDoctorId?: string;
  reviewedNotes?: string;
  createdAt: Date;
}
