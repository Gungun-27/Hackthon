import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';

// Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyIdentityPage } from './pages/VerifyIdentityPage';
import { LoginPage } from './pages/LoginPage';
import { FileComplaintPage } from './pages/FileComplaintPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { AuthorityLoginPage } from './pages/AuthorityLoginPage';
import { AuthorityCommandMapPage } from './pages/AuthorityCommandMapPage';
import { AuthorityComplaintsPage } from './pages/AuthorityComplaintsPage';
import { AuthorityComplaintDetailPage } from './pages/AuthorityComplaintDetailPage';
import { AuthorityAnalyticsPage } from './pages/AuthorityAnalyticsPage';

const queryClient = new QueryClient();

// Protected Route for Authority
const AuthorityRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-400">Verifying session...</div>;
  }
  if (!isAuthenticated || (user?.role !== 'officer' && user?.role !== 'admin')) {
    return <Navigate to="/authority/login" replace />;
  }
  return <>{children}</>;
};

// Protected Route for Citizen Dashboard
const CitizenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-mono text-slate-500">Verifying session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Citizen Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-identity" element={<VerifyIdentityPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/file-complaint" element={<FileComplaintPage />} />
          <Route path="/track/:ticketId" element={<TrackComplaintPage />} />

          {/* Citizen Protected Routes */}
          <Route path="/dashboard" element={<CitizenRoute><CitizenDashboardPage /></CitizenRoute>} />
          <Route path="/dashboard/complaints/:id" element={<CitizenRoute><TrackComplaintPage /></CitizenRoute>} />

          {/* Authority Routes */}
          <Route path="/authority/login" element={<AuthorityLoginPage />} />
          <Route path="/authority" element={<AuthorityRoute><AuthorityCommandMapPage /></AuthorityRoute>} />
          <Route path="/authority/complaints" element={<AuthorityRoute><AuthorityComplaintsPage /></AuthorityRoute>} />
          <Route path="/authority/complaints/:id" element={<AuthorityRoute><AuthorityComplaintDetailPage /></AuthorityRoute>} />
          <Route path="/authority/analytics" element={<AuthorityRoute><AuthorityAnalyticsPage /></AuthorityRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      {/* Persistent AI Chatbot Widget (Section 3.5 & 9) */}
      <ChatWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
