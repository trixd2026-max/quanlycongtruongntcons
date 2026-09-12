import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { KpiPage } from './pages/KpiPage';
import { TeamsPage } from './pages/TeamsPage';
import { SafetyPage } from './pages/SafetyPage';
import { ProgressPage } from './pages/ProgressPage';
import { SchedulePage } from './pages/SchedulePage';
import { WorkersPage } from './pages/WorkersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AttendancePage } from './pages/AttendancePage';
import { LoginPage } from './pages/LoginPage';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useApp();

  if (!currentUser) return <LoginPage />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kpi" element={<KpiPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
