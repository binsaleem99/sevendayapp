import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NavBar } from './components/NavBar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CoursePage } from './pages/CoursePage';
import SuccessPage from './pages/SuccessPage';
import AdminPage from './pages/AdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CommunityPage from './pages/CommunityPage';
import CommunityAdminPage from './pages/CommunityAdminPage';
import CommunitySubscribePage from './pages/CommunitySubscribePage';
import CommunitySuccessPage from './pages/CommunitySuccessPage';
import InstallPrompt from './components/InstallPrompt';

const AppRoutes: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('$pageview', {
        path: location.pathname
      });
    }
  }, [location]);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/course" element={<CoursePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/admin" element={<CommunityAdminPage />} />
        <Route path="/community-subscribe" element={<CommunitySubscribePage />} />
        <Route path="/community-success" element={<CommunitySuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;