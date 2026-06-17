import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { AuthContext } from "../context/AuthContext";
import { Search, Bell, Crosshair, Menu, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function Navbar({ onToggleSidebar }) {
  const { diagnosticReport } = useContext(CDRContext);
  const { user, addAuditLog } = useContext(AuthContext);

  return (
    <div
      style={{
        height: "var(--navbar-height, 60px)",
        marginBottom: 18,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        gap: 14,
        flexShrink: 0,
        background: "#ffffff",
        border: "1px solid rgba(22,66,91,0.10)",
        boxShadow: "0 1px 4px rgba(22,66,91,0.08), 0 0 0 1px rgba(22,66,91,0.04)",
      }}
    >
      {/* ── Left: Hamburger + Brand + Search ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>

        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="icon-btn lg:hidden"
          aria-label="Toggle sidebar"
          style={{ flexShrink: 0 }}
        >
          <Menu size={15} />
        </button>

        {/* FCSA Brand mark (desktop, shows when sidebar is collapsed) */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 8, flexShrink: 0, marginRight: 4 }}>
          <div style={{
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width={28} height={28} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", color: "#16425b" }}>FCSA</span>
            <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7a96a8" }}>
              Forensics Cyber Security Agency
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(22,66,91,0.10)", marginLeft: 4 }} />
        </div>

        {/* Search bar */}
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <Search
            size={13}
            style={{
              position: "absolute", left: 12,
              top: "50%", transform: "translateY(-50%)",
              color: "#7a96a8", flexShrink: 0,
            }}
            strokeWidth={2.2}
          />
          <input
            id="nav-search"
            type="text"
            placeholder="Search numbers, IMEIs, towers…"
            aria-label="Search CDR records"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                addAuditLog("SEARCH_REGISTRY", `Searched for suspect telemetry: "${e.target.value}"`);
              }
            }}
            style={{
              width: "100%",
              background: "rgba(22,66,91,0.04)",
              border: "1px solid rgba(22,66,91,0.11)",
              borderRadius: 8,
              color: "#0f2635",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              padding: "8px 14px 8px 34px",
              outline: "none",
              transition: "var(--transition-base)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3a7ca5";
              e.target.style.background = "#ffffff";
              e.target.style.boxShadow = "0 0 0 3px rgba(58,124,165,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(22,66,91,0.11)";
              e.target.style.background = "rgba(22,66,91,0.04)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Notification bell */}
        <button
          id="nav-notifications"
          className="icon-btn"
          aria-label="Notifications"
          style={{ position: "relative" }}
        >
          <Bell size={15} strokeWidth={2} />
          {diagnosticReport && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              width: 15, height: 15, borderRadius: "50%",
              background: "#c0392b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8.5, fontWeight: 800, color: "#fff",
              border: "1.5px solid white",
            }}>
              {diagnosticReport.risk_summary.red_flags_count}
            </span>
          )}
        </button>

        {/* Active target badge */}
        {diagnosticReport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 7,
              background: "rgba(192,57,43,0.07)",
              border: "1px solid rgba(192,57,43,0.20)",
              fontSize: 11,
              fontWeight: 700,
              color: "#a93226",
            }}
          >
            <Crosshair size={12} strokeWidth={2.5} />
            <span style={{ position: "relative", width: 6, height: 6, flexShrink: 0 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#c0392b", opacity: 0.5, animation: "pulse-glow 2s ease-in-out infinite" }} />
              <span style={{ position: "absolute", inset: 1, borderRadius: "50%", backgroundColor: "#c0392b" }} />
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              <span className="hide-mobile" style={{ opacity: 0.65 }}>TARGET: </span>
              {diagnosticReport.target_phone}
            </span>
          </motion.div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(22,66,91,0.10)", flexShrink: 0 }} />

        {/* User badge */}
        <button
          id="nav-user"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px 4px 4px",
            borderRadius: 8,
            border: "1px solid rgba(22,66,91,0.11)",
            background: "rgba(22,66,91,0.03)",
            cursor: "pointer",
            transition: "var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(58,124,165,0.25)";
            e.currentTarget.style.background = "rgba(58,124,165,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(22,66,91,0.11)";
            e.currentTarget.style.background = "rgba(22,66,91,0.03)";
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "linear-gradient(135deg, #16425b 0%, #3a7ca5 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            border: "1.5px solid rgba(90,148,187,0.30)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "white", lineHeight: 1 }}>
              {(user?.username?.[0] || "A").toUpperCase()}
            </span>
          </div>
          <span
            className="hide-mobile"
            style={{
              fontSize: 13, fontWeight: 600,
              color: "#0f2635", letterSpacing: "-0.015em",
              textTransform: "capitalize",
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
