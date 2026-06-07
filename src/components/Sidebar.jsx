import { NavLink } from "react-router-dom";

function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: isActive ? "#3b82f6" : "#94a3b8",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    backgroundColor: isActive ? "rgba(59, 130, 246, 0.08)" : "transparent",
    border: isActive ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid transparent",
    fontWeight: isActive ? "600" : "500",
    fontSize: "14px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  return (
    <div
      style={{
        width: "280px",
        flexShrink: 0,
        backgroundColor: "#070b19",
        borderRight: "1px solid #1a223f",
        padding: "30px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ marginBottom: "40px", padding: "0 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1
                style={{
                  color: "#f8fafc",
                  fontSize: "18px",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-heading)",
                }}
              >
                TELINT-AI
              </h1>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "9px",
                  fontWeight: "600",
                  letterSpacing: "0.1em",
                }}
              >
                FORENSIC ENGINE v1.0
              </p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <NavLink to="/upload" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Center
          </NavLink>

          <NavLink to="/" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
            </svg>
            Dashboard
          </NavLink>

          <NavLink to="/risk" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Risk Center
          </NavLink>

          <NavLink to="/mobility" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Mobility Tracker
          </NavLink>

          <NavLink to="/geo" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Geo Intelligence
          </NavLink>

          <NavLink to="/network" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/>
              <polygon points="12 7 17 12 12 17 7 12"/>
            </svg>
            Network Analysis
          </NavLink>

          <NavLink to="/cases" style={linkStyle} className="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Active Cases
          </NavLink>
        </div>
      </div>

      {/* Footer / System Status */}
      <div
        style={{
          borderTop: "1px solid #1a223f",
          paddingTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--success)",
            boxShadow: "0 0 8px var(--success)",
          }}
        />
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
          Secure Sandbox Online
        </span>
      </div>
    </div>
  );
}

export default Sidebar;