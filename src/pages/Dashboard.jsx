import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  FileText,
  Smartphone,
  MessageSquare,
  Octagon,
  ChevronRight,
  Zap,
  MapPin,
  TrendingUp,
  Sparkles,
  Lock,
  Activity,
  Phone,
  Radio,
  ExternalLink,
  PlusCircle,
  Terminal,
  AlertTriangle
} from "lucide-react";

const highlightNarrativeText = (text) => {
  if (!text) return "";
  const regex = /(Target SIM \d+|\d{10}|\d+\.\d+%|\b\d+ distinct\b|Bihar\/Jharkhand|\b\d+ unique\b|\b\d+ active\b|IMEI \d+|\b\d+ separate\b|\b\d+ bank accounts\b)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.match(/^Target SIM \d+$/) || part.match(/^\d{10}$/) || part.match(/^IMEI \d+$/)) {
      return <span key={i} className="text-gold font-mono font-bold">{part}</span>;
    }
    if (part.match(/^\d+\.\d+%$/)) {
      return <span key={i} className="text-accent-light font-bold font-mono">{part}</span>;
    }
    if (part.match(/Bihar\/Jharkhand/)) {
      return <span key={i} className="text-danger font-semibold">{part}</span>;
    }
    if (part.match(/(\b\d+ distinct\b|\b\d+ separate\b|\b\d+ bank accounts\b|\b\d+ unique\b|\b\d+ active\b)/)) {
      return <span key={i} className="text-accent-light font-bold">{part}</span>;
    }
    return part;
  });
};

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function Dashboard() {
  const { cdrData, diagnosticReport } = useContext(CDRContext);
  const navigate = useNavigate();
  const records = cdrData.slice(1);

  // Layout Tab States
  const [leftTab, setLeftTab] = useState("narrative"); // narrative, heuristics, recommendations

  // Replay timeline events
  const narrativeBlocks = useMemo(() => {
    if (!diagnosticReport?.behavioral_narrative) return [];
    return diagnosticReport.behavioral_narrative
      .split(/\.\s+/)
      .filter(Boolean)
      .map((s) => s.trim() + (s.endsWith(".") ? "" : "."));
  }, [diagnosticReport?.behavioral_narrative]);

  /* ── Empty State ── */
  if (!diagnosticReport || records.length === 0) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", paddingTop: 40 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card empty-state"
        >
          <div className="empty-state-icon">
            <ShieldAlert size={32} color="var(--color-accent)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">Forensic Intelligence Engine Offline</div>
          <p className="empty-state-body">
            No active suspect datasets loaded. Upload a standard Call Detail Record (CDR)
            file in the Ingestion Center to generate behavioral narrative profiles,
            explainable threat matrices, and link diagrams.
          </p>
          <button
            id="goto-upload"
            onClick={() => navigate("/upload")}
            className="btn btn-primary"
            style={{ marginTop: 8, padding: "12px 28px", fontSize: 14 }}
          >
            Go to Upload Center
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  const isMule = diagnosticReport.classification === "HIGHLY_SUSPECT_FINANCIAL_MULE";
  const statusColor = isMule ? "#d63031" : "#6c5ce7";
  const statusGlow = isMule ? "rgba(214, 48, 49, 0.10)" : "rgba(108, 92, 231, 0.10)";


  return (
    <motion.div
      className="page-container theme-dashboard"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} style={{ marginBottom: 22, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.2 }}>
              Investigative Workspace
            </h1>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: statusGlow,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                flexShrink: 0,
              }}
            >
              Target Active
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
            Telecom telemetry dossier on target ID:{" "}
            <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{diagnosticReport.target_phone}</strong>
          </p>
        </div>

        {/* Verdict card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "10px 18px",
            borderRadius: 14,
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 3 }}>
              AI Classification
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", lineHeight: 1 }}>
              {diagnosticReport.classification.replace(/_/g, " ")}
            </span>
          </div>
          <div style={{ width: 1, height: 32, background: "var(--color-border)" }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 3 }}>
              Risk Score
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: statusColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Multi-Panel HUD Layout */}
      <div className="flex flex-col" style={{ gap: 24 }}>
        {/* ========================================================
            LEFT COLUMN: AI INVESTIGATOR ASSISTANT (40% width)
            ======================================================== */}
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Dossier Overview Card */}
          <motion.div variants={fadeUp} className="glass-card border border-border p-6 relative overflow-hidden" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="scan-overlay pointer-events-none absolute inset-0" />
            <div className="flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 12 }}>
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-text-muted flex items-center gap-2">
                <Sparkles size={13} className="text-accent" />
                INTELLIGENT DIAGNOSTIC PROFILE
              </h2>
              <span className="text-[11px] font-mono text-text-subtle">
                Confidence: <strong className="text-text">{diagnosticReport.confidence_level}</strong>
              </span>
            </div>

            {/* Suspect Ring Meter */}
            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${diagnosticReport.suspicion_score * 264} 264`}
                    style={{
                      filter: `drop-shadow(0 0 4px ${statusColor})`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-mono" style={{ color: statusColor }}>
                    {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-extrabold tracking-wider text-text-subtle uppercase">ANOMALY LEVEL DETECTED</div>
                <div className="text-lg font-extrabold text-text mt-0.5">
                  {diagnosticReport.raw_heuristic_score} pts scored
                </div>
                <p className="text-[12.5px] leading-relaxed text-text-muted mt-2">
                  Target triggers {diagnosticReport.triggered_indicators.length} behavioral heuristics warnings.
                  Risk classification suggests an active telemetry signature.
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Workspace Panel Tabs */}
          <motion.div
            variants={fadeUp}
            className="glass-card flex-1 flex flex-col overflow-hidden h-[560px] lg:h-auto lg:min-h-0"
          >
            {/* Tabs Header */}
            <div className="tab-bar">
              {[
                { id: "narrative",       label: "Behavioral Narrative" },
                { id: "heuristics",     label: "Threat Matrix" },
                { id: "recommendations",label: "Next Actions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`tab-item${leftTab === tab.id ? " active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                padding: leftTab === "narrative" ? "32px" : "24px",
                paddingBottom: leftTab === "narrative" ? "32px" : "24px",
              }}
            >
              <AnimatePresence mode="wait">
                {leftTab === "narrative" && (
                  <motion.div
                    key="narrative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-6 pb-8"
                  >
                    {/* Quick Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Operational Span",   value: diagnosticReport.feature_vector.active_days || "N/A",           unit: "days",     color: "var(--color-accent)" },
                        { label: "Hardware Fleet",     value: diagnosticReport.feature_vector.unique_imei_count || "N/A",    unit: "IMEIs",    color: "#c084fc" },
                        { label: "Financial Accounts", value: diagnosticReport.feature_vector.bank_sender_count || "N/A",    unit: "banks",    color: "var(--color-gold)" },
                        { label: "UPI Aggregations",   value: diagnosticReport.feature_vector.upi_burst_sms_count || "0",   unit: "bindings", color: "var(--color-gold)" },
                      ].map((s) => (
                        <div key={s.label} className="stat-mini">
                          <span className="stat-mini-label">{s.label}</span>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 4 }}>
                            <span className="stat-mini-value" style={{ color: s.color }}>{s.value}</span>
                            <span className="stat-mini-sub">{s.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3
                        className="text-xs font-bold text-accent uppercase tracking-wider"
                        style={{ marginBottom: "20px" }}
                      >
                        Behavioral Narrative Overview
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {narrativeBlocks.map((block, idx) => (
                          <p
                            key={idx}
                            className="text-[13.5px] text-text-muted font-sans"
                            style={{
                              lineHeight: "1.8",
                              maxWidth: "70ch",
                              margin: 0,
                            }}
                          >
                            {highlightNarrativeText(block)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6 mt-4">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider" style={{ marginBottom: "20px" }}>
                        Operational Lifecycle Phases
                      </h3>
                      <div className="flex flex-col" style={{ gap: "16px" }}>
                        {diagnosticReport.operational_phases.map((phase, idx) => (
                          <div
                            key={idx}
                            className="bg-white/40 border border-border rounded-xl"
                            style={{ padding: "20px" }}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-text">{phase.phase}</span>
                                <span
                                  className="rounded px-2 py-0.5 font-mono text-[10px]"
                                  style={{
                                    backgroundColor: "rgba(108, 92, 231, 0.08)",
                                    border: "1px solid rgba(108, 92, 231, 0.15)",
                                    color: "var(--primary, #6c5ce7)",
                                    fontWeight: 700
                                  }}
                                >
                                  {phase.event_count} logs
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border-subtle pt-2.5 mt-0.5">
                                <div className="font-mono">
                                  IMEI: <span style={{ color: "#6c5ce7", fontWeight: 600 }}>{phase.imei || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-text-subtle font-mono">
                                  <span>From: {phase.start}</span>
                                  <span style={{ opacity: 0.5 }}>•</span>
                                  <span>To: {phase.end}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {leftTab === "heuristics" && (
                  <motion.div
                    key="heuristics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4 pb-8"
                  >
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                      Triggered Threat Heuristics
                    </h3>
                    {diagnosticReport.triggered_indicators.map((rule, idx) => {
                      const rColor =
                        rule.severity === "CRITICAL"
                          ? "#d63031"
                          : rule.severity === "HIGH"
                            ? "#6c5ce7"
                            : "#95a5a6";
                      const rBg =
                        rule.severity === "CRITICAL"
                          ? "rgba(214, 48, 49, 0.08)"
                          : rule.severity === "HIGH"
                            ? "rgba(108, 92, 231, 0.08)"
                            : "rgba(149, 165, 166, 0.08)";
                      return (
                        <div
                          key={idx}
                          className="border border-border bg-white/30 rounded-xl text-left"
                          style={{ padding: "16px 20px" }}
                        >
                          <div className="flex justify-between items-center gap-4 mb-2">
                            <span className="text-xs font-bold text-text">
                              {rule.code.replace(/_/g, " ")}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono"
                              style={{
                                backgroundColor: rBg,
                                color: rColor,
                                border: `1px solid ${rColor}30`,
                              }}
                            >
                              +{rule.points} pts | {rule.severity}
                            </span>
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-text-muted mt-1">
                            {rule.detail}
                          </p>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {leftTab === "recommendations" && (
                  <motion.div
                    key="recommendations"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-4 pb-8"
                  >
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                      Actionable Next Investigation Steps
                    </h3>
                    {diagnosticReport.automated_recommendations.map((rec) => {
                      const isCritical = rec.urgency === "CRITICAL";
                      const isHigh = rec.urgency === "HIGH";
                      const badgeColor = isCritical ? "#ff6b4a" : isHigh ? "#00e5ff" : "#88aeb7";
                      const badgeBg = isCritical
                        ? "rgba(255, 107, 74, 0.08)"
                        : isHigh
                          ? "rgba(0, 229, 255, 0.08)"
                          : "rgba(136, 174, 183, 0.08)";
                      return (
                        <div
                          key={rec.id}
                          className="border border-border bg-white/40 rounded-xl flex flex-col gap-3 relative overflow-hidden"
                          style={{
                            borderLeft: `4px solid ${badgeColor}`,
                            padding: "18px 20px 18px 24px"
                          }}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <h4 className="text-xs font-bold text-text">{rec.title}</h4>
                              <span
                                className="shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold font-mono"
                                style={{
                                  backgroundColor: badgeBg,
                                  color: badgeColor,
                                  border: `1px solid ${badgeColor}30`,
                                }}
                              >
                                {rec.urgency}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-text-muted">
                              {rec.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-border pt-2.5 mt-0.5">
                            <span className="text-[10px] font-mono text-text-subtle uppercase tracking-wider">
                              Category: {rec.category}
                            </span>
                            <button
                              onClick={() => alert(`Initiating Protocol: ${rec.action}`)}
                              className="text-[10px] font-bold rounded px-2.5 py-1 text-white transition-all hover:brightness-110"
                              style={{ backgroundColor: badgeColor }}
                            >
                              {rec.action}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}

export default Dashboard;