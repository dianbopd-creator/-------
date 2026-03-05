import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './components/AdminLayout';
import CandidateLayout from './components/CandidateLayout';

import Welcome from './pages/Welcome';
import BasicInfo from './pages/BasicInfo';
import QA from './pages/QA';
import PersonalityTest from './pages/PersonalityTest';
import ThankYou from './pages/ThankYou';
import AdminLogin from './pages/admin/AdminLogin';
import UserManagement from './pages/admin/UserManagement';
import JobCategories from './pages/admin/JobCategories';
import AuditLogs from './pages/admin/AuditLogs';
import AdminDashboard from './pages/admin/AdminDashboard';
import ResumeManagement from './pages/admin/ResumeManagement';
import CandidateDetail from './pages/admin/CandidateDetail';
import SecuritySettings from './pages/admin/SecuritySettings';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import QuestionBank from './pages/admin/QuestionBank';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes (Kiosk Mode) */}
          <Route path="/" element={
            <div className="kiosk-container">
              <header className="brand-header">
                <h1 className="brand-title" style={{ fontSize: '1.5rem', letterSpacing: '0.1em' }}>DIANBOPOPO</h1>
                <span className="brand-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9 }}>電波澎澎面試系統</span>
              </header>
              <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <Welcome />
              </main>
            </div>
          } />
          <Route path="/basic-info" element={
            <CandidateLayout step={1}>
              <BasicInfo />
            </CandidateLayout>
          } />
          <Route path="/qa" element={
            <CandidateLayout step={2}>
              <QA />
            </CandidateLayout>
          } />
          <Route path="/personality" element={
            <CandidateLayout step={3}>
              <PersonalityTest />
            </CandidateLayout>
          } />
          <Route path="/thank-you" element={
            <div className="kiosk-container" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)' }}>
              <header style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 3rem', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 16px rgba(9,27,49,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-logo-primary)', letterSpacing: '0.08em', lineHeight: 1 }}>DIANBOPOPO</span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(9,27,49,0.45)', letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase' }}>電波澎澎面試系統</span>
                </div>
              </header>
              <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}><ThankYou /></main>
            </div>
          } />

          {/* Admin Login */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={
            <div className="kiosk-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AdminLogin />
            </div>
          } />

          {/* Protected Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/resumes" element={<ResumeManagement />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              <Route path="/admin/question-bank" element={<QuestionBank />} />
              <Route path="/admin/candidates/:id" element={<CandidateDetail />} />
              <Route path="/admin/security" element={<SecuritySettings />} />

              {/* Only 'admin' or 'superadmin' role can access User Management, Job Categories, and Audit Logs */}
              <Route element={<AdminProtectedRoute requireAdmin={true} />}>
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/job-categories" element={<JobCategories />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
