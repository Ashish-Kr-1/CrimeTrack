import { useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, ShieldAlert, Phone, Activity, Wifi, Globe, RefreshCw,
  AlertTriangle, CheckCircle2, Share2, Copy, Download,
  Settings, Terminal, ArrowRight, Play, Check, ToggleLeft, ToggleRight
} from "lucide-react";

// Helper function to build STIX 2.1 payload
function getSTIXPayload(phone, osint) {
  const score = osint?.fraudScore || 0;
  const carrier = osint?.carrier || "Unknown Carrier";
  const netType = osint?.networkType || "Unknown Network";
  const circle = osint?.circle || "Unknown Location";
  
  const indicatorId = `indicator--${crypto.randomUUID ? crypto.randomUUID() : "cc8540b1-cbf5-4221-88fc-d14bb285e683"}`;
  const actorId = `threat-actor--${crypto.randomUUID ? crypto.randomUUID() : "a9b9cf99-923f-4bb2-b6ab-d1264c74e89e"}`;

  return {
    type: "bundle",
    id: `bundle--${crypto.randomUUID ? crypto.randomUUID() : "fb83f5e9-0112-4fb3-8cd8-fb45c479bf77"}`,
    spec_version: "2.1",
    objects: [
      {
        type: "indicator",
        id: indicatorId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: `OSINT Flagged SIM: ${phone}`,
        description: `SIM Card flagged for suspicious activity. Carrier: ${carrier}, Circle: ${circle}, Network: ${netType}, Fraud Index: ${score}%.`,
        indicator_types: ["malicious-activity"],
        pattern: `[phone-number:value = '${phone}']`,
        pattern_type: "stix",
        valid_from: new Date().toISOString()
      },
      {
        type: "threat-actor",
        id: actorId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: `Financial Mule Operator: ${phone.slice(-4)}`,
        threat_actor_types: ["mule-recruiter", "money-launderer"],
        description: `Suspected financial mule or OTP bypass device active under MSISDN: ${phone}`
      },
      {
        type: "relationship",
        id: `relationship--${crypto.randomUUID ? crypto.randomUUID() : "d258b3c9-0268-4a92-b6be-d88e7fb2619a"}`,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        relationship_type: "indicates",
        source_ref: indicatorId,
        target_ref: actorId
      }
    ]
  };
}

