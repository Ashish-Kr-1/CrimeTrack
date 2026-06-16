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
  Cpu,
  Globe,
  ChevronRight,
  Wifi,
  AlertTriangle,
  User,
  Lock
} from "lucide-react";

function LoginPage() {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([
    "SECURE SHELL: Initializing port handshake...",
    "UPLINK: Establishing satellite signal lock...",
    "CRYPTO: Negotiating 2048-bit RSA keys...",
  ]);



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

  const handleBypass = (role) => {
    setIsLoading(true);
    setError("");

    const userMap = {
      admin: { u: "admin", p: "admin123" },
      analyst: { u: "analyst", p: "analyst123" }
    };

    const targetCred = userMap[role];
    setUsername(targetCred.u);
    setPassword(targetCred.p);

    setTimeout(() => {
      const res = login(targetCred.u, targetCred.p);
      setIsLoading(false);
      if (res.success) {
        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    }, 800);
  };

  return (
    <div className="cyber-dark-root relative flex flex-col justify-between overflow-hidden h-screen w-screen">

      {/* Visual background overlays */}
      <div className="cyber-starfield" />
      <div className="cyber-grid-overlay" />
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

      {/* Digital Hologram Scanline & Grid overlays on top of the 3D scene */}
      <div
        className="absolute inset-0 z-1 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 229, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "35px 35px"
        }}
      />
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

        {/* Right Side: New auth card with floating badge */}
        <div className="flex-1 flex items-center justify-center md:justify-end w-full max-w-md md:max-w-none py-6 pointer-events-none">
          <div className="max-w-md w-full relative mt-10 pointer-events-auto">

            {/* ── Floating Shield Badge ── */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30">
              <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                {/* Outer slow-pulse ring */}
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: '2.8s' }} />
                {/* Spinning dashed orbit */}
                <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/25 animate-spin-slow" />
                {/* Shield icon core */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 via-cyan-950/80 to-slate-900 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_28px_rgba(0,229,255,0.45)]">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="auth-card-v2"
            >
              {/* Chrome sheen */}
              <div className="cyber-chrome-shine" />

              {/* ── Card Header ── */}
              <div className="text-center mb-7 pt-7">
                <div className="inline-flex items-center gap-2 bg-cyan-950/50 border border-cyan-400/20 rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase">Secure Terminal Active</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight leading-none mb-2">
                  INTRUSION ENTRY KEYWAY
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authenticate credentials to decrypt telecom investigation matrix.
                </p>
              </div>

              {/* ── Error Alert ── */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 p-3.5 bg-red-950/65 border border-red-500/30 rounded-lg flex items-center gap-2.5 overflow-hidden"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-red-200">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">

                {/* Operator ID field */}
                <div>
                  <label htmlFor="login-username" className="cyber-hud-label block mb-2">Operator ID</label>
                  <div className="relative">
                    <div className="auth-input-icon-well">
                      <User className="w-4 h-4 text-cyan-400/70" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      placeholder="admin / analyst"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="cyber-input-v2"
                      required
                    />
                  </div>
                </div>

                {/* Cryptographic Key field */}
                <div>
                  <label htmlFor="login-password" className="cyber-hud-label block mb-2">Cryptographic Key</label>
                  <div className="relative">
                    <div className="auth-input-icon-well">
                      <Lock className="w-4 h-4 text-cyan-400/70" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="cyber-input-v2 pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember / Reset row */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <span className="w-3.5 h-3.5 rounded border border-cyan-400/30 bg-slate-900/60 flex items-center justify-center group-hover:border-cyan-400/60 transition-colors flex-shrink-0" />
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-wide font-semibold">Remember Node</span>
                  </label>
                  <button type="button" className="text-[10px] text-cyan-500/70 hover:text-cyan-400 transition-colors uppercase tracking-wide font-bold">
                    Reset Key
                  </button>
                </div>

                {/* Primary Submit */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isLoading}
                  className="cyber-btn-primary w-full py-3.5 mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      DECRYPTING...
                    </>
                  ) : (
                    <>
                      AUTHENTICATE NODE
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* ── Sandbox Bypass ── */}
              <div className="mt-6 pt-5 border-t border-slate-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-800 to-slate-800" />
                  <span className="cyber-hud-label whitespace-nowrap">Sandbox Bypass</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-800 to-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="bypass-admin-btn"
                    onClick={() => handleBypass("admin")}
                    className="cyber-btn cyber-btn-amber py-2.5 text-xs"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    ADMIN PANEL
                  </button>
                  <button
                    id="bypass-analyst-btn"
                    onClick={() => handleBypass("analyst")}
                    className="cyber-btn cyber-btn-cyan py-2.5 text-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    ANALYST HUB
                  </button>
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
