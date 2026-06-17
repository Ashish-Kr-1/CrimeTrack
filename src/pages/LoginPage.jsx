import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Spline from "@splinetool/react-spline";
import { AuthContext } from "../context/AuthContext";
import "../login-theme.css";
import {
  Shield, Eye, EyeOff, Terminal, Wifi,
  AlertTriangle, User, Key, ArrowRight, ShieldCheck,
} from "lucide-react";

/* Inline FCSA Fingerprint-Shield SVG */
function FCSAShield({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 15 L 25 23 L 25 58 Q 25 75 50 85 Z" fill="#EBF3F9" />
      <path d="M 50 15 L 75 23 L 75 58 Q 75 75 50 85 Z" fill="#E5EAEF" />

      <path d="M 45 62 A 5 6 0 0 1 55 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 41 62 A 9 10 0 0 1 59 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 37 62 A 13 14 0 0 1 63 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 33 62 A 17 18 0 0 1 67 62" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 45 62 L 45 68" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 55 62 L 55 68" stroke="#94A3B8" stroke-width="2.5" strokeLinecap="round" fill="none" />
      <path d="M 41 62 L 41 72" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 59 62 L 59 72" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 48 55 A 2 3 0 0 1 52 55" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      <path d="M 50 15 L 25 23 L 25 58 Q 25 75 50 85" stroke="#3b82f6" strokeWidth="3.2" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <path d="M 50 15 L 75 23 L 75 58 Q 75 75 50 85" stroke="#0f3347" strokeWidth="3.2" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      
      <path d="M 25 38 L 18 38 L 13 32" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="13" cy="32" r="2.8" fill="#3b82f6" />
      
      <path d="M 25 48 L 16 48 L 13 51 L 9 51" stroke="#3b82f6" stroke-width="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="9" cy="51" r="2.8" fill="#3b82f6" />
      
      <path d="M 25 58 L 20 58 L 13 65" stroke="#3b82f6" stroke-width="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="13" cy="65" r="2.8" fill="#3b82f6" />

      <path d="M 75 38 L 82 38 L 87 32" stroke="#0f3347" stroke-width="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="87" cy="32" r="2.8" fill="#0f3347" />
      
      <path d="M 75 48 L 84 48 L 87 51 L 91 51" stroke="#0f3347" strokeWidth="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="91" cy="51" r="2.8" fill="#0f3347" />
      
      <path d="M 75 58 L 80 58 L 87 65" stroke="#0f3347" stroke-width="2.5" strokeLinecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="87" cy="65" r="2.8" fill="#0f3347" />
    </svg>
  );
}