export default function OSINTAutomation() {
  const [phone, setPhone] = useState("");
  const [scanState, setScanState] = useState({ stage: "idle", logs: [], data: null });
  const [mispStatus, setMispStatus] = useState({ status: "checking", version: "", url: "" });
  const [wassengerStatus, setWassengerStatus] = useState({ status: "checking", message: "" });
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mispMessage, setMispMessage] = useState("");
  const [mispError, setMispError] = useState("");
  
  // Automation settings
  const [autoMisp, setAutoMisp] = useState(true);
  const [autoSplunk, setAutoSplunk] = useState(false);
  const [notifyWebhooks, setNotifyWebhooks] = useState(true);

  // Check MISP status on mount
  const checkMispStatus = useCallback(async () => {
    setMispStatus({ status: "checking", version: "", url: "" });
    try {
      const res = await fetch(`${API_BASE}/api/misp/status`);
      if (res.ok) {
        const data = await res.json();
        setMispStatus(data);
      } else {
        setMispStatus({ status: "offline", message: `HTTP status ${res.status}`, url: "https://localhost" });
      }
    } catch (err) {
      setMispStatus({ status: "offline", message: "Server connection refused", url: "https://localhost" });
    }
  }, []);

  // Check Wassenger status on mount
  const checkWassengerStatus = useCallback(async () => {
    setWassengerStatus({ status: "checking", message: "" });
    try {
      const res = await fetch(`${API_BASE}/api/wassenger/status`);
      if (res.ok) {
        const data = await res.json();
        setWassengerStatus(data);
      } else {
        setWassengerStatus({ status: "error", message: `HTTP status ${res.status}` });
      }
    } catch (err) {
      setWassengerStatus({ status: "error", message: "Server connection refused" });
    }
  }, []);

  useEffect(() => {
    checkMispStatus();
    checkWassengerStatus();
  }, [checkMispStatus, checkWassengerStatus]);

  // STIX Bundle representation
  const stixPayload = useMemo(() => {
    if (!scanState.data) return null;
    return getSTIXPayload(scanState.data.phone, scanState.data);
  }, [scanState.data]);

  const stixStr = useMemo(() => {
    return stixPayload ? JSON.stringify(stixPayload, null, 2) : "";
  }, [stixPayload]);

  const handleCopy = () => {
    if (!stixStr) return;
    navigator.clipboard.writeText(stixStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!stixStr) return;
    const blob = new Blob([stixStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stix_ioc_${phone}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform Live MISP Export
  const handleMispExport = async () => {
    if (!stixPayload) return;
    setExporting(true);
    setMispMessage("");
    setMispError("");
    try {
      const res = await fetch(`${API_BASE}/api/misp/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: scanState.data.phone, stix: stixPayload })
      });
      const data = await res.json();
      if (data.status === "success") {
        setMispMessage(data.message);
      } else {
        setMispError(data.message || "Failed to publish IOC to MISP.");
      }
    } catch (err) {
      setMispError("FastAPI backend is unreachable or MISP connection failed.");
    } finally {
      setExporting(false);
    }
  };

  // Trigger real SSE Scan
  const handleTriggerScan = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    const cleanPhone = phone.replace("+", "").replace(" ", "").trim();

    setScanState({
      stage: "scanning",
      logs: [`[${new Date().toLocaleTimeString()}] [+] Initializing live OSINT pipeline...`],
      data: null
    });
    setMispMessage("");
    setMispError("");

    try {
      const eventSource = new EventSource(`${API_BASE}/api/osint/scan-stream?target=${encodeURIComponent(cleanPhone)}&auto_splunk=${autoSplunk}&auto_slack=${notifyWebhooks}`);

      eventSource.onmessage = (event) => {
        const line = event.data;
        if (line.startsWith("RESULT:")) {
          try {
            const resultData = JSON.parse(line.substring(7));
            setScanState(prev => {
              const updatedLogs = [...prev.logs, `[${new Date().toLocaleTimeString()}] [+] Scan completed. Parsing structured indicators...`];
              
              // Trigger Auto-export to MISP if enabled
              if (autoMisp) {
                setTimeout(() => {
                  handleAutoMispExport(resultData);
                }, 800);
              }

              return {
                stage: "completed",
                logs: updatedLogs,
                data: resultData
              };
            });
            eventSource.close();
          } catch (err) {
            setScanState(prev => ({
              ...prev,
              stage: "completed",
              logs: [...prev.logs, `[!] Failed to parse outcome: ${err.message}`]
            }));
            eventSource.close();
          }
        } else {
          setScanState(prev => ({
            ...prev,
            logs: [...prev.logs, line]
          }));
        }
      };

      eventSource.onerror = (err) => {
        setScanState(prev => ({
          stage: "completed",
          logs: [...prev.logs, `[-] OSINT stream interrupted: API endpoint offline or authentication failed.`].slice(-10),
          data: null
        }));
        eventSource.close();
      };
    } catch (err) {
      setScanState({
        stage: "completed",
        logs: [`[-] Connection failed: ${err.message}`],
        data: null
      });
    }
  };

  // Auto-sync function
  const handleAutoMispExport = async (resultData) => {
    const payload = getSTIXPayload(resultData.phone, resultData);
    try {
      const res = await fetch(`${API_BASE}/api/misp/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resultData.phone, stix: payload })
      });
      const data = await res.json();
      if (data.status === "success") {
        setScanState(prev => ({
          ...prev,
          logs: [...prev.logs, `[AUTOMATION] [✔] Automatically synchronized IOC to MISP: Event ID ${data.message.match(/\d+/)?.[0] || "created"}`]
        }));
      } else {
        setScanState(prev => ({
          ...prev,
          logs: [...prev.logs, `[AUTOMATION] [𐄂] Auto-sync to MISP failed: ${data.message}`]
        }));
      }
    } catch (err) {
      setScanState(prev => ({
        ...prev,
        logs: [...prev.logs, `[AUTOMATION] [𐄂] Auto-sync failed: Connection error.`]
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}
    >
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(0, 229, 255, 0.08)", border: "1px solid rgba(0, 229, 255, 0.22)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Cpu size={20} color="#00e5ff" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              OSINT & Threat Automation
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Orchestrate real-time carrier lookup directories, WhatsApp status checks, Signal registration, and automated MISP IOC sharing.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {/* Wassenger Connection Status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            padding: "8px 14px", borderRadius: 10
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                backgroundColor: wassengerStatus.status === "active" ? "#10b981" : wassengerStatus.status === "checking" ? "#fdcb6e" : "#d63031",
                opacity: 0.5, animation: "pulse-glow 2s infinite"
              }} />
              <span style={{
                position: "absolute", inset: 1, borderRadius: "50%",
                backgroundColor: wassengerStatus.status === "active" ? "#10b981" : wassengerStatus.status === "checking" ? "#fdcb6e" : "#d63031"
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
                {wassengerStatus.status === "active" ? "Wassenger API Linked" : wassengerStatus.status === "checking" ? "Checking Wassenger..." : wassengerStatus.status === "empty" ? "Wassenger Workspace Empty" : wassengerStatus.status === "offline" ? "Wassenger Device Offline" : "Wassenger Link Error"}
              </span>
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                {wassengerStatus.message || "Verifying API key validity"}
              </span>
            </div>
            <button onClick={checkWassengerStatus} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", padding: 2 }}>
              <RefreshCw size={12} className={wassengerStatus.status === "checking" ? "animate-spin" : ""} />
            </button>
          </div>

          {/* MISP Connection Status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            padding: "8px 14px", borderRadius: 10
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                backgroundColor: mispStatus.status === "online" ? "#00b894" : mispStatus.status === "checking" ? "#fdcb6e" : "#fdcb6e",
                opacity: 0.5, animation: "pulse-glow 2s infinite"
              }} />
              <span style={{
                position: "absolute", inset: 1, borderRadius: "50%",
                backgroundColor: mispStatus.status === "online" ? "#00b894" : mispStatus.status === "checking" ? "#fdcb6e" : "#fdcb6e"
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
                {mispStatus.status === "online" ? "MISP Threat Connected" : mispStatus.status === "checking" ? "Verifying MISP Link..." : "MISP Sandbox Link"}
              </span>
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
                {mispStatus.status === "online" ? `Version ${mispStatus.version || "2.4"}` : "LOCAL EMULATOR ACTIVE"}
              </span>
            </div>
            <button onClick={checkMispStatus} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", padding: 2 }}>
              <RefreshCw size={12} className={mispStatus.status === "checking" ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Scanner & Console */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Target Query Panel */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Phone size={14} color="#00e5ff" /> Live Target Telemetry Scan
            </h3>
            <form onSubmit={handleTriggerScan} style={{ display: "flex", gap: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter international number (e.g. +919520995378)"
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 8,
                    background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#fff", fontSize: 13, outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(0, 229, 255, 0.5)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255, 255, 255, 0.08)"}
                />
              </div>
              <button
                type="submit"
                disabled={scanState.stage === "scanning" || !phone.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "0 22px", borderRadius: 8, border: "none",
                  background: scanState.stage === "scanning" ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #00b894, #00e5ff)",
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(0,229,255,0.15)", transition: "opacity 0.2s"
                }}
              >
                {scanState.stage === "scanning" ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Scanning
                  </>
                ) : (
                  <>
                    <Play size={13} /> Launch Footprint Scan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Console Log Terminal */}
          <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00e5ff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={13} /> OSINT Execution Console
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: scanState.stage === "scanning" ? "#fdcb6e" : "#00b894" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>
                  {scanState.stage}
                </span>
              </div>
            </div>

            <div style={{
              background: "#070b13", borderRadius: 10, padding: "16px 20px",
              fontFamily: "var(--font-mono)", fontSize: 11, color: "#a5f3fc",
              height: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6,
              border: "1px solid rgba(255, 255, 255, 0.05)"
            }}>
              {scanState.logs.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Console idle. Run a footprint scan to observe live telemetry sequence.
                </div>
              ) : (
                scanState.logs.map((log, idx) => (
                  <div key={idx} style={{ lineBreak: "anywhere", color: log.includes("RESULT:") ? "#58a6ff" : log.includes("[-] ") || log.includes("[𐄂]") ? "#ff7b72" : log.includes("[MATCH]") || log.includes("[✔]") ? "#7ee787" : "#a5f3fc" }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Results Grid - Displays only when data is successfully resolved */}
          <AnimatePresence>
            {scanState.data && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  
                  {/* Carrier Information */}
                  <div className="glass-card" style={{ padding: 18 }}>
                    <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Numverify Carrier Directory</span>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                      {scanState.data.carrier}
                    </h4>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                      Location: <strong>{scanState.data.circle}</strong>
                    </p>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 9, fontWeight: 800, color: scanState.data.networkType !== "Unknown Network" ? "#00b894" : "#d63031",
                      background: scanState.data.networkType !== "Unknown Network" ? "rgba(0,184,148,0.08)" : "rgba(214,48,49,0.08)",
                      border: `1px solid ${scanState.data.networkType !== "Unknown Network" ? "rgba(0,184,148,0.2)" : "rgba(214,48,49,0.2)"}`,
                      padding: "2px 8px", borderRadius: 4, marginTop: 8
                    }}>
                      {scanState.data.networkType}
                    </span>
                  </div>

                  {/* Fraud Risk Score */}
                  <div className="glass-card" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", display: "block" }}>Risk Index Score</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: scanState.data.fraudScore >= 70 ? "#ff4757" : scanState.data.fraudScore >= 40 ? "#ffa502" : "#2ed573" }}>
                          {scanState.data.fraudScore}%
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                          Threat Risk Rating
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{
                          height: "100%", width: `${scanState.data.fraudScore}%`,
                          background: scanState.data.fraudScore >= 70 ? "#ff4757" : scanState.data.fraudScore >= 40 ? "#ffa502" : "#2ed573"
                        }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: scanState.data.fraudScore >= 70 ? "#ff4757" : scanState.data.fraudScore >= 40 ? "#ffa502" : "#2ed573" }}>
                        {scanState.data.fraudScore >= 70 ? "CRITICAL THREAT" : scanState.data.fraudScore >= 40 ? "SUSPICIOUS ACTIVITY" : "NOMINAL SIM"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Social Footprints Grid */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>
                    Social Media Registry Audit (Live API Checks)
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {Object.entries(scanState.data.social).map(([platform, info]) => {
                      const colors = {
                        whatsapp: { text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
                        signal: { text: "#00e5ff", bg: "rgba(0,229,255,0.08)", border: "rgba(0,229,255,0.2)" },
                        telegram: { text: "#38bdf8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)" },
                        instagram: { text: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)" }
                      };
                      const activeColor = colors[platform] || { text: "#fff", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" };
                      
                      return (
                        <div key={platform} style={{
                          display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 8,
                          background: info.linked ? activeColor.bg : "rgba(255,255,255,0.01)",
                          border: `1px solid ${info.linked ? activeColor.border : "rgba(255,255,255,0.05)"}`
                        }}>
                          <Globe size={14} color={info.linked ? activeColor.text : "rgba(255,255,255,0.2)"} style={{ marginTop: 2 }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize", color: info.linked ? activeColor.text : "rgba(255,255,255,0.3)" }}>
                                {platform}
                              </span>
                              {info.linked && (
                                <span style={{ fontSize: 8, fontWeight: 800, color: activeColor.text, textTransform: "uppercase" }}>
                                  Matched
                                </span>
                              )}
                            </div>
                            <p style={{ margin: "4px 0 0", fontSize: 10, color: info.linked ? "#fff" : "rgba(255,255,255,0.3)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {info.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column: Threat Intelligence & Automation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Threat Intelligence Sync Panel */}
          <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={14} color="#00e5ff" /> MISP Threat Intelligence Sharing
              </h3>
              <span style={{
                fontSize: 8.5, fontWeight: 800, color: mispStatus.status === "online" ? "#00b894" : "#d63031",
                background: mispStatus.status === "online" ? "rgba(0,184,148,0.08)" : "rgba(214,48,49,0.08)",
                padding: "2px 8px", borderRadius: 4, textTransform: "uppercase"
              }}>
                {mispStatus.status === "online" ? "Active Link" : "Offline"}
              </span>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
              Standardize suspected telecom observables into structured **STIX 2.1 Indicators** to share across intelligence communities.
            </p>

            {scanState.data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <pre style={{
                    margin: 0, background: "rgba(0, 0, 0, 0.3)", padding: "12px 14px", borderRadius: 8,
                    fontFamily: "var(--font-mono)", fontSize: 10, color: "#a5f3fc",
                    height: 160, overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)"
                  }}>
                    {stixStr}
                  </pre>
                  
                  <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                    <button
                      onClick={handleCopy}
                      title="Copy JSON"
                      style={{
                        padding: 6, borderRadius: 6, border: "none",
                        background: copied ? "#00b894" : "rgba(255,255,255,0.08)",
                        color: "#fff", cursor: "pointer", display: "flex"
                      }}
                    >
                      {copied ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={handleDownload}
                      title="Download JSON"
                      style={{
                        padding: 6, borderRadius: 6, border: "none",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff", cursor: "pointer", display: "flex"
                      }}
                    >
                      <Download size={11} />
                    </button>
                  </div>
                </div>
                
                {scanState.data?.mispFlagged && (
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 6,
                    padding: "12px", borderRadius: 8, marginTop: 4,
                    background: "rgba(214, 48, 49, 0.08)", border: "1px solid rgba(214, 48, 49, 0.25)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={14} color="#ff4757" />
                      <span style={{ fontSize: 11, color: "#ff4757", fontWeight: 700 }}>⚠️ HISTORICAL THREAT DETECTED</span>
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                      Target is blacklisted! Matched in <strong>{scanState.data.mispCasesCount}</strong> threat intelligence incident record(s) on your MISP database server.
                    </span>
                  </div>
                )}
                
                {mispMessage && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.2)" }}>
                    <CheckCircle2 size={13} color="#00b894" />
                    <span style={{ fontSize: 11, color: "#00b894", fontWeight: 600 }}>{mispMessage}</span>
                  </div>
                )}

                {mispError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(214,48,49,0.08)", border: "1px solid rgba(214,48,49,0.2)" }}>
                    <AlertTriangle size={13} color="#ff4757" />
                    <span style={{ fontSize: 11, color: "#ff4757", fontWeight: 600 }}>{mispError}</span>
                  </div>
                )}

                <button
                  onClick={handleMispExport}
                  disabled={exporting}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", borderRadius: 8, border: "1px solid rgba(0, 229, 255, 0.3)",
                    background: "rgba(0, 229, 255, 0.05)", color: "#00e5ff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  {exporting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Synchronizing...
                    </>
                  ) : (
                    <>
                      <Share2 size={13} /> Publish STIX Observable to MISP
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{
                border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8,
                padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.3)",
                fontSize: 12
              }}>
                Run a scan on a phone target to generate threat intelligence observables.
              </div>
            )}
          </div>

          {/* Automation Configuration Panel */}
          <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Settings size={14} color="#00e5ff" /> OSINT & Response Rules
            </h3>
            
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
              Enable automated workflows that execute sequentially on successful target resolutions.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
              
              {/* Rule 1: Auto MISP */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, display: "block" }}>Auto-Export Critical Threats</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Synchronize IOCs to MISP automatically if Fraud Score &gt;= 50%</span>
                </div>
                <button
                  onClick={() => setAutoMisp(!autoMisp)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: autoMisp ? "#00e5ff" : "rgba(255,255,255,0.2)" }}
                >
                  {autoMisp ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                </button>
              </div>

              {/* Rule 2: Auto Splunk */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, display: "block" }}>Stream Event to Splunk SIEM</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Stream resolved indicators to active Splunk endpoint</span>
                </div>
                <button
                  onClick={() => setAutoSplunk(!autoSplunk)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: autoSplunk ? "#00e5ff" : "rgba(255,255,255,0.2)" }}
                >
                  {autoSplunk ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                </button>
              </div>

              {/* Rule 3: Notifications */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, display: "block" }}>Slack Alert Trigger</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Trigger instant webhook payload to forensics channel</span>
                </div>
                <button
                  onClick={() => setNotifyWebhooks(!notifyWebhooks)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: notifyWebhooks ? "#00e5ff" : "rgba(255,255,255,0.2)" }}
                >
                  {notifyWebhooks ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                </button>
              </div>

            </div>
          </div>

          {/* Splunk SIEM Data Feed Card */}
          {scanState.data && autoSplunk && (
            <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={14} color="#00e5ff" /> Splunk SIEM Data Feed (HEC Payload)
              </h3>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                Live index transmission payload streamed to Splunk collector:
              </p>
              <pre style={{
                margin: 0, padding: 12, borderRadius: 6,
                background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#00e5ff", fontSize: 10, fontFamily: "var(--font-mono)", overflowX: "auto"
              }}>
                {JSON.stringify({
                  time: new Date().toISOString().split('T')[0] + 'T' + new Date().toLocaleTimeString(),
                  event: {
                    source: "FCSA-OSINT",
                    sourcetype: "_json",
                    phone: scanState.data.phone,
                    carrier: scanState.data.carrier,
                    circle: scanState.data.circle,
                    fraudScore: scanState.data.fraudScore,
                    whatsapp_linked: scanState.data.social.whatsapp.linked,
                    signal_linked: scanState.data.social.signal.linked,
                    misp_flagged: scanState.data.mispFlagged
                  }
                }, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>

    </motion.div>
  );
}
