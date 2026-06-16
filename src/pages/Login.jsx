import { motion } from "framer-motion";
import { Shield, ArrowRight, Key, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("analyst123");
  const [role, setRole] = useState("analyst");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    const success = login(username, password);

    if (success) {
      navigate("/");
    } else {
      alert("Invalid Credentials");
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else if (selectedRole === "analyst") {
      setUsername("analyst");
      setPassword("analyst123");
    } else if (selectedRole === "officer") {
      setUsername("officer");
      setPassword("officer123");
    }
  };

  const roleColors = {
    analyst: { main: "#6c5ce7", hover: "#5b4cd3", shadow: "rgba(108, 92, 231, 0.28)", glow: "rgba(108, 92, 231, 0.1)" },
    admin: { main: "#e17055", hover: "#d05f44", shadow: "rgba(225, 112, 85, 0.28)", glow: "rgba(225, 112, 85, 0.1)" },
    officer: { main: "#00b894", hover: "#00a383", shadow: "rgba(0, 184, 148, 0.28)", glow: "rgba(0, 184, 148, 0.1)" },
  };

  const getLogoDetails = () => {
    if (role === "admin") {
      return {
        gradient: "linear-gradient(135deg, #e17055 0%, #fab1a0 100%)",
        icon: <Key size={36} />,
        shadow: "0 8px 24px rgba(225, 112, 85, 0.25)",
      };
    }
    if (role === "officer") {
      return {
        gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)",
        icon: <Shield size={36} />,
        shadow: "0 8px 24px rgba(0, 184, 148, 0.25)",
      };
    }
    return {
      gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
      icon: <User size={36} />,
      shadow: "0 8px 24px rgba(108, 92, 231, 0.25)",
    };
  };

  const logoDetails = getLogoDetails();
  const colors = roleColors[role];


  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#decbb7",
        color: "#0f172a",
        fontFamily: "var(--font-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
      }}
    >
      {/* ── Ambient Background — rich layered radials ── */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: [
            "radial-gradient(ellipse 75% 65% at 10% 15%, rgba(108,92,231,0.1) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 55% at 90% 80%, rgba(225,112,85,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 50% at 55% 45%, rgba(0,184,148,0.06) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 40% at 80% 15%, rgba(9,132,227,0.05) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.03,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Main Centered Box wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "60px",
        }}
      >
        {/* LEFT PANEL */}
        <div
          className="hide-mobile"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            paddingRight: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              style={{
                marginBottom: "24px",
                display: "inline-flex",
                borderRadius: "9999px",
                border: `1px solid ${colors.main}24`,
                backgroundColor: `${colors.main}10`,
                padding: "8px 20px",
                color: colors.main,
                fontWeight: "700",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                transition: "all 0.3s ease",
              }}
            >
              ● Monitoring Live Intelligence
            </div>

            <h1
              style={{
                fontSize: "64px",
                lineHeight: "0.95",
                fontWeight: 900,
                letterSpacing: "-3px",
                color: "#0f172a",
                margin: "0 0 24px 0",
              }}
            >
              CRIME
              <br />
              TRACK X
            </h1>

            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                color: "#475569",
                maxWidth: "460px",
                margin: "0 0 40px 0",
                fontWeight: "500",
              }}
            >
              Analyze telecom intelligence, behavioral patterns, hidden networks
              and predictive threat signals through a unified AI-powered
              investigation workspace.
            </p>

            {/* Stats Card Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                width: "100%",
                maxWidth: "460px",
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  borderRadius: "16px",
                  minHeight: "100px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: 0, fontFamily: "var(--font-mono)", lineHeight: 1 }}>755</h3>
                <p style={{ color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: "6px 0 0 0" }}>Events</p>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  borderRadius: "16px",
                  minHeight: "100px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: 0, fontFamily: "var(--font-mono)", lineHeight: 1 }}>31</h3>
                <p style={{ color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: "6px 0 0 0" }}>Contacts</p>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  borderRadius: "16px",
                  minHeight: "100px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ fontSize: "28px", fontWeight: "900", color: "#d63031", margin: 0, fontFamily: "var(--font-mono)", lineHeight: 1 }}>84%</h3>
                <p style={{ color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: "6px 0 0 0" }}>Threat Score</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT PANEL - Login Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: "100%",
            maxWidth: "460px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass-card"
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.94)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
              borderRadius: "28px",
              padding: "40px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.12)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Logo container */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", marginTop: "8px" }}>
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                }}
                style={{
                  display: "flex",
                  height: "80px",
                  width: "80px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "24px",
                  background: logoDetails.gradient,
                  color: "#ffffff",
                  boxShadow: logoDetails.shadow,
                  transition: "all 0.3s ease",
                }}
              >
                {logoDetails.icon}
              </motion.div>
            </div>

            <h2
              style={{
                textAlign: "center",
                fontSize: "32px",
                fontWeight: "800",
                color: "#0f172a",
                letterSpacing: "-1px",
                margin: 0,
              }}
            >
              Secure Access
            </h2>

            <p
              style={{
                marginTop: "8px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "600",
                color: "#64748b",
                margin: "8px 0 0 0",
              }}
            >
              Analyst • Investigator • Administrator
            </p>

            {/* Role Selector */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                marginTop: "32px",
                marginBottom: "32px",
              }}
            >
              {["analyst", "admin", "officer"].map((r) => {
                const isActive = role === r;
                const activeColor = roleColors[r].main;
                const activeShadow = roleColors[r].shadow;
                const roleIcon =
                  r === "admin" ? (
                    <Key size={12} style={{ marginRight: 6 }} />
                  ) : r === "officer" ? (
                    <Shield size={12} style={{ marginRight: 6 }} />
                  ) : (
                    <User size={12} style={{ marginRight: 6 }} />
                  );

                return (
                  <button
                    key={r}
                    onClick={() => handleRoleSelect(r)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px 0",
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderRadius: "12px",
                      border: `1px solid ${isActive ? activeColor : "#cbd5e1"}`,
                      background: isActive ? activeColor : "rgba(248, 250, 252, 0.8)",
                      color: isActive ? "#ffffff" : "#0f172a",
                      cursor: "pointer",
                      boxShadow: isActive ? `0 4px 12px ${activeShadow}` : "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.borderColor = activeColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(248, 250, 252, 0.8)";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                      }
                    }}
                  >
                    {roleIcon}
                    {r}
                  </button>
                );
              })}
            </div>

            {/* Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{
                    width: "100%",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.borderColor = colors.main;
                    e.target.style.boxShadow = `0 0 0 4px ${colors.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#f8fafc";
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter password"
                  style={{
                    width: "100%",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.borderColor = colors.main;
                    e.target.style.boxShadow = `0 0 0 4px ${colors.glow}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#f8fafc";
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                onClick={handleLogin}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "12px",
                  background: colors.main,
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "14px 0",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${colors.shadow}`,
                  marginTop: "24px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.hover;
                  e.currentTarget.style.transform = "scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.main;
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Access Platform
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Demo Credentials */}
            <div
              style={{
                marginTop: "32px",
                borderTop: "1px solid rgba(226, 232, 240, 0.8)",
                paddingTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#94a3b8",
                  margin: "0 0 4px 0",
                }}
              >
                Demo Credentials
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(241, 245, 249, 0.7)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(226, 232, 240, 0.6)",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                <span style={{ fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", fontSize: "9px" }}>Analyst</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>analyst / analyst123</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(241, 245, 249, 0.7)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(226, 232, 240, 0.6)",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                <span style={{ fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", fontSize: "9px" }}>Admin</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>admin / admin123</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(241, 245, 249, 0.7)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(226, 232, 240, 0.6)",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#475569",
                }}
              >
                <span style={{ fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", fontSize: "9px" }}>Officer</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>officer / officer123</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}