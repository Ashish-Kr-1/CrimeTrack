import { useState } from "react";
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
  { to: "/upload", icon: UploadCloud, label: "Upload Center", badge: null },
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true, badge: null },
  { to: "/replay", icon: Clapperboard, label: "Chrono Replay", badge: "NEW" },
  { to: "/risk", icon: AlertTriangle, label: "Risk Center", badge: null },
  { to: "/mobility", icon: Clock, label: "Mobility Tracker", badge: null },
  { to: "/geo", icon: MapPin, label: "Geo Intelligence", badge: null },
  { to: "/network", icon: Network, label: "Network Analysis", badge: null },
  { to: "/cases", icon: FolderOpen, label: "Active Cases", badge: null },
];

function Sidebar({ isOpen, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isOpen || isHovered;
  const sidebarWidth = isExpanded ? 260 : 64;
  const paddingX = isExpanded ? 20 : 12;

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex flex-col"
      style={{
        width: sidebarWidth,
        transform: `translateX(${isOpen ? "0" : "var(--sidebar-translate)"})`,
        background: "linear-gradient(180deg, #faf8f5 0%, #f4f1eb 100%)",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "2px 0 24px rgba(0,0,0,0.06)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Top section ── */}
      <div style={{ padding: `24px ${paddingX}px 12px`, transition: "padding 0.3s ease" }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
              boxShadow: "0 4px 16px rgba(108, 92, 231, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Shield size={18} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ opacity: isExpanded ? 1 : 0, transition: "opacity 0.2s", width: isExpanded ? "auto" : 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              CyberTrack
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#6c5ce7",
                marginTop: 1,
                opacity: 0.8,
              }}
            >
              AI · Intelligence
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: 6,
            paddingLeft: 12,
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
                    gap: 12,
                    padding: "9px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: isActive ? "-0.02em" : "-0.01em",
                    color: isActive ? "#6c5ce7" : "#475569",
                    backgroundColor: isActive
                      ? "rgba(108, 92, 231, 0.10)"
                      : "transparent",
                    border: `1px solid ${isActive ? "rgba(108, 92, 231, 0.18)" : "transparent"}`,
                    boxShadow: isActive ? "0 1px 4px rgba(108,92,231,0.10), inset 0 1px 0 rgba(255,255,255,0.6)" : "none",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    overflow: "hidden", // Prevents the active rect from stretching
                    width: isExpanded ? "100%" : "40px",
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
                        top: "14%",
                        height: "72%",
                        width: 3,
                        borderRadius: "0 4px 4px 0",
                        background: "linear-gradient(180deg, #6c5ce7 0%, #a29bfe 100%)",
                        boxShadow: "2px 0 12px rgba(108, 92, 231, 0.45)",
                      }}
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}

                  <item.icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: "opacity 0.2s" }}>{item.label}</span>

                  {item.badge && isExpanded && (
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

                  {isActive && !item.badge && isExpanded && (
                    <ChevronRight size={12} style={{ opacity: 0.5 }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Bottom status ── */}
      <div style={{ marginTop: "auto", padding: `16px ${paddingX}px 20px`, transition: "padding 0.3s ease", overflow: "hidden" }}>
        {/* Thin divider */}
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(0,184,148,0.06)",
          border: "1px solid rgba(0,184,148,0.14)",
        }}>
          {/* Pulse dot */}
          <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: "#00b894",
                opacity: 0.45,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 1, opacity: isExpanded ? 1 : 0, width: isExpanded ? "auto" : 0, transition: "opacity 0.2s" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 5,
                letterSpacing: "-0.01em",
              }}
            >
              <Wifi size={11} color="#00b894" />
              Secure Sandbox
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00b894" }}>
              Online · Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;