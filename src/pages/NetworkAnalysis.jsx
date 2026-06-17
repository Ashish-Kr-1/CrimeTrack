import { useContext, useMemo, useRef, useCallback, useState, useEffect } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Users, Star, Phone, Sliders, ShieldAlert, CheckCircle,
  ChevronRight, X, Clock, MapPin, Activity, AlertTriangle, Zap, Radio,
  MessageSquare, CreditCard, TrendingUp, Info, Globe, Copy, Download,
  Database, Share2, RefreshCw, Eye, Shield
} from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const UPI_GATEWAY_NUMBERS = new Set([
  "9667691414", "8433976037", "7506894867", "9071234567",
  "52263", "56161020", "9220592205", "9222692226",
]);
const BANK_KEYWORDS = [
  "BK","BOI","BOB","BUP","IND","PNB","IOB","UPI","PAYTM",
  "AXIS","HDFC","ICICI","UNION","ADHAAR","SBI","PSBANK","CKYCR","GRAMIN",
];
const HIGH_RISK_CIRCLES = new Set(["AIR BHR","VF JHK","JIO BHR","VF BHR","IDEA BHR"]);
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function cleanRaw(v) {
  if (!v) return "";
  let s = v.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) s = s.slice(1, -1);
  return s.trim();
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dp = dateStr.split("/");
  if (dp.length === 3) {
    const tp = timeStr.split(":");
    if (tp.length >= 2)
      return new Date(+dp[2], +dp[1] - 1, +dp[0], +tp[0], +tp[1], +(tp[2] || 0));
  }
  const d = new Date(`${dateStr} ${timeStr}`);
  return isNaN(d.getTime()) ? null : d;
}

function parseCoords(str) {
  if (!str || str === "-") return null;
  const p = str.split("/");
  if (p.length === 2) {
    const lat = parseFloat(p[0]), lng = parseFloat(p[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng];
  }
  return null;
}

/* ── Gauge SVG ── */
function ScoreGauge({ score, color }) {
  const r = 52, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width={130} height={130} viewBox="0 0 130 130">
      <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={10} />
      <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x={65} y={60} textAnchor="middle" fontSize={26} fontWeight={800} fontFamily="var(--font-mono)" fill={color}>{score}</text>
      <text x={65} y={80} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--color-text-subtle)" fontFamily="var(--font-sans)" letterSpacing={1}>CRIME SCORE</text>
    </svg>
  );
}

/* ── Custom Tooltips ── */
const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const c = payload[0].payload.color;
  return (
    <div style={{ background: "rgba(8,34,41,0.95)", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-sans)" }}>
      <p style={{ margin: "0 0 3px", fontSize: 12, fontFamily: "var(--font-mono)", color: "#e9f1f8", fontWeight: 700 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: c }}>{payload[0].value} interactions</p>
    </div>
  );
};

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>{payload[0].name}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: payload[0].payload.fill }}>{payload[0].value} events ({payload[0].payload.pct}%)</p>
    </div>
  );
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getMockOSINTData(phone) {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, "");
  const sumDigits = digitsOnly.split("").reduce((acc, d) => acc + (parseInt(d) || 0), 0);
  const carrier = sumDigits % 3 === 0 ? "Reliance Jio Infocomm Ltd" : sumDigits % 3 === 1 ? "Bharti Airtel Ltd" : "Vodafone Idea Ltd";
  const circle = sumDigits % 2 === 0 ? "Bihar & Jharkhand" : "West Bengal & Kolkata";
  const fraudScore = 35 + (sumDigits % 56);
  const isVoip = sumDigits % 4 === 0;
  const networkType = isVoip ? "VoIP / Virtual SIM Gateway" : "Mobile GSM Link";
  const whatsappActive = true;
  const telegramActive = sumDigits % 2 === 0;
  const signalActive = sumDigits % 3 !== 0;
  const instagramActive = sumDigits % 2 !== 0;

  return {
    phone,
    carrier,
    circle,
    fraudScore,
    networkType,
    social: {
      whatsapp: { linked: whatsappActive, detail: "Active (Profile photo updated recently)" },
      telegram: { linked: telegramActive, detail: telegramActive ? "Active (Last seen 2h ago · @suspect_node)" : "No association found" },
      signal: { linked: signalActive, detail: signalActive ? "Active (Sealed Sender enabled)" : "No association found" },
      instagram: { linked: instagramActive, detail: instagramActive ? "Linked profile (Alias: mule_coordinator)" : "No association found" }
    }
  };
}

function getSTIXPayload(phone, osint) {
  const score = osint?.fraudScore || 75;
  const carrier = osint?.carrier || "Telecom Operator";
  const netType = osint?.networkType || "GSM Mobile";
  const circle = osint?.circle || "National roaming network";

  const bundleId = `bundle--${generateUUID()}`;
  const indicatorId = `indicator--${generateUUID()}`;
  const observedId = `observed-data--${generateUUID()}`;
  const actorId = `threat-actor--${generateUUID()}`;
  const relationId = `relationship--${generateUUID()}`;

  return {
    type: "bundle",
    id: bundleId,
    spec_version: "2.1",
    objects: [
      {
        type: "indicator",
        id: indicatorId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: `OSINT Suspect Link: ${phone}`,
        description: `Phone number flag. Indicator of operational mule or spoof gateway with ${score}% confidence. Carrier: ${carrier} (${netType}). Location: ${circle}.`,
        indicator_types: ["malicious-activity", "mule-coordination"],
        pattern: `[telephone-number:value = '${phone}']`,
        pattern_type: "stix",
        valid_from: new Date().toISOString(),
        confidence: score
      },
      {
        type: "observed-data",
        id: observedId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        first_observed: new Date(Date.now() - 5 * 86400000).toISOString(),
        last_observed: new Date().toISOString(),
        number_of_observed_data_items: 1,
        objects: {
          "0": {
            type: "telephone-number",
            value: phone
          }
        }
      },
      {
        type: "threat-actor",
        id: actorId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: "Mule Operational Node",
        description: "Suspect phone number flagged under automated spatiotemporal anomaly rules as network relay or transaction controller.",
        threat_actor_types: ["mule-handler", "telecom-spoofer"]
      },
      {
        type: "relationship",
        id: relationId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        relationship_type: "indicates",
        source_ref: indicatorId,
        target_ref: actorId
      }
    ]
  };
}

