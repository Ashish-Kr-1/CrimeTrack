import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Globe, Clock, MapPin, Activity, ChevronRight,
  Zap, Thermometer, Navigation, Timer, AlertTriangle, CheckCircle, Info
} from "lucide-react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline,
  CircleMarker, useMap, useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// ─── Tile URL Helper ─────────────────────────────────────────────────────────
function getTileUrl(style) {
  if (style === "dark")
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  if (style === "satellite")
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
}

// ─── Map Style Selector Overlay ───────────────────────────────────────────────
function MapStyleSelector({ mapStyle, setMapStyle }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 10,
        padding: 3,
        display: "flex",
        gap: 3,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "satellite", label: "Satellite" }].map((s) => (
        <button
          key={s.id}
          onClick={() => setMapStyle(s.id)}
          style={{
            padding: "4px 10px",
            borderRadius: 7,
            fontSize: 10,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: mapStyle === s.id ? "var(--primary)" : "transparent",
            color: mapStyle === s.id ? "#fff" : "#475569",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── Map Center Controller ────────────────────────────────────────────────────
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

// ─── Tile Layer Switcher ──────────────────────────────────────────────────────
function TileLayerSwitcher({ mapStyle }) {
  const map = useMap();
  useEffect(() => {}, [mapStyle, map]);
  return (
    <TileLayer url={getTileUrl(mapStyle)} attribution="" />
  );
}

// ─── Numbered Icon ────────────────────────────────────────────────────────────
const createNumberedIcon = (number, isSelected) =>
  L.divIcon({
    html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:9px;font-weight:700;font-family:monospace;border:2px solid ${isSelected ? "#fff" : "rgba(8,34,41,0.3)"};background:${isSelected ? "#e17055" : "#00e5ff"};color:#082229;box-shadow:${isSelected ? "0 0 10px rgba(225,112,85,0.6)" : "0 2px 4px rgba(0,0,0,0.4)"};">${number}</div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

// ─── Helper Functions ─────────────────────────────────────────────────────────
function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dParts = dateStr.split("/");
  if (dParts.length === 3) {
    const day = parseInt(dParts[0], 10);
    const month = parseInt(dParts[1], 10) - 1;
    const year = parseInt(dParts[2], 10);
    const tParts = timeStr.split(":");
    if (tParts.length >= 2) {
      const hours = parseInt(tParts[0], 10);
      const minutes = parseInt(tParts[1], 10);
      const seconds = tParts[2] ? parseInt(tParts[2], 10) : 0;
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(`${dateStr} ${timeStr}`);
  return isNaN(d.getTime()) ? null : d;
}

function parseCoords(str) {
  if (!str || str === "-" || str === "0") return null;
  const parts = str.split("/");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng];
  }
  return null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    const intersect = ((yi > point[0]) !== (yj > point[0])) &&
      (point[1] < (xj - xi) * (point[0] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── GeoFenceLayer (inside MapContainer) ─────────────────────────────────────
function GeoFenceLayer({ active, vertices, onAddVertex }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onAddVertex([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <>
      {vertices.map((v, i) => (
        <CircleMarker
          key={i}
          center={v}
          radius={6}
          pathOptions={{ color: "#f9ca24", fillColor: "#f9ca24", fillOpacity: 1, weight: 2 }}
        />
      ))}
      {vertices.length > 1 && (
        <Polyline
          positions={[...vertices, vertices[0]]}
          pathOptions={{ color: "#f9ca24", weight: 2, dashArray: "6 4", opacity: 0.9 }}
        />
      )}
    </>
  );
}

// ─── Tab 1: Path Tracker ──────────────────────────────────────────────────────
function PathTracker({ parsedHops, timelineHops, polylinePath, defaultCenter, mapStyle, setMapStyle, allGeoRecords }) {
  const [activeHop, setActiveHop] = useState(null);
  const [drawingFence, setDrawingFence] = useState(false);
  const [fenceVertices, setFenceVertices] = useState([]);
  const [fenceClosed, setFenceClosed] = useState(false);
  const [fenceResults, setFenceResults] = useState(null);

  useEffect(() => {
    if (parsedHops.length > 0 && !activeHop) {
      setActiveHop(parsedHops[parsedHops.length - 1]);
    }
  }, [parsedHops, activeHop]);

  const handleAddVertex = useCallback((pt) => {
    setFenceVertices((prev) => [...prev, pt]);
  }, []);

  const handleFinishFence = useCallback(() => {
    if (fenceVertices.length < 3) return;
    setFenceClosed(true);
    setDrawingFence(false);
    const inside = allGeoRecords.filter((rec) => {
      const coords = parseCoords(rec[9]);
      if (!coords) return false;
      return pointInPolygon(coords, fenceVertices);
    });
    setFenceResults(inside);
  }, [fenceVertices, allGeoRecords]);

  const handleClearFence = useCallback(() => {
    setFenceVertices([]);
    setFenceClosed(false);
    setFenceResults(null);
    setDrawingFence(false);
  }, []);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap" }}>
      {/* LEFT: Timeline */}
      <div
        className="glass-card"
        style={{ flex: "1 1 38%", minWidth: 320, maxWidth: 420, padding: 24, display: "flex", flexDirection: "column", height: 720 }}
      >
        <h2 style={{ margin: 0, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
          <Clock size={16} color="var(--primary)" />
          Chronological Location Timeline
        </h2>
        <p style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginBottom: 16, marginTop: 0 }}>
          Click a hop below to pan the map. Last 15 movements shown chronologically.
        </p>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8, paddingTop: 4 }}>
          {timelineHops.map((hop, idx) => {
            const isSelected = activeHop && activeHop.seqNumber === hop.seqNumber;
            return (
              <div
                key={idx}
                onClick={() => setActiveHop(hop)}
                style={{
                  marginBottom: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: isSelected ? "1px solid rgba(0,184,148,0.4)" : "1px solid transparent",
                  background: isSelected ? "rgba(0,184,148,0.08)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  gap: 14,
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                {idx !== timelineHops.length - 1 && (
                  <div style={{ position: "absolute", left: 27, top: 42, bottom: -14, width: 1, background: "var(--primary-transparent-18)" }} />
                )}
                <div style={{
                  zIndex: 1,
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  background: isSelected ? "#e17055" : "var(--primary-transparent-8)",
                  color: isSelected ? "#fff" : "var(--primary)",
                  border: `2px solid ${isSelected ? "#e17055" : "var(--primary-transparent-30)"}`,
                  boxShadow: isSelected ? "0 0 10px rgba(225,112,85,0.3)" : "none",
                }}>
                  {hop.seqNumber}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-subtle)" }}>
                      {hop.date} @ {hop.time}
                    </span>
                    {hop.seqNumber === parsedHops.length && (
                      <span style={{ background: "rgba(0,229,255,0.15)", color: "#00e5ff", fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        LATEST
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    CGI: {hop.cgi}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 10, color: "var(--color-text-subtle)", display: "flex", justifyContent: "space-between" }}>
                    <span>{hop.type} · {hop.service}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#00e5ff" }}>
                      Locate <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Map */}
      <div style={{ flex: "1 1 55%", minWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="glass-card" style={{ overflow: "hidden", borderRadius: 16 }}>
          {/* Header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              <MapPin size={16} color="#e17055" />
              Georeferencing Path Overlay
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {drawingFence && (
                <button
                  onClick={handleFinishFence}
                  style={{
                    padding: "4px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700,
                    background: "#f9ca24", color: "#1a1a2e", border: "none", cursor: "pointer",
                  }}
                >
                  Finish Fence
                </button>
              )}
              {(fenceVertices.length > 0 || fenceClosed) && (
                <button
                  onClick={handleClearFence}
                  style={{
                    padding: "4px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700,
                    background: "rgba(214,48,49,0.12)", color: "#d63031", border: "1px solid rgba(214,48,49,0.3)", cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => { if (fenceClosed) { handleClearFence(); } else { setDrawingFence((p) => !p); } }}
                style={{
                  padding: "4px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                  background: drawingFence ? "rgba(249,202,36,0.2)" : "var(--primary-transparent-8)",
                  color: drawingFence ? "#f9ca24" : "var(--primary)",
                  outline: drawingFence ? "1px solid #f9ca24" : "none",
                }}
              >
                {drawingFence ? "Drawing…" : "Draw Geo-fence"}
              </button>
              {activeHop && (
                <span style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>
                  Active: Hop #{activeHop.seqNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ height: 460, position: "relative" }}>
            {drawingFence && (
              <div style={{
                position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                zIndex: 1000, background: "rgba(249,202,36,0.92)", backdropFilter: "blur(8px)",
                borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#1a1a2e",
                pointerEvents: "none",
              }}>
                Click on map to add geo-fence vertices ({fenceVertices.length} added)
              </div>
            )}
            <MapStyleSelector mapStyle={mapStyle} setMapStyle={setMapStyle} />

            {parsedHops.length > 0 ? (
              <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                <TileLayer url={getTileUrl(mapStyle)} attribution="" />
                {polylinePath.length > 1 && (
                  <Polyline positions={polylinePath} pathOptions={{ color: "#3a7ca5", weight: 3, opacity: 0.6 }} />
                )}
                {parsedHops.map((hop, idx) => {
                  const isSelected = activeHop && activeHop.seqNumber === hop.seqNumber;
                  return (
                    <Marker key={idx} position={[hop.lat, hop.lng]} icon={createNumberedIcon(hop.seqNumber, isSelected)}>
                      <Popup>
                        <div style={{ fontSize: 11, color: "#082229", fontFamily: "sans-serif" }}>
                          <strong>Cell Hop #{hop.seqNumber}</strong><br />
                          CGI: {hop.cgi}<br />
                          Time: {hop.date} {hop.time}<br />
                          Type: {hop.type} | Service: {hop.service}<br />
                          Coords: {hop.lat.toFixed(5)}, {hop.lng.toFixed(5)}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                <GeoFenceLayer active={drawingFence} vertices={fenceVertices} onAddVertex={handleAddVertex} />
                {activeHop && <MapController center={[activeHop.lat, activeHop.lng]} />}
              </MapContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
                <MapPin size={28} color="#94a3b8" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 8 }}>GPS SIGNAL LOST</span>
                <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, textAlign: "center", maxWidth: 200 }}>
                  No valid cellular sector geolocation coordinates found.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Geo-fence Results */}
        {fenceClosed && fenceResults !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ background: fenceResults.length > 0 ? "rgba(214,48,49,0.1)" : "var(--primary-transparent-8)", borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: fenceResults.length > 0 ? "#d63031" : "var(--primary)" }}>
                  {fenceResults.length}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                  event{fenceResults.length !== 1 ? "s" : ""} inside geo-fence
                </div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)" }}>
                  {fenceResults.length === 0 ? "No CDR activity detected within the drawn perimeter." : "CDR events detected within the drawn geo-fence perimeter."}
                </div>
              </div>
            </div>
            {fenceResults.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.04)" }}>
                      {["Date", "Time", "CGI", "Type", "Service"].map((h) => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fenceResults.slice(0, 30).map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "5px 10px", color: "var(--color-text-subtle)" }}>{row[6] || "—"}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "monospace", color: "#ffffff" }}>{row[7] || "—"}</td>
                        <td style={{ padding: "5px 10px", fontFamily: "monospace", fontSize: 10, color: "var(--primary)" }}>{row[10] || "—"}</td>
                        <td style={{ padding: "5px 10px", color: "var(--color-text-subtle)" }}>{row[1] || "—"}</td>
                        <td style={{ padding: "5px 10px", color: "var(--color-text-subtle)" }}>{row[14] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fenceResults.length > 30 && (
                  <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.6)", padding: "8px 10px" }}>
                    … and {fenceResults.length - 30} more events not shown.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Dwell Heatmap ─────────────────────────────────────────────────────
function DwellHeatmap({ records, mapStyle, setMapStyle }) {
  const locationData = useMemo(() => {
    const counts = {};
    records.forEach((row) => {
      const loc = row[9];
      if (!loc || loc === "-" || loc === "0") return;
      counts[loc] = (counts[loc] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    return Object.entries(counts)
      .map(([loc, count]) => {
        const coords = parseCoords(loc);
        if (!coords) return null;
        const ratio = count / maxCount;
        let color = "#00b894";
        if (ratio >= 0.75) color = "#d63031";
        else if (ratio >= 0.50) color = "#e17055";
        else if (ratio >= 0.25) color = "#fdcb6e";
        const radius = 8 + ratio * 28;
        const fillOpacity = 0.3 + ratio * 0.5;
        return { coords, count, ratio, color, radius, fillOpacity };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const mapCenter = locationData.length > 0 ? locationData[0].coords : [22.5, 78.9];
  const maxCount = locationData.length > 0 ? locationData[0].count : 1;
  const estimatedDwell = (count) => Math.round((count * 3) / 60 * 10) / 10;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="glass-card" style={{ overflow: "hidden", borderRadius: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Thermometer size={16} color="#e17055" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>Dwell Heatmap — Location Frequency Overlay</span>
        </div>
        <div style={{ height: 460, position: "relative" }}>
          <MapStyleSelector mapStyle={mapStyle} setMapStyle={setMapStyle} />
          {/* Legend */}
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 1000,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Dwell Density</div>
            {[
              { color: "#00b894", label: "Occasional" },
              { color: "#fdcb6e", label: "Moderate" },
              { color: "#e17055", label: "Frequent" },
              { color: "#d63031", label: "Home Base" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>

          {locationData.length > 0 ? (
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer url={getTileUrl(mapStyle)} attribution="" />
              {locationData.map((d, i) => (
                <CircleMarker
                  key={i}
                  center={d.coords}
                  radius={d.radius}
                  pathOptions={{ color: d.color, fillColor: d.color, fillOpacity: d.fillOpacity, weight: 1.5 }}
                >
                  <Popup>
                    <div style={{ fontSize: 11, color: "#082229" }}>
                      <strong>~{estimatedDwell(d.count)} hours estimated dwell · {d.count} events</strong><br />
                      Coords: {d.coords[0].toFixed(5)}, {d.coords[1].toFixed(5)}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>No coordinate data available for heatmap.</span>
            </div>
          )}
        </div>
      </div>

      {/* Plain-English Card */}
      {locationData.length > 0 && (
        <div className="glass-card" style={{ padding: 20, borderLeft: "3px solid #e17055" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(225,112,85,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Info size={18} color="#e17055" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>Analyst Interpretation</div>
              <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: 1.65 }}>
                Your most visited location had <strong style={{ color: "#ffffff" }}>{maxCount} events</strong> — this is likely a home base or operational zone.
                The suspect spent an estimated <strong style={{ color: "#ffffff" }}>~{estimatedDwell(maxCount)} hours</strong> at this location based on call frequency patterns.
                {locationData.length > 1 && ` A total of ${locationData.length} unique geographic positions were logged across all CDR records.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Velocity Alerts ───────────────────────────────────────────────────
function VelocityAlerts({ records }) {
  const { alerts, stats } = useMemo(() => {
    const geoRows = records
      .map((row) => {
        const coords = parseCoords(row[9]);
        const dt = parseDateTime(row[6], row[7]);
        if (!coords || !dt) return null;
        return { coords, dt, cgi: row[10] || "Unknown", date: row[6], time: row[7] };
      })
      .filter(Boolean)
      .sort((a, b) => a.dt - b.dt);

    const found = [];
    let impossible = 0;
    let suspicious = 0;

    for (let i = 1; i < geoRows.length; i++) {
      const a = geoRows[i - 1];
      const b = geoRows[i];
      const [lat1, lon1] = a.coords;
      const [lat2, lon2] = b.coords;
      if (lat1 === lat2 && lon1 === lon2) continue;
      const distKm = haversineKm(lat1, lon1, lat2, lon2);
      const timeDiffMs = b.dt - a.dt;
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      if (timeDiffHours <= 0) continue;
      const speed = distKm / timeDiffHours;

      let severity = null;
      let label = "";
      let color = "";

      if (speed > 1000) {
        severity = "IMPOSSIBLE";
        label = "IMPOSSIBLE — Device Cloning / SIM Sharing";
        color = "#d63031";
        impossible++;
      } else if (speed > 300) {
        severity = "SUSPICIOUS";
        label = "SUSPICIOUS — Impossible Human Travel";
        color = "#e17055";
        suspicious++;
      } else if (speed > 100) {
        severity = "HIGH";
        label = "HIGH SPEED";
        color = "#fdcb6e";
      }

      if (severity) {
        found.push({
          severity, label, color,
          fromCgi: a.cgi, toCgi: b.cgi,
          distKm: distKm.toFixed(1),
          timeGapMin: (timeDiffHours * 60).toFixed(1),
          speed: speed.toFixed(1),
          fromTime: `${a.date} ${a.time}`,
          toTime: `${b.date} ${b.time}`,
        });
      }
    }

    return {
      alerts: found,
      stats: { total: geoRows.length - 1, impossible, suspicious },
    };
  }, [records]);

  const miniCards = [
    { label: "Total Transitions Checked", value: stats.total, color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
    { label: "Impossible Speed Events", value: stats.impossible, color: "#d63031", bg: "rgba(214,48,49,0.08)" },
    { label: "Suspicious Speed Events", value: stats.suspicious, color: "#e17055", bg: "rgba(225,112,85,0.08)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Mini KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {miniCards.map((c, i) => (
          <div key={i} className="glass-card" style={{ padding: "18px 20px", borderLeft: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, fontFamily: "monospace" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", marginTop: 4, fontWeight: 600 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <CheckCircle size={32} color="#00b894" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>No Velocity Anomalies Detected</span>
          <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", textAlign: "center", maxWidth: 400 }}>
            All consecutive location transitions fall within physically plausible travel speeds. No device cloning indicators found.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card"
              style={{ padding: 18, borderLeft: `3px solid ${alert.color}` }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 9,
                    fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                    background: `${alert.color}20`, color: alert.color, fontFamily: "monospace",
                  }}>
                    {alert.severity}
                  </span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: alert.color, marginTop: 6 }}>{alert.label}</div>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", fontFamily: "monospace", marginBottom: 4 }}>
                    FROM <span style={{ color: "#ffffff", fontWeight: 700 }}>{alert.fromCgi}</span>
                    {" → "}
                    TO <span style={{ color: "#ffffff", fontWeight: 700 }}>{alert.toCgi}</span>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[
                      { label: "Distance", val: `${alert.distKm} km` },
                      { label: "Time Gap", val: `${alert.timeGapMin} min` },
                      { label: "Speed", val: `${alert.speed} km/h`, highlight: true },
                    ].map((d) => (
                      <div key={d.label}>
                        <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", fontWeight: 700 }}>{d.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: d.highlight ? alert.color : "#ffffff", fontFamily: "monospace" }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255, 255, 255, 0.5)" }}>
                    {alert.fromTime} <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>→</span> {alert.toTime}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Plain-English Explanation */}
      <div className="glass-card" style={{ padding: 20, borderLeft: "3px solid #2563eb" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Info size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>How Velocity Analysis Works</div>
            <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: 1.7 }}>
              If two towers are 500 km apart but the same SIM was used within 5 minutes, that means the physical SIM cannot have moved at that speed.
              This is a strong indicator of <strong style={{ color: "#d63031" }}>device cloning</strong> or{" "}
              <strong style={{ color: "#e17055" }}>SIM sharing across multiple handsets</strong>. Speeds above 1,000 km/h are physically impossible
              for ground-based movement and point definitively to parallel SIM usage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Time Clusters ─────────────────────────────────────────────────────
function TimeClusters({ records, mapStyle, setMapStyle }) {
  const PERIODS = [
    { label: "Night", range: "22:00–06:00", color: "#3a7ca5", min: 22, max: 6 },
    { label: "Morning", range: "06:00–12:00", color: "#fdcb6e", min: 6, max: 12 },
    { label: "Afternoon", range: "12:00–18:00", color: "#0984e3", min: 12, max: 18 },
    { label: "Evening", range: "18:00–22:00", color: "#e17055", min: 18, max: 22 },
  ];

  const getPeriod = (hour) => {
    if (hour >= 22 || hour < 6) return "Night";
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 18) return "Afternoon";
    return "Evening";
  };

  const { markers, counts, total } = useMemo(() => {
    const pts = [];
    const cnt = { Night: 0, Morning: 0, Afternoon: 0, Evening: 0 };
    let tot = 0;

    records.forEach((row) => {
      const coords = parseCoords(row[9]);
      const dt = parseDateTime(row[6], row[7]);
      if (!coords || !dt) return;
      const hour = dt.getHours();
      const period = getPeriod(hour);
      const color = PERIODS.find((p) => p.label === period)?.color || "#3a7ca5";
      pts.push({ coords, period, color });
      cnt[period]++;
      tot++;
    });

    return { markers: pts, counts: cnt, total: tot };
  }, [records]);

  const mapCenter = markers.length > 0 ? markers[0].coords : [22.5, 78.9];
  const nightPct = total > 0 ? Math.round((counts.Night / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="glass-card" style={{ overflow: "hidden", borderRadius: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8 }}>
          <Timer size={16} color="#3a7ca5" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>Time-of-Day Activity Clusters</span>
        </div>
        <div style={{ height: 460, position: "relative" }}>
          <MapStyleSelector mapStyle={mapStyle} setMapStyle={setMapStyle} />
          {/* Legend */}
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 1000,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Time Period</div>
            {PERIODS.map((p) => (
              <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>{p.label} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({p.range})</span></span>
              </div>
            ))}
          </div>

          {markers.length > 0 ? (
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer url={getTileUrl(mapStyle)} attribution="" />
              {markers.map((m, i) => (
                <CircleMarker
                  key={i}
                  center={m.coords}
                  radius={8}
                  pathOptions={{ color: m.color, fillColor: m.color, fillOpacity: 0.7, weight: 1 }}
                >
                  <Popup>
                    <div style={{ fontSize: 11, color: "#082229" }}>
                      <strong>{m.period}</strong><br />
                      {m.coords[0].toFixed(5)}, {m.coords[1].toFixed(5)}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>No coordinate data available.</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {PERIODS.map((p) => {
          const count = counts[p.label];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={p.label} className="glass-card" style={{ padding: "16px 18px", borderLeft: `3px solid ${p.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>{p.label}</span>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.6)", marginBottom: 6, fontWeight: 600 }}>{p.range}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: p.color, fontFamily: "monospace" }}>{count}</div>
              <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}>events · <strong style={{ color: p.color }}>{pct}%</strong> of total</div>
              {/* Bar */}
              <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: "rgba(0,0,0,0.07)" }}>
                <div style={{ height: "100%", borderRadius: 2, background: p.color, width: `${pct}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict */}
      <div className="glass-card" style={{ padding: 20, borderLeft: "3px solid #3a7ca5" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(58,124,165,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={18} color="#3a7ca5" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>Analyst Verdict</div>
            <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: 1.7 }}>
              {nightPct > 30 ? (
                <>
                  <strong style={{ color: "#d63031" }}>Over {nightPct}% of activity happens at night</strong> — unusual for a normal user and consistent with criminal operation patterns.
                  Night-time activity spikes (10 PM–6 AM) in CDR data are a hallmark of operatives attempting to reduce surveillance exposure during off-hours.
                </>
              ) : (
                <>
                  Night-time activity accounts for <strong style={{ color: "#3a7ca5" }}>{nightPct}%</strong> of total events.
                  This falls within normal behavioral parameters for a standard user.
                  {counts.Morning > counts.Afternoon && " Activity is heaviest in morning hours, suggesting a routine daytime usage pattern."}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Mobility() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const [tab, setTab] = useState("path");
  const [mapStyle, setMapStyle] = useState("light");

  const validRecords = useMemo(() => records.filter((row) => row && row.length > 10 && row[6] && row[7]), [records]);

  const towerCounts = useMemo(() => {
    const counts = {};
    validRecords.forEach((row) => { if (row[10]) counts[row[10]] = (counts[row[10]] || 0) + 1; });
    return counts;
  }, [validRecords]);

  const topTowers = useMemo(() => Object.entries(towerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5), [towerCounts]);
  const uniqueTowers = Object.keys(towerCounts).length;
  const mostUsedTower = topTowers.length > 0 ? topTowers[0][0] : "Unknown";

  const parsedHops = useMemo(() => {
    const lastHops = validRecords.slice(-15);
    let seq = 1;
    return lastHops.map((row) => {
      const coords = parseCoords(row[9]);
      if (!coords) return null;
      return {
        lat: coords[0], lng: coords[1],
        cgi: row[10] || "Unknown",
        date: row[6] || "Unknown",
        time: row[7] || "Unknown",
        service: row[14] || "Unknown",
        type: row[1] || "Unknown",
        seqNumber: seq++,
      };
    }).filter(Boolean);
  }, [validRecords]);

  const timelineHops = useMemo(() => [...parsedHops].reverse(), [parsedHops]);
  const polylinePath = useMemo(() => parsedHops.map((h) => [h.lat, h.lng]), [parsedHops]);
  const defaultCenter = useMemo(() => {
    if (parsedHops.length > 0) return [parsedHops[parsedHops.length - 1].lat, parsedHops[parsedHops.length - 1].lng];
    return [22.5697, 88.3697];
  }, [parsedHops]);

  const lastActivity = useMemo(() => {
    if (parsedHops.length > 0) {
      const latest = parsedHops[parsedHops.length - 1];
      return `${latest.date} ${latest.time}`;
    }
    return "Unknown";
  }, [parsedHops]);

  const kpis = [
    { icon: Radio, label: "Unique Towers", value: uniqueTowers, color: "var(--primary)" },
    { icon: Globe, label: "Primary Cell Tower", value: mostUsedTower, isMonospace: true, color: "#e17055" },
    { icon: Clock, label: "Last Logged Activity", value: lastActivity, color: "var(--primary)" },
  ];

  const TABS = [
    { id: "path", label: "Path Tracker", icon: Navigation },
    { id: "dwell", label: "Dwell Heatmap", icon: Thermometer },
    { id: "velocity", label: "Velocity Alerts", icon: Zap },
    { id: "clusters", label: "Time Clusters", icon: Timer },
  ];

  return (
    <motion.div
      className="page-container theme-mobility"
      initial="initial"
      animate="animate"
      style={{ display: "flex", flexDirection: "column", gap: 28 }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} style={{ marginBottom: 0 }}>
        <h1 style={{ margin: 0, marginBottom: 4, fontSize: 28, fontWeight: 800, color: "#ffffff" }}>
          Mobility Tracker &amp; Georeferencing
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
          Chronological spatial mapping, dwell analysis, velocity forensics, and time-pattern clustering from cellular CDR.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "rgba(255, 255, 255, 0.6)", fontSize: 13 }}>
          No records loaded. Please upload a dataset in the Ingestion Center to trace cellular mobility.
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <motion.div
            variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.012 }}
                className="glass-card"
                style={{ padding: 22, display: "flex", alignItems: "center", gap: 18 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "var(--primary-transparent-18)",
                  border: "1px solid var(--primary-transparent-30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <kpi.icon size={20} color={kpi.color} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.6)" }}>{kpi.label}</div>
                  <div style={{
                    marginTop: 2,
                    fontFamily: kpi.isMonospace ? "monospace" : undefined,
                    fontSize: kpi.isMonospace ? 12 : 20,
                    fontWeight: 800,
                    color: kpi.isMonospace ? "#e17055" : "#ffffff",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {kpi.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tab Bar */}
          <motion.div variants={fadeUp}>
            <div
              style={{
                display: "flex", gap: 4, padding: 4,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
                borderRadius: 14, border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                width: "fit-content",
              }}
            >
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 7,
                      transition: "all 0.18s ease",
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "rgba(255, 255, 255, 0.6)",
                      boxShadow: active ? "0 2px 10px var(--primary-transparent-30)" : "none",
                    }}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {tab === "path" && (
                <PathTracker
                  parsedHops={parsedHops}
                  timelineHops={timelineHops}
                  polylinePath={polylinePath}
                  defaultCenter={defaultCenter}
                  mapStyle={mapStyle}
                  setMapStyle={setMapStyle}
                  allGeoRecords={records}
                />
              )}
              {tab === "dwell" && (
                <DwellHeatmap records={records} mapStyle={mapStyle} setMapStyle={setMapStyle} />
              )}
              {tab === "velocity" && (
                <VelocityAlerts records={records} />
              )}
              {tab === "clusters" && (
                <TimeClusters records={records} mapStyle={mapStyle} setMapStyle={setMapStyle} />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

export default Mobility;
