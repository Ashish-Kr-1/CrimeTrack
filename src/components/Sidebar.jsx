import { useState, useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import {
  UploadCloud, LayoutDashboard, AlertTriangle,
  Clock, MapPin, Network, FolderOpen, Wifi, ChevronRight,
  Clapperboard, LogOut, X,
} from "lucide-react";

const NAV = [
  { to: "/upload",   icon: UploadCloud,    label: "Upload Center",    badge: null },
  { to: "/",         icon: LayoutDashboard,label: "Dashboard",        end: true, badge: null },
  { to: "/replay",   icon: Clapperboard,   label: "Chrono Replay",   badge: "NEW" },
  { to: "/risk",     icon: AlertTriangle,  label: "Risk Center",      badge: null },
  { to: "/mobility", icon: Clock,          label: "Mobility Tracker", badge: null },
  { to: "/geo",      icon: MapPin,         label: "Geo Intelligence", badge: null },
  { to: "/network",  icon: Network,        label: "Network Analysis", badge: null },
  { to: "/cases",    icon: FolderOpen,     label: "Active Cases",     badge: null },
];

/* FCSA Fingerprint-Shield SVG logo */
function FCSALogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 15 L 25 23 L 25 58 Q 25 75 50 85 Z" fill="#EBF3F9" />
      <path d="M 50 15 L 75 23 L 75 58 Q 75 75 50 85 Z" fill="#E5EAEF" />

      <path d="M 45 62 A 5 6 0 0 1 55 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 41 62 A 9 10 0 0 1 59 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 37 62 A 13 14 0 0 1 63 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 33 62 A 17 18 0 0 1 67 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 45 62 L 45 68" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 55 62 L 55 68" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 41 62 L 41 72" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 59 62 L 59 72" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 48 55 A 2 3 0 0 1 52 55" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      <path d="M 50 15 L 25 23 L 25 58 Q 25 75 50 85" stroke="#3b82f6" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 50 15 L 75 23 L 75 58 Q 75 75 50 85" stroke="#0f3347" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M 25 38 L 18 38 L 13 32" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="13" cy="32" r="2.8" fill="#3b82f6" />
      
      <path d="M 25 48 L 16 48 L 13 51 L 9 51" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="9" cy="51" r="2.8" fill="#3b82f6" />
      
      <path d="M 25 58 L 20 58 L 13 65" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="13" cy="65" r="2.8" fill="#3b82f6" />

      <path d="M 75 38 L 82 38 L 87 32" stroke="#0f3347" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="87" cy="32" r="2.8" fill="#0f3347" />
      
      <path d="M 75 48 L 84 48 L 87 51 L 91 51" stroke="#0f3347" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="91" cy="51" r="2.8" fill="#0f3347" />
      
      <path d="M 75 58 L 80 58 L 87 65" stroke="#0f3347" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="87" cy="65" r="2.8" fill="#0f3347" />
    </svg>
  );
}

