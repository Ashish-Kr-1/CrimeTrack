import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Search, Bell, Crosshair, User, Menu } from "lucide-react";

function Navbar({ onToggleSidebar }) {
  const { diagnosticReport } = useContext(CDRContext);

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
        padding: "0 18px",
        gap: 16,
        flexShrink: 0,
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
              color: "var(--color-text-subtle)",
              flexShrink: 0,
            }}
            strokeWidth={2.5}
          />
          <input
            id="nav-search"
            type="text"
            placeholder="Search numbers, IMEIs, cells…"
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.6)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              padding: "9px 46px 9px 38px",
              outline: "none",
              transition: "var(--transition-base)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-accent)";
              e.target.style.boxShadow = "0 0 0 3px var(--color-accent-dim)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
              e.target.style.boxShadow = "none";
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
            padding: "6px 12px 6px 6px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "transparent",
            cursor: "pointer",
            transition: "var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-hover)";
            e.currentTarget.style.background = "rgba(0,0,0,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={13} color="white" />
          </div>
          <span
            className="hide-mobile"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text)",
              letterSpacing: "-0.01em",
            }}
          >
            Analyst
          </span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;