import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  Activity, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  ClipboardList, 
  Pill, 
  Users, 
  ShieldAlert,
  Video
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

const DashboardLayout: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Get navigation links based on user role
  const getSidebarLinks = (): SidebarItem[] => {
    if (!user) return [];

    switch (user.role) {
      case 'PATIENT':
        return [
          { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
          { name: 'Book Slot', path: '/patient/book', icon: Calendar },
          { name: 'My Visits', path: '/patient/appointments', icon: ClipboardList },
          { name: 'Clinical History', path: '/patient/records', icon: FileText },
          { name: 'Payments & Bills', path: '/patient/billing', icon: CreditCard },
          { name: 'AI Chatbot Support', path: '/patient/chatbot', icon: MessageSquare },
        ];
      case 'DOCTOR':
        return [
          { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
          { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
          { name: 'Prescriptions', path: '/doctor/prescriptions', icon: FileText },
          { name: 'AI Decision Support', path: '/doctor/ai-insights', icon: Activity },
          { name: 'Video Consultation', path: '/doctor/video-consult', icon: Video },
        ];
      case 'RECEPTIONIST':
        return [
          { name: 'Dashboard', path: '/receptionist', icon: LayoutDashboard },
          { name: 'Registry Desk', path: '/receptionist/patients', icon: Users },
          { name: 'Bookings', path: '/receptionist/appointments', icon: Calendar },
          { name: 'Invoicing', path: '/receptionist/billing', icon: CreditCard },
        ];
      case 'PHARMACIST':
        return [
          { name: 'Dashboard', path: '/pharmacist', icon: LayoutDashboard },
          { name: 'Medicine Stock', path: '/pharmacist/inventory', icon: Pill },
          { name: 'Dispense Desk', path: '/pharmacist/dispense', icon: ClipboardList },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'User Directory', path: '/admin/users', icon: Users },
          { name: 'Feature Flags', path: '/admin/feature-flags', icon: Settings },
          { name: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
        ];
      default:
        return [];
    }
  };

  const navLinks = getSidebarLinks();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* ----------------------------------------------------
          DESKTOP SIDEBAR
          ---------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand Section */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            HealthMesh
          </span>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-4 bg-slate-950/50 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-bold text-sm">
              {user?.firstName[0]}
              {user?.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
              <span className="text-xs text-sky-400 font-medium tracking-wider">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------
          MOBILE SIDEBAR (Drawer)
          ---------------------------------------------------- */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-900 border-r border-slate-800 text-slate-100 z-10 animate-slide-in">
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500">
                <Activity className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-lg">HealthMesh</span>
            </div>

            {/* Links */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ----------------------------------------------------
          MAIN CONTENT AREA
          ---------------------------------------------------- */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-md md:text-lg font-semibold tracking-wide text-slate-200 capitalize">
              {location.pathname.split('/').pop() || 'overview'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            </button>

            {/* User Profile display */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-slate-100">
                {user?.firstName[0]}
                {user?.lastName[0]}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-300">{user?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
