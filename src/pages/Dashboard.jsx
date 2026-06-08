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

  const [leftTab, setLeftTab] = useState("narrative");

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
      {/* ════════════════════════════════════════════════════════════
          SECTION 1: PAGE HEADER
          ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.2, margin: 0 }}>
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
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, marginTop: 2 }}>
            Telecom telemetry dossier on target ID:{" "}
            <strong style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)", fontSize: 13 }}>{diagnosticReport.target_phone}</strong>
          </p>
        </div>

        {/* Verdict chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "12px 20px",
            borderRadius: 14,
            border: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.65)",
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

      {/* ════════════════════════════════════════════════════════════
          SECTION 2: DIAGNOSTIC PROFILE + QUICK STATS (side by side)
          ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        className="glass-card"
        style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}
      >
        {/* Card Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--color-border-subtle)",
            background: "rgba(255,255,255,0.3)",
          }}
        >
          <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Sparkles size={13} color="var(--color-accent)" />
            Intelligent Diagnostic Profile
          </h2>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>
            Confidence: <strong style={{ color: "var(--color-text)" }}>{diagnosticReport.confidence_level}</strong>
          </span>
        </div>

        {/* Card Body */}
        <div style={{ padding: "24px" }}>
          {/* Ring meter + description row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={statusColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${diagnosticReport.suspicion_score * 264} 264`}
                  style={{ filter: `drop-shadow(0 0 4px ${statusColor})` }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: statusColor }}>
                  {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 2 }}>
                Anomaly Level Detected
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 6 }}>
                {diagnosticReport.raw_heuristic_score} pts scored
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0 }}>
                Target triggers {diagnosticReport.triggered_indicators.length} behavioral heuristics warnings.
                Risk classification suggests an active telemetry signature.
              </p>
            </div>
          </div>

          {/* Quick stats — 4 in a row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
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
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3: TABBED WORKSPACE
          ════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        className="glass-card"
        style={{ overflow: "hidden" }}
      >
        {/* Tabs Header */}
        <div className="tab-bar" style={{ margin: "12px 16px 0" }}>
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

        {/* Tab Content */}
        <div style={{ padding: "28px 28px 32px" }}>
          <AnimatePresence mode="wait">
            {/* ── Behavioral Narrative ── */}
            {leftTab === "narrative" && (
              <motion.div
                key="narrative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 28 }}
              >
                {/* Narrative prose */}
                <div>
                  <h3
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-accent)",
                      marginBottom: 16,
                      margin: 0,
                      marginBottom: 16,
                    }}
                  >
                    Behavioral Narrative Overview
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {narrativeBlocks.map((block, idx) => (
                      <p
                        key={idx}
                        style={{
                          fontSize: 13,
                          lineHeight: 1.8,
                          color: "var(--color-text-muted)",
                          margin: 0,
                        }}
                      >
                        {highlightNarrativeText(block)}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Operational Lifecycle Phases */}
                <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: 24 }}>
                  <h3
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-text-muted)",
                      margin: 0,
                      marginBottom: 16,
                    }}
                  >
                    Operational Lifecycle Phases
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {diagnosticReport.operational_phases.map((phase, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(255,255,255,0.45)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          padding: "16px 20px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{phase.phase}</span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              background: "rgba(108, 92, 231, 0.08)",
                              border: "1px solid rgba(108, 92, 231, 0.15)",
                              color: "#6c5ce7",
                            }}
                          >
                            {phase.event_count} logs
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                            borderTop: "1px solid var(--color-border-subtle)",
                            paddingTop: 10,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          <div>
                            IMEI: <span style={{ color: "#6c5ce7", fontWeight: 600 }}>{phase.imei || "Unknown"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-subtle)" }}>
                            <span>From: {phase.start}</span>
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span>To: {phase.end}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Threat Matrix ── */}
            {leftTab === "heuristics" && (
              <motion.div
                key="heuristics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
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
                      ? "rgba(214, 48, 49, 0.06)"
                      : rule.severity === "HIGH"
                        ? "rgba(108, 92, 231, 0.06)"
                        : "rgba(149, 165, 166, 0.06)";
                  return (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid var(--color-border)",
                        background: "rgba(255,255,255,0.4)",
                        borderRadius: 12,
                        padding: "16px 20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                          {rule.code.replace(/_/g, " ")}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: "3px 8px",
                            borderRadius: 99,
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            background: rBg,
                            color: rColor,
                            border: `1px solid ${rColor}30`,
                          }}
                        >
                          +{rule.points} pts | {rule.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0 }}>
                        {rule.detail}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Recommendations ── */}
            {leftTab === "recommendations" && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--color-accent)",
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Actionable Next Investigation Steps
                </h3>
                {diagnosticReport.automated_recommendations.map((rec) => {
                  const isCritical = rec.urgency === "CRITICAL";
                  const isHigh = rec.urgency === "HIGH";
                  const badgeColor = isCritical ? "#ff6b4a" : isHigh ? "#00e5ff" : "#88aeb7";
                  const badgeBg = isCritical
                    ? "rgba(255, 107, 74, 0.06)"
                    : isHigh
                      ? "rgba(0, 229, 255, 0.06)"
                      : "rgba(136, 174, 183, 0.06)";
                  return (
                    <div
                      key={rec.id}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderLeft: `4px solid ${badgeColor}`,
                        background: "rgba(255,255,255,0.45)",
                        borderRadius: 12,
                        padding: "16px 20px 16px 22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{rec.title}</h4>
                          <span
                            style={{
                              flexShrink: 0,
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 8.5,
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeColor}30`,
                            }}
                          >
                            {rec.urgency}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0 }}>
                          {rec.description}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border-subtle)", paddingTop: 10 }}>
                        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Category: {rec.category}
                        </span>
                        <button
                          onClick={() => alert(`Initiating Protocol: ${rec.action}`)}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: "5px 12px",
                            color: "white",
                            backgroundColor: badgeColor,
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
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
    </motion.div>
  );
}

export default Dashboard;