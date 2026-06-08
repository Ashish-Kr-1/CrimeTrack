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
  ChevronRight,
  Clapperboard,
} from "lucide-react";

const navItems = [
  { to: "/upload",  icon: UploadCloud,     label: "Upload Center",       badge: null },
  { to: "/",        icon: LayoutDashboard, label: "Dashboard",           end: true, badge: null },
  { to: "/replay",  icon: Clapperboard,    label: "Chrono Replay",       badge: "NEW" },
  { to: "/risk",    icon: AlertTriangle,   label: "Risk Center",         badge: null },
  { to: "/mobility",icon: Clock,           label: "Mobility Tracker",    badge: null },
  { to: "/geo",     icon: MapPin,          label: "Geo Intelligence",    badge: null },
  { to: "/network", icon: Network,         label: "Network Analysis",    badge: null },
  { to: "/cases",   icon: FolderOpen,      label: "Active Cases",        badge: null },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        width: "var(--sidebar-width, 260px)",
        background: "#f7f9f9",
        borderRight: "1px solid var(--color-border)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ── Top section ── */}
      <div style={{ padding: "24px 20px 12px" }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
              boxShadow: "0 0 20px rgba(108, 92, 231, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
                lineHeight: 1.2,
              }}
            >
              CrimeTrack
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                marginTop: 1,
              }}
            >
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-subtle)",
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          Navigation
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "-0.01em",
                    color: isActive ? "#6c5ce7" : "var(--color-text-secondary)",
                    backgroundColor: isActive
                      ? "rgba(108, 92, 231, 0.10)"
                      : "transparent",
                    border: `1px solid ${isActive ? "rgba(108, 92, 231, 0.20)" : "transparent"}`,
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(108, 92, 231, 0.05)";
                      e.currentTarget.style.color = "#6c5ce7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                    }
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "16%",
                        height: "68%",
                        width: 3,
                        borderRadius: "0 3px 3px 0",
                        background: "linear-gradient(180deg, #6c5ce7, #a29bfe)",
                        boxShadow: "0 0 10px rgba(108, 92, 231, 0.5)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}

                  <item.icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 99,
                        background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && !item.badge && (
                    <ChevronRight size={12} style={{ opacity: 0.5 }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Bottom status ── */}
      <div style={{ marginTop: "auto", padding: "16px 20px 20px" }}>
        {/* Thin divider */}
        <div style={{ height: 1, background: "var(--color-border)", marginBottom: 16 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Pulse dot */}
          <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: "#00b894",
                opacity: 0.5,
                animation: "pulse-glow 2.2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 1,
                borderRadius: "50%",
                backgroundColor: "#00b894",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Wifi size={11} />
              Secure Sandbox
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#00b894" }}>
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;