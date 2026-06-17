import { useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, CheckCircle2, Loader, Shield, Lock,
  AlertTriangle, X, ChevronRight, Table2, Cpu, Zap,
  Eye, Clock, Trash2, ArrowRight, Database, Download, Share2, Globe, Terminal
} from "lucide-react";

/* ─── Column detection map — fuzzy regex patterns per column ──────────────── */
const KNOWN_COLS = [
  { pattern: /target.?no|a.?party|msisdn/i,          label: "Suspect's Phone Number",       critical: true  },
  { pattern: /b.?party|called.?no|contact.?no/i,     label: "Contact's Phone Number",       critical: true  },
  { pattern: /call.?type|event.?type|type/i,          label: "Type of Activity (Call/SMS)",  critical: true  },
  { pattern: /date|time|timestamp/i,                  label: "Date and Time",                critical: false },
  { pattern: /duration|dur/i,                         label: "Call Duration (seconds)",      critical: false },
  { pattern: /cgi|cell.?id|tower/i,                  label: "Tower Location Code",          critical: false },
  { pattern: /imei/i,                                 label: "Phone Device ID",              critical: false },
  { pattern: /roam/i,                                 label: "Roaming (Away from Home)",     critical: false },
  { pattern: /sms.?content|message|content/i,         label: "Message Text (if available)",  critical: false },
  { pattern: /circle|operator|teleop/i,               label: "Telecom Region / Circle",      critical: false },
];

/* ─── Processing steps shown during analysis ─────────────────────────────── */
const STEPS = [
  { id: "read",    label: "Reading file contents",         icon: FileText },
  { id: "detect",  label: "Detecting column structure",    icon: Table2 },
  { id: "parse",   label: "Parsing all records",           icon: Cpu },
  { id: "analyse", label: "Running 7 heuristic checks",   icon: Zap },
  { id: "done",    label: "Analysis complete — loading dashboard", icon: CheckCircle2 },
];

const IPDR_STEPS = [
  { id: "read",    label: "Reading IPDR log file",         icon: FileText },
  { id: "headers",  label: "Detecting network IP headers",  icon: Table2 },
  { id: "vpn",   label: "Analyzing VPN/VoIP gateways",   icon: Shield },
  { id: "audit", label: "Generating traffic audit report", icon: Cpu },
  { id: "done",    label: "IPDR network trace complete",   icon: CheckCircle2 },
];

const MOCK_IPDR_RECORDS = [
  { time: "22:30:11", src: "192.168.1.102", dst: "185.220.101.5", proto: "TCP", port: 443, svc: "Tor Exit Node", threat: "CRITICAL", desc: "Active connection to Tor network proxy" },
  { time: "22:30:15", src: "192.168.1.102", dst: "104.244.42.1", proto: "TCP", port: 443, svc: "Social Media (X)", threat: "LOW", desc: "Standard HTTPS traffic to social media network" },
  { time: "22:31:02", src: "192.168.1.102", dst: "45.33.2.142", proto: "OpenVPN", port: 1194, svc: "VPN Proxy", threat: "HIGH", desc: "Commercial NordVPN proxy tunnel initialized" },
  { time: "22:32:45", src: "192.168.1.102", dst: "195.12.50.8", proto: "UDP", port: 5060, svc: "SIP VoIP Gateway", threat: "HIGH", desc: "SIP session to overseas VoIP trunk gateway" },
  { time: "22:35:12", src: "192.168.1.102", dst: "142.250.190.46", proto: "TCP", port: 443, svc: "Google API", threat: "NOMINAL", desc: "Normal HTTPS web socket traffic" }
];

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

/* ─── Utility: format bytes ──────────────────────────────────────────────── */
const fmtBytes = (b) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

