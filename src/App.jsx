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
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "var(--color-dark)" }}>

      {/* ── Ambient Background ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 12% 20%, rgba(0,212,245,0.045) 0%, transparent 70%)",
            "radial-gradient(ellipse 55% 50% at 88% 75%, rgba(255,107,74,0.035) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 40% at 50% 50%, rgba(18,72,84,0.06) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* ── Subtle grid ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,245,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,245,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
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
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div
        className="relative z-10 flex flex-1 flex-col overflow-y-auto"
        style={{ padding: "var(--content-padding)", gap: 0 }}
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
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;