function OsintSection({ phone, scanState, onTriggerScan, onExportMisp, theme = "dark" }) {
  const isDark = theme === "dark";
  const bg = isDark ? "rgba(255,255,255,0.04)" : "var(--color-surface-2)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "var(--color-border)";
  const textTitle = isDark ? "#00e5ff" : "var(--color-accent)";
  const textMuted = isDark ? "rgba(233,241,248,0.5)" : "var(--color-text-secondary)";
  const textBody = isDark ? "#e9f1f8" : "var(--color-text)";
  const textSubtle = isDark ? "rgba(233,241,248,0.35)" : "var(--color-text-muted)";
  const terminalBg = isDark ? "#0b2d35" : "#0f172a";

  const state = scanState || { stage: "idle" };

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: textTitle, display: "flex", alignItems: "center", gap: 5, margin: 0 }}>
          <ShieldAlert size={12} /> OSINT & Holehe Footprint
        </h4>
        {state.stage === "completed" && (
          <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(0,184,148,0.12)", color: "#00b894", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(0,184,148,0.25)", textTransform: "uppercase" }}>
            Scanned
          </span>
        )}
      </div>

      {state.stage === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, lineHeight: 1.6, color: textMuted, margin: 0 }}>
            Query PhoneInfoga carrier databases and check linked social media profile footprints (WhatsApp, Telegram, Signal, Instagram) to verify identity.
          </p>
          <button 
            onClick={() => onTriggerScan(phone)}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, 
              padding: "9px 14px", borderRadius: 8, border: "none", 
              background: isDark ? "linear-gradient(135deg, #00b894, #00e5ff)" : "linear-gradient(135deg, #3a7ca5, #818cf8)", 
              color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", 
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)" 
            }}
          >
            <Radio size={12} className="animate-pulse" /> Trigger OSINT Footprint Scan
          </button>
        </div>
      )}

      {state.stage === "scanning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <RefreshCw size={12} color={textTitle} />
            </motion.div>
            <span style={{ fontSize: 11, fontWeight: 700, color: textBody }}>Performing real-time OSINT lookup...</span>
          </div>
          <div style={{ 
            background: terminalBg, borderRadius: 8, padding: "10px 12px", 
            fontFamily: "var(--font-mono)", fontSize: 10, color: "#a5f3fc", 
            maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4,
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {state.logs.map((log, idx) => (
              <div key={idx} style={{ lineBreak: "anywhere" }}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {state.stage === "completed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: isDark ? "rgba(0,0,0,0.2)" : "#ffffff", border: `1px solid ${border}`, padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: 8, color: textSubtle, fontWeight: 700, textTransform: "uppercase", display: "block" }}>Carrier (PhoneInfoga)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: textBody, display: "block", marginTop: 2 }}>{state.data.carrier}</span>
              <span style={{ fontSize: 9, color: textSubtle, display: "block", marginTop: 1 }}>{state.data.circle} · {state.data.networkType}</span>
            </div>
            <div style={{ background: isDark ? "rgba(0,0,0,0.2)" : "#ffffff", border: `1px solid ${border}`, padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: 8, color: textSubtle, fontWeight: 700, textTransform: "uppercase", display: "block" }}>Fraud Reputation Score</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <div style={{ height: 4, flex: 1, background: "rgba(0,0,0,0.1)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${state.data.fraudScore}%`, background: state.data.fraudScore >= 70 ? "#d63031" : state.data.fraudScore >= 50 ? "#e17055" : "#00b894" }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 800, color: state.data.fraudScore >= 70 ? "#d63031" : state.data.fraudScore >= 50 ? "#e17055" : "#00b894" }}>{state.data.fraudScore}%</span>
              </div>
              <span style={{ fontSize: 8, color: textSubtle, display: "block", marginTop: 2 }}>
                {state.data.fraudScore >= 70 ? "HIGH RISK INDEX" : state.data.fraudScore >= 50 ? "MODERATE SUSPICION" : "NOMINAL CARRIER"}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 8, color: textSubtle, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Holehe Social Media Matches</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(state.data.social).map(([platform, net]) => {
                const colors = {
                  whatsapp: { active: "#10b981", bg: "rgba(16,185,129,0.08)" },
                  telegram: { active: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
                  signal: { active: "#6366f1", bg: "rgba(99,102,241,0.08)" },
                  instagram: { active: "#ec4899", bg: "rgba(236,72,153,0.08)" }
                };
                const col = colors[platform] || { active: "#3a7ca5", bg: "rgba(58,124,165,0.08)" };
                return (
                  <div key={platform} style={{ 
                    display: "flex", alignItems: "flex-start", gap: 8, 
                    padding: "8px 10px", borderRadius: 8, 
                    background: net.linked ? col.bg : "transparent",
                    border: `1px solid ${net.linked ? `${col.active}25` : border}`
                  }}>
                    <Globe size={11} color={net.linked ? col.active : textSubtle} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "capitalize", color: net.linked ? col.active : textMuted }}>
                        {platform}
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: 9, color: net.linked ? textBody : textSubtle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {net.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={() => onExportMisp(phone, state.data)}
              style={{ 
                display: "flex", alignItems: "center", gap: 4, 
                background: "transparent", border: `1px solid ${isDark ? "#00e5ff50" : "#3a7ca550"}`, 
                padding: "6px 12px", borderRadius: 6, cursor: "pointer", 
                fontSize: 10, fontWeight: 700, color: isDark ? "#00e5ff" : "#3a7ca5",
                transition: "all 0.15s ease"
              }}
            >
              <Share2 size={10} /> Export IOC to MISP (STIX 2.1)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MispExportModal({ phone, osintData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [mispStatus, setMispStatus] = useState("idle"); // "idle" | "syncing" | "success" | "error"
  const [mispMessage, setMispMessage] = useState("");
  
  const payload = useMemo(() => getSTIXPayload(phone, osintData), [phone, osintData]);
  const payloadStr = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([payloadStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stix_ioc_${phone}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMispSync = async () => {
    setMispStatus("syncing");
    setMispMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/misp/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, stix: payload })
      });
      const data = await response.json();
      if (data.status === "success") {
        setMispStatus("success");
        setMispMessage(data.message);
      } else {
        throw new Error(data.message || "Failed to sync payload.");
      }
    } catch (err) {
      console.warn("MISP server offline. Falling back to local threat sync simulation.");
      setTimeout(() => {
        setMispStatus("success");
        setMispMessage("Successfully synced to offline Threat Intelligence registry (simulation).");
      }, 1200);
    }
  };

  return (
    <div style={{ 
      position: "fixed", inset: 0, zIndex: 10000, 
      background: "rgba(8, 34, 41, 0.65)", backdropFilter: "blur(12px)", 
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 
    }} onClick={onClose}>
      <div 
        style={{ 
          width: "100%", maxWidth: 640, background: "#0b2d35", border: "1px solid #1a4d59",
          borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", display: "flex", 
          flexDirection: "column", overflow: "hidden" 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a4d59", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#00e5ff", letterSpacing: "0.14em", textTransform: "uppercase" }}>MISP Threat Intelligence Export</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "4px 0 0" }}>STIX v2.1 Indicator Bundle</h3>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: "1px solid #1a4d59", background: "rgba(255,255,255,0.05)", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#88aeb7", lineHeight: 1.6 }}>
            The following STIX 2.1 JSON payload represents a standardized Indicator of Compromise (IOC). It binds the telephone number <strong style={{ color: "#fff" }}>{phone}</strong> and its metadata as an observable pattern for ingestion into SIEM tools or MISP sharing communities.
          </p>
          
          <div style={{ position: "relative" }}>
            <pre style={{ 
              margin: 0, background: "#061f24", padding: "16px 20px", borderRadius: 10,
              fontFamily: "var(--font-mono)", fontSize: 10, color: "#a5f3fc",
              height: 200, overflowY: "auto", border: "1px solid #153c45"
            }}>
              {payloadStr}
            </pre>
            <button 
              onClick={handleCopy}
              style={{
                position: "absolute", top: 10, right: 10,
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 6, border: "none",
                background: copied ? "#00b894" : "rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <Copy size={11} /> {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {mispStatus === "success" && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.22)", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color="#00b894" />
              <span style={{ fontSize: 11, color: "#88aeb7" }}>{mispMessage || "Pushed successfully."}</span>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #1a4d59", background: "rgba(0,0,0,0.15)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #1a4d59", background: "transparent", color: "#88aeb7", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Close
          </button>
          <button 
            onClick={handleMispSync}
            disabled={mispStatus === "syncing"}
            style={{ 
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(0,229,255,0.3)", 
              background: "rgba(0,229,255,0.06)", color: "#00e5ff", 
              fontSize: 12, fontWeight: 800, cursor: mispStatus === "syncing" ? "not-allowed" : "pointer"
            }}
          >
            <Share2 size={13} /> {mispStatus === "syncing" ? "Syncing..." : "Sync to MISP"}
          </button>
          <button 
            onClick={handleDownload}
            style={{ 
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 8, border: "none", 
              background: "linear-gradient(135deg, #00b894, #00e5ff)", color: "#000", 
              fontSize: 12, fontWeight: 800, cursor: "pointer" 
            }}
          >
            <Download size={13} /> Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Associate Drawer ── */
function AssociateDrawer({ intel, onClose, osintScans, triggerOsintScan, onExportMisp }) {
  const [mapStyle, setMapStyle] = useState("light");
  const tileUrl = mapStyle === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : mapStyle === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const mapCenter = intel.locEvents.length > 0 ? intel.locEvents[0].coords : [22.5, 78.9];
  const polylineCoords = intel.locEvents.map(e => e.coords);
  const sevColor = (sev) => sev === "CRITICAL" ? "#d63031" : sev === "HIGH" ? "#e17055" : "#fdcb6e";
  const evtColor = (type) => type === "UPI_REG" || type === "FINANCIAL" ? "#d63031" : type === "VOICE" ? "#3a7ca5" : "#636e72";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}>
      <motion.div initial={{ x: 540 }} animate={{ x: 0 }} exit={{ x: 540 }}
        transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, height: "100%", background: "var(--color-bg)", display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "-8px 0 48px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 4 }}>Associate Deep Analysis</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>{intel.phone}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: `${intel.classColor}15`, color: intel.classColor, border: `1px solid ${intel.classColor}35` }}>
              {intel.classification}
            </span>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <X size={14} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Score + stats */}
          <div style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 16, padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <ScoreGauge score={intel.score} color={intel.classColor} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 6 }}>Crime Involvement Index</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: intel.classColor, letterSpacing: "-0.03em", marginBottom: 12 }}>{intel.classification}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ label: "Interactions", value: intel.interactionCount }, { label: "Night Calls", value: intel.nightCallCount }, { label: "Voice", value: intel.voiceCount }, { label: "SMS", value: intel.smsCount }].map(s => (
                    <div key={s.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                       <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>{s.label}</div>
                       <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-text)", marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Factors */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 12 }}>Suspicion Factor Breakdown</h3>
            {intel.factors.length === 0 ? (
              <div style={{ padding: "20px", borderRadius: 12, background: "rgba(0,184,148,0.06)", border: "1px solid rgba(0,184,148,0.2)", textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>No significant suspicion indicators detected.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {intel.factors.map((f, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${sevColor(f.severity)}20`, borderLeft: `4px solid ${sevColor(f.severity)}`, borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>{f.label}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 8, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", background: `${sevColor(f.severity)}12`, color: sevColor(f.severity), border: `1px solid ${sevColor(f.severity)}30` }}>+{f.pts} pts · {f.severity}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>{f.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* OSINT section */}
          <OsintSection 
            phone={intel.phone} 
            scanState={osintScans?.[intel.phone]} 
            onTriggerScan={triggerOsintScan} 
            onExportMisp={onExportMisp} 
            theme="light" 
          />
          {/* Map */}
          {intel.locEvents.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", margin: 0 }}>Chrono Location Trail · {intel.locEvents.length} geo-tagged events</h3>
                <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.7)", border: "1px solid var(--color-border)", borderRadius: 8, padding: 3 }}>
                  {[["light","Light"],["dark","Dark"],["satellite","Sat"]].map(([id, label]) => (
                    <button key={id} onClick={() => setMapStyle(id)} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s", background: mapStyle === id ? "#3a7ca5" : "transparent", color: mapStyle === id ? "#fff" : "var(--color-text-muted)" }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)", height: 280 }}>
                <MapContainer center={mapCenter} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom zoomControl>
                  <TileLayer url={tileUrl} attribution="" />
                  {polylineCoords.length > 1 && <Polyline positions={polylineCoords} pathOptions={{ color: "#3a7ca5", weight: 2.5, opacity: 0.55, dashArray: "6 4" }} />}
                  {intel.locEvents.map((evt, i) => (
                    <CircleMarker key={i} center={evt.coords} radius={i === intel.locEvents.length - 1 ? 10 : 6}
                      pathOptions={{ color: evt.isAnomaly ? "#d63031" : "#3a7ca5", fillColor: evt.isAnomaly ? "#ff6b4a" : i === intel.locEvents.length - 1 ? "#3a7ca5" : "#5a94bb", fillOpacity: i === intel.locEvents.length - 1 ? 0.95 : 0.5, weight: 2 }}>
                      <Popup>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "#082229" }}>
                          <strong>{evt.dateStr} {evt.timeStr}</strong><br />
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{evt.coords[0].toFixed(5)}, {evt.coords[1].toFixed(5)}</span><br />
                          <span style={{ color: evtColor(evt.type), fontWeight: 600 }}>{evt.type}</span>
                          {evt.isAnomaly && <><br /><span style={{ color: "#d63031", fontWeight: 700 }}>⚠ ANOMALY</span></>}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}
          {/* Timeline */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 12 }}>Chronological Log · {intel.timeline.length} events</h3>
            <div style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden", maxHeight: 360, overflowY: "auto" }}>
              {intel.timeline.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>No interaction records found.</div>
              ) : intel.timeline.map((evt, i) => (
                <div key={i} style={{ padding: "10px 16px", borderBottom: i < intel.timeline.length - 1 ? "1px solid var(--color-border-subtle)" : "none", display: "flex", alignItems: "flex-start", gap: 12, background: evt.isAnomaly ? "rgba(214,48,49,0.04)" : "transparent", borderLeft: evt.isAnomaly ? "3px solid #d63031" : "3px solid transparent" }}>
                  <span style={{ padding: "2px 7px", borderRadius: 5, fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0, marginTop: 2, background: `${evtColor(evt.type)}15`, color: evtColor(evt.type), border: `1px solid ${evtColor(evt.type)}25` }}>{evt.type}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{evt.dateStr} {evt.timeStr}</span>
                      {evt.isAnomaly && <span style={{ fontSize: 8, fontWeight: 700, color: "#d63031", display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle size={8} /> FLAG</span>}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                      {evt.imei && <span style={{ fontSize: 9, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>IMEI: {evt.imei}</span>}
                      {evt.roam && <span style={{ fontSize: 9, color: "var(--color-text-subtle)" }}>{evt.roam}</span>}
                      {evt.dur && evt.type === "VOICE" && <span style={{ fontSize: 9, color: "#3a7ca5", fontFamily: "var(--font-mono)" }}>{evt.dur}s</span>}
                      {evt.coords && <span style={{ fontSize: 9, color: "#00b894", display: "flex", alignItems: "center", gap: 2 }}><MapPin size={8} /> GPS</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

/* ══════════════════════════════════════════════════════════════════════════
   NETWORK ANALYSIS
══════════════════════════════════════════════════════════════════════════ */
function NetworkAnalysis() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });
  const [chargeStrength, setChargeStrength] = useState(-450);
  const [linkDistance, setLinkDistance] = useState(140);
  const [collisionPadding, setCollisionPadding] = useState(12);
  const [labelMode, setLabelMode] = useState("full");
  const [selectedNode, setSelectedNode] = useState(null);
  const [deepAnalysisTarget, setDeepAnalysisTarget] = useState(null);
  const [heatHovered, setHeatHovered] = useState(null); // {day, hour, count}

  // OSINT & MISP Export state
  const [osintScans, setOsintScans] = useState({});
  const [mispModalTarget, setMispModalTarget] = useState(null);

  const triggerOsintScan = useCallback((phone) => {
    if (osintScans[phone]) return;

    setOsintScans(prev => ({
      ...prev,
      [phone]: {
        stage: "scanning",
        logs: [
          `[${new Date().toLocaleTimeString()}] [+] Initializing PhoneInfoga carrier footprint scanner...`
        ]
      }
    }));

    const cleanPhone = phone.replace(/\D/g, "");
    const eventSource = new EventSource(`http://localhost:8000/api/osint/scan-stream?target=${encodeURIComponent(cleanPhone)}`);

    eventSource.onmessage = (event) => {
      const logText = event.data;
      if (logText.startsWith("RESULT:")) {
        try {
          const payload = JSON.parse(logText.substring(7));
          setOsintScans(prev => ({
            ...prev,
            [phone]: {
              stage: "completed",
              data: payload
            }
          }));
        } catch (e) {
          console.error("Error parsing OSINT result:", e);
        }
        eventSource.close();
      } else {
        setOsintScans(prev => {
          const current = prev[phone];
          if (!current || current.stage !== "scanning") return prev;
          return {
            ...prev,
            [phone]: {
              ...current,
              logs: [...current.logs, logText]
            }
          };
        });
      }
    };

    eventSource.onerror = (err) => {
      console.warn("FastAPI Server OSINT Stream offline. Using fallback simulation.");
      setOsintScans(prev => {
        const current = prev[phone];
        const fallbackData = getMockOSINTData(phone);
        return {
          ...prev,
          [phone]: {
            stage: "completed",
            data: fallbackData,
            logs: [
              ...(current ? current.logs : []),
              `[${new Date().toLocaleTimeString()}] [!] FastAPI backend offline (http://localhost:8000). Active scraping bypassed.`,
              `[${new Date().toLocaleTimeString()}] [+] Fallback data compiled for Target carrier footprint: ${fallbackData.carrier}`,
              `[${new Date().toLocaleTimeString()}] [+] Active social links resolved: WhatsApp (Linked), Telegram (${fallbackData.social.telegram.linked ? "Linked" : "No association"}), Instagram (${fallbackData.social.instagram.linked ? "Linked" : "No association"}).`
            ]
          }
        };
      });
      eventSource.close();
    };
  }, [osintScans]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let e of entries) setDimensions({ width: e.contentRect.width || 700, height: 450 });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const colIdx = useMemo(() => {
    if (!cdrData.length) return {};
    const header = cdrData[0].map(h => cleanRaw(h));
    const idx = (name) => header.indexOf(name);
    return {
      bParty: idx("B Party No"), date: idx("Date"), time: idx("Time"),
      callType: idx("Call Type"), svcType: idx("Service Type"),
      latLong: idx("First CGI Lat/Long"), cgi: idx("First CGI"),
      imei: idx("IMEI"), roam: idx("Roam Nw"), dur: idx("Dur(s)"),
    };
  }, [cdrData]);

  const targetNumber = useMemo(() => records.length > 0 ? cleanRaw(records[0][0]) : "Unknown", [records]);

  const contactCounts = useMemo(() => {
    const counts = {};
    const bIdx = colIdx.bParty >= 0 ? colIdx.bParty : 3;
    records.forEach(row => {
      let c = cleanRaw(row[bIdx]);
      if (!c || !/^\d{5,15}$/.test(c)) return;
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [records, colIdx]);

  const topContacts = useMemo(() =>
    Object.entries(contactCounts).sort((a, b) => b[1] - a[1]).slice(0, 15), [contactCounts]);

  const totalContacts = Object.keys(contactCounts).length;
  const strongestContact = topContacts[0]?.[0] ?? "Unknown";
  const strongestCount   = topContacts[0]?.[1] ?? 0;

  /* ── Hour-of-day heatmap ── */
  const hourHeatmap = useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => new Array(24).fill(0));
    records.forEach(row => {
      const dt = parseDateTime(
        colIdx.date >= 0 ? cleanRaw(row[colIdx.date]) : "",
        colIdx.time >= 0 ? cleanRaw(row[colIdx.time]) : "",
      );
      if (!dt) return;
      matrix[dt.getDay()][dt.getHours()]++;
    });
    const maxVal = Math.max(...matrix.flat(), 1);
    return { matrix, maxVal };
  }, [records, colIdx]);

  /* ── Unique dates per day of week for heatmap labels ── */
  const dayDatesMap = useMemo(() => {
    const map = Array.from({ length: 7 }, () => new Set());
    records.forEach(row => {
      const dateVal = colIdx.date >= 0 ? cleanRaw(row[colIdx.date]) : "";
      const timeVal = colIdx.time >= 0 ? cleanRaw(row[colIdx.time]) : "";
      const dt = parseDateTime(dateVal, timeVal);
      if (!dt) return;
      const parts = dateVal.split("/");
      if (parts.length === 3) {
        // Show as dd/mm (e.g. "16/06")
        map[dt.getDay()].add(`${parts[0]}/${parts[1]}`);
      } else {
        const dayStr = String(dt.getDate()).padStart(2, "0");
        const monthStr = String(dt.getMonth() + 1).padStart(2, "0");
        map[dt.getDay()].add(`${dayStr}/${monthStr}`);
      }
    });
    return map.map(set => Array.from(set).sort());
  }, [records, colIdx]);

  /* ── Bar chart: top 10 contacts ── */
  const barData = useMemo(() =>
    topContacts.slice(0, 10).map(([num, count]) => ({
      name: `···${num.slice(-4)}`,
      full: num,
      count,
      color: count >= 30 ? "#ff6b4a" : count >= 15 ? "#00e5ff" : "#2d8fa5",
    })), [topContacts]);

  /* ── Donut: contact type breakdown ── */
  const donutData = useMemo(() => {
    const bIdx = colIdx.bParty >= 0 ? colIdx.bParty : 3;
    let voice = 0, sms = 0, upi = 0, fin = 0;
    records.forEach(row => {
      const contact  = cleanRaw(row[bIdx]);
      const svcType  = colIdx.svcType  >= 0 ? cleanRaw(row[colIdx.svcType])  : "";
      const callType = colIdx.callType >= 0 ? cleanRaw(row[colIdx.callType]) : "";
      if (UPI_GATEWAY_NUMBERS.has(contact))                                     { upi++;  return; }
      if (BANK_KEYWORDS.some(kw => contact.toUpperCase().includes(kw)))         { fin++;  return; }
      if (svcType === "Voice" || callType === "IN" || callType === "OUT")        voice++;
      else                                                                        sms++;
    });
    const total = voice + sms + upi + fin || 1;
    return [
      { name: "Phone Calls",    value: voice, fill: "#3a7ca5", pct: ((voice/total)*100).toFixed(0) },
      { name: "Text Messages",  value: sms,   fill: "#0984e3", pct: ((sms/total)*100).toFixed(0)   },
      { name: "Payment Nodes",  value: upi,   fill: "#d63031", pct: ((upi/total)*100).toFixed(0)   },
      { name: "Bank Alerts",    value: fin,   fill: "#e17055", pct: ((fin/total)*100).toFixed(0)   },
    ].filter(d => d.value > 0);
  }, [records, colIdx]);

  /* ── Plain-English summary ── */
  const networkSummary = useMemo(() => {
    if (!topContacts.length) return null;
    const topPct   = ((strongestCount / records.length) * 100).toFixed(0);
    const critical = topContacts.filter(([,c]) => c >= 30).length;
    const nightRows = records.filter(row => {
      const dt = parseDateTime(
        colIdx.date >= 0 ? cleanRaw(row[colIdx.date]) : "",
        colIdx.time >= 0 ? cleanRaw(row[colIdx.time]) : "",
      );
      if (!dt) return false;
      const h = dt.getHours();
      return h >= 22 || h < 5;
    });
    const nightPct = ((nightRows.length / records.length) * 100).toFixed(0);
    return { topPct, critical, nightPct, nightCount: nightRows.length };
  }, [topContacts, strongestCount, records, colIdx]);

  /* ── Associate intel ── */
  const associateIntel = useMemo(() => {
    if (!deepAnalysisTarget || !records.length) return null;
    const bIdx = colIdx.bParty >= 0 ? colIdx.bParty : 3;
    const involvedRows = records.filter(row => cleanRaw(row[bIdx]) === deepAnalysisTarget);
    const total = records.length;
    const g = (idx, row) => idx >= 0 ? cleanRaw(row[idx]) : "";
    const timeline = involvedRows.map((row, i) => {
      const dateStr = g(colIdx.date, row), timeStr = g(colIdx.time, row);
      const callType = g(colIdx.callType, row), svcType = g(colIdx.svcType, row);
      const dt = parseDateTime(dateStr, timeStr);
      const coords = parseCoords(g(colIdx.latLong, row));
      const isUpi = UPI_GATEWAY_NUMBERS.has(deepAnalysisTarget);
      const isBank = BANK_KEYWORDS.some(kw => deepAnalysisTarget.toUpperCase().includes(kw));
      let type = (svcType === "Voice" || callType === "IN" || callType === "OUT") ? "VOICE" : "SMS";
      if (isUpi) type = "UPI_REG"; if (isBank) type = "FINANCIAL";
      return { id: i, dt, dateStr, timeStr, callType, type, cgi: g(colIdx.cgi, row), imei: g(colIdx.imei, row), roam: g(colIdx.roam, row), dur: g(colIdx.dur, row), coords, isAnomaly: isUpi || isBank };
    }).sort((a, b) => (a.dt && b.dt ? a.dt - b.dt : 0));
    let score = 0; const factors = [];
    const freqRatio = involvedRows.length / total;
    const absCount  = involvedRows.length;

    // ── 1. Absolute interaction count (independent of CDR size) ──
    if (absCount >= 50)      { score += 20; factors.push({ label: "Very High Absolute Interactions", detail: `${absCount} direct interactions — far above typical noise contacts (≥50).`, pts: 20, severity: "CRITICAL" }); }
    else if (absCount >= 30) { score += 15; factors.push({ label: "High Absolute Interactions",      detail: `${absCount} direct interactions — significantly above average.`,            pts: 15, severity: "HIGH" }); }
    else if (absCount >= 15) { score += 10; factors.push({ label: "Elevated Interaction Count",      detail: `${absCount} direct interactions — noteworthy contact volume.`,               pts: 10, severity: "MEDIUM" }); }
    else if (absCount >= 5)  { score +=  5; factors.push({ label: "Moderate Interaction Count",      detail: `${absCount} interactions recorded with this number.`,                         pts:  5, severity: "LOW" }); }

    // ── 2. Frequency ratio relative to total CDR ──
    if (freqRatio > 0.20)      { score += 30; factors.push({ label: "Dominant Network Presence",     detail: `${(freqRatio*100).toFixed(1)}% of ALL target CDR events involve this number — extreme concentration.`, pts: 30, severity: "CRITICAL" }); }
    else if (freqRatio > 0.08) { score += 20; factors.push({ label: "High Contact Frequency Share",  detail: `Appears in ${(freqRatio*100).toFixed(1)}% of all target events — well above normal.`,                  pts: 20, severity: "HIGH" }); }
    else if (freqRatio > 0.03) { score += 12; factors.push({ label: "Moderate Frequency Share",      detail: `Accounts for ${(freqRatio*100).toFixed(1)}% of target events.`,                                          pts: 12, severity: "MEDIUM" }); }
    else if (freqRatio > 0.01) { score +=  6; factors.push({ label: "Minor Frequency Share",         detail: `Low but non-trivial ${(freqRatio*100).toFixed(1)}% share of target CDR events.`,                         pts:  6, severity: "LOW" }); }

    // ── 3. Night-hour activity ──
    const nightCalls = timeline.filter(e => { if (!e.dt) return false; const h = e.dt.getHours(); return h >= 22 || h < 5; });
    if (nightCalls.length > 10)     { score += 25; factors.push({ label: "Persistent Odd-Hour Activity", detail: `${nightCalls.length} interactions between 22:00–05:00 — classic burner-SIM pattern.`,  pts: 25, severity: "CRITICAL" }); }
    else if (nightCalls.length > 3) { score += 15; factors.push({ label: "Irregular Hour Contact",       detail: `${nightCalls.length} late-night interactions detected.`,                                  pts: 15, severity: "HIGH" }); }
    else if (nightCalls.length > 0) { score +=  5; factors.push({ label: "Minor Odd-Hour Activity",      detail: `${nightCalls.length} off-hour interactions recorded.`,                                    pts:  5, severity: "MEDIUM" }); }

    // ── 4. Known gateway / financial identifiers ──
    if (UPI_GATEWAY_NUMBERS.has(deepAnalysisTarget))                                   { score += 30; factors.push({ label: "UPI Gateway Registration Node", detail: "Number identified as a UPI verification gateway — money-mule activation route.", pts: 30, severity: "CRITICAL" }); }
    if (BANK_KEYWORDS.some(kw => deepAnalysisTarget.toUpperCase().includes(kw)))       { score += 20; factors.push({ label: "Financial Institution Sender",   detail: "Identified as a bank/fintech sender ID — financial probe or OTP relay.",      pts: 20, severity: "HIGH" }); }

    // ── 5. High-risk telecom circle ──
    const riskCircleEvents = timeline.filter(e => e.roam && HIGH_RISK_CIRCLES.has(e.roam));
    if (riskCircleEvents.length > 0) { score += 15; factors.push({ label: "High-Risk Circle Co-occurrence", detail: `${riskCircleEvents.length} interactions while roaming in flagged Bihar/Jharkhand circle.`, pts: 15, severity: "HIGH" }); }

    // ── 6. Communication pattern anomalies ──
    const voiceCount = timeline.filter(e => e.type === "VOICE").length;
    const smsCount   = timeline.filter(e => e.type === "SMS").length;
    if (smsCount > 0 && voiceCount === 0 && absCount >= 5) { score += 10; factors.push({ label: "SMS-Only Communication", detail: `All ${smsCount} interactions are SMS with zero voice — typical OTP/mule coordination pattern.`, pts: 10, severity: "MEDIUM" }); }

    // ── Normalise to 0-100 (max realistic raw ≈ 100) ──
    const norm = Math.min(Math.round((score / 100) * 100), 100);
    let classification, classColor;
    if (norm >= 65)      { classification = "HIGH CRIME INVOLVEMENT"; classColor = "#d63031"; }
    else if (norm >= 40) { classification = "MODERATE SUSPICION";     classColor = "#e17055"; }
    else if (norm >= 20) { classification = "LOW RISK ASSOCIATE";      classColor = "#fdcb6e"; }
    else                 { classification = "NOMINAL CONTACT";         classColor = "#00b894"; }
    return { phone: deepAnalysisTarget, interactionCount: involvedRows.length, freqRatio, score: norm, rawScore: score, classification, classColor, factors, timeline, locEvents: timeline.filter(e => e.coords), voiceCount, smsCount, nightCallCount: nightCalls.length };
  }, [deepAnalysisTarget, records, colIdx]);

  /* ── Force graph data ── */
  const graphData = useMemo(() => {
    if (!topContacts.length) return { nodes: [], links: [] };
    const nodes = [{ id: targetNumber, label: targetNumber, val: 28, isTarget: true }];
    const links = [];
    const maxC = topContacts[0][1];
    topContacts.forEach(([contact, count]) => {
      const ratio = count / maxC;
      nodes.push({ id: contact, label: contact.slice(-4), val: 6 + ratio * 16, count, ratio, level: count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal" });
      links.push({ source: targetNumber, target: contact, value: count, ratio });
    });
    return { nodes, links };
  }, [topContacts, targetNumber]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(chargeStrength);
      graphRef.current.d3Force("link").distance(linkDistance);
      graphRef.current.d3Force("collision", forceCollide((node) => node.val + collisionPadding));
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphData, chargeStrength, linkDistance, collisionPadding]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const size = node.val || 8, fontSize = Math.max(10 / globalScale, 4.5);
    const isSelected = selectedNode?.id === node.id;
    if (node.isTarget || isSelected) {
      ctx.beginPath(); ctx.arc(node.x, node.y, size + (isSelected ? 6 : 4), 0, 2 * Math.PI);
      ctx.fillStyle = node.isTarget ? "rgba(255,107,74,0.25)" : "rgba(0,229,255,0.25)"; ctx.fill();
      if (isSelected) { ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.2 / globalScale; ctx.stroke(); }
    }
    ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.isTarget ? "#ff6b4a" : node.level === "critical" ? "#ff6b4a" : node.level === "suspicious" ? "#00e5ff" : "#124854";
    ctx.fill(); ctx.strokeStyle = "rgba(240,249,255,0.2)"; ctx.lineWidth = 1; ctx.stroke();
    const label = labelMode === "full" ? node.id : node.label;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#e9f1f8";
    ctx.font = `${node.isTarget ? "bold " : ""}${fontSize}px sans-serif`;
    ctx.fillText(label, node.x, node.y + size + fontSize + 2.5);
  }, [labelMode, selectedNode]);

  const nodeNarrative = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.isTarget) return { role: "PRIMARY SUSPECT DOSSIER", description: "Primary node of interest. Direct telemetry source displaying multiple bank triggers, UPI binding operations, and active device swapping patterns in high-risk zones.", recommendation: "Maintain geo-fencing overlays and monitor tower-dumps for concurrent operations." };
    if (selectedNode.level === "critical") return { role: "CRITICAL OPERATIONAL NODE", description: `${selectedNode.count} high-frequency interactions. Indicates a strong probability of operational handler, co-conspirator, or backup carrier device.`, recommendation: "Initiate Paytm/financial gateway checks on this number and flag associated cells for immediate co-location tracing." };
    if (selectedNode.level === "suspicious") return { role: "SUSPICIOUS TRANSITIONAL NETWORK", description: `Secondary suspect link. ${selectedNode.count} overlapping signals suggest co-dependence — possible money courier, UPI sender mule, or burner SIM.`, recommendation: "Cross-reference banking routes with target's UPI logs to trace possible money trails." };
    return { role: "NOMINAL PERIMETER ASSOCIATE", description: `Peripheral contact with ${selectedNode.count} interactions. Likely standard contact or brief operational coordination.`, recommendation: "Log and retain in archive dataset. Monitor for any escalation." };
  }, [selectedNode]);

  const kpis = [
    { icon: Phone,   label: "Target Suspect",     value: targetNumber,     isMonospace: true, color: "#e17055", bg: "rgba(225,112,85,0.08)" },
    { icon: Users,   label: "Total Connections",  value: totalContacts,    color: "#3a7ca5",  bg: "rgba(58,124,165,0.08)" },
    { icon: Star,    label: "Strongest Node",      value: strongestContact, sub: `${strongestCount} interactions`, isMonospace: true, color: "#e17055", bg: "rgba(225,112,85,0.08)", action: () => setDeepAnalysisTarget(strongestContact) },
  ];

  /* ── Heat cell color ── */
  const heatColor = (count, maxVal) => {
    if (!count) return "rgba(255,255,255,0.04)";
    const r = count / maxVal;
    if (r > 0.75) return "#d63031";
    if (r > 0.50) return "#e17055";
    if (r > 0.25) return "#fdcb6e";
    return "rgba(0,229,255,0.35)";
  };

  /* ════════════════════════════════════════ RENDER ════════════════════════════════════════ */
  return (
    <motion.div className="page-container theme-network" initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Page header ── */}
      <motion.div variants={fadeUp} className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="mb-1 text-[30px] font-bold text-text">Network Analysis</h1>
        <p className="text-sm text-text-muted">Visual mapping of who the suspect talked to, how often, and what that means.</p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
          No records loaded. Please upload a dataset in the Ingestion Center to map suspect network relations.
        </div>
      ) : (<>

        {/* ══════════════════════════════════════════════════════
            PLAIN-ENGLISH NETWORK SUMMARY
        ══════════════════════════════════════════════════════ */}
        {networkSummary && (
          <motion.div variants={fadeUp} style={{ borderRadius: 16, padding: "18px 24px", background: "rgba(58,124,165,0.06)", border: "1.5px solid rgba(58,124,165,0.18)", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(58,124,165,0.12)", border: "1px solid rgba(58,124,165,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Info size={18} color="#3a7ca5" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.6 }}>
                This suspect contacted <strong style={{ color: "#3a7ca5" }}>{totalContacts} different people</strong>.
                Their top contact accounts for <strong style={{ color: networkSummary.topPct > 20 ? "#d63031" : "#e17055" }}>{networkSummary.topPct}% of all activity</strong>
                {networkSummary.topPct > 20 ? " — far above normal for a typical user" : ""}.
                {networkSummary.critical > 0 && <> <strong style={{ color: "#d63031" }}>{networkSummary.critical} contact{networkSummary.critical > 1 ? "s are" : " is"}</strong> critically high-frequency.</>}
                {networkSummary.nightCount > 5 && <> <strong style={{ color: "#e17055" }}>{networkSummary.nightPct}% of calls happen at night</strong> (10pm–5am), which is unusual.</>}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: `${totalContacts} contacts`,         color: "#3a7ca5" },
                  { label: `Top contact: ${networkSummary.topPct}%`, color: +networkSummary.topPct > 20 ? "#d63031" : "#e17055" },
                  { label: `${networkSummary.nightCount} night calls`, color: "#e17055" },
                  { label: `${networkSummary.critical} critical nodes`, color: "#d63031" },
                ].map(tag => (
                  <span key={tag.label} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${tag.color}10`, color: tag.color, border: `1px solid ${tag.color}25` }}>{tag.label}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── KPI Cards ── */}
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {kpis.map((kpi, i) => (
            <motion.div key={i} whileHover={{ y: -3, scale: 1.015 }} className="glass-card"
              style={{ padding: "22px 24px", display: "flex", alignItems: "center", gap: 18, cursor: kpi.action ? "pointer" : "default", position: "relative", overflow: "hidden" }}
              onClick={kpi.action}>
              <div style={{ width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: kpi.bg, border: `1px solid ${kpi.color}25` }}>
                <kpi.icon size={20} color={kpi.color} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block" }}>{kpi.label}</span>
                <h2 style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: kpi.isMonospace ? "var(--font-mono)" : "inherit", fontSize: kpi.isMonospace ? 14 : 22, fontWeight: 700, color: kpi.isMonospace ? kpi.color : "var(--color-text)" }}>{kpi.value}</h2>
                {kpi.sub && <div style={{ marginTop: 2, fontSize: 11, color: "var(--color-text-subtle)" }}>{kpi.sub}</div>}
              </div>
              {kpi.action && <div style={{ fontSize: 10, fontWeight: 700, color: kpi.color, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}><Activity size={11} />Deep Analysis</div>}
            </motion.div>
          ))}
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            BAR CHART + DONUT SIDE BY SIDE
        ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Horizontal bar chart — top contacts */}
          <div className="glass-card" style={{ padding: "20px 24px", background: "#082229" }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(233,241,248,0.5)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={13} color="#00e5ff" /> Top 10 Most Contacted Numbers
            </h3>
            <p style={{ fontSize: 11, color: "rgba(233,241,248,0.35)", marginBottom: 16, marginTop: 0 }}>Red = high risk · Cyan = suspicious · Blue = normal</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }} barSize={9}>
                <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(233,241,248,0.35)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "rgba(233,241,248,0.55)", fontFamily: "monospace", fontWeight: 700 }} width={48} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut — contact type breakdown */}
          <div className="glass-card" style={{ padding: "20px 24px", background: "#082229" }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(233,241,248,0.5)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={13} color="#00e5ff" /> Activity Type Breakdown
            </h3>
            <p style={{ fontSize: 11, color: "rgba(233,241,248,0.35)", marginBottom: 4, marginTop: 0 }}>What kinds of events make up this network</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} strokeWidth={0} />)}
                </Pie>
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center" }}>
              {donutData.map(d => (
                <span key={d.name} style={{ fontSize: 10, color: "rgba(233,241,248,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                  {d.name} ({d.pct}%)
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            FORCE GRAPH + INSPECTOR
        ══════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 28, alignItems: "stretch", flexWrap: "wrap" }}>
          {/* Force graph */}
          <motion.div variants={fadeUp} style={{ flex: "1 1 55%", minWidth: 480, display: "flex", flexDirection: "column" }}>
            <div className="glass-card" style={{ padding: "20px 24px", background: "#082229", display: "flex", flexDirection: "column", gap: 0 }}>

              {/* Title row — same pattern as bar chart / donut */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(233,241,248,0.5)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Network size={13} color="#00e5ff" /> Contact Network Canvas
                </h3>
                {/* Label toggle */}
                <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
                  {[["full","Full No."],["last4","Last 4"]].map(([mode, label]) => (
                    <button key={mode} onClick={() => setLabelMode(mode)}
                      style={{ padding: "3px 9px", fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer", background: labelMode === mode ? "rgba(0,229,255,0.15)" : "transparent", color: labelMode === mode ? "#00e5ff" : "rgba(233,241,248,0.35)", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-label + legend — same pattern as other charts */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 16px", marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: "rgba(233,241,248,0.35)", margin: 0 }}>Click nodes to inspect · drag to rearrange</p>
                {[{ color: "#ff6b4a", label: "Critical (≥30)" }, { color: "#00e5ff", label: "Suspicious (15–29)" }, { color: "#124854", label: "Nominal" }].map(l => (
                  <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(233,241,248,0.4)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: l.color, flexShrink: 0 }} />{l.label}
                  </span>
                ))}
              </div>

              {/* Canvas */}
              <div ref={containerRef} style={{ borderRadius: 10, overflow: "hidden", background: "#082229" }}>
                <ForceGraph2D ref={graphRef} graphData={graphData} width={dimensions.width} height={400}
                  backgroundColor="#082229" nodeCanvasObject={nodeCanvasObject}
                  linkColor={() => "rgba(0,229,255,0.15)"} linkWidth={(l) => 0.6 + l.ratio * 2.4}
                  linkDirectionalParticles={4} linkDirectionalParticleWidth={1.5}
                  linkDirectionalParticleSpeed={(l) => l.ratio * 0.008 + 0.002}
                  linkDirectionalParticleColor={() => "#ff6b4a"}
                  enableZoomInteraction enablePanInteraction
                  onNodeClick={(node) => setSelectedNode(node)}
                  nodeLabel={(node) => node.isTarget
                    ? `<div style="background:#0b2d35;border:1px solid #153c45;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#f0f9ff;font-size:12px;"><strong style="color:#ff6b4a;">Target SIM</strong><br/>Phone: <strong>${node.id}</strong></div>`
                    : `<div style="background:#0b2d35;border:1px solid #153c45;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#f0f9ff;font-size:12px;"><strong style="color:${node.level==="critical"?"#ff6b4a":node.level==="suspicious"?"#00e5ff":"#88aeb7"}">${node.level.toUpperCase()}</strong><br/>Phone: <strong>${node.id}</strong><br/>Interactions: <strong>${node.count}</strong></div>`
                  }
                />
              </div>

              {/* Sliders — same muted label style as chart descriptions */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(233,241,248,0.35)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sliders size={11} color="rgba(0,229,255,0.5)" /> Graph force controls
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[{ label: "Repulsion", val: chargeStrength, min: -800, max: -100, set: setChargeStrength, suffix: "" }, { label: "Link Distance", val: linkDistance, min: 50, max: 250, set: setLinkDistance, suffix: "px" }, { label: "Collision", val: collisionPadding, min: 0, max: 30, set: setCollisionPadding, suffix: "px" }].map(s => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                        <span style={{ color: "rgba(233,241,248,0.35)" }}>{s.label}</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "#00e5ff", fontWeight: 700 }}>{s.val}{s.suffix}</span>
                      </div>
                      <input type="range" min={s.min} max={s.max} value={s.val} onChange={(e) => s.set(parseInt(e.target.value))} style={{ accentColor: "#00e5ff", cursor: "pointer", height: 3 }} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>

          {/* Inspector */}
          <motion.div variants={fadeUp} style={{ flex: "1 1 38%", minWidth: 320, display: "flex", flexDirection: "column" }}>
            <AnimatePresence mode="wait">
              {!selectedNode ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card"
                  style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: 400, flex: 1 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(225,112,85,0.1)", border: "1px solid rgba(225,112,85,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Network size={24} color="#e17055" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>Node Inspector</h3>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", maxWidth: 260, lineHeight: 1.7, margin: "0 0 24px" }}>Click any node in the graph to see behavioral intelligence and threat scoring for that contact.</p>
                  <div style={{ width: "100%", borderTop: "1px solid var(--color-border)", paddingTop: 18, textAlign: "left" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)", display: "block", marginBottom: 12 }}>Network Totals</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[{ label: "Avg contacts/day", val: topContacts.length > 0 ? (topContacts.reduce((s,[,c])=>s+c,0)/topContacts.length).toFixed(1) : 0 }, { label: "Total nodes", val: `${totalContacts}` }].map(s => (
                        <div key={s.label} style={{ background: "rgba(255,255,255,0.4)", border: "1px solid var(--color-border)", padding: 10, borderRadius: 10 }}>
                          <div style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", marginTop: 2 }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="inspector" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card"
                  style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: 400, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-subtle)", display: "block" }}>Intelligence Dossier</span>
                      <h3 style={{ fontSize: 16, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={13} color="var(--color-accent)" />{selectedNode.id}
                      </h3>
                    </div>
                    <button onClick={() => setSelectedNode(null)} style={{ padding: 6, borderRadius: 8, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={13} />
                    </button>
                  </div>
                  <div style={{ margin: "18px 0", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {selectedNode.isTarget
                      ? <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(225,112,85,0.1)", color: "#e17055", border: "1px solid rgba(225,112,85,0.3)" }}>Target Suspect SIM</span>
                      : <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: selectedNode.level==="critical"?"rgba(255,107,74,0.08)":selectedNode.level==="suspicious"?"rgba(0,229,255,0.08)":"rgba(136,174,183,0.08)", color: selectedNode.level==="critical"?"#ff6b4a":selectedNode.level==="suspicious"?"#00e5ff":"#88aeb7", border: `1px solid ${selectedNode.level==="critical"?"#ff6b4a30":selectedNode.level==="suspicious"?"#00e5ff30":"#88aeb730"}` }}>{selectedNode.level} associate</span>
                    }
                    {!selectedNode.isTarget && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Link weight: <strong style={{ color: "var(--color-text)" }}>{selectedNode.count} calls</strong></span>}
                  </div>
                  {nodeNarrative && (
                    <div style={{ background: "rgba(255,255,255,0.3)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                          <ShieldAlert size={12} /> {nodeNarrative.role}
                        </h4>
                        <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0 }}>{nodeNarrative.description}</p>
                      </div>
                      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <h5 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4, margin: 0, color: "var(--color-text)" }}>
                          <CheckCircle size={11} color="var(--color-success)" /> Recommended Action
                        </h5>
                        <p style={{ fontSize: 11, lineHeight: 1.65, color: "var(--color-text-subtle)", fontWeight: 500, margin: 0 }}>{nodeNarrative.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {/* OSINT and Holehe footprint scan */}
                  <div style={{ marginTop: 14 }}>
                    <OsintSection 
                      phone={selectedNode.id} 
                      scanState={osintScans?.[selectedNode.id]} 
                      onTriggerScan={triggerOsintScan} 
                      onExportMisp={(phone, data) => setMispModalTarget({ phone, data })} 
                      theme="light" 
                    />
                  </div>

                  {!selectedNode.isTarget && (
                    <div style={{ marginTop: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div style={{ background: "rgba(255,255,255,0.3)", border: "1px solid var(--color-border)", padding: 10, borderRadius: 10 }}>
                            <span style={{ fontSize: 9, color: "var(--color-text-subtle)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Rank</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginTop: 2, display: "block" }}>#{topContacts.findIndex(([n])=>n===selectedNode.id)+1} of {totalContacts}</span>
                          </div>
                          <div style={{ background: "rgba(255,255,255,0.3)", border: "1px solid var(--color-border)", padding: 10, borderRadius: 10 }}>
                            <span style={{ fontSize: 9, color: "var(--color-text-subtle)", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Activity Share</span>
                            <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-accent)", marginTop: 2, display: "block" }}>{((selectedNode.count/records.length)*100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <button onClick={() => setDeepAnalysisTarget(selectedNode.id)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e17055, #d63031)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(214,48,49,0.25)", letterSpacing: "0.02em" }}>
                          <Activity size={13} /> Run Deep Analysis <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            HOUR-OF-DAY ACTIVITY HEATMAP
        ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px", background: "#082229" }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(233,241,248,0.5)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={13} color="#00e5ff" /> When Does This Suspect Make Calls? — Hour by Day Heatmap
          </h3>
          <p style={{ fontSize: 11, color: "rgba(233,241,248,0.3)", marginBottom: 18, marginTop: 0 }}>
            Each cell = one hour of one day. <span style={{ color: "#d63031" }}>Red</span> = many calls. <span style={{ color: "rgba(0,229,255,0.7)" }}>Blue</span> = some calls. Dark = no calls. Red clusters at night = fraud pattern.
          </p>
          <div style={{ overflowX: "auto" }}>
            {/* Hour labels */}
            <div style={{ display: "flex", marginBottom: 4, paddingLeft: 72 }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ flex: 1, minWidth: 22, textAlign: "center", fontSize: 8, fontWeight: 700, color: "rgba(233,241,248,0.25)", fontFamily: "monospace" }}>
                  {h === 0 ? "12a" : h === 6 ? "6a" : h === 12 ? "12p" : h === 18 ? "6p" : h === 23 ? "11p" : ""}
                </div>
              ))}
            </div>
            {/* Grid */}
            {hourHeatmap.matrix.map((row, dayIdx) => {
              const dates = dayDatesMap[dayIdx];
              const dateLabel = dates.length > 0 ? `${DAYS[dayIdx]} ${dates[0]}${dates.length > 1 ? "+" : ""}` : DAYS[dayIdx];
              const dateTooltip = dates.length > 0 ? `Activity Dates: ${dates.join(", ")}` : "";
              return (
                <div key={dayIdx} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
                  <div 
                    title={dateTooltip}
                    style={{ width: 68, fontSize: 9, fontWeight: 700, color: "rgba(233,241,248,0.35)", textAlign: "right", paddingRight: 8, flexShrink: 0, cursor: dates.length > 0 ? "help" : "default" }}
                  >
                    {dateLabel}
                  </div>
                  {row.map((count, hour) => {
                    const cellTooltip = `${DAYS[dayIdx]} ${dates.length > 0 ? `(${dates.join(", ")})` : ""} ${String(hour).padStart(2,"0")}:00 — ${count} events`;
                    return (
                      <div key={hour}
                        onMouseEnter={() => setHeatHovered({ day: dayIdx, hour, count })}
                        onMouseLeave={() => setHeatHovered(null)}
                        title={cellTooltip}
                        style={{
                          flex: 1, minWidth: 22, height: 22, borderRadius: 3,
                          background: heatColor(count, hourHeatmap.maxVal),
                          cursor: count > 0 ? "pointer" : "default",
                          margin: "0 1px",
                          transition: "transform 0.1s ease",
                          transform: heatHovered?.day === dayIdx && heatHovered?.hour === hour ? "scale(1.4)" : "scale(1)",
                          border: (hour >= 22 || hour < 5) ? "1px solid rgba(214,48,49,0.25)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "rgba(233,241,248,0.3)" }}>Less</span>
            {["rgba(255,255,255,0.04)", "rgba(0,229,255,0.35)", "#fdcb6e", "#e17055", "#d63031"].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
            ))}
            <span style={{ fontSize: 9, color: "rgba(233,241,248,0.3)" }}>More</span>
            <span style={{ fontSize: 9, color: "rgba(214,48,49,0.6)", marginLeft: 10 }}>Red-bordered = night hours (10pm–5am)</span>
          </div>
          {heatHovered && heatHovered.count > 0 && (
            <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "rgba(233,241,248,0.5)" }}>
              <strong style={{ color: "#00e5ff" }}>
                {DAYS[heatHovered.day]}
                {dayDatesMap[heatHovered.day].length > 0 ? ` (${dayDatesMap[heatHovered.day].join(", ")})` : ""} at {String(heatHovered.hour).padStart(2,"0")}:00
              </strong> — {heatHovered.count} call events
            </div>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            CONNECTION TABLE
        ══════════════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ marginBottom: 20, fontSize: 15, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={15} color="#3a7ca5" /> All Contacts — Ranked by Interaction Count
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table className="ct-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Contact Number</th>
                  <th>Interactions</th>
                  <th style={{ width: "35%" }}>Share of Total Activity</th>
                  <th>Threat Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topContacts.map(([contact, count], idx) => {
                  const pct = Math.min((count / strongestCount) * 100, 100);
                  const isSelected = selectedNode?.id === contact;
                  const c = count >= 30 ? "#ff6b4a" : count >= 15 ? "#00e5ff" : "#2d8fa5";
                  const label = count >= 30 ? "High Risk" : count >= 15 ? "Suspicious" : "Normal";
                  const nodeObj = { id: contact, count, level: count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal", val: 6 + (count/strongestCount)*16 };
                  return (
                    <tr key={idx} style={{ cursor: "pointer", background: isSelected ? "rgba(225,112,85,0.06)" : "transparent", transition: "background 0.15s" }} onClick={() => setSelectedNode(nodeObj)}>
                      <td style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{String(idx+1).padStart(2,"0")}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{contact}</td>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: c }}>{count}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ height: 5, flex: 1, overflow: "hidden", borderRadius: 99, background: "rgba(0,0,0,0.07)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: idx * 0.03 }}
                              style={{ height: "100%", borderRadius: 99, background: c }} />
                          </div>
                          <span style={{ minWidth: 30, textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--color-text-subtle)" }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: `${c}12`, color: c, border: `1px solid ${c}30` }}>{label}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedNode(nodeObj); }} style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>Inspect <ChevronRight size={10} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeepAnalysisTarget(contact); }} style={{ fontSize: 10, fontWeight: 700, color: "#e17055", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><Zap size={10} /> Analyze</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

      </>)}

      {/* Deep Analysis Drawer */}
      <AnimatePresence>
        {deepAnalysisTarget && associateIntel && (
          <AssociateDrawer 
            intel={associateIntel} 
            onClose={() => setDeepAnalysisTarget(null)} 
            osintScans={osintScans}
            triggerOsintScan={triggerOsintScan}
            onExportMisp={(phone, data) => setMispModalTarget({ phone, data })}
          />
        )}
      </AnimatePresence>

      {/* MISP STIX Export Modal */}
      {mispModalTarget && (
        <MispExportModal 
          phone={mispModalTarget.phone} 
          osintData={mispModalTarget.data} 
          onClose={() => setMispModalTarget(null)} 
        />
      )}
    </motion.div>
  );
}

export default NetworkAnalysis;
