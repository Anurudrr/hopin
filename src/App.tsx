import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import CustomCursor from "./components/CustomCursor";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import Booking from "./pages/Booking";
import Careers from "./pages/Careers";
import Cities from "./pages/Cities";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import DriverOnboarding from "./pages/DriverOnboarding";
import FAQ from "./pages/FAQ";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import Safety from "./pages/Safety";
import Terms from "./pages/Terms";
import { useAuthStore } from "./store/useAuthStore";

function AppRoutes() {
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></span>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/cities" element={<Cities />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Auth />} />
        <Route
          path="/book"
          element={
            <ProtectedRoute requireOnboarding>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireOnboarding>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver-signup"
          element={
            <ProtectedRoute requireOnboarding>
              <DriverOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <CustomCursor />
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;
