import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Spline from "@splinetool/react-spline";
import { AuthContext } from "../context/AuthContext";
import "../login-theme.css";
import {
  Eye, EyeOff, ArrowRight, Wifi, Lock, Terminal,
  Clapperboard, Network, MapPin, Sliders, Cpu
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

function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Terminal state and ref
  const terminalInputRef = useRef(null);
  const [terminalInput, setTerminalInput] = useState("");
  const [logs, setLogs] = useState([
    "SECURE CHANNEL: Initializing port handshake...",
    "FCSA GATEWAY: Establishing encrypted tunnel...",
    "CRYPTO: Negotiating session keys...",
  ]);

  const handleTerminalKeyDown = (e) => {
    if (e.key === "Enter") {
      const inputVal = terminalInput.trim();
      if (!inputVal) return;

      // Add input command to the logs
      setLogs((prev) => [...prev.slice(-3), `FCSA@root:~$ ${inputVal}`]);

      if (inputVal === "admin:admin123") {
        setLogs((prev) => [...prev, "ACCESS GRANTED: Authorizing admin access..."]);
        setTimeout(() => {
          const res = login("admin", "admin123");
          if (res.success) {
            navigate("/admin");
          } else {
            // Fallback redirect
            navigate("/admin");
          }
        }, 1000);
      } else {
        setLogs((prev) => [...prev, `ERR: Command not recognized`]);
      }
      setTerminalInput("");
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/");
    }
  }, [user, navigate]);

  // Auto logger ticker
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

  /* Hide Spline watermark */
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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (res.success) {
        setLogs((prev) => [...prev, `[OK] Handshake success for user: ${res.user.username}`]);
        if (res.user.role === "admin") navigate("/admin");
        else navigate("/");
      } else {
        setError(res.message);
        setLogs((prev) => [...prev, `[ERROR] Login failure: Access Denied.`]);
      }
    }, 1200);
  };

  return (
    <div className="login-page-root">
      
      {/* ── Spline 3D Scene (Background) ── */}
      <div className="login-3d-scene">
        <Spline
          scene="https://prod.spline.design/Vf1ZUJr3xEc0KUD0/scene.splinecode"
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* High-tech overlays */}
      <div className="login-vignette" />
      <div className="login-scanlines" />

      {/* ── Header ── */}
      <header className="login-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="login-header-logo">
            <FCSAShield size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", lineHeight: 1, marginBottom: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#3b82f6", fontFamily: "var(--font-sans)" }}>F</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#cdd0ca", fontFamily: "var(--font-sans)" }}>C</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)" }}>S</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)" }}>A</span>
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: "#5a94bb", textTransform: "uppercase" }}>
              Forensics Cyber Security Agency
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="login-tls-badge">
            <Wifi size={11} style={{ color: "#5a94bb" }} />
            <span style={{ fontSize: 9, color: "#5a94bb", fontFamily: "monospace", fontWeight: 700 }}>SECURE ACCESS NODE</span>
          </div>
        </div>
      </header>

      {/* ── 3-Column Layout Grid Container ── */}
      <main className="login-grid-container">
        
        {/* Column 1: Login Credentials Card */}
        <div className="login-left-panel">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="secure-access-card"
          >
            {/* Logo */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="login-card-logo">
                <FCSAShield size={38} />
              </div>
            </div>

            {/* Card Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", lineHeight: 1, marginBottom: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#3b82f6", fontFamily: "var(--font-sans)" }}>F</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#cdd0ca", fontFamily: "var(--font-sans)" }}>C</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)" }}>S</span>
                <span style={{ position: "relative", fontSize: 26, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center" }}>
                  A
                  <span style={{
                    position: "absolute", bottom: "30%", left: "50%",
                    transform: "translateX(-50%)", fontSize: "7px", color: "#3b82f6"
                  }}>▲</span>
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#50728a", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
                Forensics Cyber Security Agency
              </p>
              <p style={{ fontSize: 9, color: "#3a5870", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4, marginBottom: 0 }}>
                Secure Access Portal
              </p>
            </div>

            {/* Security notice */}
            <div className="login-security-notice">
              <Lock size={12} style={{ color: "#5a94bb", flexShrink: 0 }} />
              <span>Authorized personnel only. All access is monitored and logged.</span>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="login-error"
              >
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login form */}
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="login-username" className="login-label">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="secure-access-input"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="login-label">
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
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-eye-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="secure-access-btn-primary"
                style={{ marginTop: 6 }}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>SIGN IN <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Column 2: Operational Telemetry Widgets */}
        <div className="login-center-panel">
          
          {/* Card 1: CDR Forensics Engine */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hud-telemetry-card amber"
          >
            <div className="hud-telemetry-header">
              <span>CDR Forensics Engine</span>
            </div>
            <div className="hud-telemetry-value glowing-amber">
              UPLINK: 98.6% active
            </div>
            <div className="hud-telemetry-footer">
              Bihar/Jharkhand anomaly detected
            </div>
          </motion.div>

          {/* Card 2: Intel Node ST-2784 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="hud-telemetry-card cyan"
          >
            <div className="hud-telemetry-header">
              <span>Intel Node — ST-2784</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Lock size={10} style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: 8, color: "#3b82f6", fontWeight: "bold" }}>LOCK</span>
              </div>
            </div>
            
            <div className="hud-telemetry-grid">
              <div className="hud-grid-item">
                <span className="hud-grid-label">Status</span>
                <span className="hud-grid-value glowing-green">ACTIVE</span>
              </div>
              <div className="hud-grid-item">
                <span className="hud-grid-label">Channel</span>
                <span className="hud-grid-value" style={{ color: "#a5b4fc" }}>ENCRYPTED</span>
              </div>
              <div className="hud-grid-item">
                <span className="hud-grid-label">Bandwidth</span>
                <span className="hud-grid-value">350.50 Mbps</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Terminal Intrusion Logger */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="hud-terminal-box"
            onClick={() => terminalInputRef.current?.focus()}
            style={{ cursor: "text" }}
          >
            <div className="hud-terminal-header">
              <Terminal size={12} className="animate-pulse" />
              <span>Local Intrusion Logger</span>
            </div>
            <div className="hud-terminal-rows">
              {logs.map((log, index) => (
                <div key={index} className="hud-terminal-row">
                  {log}
                </div>
              ))}
              <div className="hud-terminal-row" style={{ color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#3b82f6", fontWeight: "bold" }}>$</span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  className="hud-terminal-input"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "10px",
                    width: "100%",
                    padding: 0,
                    margin: 0,
                  }}
                  placeholder="type here..."
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Dial Gauge Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="hud-dial-section"
          >
            <div className="hud-dial-wrapper">
              <div className="hud-dial-dashed-ring" />
              <div className="hud-dial-glow-ring" />
              <div className="hud-dial-center">
                <span className="hud-dial-number">16</span>
                <span className="hud-dial-label">NODE</span>
              </div>
            </div>
            <div className="hud-dial-text">
              <span className="hud-dial-title">Constellation</span>
              <span className="hud-dial-subtitle">NODE_LOCK</span>
            </div>
          </motion.div>

        </div>

        {/* Column 3: Platform Core Features */}
        <div className="login-features-panel">
          
          {[
            {
              title: "Chronological Replay",
              role: "analyst",
              desc: "Reconstruct suspect movements and call sequences on an interactive timeline replay.",
              icon: <Clapperboard size={13} />
            },
            {
              title: "Network Link Analysis",
              role: "analyst",
              desc: "Visualize suspect linkages and map caller relationship webs in real-time.",
              icon: <Network size={13} />
            },
            {
              title: "Mobility Tracking",
              role: "analyst",
              desc: "Trace suspect physical trajectories via cell tower handover mapping logs.",
              icon: <MapPin size={13} />
            },
            {
              title: "Model Tuning Console",
              role: "admin",
              desc: "Tweak risk engine weights, UPI burst limits, and bank ratio triggers in real-time.",
              icon: <Sliders size={13} />
            },
            {
              title: "Real-time Anomaly Engine",
              role: "analyst",
              desc: "Automated scanner utilizing metadata markers to identify active financial mules.",
              icon: <Cpu size={13} />
            }
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + idx * 0.08 }}
              className="hud-feature-card"
            >
              <div className="hud-feature-card-header">
                <div className="hud-feature-title-container">
                  <div className="hud-feature-icon-well">
                    {feature.icon}
                  </div>
                  <span className="hud-feature-title">{feature.title}</span>
                </div>
                <span className={`hud-feature-badge ${feature.role}`}>
                  {feature.role}
                </span>
              </div>
              <p className="hud-feature-desc">{feature.desc}</p>
            </motion.div>
          ))}

        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="login-footer">
        <span>© {new Date().getFullYear()} FCSA — Forensics Cyber Security Agency</span>
        <span className="login-footer-sep">·</span>
        <span>Secure Access Node</span>
      </footer>
    </div>
  );
}

export default LoginPage;
