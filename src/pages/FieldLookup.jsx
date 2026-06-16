import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Radio, Compass, MapPin, AlertCircle, RefreshCw, Server, Send } from "lucide-react";

export default function FieldLookup() {
  const [phone, setPhone] = useState("");
  const [cellId, setCellId] = useState("");
  const [isPinging, setIsPinging] = useState(false);
  const [pingLogs, setPingLogs] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);

  const targets = [
    { phone: "9876543210", suspect: "Rahul Kumar", status: "Active", risk: "Critical", lastActive: "10 mins ago", tower: "Tower_ Patna_East_3B" },
    { phone: "9123456789", suspect: "Amit Singh", status: "Inactive", risk: "Medium", lastActive: "4 hours ago", tower: "Tower_Gaya_South_1" },
    { phone: "9555019283", suspect: "Unknown Target", status: "Active", risk: "High", lastActive: "Just now", tower: "Tower_Muzaffarpur_North_4A" },
  ];

  const handlePing = () => {
    if (!phone && !cellId) return;
    setIsPinging(true);
    setPingLogs([]);

    const steps = [
      "Initializing signal routing via Secure Gateway...",
      `Pinging cell tower transceiver: ${cellId || "Tower_Patna_Auto_Loc_4"}`,
      "Simulating carrier network triangulation...",
      "Receiving response packets from HLR/VLR databases...",
      "Analyzing signal strength indicators (RSSI: -68 dBm)...",
      "Triangulating approximate coordinates: 25.5941° N, 85.1376° E",
      "Telemetry response secured. Target location locked."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setPingLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: step }]);
        if (index === steps.length - 1) {
          setIsPinging(false);
        }
      }, (index + 1) * 600);
    });
  };

  const handleSelectTarget = (t) => {
    setSelectedTarget(t);
    setPhone(t.phone);
    setCellId(t.tower);
  };

  return (
    <div className="page-container theme-mobility" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--color-text)", margin: 0 }}>
          Field Intelligence Lookup
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
          Real-time carrier lookup, triangulation simulation, and active target ping tracing.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="lg:grid-cols-3">
        
        {/* LEFT COLUMN: Suspect Targets Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="lg:col-span-1">
          <div className="glass-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.78)" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Compass size={14} color="#00b894" />
              Active Dispatch Targets
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {targets.map((t) => (
                <div
                  key={t.phone}
                  onClick={() => handleSelectTarget(t)}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: `1px solid ${selectedTarget?.phone === t.phone ? "#00b894" : "rgba(0,0,0,0.06)"}`,
                    background: selectedTarget?.phone === t.phone ? "rgba(0, 184, 148, 0.06)" : "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--color-text)" }}>{t.suspect}</span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        fontSize: "9px",
                        fontWeight: "700",
                        backgroundColor: t.risk === "Critical" ? "rgba(214, 48, 49, 0.08)" : "rgba(225, 112, 85, 0.08)",
                        color: t.risk === "Critical" ? "#d63031" : "#e17055",
                      }}
                    >
                      {t.risk}
                    </span>
                  </div>
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "600" }}>Phone: {t.phone}</span>
                    <span>Last Active: {t.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Triangulation Ping & Telemetry Trace console */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="lg:col-span-2">
          
          {/* Lookup Input Form */}
          <div className="glass-card" style={{ padding: "28px", background: "rgba(255, 255, 255, 0.78)" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={14} color="#00b894" />
              Tower Triangulation Console
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "8px" }}>
                  Suspect Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit number"
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "8px" }}>
                  Cell ID / Tower Address
                </label>
                <input
                  value={cellId}
                  onChange={(e) => setCellId(e.target.value)}
                  placeholder="e.g. Tower_Patna_3B"
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              onClick={handlePing}
              disabled={isPinging || (!phone && !cellId)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "12px",
                background: "#00b894",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "14px 28px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0, 184, 148, 0.25)",
                transition: "all 0.2s ease",
                opacity: isPinging || (!phone && !cellId) ? 0.6 : 1,
              }}
            >
              {isPinging ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Triangulating Suspect...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Initiate Cell Ping
                </>
              )}
            </button>
          </div>

          {/* Live Ping Output Terminal */}
          <div className="glass-card" style={{ padding: "28px", background: "var(--color-dark)", color: "#00b894", border: "1px solid rgba(0,0,0,0.85)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Server size={14} color="#94a3b8" />
                Live Telemetry Terminal Logs
              </h2>
              <span style={{ fontSize: "9px", background: "rgba(0,184,148,0.12)", color: "#00b894", padding: "3px 8px", borderRadius: "6px", fontWeight: "700" }}>
                SECURE SANDBOX
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minHeight: "220px",
                maxHeight: "350px",
                overflowY: "auto",
              }}
            >
              {pingLogs.length === 0 ? (
                <div style={{ color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "8px" }}>
                  <AlertCircle size={16} />
                  Waiting for cell ping initialization...
                </div>
              ) : (
                pingLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: "flex", gap: "10px", lineHeight: 1.5 }}
                  >
                    <span style={{ color: "#64748b" }}>[{log.time}]</span>
                    <span>{log.text}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
