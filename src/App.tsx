import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import CustomCursor from "./components/CustomCursor";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { RouteLoader } from "./components/site/RouteLoader";
import { useAuthStore } from "./store/useAuthStore";

const About = lazy(() => import("./pages/About"));
const Auth = lazy(() => import("./pages/Auth"));
const Blog = lazy(() => import("./pages/Blog"));
const Booking = lazy(() => import("./pages/Booking"));
const Careers = lazy(() => import("./pages/Careers"));
const Cities = lazy(() => import("./pages/Cities"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DriverOnboarding = lazy(() => import("./pages/DriverOnboarding"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Profile = lazy(() => import("./pages/Profile"));
const Safety = lazy(() => import("./pages/Safety"));
const Terms = lazy(() => import("./pages/Terms"));

function AppRoutes() {
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  if (loading) {
    return <RouteLoader />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
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
    </Suspense>
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
