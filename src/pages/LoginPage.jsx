import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Spline from "@splinetool/react-spline";
import { AuthContext } from "../context/AuthContext";
import "../login-theme.css";
import {
  Shield,
  Eye,
  EyeOff,
  Terminal,
  Wifi,
  AlertTriangle,
  User,
  Key,
  ArrowRight
} from "lucide-react";

function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("analyst");
  const [password, setPassword] = useState("analyst123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([
    "SECURE SHELL: Initializing port handshake...",
    "UPLINK: Establishing satellite signal lock...",
    "CRYPTO: Negotiating 2048-bit RSA keys...",
  ]);
  const [activeRole, setActiveRole] = useState("analyst");

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    const creds = {
      analyst: { u: "analyst", p: "analyst123" },
      admin: { u: "admin", p: "admin123" },
      officer: { u: "officer", p: "officer123" }
    };
    setUsername(creds[role].u);
    setPassword(creds[role].p);
  };



  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  // Terminal scroll interval
  useEffect(() => {
    const feed = [
      "STATUS: Terminal sandbox online and verified.",
      "TELEMETRY: Satellite constellation STARLINK online.",
      "AUDIT: Insuring local logging is operational...",
      "UPLINK: Starlink signal stable (451.6 Mbps).",
      "COORDINATES: Target prediction matrix standby.",
      "SECURITY: Session token ready for handshake.",
    ];

    const interval = setInterval(() => {
      const randomLine = feed[Math.floor(Math.random() * feed.length)];
      setLogs((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${randomLine}`]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Hide Spline Logo
  useEffect(() => {
    const hideLogo = () => {
      const viewer = document.querySelector("spline-viewer");
      if (viewer && viewer.shadowRoot) {
        const logo = viewer.shadowRoot.querySelector("#logo");
        if (logo) {
          logo.style.display = "none";
          return true;
        }
      }
      return false;
    };

    if (hideLogo()) return;

    const interval = setInterval(() => {
      if (hideLogo()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);



  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Authorization credentials required.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Artificially delay slightly for key verification simulation
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (res.success) {
        setLogs((prev) => [...prev, `[OK] Handshake success for user: ${res.user.username}`]);
        if (res.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError(res.message);
        setLogs((prev) => [...prev, `[ERROR] Login failure: Access Denied.`]);
      }
    }, 1200);
  };


  return (
    <div className="cyber-dark-root relative flex flex-col justify-between overflow-hidden h-screen w-screen">

      {/* Visual background overlays */}
      <div className="cyber-starfield" />
      <div className="cyber-scanline" />

      {/* ── Spline 3D Scene - Full Screen Background ── */}
      <div
        className="absolute inset-y-0 left-0 z-0 h-full pointer-events-none"
        style={{
          filter: "invert(1) hue-rotate(180deg) brightness(0.95) contrast(1)",
          width: "115%",
          transform: "translateX(-10%)"
        }}
      >
        <Spline
          scene="https://prod.spline.design/Vf1ZUJr3xEc0KUD0/scene.splinecode"
          className="w-full h-full pointer-events-none"
        />
      </div>

      {/* Ambient Vignette & Gradient Mask overlay to blend edges into the dark cyber background */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 35%, #030712 95%)"
        }}
      />

      {/* Digital Hologram Scanline overlay on top of the 3D scene */}
      <div
        className="absolute inset-0 z-1 pointer-events-none opacity-15"
        style={{
          background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
          backgroundSize: "100% 4px"
        }}
      />

      {/* ── Header Overlay ── */}
      <header className="w-full flex justify-between items-center cyber-header z-20 relative flex-shrink-0 pointer-events-none">
        {/* Brand/Shield Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">CYBERDEFEND</h1>
            <span className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase">SYS SECURE GATEWAY</span>
          </div>
        </div>



        {/* SSL indicator / Handshake node */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase hidden sm:inline">
            SECURE HANDSHAKE NODE
          </span>
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 border border-slate-800 rounded shadow-inner">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] text-cyan-300 font-mono">SSL_OK</span>
          </div>
        </div>
      </header>

      {/* ── Main content area overlaying Spline background ── */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center md:items-stretch min-h-0 overflow-y-auto md:overflow-visible pointer-events-auto md:pointer-events-none">

        {/* Left Side: Telemetry overlays (hidden on mobile, floats on desktop) */}
        <div className="hidden md:flex flex-col justify-center items-start flex-1 relative pr-8 pointer-events-none">
          {/* Target Breach Detection indicator */}
          <div className="cyber-glass-panel telemetry-card border-glow-amber flex flex-col gap-2.5 select-none mb-6 pointer-events-auto">
            <div className="cyber-chrome-shine" />
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest leading-none">Target Breach Detection</span>
            <span className="text-sm font-bold text-white font-mono leading-none">UPLINK: 98.6% active</span>
            <span className="text-[11px] text-slate-400 leading-none">Bihar/Jharkhand anomaly</span>
          </div>

          {/* SAT-BRAVO Telemetry Overlay */}
          <div className="w-68 cyber-glass-panel telemetry-card border-glow-cyan pointer-events-auto flex flex-col gap-4">
            <div className="cyber-chrome-shine" />
            <div className="flex items-center justify-between border-b border-cyan-950/60 pb-2.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">SAT-BRAVO ST 2784-A</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[8px] text-cyan-400 font-mono">LOCK</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
              <div>
                <span className="cyber-hud-label block mb-1">STATUS</span>
                <span className="cyber-hud-value text-cyan-200">IN PST / OOC</span>
              </div>
              <div>
                <span className="cyber-hud-label block mb-1">ROUTE</span>
                <span className="cyber-hud-value text-cyan-200">EN ROUTE</span>
              </div>
              <div className="col-span-2">
                <span className="cyber-hud-label block mb-1">BANDWIDTH</span>
                <span className="cyber-hud-value text-white font-bold text-sm">350.50 Mbps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Redesigned Secure Access card */}
        <div className="flex-1 flex items-center justify-center md:justify-end w-full max-w-md md:max-w-none py-6 pointer-events-none">
          <div className="max-w-md w-full relative pointer-events-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="secure-access-card"
            >
              {/* ── Top User Avatar Well ── */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-indigo-500/90 to-purple-600/90 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.35)] border border-indigo-400/20">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* ── Card Header ── */}
              <div className="text-center mb-6">
                <h2 className="text-[26px] font-black text-white tracking-tight leading-none mb-2">
                  Secure Access
                </h2>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">
                  Analyst &bull; Investigator &bull; Administrator
                </p>
              </div>

              {/* ── Role selector tabs ── */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("analyst")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 ${
                    activeRole === "analyst"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_6px_16px_rgba(99,102,241,0.3)]"
                      : "border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-transparent"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  ANALYST
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("admin")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 ${
                    activeRole === "admin"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_6px_16px_rgba(99,102,241,0.3)]"
                      : "border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-transparent"
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("officer")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase transition-all duration-200 ${
                    activeRole === "officer"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_6px_16px_rgba(99,102,241,0.3)]"
                      : "border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-transparent"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  OFFICER
                </button>
              </div>

              {/* ── Error Alert ── */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 p-3 bg-red-950/45 border border-red-500/20 rounded-lg flex items-center gap-2 overflow-hidden"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-red-200">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                {/* Username Input */}
                <div>
                  <label htmlFor="login-username" className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1.5">
                    USERNAME
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

                {/* Password Input */}
                <div>
                  <label htmlFor="login-password" className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-1.5">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="secure-access-input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Access Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="secure-access-btn-primary w-full py-3.5 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      ACCESS PLATFORM
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Separator line */}
              <div className="h-px bg-slate-800/40 my-6" />

              {/* ── Demo Credentials List ── */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">
                  DEMO CREDENTIALS
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { role: "analyst", label: "ANALYST", creds: "analyst / analyst123" },
                    { role: "admin", label: "ADMIN", creds: "admin / admin123" },
                    { role: "officer", label: "OFFICER", creds: "officer / officer123" }
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSelect(item.role)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg border text-left transition-all duration-150 ${
                        activeRole === item.role
                          ? "bg-indigo-950/20 border-indigo-500/30"
                          : "bg-[#0b0f19]/30 border-slate-900 hover:border-slate-800"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">{item.label}</span>
                      <span className="text-[11px] font-mono text-slate-300">{item.creds}</span>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </main>

      {/* ── Footer Overlay ── */}
      <footer className="w-full max-w-7xl mx-auto cyber-footer z-20 relative flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pointer-events-none">
        {/* Terminal Console log */}
        <div className="flex-1 flex gap-3 p-3 bg-black/90 border border-slate-900 rounded-lg font-mono text-[10px] text-slate-400 max-w-md pointer-events-auto">
          <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 flex flex-col gap-1 overflow-hidden">
            <span className="text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider mb-1">LOCAL INTRUSION LOGGER</span>
            {logs.map((log, index) => (
              <div key={index} className="truncate select-none">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Circular dial gauge */}
        <div className="flex items-center gap-4 self-center sm:self-end pointer-events-auto">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer compass ticking ring */}
            <div
              className="absolute inset-0 border border-dashed border-cyan-500/30 rounded-full animate-spin-slow"
              style={{ borderWidth: "1.5px" }}
            />
            {/* Inner glowing index pointer */}
            <div
              className="absolute inset-1.5 border border-cyan-400/60 rounded-full animate-spin-reverse-slow"
              style={{ borderRightColor: "transparent", borderBottomColor: "transparent" }}
            />
            {/* Value label */}
            <div className="flex flex-col items-center">
              <span className="text-[14px] font-black text-cyan-300 font-mono leading-none">16</span>
              <span className="text-[7px] text-slate-500 uppercase tracking-widest scale-90">ACTIVE</span>
            </div>
          </div>
          <div>
            <span className="cyber-hud-label block">CONSTELLATION</span>
            <span className="text-xs font-bold text-white font-mono">NODE_LOCK</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
