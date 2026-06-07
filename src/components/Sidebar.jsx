import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  UploadCloud,
  LayoutDashboard,
  AlertTriangle,
  Clock,
  MapPin,
  Network,
  FolderOpen,
  Wifi,
} from "lucide-react";

const navItems = [
  { to: "/upload", icon: UploadCloud, label: "Upload Center" },
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/risk", icon: AlertTriangle, label: "Risk Center" },
  { to: "/mobility", icon: Clock, label: "Mobility Tracker" },
  { to: "/geo", icon: MapPin, label: "Geo Intelligence" },
  { to: "/network", icon: Network, label: "Network Analysis" },
  { to: "/cases", icon: FolderOpen, label: "Active Cases" },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col justify-between border-r border-border bg-dark-surface p-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div>
        <div className="mb-10 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #3b5fab, #23356e)",
                boxShadow: "0 0 18px rgba(59, 95, 171, 0.45)",
              }}
            >
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-wider text-text">
                CYBER TRACKER
              </h1>
              <p className="text-[9px] font-semibold tracking-[0.12em] text-text-subtle">
                INTELLIGENCE PLATFORM v2.0
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="group"
              onClick={onClose}
            >
              {({ isActive }) => (
                <div
                  className="relative flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-medium transition-all duration-200"
                  style={{
                    color: isActive ? "#3b5fab" : "#8b9dc3",
                    backgroundColor: isActive
                      ? "rgba(59, 95, 171, 0.1)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(59, 95, 171, 0.2)"
                      : "1px solid transparent",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-[15%] h-[70%] w-[3px] rounded-r-sm"
                      style={{
                        backgroundColor: "#3b5fab",
                        boxShadow: "0 0 10px #3b5fab",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="flex items-center gap-2.5 border-t border-border pt-5">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              backgroundColor: "#2d8a5e",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: "#2d8a5e" }}
          />
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <Wifi size={12} />
          Secure Sandbox Online
        </span>
      </div>
    </div>
  );
}

export default Sidebar;