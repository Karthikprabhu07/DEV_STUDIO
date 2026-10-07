import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClubDataProvider } from './context/ClubDataContext';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { CaptainsPage } from './pages/CaptainsPage';
import { AttendancePage } from './pages/AttendancePage';
import { EventsPage } from './pages/EventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { TasksPage } from './pages/TasksPage';
import { IDCardsPage } from './pages/IDCardsPage';
import { VerifyIDPage } from './pages/VerifyIDPage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityPage } from './pages/ActivityPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Route Guard component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Guard component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ClubDataProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Verification Route */}
                <Route path="/verify/:token" element={<VerifyIDPage />} />

                {/* Login Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Club Workspace */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="members" element={<MembersPage />} />
                  <Route path="captains" element={<CaptainsPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="id-cards" element={<IDCardsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="activity" element={<ActivityPage />} />
                  <Route path="achievements" element={<AchievementsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route
                    path="settings"
                    element={
                      <AdminRoute>
                        <SettingsPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ClubDataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
