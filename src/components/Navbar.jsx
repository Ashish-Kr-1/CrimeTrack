import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Search, Bell, Crosshair, User, Menu, Shield, Key } from "lucide-react";

function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const { diagnosticReport } = useContext(CDRContext);
  const { user, addAuditLog } = useContext(AuthContext);

  const getBadgeDetails = () => {
    const role = user?.role || "analyst";
    if (role === "admin") {
      return {
        text: "Administrator",
        gradient: "linear-gradient(135deg, #e17055 0%, #fab1a0 100%)",
        icon: <Key size={13} color="white" />,
        shadow: "0 2px 8px rgba(225, 112, 85, 0.3)",
        hoverBorder: "rgba(225, 112, 85, 0.22)",
      };
    }
    if (role === "officer") {
      return {
        text: "Officer",
        gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)",
        icon: <Shield size={13} color="white" />,
        shadow: "0 2px 8px rgba(0, 184, 148, 0.3)",
        hoverBorder: "rgba(0, 184, 148, 0.22)",
      };
    }
    return {
      text: "Analyst",
      gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
      icon: <User size={13} color="white" />,
      shadow: "0 2px 8px rgba(108, 92, 231, 0.3)",
      hoverBorder: "rgba(108, 92, 231, 0.22)",
    };
  };

  const badge = getBadgeDetails();
  const role = user?.role || "analyst";

  return (
    <div
      className="glass-card"
      style={{
        height: "var(--navbar-height, 64px)",
        marginBottom: 20,
        borderRadius: "var(--radius-xl)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: 16,
        flexShrink: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* ── Left: Hamburger + Search ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>

        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="icon-btn lg:hidden"
          aria-label="Toggle sidebar"
          style={{ flexShrink: 0 }}
        >
          <Menu size={16} />
        </button>

        {/* Search bar */}
        <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              flexShrink: 0,
            }}
            strokeWidth={2.2}
          />
          <input
            id="nav-search"
            type="text"
            placeholder="Search numbers, IMEIs, cells…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                addAuditLog("SEARCH_REGISTRY", `Searched for suspect telemetry: "${e.target.value}"`);
              }
            }}
            style={{
              width: "100%",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-md)",
              color: "#f8fafc",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              padding: "9px 46px 9px 38px",
              outline: "none",
              transition: "var(--transition-base)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = role === "admin" ? "#e17055" : role === "officer" ? "#00b894" : "#6c5ce7";
              e.target.style.boxShadow = `0 0 0 3px ${role === "admin" ? "rgba(225,112,85,0.18)" : role === "officer" ? "rgba(0,184,148,0.18)" : "rgba(108,92,231,0.18)"}, inset 0 1px 3px rgba(0,0,0,0.3)`;
              e.target.style.background = "rgba(15, 23, 42, 0.95)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.target.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.5)";
              e.target.style.background = "rgba(15, 23, 42, 0.7)";
            }}
          />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

        {/* Notification bell */}
        <button
          id="nav-notifications"
          className="icon-btn"
          aria-label="Notifications"
          style={{ position: "relative" }}
        >
          <Bell size={16} strokeWidth={2} />
          {diagnosticReport && (
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#d63031",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 800,
                color: "#fff",
                boxShadow: "0 0 8px rgba(214, 48, 49, 0.3)",
              }}
            >
              {diagnosticReport.risk_summary.red_flags_count}
            </span>
          )}
        </button>

        {/* Active target badge */}
        {diagnosticReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              background: "rgba(214, 48, 49, 0.08)",
              border: "1px solid rgba(214, 48, 49, 0.22)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#d63031",
            }}
          >
            <Crosshair size={13} strokeWidth={2.5} />
            {/* Pulse dot */}
            <span style={{ position: "relative", width: 6, height: 6, flexShrink: 0 }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backgroundColor: "#d63031",
                  opacity: 0.6,
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  inset: 1,
                  borderRadius: "50%",
                  backgroundColor: "#d63031",
                }}
              />
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span className="hide-mobile" style={{ opacity: 0.7 }}>TARGET: </span>
              {diagnosticReport.target_phone}
            </span>
          </motion.div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "var(--color-border)", flexShrink: 0 }} />

        {/* User badge */}
        <button
          id="nav-user"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "5px 12px 5px 5px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.6)",
            cursor: "pointer",
            transition: "var(--transition-base)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = badge.hoverBorder;
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.85)";
            e.currentTarget.style.boxShadow = `0 2px 8px ${role === 'admin' ? 'rgba(225, 112, 85, 0.18)' : role === 'officer' ? 'rgba(0, 184, 148, 0.18)' : 'rgba(108, 92, 231, 0.18)'}, inset 0 1px 0 rgba(255,255,255,0.05)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)";
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: badge.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `${badge.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
          >
            {badge.icon}
          </div>
          <span
            className="hide-mobile"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
              textTransform: "capitalize"
            }}
          >
            {user?.username || "Analyst"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;