function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("analyst123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([
    "SECURE CHANNEL: Initializing port handshake...",
    "FCSA GATEWAY: Establishing encrypted tunnel...",
    "CRYPTO: Negotiating session keys...",
  ]);
  const [activeRole, setActiveRole] = useState("analyst");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const feed = [
      "STATUS: FCSA gateway online and verified.",
      "TELEMETRY: Secure channel active (AES-256).",
      "AUDIT: Session logging operational.",
      "UPLINK: CDR forensics engine standby.",
      "COORDINATES: Target prediction matrix ready.",
      "SECURITY: Token ready for authentication.",
    ];
    const interval = setInterval(() => {
      const line = feed[Math.floor(Math.random() * feed.length)];
      setLogs((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${line}`]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hideLogo = () => {
      const viewer = document.querySelector("spline-viewer");
      if (viewer?.shadowRoot) {
        const logo = viewer.shadowRoot.querySelector("#logo");
        if (logo) { logo.style.display = "none"; return true; }
      }
      return false;
    };
    if (hideLogo()) return;
    const interval = setInterval(() => { if (hideLogo()) clearInterval(interval); }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    const creds = {
      analyst: { u: "analyst", p: "analyst123" },
      admin:   { u: "admin",   p: "admin123" },
      officer: { u: "officer", p: "officer123" },
    };
    setUsername(creds[role].u);
    setPassword(creds[role].p);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Authorization credentials required.");
      return;
    }
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (res.success) {
        setLogs((prev) => [...prev, `[OK] Authenticated: ${res.user.username}`]);
        if (res.user.role === "admin") navigate("/admin");
        else navigate("/");
      } else {
        setError(res.message);
        setLogs((prev) => [...prev, `[ERROR] Auth failed: Access Denied.`]);
      }
    }, 1200);
  };

  return (
    <div className="cyber-dark-root relative flex flex-col justify-between overflow-hidden h-screen w-screen">

      {/* Boot splash */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "#060e18" }}
          >
            <div className="flex flex-col items-center gap-6 max-w-sm px-6 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 1, 0.7],
                  boxShadow: [
                    "0 0 20px rgba(58,124,165,0.2)",
                    "0 0 35px rgba(58,124,165,0.5)",
                    "0 0 20px rgba(58,124,165,0.2)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  borderRadius: "16px",
                  border: "1px solid rgba(90,148,187,0.40)",
                  backgroundColor: "rgba(8,20,35,0.85)",
                }}
                className="w-16 h-16 flex items-center justify-center"
              >
                <FCSAShield size={36} />
              </motion.div>
              <div className="space-y-1">
                <h2 className="text-sm font-black tracking-widest text-white uppercase font-mono">
                  FCSA GATEWAY
                </h2>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#5a94bb" }} className="font-mono">
                  INITIALIZING SECURE CHANNEL...
                </p>
              </div>
              <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "rgba(22,66,91,0.5)", border: "1px solid rgba(90,148,187,0.15)" }}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #3a7ca5, #5a94bb)" }}
                />
              </div>
              <span style={{ fontSize: 9, color: "#50728a", fontFamily: "monospace", letterSpacing: "0.12em" }} className="uppercase">
                STATUS // BOOT_OK
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background effects */}
      <div className="cyber-starfield" />
      <div className="cyber-scanline" />

      {/* Spline 3D scene */}
      <div
        className="absolute inset-y-0 left-0 z-0 h-full pointer-events-none"
        style={{
          filter: "invert(1) hue-rotate(180deg) brightness(0.90) contrast(1) saturate(0.7)",
          width: "115%",
          transform: "translateX(-10%)"
        }}
      >
        <Spline
          scene="https://prod.spline.design/Vf1ZUJr3xEc0KUD0/scene.splinecode"
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none"
        style={{ background: "radial-gradient(circle at center, transparent 30%, #060e18 92%)" }} />

      {/* Scanline overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-10"
        style={{ background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.2) 50%)", backgroundSize: "100% 4px" }} />

      {/* ── Header ── */}
      <header className="w-full flex justify-between items-center cyber-header z-20 relative flex-shrink-0 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(22,66,91,0.6)",
            border: "1px solid rgba(90,148,187,0.40)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(58,124,165,0.30)",
          }}>
            <FCSAShield size={28} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", lineHeight: 1, marginBottom: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#3b82f6", fontFamily: "var(--font-sans)" }}>F</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#cdd0ca", fontFamily: "var(--font-sans)" }}>C</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)" }}>S</span>
              <span style={{ position: "relative", fontSize: 16, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center" }}>
                A
                <span style={{
                  position: "absolute",
                  bottom: "30%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "5px",
                  color: "#3b82f6"
                }}>▲</span>
              </span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#5a94bb", textTransform: "uppercase" }}>
              Forensics Cyber Security Agency
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <span style={{ fontSize: 10, fontWeight: 700, color: "#50728a", letterSpacing: "0.1em", textTransform: "uppercase" }} className="hidden sm:inline">
            Secure Access Node
          </span>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(6,14,24,0.7)", padding: "5px 10px",
            border: "1px solid rgba(90,148,187,0.20)", borderRadius: 8,
          }}>
            <Wifi size={12} style={{ color: "#5a94bb" }} />
            <span style={{ fontSize: 9, color: "#5a94bb", fontFamily: "monospace", fontWeight: 700 }}>TLS_OK</span>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center md:items-stretch min-h-0 overflow-y-auto md:overflow-visible pointer-events-auto md:pointer-events-none">

        {/* Left — Telemetry overlays */}
        <div className="hidden md:flex flex-col justify-center items-start flex-1 relative pr-8 pointer-events-none">
          {/* Breach card */}
          <div className="cyber-glass-panel telemetry-card border-glow-amber flex flex-col gap-2.5 select-none mb-6 pointer-events-auto">
            <div className="cyber-chrome-shine" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#d68910", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              CDR Forensics Engine
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "monospace" }}>
              UPLINK: 98.6% active
            </span>
            <span style={{ fontSize: 11, color: "#7a96a8" }}>Bihar/Jharkhand anomaly detected</span>
          </div>

          {/* Telemetry card */}
          <div className="w-68 cyber-glass-panel telemetry-card border-glow-cyan pointer-events-auto flex flex-col gap-4">
            <div className="cyber-chrome-shine" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(90,148,187,0.15)", paddingBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#5a94bb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                INTEL NODE — ST-2784
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a94bb", display: "inline-block", animation: "pulse-fcsa 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 8, color: "#5a94bb", fontFamily: "monospace", fontWeight: 700 }}>LOCK</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              {[
                { l: "STATUS", v: "ACTIVE" },
                { l: "CHANNEL", v: "ENCRYPTED" },
                { l: "BANDWIDTH", v: "350.50 Mbps", wide: true },
              ].map(({ l, v, wide }) => (
                <div key={l} style={{ gridColumn: wide ? "span 2" : undefined }}>
                  <span className="cyber-hud-label" style={{ display: "block", marginBottom: 3 }}>{l}</span>
                  <span className="cyber-hud-value" style={{ color: wide ? "white" : "#c8dce8", fontSize: wide ? 14 : 12, fontWeight: wide ? 800 : 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Login card */}
        <div className="flex-1 flex items-center justify-center md:justify-end w-full max-w-md md:max-w-none py-6 pointer-events-none">
          <div className="max-w-md w-full relative pointer-events-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="secure-access-card"
            >
              {/* Logo well */}
              <div className="flex justify-center mb-5">
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(22,66,91,0.9) 0%, rgba(47,102,144,0.9) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(22,66,91,0.5), 0 0 0 1px rgba(90,148,187,0.25)",
                  border: "1px solid rgba(90,148,187,0.22)",
                }}>
                  <FCSAShield size={40} />
                </div>
              </div>

              {/* Card header */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", lineHeight: 1, marginBottom: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6", fontFamily: "var(--font-sans)" }}>F</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#cdd0ca", fontFamily: "var(--font-sans)" }}>C</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)" }}>S</span>
                  <span style={{ position: "relative", fontSize: 24, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center" }}>
                    A
                    <span style={{
                      position: "absolute",
                      bottom: "30%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "7px",
                      color: "#3b82f6"
                    }}>▲</span>
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#50728a", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
                  Forensics Cyber Security Agency
                </p>
                <p style={{ fontSize: 9, color: "#3a5870", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4, marginBottom: 0 }}>
                  Investigate · Analyze · Secure
                </p>
              </div>

              {/* Role selector */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
                {[
                  { role: "analyst", label: "Analyst", icon: User },
                  { role: "admin",   label: "Admin",   icon: Key },
                  { role: "officer", label: "Officer", icon: Shield },
                ].map(({ role, label, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 5, padding: "9px 4px", borderRadius: 8,
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", cursor: "pointer",
                      transition: "all 0.18s ease",
                      background: activeRole === role
                        ? "linear-gradient(135deg, #3a7ca5 0%, #16425b 100%)"
                        : "transparent",
                      border: activeRole === role
                        ? "1px solid rgba(90,148,187,0.40)"
                        : "1px solid rgba(90,148,187,0.12)",
                      color: activeRole === role ? "white" : "#50728a",
                      boxShadow: activeRole === role ? "0 4px 14px rgba(58,124,165,0.30)" : "none",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  style={{
                    marginBottom: 16, padding: "10px 12px",
                    background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.25)",
                    borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <AlertTriangle size={14} style={{ color: "#c0392b", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#e57373" }}>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label htmlFor="login-username" style={{ fontSize: 10, fontWeight: 700, color: "#50728a", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="secure-access-input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" style={{ fontSize: 10, fontWeight: 700, color: "#50728a", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="secure-access-input"
                      style={{ paddingRight: 44 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#50728a", display: "flex", alignItems: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="secure-access-btn-primary"
                  style={{ marginTop: 4 }}
                >
                  {isLoading ? (
                    <>
                      <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>ACCESS FCSA PLATFORM <ArrowRight size={14} /></>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(90,148,187,0.10)", margin: "20px 0" }} />

              {/* Demo credentials */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#50728a", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
                  Demo Credentials
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { role: "analyst", label: "ANALYST", creds: "analyst / analyst123" },
                    { role: "admin",   label: "ADMIN",   creds: "admin / admin123" },
                    { role: "officer", label: "OFFICER", creds: "officer / officer123" },
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSelect(item.role)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 12px", borderRadius: 8, border: "1px solid", textAlign: "left",
                        cursor: "pointer", transition: "all 0.15s ease", background: "transparent",
                        borderColor: activeRole === item.role ? "rgba(90,148,187,0.30)" : "rgba(90,148,187,0.09)",
                        backgroundColor: activeRole === item.role ? "rgba(58,124,165,0.08)" : "rgba(6,14,24,0.30)",
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#50728a", letterSpacing: "0.08em" }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#c8dce8" }}>{item.creds}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-7xl mx-auto cyber-footer z-20 relative flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pointer-events-none">
        {/* Terminal log */}
        <div style={{
          flex: 1, display: "flex", gap: 10, padding: 12,
          background: "rgba(0,0,0,0.85)", border: "1px solid rgba(22,66,91,0.5)",
          borderRadius: 10, fontFamily: "monospace", maxWidth: 420,
        }} className="pointer-events-auto">
          <Terminal size={14} style={{ color: "#5a94bb", flexShrink: 0, marginTop: 1, animation: "pulse-fcsa 3s ease-in-out infinite" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#5a94bb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              FCSA INTRUSION LOGGER
            </span>
            {logs.map((log, i) => (
              <div key={i} style={{ fontSize: 10, color: "#50728a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Dial gauge */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }} className="self-center sm:self-end pointer-events-auto">
          <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, border: "1.5px dashed rgba(90,148,187,0.30)", borderRadius: "50%", animation: "spin-clockwise 24s linear infinite" }} />
            <div style={{ position: "absolute", inset: 5, border: "1px solid rgba(90,148,187,0.55)", borderRadius: "50%", borderRightColor: "transparent", borderBottomColor: "transparent", animation: "spin-counter-clockwise 32s linear infinite" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#5a94bb", fontFamily: "monospace", lineHeight: 1 }}>16</span>
              <span style={{ fontSize: 7, color: "#50728a", textTransform: "uppercase", letterSpacing: "0.08em" }}>NODE</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#50728a", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 3 }}>
              CONSTELLATION
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "white", fontFamily: "monospace" }}>NODE_LOCK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
