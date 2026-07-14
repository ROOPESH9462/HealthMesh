import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import { UserRole } from '@healthcare/shared-types';

// Layouts & Guards
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Dashboard WORKSPACES
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientRecordsPage from './pages/patient/PatientRecordsPage';
import PatientBillingPage from './pages/patient/PatientBillingPage';
import AIAssistantPage from './pages/patient/AIAssistantPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorPrescriptionsPage from './pages/doctor/DoctorPrescriptionsPage';
import PrescribePage from './pages/doctor/PrescribePage';
import VideoConsultationPage from './pages/shared/VideoConsultationPage';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import ReceptionistAppointmentsPage from './pages/receptionist/ReceptionistAppointmentsPage';
import LabUploadPage from './pages/receptionist/LabUploadPage';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import PharmacistInventoryPage from './pages/pharmacist/PharmacistInventoryPage';
import PharmacistDispensePage from './pages/pharmacist/PharmacistDispensePage';
import AdminDashboard from './pages/admin/AdminDashboard';

// Query Client setup for caching API data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* ------------------------------------------------
                PUBLIC PATHWAYS
                ------------------------------------------------ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/login-otp" element={<VerifyOTPPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ------------------------------------------------
                PROTECTED Workstations & Workspaces
                ------------------------------------------------ */}
            
            {/* 1. Patients */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.PATIENT]} />}>
              <Route path="/patient" element={<DashboardLayout />}>
                <Route index element={<PatientDashboard />} />
                {/* Appointment slots routes */}
                <Route path="book" element={<BookAppointmentPage />} />
                <Route path="appointments" element={<PatientAppointmentsPage />} />
                <Route path="records" element={<PatientRecordsPage />} />
                <Route path="billing" element={<PatientBillingPage />} />
                <Route path="chatbot" element={<AIAssistantPage />} />
                <Route path="video-consult" element={<VideoConsultationPage role="PATIENT" />} />
              </Route>
            </Route>

            {/* 2. Clinicians / Doctors */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.DOCTOR]} />}>
              <Route path="/doctor" element={<DashboardLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointmentsPage />} />
                <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
                <Route path="prescribe" element={<PrescribePage />} />
                <Route path="ai-insights" element={<div className="text-sm">Deep Learning Diagnostic Support (Sprint 8)</div>} />
                <Route path="video-consult" element={<VideoConsultationPage role="DOCTOR" />} />
              </Route>
            </Route>

            {/* 3. Receptionists */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.RECEPTIONIST]} />}>
              <Route path="/receptionist" element={<DashboardLayout />}>
                <Route index element={<ReceptionistDashboard />} />
                <Route path="patients" element={<LabUploadPage />} />
                <Route path="appointments" element={<ReceptionistAppointmentsPage />} />
                <Route path="billing" element={<PatientBillingPage />} />
              </Route>
            </Route>

            {/* 4. Pharmacists */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.PHARMACIST]} />}>
              <Route path="/pharmacist" element={<DashboardLayout />}>
                <Route index element={<PharmacistDashboard />} />
                <Route path="inventory" element={<PharmacistInventoryPage />} />
                <Route path="dispense" element={<PharmacistDispensePage />} />
              </Route>
            </Route>

            {/* 5. System Admins */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<div className="text-sm">User Identity Directory Workspace</div>} />
                <Route path="feature-flags" element={<div className="text-sm">Platform Feature Toggles configuration</div>} />
                <Route path="audit-logs" element={<div className="text-sm">Security Audit Logs Monitor</div>} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}
