import { useContext, useState, useMemo, useCallback } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Layers, Smartphone, AlertTriangle, X, Filter,
  ChevronRight, Radio, Clock, Search, ExternalLink, ShieldAlert,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const UPI_GATEWAY_NUMBERS = new Set([
  "9667691414","8433976037","7506894867","9071234567",
  "52263","56161020","9220592205","9222692226",
]);
const BANK_KEYWORDS = ["BK","BOI","BOB","BUP","IND","PNB","IOB","UPI","PAYTM",
  "AXIS","HDFC","ICICI","UNION","ADHAAR","SBI","PSBANK","CKYCR","GRAMIN"];

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function cleanRaw(v) {
  if (!v) return "";
  let s = v.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) s = s.slice(1,-1);
  return s.trim();
}

function parseCoords(str) {
  if (!str || str === "-" || str === "0") return null;
  const p = str.split("/");
  if (p.length === 2) {
    const lat = parseFloat(p[0]), lng = parseFloat(p[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return { lat, lng };
  }
  return null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const p = dateStr.split("/");
  if (p.length === 3) return new Date(+p[2], +p[1]-1, +p[0]);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function parseHour(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  return parts.length >= 1 ? parseInt(parts[0]) : null;
}

function isAnomalous(row) {
  const bParty = cleanRaw(row[3]);
  const timeStr = cleanRaw(row[7]);
  const hour = parseHour(timeStr);
  if (UPI_GATEWAY_NUMBERS.has(bParty)) return true;
  if (BANK_KEYWORDS.some(kw => bParty.toUpperCase().includes(kw))) return true;
  if (hour !== null && (hour >= 22 || hour < 6)) return true;
  return false;
}

function anomalyColor(ratio) {
  if (ratio < 0.10) return "#00b894";
  if (ratio < 0.30) return "#fdcb6e";
  if (ratio < 0.60) return "#e17055";
  return "#d63031";
}

function anomalyLabel(ratio) {
  if (ratio < 0.10) return "Clean";
  if (ratio < 0.30) return "Low Risk";
  if (ratio < 0.60) return "Suspicious";
  return "High Risk";
}

function timePeriod(hour) {
  if (hour === null) return "Unknown";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  if (hour >= 18 && hour < 22) return "Evening";
  return "Night";
}

/* ── Zoom tracker (must be inside MapContainer) ── */
function ZoomTracker({ onZoom }) {
  useMapEvents({ zoom(e) { onZoom(e.target.getZoom()); } });
  return null;
}

/* ── Tower Detail Panel ── */
function TowerDetailPanel({ location, onClose }) {
  if (!location) return null;
  const { lat, lng, events, anomalyRatio, totalEvents } = location;
  const topContacts = useMemo(() => {
    const counts = {};
    events.forEach(e => {
      const b = cleanRaw(e[3]);
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [events]);
  const timeDist = useMemo(() => {
    const d = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    events.forEach(e => {
      const h = parseHour(cleanRaw(e[7]));
      d[timePeriod(h)] = (d[timePeriod(h)] || 0) + 1;
    });
    return d;
  }, [events]);
  const color = anomalyColor(anomalyRatio);
  const label = anomalyLabel(anomalyRatio);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)" }}
      onClick={onClose}>
      <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 400, background: "var(--color-bg)", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>Tower Analysis</span>
            <h2 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)", margin: "3px 0 0" }}>{lat.toFixed(5)}, {lng.toFixed(5)}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: `${color}12`, color, border: `1px solid ${color}30` }}>{label}</span>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={12} /></button>
          </div>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "Total Events", val: totalEvents }, { label: "Anomalous", val: `${Math.round(anomalyRatio*100)}%` }].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)" }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", marginTop: 2 }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* Time distribution */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)", marginBottom: 10 }}>Activity by Time of Day</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Morning","#fdcb6e"], ["Afternoon","#0984e3"], ["Evening","#e17055"], ["Night","#3a7ca5"]].map(([period, c]) => {
                const cnt = timeDist[period] || 0;
                const pct = totalEvents ? (cnt/totalEvents*100).toFixed(0) : 0;
                return (
                  <div key={period} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 70, fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600 }}>{period}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: c, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ width: 40, fontSize: 10, fontWeight: 700, color: c, textAlign: "right" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Top contacts */}
          {topContacts.length > 0 && (
            <div>
              <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)", marginBottom: 10 }}>Top Contacts at this Tower</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {topContacts.map(([phone, count]) => {
                  const isUpi = UPI_GATEWAY_NUMBERS.has(phone);
                  const isBank = BANK_KEYWORDS.some(kw => phone.toUpperCase().includes(kw));
                  const flagColor = isUpi ? "#d63031" : isBank ? "#e17055" : "var(--color-text)";
                  return (
                    <div key={phone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.4)", border: `1px solid ${isUpi||isBank ? "#d6303115" : "var(--color-border)"}`, borderRadius: 8, borderLeft: `3px solid ${flagColor}` }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: flagColor }}>{phone}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {(isUpi||isBank) && <span style={{ fontSize: 8, fontWeight: 800, color: "#d63031", textTransform: "uppercase" }}>⚠ {isUpi ? "UPI" : "Bank"}</span>}
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)" }}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Analyst recommendation */}
          <div style={{ background: anomalyRatio > 0.3 ? "rgba(214,48,49,0.05)" : "rgba(0,184,148,0.05)", border: `1px solid ${anomalyRatio > 0.3 ? "rgba(214,48,49,0.2)" : "rgba(0,184,148,0.2)"}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: anomalyRatio > 0.3 ? "#d63031" : "#00b894", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldAlert size={11} /> Analyst Recommendation
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--color-text-muted)", margin: 0 }}>
              {anomalyRatio > 0.3
                ? "This tower had many suspicious events. Consider requesting a tower dump for this CGI from the telecom operator to identify other devices that connected."
                : "This tower shows normal activity levels. No immediate action required."}
            </p>
          </div>
          {/* Event list */}
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)", marginBottom: 10 }}>All Events at this Location</h3>
            <div style={{ maxHeight: 240, overflowY: "auto", background: "rgba(255,255,255,0.4)", border: "1px solid var(--color-border)", borderRadius: 10 }}>
              {events.slice(0, 50).map((e, i) => {
                const isFlag = isAnomalous(e);
                return (
                  <div key={i} style={{ padding: "8px 12px", borderBottom: i < events.length-1 ? "1px solid var(--color-border-subtle)" : "none", display: "flex", gap: 10, alignItems: "flex-start", background: isFlag ? "rgba(214,48,49,0.03)" : "transparent" }}>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", flexShrink: 0, marginTop: 1 }}>{cleanRaw(e[6])} {cleanRaw(e[7])?.slice(0,5)}</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: isFlag ? "#d63031" : "var(--color-text-subtle)", fontWeight: isFlag ? 700 : 400 }}>{cleanRaw(e[3]) || "—"}</span>
                    {isFlag && <span style={{ fontSize: 8, fontWeight: 800, color: "#d63031", flexShrink: 0 }}>⚠</span>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Google Maps link */}
          <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#0984e3", textDecoration: "none" }}>
            <ExternalLink size={12} /> View on Google Maps
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GEO INTELLIGENCE
══════════════════════════════════════════════════════════════════════════ */
function GeoIntelligence() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const [mapStyle, setMapStyle]               = useState("dark");
  const [dateFrom, setDateFrom]               = useState("");
  const [dateTo, setDateTo]                   = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clusterMode, setClusterMode]         = useState(false);
  const [colocCGI, setColocCGI]               = useState("");
  const [mapZoom, setMapZoom]                 = useState(9);

  /* ── Date range auto-detect ── */
  const dateRange = useMemo(() => {
    let min = null, max = null;
    records.forEach(row => {
      const d = parseDate(cleanRaw(row[6]));
      if (!d) return;
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    });
    return { min, max };
  }, [records]);

  const toISO = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";

  /* ── Filtered records by date range ── */
  const filteredRecords = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    return records.filter(row => {
      if (!from && !to) return true;
      const d = parseDate(cleanRaw(row[6]));
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);

  /* ── Location data ── */
  const locationData = useMemo(() => {
    const map = {};
    filteredRecords.forEach(row => {
      const locStr = cleanRaw(row[9]);
      const coords = parseCoords(locStr);
      if (!coords) return;
      const key = locStr;
      if (!map[key]) map[key] = { ...coords, key, events: [], cgi: cleanRaw(row[10]) };
      map[key].events.push(row);
    });
    return Object.values(map).map(loc => {
      const anom = loc.events.filter(isAnomalous).length;
      return { ...loc, totalEvents: loc.events.length, anomalyCount: anom, anomalyRatio: anom / loc.events.length };
    });
  }, [filteredRecords]);

  const maxEvents = useMemo(() => Math.max(...locationData.map(l => l.totalEvents), 1), [locationData]);

  /* ── Clustered markers (0.02° grouping ≈ 2km) ── */
  const clusteredData = useMemo(() => {
    if (!clusterMode) return locationData;
    const used = new Set();
    const clusters = [];
    locationData.forEach((loc, i) => {
      if (used.has(i)) return;
      const group = [loc];
      used.add(i);
      locationData.forEach((other, j) => {
        if (used.has(j)) return;
        if (Math.abs(loc.lat - other.lat) < 0.02 && Math.abs(loc.lng - other.lng) < 0.02) {
          group.push(other);
          used.add(j);
        }
      });
      const avgLat = group.reduce((s,l) => s + l.lat, 0) / group.length;
      const avgLng = group.reduce((s,l) => s + l.lng, 0) / group.length;
      const totalEvents = group.reduce((s,l) => s + l.totalEvents, 0);
      const maxRatio = Math.max(...group.map(l => l.anomalyRatio));
      const allEvents = group.flatMap(l => l.events);
      clusters.push({ lat: avgLat, lng: avgLng, totalEvents, anomalyRatio: maxRatio, anomalyCount: group.reduce((s,l)=>s+l.anomalyCount,0), events: allEvents, isCluster: group.length > 1, clusterSize: group.length, key: `${avgLat},${avgLng}` });
    });
    return clusters;
  }, [locationData, clusterMode]);

  /* ── CGI counts ── */
  const cgiData = useMemo(() => {
    const counts = {};
    filteredRecords.forEach(row => {
      const cgi = cleanRaw(row[10]);
      if (!cgi || cgi === "---" || cgi === "-") return;
      if (!counts[cgi]) counts[cgi] = { count: 0, events: [] };
      counts[cgi].count++;
      counts[cgi].events.push(row);
    });
    return Object.entries(counts).sort((a,b) => b[1].count - a[1].count).slice(0, 20);
  }, [filteredRecords]);

  /* ── Co-location analysis ── */
  const colocData = useMemo(() => {
    if (!colocCGI) return null;
    const entry = cgiData.find(([cgi]) => cgi === colocCGI);
    if (!entry) return null;
    const events = entry[1].events;
    const contacts = {};
    events.forEach(row => {
      const b = cleanRaw(row[3]);
      if (!b || !/^\d{5,15}$/.test(b)) return;
      contacts[b] = (contacts[b] || 0) + 1;
    });
    return { cgi: colocCGI, totalEvents: events.length, contacts: Object.entries(contacts).sort((a,b)=>b[1]-a[1]).slice(0,15) };
  }, [colocCGI, cgiData]);

  /* ── KPIs ── */
  const anomalousLocations = locationData.filter(l => l.anomalyRatio > 0.3).length;
  const mapCenter = locationData.length > 0 ? [locationData[0].lat, locationData[0].lng] : [22.5, 78.9];

  const tileUrl = mapStyle === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : mapStyle === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const kpis = [
    { icon: MapPin,       label: "Unique Locations",    value: locationData.length,      color: "#0984e3", bg: "rgba(9,132,227,0.08)" },
    { icon: AlertTriangle,label: "Suspicious Locations", value: anomalousLocations,       color: "#d63031", bg: "rgba(214,48,49,0.08)" },
    { icon: Layers,       label: "Peak Coordinates",    value: locationData[0] ? `${locationData[0].lat.toFixed(3)},${locationData[0].lng.toFixed(3)}` : "—", isMonospace: true, color: "#e17055", bg: "rgba(225,112,85,0.08)" },
    { icon: Smartphone,   label: "Top Cell Tower",      value: cgiData[0]?.[0] ?? "—",   isMonospace: true, color: "#636e72", bg: "rgba(99,110,114,0.08)" },
  ];

  return (
    <motion.div className="page-container theme-geo" initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <motion.div variants={fadeUp} className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="mb-1 text-[30px] font-bold text-text">Geo Intelligence Center</h1>
        <p className="text-sm text-text-muted">Risk-scored cell tower mapping with anomaly detection, co-location analysis, and date filtering.</p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">Upload a CDR file to see the geo intelligence map.</div>
      ) : (<>

        {/* KPIs */}
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 }}>
          {kpis.map((kpi, i) => (
            <motion.div key={i} whileHover={{ y: -3, scale: 1.012 }} className="glass-card"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderLeft: `3px solid ${kpi.color}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.bg, border: `1px solid ${kpi.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <kpi.icon size={18} color={kpi.color} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)" }}>{kpi.label}</div>
                <div style={{ fontSize: kpi.isMonospace ? 13 : 22, fontWeight: 800, color: kpi.color, fontFamily: kpi.isMonospace ? "var(--font-mono)" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{kpi.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Date Range Filter Bar ── */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text)", fontSize: 13, fontWeight: 700 }}>
            <Filter size={14} color="var(--color-accent)" /> Date Filter
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.6)", color: "var(--color-text)", cursor: "pointer" }} />
            <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.6)", color: "var(--color-text)", cursor: "pointer" }} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <X size={10} /> Reset
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-subtle)" }}>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> events
            {dateRange.min && !dateFrom && !dateTo && <> · {toISO(dateRange.min)} → {toISO(dateRange.max)}</>}
          </span>
        </motion.div>

        {/* ── Map ── */}
        {locationData.length > 0 && (
          <motion.div variants={fadeUp} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <MapPin size={15} color="#0984e3" /> Risk-Scored Tower Map
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-muted)" }}>· click any marker for details</span>
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Cluster toggle */}
                <button onClick={() => setClusterMode(m => !m)}
                  style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${clusterMode ? "#0984e3" : "var(--color-border)"}`, background: clusterMode ? "rgba(9,132,227,0.1)" : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, color: clusterMode ? "#0984e3" : "var(--color-text-muted)", cursor: "pointer" }}>
                  {clusterMode ? "Cluster ON" : "Cluster OFF"}
                </button>
                {/* Map style */}
                <div style={{ display: "flex", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.6)" }}>
                  {[["light","Light"],["dark","Dark"],["satellite","Sat"]].map(([id,label]) => (
                    <button key={id} onClick={() => setMapStyle(id)}
                      style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: mapStyle === id ? "#0984e3" : "transparent", color: mapStyle === id ? "#fff" : "var(--color-text-muted)", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: 520, position: "relative" }}>
              {/* Risk legend overlay */}
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(8,34,41,0.88)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(233,241,248,0.5)", marginBottom: 8 }}>Anomaly Level</div>
                {[["#00b894","< 10% — Clean"],["#fdcb6e","10–30% — Low Risk"],["#e17055","30–60% — Suspicious"],["#d63031","> 60% — High Risk"]].map(([c,l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 10, color: "rgba(233,241,248,0.7)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0 }} />{l}
                  </div>
                ))}
              </div>
              <MapContainer center={mapCenter} zoom={9} scrollWheelZoom style={{ height: "100%", width: "100%" }} zoomControl>
                <TileLayer url={tileUrl} attribution="" />
                <ZoomTracker onZoom={setMapZoom} />
                {clusteredData.map((loc, i) => {
                  const color = anomalyColor(loc.anomalyRatio);
                  const radius = loc.isCluster
                    ? Math.max(14, Math.min(32, 10 + loc.clusterSize * 4))
                    : 5 + (loc.totalEvents / maxEvents) * 18;
                  return (
                    <CircleMarker key={loc.key || i} center={[loc.lat, loc.lng]}
                      radius={radius}
                      eventHandlers={{ click: () => setSelectedLocation(loc) }}
                      pathOptions={{ color: "rgba(255,255,255,0.3)", fillColor: color, fillOpacity: 0.72, weight: 1.5 }}>
                      <Popup>
                        <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#082229", lineHeight: 1.6 }}>
                          <strong style={{ color }}>{anomalyLabel(loc.anomalyRatio)}</strong>
                          {loc.isCluster && <><br /><em>{loc.clusterSize} towers clustered</em></>}
                          <br />Events: <strong>{loc.totalEvents}</strong>
                          <br />Anomalous: <strong style={{ color }}>{Math.round(loc.anomalyRatio*100)}%</strong>
                          <br /><span style={{ color: "#0984e3", cursor: "pointer", fontWeight: 700 }}>Click marker to analyze →</span>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </motion.div>
        )}

        {/* ── Co-location Analysis ── */}
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Radio size={15} color="#e17055" /> Tower Co-location Analysis
          </h2>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>Select a cell tower (CGI) to see which contacts were present at the same physical tower — useful for identifying associates and patterns.</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input type="text" value={colocCGI} onChange={e => setColocCGI(e.target.value)}
                placeholder="Type or paste a CGI identifier…"
                list="cgi-list"
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.6)", color: "var(--color-text)", outline: "none" }} />
              <datalist id="cgi-list">
                {cgiData.map(([cgi]) => <option key={cgi} value={cgi} />)}
              </datalist>
            </div>
            {colocCGI && <button onClick={() => setColocCGI("")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", background: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}><X size={10} /> Clear</button>}
          </div>

          {colocData ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
              <div>
                <div style={{ background: "rgba(9,132,227,0.06)", border: "1px solid rgba(9,132,227,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-subtle)", marginBottom: 4 }}>CGI: {colocData.cgi}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0984e3" }}>{colocData.totalEvents} events</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>{colocData.contacts.length} unique contacts used this tower</div>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "var(--color-text-muted)", margin: 0 }}>
                  All phone numbers listed below were physically near <strong style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>{colocData.cgi}</strong> at some point. This tower co-location is useful for identifying associates and building a presence network around the suspect.
                </p>
              </div>
              <div>
                <table className="ct-table">
                  <thead>
                    <tr><th>Contact Number</th><th>Events</th><th>Flag</th></tr>
                  </thead>
                  <tbody>
                    {colocData.contacts.map(([phone, count]) => {
                      const isUpi = UPI_GATEWAY_NUMBERS.has(phone);
                      const isBank = BANK_KEYWORDS.some(kw => phone.toUpperCase().includes(kw));
                      return (
                        <tr key={phone}>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: isUpi||isBank ? "#d63031" : "var(--color-text)" }}>{phone}</td>
                          <td style={{ fontWeight: 700 }}>{count}</td>
                          <td>{(isUpi||isBank) && <span style={{ fontSize: 9, fontWeight: 800, color: "#d63031", textTransform: "uppercase", background: "rgba(214,48,49,0.08)", padding: "2px 7px", borderRadius: 99, border: "1px solid rgba(214,48,49,0.2)" }}>{isUpi ? "UPI" : "Bank"}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--color-text-muted)", fontSize: 13 }}>
              Select a CGI above to see co-location analysis
            </div>
          )}
        </motion.div>

        {/* ── Tables ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px,1fr))", gap: 18 }}>
          {/* Locations table */}
          <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MapPin size={15} color="#0984e3" /> Top Visited Locations
            </h2>
            <table className="ct-table">
              <thead>
                <tr><th>#</th><th>Coordinates</th><th>Events</th><th>Risk</th><th>Open</th></tr>
              </thead>
              <tbody>
                {locationData.slice(0,10).map((loc, i) => {
                  const color = anomalyColor(loc.anomalyRatio);
                  return (
                    <tr key={i} style={{ cursor: "pointer" }} onClick={() => setSelectedLocation(loc)}>
                      <td style={{ color: "var(--color-text-subtle)", fontSize: 11 }}>{i+1}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text)" }}>{loc.lat.toFixed(4)},{loc.lng.toFixed(4)}</td>
                      <td style={{ fontWeight: 700 }}>{loc.totalEvents}</td>
                      <td><span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: `${color}12`, color, border: `1px solid ${color}25`, textTransform: "uppercase" }}>{anomalyLabel(loc.anomalyRatio)}</span></td>
                      <td>
                        <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#0984e3", textDecoration: "none" }}>
                          Maps <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

          {/* CGI table */}
          <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Layers size={15} color="#e17055" /> Top Cell Towers (CGI)
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-muted)" }}>· click to analyze co-location</span>
            </h2>
            <table className="ct-table">
              <thead>
                <tr><th>CGI Identifier</th><th>Events</th><th>Action</th></tr>
              </thead>
              <tbody>
                {cgiData.slice(0,12).map(([cgi, { count }]) => (
                  <tr key={cgi} style={{ cursor: "pointer" }} onClick={() => setColocCGI(cgi)}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#0984e3" }}>{cgi}</td>
                    <td style={{ fontWeight: 700 }}>{count}</td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); setColocCGI(cgi); }}
                        style={{ fontSize: 10, fontWeight: 700, color: "#e17055", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                        Analyze <ChevronRight size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>

      </>)}

      {/* Tower Detail Panel */}
      <AnimatePresence>
        {selectedLocation && (
          <TowerDetailPanel location={selectedLocation} onClose={() => setSelectedLocation(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default GeoIntelligence;
