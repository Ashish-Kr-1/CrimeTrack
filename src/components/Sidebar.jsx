import { NavLink } from "react-router-dom";

function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    color: "white",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "10px",
    backgroundColor: isActive
      ? "#1E293B"
      : "transparent",
    transition: "0.3s",
  });

  return (
    <div
      style={{
        width: "260px",
        flexShrink: 0,
        backgroundColor: "#0F172A",
        borderRight: "1px solid #1E293B",
        padding: "25px",
      }}
    >
      <h1
        style={{
          color: "#3B82F6",
          marginBottom: "40px",
          fontSize: "42px",
        }}
      >
        TELINT-AI
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <NavLink to="/upload" style={linkStyle}>
          📁 Upload Center
        </NavLink>

        <NavLink to="/" style={linkStyle}>
          📊 Dashboard
        </NavLink>

        <NavLink to="/risk" style={linkStyle}>
          ⚠️ Risk Center
        </NavLink>

        <NavLink to="/mobility" style={linkStyle}>
          📍 Mobility Intelligence
        </NavLink>

        <NavLink to="/geo" style={linkStyle}>
          🌍 Geo Intelligence
        </NavLink>

        <NavLink to="/network" style={linkStyle}>
  🕸 Network Analysis
</NavLink>

        <NavLink to="/cases" style={linkStyle}>
          📂 Cases
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;