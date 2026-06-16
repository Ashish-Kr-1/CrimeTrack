import { useState, useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import {
  Shield, UploadCloud, LayoutDashboard, AlertTriangle,
  Clock, MapPin, Network, FolderOpen, Wifi, ChevronRight,
  Clapperboard, LogOut, X,
} from "lucide-react";

const navItems = [
  { to: "/upload",  icon: UploadCloud,    label: "Upload Center",    badge: null },
  { to: "/",        icon: LayoutDashboard,label: "Dashboard",        end: true, badge: null },
  { to: "/replay",  icon: Clapperboard,   label: "Chrono Replay",   badge: "NEW" },
  { to: "/risk",    icon: AlertTriangle,  label: "Risk Center",      badge: null },
  { to: "/mobility",icon: Clock,          label: "Mobility Tracker", badge: null },
  { to: "/geo",     icon: MapPin,         label: "Geo Intelligence", badge: null },
  { to: "/network", icon: Network,        label: "Network Analysis", badge: null },
  { to: "/cases",   icon: FolderOpen,     label: "Active Cases",     badge: null },
];

function Sidebar({ isOpen, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Expansion logic ──────────────────────────────────────────────────────
     Desktop: always visible, expands 64→260 on hover
     Mobile:  always 260px wide, slides in/out via translateX
  ─────────────────────────────────────────────────────────────────────────── */
  const isExpanded = isDesktop ? isHovered : true; // mobile is always "expanded" when shown
  const sidebarWidth = isDesktop ? (isHovered ? 260 : 64) : 260;
  const transform = isDesktop
    ? "translateX(0)"
    : `translateX(${isOpen ? "0%" : "-100%"})`;

  return (
    <div
      onMouseEnter={() => isDesktop && setIsHovered(true)}
      onMouseLeave={() => isDesktop && setIsHovered(false)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        width: sidebarWidth,
        transform,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #faf8f5 0%, #f4f1eb 100%)",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "2px 0 24px rgba(0,0,0,0.06)",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* ── Brand header ── */}
      <div style={{ padding: `24px ${isDesktop && !isHovered ? 12 : 20}px 12px`, transition: "padding 0.28s ease", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          {/* Logo mark */}
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
            boxShadow: "0 4px 16px rgba(108,92,231,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <Shield size={18} color="white" strokeWidth={2.5} />
          </div>

          {/* Brand text — hidden when desktop-collapsed */}
          <div style={{
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? "auto" : 0,
            overflow: "hidden",
            transition: "opacity 0.2s ease, width 0.28s ease",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", lineHeight: 1.2 }}>
              CyberTrack
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6c5ce7", marginTop: 1, opacity: 0.8 }}>
              AI · Intelligence
            </div>
          </div>

          {/* Close button — mobile only */}
          {!isDesktop && (
            <button onClick={onClose} style={{ marginLeft: "auto", padding: 6, borderRadius: 8, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#64748b", flexShrink: 0 }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* "Navigation" label — hidden when desktop-collapsed */}
        {isExpanded && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6, paddingLeft: 12, whiteSpace: "nowrap" }}>
            Navigation
          </div>
        )}

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}>
              {({ isActive }) => (
                <motion.div
                  whileHover={!isActive ? { backgroundColor: "rgba(108,92,231,0.05)", color: "#6c5ce7" } : {}}
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
                    backgroundColor: isActive ? "rgba(108,92,231,0.10)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(108,92,231,0.18)" : "transparent"}`,
                    boxShadow: isActive ? "0 1px 4px rgba(108,92,231,0.10), inset 0 1px 0 rgba(255,255,255,0.6)" : "none",
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                    /* Always fill the nav area */
                    width: "100%",
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{
                        position: "absolute", left: 0, top: "14%", height: "72%", width: 3,
                        borderRadius: "0 4px 4px 0",
                        background: "linear-gradient(180deg, #6c5ce7 0%, #a29bfe 100%)",
                        boxShadow: "2px 0 12px rgba(108,92,231,0.45)",
                      }}
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}

                  <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />

                  {/* Label — fades out when desktop-collapsed */}
                  <span style={{
                    flex: 1,
                    opacity: isExpanded ? 1 : 0,
                    maxWidth: isExpanded ? 160 : 0,
                    overflow: "hidden",
                    transition: "opacity 0.2s ease, max-width 0.28s ease",
                  }}>
                    {item.label}
                  </span>

                  {item.badge && isExpanded && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "2px 6px", borderRadius: 99,
                      background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                      color: "white", flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  )}

                  {isActive && !item.badge && isExpanded && (
                    <ChevronRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Bottom status ── */}
      <div style={{ marginTop: "auto", padding: `16px ${isDesktop && !isHovered ? 12 : 20}px 20px`, transition: "padding 0.28s ease", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", marginBottom: 14 }} />

        {/* User row */}
        <div style={{
          display: "flex", 
          alignItems: "center", 
          justifyContent: isExpanded ? "space-between" : "center", 
          gap: isExpanded ? 10 : 0,
          padding: isExpanded ? "8px 12px" : "8px 0", 
          borderRadius: 10,
          background: "rgba(0,0,0,0.02)", 
          border: "1px solid rgba(0,0,0,0.05)",
          marginBottom: 10, 
          overflow: "hidden",
          width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isExpanded ? 8 : 0, minWidth: 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 9, fontWeight: "bold", color: "white", lineHeight: 1 }}>A</span>
            </div>
            {isExpanded && (
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", lineHeight: 1.1, whiteSpace: "nowrap" }}>Analyst</span>
                <span style={{ fontSize: 8, color: "#6c5ce7", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>Active Node</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <button onClick={logout} title="Sign out" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#d63031", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Status pill */}
        <div style={{
          display: "flex", 
          alignItems: "center", 
          justifyContent: isExpanded ? "flex-start" : "center", 
          gap: isExpanded ? 10 : 0,
          padding: isExpanded ? "10px 12px" : "10px 0", 
          borderRadius: 10,
          background: "rgba(0,184,148,0.06)", 
          border: "1px solid rgba(0,184,148,0.14)",
          width: "100%",
        }}>
          <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#00b894", opacity: 0.45, animation: "pulse-glow 2.2s ease-in-out infinite" }} />
            <span style={{ position: "absolute", inset: 1, borderRadius: "50%", backgroundColor: "#00b894" }} />
          </div>
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, whiteSpace: "nowrap", minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 5, letterSpacing: "-0.01em" }}>
                <Wifi size={11} color="#00b894" /> Secure Sandbox
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00b894" }}>
                Online · Encrypted
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
