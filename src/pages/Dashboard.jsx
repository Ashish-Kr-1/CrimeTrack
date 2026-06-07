import { useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
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
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to center Leaflet map on coordinate changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

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
  const [rightTab, setRightTab] = useState("replay"); // replay, network, heatmap

  // Chronological Replay Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1, 2, 5, 10, 20

  const mapContainerRef = useRef();

  // Replay timeline events
  const replayEvents = useMemo(() => {
    return diagnosticReport?.replay_events || [];
  }, [diagnosticReport]);

  const narrativeBlocks = useMemo(() => {
    if (!diagnosticReport?.behavioral_narrative) return [];
    return diagnosticReport.behavioral_narrative
      .split(/\.\s+/)
      .filter(Boolean)
      .map((s) => s.trim() + (s.endsWith(".") ? "" : "."));
  }, [diagnosticReport?.behavioral_narrative]);

  // Replay timer loop
  useEffect(() => {
    let timer = null;
    if (isPlaying && replayEvents.length > 0) {
      const intervalMs = Math.max(200, 1000 / playbackSpeed);
      timer = setInterval(() => {
        setActiveEventIndex((prev) => {
          if (prev < replayEvents.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, replayEvents]);

  // Auto-scroll event log list to active event
  const logListRef = useRef();
  const logItemRefs = useRef({});
  useEffect(() => {
    const activeItem = logItemRefs.current[activeEventIndex];
    if (activeItem && logListRef.current) {
      logListRef.current.scrollTo({
        top: activeItem.offsetTop - logListRef.current.offsetTop - 120,
        behavior: "smooth"
      });
    }
  }, [activeEventIndex]);

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

  // Replay coordinates details
  const activeEvent = replayEvents[activeEventIndex];
  const activeCoordinates = activeEvent?.coordinates;
  const historicalTrail = useMemo(() => {
    return replayEvents
      .slice(0, activeEventIndex + 1)
      .map(e => e.coordinates)
      .filter(Boolean);
  }, [replayEvents, activeEventIndex]);

  // Overall geospatial coordinates for heatmap
  const allCoordinates = useMemo(() => {
    return replayEvents.map(e => e.coordinates).filter(Boolean);
  }, [replayEvents]);



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
      <div className="grid lg:grid-cols-12 lg:min-h-0" style={{ gap: 24 }}>
        {/* ========================================================
            LEFT COLUMN: AI INVESTIGATOR ASSISTANT (40% width)
            ======================================================== */}
        <div className="lg:col-span-5 flex flex-col lg:min-h-0" style={{ gap: 24 }}>
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

        {/* ========================================================
            RIGHT COLUMN: VISUAL ANALYTICS STUDIO (60% width)
            ======================================================== */}
        <div className="lg:col-span-7 flex flex-col lg:min-h-0" style={{ gap: 24 }}>
          {/* Main Visualizer Container */}
          <motion.div
            variants={fadeUp}
            className="glass-card flex-1 flex flex-col overflow-hidden h-[560px] lg:h-auto lg:min-h-0"
          >
            {/* Viz Panel Tabs */}
            <div className="tab-bar">
              {[
                { id: "replay",  icon: Activity, label: "Chronological Replay" },
                { id: "heatmap", icon: MapPin,   label: "Geospatial Heatmap" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`tab-item${rightTab === tab.id ? " active" : ""}`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col lg:overflow-visible">
              <AnimatePresence mode="wait">
                {/* 1. CHRONOLOGICAL REPLAY PLAYER */}
                {rightTab === "replay" && (
                  <motion.div
                    key="replay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col overflow-hidden lg:overflow-visible"
                  >
                    {/* Media Controller Bar */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "var(--color-bg-subtle)",
                        borderBottom: "1px solid var(--color-border)",
                        padding: "10px 18px",
                        flexShrink: 0,
                      }}
                    >
                      {/* Transport controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {[
                          { action: () => { setActiveEventIndex(0); setIsPlaying(false); }, Icon: RotateCcw, title: "Rewind" },
                          { action: () => setActiveEventIndex((p) => Math.max(0, p - 1)),          Icon: SkipBack,   title: "Prev" },
                        ].map(({ action, Icon, title }) => (
                          <button key={title} onClick={action} title={title} className="icon-btn" style={{ padding: 7 }}>
                            <Icon size={13} />
                          </button>
                        ))}
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          title={isPlaying ? "Pause" : "Play"}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--color-accent)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 12px var(--color-accent-glow)",
                            transition: "var(--transition-base)",
                            flexShrink: 0,
                          }}
                        >
                          {isPlaying
                            ? <Pause size={13} fill="var(--color-dark)" color="var(--color-dark)" />
                            : <Play  size={13} fill="var(--color-dark)" color="var(--color-dark)" style={{ marginLeft: 1 }} />}
                        </button>
                        <button onClick={() => setActiveEventIndex((p) => Math.min(replayEvents.length - 1, p + 1))} title="Next" className="icon-btn" style={{ padding: 7 }}>
                          <SkipForward size={13} />
                        </button>
                      </div>

                      {/* Speed buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {[1, 2, 5, 10, 20].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "var(--transition-fast)",
                              background: playbackSpeed === speed ? "var(--color-accent-dim)" : "transparent",
                              color: playbackSpeed === speed ? "var(--color-accent)" : "var(--color-text-subtle)",
                              border: `1px solid ${playbackSpeed === speed ? "rgba(0,212,245,0.35)" : "transparent"}`,
                            }}
                          >
                            {speed}×
                          </button>
                        ))}
                      </div>

                      {/* Scrub Slider */}
                      <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="range"
                          min={0}
                          max={replayEvents.length - 1}
                          value={activeEventIndex}
                          onChange={(e) => setActiveEventIndex(parseInt(e.target.value))}
                          style={{ flex: 1, accentColor: "var(--color-accent)", cursor: "pointer", height: 4 }}
                        />
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", flexShrink: 0, minWidth: 70, textAlign: "right" }}>
                          {activeEventIndex + 1} / {replayEvents.length}
                        </span>
                      </div>
                    </div>

                    {/* Map on Top; HUD at the Bottom */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 lg:overflow-visible">
                      {/* Mini Replay Tracking Map */}
                      <div ref={mapContainerRef} className="rounded-xl border border-border overflow-hidden relative shrink-0" style={{ height: 400 }}>
                        {activeCoordinates ? (
                          <MapContainer
                            center={activeCoordinates}
                            zoom={12}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                          >
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                              attribution=""
                            />
                            {/* Path trail */}
                            {historicalTrail.length > 1 && (
                              <Polyline positions={historicalTrail} pathOptions={{ color: "#00e5ff", weight: 3, opacity: 0.5 }} />
                            )}
                            {/* Current active location marker */}
                            <CircleMarker
                              center={activeCoordinates}
                              radius={10}
                              pathOptions={{
                                color: "#ff6b4a",
                                fillColor: "#ff6b4a",
                                fillOpacity: 0.8,
                                weight: 2
                              }}
                            >
                              <Popup>
                                <div className="text-[11px] font-sans" style={{ color: "#082229" }}>
                                  <strong>Active Coordinates</strong><br />
                                  {activeCoordinates[0].toFixed(5)}, {activeCoordinates[1].toFixed(5)}
                                </div>
                              </Popup>
                            </CircleMarker>
                            <MapController center={activeCoordinates} />
                          </MapContainer>
                        ) : (
                          <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center text-center p-4">
                            <MapPin size={28} className="text-text-subtle mb-2 animate-pulse" />
                            <span className="text-xs font-bold text-text-subtle">GPS SIGNAL LOST</span>
                            <span className="text-[10px] text-text-subtle/80 mt-1 max-w-[180px]">
                              Active event contains no cell sector georeferencing coordinates.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Live HUD Diagnostics */}
                      <div
                        style={{
                          background: "var(--color-surface-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 14,
                          padding: "24px",
                          flexShrink: 0,
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                          <Terminal size={14} color="var(--primary, #6c5ce7)" />
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>
                            Telemetry Monitor
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5" style={{ gap: "20px 24px" }}>
                          {[
                            { label: "Timestamp",      value: activeEvent?.timeLabel || "N/A",  color: "var(--color-text)" },
                            { label: "IMEI",            value: activeEvent?.imei     || "N/A",  color: "var(--color-accent)" },
                            { label: "Cell CGI",        value: activeEvent?.cgi      || "N/A",  color: "var(--color-gold)",   mono: true },
                            { label: "Roaming Circle",  value: activeEvent?.roam     || "N/A",  color: "var(--color-text)" },
                            { label: "Counterparty",    value: activeEvent?.bParty   || "N/A",  color: "var(--color-text)",  mono: true },
                          ].map((item) => (
                            <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>
                                {item.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: item.color,
                                  fontFamily: item.mono ? "var(--font-mono)" : "inherit",
                                  wordBreak: "break-all",
                                  lineHeight: 1.4,
                                }}
                                title={item.value}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--color-border-subtle)" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", display: "block", marginBottom: 6 }}>
                            Log Analysis
                          </span>
                          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-text-muted)" }}>
                            {activeEvent?.details || "No events processed."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Scrolling Running Logs (Bottom) */}
                    <div className="h-[280px] mt-6 border-t border-border bg-white/20 flex flex-col shrink-0">
                      <div className="bg-white/30 border-b border-border px-6 py-3.5 text-[10px] font-bold text-text-subtle uppercase tracking-wider flex items-center justify-between">
                        <span>Event Stream Log</span>
                        <span className="font-mono text-[10px]" style={{ color: "var(--primary, #6c5ce7)" }}>Active Log ID: {activeEvent?.id}</span>
                      </div>

                      <div ref={logListRef} className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                        <div className="flex flex-col">
                          {replayEvents.map((evt, idx) => {
                            const isActive = idx === activeEventIndex;
                            let evtColor = "#6c5ce7";
                            if (evt.type === "UPI_REG" || evt.type === "FINANCIAL") evtColor = "#d63031";
                            if (evt.type === "VOICE") evtColor = "#636e72";

                            return (
                              <div
                                key={evt.id}
                                ref={(el) => (logItemRefs.current[idx] = el)}
                                onClick={() => {
                                  setActiveEventIndex(idx);
                                  setIsPlaying(false);
                                }}
                                className={`flex items-center gap-6 border-b border-border-subtle transition-all cursor-pointer`}
                                style={{
                                  padding: "16px 16px",
                                  backgroundColor: isActive ? "rgba(108, 92, 231, 0.10)" : "transparent",
                                }}
                              >
                                <span className="shrink-0 w-[140px] text-text-subtle text-[11px] font-mono">
                                  {evt.timeLabel}
                                </span>
                                <span
                                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold font-sans tracking-wide text-center"
                                  style={{
                                    backgroundColor: `${evtColor}15`,
                                    color: evtColor,
                                    border: `1px solid ${evtColor}25`,
                                    width: 80
                                  }}
                                >
                                  {evt.type}
                                </span>
                                <span className="flex-1 truncate text-text text-[11.5px]" style={{ fontWeight: isActive ? 600 : 400 }}>
                                  {evt.details}
                                </span>
                                {evt.isAnomaly && (
                                  <span className="text-[10px] text-danger font-sans font-bold flex items-center gap-0.5">
                                    <AlertTriangle size={10} />
                                    FLAG
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}



                {/* 3. GEOSPATIAL ACTIVITY MAP */}
                {rightTab === "heatmap" && (
                  <motion.div
                    key="heatmap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col overflow-hidden p-5 lg:overflow-visible"
                  >
                    <div className="bg-white/40 border border-border rounded-xl p-3.5 mb-3 flex items-center justify-between text-xs text-text-muted">
                      <span>Full Geospatial plotting of cell sectors visited by target SIM card.</span>
                      <span className="font-mono" style={{ color: "var(--primary, #6c5ce7)" }}>Total Locations Tracked: {allCoordinates.length} nodes</span>
                    </div>

                    <div className="flex-1 rounded-xl border border-border overflow-hidden" style={{ height: 550 }}>
                      {allCoordinates.length > 0 ? (
                        <MapContainer
                          center={allCoordinates[0]}
                          zoom={10}
                          scrollWheelZoom={true}
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={true}
                        >
                          <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution=""
                          />
                          {replayEvents.map((e, idx) => {
                            if (!e.coordinates) return null;
                            let evtColor = "#6c5ce7";
                            if (e.type === "UPI_REG" || e.type === "FINANCIAL") evtColor = "#d63031";
                            if (e.type === "VOICE") evtColor = "#636e72";

                            return (
                              <CircleMarker
                                key={idx}
                                center={e.coordinates}
                                radius={7}
                                pathOptions={{
                                  color: evtColor,
                                  fillColor: evtColor,
                                  fillOpacity: 0.6,
                                  weight: 1
                                }}
                              >
                                <Popup>
                                  <div className="text-xs font-sans text-dark font-medium" style={{ color: "#082229" }}>
                                    <strong>{e.timeLabel}</strong>
                                    <br />Type: {e.type}
                                    <br />CGI: {e.cgi}
                                    <br />Details: {e.details}
                                  </div>
                                </Popup>
                              </CircleMarker>
                            );
                          })}
                        </MapContainer>
                      ) : (
                        <div className="h-full w-full bg-white/60 flex flex-col items-center justify-center text-center p-4">
                          <MapPin size={36} className="text-text-subtle mb-2" />
                          <span className="text-sm font-bold text-text-subtle">NO LOCATION COORDINATES LOADED</span>
                        </div>
                      )}
                    </div>
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