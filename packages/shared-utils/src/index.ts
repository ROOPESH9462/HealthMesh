import { z } from 'zod';

// ====================================================
// ERROR CODES
// ====================================================
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  APPOINTMENT_SLOT_UNAVAILABLE = 'APPOINTMENT_SLOT_UNAVAILABLE',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
}

// ====================================================
// CUSTOM APPLICATION ERROR CLASSES
// ====================================================
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly errorCode: ErrorCode;

  constructor(message: string, statusCode: number, errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;

    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', errorCode: ErrorCode = ErrorCode.VALIDATION_FAILED) {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', errorCode: ErrorCode = ErrorCode.UNAUTHORIZED) {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission denied', errorCode: ErrorCode = ErrorCode.FORBIDDEN) {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode: ErrorCode = ErrorCode.NOT_FOUND) {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict detected', errorCode: ErrorCode = ErrorCode.CONFLICT) {
    super(message, 409, errorCode);
  }
}

// ====================================================
// STANDARDISED API RESPONSE FORMATTER
// ====================================================
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  code?: string;
  data?: T;
  meta?: IPaginationMeta | any;
  errors?: any;
}

export function formatSuccessResponse<T>(message: string, data?: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
    errors: null
  };
}

export function formatErrorResponse(message: string, errors?: any, errorCode?: string): ApiResponse<null> {
  return {
    success: false,
    message,
    code: errorCode || ErrorCode.INTERNAL_ERROR,
    data: undefined,
    errors
  };
}

// ====================================================
// VALDATION SCHEMAS (ZOD)
// ====================================================

// Passwords must be at least 8 chars and contain uppercase, lowercase, number, and special char
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST', 'LAB_STAFF', 'RECEPTIONIST']),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid E.164 phone number').optional()
});

export const appointmentBookingSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  patientId: z.string().optional(), // Optional, receptionist can book on behalf of patient
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'Time slot selection is required'),
  symptomsDescription: z.string().max(500, 'Symptoms description cannot exceed 500 characters').optional()
});

export const appointmentRescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1, 'Time slot selection is required')
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required').max(1000)
});

export const getSlotsQuerySchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

export const medicineCreateSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  manufacturer: z.string().min(1, 'Manufacturer name is required'),
  composition: z.array(z.string()).min(1, 'At least one composition chemical is required'),
  dosageForm: z.enum(['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'CREAM', 'OTHER']),
  strength: z.string().min(1, 'Strength is required (e.g. 500mg)'),
  stockCount: z.number().int().nonnegative('Stock count cannot be negative'),
  pricePerUnit: z.number().positive('Price per unit must be greater than zero'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  lowStockThreshold: z.number().int().positive('Threshold must be a positive integer'),
  barcode: z.string().optional()
});

export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 1-0-1)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., After food)'),
  duration: z.string().min(1, 'Duration is required (e.g., 5 days)')
});

export const prescriptionCreateSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  medicines: z.array(prescriptionItemSchema).min(1, 'Prescription must contain at least one medicine'),
  instructions: z.string().max(1000, 'Instructions cannot exceed 1000 characters').optional()
});

export const medicalDocumentCreateSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  documentType: z.enum(['BLOOD_TEST', 'X_RAY', 'MRI', 'CT_SCAN', 'OTHER']),
  title: z.string().min(1, 'Title is required'),
  fileUrl: z.string().url('File URL must be a valid link')
});

// ====================================================
// CLINICAL AI THRESHOLDS & BOUNDS
// ====================================================
export const AI_CONFIDENCE_THRESHOLDS = {
  SYMPTOM_CHECKER: 0.60, // 60% confidence
  PRESCRIPTION_OCR: 0.75, // 75% confidence
  CHATBOT: 0.40,          // 40% confidence
  XRAY_CLASSIFIER: 0.80  // 80% confidence
};

// ====================================================
// COMMON DATE UTILITIES
// ====================================================
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function getDaysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  const difference = Math.abs(d1 - d2);
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}
