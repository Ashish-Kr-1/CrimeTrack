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
  Users,
  Terminal,
  Search,
  Key,
  Brain,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";


function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isOpen || isHovered;
  const sidebarWidth = isExpanded ? 260 : 64;
  const paddingX = isExpanded ? 20 : 12;

  const getNavItems = () => {
    const role = user?.role || "analyst";

    if (role === "admin") {
      return [
        { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true, badge: null },
        { to: "/upload", icon: UploadCloud, label: "Upload Center", badge: null },
        { to: "/cases", icon: FolderOpen, label: "Active Cases", badge: null },
        { to: "/users", icon: Users, label: "User Management", badge: null },
        { to: "/audit", icon: Terminal, label: "Audit Logs", badge: null },
      ];
    }

    if (role === "officer") {
      return [
        { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true, badge: null },
        { to: "/lookup", icon: Search, label: "Field Lookup", badge: "NEW" },
        { to: "/replay", icon: Clapperboard, label: "Chrono Replay", badge: null },
        { to: "/mobility", icon: Clock, label: "Mobility Tracker", badge: null },
        { to: "/geo", icon: MapPin, label: "Geo Intelligence", badge: null },
        { to: "/prediction", icon: Brain, label: "AI Prediction", badge: "LIVE" },
        { to: "/cases", icon: FolderOpen, label: "Active Cases", badge: null },
      ];
    }

    // Default Analyst: full access
    return [
      { to: "/upload", icon: UploadCloud, label: "Upload Center", badge: null },
      { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true, badge: null },
      { to: "/replay", icon: Clapperboard, label: "Chrono Replay", badge: "NEW" },
      { to: "/risk", icon: AlertTriangle, label: "Risk Center", badge: null },
      { to: "/mobility", icon: Clock, label: "Mobility Tracker", badge: null },
      { to: "/geo", icon: MapPin, label: "Geo Intelligence", badge: null },
      { to: "/network", icon: Network, label: "Network Analysis", badge: null },
      { to: "/prediction", icon: Brain, label: "AI Prediction", badge: "LIVE" },
      { to: "/cases", icon: FolderOpen, label: "Active Cases", badge: null },
    ];
  };

  const getBrandDetails = () => {
    const role = user?.role || "analyst";
    if (role === "admin") {
      return {
        gradient: "linear-gradient(135deg, #e17055 0%, #fab1a0 100%)",
        icon: <Key size={18} color="white" strokeWidth={2.5} />,
        shadow: "0 4px 16px rgba(225, 112, 85, 0.35)",
        textColor: "#e17055",
      };
    }
    if (role === "officer") {
      return {
        gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)",
        icon: <Shield size={18} color="white" strokeWidth={2.5} />,
        shadow: "0 4px 16px rgba(0, 184, 148, 0.35)",
        textColor: "#00b894",
      };
    }
    return {
      gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
      icon: <Users size={18} color="white" strokeWidth={2.5} />,
      shadow: "0 4px 16px rgba(108, 92, 231, 0.35)",
      textColor: "#6c5ce7",
    };
  };

  const navItems = getNavItems();
  const brand = getBrandDetails();

  return (
    <div
      className="fixed inset-y-0 left-0 z-50 flex flex-col"
      style={{
        width: sidebarWidth,
        transform: `translateX(${isOpen ? "0" : "var(--sidebar-translate)"})`,
        background: "linear-gradient(180deg, #090d16 0%, #05070f 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "2px 0 24px rgba(0,0,0,0.4)",
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
              background: brand.gradient,
              boxShadow: `${brand.shadow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {brand.icon}
          </div>
          <div style={{ opacity: isExpanded ? 1 : 0, transition: "opacity 0.2s", width: isExpanded ? "auto" : 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f8fafc",
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
                color: brand.textColor,
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
                    color: isActive ? brand.textColor : "#cbd5e1",
                    backgroundColor: isActive
                      ? "rgba(255, 255, 255, 0.04)"
                      : "transparent",
                    border: `1px solid ${isActive ? "rgba(255, 255, 255, 0.08)" : "transparent"}`,
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)" : "none",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    overflow: "hidden", // Prevents the active rect from stretching
                    width: isExpanded ? "100%" : "40px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.color = brand.textColor;
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
                        background: brand.gradient,
                        boxShadow: brand.shadow,
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
                        background: brand.gradient,
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
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(34,197,94,0.04)",
          border: "1px solid rgba(34,197,94,0.14)",
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
                color: "#f8fafc",
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