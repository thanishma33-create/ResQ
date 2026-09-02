import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { OfflineProvider } from './context/OfflineContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import ToastContainer from './components/common/ToastContainer';
import BroadcastBanner from './components/broadcast/BroadcastBanner';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EmergenciesPage from './pages/EmergenciesPage';
import EmergencyDetailPage from './pages/EmergencyDetailPage';
import SOSPage from './pages/SOSPage';
import DisastersPage from './pages/DisastersPage';
import LocationIntelPage from './pages/LocationIntelPage';
import MedicalVulnerablePage from './pages/MedicalVulnerablePage';
import TeamsPage from './pages/TeamsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ResourcesPage from './pages/ResourcesPage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import VolunteersPage from './pages/VolunteersPage';
import VolunteerAssignmentPage from './pages/VolunteerAssignmentPage';
import SheltersPage from './pages/SheltersPage';
import WeatherPage from './pages/WeatherPage';
import MapPage from './pages/MapPage';
import NearbyAssistancePage from './pages/NearbyAssistancePage';
import NotificationsPage from './pages/NotificationsPage';
import BroadcastsPage from './pages/BroadcastsPage';
import AIIntelligencePage from './pages/AIIntelligencePage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import IncidentHistoryPage from './pages/IncidentHistoryPage';
import ProfilePage from './pages/ProfilePage';
import OfflineQueuePage from './pages/OfflineQueuePage';

// Main App Layout Wrapper
const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isStandalonePage = ['/', '/login', '/register'].includes(location.pathname);

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-resq-bg text-slate-100 flex flex-col font-sans">
        <BroadcastBanner />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-resq-bg text-slate-100 flex flex-col font-sans">
      <BroadcastBanner />
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="flex-1 flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area (offset by sidebar on desktop) */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <OfflineProvider>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/sos" element={<SOSPage />} />

              {/* SECTION 1: OVERVIEW */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nearby"
                element={
                  <ProtectedRoute>
                    <NearbyAssistancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <NearbyAssistancePage />
                  </ProtectedRoute>
                }
              />

              {/* SECTION 2: EMERGENCY MANAGEMENT */}
              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <EmergenciesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergencies"
                element={
                  <ProtectedRoute>
                    <EmergenciesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/emergencies/:id"
                element={
                  <ProtectedRoute>
                    <EmergencyDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/disasters"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team']}>
                    <DisastersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team', 'volunteer']}>
                    <AssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team', 'volunteer']}>
                    <MedicalVulnerablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-vulnerable"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team', 'volunteer']}>
                    <MedicalVulnerablePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/offline-queue"
                element={
                  <ProtectedRoute>
                    <OfflineQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/queue"
                element={
                  <ProtectedRoute>
                    <OfflineQueuePage />
                  </ProtectedRoute>
                }
              />

              {/* SECTION 3: RESOURCES */}
              <Route
                path="/resources"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team']}>
                    <ResourcesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resource-allocation"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <ResourceAllocationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteers"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <VolunteersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer-assignment"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <VolunteerAssignmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <TeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shelters"
                element={
                  <ProtectedRoute>
                    <SheltersPage />
                  </ProtectedRoute>
                }
              />

              {/* SECTION 4: COMMUNICATION */}
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <WeatherPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <WeatherPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broadcast"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <BroadcastsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broadcasts"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <BroadcastsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* SECTION 5: INTELLIGENCE & ANALYTICS */}
              <Route
                path="/ai"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team']}>
                    <AIIntelligencePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team']}>
                    <IncidentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incident-history"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator', 'rescue_team']}>
                    <IncidentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Additional Utility Routes */}
              <Route
                path="/location-intelligence"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'operator']}>
                    <LocationIntelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
          <ToastContainer />
        </OfflineProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