function Sidebar({ isOpen, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isExpanded = isDesktop ? isHovered : true;
  const sidebarWidth = isDesktop ? (isHovered ? 240 : 64) : 240;
  const transform = isDesktop
    ? "translateX(0)"
    : `translateX(${isOpen ? "0%" : "-100%"})`;

  const padH = isDesktop && !isHovered ? 12 : 16;

  return (
    <div
      onMouseEnter={() => isDesktop && setIsHovered(true)}
      onMouseLeave={() => isDesktop && setIsHovered(false)}
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
        width: sidebarWidth,
        transform,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #16425b 0%, #070b13 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "3px 0 20px rgba(0,0,0,0.18)",
        transition: "width 0.26s cubic-bezier(0.4,0,0.2,1), transform 0.26s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* ── Brand header ── */}
      <div style={{
        padding: `20px ${padH}px 8px`,
        transition: "padding 0.26s ease",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isExpanded ? 0 : 0 }}>

          {/* Logo mark */}
          <div style={{
            width: 38, height: 38,
            borderRadius: 10,
            flexShrink: 0,
            background: "rgba(58,124,165,0.20)",
            border: "1px solid rgba(90,148,187,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FCSALogo size={28} />
          </div>

          {/* Brand text — hidden when collapsed on desktop */}
          <div style={{
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? "auto" : 0,
            overflow: "hidden",
            transition: "opacity 0.2s ease, width 0.26s ease",
            whiteSpace: "nowrap",
            flex: 1, minWidth: 0,
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", lineHeight: 1.1 }}>
              FCSA
            </div>
            <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(90,148,187,0.85)", marginTop: 1 }}>
              Forensics Cyber Security Agency
            </div>
          </div>

          {/* Mobile close */}
          {!isDesktop && (
            <button onClick={onClose} style={{
              marginLeft: "auto", padding: 6, borderRadius: 8,
              background: "rgba(255,255,255,0.08)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center",
              color: "rgba(255,255,255,0.7)", flexShrink: 0,
            }}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation label */}
      <div style={{ padding: `6px ${padH}px 4px`, transition: "padding 0.26s ease", flexShrink: 0 }}>
        {isExpanded && (
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.13em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.32)",
            paddingLeft: 2, marginBottom: 4, whiteSpace: "nowrap",
          }}>
            Navigation
          </div>
        )}

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}>
              {({ isActive }) => (
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "-0.01em",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.60)",
                    backgroundColor: isActive ? "rgba(138,181,207,0.20)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(138,181,207,0.28)" : "transparent"}`,
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.88)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.60)";
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      style={{
                        position: "absolute", left: 0, top: "15%", height: "70%", width: 3,
                        borderRadius: "0 3px 3px 0",
                        background: "linear-gradient(180deg, #8ab5cf 0%, #3a7ca5 100%)",
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}

                  <item.icon
                    size={15}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ flexShrink: 0, color: isActive ? "#8ab5cf" : "inherit" }}
                  />

                  <span style={{
                    flex: 1,
                    opacity: isExpanded ? 1 : 0,
                    maxWidth: isExpanded ? 160 : 0,
                    overflow: "hidden",
                    transition: "opacity 0.18s ease, max-width 0.26s ease",
                  }}>
                    {item.label}
                  </span>

                  {item.badge && isExpanded && (
                    <span style={{
                      fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "2px 6px",
                      borderRadius: 99, background: "#3a7ca5",
                      color: "white", flexShrink: 0,
                      border: "1px solid rgba(90,148,187,0.4)",
                    }}>
                      {item.badge}
                    </span>
                  )}

                  {isActive && !item.badge && isExpanded && (
                    <ChevronRight size={11} style={{ opacity: 0.45, flexShrink: 0 }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Bottom status ── */}
      <div style={{
        marginTop: "auto",
        padding: `12px ${padH}px 16px`,
        transition: "padding 0.26s ease",
        overflow: "hidden",
        flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>

        {/* User row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          gap: isExpanded ? 8 : 0,
          padding: isExpanded ? "8px 10px" : "8px 0",
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
          overflow: "hidden",
          width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isExpanded ? 8 : 0, minWidth: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #3a7ca5 0%, #2f6690 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid rgba(90,148,187,0.45)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "white", lineHeight: 1 }}>
                {(user?.username?.[0] || "A").toUpperCase()}
              </span>
            </div>
            {isExpanded && (
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", lineHeight: 1.1, whiteSpace: "nowrap", textTransform: "capitalize" }}>
                  {user?.username || "Analyst"}
                </span>
                <span style={{ fontSize: 9, color: "rgba(90,148,187,0.85)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                  {user?.role || "Analyst"}
                </span>
              </div>
            )}
          </div>
          {isExpanded && (
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", color: "rgba(192,57,43,0.75)",
                padding: 4, display: "flex", alignItems: "center",
                flexShrink: 0, borderRadius: 6,
                transition: "color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#c0392b";
                e.currentTarget.style.background = "rgba(192,57,43,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(192,57,43,0.75)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>

        {/* Secure status */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "flex-start" : "center",
          gap: isExpanded ? 8 : 0,
          padding: isExpanded ? "8px 10px" : "8px 0",
          borderRadius: 8,
          background: "rgba(26,122,74,0.10)",
          border: "1px solid rgba(26,122,74,0.20)",
          width: "100%",
        }}>
          <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#1a7a4a", opacity: 0.5, animation: "pulse-glow 2.2s ease-in-out infinite" }} />
            <span style={{ position: "absolute", inset: 1, borderRadius: "50%", backgroundColor: "#1e8a52" }} />
          </div>
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, whiteSpace: "nowrap", minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4, letterSpacing: "-0.01em" }}>
                <Wifi size={10} color="#1e8a52" /> Secure Channel
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(30,138,82,0.9)" }}>
                Encrypted · Active
              </span>
            </div>
          )}
        </div>

        {/* Tagline — only when expanded */}
        {isExpanded && (
          <div style={{
            marginTop: 10, textAlign: "center",
            fontSize: 8.5, fontWeight: 600,
            color: "rgba(255,255,255,0.20)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            Investigate · Analyze · Secure
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
