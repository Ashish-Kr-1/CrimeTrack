import { useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  FileText,
  Users,
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
import ForceGraph2D from "react-force-graph-2d";
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 2, 5

  const graphContainerRef = useRef();
  const graphRef = useRef();
  const mapContainerRef = useRef();
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-300);
      graphRef.current.d3Force("link").distance(100);
    }
  }, [rightTab, diagnosticReport]);

  // Handle Resize for Force Graph
  useEffect(() => {
    if (!graphContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setGraphDimensions({
          width: entry.contentRect.width || 600,
          height: 400
        });
      }
    });
    resizeObserver.observe(graphContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [rightTab]);

  // Replay timeline events
  const replayEvents = useMemo(() => {
    return diagnosticReport?.replay_events || [];
  }, [diagnosticReport]);

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
      <div className="mx-auto max-w-[900px] pt-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card flex flex-col items-center gap-5 px-10 py-16"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border"
            style={{
              backgroundColor: "rgba(59, 95, 171, 0.06)",
              borderColor: "rgba(59, 95, 171, 0.18)",
              boxShadow: "0 0 35px rgba(59, 95, 171, 0.08)",
            }}
          >
            <ShieldAlert size={36} color="#3b5fab" strokeWidth={1.8} />
          </div>
          <h2 className="text-2xl font-bold text-text">
            Forensic Intelligence Engine Offline
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-text-muted">
            No active suspect datasets loaded. Upload a standard Call Detail Record
            (CDR) file in the Ingestion Center to generate behavioral narrative profiles,
            explainable threat matrices, and link diagrams.
          </p>
          <button
            id="goto-upload"
            onClick={() => navigate("/upload")}
            className="mt-2 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
            style={{
              backgroundColor: "#3b5fab",
              boxShadow: "0 4px 18px rgba(59, 95, 171, 0.35)",
            }}
          >
            Go to Upload Center
            <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  const isMule = diagnosticReport.classification === "HIGHLY_SUSPECT_FINANCIAL_MULE";
  const statusColor = isMule ? "#c93c3c" : "#c18833";
  const statusGlow = isMule ? "rgba(201, 60, 60, 0.12)" : "rgba(193, 136, 51, 0.12)";

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

  // Custom node canvas renderer for Force Graph
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const size = node.val || 10;
    const fontSize = Math.max(9 / globalScale, 4.5);

    // Node outer glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
    if (node.type === "target") {
      ctx.fillStyle = "rgba(59, 95, 171, 0.2)";
    } else if (node.type === "bank") {
      ctx.fillStyle = "rgba(193, 136, 51, 0.18)";
    } else if (node.type === "imei") {
      ctx.fillStyle = "rgba(139, 92, 246, 0.18)";
    } else if (node.type === "location") {
      ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
    } else {
      ctx.fillStyle = "rgba(45, 138, 94, 0.18)";
    }
    ctx.fill();

    // Node core circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    if (node.type === "target") {
      ctx.fillStyle = "#3b5fab";
    } else if (node.type === "bank") {
      ctx.fillStyle = "#c18833";
    } else if (node.type === "imei") {
      ctx.fillStyle = "#8b5cf6";
    } else if (node.type === "location") {
      ctx.fillStyle = "#ef4444";
    } else {
      ctx.fillStyle = "#2d8a5e";
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(233, 241, 248, 0.25)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Text label
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e9f1f8";
    ctx.font = `${node.type === "target" ? "bold " : ""}${fontSize}px "SF Pro", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(node.label, node.x, node.y + size + fontSize + 2.5);
  }, []);

  const linkCanvasObject = useCallback((link, ctx) => {
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = "rgba(90, 111, 148, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  return (
    <motion.div
      className="mx-auto w-full max-w-[1400px] pb-10"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Target Suspect Info Header */}
      <motion.div variants={fadeUp} className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Investigative Workspace
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: statusGlow,
                color: statusColor,
                border: `1px solid ${statusColor}35`,
              }}
            >
              Target active
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Telecom telemetry dossier on target ID:{" "}
            <strong className="text-text font-mono text-[13px]">{diagnosticReport.target_phone}</strong>
          </p>
        </div>

        {/* Global Verdict Card */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-dark-surface/40 px-4 py-2.5">
          <div className="text-right">
            <span className="text-[10px] font-bold text-text-subtle uppercase block tracking-wider">
              AI CLASSIFICATION
            </span>
            <span className="text-xs font-bold text-text">
              {diagnosticReport.classification.replace(/_/g, " ")}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-border" />
          <div className="text-center">
            <span className="text-[10px] font-bold text-text-subtle uppercase block tracking-wider">
              RISK RATE
            </span>
            <span className="text-xs font-bold font-mono" style={{ color: statusColor }}>
              {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Multi-Panel HUD Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ========================================================
            LEFT COLUMN: AI INVESTIGATOR ASSISTANT (40% width)
            ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Dossier Overview Card */}
          <motion.div variants={fadeUp} className="glass-card p-5 relative overflow-hidden">
            <div className="scan-overlay pointer-events-none absolute inset-0" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-text-muted flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                INTELLIGENT DIAGNOSTIC PROFILE
              </h2>
              <span className="text-xs font-mono text-text-subtle">
                Confidence: <strong className="text-text">{diagnosticReport.confidence_level}</strong>
              </span>
            </div>

            {/* Suspect Ring Meter */}
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1e2e52" strokeWidth="8" />
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
                <div className="text-xs font-semibold text-text-subtle">ANOMALY LEVEL DETECTED</div>
                <div className="text-base font-bold text-text mt-0.5">
                  {diagnosticReport.raw_heuristic_score} pts scored
                </div>
                <p className="text-[11px] leading-relaxed text-text-muted mt-1">
                  Target triggers {diagnosticReport.triggered_indicators.length} behavioral heuristics warnings.
                  Risk classification suggests an active telemetry signature.
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI Workspace Panel Tabs */}
          <motion.div variants={fadeUp} className="glass-card flex-1 flex flex-col min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex border-b border-border bg-dark-surface/30 px-3 pt-2 gap-1.5">
              <button
                onClick={() => setLeftTab("narrative")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                  leftTab === "narrative"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                Behavioral Narrative
              </button>
              <button
                onClick={() => setLeftTab("heuristics")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                  leftTab === "heuristics"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                Threat Matrix
              </button>
              <button
                onClick={() => setLeftTab("recommendations")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                  leftTab === "recommendations"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                Next Actions
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 pb-12 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {leftTab === "narrative" && (
                  <motion.div
                    key="narrative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Diagnostic Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark/40 border border-border/60 rounded-xl p-3 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">Operational Span</span>
                        <div className="text-sm font-bold text-text mt-0.5 flex items-baseline gap-1">
                          <span className="text-lg text-accent">{diagnosticReport.feature_vector.active_days || "N/A"}</span>
                          <span className="text-xs text-text-muted">days</span>
                        </div>
                      </div>
                      <div className="bg-dark/40 border border-border/60 rounded-xl p-3 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">Hardware Fleet</span>
                        <div className="text-sm font-bold text-text mt-0.5 flex items-baseline gap-1">
                          <span className="text-lg text-purple-400 font-mono">{diagnosticReport.feature_vector.unique_imei_count || "N/A"}</span>
                          <span className="text-xs text-text-muted">IMEIs</span>
                        </div>
                      </div>
                      <div className="bg-dark/40 border border-border/60 rounded-xl p-3 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">Financial Accounts</span>
                        <div className="text-sm font-bold text-text mt-0.5 flex items-baseline gap-1">
                          <span className="text-lg text-gold font-mono">{diagnosticReport.feature_vector.bank_sender_count || "N/A"}</span>
                          <span className="text-xs text-text-muted">banks</span>
                        </div>
                      </div>
                      <div className="bg-dark/40 border border-border/60 rounded-xl p-3 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">UPI Aggregations</span>
                        <div className="text-sm font-bold text-text mt-0.5 flex items-baseline gap-1">
                          <span className="text-lg text-gold font-mono">{diagnosticReport.feature_vector.upi_burst_sms_count || "0"}</span>
                          <span className="text-xs text-text-muted">bindings</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">
                        Behavioral Narrative Overview
                      </h3>
                      <p className="text-[13px] leading-relaxed text-text-muted font-sans whitespace-pre-line">
                        {highlightNarrativeText(diagnosticReport.behavioral_narrative)}
                      </p>
                    </div>

                    <div className="border-t border-border/60 pt-4">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                        Operational Lifecycle Phases
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {diagnosticReport.operational_phases.map((phase, idx) => (
                          <div
                            key={idx}
                            className="bg-dark/40 border border-border/80 rounded-lg p-3 text-[12px]"
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span className="text-text">{phase.phase}</span>
                              <span className="text-text-subtle font-mono text-[10px]">
                                {phase.event_count} logs
                              </span>
                            </div>
                            <div className="text-text-muted font-mono text-[10.5px]">
                              IMEI: <span style={{ color: "#3b5fab" }}>{phase.imei || "Unknown"}</span>
                            </div>
                            <div className="text-[10px] text-text-subtle mt-1 flex justify-between">
                              <span>From: {phase.start}</span>
                              <span>To: {phase.end}</span>
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
                    className="flex flex-col gap-3"
                  >
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                      Triggered Threat Heuristics
                    </h3>
                    {diagnosticReport.triggered_indicators.map((rule, idx) => {
                      const rColor =
                        rule.severity === "CRITICAL"
                          ? "#c93c3c"
                          : rule.severity === "HIGH"
                            ? "#c18833"
                            : "#3b5fab";
                      const rBg =
                        rule.severity === "CRITICAL"
                          ? "rgba(201, 60, 60, 0.08)"
                          : rule.severity === "HIGH"
                            ? "rgba(193, 136, 51, 0.08)"
                            : "rgba(59, 95, 171, 0.08)";
                      return (
                        <div
                          key={idx}
                          className="border border-border bg-dark/30 rounded-lg p-3 text-left"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-text">
                              {rule.code.replace(/_/g, " ")}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[9px] font-bold font-mono"
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
                    className="flex flex-col gap-4"
                  >
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                      Actionable Next Investigation Steps
                    </h3>
                    {diagnosticReport.automated_recommendations.map((rec) => {
                      const isCritical = rec.urgency === "CRITICAL";
                      const isHigh = rec.urgency === "HIGH";
                      const badgeColor = isCritical ? "#c93c3c" : isHigh ? "#c18833" : "#3b5fab";
                      const badgeBg = isCritical
                        ? "rgba(201, 60, 60, 0.08)"
                        : isHigh
                          ? "rgba(193, 136, 51, 0.08)"
                          : "rgba(59, 95, 171, 0.08)";
                      return (
                        <div
                          key={rec.id}
                          className="border border-border/80 bg-dark/40 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
                          style={{ borderLeft: `4px solid ${badgeColor}` }}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="text-xs font-bold text-text">{rec.title}</h4>
                              <span
                                className="rounded px-1.5 py-0.5 text-[8.5px] font-bold font-mono"
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

                          <div className="flex justify-between items-center border-t border-border/40 pt-2.5 mt-0.5">
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
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Visualizer Container */}
          <motion.div variants={fadeUp} className="glass-card flex-1 flex flex-col overflow-hidden">
            {/* Viz Panel Tabs */}
            <div className="flex border-b border-border bg-dark-surface/40 px-3 pt-2 gap-1.5">
              <button
                onClick={() => setRightTab("replay")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
                  rightTab === "replay"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                <Activity size={13} />
                Chronological Replay
              </button>
              <button
                onClick={() => setRightTab("network")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
                  rightTab === "network"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                <Users size={13} />
                Relationship Network
              </button>
              <button
                onClick={() => setRightTab("heatmap")}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center gap-2 ${
                  rightTab === "heatmap"
                    ? "border-border bg-dark-surface text-accent font-extrabold"
                    : "border-transparent text-text-muted hover:text-text hover:bg-dark-elevated/20"
                }`}
              >
                <MapPin size={13} />
                Geospatial Heatmap
              </button>
            </div>

            {/* Tab Workspace */}
            <div className="flex-1 p-5 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {/* 1. CHRONOLOGICAL REPLAY PLAYER */}
                {rightTab === "replay" && (
                  <motion.div
                    key="replay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col gap-4 overflow-hidden"
                  >
                    {/* Media Controller Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-dark/60 border border-border/80 rounded-xl p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveEventIndex(0);
                            setIsPlaying(false);
                          }}
                          className="p-1.5 rounded hover:bg-dark-elevated text-text-muted hover:text-text transition-colors"
                          title="Rewind to Start"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => setActiveEventIndex((p) => Math.max(0, p - 1))}
                          className="p-1.5 rounded hover:bg-dark-elevated text-text-muted hover:text-text transition-colors"
                          title="Previous Event"
                        >
                          <SkipBack size={14} />
                        </button>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white hover:brightness-110 transition-all shadow"
                          title={isPlaying ? "Pause Playback" : "Play Timeline"}
                        >
                          {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" className="ml-0.5" />}
                        </button>
                        <button
                          onClick={() => setActiveEventIndex((p) => Math.min(replayEvents.length - 1, p + 1))}
                          className="p-1.5 rounded hover:bg-dark-elevated text-text-muted hover:text-text transition-colors"
                          title="Next Event"
                        >
                          <SkipForward size={14} />
                        </button>
                      </div>

                      {/* Playback speed selector */}
                      <div className="flex items-center gap-1">
                        {[0.5, 1, 2, 5].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              playbackSpeed === speed
                                ? "bg-accent/20 text-accent border border-accent/40"
                                : "border border-transparent text-text-subtle hover:text-text"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>

                      {/* Scrub Slider */}
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={replayEvents.length - 1}
                          value={activeEventIndex}
                          onChange={(e) => setActiveEventIndex(parseInt(e.target.value))}
                          className="flex-1 accent-accent cursor-pointer h-1.5 bg-dark border border-border rounded-full"
                        />
                        <span className="text-[11px] font-mono text-text-muted shrink-0 min-w-[65px] text-right">
                          {activeEventIndex + 1} / {replayEvents.length}
                        </span>
                      </div>
                    </div>

                    {/* Left/Right Split: HUD and Map on Top; Logging Stream at Bottom */}
                    <div className="flex-1 grid gap-4 md:grid-cols-12 overflow-hidden">
                      {/* Live HUD Diagnostics Screen (5 cols) */}
                      <div className="md:col-span-5 flex flex-col gap-3 bg-dark-surface/30 border border-border/60 rounded-xl p-4 overflow-y-auto">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                          <Terminal size={12} className="text-accent" />
                          TELEMETRY MONITOR HUD
                        </h4>

                        <div className="flex flex-col gap-2 mt-1">
                          <div className="border-b border-border/40 pb-2">
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">TIMESTAMP</span>
                            <span className="text-xs font-mono font-semibold text-text">{activeEvent?.timeLabel || "N/A"}</span>
                          </div>

                          <div className="border-b border-border/40 pb-2">
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">ACTIVE HARDWARE (IMEI)</span>
                            <span className="text-xs font-mono font-semibold text-accent">{activeEvent?.imei || "N/A"}</span>
                          </div>

                          <div className="border-b border-border/40 pb-2">
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">CELL ANCHOR CGI</span>
                            <span className="text-xs font-mono font-semibold text-gold truncate block">{activeEvent?.cgi || "N/A"}</span>
                          </div>

                          <div className="border-b border-border/40 pb-2">
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">ROAMING CIRCLE</span>
                            <span className="text-xs font-semibold text-text">{activeEvent?.roam || "N/A"}</span>
                          </div>

                          <div className="border-b border-border/40 pb-2">
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">COUNTERPARTY (B-PARTY)</span>
                            <span className="text-xs font-mono font-semibold text-text">{activeEvent?.bParty || "N/A"}</span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-text-subtle uppercase block">LOG ANALYSIS</span>
                            <p className="text-[11px] leading-relaxed text-text-muted mt-0.5">{activeEvent?.details || "No events processed."}</p>
                          </div>
                        </div>
                      </div>

                      {/* Mini Replay Tracking Map (7 cols) */}
                      <div ref={mapContainerRef} className="md:col-span-7 rounded-xl border border-border/60 overflow-hidden relative" style={{ height: 260 }}>
                        {activeCoordinates ? (
                          <MapContainer
                            center={activeCoordinates}
                            zoom={12}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}
                            zoomControl={false}
                          >
                            <TileLayer
                              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                              attribution=""
                            />
                            {/* Path trail */}
                            {historicalTrail.length > 1 && (
                              <Polyline positions={historicalTrail} pathOptions={{ color: "#3b5fab", weight: 3, opacity: 0.5 }} />
                            )}
                            {/* Current active location marker */}
                            <CircleMarker
                              center={activeCoordinates}
                              radius={10}
                              pathOptions={{
                                color: "#c18833",
                                fillColor: "#c18833",
                                fillOpacity: 0.8,
                                weight: 2
                              }}
                            >
                              <Popup>
                                <div className="text-[11px] font-sans" style={{ color: "#0c162d" }}>
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
                    </div>

                    {/* Scrolling Running Logs (Bottom) */}
                    <div className="h-[180px] border border-border bg-dark/50 rounded-xl overflow-hidden flex flex-col">
                      <div className="bg-dark border-b border-border px-4 py-2 text-[10px] font-bold text-text-subtle uppercase tracking-wider flex items-center justify-between">
                        <span>Event Stream Log</span>
                        <span className="font-mono text-accent">Active Log ID: {activeEvent?.id}</span>
                      </div>

                      <div ref={logListRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        <div className="flex flex-col gap-1">
                          {replayEvents.map((evt, idx) => {
                            const isActive = idx === activeEventIndex;
                            let evtColor = "#3b5fab";
                            if (evt.type === "UPI_REG" || evt.type === "FINANCIAL") evtColor = "#c18833";
                            if (evt.type === "VOICE") evtColor = "#2d8a5e";

                            return (
                              <div
                                key={evt.id}
                                ref={(el) => (logItemRefs.current[idx] = el)}
                                onClick={() => {
                                  setActiveEventIndex(idx);
                                  setIsPlaying(false);
                                }}
                                className={`flex items-center gap-3 p-2 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-accent/15 border border-accent/40"
                                    : "border border-transparent hover:bg-dark-elevated text-text-muted"
                                }`}
                              >
                                <span className="shrink-0 w-[120px] text-text-subtle text-[10.5px]">
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
                                <span className="flex-1 truncate text-text">
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

                {/* 2. INTERACTIVE RELATIONSHIP NETWORK */}
                {rightTab === "network" && (
                  <motion.div
                    key="network"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="bg-dark/40 border border-border/80 rounded-xl p-3.5 mb-3 flex items-center justify-between text-xs text-text-muted">
                      <span>Interactive Link Matrix showing Target SIM usage overlaps. Double-click to zoom. Drag to arrange nodes.</span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Suspect</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Device</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-600" /> Bank</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Tower</span>
                      </div>
                    </div>
                    <div ref={graphContainerRef} className="flex-1 rounded-xl border border-border overflow-hidden bg-dark" style={{ height: 450 }}>
                      <ForceGraph2D
                        ref={graphRef}
                        graphData={diagnosticReport.relationship_graph}
                        width={graphDimensions.width}
                        height={450}
                        backgroundColor="#0c162d"
                        nodeCanvasObject={nodeCanvasObject}
                        linkCanvasObject={linkCanvasObject}
                        cooldownTicks={60}
                        d3AlphaDecay={0.04}
                        d3VelocityDecay={0.3}
                        enableZoomInteraction={true}
                        enablePanInteraction={true}
                        nodeLabel={(node) => {
                          return `<div style="background:#111d38;border:1px solid #1e2e52;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#e9f1f8;font-size:12px;">
                            <strong style="color:#3b5fab;text-transform:uppercase;">${node.type} Node</strong><br/>
                            Details: ${node.info || node.id}<br/>
                            ${node.count ? `Interactions: ${node.count}` : ""}
                          </div>`;
                        }}
                        linkLabel={(link) => {
                          return `<div style="background:#111d38;border:1px solid #1e2e52;padding:6px 10px;border-radius:6px;font-family:sans-serif;color:#e9f1f8;font-size:11px;">
                            Relationship: <strong>${link.label || link.type}</strong>
                          </div>`;
                        }}
                      />
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
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="bg-dark/40 border border-border/80 rounded-xl p-3.5 mb-3 flex items-center justify-between text-xs text-text-muted">
                      <span>Full Geospatial plotting of cell sectors visited by target SIM card.</span>
                      <span className="font-mono text-accent">Total Locations Tracked: {allCoordinates.length} nodes</span>
                    </div>

                    <div className="flex-1 rounded-xl border border-border overflow-hidden" style={{ height: 450 }}>
                      {allCoordinates.length > 0 ? (
                        <MapContainer
                          center={allCoordinates[0]}
                          zoom={10}
                          scrollWheelZoom={true}
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={true}
                        >
                          <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution=""
                          />
                          {replayEvents.map((e, idx) => {
                            if (!e.coordinates) return null;
                            let evtColor = "#3b5fab";
                            if (e.type === "UPI_REG" || e.type === "FINANCIAL") evtColor = "#c18833";
                            if (e.type === "VOICE") evtColor = "#2d8a5e";

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
                                  <div className="text-xs font-sans text-dark font-medium" style={{ color: "#0c162d" }}>
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
                        <div className="h-full w-full bg-dark/90 flex flex-col items-center justify-center text-center p-4">
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