import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, ChevronRight, Shield,
  TrendingUp, Crosshair, BarChart3, Zap, Info,
  MessageSquare, CreditCard, Smartphone, Phone, MapPin, Users,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell,
  CartesianGrid, ReferenceLine,
} from "recharts";

/* ─── Radar axis definitions ─────────────────────────────────────────────── */
const RADAR_AXES = [
  { key: "sms_ratio",       label: "Text-Only",      hint: "% of activity that is text messages (high = suspicious)",  normal: 40,  max: 100 },
  { key: "bank_connect",    label: "Bank Links",      hint: "Number of banks connected (any >3 is unusual)",            normal: 10,  max: 100 },
  { key: "device_swaps",   label: "Phone Changes",   hint: "How often the phone handset was swapped",                  normal: 5,   max: 100 },
  { key: "risk_circle",    label: "Fraud Zone",      hint: "% of activity in known fraud hotspot telecom circles",     normal: 0,   max: 100 },
  { key: "voice_silence",  label: "No Calls",        hint: "% of time with no voice calls at all",                    normal: 20,  max: 100 },
  { key: "upi_burst",      label: "Payment Surge",   hint: "Bulk payment app (GPay/PhonePe) activation events",       normal: 0,   max: 100 },
];

const RULE_META = {
  HIGH_SMS_RATIO:               { label: "Mostly Text Messages",              icon: MessageSquare, color: "#d63031" },
  MULTI_BANK_AGGREGATION:       { label: "Connected to Too Many Banks",        icon: CreditCard,   color: "#d63031" },
  UPI_BIND_BURST:               { label: "Bulk Payment App Setup",             icon: Zap,          color: "#e17055" },
  RAPID_DEVICE_SWAPPING:        { label: "Frequent Phone Switching",           icon: Smartphone,   color: "#6c5ce7" },
  VOICE_CESSATION:              { label: "Stopped Making Calls",               icon: Phone,        color: "#6c5ce7" },
  NO_PERSONAL_SOCIAL_FOOTPRINT: { label: "Barely Any Personal Contacts",       icon: Users,        color: "#e17055" },
  HIGH_RISK_GEOGRAPHIC_CIRCLE:  { label: "Active in Fraud Hotspot Area",       icon: MapPin,       color: "#d63031" },
};

const CLASS_INFO = {
  HIGHLY_SUSPECT_FINANCIAL_MULE: { label: "Financial Fraud Mule",   color: "#d63031" },
  SUSPECT_OPERATIONAL_SIM:       { label: "Suspicious Operational SIM", color: "#e17055" },
  ANOMALOUS_USAGE_PATTERN:       { label: "Unusual Pattern",         color: "#fdcb6e" },
  NORMAL_USER:                   { label: "Normal User",             color: "#00b894" },
};

/* ─── Custom tooltips ─────────────────────────────────────────────────────── */
const RadarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", fontSize: 12, maxWidth: 200 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 800, color: "var(--color-text)" }}>{d.label}</p>
      <p style={{ margin: "0 0 2px", color: "#d63031" }}>Suspect: <strong>{d.suspect}%</strong></p>
      <p style={{ margin: "0 0 6px", color: "#00b894" }}>Normal: <strong>{d.normal}%</strong></p>
      <p style={{ margin: 0, color: "var(--color-text-subtle)", lineHeight: 1.4, fontSize: 11 }}>{d.hint}</p>
    </div>
  );
};

const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 11, color: "var(--color-text-muted)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: 13, fontWeight: 800, color: p.color }}>{p.name}: {p.value}{p.name.includes("%") ? "" : " pts"}</p>
      ))}
    </div>
  );
};

const fadeUp  = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

