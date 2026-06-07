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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark">
      {/* Ambient background grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(59,95,171,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(193,136,51,0.04) 0%, transparent 50%)",
        }}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto p-4 md:p-5">
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
              <Route path="/upload" element={<UploadCenter />} />
              <Route path="/risk" element={<RiskCenter />} />
              <Route path="/mobility" element={<Mobility />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/geo" element={<GeoIntelligence />} />
              <Route path="/network" element={<NetworkAnalysis />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;