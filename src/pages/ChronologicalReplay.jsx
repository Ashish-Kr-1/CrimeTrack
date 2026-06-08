import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  MapPin,
  Terminal,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Activity,
  Zap,
  Radio,
  Clock,
  Map,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapController({ center, fitBoundsCoords, viewMode }) {
  const map = useMap();
  useEffect(() => {
    if (viewMode === "fit" && fitBoundsCoords && fitBoundsCoords.length > 0) {
      map.fitBounds(fitBoundsCoords, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    } else if (viewMode === "center" && center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, fitBoundsCoords, viewMode, map]);
  return null;
}

function ChronologicalReplay() {
  const { diagnosticReport } = useContext(CDRContext);
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showLog, setShowLog] = useState(true);
  const [viewMode, setViewMode] = useState("center");

  const logListRef = useRef();
  const logItemRefs = useRef({});

  const replayEvents = useMemo(
    () => diagnosticReport?.replay_events || [],
    [diagnosticReport]
  );

  const allCoordinates = useMemo(() => {
    return replayEvents.map((e) => e.coordinates).filter(Boolean);
  }, [replayEvents]);

  // Playback timer
  useEffect(() => {
    let timer = null;
    if (isPlaying && replayEvents.length > 0) {
      const intervalMs = Math.max(10, 1000 / playbackSpeed);
      timer = setInterval(() => {
        setViewMode("center");
        setActiveEventIndex((prev) => {
          if (prev < replayEvents.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, intervalMs);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isPlaying, playbackSpeed, replayEvents]);

  // Auto-scroll log to active item
  useEffect(() => {
    const activeItem = logItemRefs.current[activeEventIndex];
    if (activeItem && logListRef.current) {
      logListRef.current.scrollTo({
        top: activeItem.offsetTop - logListRef.current.offsetTop - 80,
        behavior: "smooth",
      });
    }
  }, [activeEventIndex]);

  /* ── Empty State ── */
  if (!diagnosticReport || replayEvents.length === 0) {
    return (
      <div className="page-container theme-dashboard" style={{ paddingTop: 40 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card empty-state"
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <div className="empty-state-icon">
            <Activity size={32} color="var(--color-accent)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No Replay Data Available</div>
          <p className="empty-state-body">
            Upload a CDR file to visualize the full chronological spatiotemporal
            replay of target telemetry events.
          </p>
          <button
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

  const activeEvent = replayEvents[activeEventIndex];
  const activeCoordinates = activeEvent?.coordinates;
  const isMule = diagnosticReport.classification === "HIGHLY_SUSPECT_FINANCIAL_MULE";
  const statusColor = isMule ? "#d63031" : "#6c5ce7";

  const historicalTrail = useMemo(() => {
    return replayEvents
      .slice(0, activeEventIndex + 1)
      .map((e) => e.coordinates)
      .filter(Boolean);
  }, [replayEvents, activeEventIndex]);

  const progress = replayEvents.length > 0
    ? ((activeEventIndex + 1) / replayEvents.length) * 100
    : 0;

  // Anomaly count so far
  const anomaliesSoFar = replayEvents
    .slice(0, activeEventIndex + 1)
    .filter((e) => e.isAnomaly).length;

  return (
    <motion.div
      className="theme-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
        minHeight: 0,
        gap: 0,
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(108, 92, 231, 0.12)",
              border: "1px solid rgba(108, 92, 231, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Activity size={18} color="#6c5ce7" strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--color-text)",
                lineHeight: 1.2,
              }}
            >
              Chronological Replay
            </h1>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              Target:{" "}
              <strong
                style={{
                  color: "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {diagnosticReport.target_phone}
              </strong>{" "}
              ·{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {replayEvents.length} events
              </span>
            </p>
          </div>
        </div>

        {/* Right-side meta pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: `${statusColor}15`,
              color: statusColor,
              border: `1px solid ${statusColor}35`,
            }}
          >
            {diagnosticReport.classification.replace(/_/g, " ")}
          </span>
          <span
            style={{
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              background: "rgba(214, 48, 49, 0.1)",
              color: "#d63031",
              border: "1px solid rgba(214, 48, 49, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <AlertTriangle size={9} />
            {anomaliesSoFar} anomalies detected
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          height: 3,
          background: "rgba(0,0,0,0.06)",
          borderRadius: 2,
          marginBottom: 12,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, #6c5ce7, #a29bfe)`,
            borderRadius: 2,
            transition: "width 0.2s ease",
          }}
        />
      </div>

      {/* ── Transport Controls Bar ── */}
      <div
        className="glass-card"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 20px",
          marginBottom: 16,
          flexShrink: 0,
          borderRadius: 14,
        }}
      >
        {/* Transport buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            className="icon-btn"
            style={{ padding: 7 }}
            title="Rewind"
            onClick={() => {
              setActiveEventIndex(0);
              setIsPlaying(false);
              setViewMode("center");
            }}
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="icon-btn"
            style={{ padding: 7 }}
            title="Prev"
            onClick={() => {
              setActiveEventIndex((p) => Math.max(0, p - 1));
              setViewMode("center");
            }}
          >
            <SkipBack size={13} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => {
              setViewMode("center");
              setIsPlaying(!isPlaying);
            }}
            title={isPlaying ? "Pause" : "Play"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: isPlaying
                ? "var(--color-danger, #d63031)"
                : "var(--color-accent, #6c5ce7)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: isPlaying
                ? "0 2px 12px rgba(214,48,49,0.35)"
                : "0 2px 12px rgba(108,92,231,0.35)",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <Pause size={14} fill="white" color="white" />
            ) : (
              <Play
                size={14}
                fill="white"
                color="white"
                style={{ marginLeft: 1 }}
              />
            )}
          </button>

          <button
            className="icon-btn"
            style={{ padding: 7 }}
            title="Next"
            onClick={() => {
              setActiveEventIndex((p) =>
                Math.min(replayEvents.length - 1, p + 1)
              );
              setViewMode("center");
            }}
          >
            <SkipForward size={13} />
          </button>
        </div>

        {/* Speed buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-subtle)",
              marginRight: 4,
            }}
          >
            Speed
          </span>
          {[1, 5, 10, 20, 50, 100].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              style={{
                padding: "4px 9px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background:
                  playbackSpeed === speed
                    ? "rgba(108, 92, 231, 0.12)"
                    : "transparent",
                color:
                  playbackSpeed === speed
                    ? "#6c5ce7"
                    : "var(--color-text-subtle)",
                border: `1px solid ${
                  playbackSpeed === speed
                    ? "rgba(108, 92, 231, 0.35)"
                    : "transparent"
                }`,
              }}
            >
              {speed}×
            </button>
          ))}
        </div>

        {/* Scrub slider */}
        <div
          style={{
            flex: 1,
            minWidth: 160,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <input
            type="range"
            min={0}
            max={replayEvents.length - 1}
            value={activeEventIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveEventIndex(parseInt(e.target.value));
              setViewMode("center");
            }}
            style={{
              flex: 1,
              accentColor: "#6c5ce7",
              cursor: "pointer",
              height: 4,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              flexShrink: 0,
              minWidth: 70,
              textAlign: "right",
            }}
          >
            {activeEventIndex + 1} / {replayEvents.length}
          </span>
        </div>

        {/* Finalize Path Button */}
        <button
          onClick={() => {
            setIsPlaying(false);
            setActiveEventIndex(replayEvents.length - 1);
            setViewMode("fit");
          }}
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            border: viewMode === "fit" ? "1px solid rgba(108,92,231,0.4)" : "1px solid var(--color-border)",
            background: viewMode === "fit"
              ? "rgba(108,92,231,0.12)"
              : "rgba(255,255,255,0.5)",
            color: viewMode === "fit" ? "#6c5ce7" : "var(--color-text-muted)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
        >
          <Map size={11} />
          Finalize Path
        </button>

        {/* Toggle event log */}
        <button
          onClick={() => setShowLog((v) => !v)}
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: showLog ? "rgba(108,92,231,0.08)" : "rgba(255,255,255,0.5)",
            color: showLog ? "#6c5ce7" : "var(--color-text-muted)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Terminal size={11} />
          {showLog ? "Hide Log" : "Show Log"}
        </button>
      </div>

      {/* ── Main Content: Map + Event Log ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 16,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ═══ BIG MAP PANEL ═══ */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
            minHeight: 0,
          }}
        >
          {activeCoordinates ? (
            <MapContainer
              center={activeCoordinates}
              zoom={11}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution=""
              />

              {/* Historical trail polyline */}
              {historicalTrail.length > 1 && (
                <Polyline
                  positions={historicalTrail}
                  pathOptions={{
                    color: "#6c5ce7",
                    weight: 3,
                    opacity: 0.55,
                    dashArray: activeEvent?.isAnomaly ? "6 4" : null,
                  }}
                />
              )}

              {/* Past positions (faded) */}
              {historicalTrail.slice(0, -1).map((coord, i) => (
                <CircleMarker
                  key={i}
                  center={coord}
                  radius={5}
                  pathOptions={{
                    color: "#a29bfe",
                    fillColor: "#a29bfe",
                    fillOpacity: 0.35,
                    weight: 1,
                  }}
                />
              ))}

              {/* Active position marker */}
              <CircleMarker
                center={activeCoordinates}
                radius={14}
                pathOptions={{
                  color: activeEvent?.isAnomaly ? "#d63031" : "#6c5ce7",
                  fillColor: activeEvent?.isAnomaly ? "#ff6b4a" : "#6c5ce7",
                  fillOpacity: 0.9,
                  weight: 3,
                }}
              >
                <Popup>
                  <div
                    style={{ fontFamily: "var(--font-sans)", color: "#082229", fontSize: 12 }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      Event #{activeEventIndex + 1}
                    </strong>
                    <br />
                    <span style={{ color: "#636e72" }}>{activeEvent?.timeLabel}</span>
                    <br />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {activeCoordinates[0].toFixed(5)}, {activeCoordinates[1].toFixed(5)}
                    </span>
                    <br />
                    <span style={{ color: activeEvent?.isAnomaly ? "#d63031" : "#6c5ce7", fontWeight: 600 }}>
                      {activeEvent?.type}
                    </span>
                    {activeEvent?.isAnomaly && (
                      <>
                        <br />
                        <span style={{ color: "#d63031", fontWeight: 700, fontSize: 10 }}>
                          ⚠ FLAGGED ANOMALY
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </CircleMarker>

              <MapController center={activeCoordinates} fitBoundsCoords={allCoordinates} viewMode={viewMode} />
            </MapContainer>
          ) : (
            <div
              style={{
                height: "100%",
                background: "rgba(245, 240, 235, 0.9)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <MapPin size={32} style={{ color: "var(--color-text-subtle)", opacity: 0.6 }} className="animate-pulse" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-subtle)" }}>
                  GPS SIGNAL LOST
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 4, maxWidth: 200 }}>
                  Event #{activeEventIndex + 1} has no georeferencing data.
                </div>
              </div>
            </div>
          )}

          {/* ── Floating Telemetry HUD (bottom-left of map) ── */}
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 16,
              padding: "16px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
              minWidth: 280,
              maxWidth: 360,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Terminal size={13} color="#6c5ce7" />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-text-subtle)",
                }}
              >
                Telemetry Monitor
              </span>
              {activeEvent?.isAnomaly && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "rgba(214, 48, 49, 0.1)",
                    color: "#d63031",
                    border: "1px solid rgba(214, 48, 49, 0.3)",
                    borderRadius: 99,
                    padding: "2px 8px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={8} />
                  ANOMALY
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              {[
                { label: "Timestamp", value: activeEvent?.timeLabel || "N/A", color: "var(--color-text)" },
                { label: "Type", value: activeEvent?.type || "N/A", color: activeEvent?.isAnomaly ? "#d63031" : "#6c5ce7" },
                { label: "IMEI", value: activeEvent?.imei || "N/A", color: "#6c5ce7", mono: true },
                { label: "Roaming Circle", value: activeEvent?.roam || "N/A", color: "var(--color-text)" },
                { label: "Cell CGI", value: activeEvent?.cgi || "N/A", color: "var(--color-gold)", mono: true },
                { label: "Counterparty", value: activeEvent?.bParty || "N/A", color: "var(--color-text)", mono: true },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-text-subtle)",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
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

            {activeEvent?.details && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-subtle)",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  Log Analysis
                </span>
                <p
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "var(--color-text-muted)",
                    margin: 0,
                  }}
                >
                  {activeEvent.details}
                </p>
              </div>
            )}
          </div>

          {/* ── Floating Event Counter (top-right of map) ── */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 12,
              padding: "10px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              display: "flex",
              gap: 20,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 3 }}>Event</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#6c5ce7", letterSpacing: "-0.04em" }}>
                {activeEventIndex + 1}
              </div>
            </div>
            <div style={{ width: 1, background: "var(--color-border)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 3 }}>Total</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-text)", letterSpacing: "-0.04em" }}>
                {replayEvents.length}
              </div>
            </div>
            <div style={{ width: 1, background: "var(--color-border)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 3 }}>Flags</div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#d63031", letterSpacing: "-0.04em" }}>
                {anomaliesSoFar}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ EVENT STREAM LOG PANEL ═══ */}
        <AnimatePresence>
          {showLog && (
            <motion.div
              key="event-log"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 340 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              <div
                className="glass-card"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderRadius: 20,
                }}
              >
                {/* Log Header */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Radio size={12} color="#6c5ce7" />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>
                      Event Stream Log
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#6c5ce7" }}>
                    Active: #{activeEvent?.id}
                  </span>
                </div>

                {/* Log Items */}
                <div
                  ref={logListRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 0,
                  }}
                  className="scrollbar-thin"
                >
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
                          setViewMode("center");
                        }}
                        style={{
                          padding: "12px 20px",
                          borderBottom: "1px solid var(--color-border-subtle)",
                          cursor: "pointer",
                          background: isActive
                            ? "rgba(108, 92, 231, 0.08)"
                            : "transparent",
                          transition: "background 0.15s ease",
                          borderLeft: isActive
                            ? "3px solid #6c5ce7"
                            : "3px solid transparent",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                              color: "var(--color-text-subtle)",
                              minWidth: 24,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              fontFamily: "sans-serif",
                              letterSpacing: "0.06em",
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: `${evtColor}15`,
                              color: evtColor,
                              border: `1px solid ${evtColor}25`,
                            }}
                          >
                            {evt.type}
                          </span>
                          {evt.isAnomaly && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#d63031",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <AlertTriangle size={9} />
                              FLAG
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-text-muted)",
                            marginBottom: 3,
                          }}
                        >
                          {evt.timeLabel}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text)",
                            fontWeight: isActive ? 600 : 400,
                            lineHeight: 1.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {evt.details}
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
    </motion.div>
  );
}

export default ChronologicalReplay;