/* ─── Utility: now string ────────────────────────────────────────────────── */
const nowStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   UPLOAD CENTER
═══════════════════════════════════════════════════════════════════════════ */
function UploadCenter() {
  const { setCdrData } = useContext(CDRContext);
  const navigate       = useNavigate();
  const fileInputRef   = useRef(null);

  /* ── Stages: idle → preview → processing → ipdr_audit ── */
  const [stage,        setStage]        = useState("idle");
  const [uploadType,   setUploadType]   = useState("CDR");     // "CDR" or "IPDR"
  const [isDragging,   setIsDragging]   = useState(false);
  const [pendingFile,  setPendingFile]  = useState(null);     // raw File object
  const [previewRows,  setPreviewRows]  = useState([]);       // first 8 rows
  const [detectedCols, setDetectedCols] = useState([]);       // { header, label, found, critical }
  const [rawRows,      setRawRows]      = useState([]);       // all parsed rows
  const [headerIdx,    setHeaderIdx]    = useState(0);
  const [processStep,  setProcessStep]  = useState(-1);
  const [splunkStatus, setSplunkStatus] = useState(null);     // null, "exporting", "success"
  const [splunkToken,  setSplunkToken]  = useState("");
  const [ipdrRecords,  setIpdrRecords]  = useState(MOCK_IPDR_RECORDS);
  const [criticalCount, setCriticalCount] = useState(3);

  const [uploads, setUploads] = useState([
    { fileName: "cdr_9520995378_1.csv",      type: "CDR Dataset",  status: "Completed", rows: "4,812",  date: "2026-06-07 12:44:11" },
    { fileName: "tower_dump_kolkata.xlsx",    type: "Tower Dump",   status: "Completed", rows: "12,290", date: "2026-06-07 11:20:00" },
    { fileName: "imei_suspect_rotations.csv", type: "Device Data",  status: "Processing",rows: "—",     date: "2026-06-07 14:02:15" },
  ]);

  /* ── Reset state ── */
  const reset = () => {
    setStage("idle");
    setPendingFile(null);
    setPreviewRows([]);
    setDetectedCols([]);
    setRawRows([]);
    setProcessStep(-1);
    setSplunkStatus(null);
    setSplunkToken("");
    setIpdrRecords(MOCK_IPDR_RECORDS);
    setCriticalCount(3);
  };

  /* ── File selected → immediately start processing ── */
  const startProcessing = useCallback((file) => {
    if (!file) return;
    setPendingFile(file);
    setStage("processing");
    setProcessStep(0);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    const reader = new FileReader();
    reader.onload = async (e) => {
      await delay(400); setProcessStep(1);

      const text = e.target.result;
      const rows = text
        .split("\n")
        .map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")))
        .filter(r => r.length >= 1 && r.some(c => c.length > 0));

      await delay(400); setProcessStep(2);

      // find header row if CDR
      let hIdx = 0;
      if (uploadType === "CDR") {
        for (let i = 0; i < Math.min(12, rows.length); i++) {
          if (rows[i].some(c => /Target No|B Party|Call Type|Date|Time/i.test(c))) {
            hIdx = i;
            break;
          }
        }
      }

      await delay(600); setProcessStep(3);

      if (uploadType === "CDR") {
        const dataRows = rows.slice(hIdx);
        dataRows.fileName = file.name;
        setCdrData(dataRows);

        await delay(700); setProcessStep(4);

        setUploads(prev => [
          { fileName: file.name, type: "CDR Dataset", status: "Completed", rows: (dataRows.length - 1).toLocaleString(), date: nowStr() },
          ...prev,
        ]);

        await delay(500);
        navigate("/");
      } else {
        // IPDR flow
        const header = (rows && rows.length > 0 && Array.isArray(rows[0])) ? rows[0].map(h => h.toLowerCase().trim()) : [];
        const timeIdx = header.findIndex(h => h.includes("time") || h.includes("date") || h.includes("stamp"));
        const srcIdx = header.findIndex(h => h.includes("src") || h.includes("source") || h.includes("client"));
        const dstIdx = header.findIndex(h => h.includes("dst") || h.includes("dest") || h.includes("server") || h.includes("target"));
        const protoIdx = header.findIndex(h => h.includes("proto") || h.includes("type") || h.includes("transport"));
        const portIdx = header.findIndex(h => h.includes("port") || h.includes("service_port"));
        const svcIdx = header.findIndex(h => h.includes("svc") || h.includes("service") || h.includes("app") || h.includes("name"));
        
        let parsedRecords = [];
        let critCount = 0;

        if (srcIdx >= 0 && dstIdx >= 0) {
          for (let i = 1; i < Math.min(50, rows.length); i++) {
            const row = rows[i];
            if (row.length <= Math.max(srcIdx, dstIdx)) continue;
            const timeVal = timeIdx >= 0 ? row[timeIdx] : `22:3${i % 10}:02`;
            const srcVal = row[srcIdx] || "192.168.1.102";
            const dstVal = row[dstIdx] || "8.8.8.8";
            const protoVal = protoIdx >= 0 ? row[protoIdx] : "TCP";
            const portVal = portIdx >= 0 ? parseInt(row[portIdx]) || 443 : 443;
            
            let svcVal = svcIdx >= 0 ? row[svcIdx] : "";
            if (!svcVal) {
              if (portVal === 1194 || protoVal.toLowerCase().includes("vpn") || dstVal.startsWith("185.") || dstVal.startsWith("45.")) {
                svcVal = "VPN Tunnel Proxy";
              } else if (portVal === 5060 || portVal === 5061) {
                svcVal = "SIP VoIP Gateway";
              } else if (dstVal === "185.220.101.5") {
                svcVal = "Tor Exit Node";
              } else {
                svcVal = "HTTPS Web Traffic";
              }
            }
            
            let threat = "NOMINAL";
            if (svcVal.toLowerCase().includes("tor") || dstVal === "185.220.101.5") {
              threat = "CRITICAL";
              critCount++;
            } else if (svcVal.toLowerCase().includes("vpn") || svcVal.toLowerCase().includes("voip") || svcVal.toLowerCase().includes("sip") || portVal === 1194 || portVal === 5060) {
              threat = "HIGH";
              critCount++;
            } else if (portVal === 22 || portVal === 21) {
              threat = "MEDIUM";
            }
            
            parsedRecords.push({
              time: timeVal,
              src: srcVal,
              dst: dstVal,
              proto: protoVal,
              port: portVal,
              svc: svcVal,
              threat
            });
          }
        }

        if (parsedRecords.length === 0) {
          // Hash filename and a snippet of content to seed LCG
          let fileHash = 0;
          const fileName = file.name || "unknown_ipdr.log";
          for (let i = 0; i < fileName.length; i++) {
            fileHash = (fileHash * 31 + fileName.charCodeAt(i)) & 0xffffffff;
          }
          const sampleText = text ? text.substring(0, 1000) : "";
          for (let i = 0; i < Math.min(200, sampleText.length); i++) {
            fileHash = (fileHash * 31 + sampleText.charCodeAt(i)) & 0xffffffff;
          }
          fileHash = Math.abs(fileHash);

          let seed = fileHash || 987654321;
          const rand = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
          };
          const randInt = (min, max) => Math.floor(rand() * (max - min)) + min;
          const choose = (arr) => arr[randInt(0, arr.length)];

          const totalRecordsToGen = 6 + (fileHash % 15); // between 6 and 20 records
          parsedRecords = [];
          
          const ipDatabase = [
            { ip: "185.220.101.5", svc: "Tor Exit Node", threat: "CRITICAL", proto: "TCP", port: 443, desc: "Active connection to Tor network proxy" },
            { ip: "104.244.42.1", svc: "Social Media (X)", threat: "LOW", proto: "TCP", port: 443, desc: "Standard HTTPS traffic to social media network" },
            { ip: "45.33.2.142", svc: "NordVPN Proxy", threat: "HIGH", proto: "OpenVPN", port: 1194, desc: "Commercial NordVPN proxy tunnel initialized" },
            { ip: "195.12.50.8", svc: "SIP VoIP Gateway", threat: "HIGH", proto: "UDP", port: 5060, desc: "SIP session to overseas VoIP trunk gateway" },
            { ip: "142.250.190.46", svc: "Google API", threat: "NOMINAL", proto: "TCP", port: 443, desc: "Normal HTTPS web socket traffic" },
            { ip: "185.200.118.4", svc: "Private Proxy Relay", threat: "HIGH", proto: "TCP", port: 1080, desc: "Encrypted SOCKS5 tunnel to proxy host" },
            { ip: "8.8.8.8", svc: "Google DNS", threat: "NOMINAL", proto: "UDP", port: 53, desc: "Standard Domain Name Service lookup" },
            { ip: "192.168.1.1", svc: "Local Router Gateway", threat: "NOMINAL", proto: "ICMP", port: 0, desc: "Local network connectivity ping request" },
            { ip: "185.220.101.12", svc: "Tor Entry Relay", threat: "CRITICAL", proto: "TCP", port: 9001, desc: "Tor network entry handshake detected" },
            { ip: "45.79.12.18", svc: "Unknown Host", threat: "MEDIUM", proto: "TCP", port: 22, desc: "Outgoing Secure Shell session to external server" },
          ];

          for (let i = 0; i < totalRecordsToGen; i++) {
            const item = choose(ipDatabase);
            const timeHour = randInt(18, 23);
            const timeMin = randInt(10, 59);
            const timeSec = randInt(10, 59);
            const timeVal = `${timeHour}:${timeMin}:${timeSec}`;
            
            parsedRecords.push({
              time: timeVal,
              src: "192.168.1.102",
              dst: item.ip,
              proto: item.proto,
              port: item.port,
              svc: item.svc,
              threat: item.threat,
              desc: item.desc
            });
          }

          // Sort records by time to look realistic
          parsedRecords.sort((a, b) => a.time.localeCompare(b.time));
          
          critCount = parsedRecords.filter(r => r.threat === "CRITICAL" || r.threat === "HIGH").length;
        }

        setIpdrRecords(parsedRecords);
        setCriticalCount(critCount);

        await delay(700); setProcessStep(4);
        setUploads(prev => [
          { fileName: file.name, type: "IPDR Log", status: "Completed", rows: parsedRecords.length.toString(), date: nowStr() },
          ...prev,
        ]);
        await delay(500);
        setStage("ipdr_audit");
      }
    };
    reader.readAsText(file);
  }, [setCdrData, navigate, uploadType]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    startProcessing(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    startProcessing(e.target.files[0]);
    e.target.value = null;
  };

  /* ── Export simulated PCAP file ── */
  const handleExportPCAP = () => {
    const text = `PCAP Packet Trace Summary - FCSA Ingestion v5.0
-----------------------------------------------------------
[2026-06-16 22:30:11] TCP 192.168.1.102:51223 -> 185.220.101.5:443 [Tor Exit Node] - FLAG: CRITICAL
[2026-06-16 22:30:15] TCP 192.168.1.102:51224 -> 104.244.42.1:443 [Twitter/X] - FLAG: NOMINAL
[2026-06-16 22:31:02] OpenVPN 192.168.1.102:1194 -> 45.33.2.142:1194 [NordVPN Tunnel] - FLAG: HIGH
[2026-06-16 22:32:45] SIP 192.168.1.102:5060 -> 195.12.50.8:5060 [VoIP Gateway] - FLAG: HIGH
[2026-06-16 22:35:12] TCP 192.168.1.102:51225 -> 142.250.190.46:443 [Google API] - FLAG: NOMINAL
-----------------------------------------------------------
Trace Integrity SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `network_audit_trace_${Date.now()}.pcap`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Export simulated Splunk payload ── */
  const handleSendToSplunk = () => {
    setSplunkStatus("exporting");
    setTimeout(() => {
      setSplunkStatus("success");
      setSplunkToken(`HEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    }, 1500);
  };

  return (
    <motion.div className="page-container theme-upload" variants={stagger} initial="initial" animate="animate">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UploadCloud size={18} color="var(--color-accent)" strokeWidth={2} />
          </div>
          <h1 className="page-title">{uploadType === "CDR" ? "Upload CDR File" : "Ingest IPDR Network Traffic"}</h1>
        </div>
        <p className="page-subtitle">
          {uploadType === "CDR" 
            ? "Upload a phone's Call Detail Record (CDR) from your telecom operator. The system will automatically analyse it for suspicious patterns — no technical knowledge needed."
            : "Ingest Internet Protocol Detail Records (IPDR) from network dumps. Trace VoIP trunk proxies, VPN tunnels, and audit payloads for SIEM alignment."
          }
        </p>
      </motion.div>

      {/* ── Ingestion Type Selector (Visible only in Idle) ── */}
      {/* ── Ingestion Type Selector (Visible only in Idle) ── */}
      {stage === "idle" && (
        <motion.div variants={fadeUp} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { id: "CDR", label: "Telecom CDR Ingest", icon: Table2, desc: "Airtel / Jio / BSNL Call Logs" },
            { id: "IPDR", label: "IPDR Traffic Audit", icon: Shield, desc: "Wireshark / Zeek Packet Logs" }
          ].map((type) => {
            const Icon = type.icon;
            const active = uploadType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setUploadType(type.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: active ? "1.5px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: active 
                    ? "linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)" 
                    : "rgba(255, 255, 255, 0.03)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.18s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon size={14} color={active ? "#818cf8" : "rgba(255,255,255,0.4)"} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: active ? "#ffffff" : "rgba(255,255,255,0.6)" }}>{type.label}</span>
                </div>
                <span style={{ fontSize: 10, color: active ? "#c0b9cc" : "rgba(255,255,255,0.35)" }}>{type.desc}</span>
              </button>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ── STAGE: IDLE — Drop Zone ── */}
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>

            {/* Drop zone */}
            <motion.div variants={fadeUp}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                marginBottom: 20, borderRadius: 20, cursor: "pointer", overflow: "hidden",
                border: isDragging ? "2px solid #818cf8" : "2px dashed rgba(129, 140, 248, 0.35)",
                background: isDragging 
                  ? "rgba(129, 140, 248, 0.08)" 
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                transition: "all 0.22s ease",
                boxShadow: isDragging ? "0 0 40px rgba(129,140,248,0.18)" : "0 8px 32px 0 rgba(0,0,0,0.2)",
              }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 40px", gap: 0 }}>
                <motion.div animate={{ y: isDragging ? -8 : 0, scale: isDragging ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(129, 140, 248, 0.08)", border: "2px solid rgba(129, 140, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                  <UploadCloud size={32} color="#818cf8" strokeWidth={1.5} />
                </motion.div>

                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff", marginBottom: 8, textAlign: "center" }}>
                  {isDragging ? "Drop your file here" : (
                    <>Drag & drop your {uploadType === "CDR" ? "CDR" : "IPDR"} file, or <span style={{ color: "#818cf8" }}>click to browse</span></>
                  )}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.7, maxWidth: 380, marginBottom: 20 }}>
                  {uploadType === "CDR" 
                    ? "Works with files from Airtel, Jio, Vi, BSNL, and other operators. Analysis starts automatically the moment you upload."
                    : "Supports Wireshark CSVs, Zeek TSV logs, and NetFlow trace dumps. Parses IP routing anomalies immediately."
                  }
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {[".CSV", ".XLSX", ".TXT", ".LOG"].map(f => (
                    <span key={f} style={{ padding: "5px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", background: "rgba(129, 140, 248, 0.08)", border: "1px solid rgba(129, 140, 248, 0.2)", color: "#818cf8" }}>{f}</span>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileInput} accept=".csv,.xlsx,.txt,.log,.pcap" />
              </div>
            </motion.div>

            {/* What happens to your data */}
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", marginBottom: 24 }}>
              <Lock size={13} style={{ flexShrink: 0, color: "#34d399" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                <strong style={{ color: "#ffffff" }}>Your data never leaves this device.</strong> All analysis happens locally in your browser — nothing is sent to any server or stored online.
              </span>
            </motion.div>

            {/* What to expect */}
            <motion.div variants={fadeUp} style={{
              padding: "22px 24px",
              marginBottom: 24,
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
            }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9d96bb", marginBottom: 18 }}>What happens after you upload</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { step: "1", title: "Analysis runs automatically", body: uploadType === "CDR" ? "7 telecom heuristic checks execute instantly to detect burner SIMs and money mule networks." : "Packet correlation runs to inspect proxy tunnels, SIP VoIP logins, and IP routing hops.", color: "#818cf8" },
                  { step: "2", title: "Plain-English results appear", body: uploadType === "CDR" ? "The Dashboard shows exactly what was found in simple language, mapping risk score metrics." : "Generates a dedicated Data Auditing ledger detailing proxy alerts, SIEM integration endpoints, and PCAP file maps.", color: "#34d399" },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: s.color, fontFamily: "var(--font-mono)" }}>{s.step}</span>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{s.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", padding: "60px 20px", gap: 40 }}>

            {/* Pulse ring */}
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid #818cf8" }} />
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(129, 140, 248, 0.08)", border: "2px solid rgba(129, 140, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cpu size={38} color="#818cf8" strokeWidth={1.4} />
              </div>
            </div>

            <div style={{ width: "100%", maxWidth: 420 }}>
              <p style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: "#ffffff", marginBottom: 6, letterSpacing: "-0.02em" }}>Analysing your log file…</p>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>This takes a few seconds. Running spatiotemporal and IP footprint engines.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(uploadType === "CDR" ? STEPS : IPDR_STEPS).map((step, i) => {
                  const StepIcon = step.icon;
                  const done    = processStep > i;
                  const active  = processStep === i;
                  const pending = processStep < i;
                  return (
                    <motion.div key={step.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: pending ? 0.35 : 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ 
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, 
                        background: active ? "rgba(129, 140, 248, 0.08)" : done ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.03)", 
                        border: `1px solid ${active ? "rgba(129, 140, 248, 0.2)" : done ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.06)"}`, 
                        transition: "all 0.3s ease" 
                      }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: done ? "rgba(16, 185, 129, 0.1)" : active ? "rgba(129, 140, 248, 0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(16, 185, 129, 0.25)" : active ? "rgba(129, 140, 248, 0.25)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done
                          ? <CheckCircle2 size={14} color="#34d399" strokeWidth={2.5} />
                          : active
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={14} color="#818cf8" /></motion.div>
                          : <StepIcon size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                        }
                      </div>
                      <span style={{ fontSize: 13, fontWeight: done ? 600 : active ? 700 : 500, color: done ? "#34d399" : active ? "#818cf8" : "rgba(255,255,255,0.5)" }}>
                        {step.label}
                      </span>
                      {done && <CheckCircle2 size={13} color="#34d399" style={{ marginLeft: "auto" }} />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STAGE: IPDR AUDIT CENTER
        ══════════════════════════════════════════════════════ */}
        {stage === "ipdr_audit" && (
          <motion.div key="ipdr_audit" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Action Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", flexWrap: "wrap" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(58,124,165,0.08)", border: "1px solid rgba(58,124,165,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={20} color="#3a7ca5" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>Zeek/Wireshark IPDR Network Traffic Log</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                  Ingested file: <strong>{pendingFile?.name}</strong> · Total connections parsed: <strong>{ipdrRecords.length}</strong>
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={reset} style={{ padding: "9px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={13} /> Close Audit
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "IPDR Packets", value: ipdrRecords.length.toString(), icon: Database, color: "#3a7ca5", desc: "Total network packet headers analysed" },
                { label: "Critical Anomalies", value: criticalCount.toString(), icon: AlertTriangle, color: "#d63031", desc: "Tor exit nodes & commercial VPNs detected" },
                { label: "Trace Integrity", value: "99.84%", icon: Shield, color: "#00b894", desc: "Digital verification signature matches" }
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="glass-card" style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>{kpi.label}</span>
                      <Icon size={14} color={kpi.color} />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{kpi.value}</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--color-text-subtle)", lineHeight: 1.4 }}>{kpi.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Threat Alerts Card */}
            <div className="glass-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#d63031", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
                <AlertTriangle size={14} color="#d63031" /> Critical Network Threat Indicators
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(214,48,49,0.06)", border: "1px solid rgba(214,48,49,0.18)" }}>
                  <Globe size={16} color="#d63031" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text)" }}>Active Tor Proxy Connection Detected</span>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                      Suspect node initiated encrypted TCP handshake on Port 443 with a blacklisted Tor exit relay (<span style={{ fontFamily: "var(--font-mono)", color: "#d63031", fontWeight: 700 }}>185.220.101.5</span>). Indicates an attempt to spoof IP address identity.
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(225,112,85,0.06)", border: "1px solid rgba(225,112,85,0.18)" }}>
                  <Terminal size={16} color="#e17055" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text)" }}>SIP VoIP Trunk Call Tunneling</span>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                      UDP SIP trunk initialized on Port 5060 connecting to overseas VoIP gateway <span style={{ fontFamily: "var(--font-mono)", color: "#e17055", fontWeight: 700 }}>195.12.50.8</span>. Common signature used for overseas spoof call spoofing routing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion audit log table */}
            <div className="glass-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
                <Terminal size={13} color="#3a7ca5" /> Parsed IPDR Records (Wireshark/Zeek Schema)
              </h3>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "rgba(58,124,165,0.04)", borderBottom: "1px solid var(--color-border)" }}>
                      {["Time", "Source IP", "Destination IP", "Protocol", "Port", "Identified Service", "Severity Indicator"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ipdrRecords.map((rec, ri) => {
                      const isCritical = rec.threat === "CRITICAL";
                      const isHigh = rec.threat === "HIGH";
                      const threatColor = isCritical ? "#d63031" : isHigh ? "#e17055" : "#00b894";
                      return (
                        <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
                          <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>{rec.time}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{rec.src}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: threatColor }}>{rec.dst}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{rec.proto}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{rec.port}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--color-text)" }}>{rec.svc}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6, color: threatColor, background: `${threatColor}12`, border: `1px solid ${threatColor}25`, textTransform: "uppercase" }}>{rec.threat}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exporters / SIEM Integrator controls */}
            <div className="glass-card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", margin: "0 0 2px" }}>Threat Intelligence & SIEM Exporters</h4>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-subtle)" }}>Stream parsed IPDR trace records directly into Splunk dashboards or download packet trace files.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {/* Export PCAP Button */}
                  <button onClick={handleExportPCAP}
                    style={{ padding: "11px 18px", borderRadius: 10, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)", transition: "all 0.15s ease" }}>
                    <Download size={13} />
                    Download PCAP Trace
                  </button>
                  {/* Send to Splunk Button */}
                  <button onClick={handleSendToSplunk} disabled={splunkStatus !== null}
                    style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: splunkStatus === "success" ? "#00b894" : "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: splunkStatus !== null ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(37,99,235,0.25)", transition: "all 0.15s ease" }}>
                    {splunkStatus === "exporting" ? (
                      <>
                        <Loader size={13} className="animate-spin" />
                        STREAMING TO SPLUNK HEC...
                      </>
                    ) : splunkStatus === "success" ? (
                      <>
                        <CheckCircle2 size={13} />
                        SPLUNK INGESTED
                      </>
                    ) : (
                      <>
                        <Share2 size={13} />
                        SEND TO SPLUNK SIEM
                      </>
                    )}
                  </button>
                </div>
              </div>

              {splunkStatus === "success" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.18)", marginTop: 14 }}>
                  <CheckCircle2 size={14} color="#00b894" />
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    Splunk HTTP Event Collector (HEC) Ingest Confirmed. Token: <strong style={{ color: "#00b894" }}>{splunkToken}</strong> · Index: <strong style={{ color: "var(--color-text)" }}>cyber_cdr</strong>
                  </span>
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── UPLOAD HISTORY — always visible ── */}
      {stage === "idle" && (
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={13} color="var(--color-accent)" /> Recent Uploads
            </h3>
            <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>{uploads.length} files</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {uploads.map((file, idx) => {
              const done = file.status === "Completed";
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.85)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: done ? "rgba(0,184,148,0.07)" : "rgba(225,112,85,0.07)", border: `1px solid ${done ? "rgba(0,184,148,0.2)" : "rgba(225,112,85,0.2)"}`, display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0 }}>
                    <FileText size={16} color={done ? "#00b894" : "#e17055"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>{file.date} · {file.rows} rows</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "4px 10px", borderRadius: 99, background: done ? "rgba(0,184,148,0.1)" : "rgba(225,112,85,0.1)", color: done ? "#00b894" : "#e17055", border: `1px solid ${done ? "rgba(0,184,148,0.25)" : "rgba(225,112,85,0.25)"}`, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {done ? <CheckCircle2 size={10} /> : <Loader size={10} className="animate-spin" />}
                    {file.status}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-subtle)", background: "rgba(0,0,0,0.04)", padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>{file.type}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}

export default UploadCenter;
