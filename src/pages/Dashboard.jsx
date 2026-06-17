import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ShieldAlert, FileText, Smartphone, MessageSquare, ChevronRight,
  Zap, Sparkles, Lock, Activity, Phone, AlertTriangle,
  TrendingUp, Info, CheckCircle2, Clock, Users,
  CreditCard, MapPin, Wifi, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

/* ─── Plain-English translation maps ─────────────────────────────────────── */
const RULE_LABELS = {
  HIGH_SMS_RATIO: { title: "Mostly Text Messages, Almost No Calls", icon: MessageSquare, color: "#d63031" },
  MULTI_BANK_AGGREGATION: { title: "Connected to Too Many Banks on One Phone", icon: CreditCard, color: "#d63031" },
  UPI_BIND_BURST: { title: "Bulk Payment App Setup Detected", icon: Zap, color: "#d63031" },
  RAPID_DEVICE_SWAPPING: { title: "Frequently Changing Phones", icon: Smartphone, color: "#3a7ca5" },
  VOICE_CESSATION: { title: "Stopped Making Calls Completely", icon: Phone, color: "#3a7ca5" },
  NO_PERSONAL_SOCIAL_FOOTPRINT: { title: "Barely Any Personal Contacts", icon: Users, color: "#e17055" },
  HIGH_RISK_GEOGRAPHIC_CIRCLE: { title: "Active in Known Fraud Hotspot Area", icon: MapPin, color: "#e17055" },
  HIGH_BANK_SENDER_RATIO: { title: "Almost All Contacts Are Banks / Payment Apps", icon: CreditCard, color: "#e17055" },
};

const CLASS_PLAIN = {
  HIGHLY_SUSPECT_FINANCIAL_MULE: {
    headline: "Very likely a financial fraud mule",
    sub: "This phone is being used as a tool to launder money through multiple banks and payment apps.",
    color: "#d63031",
    bg: "rgba(214,48,49,0.07)",
    border: "rgba(214,48,49,0.25)",
    icon: ShieldAlert,
  },
  SUSPECT_OPERATIONAL_SIM: {
    headline: "Suspicious activity detected",
    sub: "This phone shows multiple signs of being used for organised fraud operations.",
    color: "#e17055",
    bg: "rgba(225,112,85,0.07)",
    border: "rgba(225,112,85,0.25)",
    icon: AlertTriangle,
  },
  ANOMALOUS_USAGE_PATTERN: {
    headline: "Unusual behaviour — needs monitoring",
    sub: "Some red flags detected. This phone doesn't behave like a normal user's phone.",
    color: "#fdcb6e",
    bg: "rgba(253,203,110,0.1)",
    border: "rgba(253,203,110,0.35)",
    icon: Info,
  },
  NORMAL_USER: {
    headline: "No major threats found",
    sub: "This phone appears to be used normally. Keep monitoring.",
    color: "#00b894",
    bg: "rgba(0,184,148,0.07)",
    border: "rgba(0,184,148,0.25)",
    icon: CheckCircle2,
  },
};

const EVT_LABELS = { VOICE: "Phone Calls", SMS: "Text Messages", UPI_REG: "Payment App Setup", FINANCIAL: "Bank Alerts" };
const EVT_COLORS = { VOICE: "#3a7ca5", SMS: "#0984e3", UPI_REG: "#d63031", FINANCIAL: "#e17055" };

/* ─── Custom Tooltip for bar chart ──────────────────────────────────────── */
const DayTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", fontFamily: "var(--font-sans)" }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-subtle)", marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#3a7ca5" }}>{payload[0].value} events</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>{payload[0].name}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: payload[0].payload.fill }}>{payload[0].value} events ({payload[0].payload.pct}%)</p>
    </div>
  );
};

