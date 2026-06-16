import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./auth/ProtectedRoute";
import FieldLookup from "./pages/FieldLookup";
import AdminUsers from "./pages/AdminUsers";
import AdminAudit from "./pages/AdminAudit";
import AIPrediction from "./pages/AIPrediction";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Cases from "./pages/Cases";
import { Routes, Route, useLocation } from "react-router-dom";
import GeoIntelligence from "./pages/GeoIntelligence";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import RiskCenter from "./pages/RiskCenter";
import Mobility from "./pages/Mobility";
import NetworkAnalysis from "./pages/NetworkAnalysis";
import ChronologicalReplay from "./pages/ChronologicalReplay";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "./auth/AuthContext";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/unauthorized";
  const showLayout = user && !isAuthPage;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "#020617" }}>

      {/* ── Ambient Background — rich layered dark radials ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 75% 65% at 10% 15%, rgba(34,197,94,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 55% at 90% 80%, rgba(225,112,85,0.04) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 50% at 55% 45%, rgba(9,132,227,0.05) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 40% at 80% 15%, rgba(34,197,94,0.03) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* ── Sidebar ── */}
      {showLayout && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative z-10 flex flex-1 flex-col overflow-y-auto"
        style={
          showLayout
            ? {
                padding: "var(--content-padding)",
                paddingLeft:
                  "calc(var(--content-padding) + var(--sidebar-collapsed-width, 0px))",
                gap: 0,
              }
            : {}
        }
      >
        {showLayout && (
          <Navbar
            onToggleSidebar={() =>
              setSidebarOpen(!sidebarOpen)
            }
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1"
          >
            <Routes location={location}>

  {/* Public Routes */}

  <Route path="/login" element={<Login />} />
  <Route path="/unauthorized" element={<Unauthorized />} />

  {/* Protected Routes */}

  <Route
    index
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer", "admin"]}>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/upload"
    element={
      <ProtectedRoute allowedRoles={["analyst", "admin"]}>
        <UploadCenter />
      </ProtectedRoute>
    }
  />

  <Route
    path="/risk"
    element={
      <ProtectedRoute allowedRoles={["analyst"]}>
        <RiskCenter />
      </ProtectedRoute>
    }
  />

  <Route
    path="/mobility"
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer"]}>
        <Mobility />
      </ProtectedRoute>
    }
  />

  <Route
    path="/cases"
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer", "admin"]}>
        <Cases />
      </ProtectedRoute>
    }
  />

  <Route
    path="/geo"
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer"]}>
        <GeoIntelligence />
      </ProtectedRoute>
    }
  />

  <Route
    path="/network"
    element={
      <ProtectedRoute allowedRoles={["analyst"]}>
        <NetworkAnalysis />
      </ProtectedRoute>
    }
  />

  <Route
    path="/replay"
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer"]}>
        <ChronologicalReplay />
      </ProtectedRoute>
    }
  />

  <Route
    path="/lookup"
    element={
      <ProtectedRoute allowedRoles={["officer"]}>
        <FieldLookup />
      </ProtectedRoute>
    }
  />

  <Route
    path="/users"
    element={
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminUsers />
      </ProtectedRoute>
    }
  />

  <Route
    path="/audit"
    element={
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminAudit />
      </ProtectedRoute>
    }
  />

  <Route
    path="/prediction"
    element={
      <ProtectedRoute allowedRoles={["analyst", "officer"]}>
        <AIPrediction />
      </ProtectedRoute>
    }
  />

</Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;