/* ═══════════════════════════════════════════════════════════════════════════
   RISK CENTER
═══════════════════════════════════════════════════════════════════════════ */
function RiskCenter() {
  const { cdrData, diagnosticReport } = useContext(CDRContext);
  const navigate  = useNavigate();
  const records   = cdrData.slice(1);
  const [tipAxis, setTipAxis] = useState(null);

  /* ── Radar data ── */
  const radarData = useMemo(() => {
    if (!diagnosticReport) return [];
    const fv = diagnosticReport.feature_vector;
    return RADAR_AXES.map(ax => {
      let raw = 0;
      if (ax.key === "sms_ratio")    raw = fv.sms_ratio_pct ?? 0;
      if (ax.key === "bank_connect") raw = Math.min(100, ((fv.bank_sender_count ?? 0) / 10) * 100);
      if (ax.key === "device_swaps") raw = Math.min(100, ((fv.device_swaps_per_month ?? 0) / 3) * 100);
      if (ax.key === "risk_circle")  raw = fv.high_risk_circle_ratio_pct ?? 0;
      if (ax.key === "voice_silence")raw = fv.voice_silence_fraction_pct ?? 0;
      if (ax.key === "upi_burst")    raw = Math.min(100, ((fv.upi_burst_sms_count ?? 0) / 10) * 100);
      return { label: ax.label, suspect: Math.round(raw), normal: ax.normal, hint: ax.hint };
    });
  }, [diagnosticReport]);

  /* ── Score build-up ── */
  const scoreBuildUp = useMemo(() => {
    if (!diagnosticReport?.triggered_indicators?.length) return [];
    let running = 0;
    return diagnosticReport.triggered_indicators.map(rule => {
      running += rule.points;
      const meta = RULE_META[rule.code] || { label: rule.code, color: "#95a5a6" };
      return { name: meta.label, points: rule.points, cumulative: running, color: meta.color };
    });
  }, [diagnosticReport]);

  /* ── Baseline comparison ── */
  const baselineData = useMemo(() => {
    if (!diagnosticReport) return [];
    const fv = diagnosticReport.feature_vector;
    return [
      { metric: "Text Msgs %", suspect: fv.sms_ratio_pct ?? 0,             normal: 42, unit: "%" },
      { metric: "Banks Connected", suspect: fv.bank_sender_count ?? 0,     normal: 1,  unit: "" },
      { metric: "Phone Swaps", suspect: fv.unique_imei_count ?? 0,         normal: 1,  unit: "" },
      { metric: "Personal Contacts", suspect: fv.personal_contact_count ?? 0, normal: 25, unit: "" },
      { metric: "UPI Setups", suspect: fv.upi_burst_sms_count ?? 0,        normal: 0,  unit: "" },
    ];
  }, [diagnosticReport]);

  /* ── Empty state ── */
  if (!diagnosticReport || records.length === 0) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 40 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card empty-state">
          <div className="empty-state-icon" style={{ background: "rgba(225,112,85,0.1)", borderColor: "rgba(225,112,85,0.25)" }}>
            <AlertTriangle size={30} color="var(--color-gold)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No CDR Loaded</div>
          <p className="empty-state-body">Upload a Call Detail Record file first to see the full risk breakdown and visual analysis.</p>
          <button onClick={() => navigate("/upload")} className="btn btn-primary" style={{ marginTop: 8, padding: "12px 24px", fontSize: 14 }}>
            Upload CDR File <ChevronRight size={15} />
          </button>
        </motion.div>
      </div>
    );
  }

  const cls = diagnosticReport.classification;
  const clsInfo = CLASS_INFO[cls] || CLASS_INFO.NORMAL_USER;
  const scorePercent = Math.round(diagnosticReport.suspicion_score * 100);
  const totalPoints  = diagnosticReport.triggered_indicators.reduce((s, r) => s + r.points, 0);

  return (
    <motion.div className="page-container theme-risk" variants={stagger} initial="initial" animate="animate">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: `${clsInfo.color}12`, border: `1px solid ${clsInfo.color}30`, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: clsInfo.color, marginBottom: 10 }}>
              <TrendingUp size={10} /> Risk Intelligence
            </div>
            <h1 className="page-title">Risk Center</h1>
            <p className="page-subtitle">
              Visual breakdown of every risk factor — see exactly why this phone scored the way it did, in plain English.
            </p>
          </div>
          {/* Score badge */}
          <div style={{ textAlign: "center", padding: "16px 24px", borderRadius: 16, background: `${clsInfo.color}08`, border: `1.5px solid ${clsInfo.color}25` }}>
            <p style={{ margin: "0 0 2px", fontSize: 36, fontWeight: 900, fontFamily: "var(--font-mono)", color: clsInfo.color, letterSpacing: "-0.04em" }}>{scorePercent}%</p>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)" }}>Overall Risk</p>
            <span style={{ fontSize: 11, fontWeight: 800, color: clsInfo.color, background: `${clsInfo.color}15`, padding: "3px 10px", borderRadius: 99, border: `1px solid ${clsInfo.color}30` }}>{clsInfo.label}</span>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — Risk Radar Chart + Score Gauge side-by-side
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* Radar Chart */}
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Crosshair size={13} color="#d63031" /> Risk Profile — 6 Dimensions
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 8, marginTop: 0 }}>
            The red shape is this suspect. The green shape is a normal phone user. Bigger red = more suspicious.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--color-text-subtle)" }} tickCount={4} />
              <Tooltip content={<RadarTip />} />
              <Radar name="Normal User" dataKey="normal" stroke="#00b894" fill="#00b894" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 3" />
              <Radar name="Suspect" dataKey="suspect" stroke="#d63031" fill="#d63031" fillOpacity={0.22} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}>
              <span style={{ width: 20, height: 2, background: "#d63031", borderRadius: 1 }} />Suspect
            </span>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}>
              <span style={{ width: 20, height: 2, background: "#00b894", borderRadius: 1, borderStyle: "dashed" }} />Normal User
            </span>
          </div>
        </div>

        {/* Dimension details */}
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={13} color="#6c5ce7" /> What Each Dimension Means
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 16, marginTop: 0 }}>
            Hover rows to understand. Red = worse than normal.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {radarData.map((d) => {
              const worse = d.suspect > d.normal;
              const pct = d.suspect;
              return (
                <div key={d.label}
                  onMouseEnter={() => setTipAxis(d.label)}
                  onMouseLeave={() => setTipAxis(null)}
                  style={{ cursor: "help" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: worse ? "#d63031" : "#00b894" }}>{d.label}</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "var(--color-text-subtle)" }}>Normal: {d.normal}%</span>
                      <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)", color: worse ? "#d63031" : "#00b894" }}>{d.suspect}%</span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.06)", overflow: "hidden", position: "relative" }}>
                    {/* Normal baseline */}
                    <div style={{ position: "absolute", left: `${d.normal}%`, top: 0, bottom: 0, width: 2, background: "#00b894", opacity: 0.6, zIndex: 1 }} />
                    {/* Suspect bar */}
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: worse ? "#d63031" : "#00b894", opacity: 0.75 }} />
                  </div>
                  <AnimatePresence>
                    {tipAxis === d.label && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ margin: "4px 0 0", fontSize: 10, color: "var(--color-text-subtle)", lineHeight: 1.5 }}>
                        {d.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — Score Build-Up Timeline
      ══════════════════════════════════════════════════════ */}
      {scoreBuildUp.length > 0 && (
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px", marginBottom: 24 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={13} color="#e17055" /> How the Risk Score Was Built Up
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 20, marginTop: 0 }}>
            Each red flag adds points to the total risk score. The line shows the running total after each flag was detected.
          </p>

          {/* Visual score accumulation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scoreBuildUp.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Step number */}
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${step.color}15`, border: `1.5px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: step.color, fontFamily: "var(--font-mono)" }}>{i + 1}</span>
                </div>
                {/* Label */}
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", minWidth: 220 }}>{step.name}</span>
                {/* Points badge */}
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)", color: step.color, background: `${step.color}10`, padding: "2px 8px", borderRadius: 6, border: `1px solid ${step.color}25`, flexShrink: 0 }}>
                  +{step.points} pts
                </span>
                {/* Running total bar */}
                <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (step.cumulative / 130) * 100)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                    style={{ height: "100%", background: step.cumulative >= 100 ? "#d63031" : step.cumulative >= 70 ? "#e17055" : "#6c5ce7", borderRadius: 3 }} />
                </div>
                {/* Running total */}
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", flexShrink: 0, minWidth: 50, textAlign: "right" }}>
                  {step.cumulative} / 130
                </span>
              </motion.div>
            ))}
          </div>

          {/* Final score summary */}
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: `${clsInfo.color}07`, border: `1px solid ${clsInfo.color}20`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                {diagnosticReport.triggered_indicators.length} red flags triggered, {totalPoints} total points
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                Score thresholds: 0–39 = Normal · 40–69 = Unusual · 70–99 = Suspicious · 100+ = Financial Fraud Mule
              </p>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "var(--font-mono)", color: clsInfo.color }}>{totalPoints} pts</span>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — Baseline Comparison Chart
      ══════════════════════════════════════════════════════ */}
      {baselineData.length > 0 && (
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px", marginBottom: 24 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={13} color="#0984e3" /> This Phone vs. a Normal User
          </h3>
          <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 16, marginTop: 0 }}>
            Blue = this suspect's phone. Green = what a typical innocent phone looks like. See the difference clearly.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={baselineData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }} barGap={4}>
              <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-subtle)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 11, fill: "var(--color-text)", fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="normal" name="Normal User" fill="#00b894" fillOpacity={0.6} radius={[0, 4, 4, 0]} barSize={8} />
              <Bar dataKey="suspect" name="This Suspect" radius={[0, 4, 4, 0]} barSize={8}>
                {baselineData.map((entry, i) => (
                  <Cell key={i} fill={entry.suspect > entry.normal * 1.5 ? "#d63031" : entry.suspect > entry.normal ? "#e17055" : "#00b894"} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}><span style={{ width: 12, height: 8, borderRadius: 2, background: "#00b894", opacity: 0.6 }} />Normal User</span>
            <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)" }}><span style={{ width: 12, height: 8, borderRadius: 2, background: "#d63031", opacity: 0.8 }} />This Suspect</span>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — Per-Rule Drill-Down Cards
      ══════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px" }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={13} color="#d63031" /> Every Red Flag — Explained Simply
        </h3>
        <p style={{ fontSize: 11, color: "var(--color-text-subtle)", marginBottom: 20, marginTop: 0 }}>
          Each card below is one reason this phone scored as suspicious. Click the rule name to understand it fully.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {diagnosticReport.triggered_indicators.map((rule, idx) => {
            const meta = RULE_META[rule.code] || { label: rule.code, icon: AlertTriangle, color: "#95a5a6" };
            const RuleIcon = meta.icon;
            const isCrit = rule.severity === "CRITICAL";
            const badgeC = isCrit ? "#d63031" : rule.severity === "HIGH" ? "#e17055" : "#6c5ce7";
            return (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3, boxShadow: `0 12px 32px ${meta.color}18` }}
                style={{ border: `1px solid ${meta.color}20`, borderTop: `3px solid ${meta.color}`, background: "rgba(255,255,255,0.55)", borderRadius: 14, padding: "18px 20px", cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}10`, border: `1px solid ${meta.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RuleIcon size={17} color={meta.color} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.3 }}>{meta.label}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 6, background: `${badgeC}12`, color: badgeC, border: `1px solid ${badgeC}25` }}>
                        {isCrit ? "Critical" : rule.severity === "HIGH" ? "High" : "Medium"}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: "var(--color-text-muted)" }}>
                        +{rule.points} points
                      </span>
                    </div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.65, color: "var(--color-text-muted)" }}>{rule.detail}</p>
                {/* Visual points bar */}
                <div style={{ height: 4, background: "rgba(0,0,0,0.05)", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(rule.points / 50) * 100}%` }} transition={{ duration: 0.7, delay: idx * 0.05, ease: "easeOut" }}
                    style={{ height: "100%", background: meta.color, borderRadius: 2, opacity: 0.75 }} />
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 10, color: "var(--color-text-subtle)", textAlign: "right" }}>{rule.points} of max 50 pts</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}

export default RiskCenter;