/* ─── Activity Heatmap Calendar ──────────────────────────────────────────── */
function ActivityCalendar({ events }) {
  const [hovered, setHovered] = useState(null);

  const { weeks, maxCount, months } = useMemo(() => {
    if (!events.length) return { weeks: [], maxCount: 1, months: [] };
    const dayMap = {};
    events.forEach(e => {
      const d = e.timestamp;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayMap[key] = (dayMap[key] || 0) + 1;
    });

    const keys = Object.keys(dayMap).sort();
    if (!keys.length) return { weeks: [], maxCount: 1, months: [] };
    const start = new Date(keys[0]);
    const end = new Date(keys[keys.length - 1]);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const all = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      all.push({ date: new Date(cur), key, count: dayMap[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }

    const ws = [];
    for (let i = 0; i < all.length; i += 7) ws.push(all.slice(i, i + 7));
    const mx = Math.max(...Object.values(dayMap), 1);

    // Month labels
    const seen = new Set();
    const mths = [];
    ws.forEach((w, wi) => {
      const m = w[0]?.date.toLocaleString("default", { month: "short" });
      if (m && !seen.has(m)) { seen.add(m); mths.push({ label: m, col: wi }); }
    });

    return { weeks: ws, maxCount: mx, months: mths };
  }, [events]);

  const color = (count) => {
    if (!count) return "rgba(0,0,0,0.05)";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "#d63031";
    if (ratio > 0.50) return "#e17055";
    if (ratio > 0.25) return "#fdcb6e";
    return "#5a94bb";
  };

  if (!weeks.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Month row */}
      <div style={{ display: "flex", marginBottom: 4, paddingLeft: 20 }}>
        {months.map(m => (
          <div key={m.label} style={{ position: "relative", minWidth: 0 }}>
            <span style={{ position: "absolute", left: m.col * 14, fontSize: 9, fontWeight: 700, color: "var(--color-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
      {/* Day labels + grid */}
      <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <span key={d} style={{ fontSize: 8, color: "var(--color-text-subtle)", height: 12, lineHeight: "12px", width: 18, textAlign: "right" }}>{d}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  onMouseEnter={() => setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  title={day.count ? `${day.date.toDateString()}: ${day.count} events` : day.date.toDateString()}
                  style={{
                    width: 12, height: 12, borderRadius: 2,
                    background: color(day.count),
                    cursor: day.count ? "pointer" : "default",
                    transition: "transform 0.1s ease",
                    transform: hovered?.key === day.key ? "scale(1.5)" : "scale(1)",
                    position: "relative",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 9, color: "var(--color-text-subtle)" }}>Less</span>
        {["rgba(0,0,0,0.05)", "#5a94bb", "#fdcb6e", "#e17055", "#d63031"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: 9, color: "var(--color-text-subtle)" }}>More</span>
      </div>
      {hovered && hovered.count > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
          <strong style={{ color: "var(--color-text)" }}>{hovered.date.toDateString()}</strong> — {hovered.count} events recorded
        </div>
      )}
    </div>
  );
}

/* ─── Stagger animation ──────────────────────────────────────────────────── */
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return "";
  if (/[a-zA-Z]/.test(dateStr)) return dateStr;
  const parts = dateStr.split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "";
  
  const dateParts = datePart.split("-");
  if (dateParts.length !== 3) return dateStr;
  
  const yr = dateParts[0];
  const moNum = parseInt(dateParts[1], 10);
  const dy = parseInt(dateParts[2], 10);
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const moName = months[moNum - 1] || dateParts[1];
  const dayStr = String(dy).padStart(2, "0");
  
  let timeStr = "";
  if (timePart) {
    const timeParts = timePart.split(":");
    if (timeParts.length >= 2) {
      timeStr = ` ${timeParts[0]}:${timeParts[1]}`;
    }
  }
  
  return `${dayStr} ${moName} ${yr}${timeStr}`;
};

/* ─── PDF Section 91 CrPC Notice Generator ───────────────────────────────── */
const generateCrpcNotice = (targetPhone, bankCount, triggeredIndicators) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("NOTICE UNDER SECTION 91 OF CODE OF CRIMINAL PROCEDURE (CRPC)", 105, 20, { align: "center" });
  
  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 190, 30, { align: "right" });
  doc.text("NOTICE ID: FCSA/SEC91/" + Math.floor(Math.random()*90000+10000), 20, 30);
  
  // Address
  doc.setFont("helvetica", "bold");
  doc.text("TO,", 20, 42);
  doc.setFont("helvetica", "normal");
  doc.text("The Nodal Officer / Cyber Fraud Investigation Division,\nAssociated Banking Entities / UPI Aggregator Gateway Operations,", 20, 48);
  
  // Subject
  doc.setFont("helvetica", "bold");
  doc.text(`SUBJECT: Requisition to freeze accounts linked to suspicious MSISDN: +91 ${targetPhone}`, 20, 62);
  
  // Body text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const bodyText = `Whereas, an investigation is currently being conducted by the Forensics Cyber Security Agency (FCSA) concerning organised financial cybercrimes, illicit money routing network operations (mule account syndicates), and burner communication lines.

During cellular data forensics, the mobile subscriber MSISDN +91 ${targetPhone} was flagged under automated threat indicators scoring high suspicion parameters (Score: ${triggeredIndicators.length} rules triggered). The subscriber telemetry database reveals critical forensic indicators:
- Aggregated financial transaction alerts from ${bankCount} distinct banking sender IDs.
- Outgoing UPI bindings burst sequences matching transaction mule handset swaps.
- Sparse personal communications footprint indicative of an inorganic, transaction-only burner SIM.

Therefore, in exercise of the powers vested under Section 91 of the Code of Criminal Procedure (CrPC), you are hereby requested to:
1. Immediately FREEZE all bank accounts, virtual wallets, and UPI handles associated with or linked to the phone number +91 ${targetPhone} to prevent further siphoning of illicit funds.
2. Furnish KYC documentation, account opening forms, IP addresses used during registration, and complete bank transaction logs for the linked accounts from the date of activation.
3. Supply these files to this command in digital format within 48 hours of receipt of this notice.

Failure to comply with this notice may attract penal proceedings under Section 175 and 188 of the Indian Penal Code (IPC) for non-compliance with public authority orders.`;

  doc.text(bodyText, 20, 72, { maxWidth: 170 });
  
  // Sign-off
  doc.setFont("helvetica", "bold");
  doc.text("Investigating Officer,", 20, 245);
  doc.setFont("helvetica", "normal");
  doc.text("Cyber Crime Cell / Forensics Command\nForensics Cyber Security Agency (FCSA)", 20, 251);
  
  doc.save(`CrPC_Section_91_Notice_${targetPhone}.pdf`);
};

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
function Dashboard() {
  const { cdrData, diagnosticReport } = useContext(CDRContext);
  const navigate = useNavigate();
  const records = cdrData.slice(1);

  const [activeTab, setActiveTab] = useState("narrative");

  /* ── Narrative prose blocks ── */
  const narrativeBlocks = useMemo(() => {
    if (!diagnosticReport?.behavioral_narrative) return [];
    return diagnosticReport.behavioral_narrative
      .split(/\.\s+/).filter(Boolean)
      .map(s => s.trim() + (s.endsWith(".") ? "" : "."));
  }, [diagnosticReport?.behavioral_narrative]);

  /* ── Daily activity for bar chart ── */
  const dailyActivity = useMemo(() => {
    if (!diagnosticReport?.replay_events?.length) return [];
    const map = {};
    diagnosticReport.replay_events.forEach(e => {
      if (!e.timestamp) return;
      const d = e.timestamp;
      const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [diagnosticReport]);

  /* ── Event type breakdown for donut ── */
  const eventTypeData = useMemo(() => {
    if (!diagnosticReport?.replay_events?.length) return [];
    const map = {};
    diagnosticReport.replay_events.forEach(e => {
      const t = e.type || "SMS";
      map[t] = (map[t] || 0) + 1;
    });
    const total = diagnosticReport.replay_events.length;
    return Object.entries(map).map(([type, count]) => ({
      name: EVT_LABELS[type] || type,
      value: count,
      pct: ((count / total) * 100).toFixed(0),
      fill: EVT_COLORS[type] || "#95a5a6",
    }));
  }, [diagnosticReport]);

  /* ── Empty state ── */
  if (!diagnosticReport || records.length === 0) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 40 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card empty-state">
          <div className="empty-state-icon">
            <ShieldAlert size={32} color="var(--color-accent)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No suspect file loaded yet</div>
          <p className="empty-state-body">
            Upload a Call Detail Record (CDR) file from your telecom operator to start analysing
            a suspect's phone activity, risk score, and connections.
          </p>
          <button onClick={() => navigate("/upload")} className="btn btn-primary"
            style={{ marginTop: 8, padding: "12px 28px", fontSize: 14 }}>
            Upload a CDR File
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  const cls = diagnosticReport.classification;
  const plain = CLASS_PLAIN[cls] || CLASS_PLAIN.NORMAL_USER;
  const PlainIcon = plain.icon;
  const isMule = cls === "HIGHLY_SUSPECT_FINANCIAL_MULE";
  const scoreColor = isMule ? "#d63031" : "#3a7ca5";

  return (
    <motion.div className="page-container theme-dashboard" variants={stagger} initial="initial" animate="animate">

      {/* ─── SECTION 1 — PLAIN ENGLISH VERDICT BANNER ─── */}
      {(() => {
        const brightColor =
          cls === "HIGHLY_SUSPECT_FINANCIAL_MULE" ? "#e74f47ff" :
            cls === "SUSPECT_OPERATIONAL_SIM" ? "#ff9f43" :
              cls === "ANOMALOUS_USAGE_PATTERN" ? "#ffeaa7" :
                "#55efc4";
        return (
          <motion.div variants={fadeUp} style={{
            borderRadius: 16, padding: "20px 24px", marginBottom: 24,
            background: "#415a77", border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
            display: "flex", alignItems: "flex-start", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <PlainIcon size={22} color={brightColor} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: brightColor, letterSpacing: "-0.02em" }}>
                  {plain.headline}
                </span>
                <span style={{
                  padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: `${brightColor}18`, color: brightColor, border: `1px solid ${brightColor}35`,
                }}>
                  Risk Score: {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6 }}>
                {plain.sub}
              </p>
              {/* Quick plain-English bullets */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {diagnosticReport.feature_vector.bank_sender_count >= 2 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "4px 10px" }}>
                    Connected to {diagnosticReport.feature_vector.bank_sender_count} banks
                  </span>
                )}
                {diagnosticReport.feature_vector.unique_imei_count >= 2 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "4px 10px" }}>
                    Changed phones {diagnosticReport.feature_vector.unique_imei_count} times
                  </span>
                )}
                {diagnosticReport.feature_vector.sms_ratio_pct > 80 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "4px 10px" }}>
                    {diagnosticReport.feature_vector.sms_ratio_pct}% text-only activity
                  </span>
                )}
                {diagnosticReport.feature_vector.upi_burst_sms_count > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "4px 10px" }}>
                    {diagnosticReport.feature_vector.upi_burst_sms_count} payment apps set up in bulk
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, padding: "4px 10px" }}>
                  {diagnosticReport.feature_vector.active_days} days of activity
                </span>
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <svg width={80} height={80} viewBox="0 0 80 80">
                <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth={7} />
                <circle cx={40} cy={40} r={32} fill="none" stroke={brightColor} strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={`${diagnosticReport.suspicion_score * 201} 201`}
                  strokeDashoffset={50}
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
                <text x={40} y={44} textAnchor="middle" fontSize={17} fontWeight={800}
                  fontFamily="var(--font-mono)" fill="#ffffff">
                  {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
                </text>
              </svg>
              <p style={{ margin: "4px 0 0", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.6)" }}>Risk</p>
            </div>
          </motion.div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — KPI STATS CARD
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="glass-card" style={{
        padding: 0, marginBottom: 24, overflow: "hidden",
        borderTop: `3px solid ${scoreColor}`,
      }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Sparkles size={13} color={scoreColor} />
            Key Statistics — What Was Found
          </h2>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>
            Confidence: <strong style={{ color: "var(--color-text)" }}>{diagnosticReport.confidence_level}</strong>
          </span>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16 }}>
            {[
              {
                label: "Days Active",
                value: diagnosticReport.feature_vector.active_days,
                unit: "days",
                help: "How many days this phone was in use",
                color: "var(--color-accent)",
                icon: Clock,
              },
              {
                label: "Phones Used",
                value: diagnosticReport.feature_vector.unique_imei_count,
                unit: "devices",
                help: "Number of different handsets this SIM was put into",
                color: "#5a94bb",
                icon: Smartphone,
              },
              {
                label: "Banks Connected",
                value: diagnosticReport.feature_vector.bank_sender_count,
                unit: "banks",
                help: "Number of different banks sending alerts to this SIM",
                color: "var(--color-gold)",
                icon: CreditCard,
              },
              {
                label: "Payment Setups",
                value: diagnosticReport.feature_vector.upi_burst_sms_count || "0",
                unit: "UPI apps",
                help: "Number of payment apps (GPay, PhonePe, Paytm) bulk-activated",
                color: "var(--color-gold)",
                icon: Zap,
              },
              {
                label: "Personal Contacts",
                value: diagnosticReport.feature_vector.personal_contact_count,
                unit: "people",
                help: "Number of regular personal contacts. Very low = suspicious",
                color: "var(--color-success)",
                icon: Users,
              },
              {
                label: "Total Events",
                value: diagnosticReport.feature_vector.total_records,
                unit: "records",
                help: "Total CDR records analysed",
                color: "#74b9ff",
                icon: BarChart2,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} whileHover={{ scale: 1.02, y: -2 }}
                  title={s.help}
                  className="stat-mini"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 12, padding: 16, cursor: "help" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>{s.label}</span>
                    <Icon size={14} color={s.color} />
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)", color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>{s.unit}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--color-text-subtle)", lineHeight: 1.5 }}>{s.help}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — DAILY ACTIVITY + EVENT TYPE CHARTS
      ══════════════════════════════════════════════════════ */}
      {(dailyActivity.length > 0 || eventTypeData.length > 0) && (
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Daily Activity Bar Chart */}
          <div className="glass-card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={13} color="#3a7ca5" />
              Activity Per Day
            </h3>
            <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 16, marginTop: 0 }}>
              How many phone events happened each day — spikes show high-activity days
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyActivity} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "var(--color-text-subtle)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<DayTooltip />} cursor={{ fill: "rgba(58,124,165,0.07)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dailyActivity.map((entry, i) => {
                    const max = Math.max(...dailyActivity.map(d => d.count));
                    const ratio = entry.count / max;
                    const fill = ratio > 0.7 ? "#d63031" : ratio > 0.4 ? "#e17055" : "#3a7ca5";
                    return <Cell key={i} fill={fill} fillOpacity={0.85} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 10, color: "var(--color-text-subtle)", margin: "8px 0 0", textAlign: "center" }}>
              Red bars = unusually high activity days
            </p>
          </div>

          {/* Event Type Donut */}
          <div className="glass-card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={13} color="#0984e3" />
              What Type of Activity?
            </h3>
            <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 8, marginTop: 0 }}>
              Breakdown of all events by category — normal users mostly have calls
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={eventTypeData} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                  dataKey="value" paddingAngle={3}>
                  {eventTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", marginTop: 4 }}>
              {eventTypeData.map(e => (
                <span key={e.name} style={{ fontSize: 10, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: e.fill, flexShrink: 0 }} />
                  {e.name} ({e.pct}%)
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — TABBED WORKSPACE
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ overflow: "hidden", marginBottom: 24, background: "#415a77", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: 14, boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)" }}>
        <div className="tab-bar" style={{ margin: "16px 16px 0", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
          {[
            { id: "narrative", label: "Full Story" },
            { id: "heuristics", label: "Red Flags Found" },
            { id: "recommendations", label: "What To Do Next" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-item${activeTab === tab.id ? " active" : ""}`}
              style={{
                background: activeTab === tab.id ? "#ffffff" : "transparent",
                color: activeTab === tab.id ? "#415a77" : "rgba(255, 255, 255, 0.8)",
                fontWeight: activeTab === tab.id ? 800 : 600,
                transition: "all 0.2s ease"
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "28px 28px 32px" }}>
          <AnimatePresence mode="wait">

            {/* ── Full Story (Narrative) ── */}
            {activeTab === "narrative" && (
              <motion.div key="narrative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", opacity: 0.9, margin: "0 0 20px" }}>
                    What this phone has been doing — in plain English
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {narrativeBlocks.map((block, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffeaa7", opacity: 0.9, flexShrink: 0, transform: "translateY(-2px)" }} />
                        <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255, 255, 255, 0.95)", margin: 0 }}>{block}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational phases timeline */}
                {diagnosticReport.operational_phases?.length > 0 && (
                  <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 24 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 16px" }}>
                      Timeline — How the phone was used over time
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", marginLeft: 8 }}>
                      <div style={{ position: "absolute", top: 16, bottom: 16, left: -1, width: 2, background: "rgba(255, 255, 255, 0.15)", zIndex: 0 }} />
                      {diagnosticReport.operational_phases.map((phase, idx) => (
                        <div key={idx} style={{ position: "relative", padding: "16px 20px 16px 28px", zIndex: 1 }}>
                          <div style={{ position: "absolute", top: 22, left: -5, width: 10, height: 10, borderRadius: "50%", background: "#ffffff", boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.2)" }} />
                          <div style={{ background: "#faf9f6", border: "1px solid rgba(255, 255, 255, 0.8)", borderRadius: 14, padding: 18, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f2635" }}>{phase.phase}</span>
                              <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)", background: "rgba(65, 90, 119, 0.08)", border: "1px solid rgba(65, 90, 119, 0.18)", color: "#415a77" }}>
                                {phase.event_count} events
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-muted)", borderTop: "1px dashed rgba(65, 90, 119, 0.15)", paddingTop: 10, fontFamily: "var(--font-mono)", flexWrap: "wrap", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Smartphone size={13} color="var(--color-text-subtle)" />
                                Phone: <span style={{ color: "#415a77", fontWeight: 700 }}>{phase.imei || "Unknown"}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#415a77", fontWeight: 600 }}>
                                <span style={{ background: "rgba(65, 90, 119, 0.06)", padding: "4px 10px", borderRadius: 6 }}>
                                  {formatFriendlyDate(phase.start)}
                                </span>
                                <span style={{ opacity: 0.5 }}>→</span>
                                <span style={{ background: "rgba(65, 90, 119, 0.06)", padding: "4px 10px", borderRadius: 6 }}>
                                  {formatFriendlyDate(phase.end)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Red Flags Found (Threat Matrix) ── */}
            {activeTab === "heuristics" && (
              <motion.div key="heuristics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ marginBottom: 8 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", opacity: 0.9, margin: "0 0 4px" }}>
                    Red Flags Detected — {diagnosticReport.triggered_indicators.length} warning{diagnosticReport.triggered_indicators.length !== 1 ? "s" : ""} triggered
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                    Each flag below is a specific behaviour pattern that is unusual for a normal phone user.
                  </p>
                </div>

                {diagnosticReport.triggered_indicators.map((rule, idx) => {
                  const meta = RULE_LABELS[rule.code] || { title: rule.code.replace(/_/g, " "), icon: AlertTriangle, color: "#95a5a6" };
                  const RuleIcon = meta.icon;
                  const isCritical = rule.severity === "CRITICAL";
                  const isHigh = rule.severity === "HIGH";
                  const badgeColor = isCritical ? "#ff7675" : isHigh ? "#74b9ff" : "#cbd5e1";
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      style={{ border: "1px solid rgba(255, 255, 255, 0.1)", borderLeft: `4px solid ${badgeColor}`, background: "rgba(255, 255, 255, 0.06)", borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <RuleIcon size={15} color={badgeColor} strokeWidth={2.2} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{meta.title}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)", background: "rgba(255, 255, 255, 0.08)", color: badgeColor, border: "1px solid rgba(255, 255, 255, 0.15)", textTransform: "uppercase" }}>
                            {isCritical ? "Critical" : isHigh ? "High" : "Medium"} · +{rule.points} pts
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(255, 255, 255, 0.75)", margin: 0 }}>
                        {rule.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── What To Do Next (Recommendations) ── */}
            {activeTab === "recommendations" && (
              <motion.div key="recommendations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", opacity: 0.9, margin: "0 0 4px" }}>
                    Recommended Next Steps
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                    Actions your investigation team should take, ordered by urgency.
                  </p>
                </div>

                {diagnosticReport.automated_recommendations.map((rec, i) => {
                  const isCrit = rec.urgency === "CRITICAL";
                  const isHi = rec.urgency === "HIGH";
                  const badgeColor = isCrit ? "#ff7675" : isHi ? "#74b9ff" : "#cbd5e1";
                  const btnColor = isCrit ? "#d63031" : isHi ? "#3a7ca5" : "#7f8c8d";
                  const urgLabel = isCrit ? "Do this immediately" : isHi ? "Do this soon" : "When possible";
                  return (
                    <motion.div key={rec.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ border: "1px solid rgba(255, 255, 255, 0.1)", borderLeft: `4px solid ${badgeColor}`, background: "rgba(255, 255, 255, 0.06)", borderRadius: 12, padding: "16px 20px 16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0 }}>{rec.title}</h4>
                          <span style={{ padding: "3px 9px", borderRadius: 8, fontSize: 9, fontWeight: 800, textTransform: "uppercase", background: "rgba(255, 255, 255, 0.08)", color: badgeColor, border: "1px solid rgba(255, 255, 255, 0.15)", flexShrink: 0 }}>
                            {urgLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(255, 255, 255, 0.75)", margin: 0 }}>{rec.description}</p>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: 10 }}>
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {rec.category}
                        </span>
                        <button
                          onClick={() => {
                            if (rec.action === "Freeze Accounts") {
                              generateCrpcNotice(diagnosticReport.target_phone, diagnosticReport.feature_vector.bank_sender_count, diagnosticReport.triggered_indicators);
                            } else {
                              alert(`Initiating action: ${rec.action}`);
                            }
                          }}
                          style={{ fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "6px 14px", color: "white", backgroundColor: btnColor, border: "none", cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 6 }}>
                          {rec.action}
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — ACTIVITY CALENDAR HEATMAP
      ══════════════════════════════════════════════════════ */}
      {diagnosticReport?.replay_events?.length > 0 && (
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={13} color="#e17055" />
            Activity Calendar — Daily Phone Usage Intensity
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 20, marginTop: 0 }}>
            Each square is one day. Darker red = more phone activity that day. Hover a square to see exact count.
          </p>
          <ActivityCalendar events={diagnosticReport.replay_events} />
        </motion.div>
      )}

    </motion.div>
  );
}

export default Dashboard;
