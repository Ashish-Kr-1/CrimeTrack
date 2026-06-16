import { useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { useAuth } from "../auth/AuthContext";
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
  const regex = /(Target SIM \d+|\d{10}|\d+\.\d+%|\b\d+ distinct\b|Bihar\/Jharkhand|\b\d+ unique\b|\b\d+ active\b|IMEI \d+|\b\d+ separate\b|\b\d+ bank accounts\b|device swap rate|Coordinated hardware transitions|critical telemetry alert|high-security investigations|Social footprint analysis|Geospatial logs)/gi;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    const lower = part.toLowerCase();
    if (part.match(/^Target SIM \d+$/i) || part.match(/^\d{10}$/) || part.match(/^IMEI \d+$/i)) {
      return <span key={i} className="text-gold font-mono font-bold">{part}</span>;
    }
    if (part.match(/^\d+\.\d+%$/)) {
      return <span key={i} className="text-accent font-bold font-mono">{part}</span>;
    }
    if (part.match(/Bihar\/Jharkhand/i)) {
      return <span key={i} className="text-danger font-semibold">{part}</span>;
    }
    if (part.match(/(\b\d+ distinct\b|\b\d+ separate\b|\b\d+ bank accounts\b|\b\d+ unique\b|\b\d+ active\b)/i)) {
      return <span key={i} className="text-accent font-bold">{part}</span>;
    }
    if (lower.match(/device swap rate|coordinated hardware transitions|critical telemetry alert|high-security investigations|social footprint analysis|geospatial logs/)) {
      return <strong key={i} style={{ color: "var(--color-text)" }}>{part}</strong>;
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
  const { user } = useAuth();
  const role = user?.role || "analyst";
  const { cdrData, diagnosticReport } = useContext(CDRContext);
  const navigate = useNavigate();
  const records = cdrData.slice(1);

  const [leftTab, setLeftTab] = useState("narrative");

  // Admin Dashboard Render
  if (role === "admin") {
    return (
      <motion.div
        className="page-container theme-dashboard"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--color-text)", margin: 0 }}>
            System Administration Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
            Operational health diagnostics, active accounts overview, and Ingestion metrics.
          </p>
        </motion.div>

        {/* Audit Stats Grid */}
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)", borderTop: "3px solid #6c5ce7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingested Telemetry Records</span>
              <FileText size={14} color="#6c5ce7" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>14,805 logs</div>
          </div>

          <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)", borderTop: "3px solid #00b894" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Operations Status</span>
              <Activity size={14} color="#00b894" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#00b894", fontFamily: "var(--font-mono)" }}>OPTIMAL</div>
          </div>

          <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)", borderTop: "3px solid #e17055" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Security Gateway</span>
              <Lock size={14} color="#e17055" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>3 / 3 Active</div>
          </div>
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "28px", background: "rgba(255, 255, 255, 0.78)" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 20px 0" }}>
            Admin Diagnostics & Storage Overview
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="md:grid-cols-2">
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>System Storage Capacity</h3>
              <div style={{ background: "rgba(0,0,0,0.06)", height: "12px", borderRadius: "6px", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ background: "#6c5ce7", width: "42%", height: "100%" }} />
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
                Using 42% of total allocated workspace storage (4.2 GB of 10 GB).
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>Active Ingestion Queues</h3>
              <p style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--color-text-muted)", margin: 0 }}>
                Patna carrier server interface: <strong style={{ color: "#00b894" }}>ONLINE</strong><br />
                Gaya CDR spreadsheet ingestion channel: <strong style={{ color: "#00b894" }}>ONLINE</strong><br />
                Security encryption node: <strong style={{ color: "#6c5ce7" }}>AES-256 ACTIVE</strong>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Officer Dashboard Render
  if (role === "officer") {
    return (
      <motion.div
        className="page-container theme-mobility"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--color-text)", margin: 0 }}>
            Field Operations Hub
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
            Active suspect dispatch, live coordinate triangulation, and operational alerts.
          </p>
        </motion.div>

        {/* Targets Summary Widget */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "28px", background: "rgba(255, 255, 255, 0.78)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0 }}>
                Active Target Triangulation Alert
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>
                Latest telemetry data processed for suspect device.
              </p>
            </div>
            {diagnosticReport && (
              <span style={{ padding: "6px 14px", borderRadius: "9999px", background: "rgba(214, 48, 49, 0.08)", border: "1px solid rgba(214, 48, 49, 0.2)", color: "#d63031", fontWeight: "800", fontSize: "11px" }}>
                {(diagnosticReport.suspicion_score * 100).toFixed(0)}% THREAT VERDICT
              </span>
            )}
          </div>

          {diagnosticReport ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-3">
                <div style={{ padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8" }}>Target Phone</span>
                  <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "6px", fontFamily: "var(--font-mono)" }}>{diagnosticReport.target_phone}</div>
                </div>
                <div style={{ padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8" }}>Suspect Classification</span>
                  <div style={{ fontSize: "14px", fontWeight: "800", marginTop: "6px" }}>{diagnosticReport.classification.replace(/_/g, " ")}</div>
                </div>
                <div style={{ padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8" }}>Operational Location</span>
                  <div style={{ fontSize: "14px", fontWeight: "800", marginTop: "6px" }}>Bihar / Jharkhand region</div>
                </div>
              </div>

              <div style={{ borderTop: "1px dashed rgba(0,0,0,0.06)", paddingTop: "16px", display: "flex", gap: "12px" }}>
                <button
                  onClick={() => navigate("/lookup")}
                  style={{
                    background: "#00b894",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0, 184, 148, 0.2)",
                  }}
                >
                  Triangulate Live Coordinates
                </button>
                <button
                  onClick={() => navigate("/mobility")}
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    color: "var(--color-text)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  View Mobility History
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--color-text-muted)" }}>
              No active forensic suspect datasets have been ingested yet.
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

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
            padding: "16px 24px",
            borderRadius: 12,
            border: `1px solid rgba(108, 92, 231, 0.15)`,
            background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)`,
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 4 }}>
              AI Classification
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>
              {diagnosticReport.classification.replace(/_/g, " ")}
            </span>
          </div>
          <div style={{ width: 1, height: 36, background: "var(--color-border-subtle)" }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 4 }}>
              Risk Score
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: statusColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
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
        style={{ 
          padding: 0, 
          marginBottom: 24, 
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.75)", 
          border: "1px solid rgba(255,255,255,0.8)",
          borderTop: "3px solid #6c5ce7",
          boxShadow: "0 8px 30px rgba(0,0,0,0.03)"
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            background: "rgba(255,255,255,0.4)",
          }}
        >
          <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Sparkles size={13} color="#6c5ce7" />
            Intelligent Diagnostic Profile
          </h2>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>
            Confidence: <strong style={{ color: "var(--color-text)" }}>{diagnosticReport.confidence_level}</strong>
          </span>
        </div>

        {/* Card Body */}
        <div style={{ padding: "28px" }}>
          {/* Ring meter + description row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-7 mb-8">
            <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={statusColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${diagnosticReport.suspicion_score * 264} 264`}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: statusColor }}>
                  {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 4 }}>
                Anomaly Level Detected
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", marginBottom: 8 }}>
                {diagnosticReport.raw_heuristic_score} pts scored
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0, maxWidth: "90%" }}>
                Target triggers {diagnosticReport.triggered_indicators.length} behavioral heuristics warnings.
                Risk classification suggests an active telemetry signature.
              </p>
            </div>
          </div>

          {/* Quick stats — responsive grid layout */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Operational Span",   value: diagnosticReport.feature_vector.active_days || "N/A",           unit: "days",     color: "var(--color-accent)", icon: Activity },
              { label: "Hardware Fleet",     value: diagnosticReport.feature_vector.unique_imei_count || "N/A",    unit: "IMEIs",    color: "#a29bfe", icon: Smartphone },
              { label: "Financial Accounts", value: diagnosticReport.feature_vector.bank_sender_count || "N/A",    unit: "banks",    color: "var(--color-gold)", icon: Lock },
              { label: "UPI Aggregations",   value: diagnosticReport.feature_vector.upi_burst_sms_count || "0",   unit: "bindings", color: "var(--color-gold)", icon: Zap },
            ].map((s, idx) => (
              <motion.div
                key={s.label}
                className="stat-mini"
                whileHover={{ scale: 1.02, translateY: -2 }}
                style={{
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 10,
                  padding: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="stat-mini-label" style={{ color: "var(--color-text-subtle)" }}>{s.label}</span>
                  <s.icon size={14} color={s.color} style={{ opacity: 0.9 }} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="stat-mini-value" style={{ color: "var(--color-text)", fontSize: 26, fontWeight: 900 }}>{s.value}</span>
                  <span className="stat-mini-sub" style={{ fontSize: 12, color: "var(--color-text-subtle)" }}>{s.unit}</span>
                </div>
              </motion.div>
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
                      margin: 0,
                      marginBottom: 24,
                    }}
                  >
                    Behavioral Narrative Overview
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {narrativeBlocks.map((block, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                        <div style={{ 
                          width: 6, height: 6, borderRadius: "50%", 
                          background: "var(--color-accent)", opacity: 0.6, 
                          flexShrink: 0, transform: "translateY(-2px)" 
                        }} />
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "var(--color-text)", // Increased contrast
                            margin: 0,
                          }}
                        >
                          {highlightNarrativeText(block)}
                        </p>
                      </div>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", marginLeft: 8 }}>
                    <div style={{ position: "absolute", top: 16, bottom: 16, left: -1, width: 2, background: "rgba(0,0,0,0.06)", zIndex: 0 }} />
                    {diagnosticReport.operational_phases.map((phase, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          padding: "16px 20px 16px 28px",
                          zIndex: 1,
                        }}
                      >
                        <div style={{ position: "absolute", top: 22, left: -5, width: 10, height: 10, borderRadius: "50%", background: "#6c5ce7", boxShadow: "0 0 0 3px rgba(108, 92, 231, 0.2)" }} />
                        <div style={{
                          background: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(255,255,255,0.9)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                          borderRadius: 16,
                          padding: "20px",
                          backdropFilter: "blur(10px)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>{phase.phase}</span>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 800,
                                fontFamily: "var(--font-mono)",
                                background: "linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(162, 155, 254, 0.1))",
                                border: "1px solid rgba(108, 92, 231, 0.2)",
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
                              fontSize: 12,
                              color: "var(--color-text-muted)",
                              borderTop: "1px dashed var(--color-border-subtle)",
                              paddingTop: 12,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Smartphone size={14} color="var(--color-text-subtle)" />
                              IMEI: <span style={{ color: "#6c5ce7", fontWeight: 700 }}>{phase.imei || "Unknown"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-subtle)" }}>
                              <span style={{ background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: 4 }}>{phase.start}</span>
                              <span style={{ opacity: 0.4 }}>→</span>
                              <span style={{ background: "rgba(0,0,0,0.04)", padding: "2px 6px", borderRadius: 4 }}>{phase.end}</span>
                            </div>
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