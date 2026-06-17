import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Cases from "./pages/Cases";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import GeoIntelligence from "./pages/GeoIntelligence";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import RiskCenter from "./pages/RiskCenter";
import Mobility from "./pages/Mobility";
import NetworkAnalysis from "./pages/NetworkAnalysis";
import ChronologicalReplay from "./pages/ChronologicalReplay";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, addAuditLog } = useContext(AuthContext);

  // Auto-log page navigation events for the security audit trail
  useEffect(() => {
    if (user) {
      const pageName = location.pathname === "/" 
        ? "Dashboard" 
        : location.pathname.slice(1).toUpperCase();
      addAuditLog("PAGE_VIEW", `Opened workspace view: ${pageName}`);
    }
  }, [location.pathname, user]);

  // Case 1: Unauthenticated -> Force Login page
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Case 2: Authenticated as Admin -> Render Admin Dashboard exclusively
  if (user.role === "admin") {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Case 3: Authenticated as Analyst -> Render standard workspace
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "#231942" }}>

      {/* ── Ambient Background — rich layered radials ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 75% 65% at 10% 15%, rgba(47,102,144,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 55% at 90% 80%, rgba(22,66,91,0.05) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 50% at 55% 45%, rgba(58,124,165,0.04) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 40% at 80% 15%, rgba(90,148,187,0.03) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
        style={{ padding: "var(--content-padding)", paddingLeft: "calc(var(--content-padding) + var(--sidebar-collapsed-width, 0px))", gap: 0 }}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

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
              <Route index element={<Dashboard />} />
              <Route path="/upload"  element={<UploadCenter />} />
              <Route path="/risk"    element={<RiskCenter />} />
              <Route path="/mobility" element={<Mobility />} />
              <Route path="/cases"  element={<Cases />} />
              <Route path="/geo"    element={<GeoIntelligence />} />
              <Route path="/network" element={<NetworkAnalysis />} />
              <Route path="/replay" element={<ChronologicalReplay />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;