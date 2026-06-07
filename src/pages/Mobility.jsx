import { useContext, useState, useEffect, useMemo } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Radio, Globe, Clock, MapPin, Activity, ChevronRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// Map center controller helper
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

// Custom Leaflet DivIcon creator for numbered sequence badges
const createNumberedIcon = (number, isSelected) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center rounded-full text-[10px] font-mono font-bold border" 
      style="width: 22px; height: 22px; 
             background-color: ${isSelected ? "#ff6b4a" : "#00e5ff"}; 
             color: #082229; 
             border-color: ${isSelected ? "#f0f9ff" : "rgba(8, 34, 41, 0.3)"};
             box-shadow: ${isSelected ? "0 0 10px rgba(255, 107, 74, 0.6)" : "0 2px 4px rgba(0,0,0,0.4)"};">
      ${number}
    </div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

function Mobility() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const [activeHop, setActiveHop] = useState(null);

  // Filter records with valid dates and locations
  const validRecords = useMemo(() => {
    return records.filter(
      (row) => row && row.length > 10 && row[6] && row[7]
    );
  }, [records]);

  // Aggregate top cell tower logs
  const towerCounts = useMemo(() => {
    const counts = {};
    validRecords.forEach((row) => {
      const tower = row[10];
      if (!tower) return;
      counts[tower] = (counts[tower] || 0) + 1;
    });
    return counts;
  }, [validRecords]);

  const topTowers = useMemo(() => {
    return Object.entries(towerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [towerCounts]);

  const uniqueTowers = Object.keys(towerCounts).length;
  const mostUsedTower = topTowers.length > 0 ? topTowers[0][0] : "Unknown";

  // Parse last 15 tower hops with valid coordinates chronologically
  const parsedHops = useMemo(() => {
    const lastHops = validRecords.slice(-15);
    let seq = 1;
    return lastHops
      .map((row) => {
        const location = row[9];
        if (!location) return null;
        const parts = location.split("/");
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return {
              lat,
              lng,
              cgi: row[10] || "Unknown",
              date: row[6] || "Unknown",
              time: row[7] || "Unknown",
              service: row[14] || "Unknown",
              type: row[1] || "Unknown",
              seqNumber: seq++,
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  }, [validRecords]);

  // Timeline list (newest first)
  const timelineHops = useMemo(() => {
    return [...parsedHops].reverse();
  }, [parsedHops]);

  // Polyline pathway coordinates list
  const polylinePath = useMemo(() => {
    return parsedHops.map((h) => [h.lat, h.lng]);
  }, [parsedHops]);

  // Default Map center coordinates (Kolkata/India area or active suspect centers)
  const defaultCenter = useMemo(() => {
    if (parsedHops.length > 0) {
      return [parsedHops[parsedHops.length - 1].lat, parsedHops[parsedHops.length - 1].lng];
    }
    return [22.5697, 88.3697]; // Kolkata default
  }, [parsedHops]);

  const lastActivity = useMemo(() => {
    if (parsedHops.length > 0) {
      const latest = parsedHops[parsedHops.length - 1];
      return `${latest.date} ${latest.time}`;
    }
    return "Unknown";
  }, [parsedHops]);

  // Set default active hop to the latest chronological hop on data load
  useEffect(() => {
    if (parsedHops.length > 0 && !activeHop) {
      setActiveHop(parsedHops[parsedHops.length - 1]);
    }
  }, [parsedHops, activeHop]);

  const kpis = [
    {
      icon: Radio,
      label: "Unique Towers",
      value: uniqueTowers,
      color: "#00e5ff",
      bg: "rgba(0, 229, 255, 0.08)",
    },
    {
      icon: Globe,
      label: "Primary Cell Tower",
      value: mostUsedTower,
      isMonospace: true,
      color: "#ff6b4a",
      bg: "rgba(255, 107, 74, 0.08)",
    },
    {
      icon: Clock,
      label: "Last Logged Activity",
      value: lastActivity,
      color: "#00e5ff",
      bg: "rgba(0, 229, 255, 0.08)",
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-[1400px] pb-10"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="mb-1 text-[30px] font-bold text-text">
          Mobility Tracker & Georeferencing
        </h1>
        <p className="text-sm text-text-muted">
          Chronological spatial mapping and cell tower transition footprints logged from target activity.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No records loaded. Please upload a dataset in the Ingestion Center to trace cellular mobility.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <motion.div
            variants={fadeUp}
            className="mb-6 grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.015 }}
                className="glass-card flex items-center gap-4 p-5"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: kpi.bg,
                    borderColor: `${kpi.color}25`,
                  }}
                >
                  <kpi.icon size={20} color={kpi.color} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-text-muted">
                    {kpi.label}
                  </span>
                  <h2
                    className={`mt-0.5 truncate text-text ${kpi.isMonospace ? "font-mono text-[13px] font-bold" : "text-xl font-bold"}`}
                    style={kpi.isMonospace ? { color: kpi.color } : undefined}
                  >
                    {kpi.value}
                  </h2>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
            {/* LEFT PANEL: TIMELINE (5 cols) */}
            <motion.div variants={fadeUp} className="glass-card p-6 lg:col-span-5 h-[720px] flex flex-col">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
                <Activity size={18} color="#00e5ff" />
                Cell Transition Hops
              </h2>
              <p className="text-xs text-text-muted mb-5">
                Click a chronological cell hop below to pan the georeferenced tracker map on the right.
              </p>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex flex-col pl-2 mt-2">
                  {timelineHops.map((hop, idx) => {
                    const isSelected = activeHop && activeHop.seqNumber === hop.seqNumber;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveHop(hop)}
                        className={`relative flex gap-4 cursor-pointer p-3.5 rounded-xl transition-all border ${
                          isSelected
                            ? "bg-accent/10 border-accent/40 shadow-sm"
                            : "border-transparent hover:bg-dark-surface/30 text-text-muted hover:text-text"
                        }`}
                        style={{ marginBottom: 16 }}
                      >
                        {/* Connecting timeline line */}
                        {idx !== timelineHops.length - 1 && (
                          <div
                            className="absolute left-[24px] top-10 bottom-[-24px] w-[1px]"
                            style={{ backgroundColor: "rgba(0, 229, 255, 0.2)" }}
                          />
                        )}

                        {/* Number Indicator node */}
                        <div
                          className="z-10 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold font-mono"
                          style={{
                            backgroundColor: isSelected ? "#ff6b4a" : "#124854",
                            color: isSelected ? "#082229" : "#e9f1f8",
                            border: `2px solid ${isSelected ? "#ff6b4a" : "rgba(0, 229, 255, 0.4)"}`,
                            boxShadow: isSelected ? "0 0 10px rgba(255, 107, 74, 0.5)" : "none",
                          }}
                        >
                          {hop.seqNumber}
                        </div>

                        {/* Hop details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-text-subtle">
                              {hop.date} @ {hop.time}
                            </span>
                            {hop.seqNumber === parsedHops.length && (
                              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[8.5px] font-bold text-accent uppercase tracking-wider">
                                LATEST
                              </span>
                            )}
                          </div>
                          <h4 className="font-mono text-sm font-semibold text-text mt-1.5 truncate">
                            CGI: {hop.cgi}
                          </h4>
                          <p className="mt-1 text-[11px] text-text-subtle flex justify-between">
                            <span>Type: {hop.type} | Service: {hop.service}</span>
                            <span className="flex items-center gap-0.5 text-accent hover:underline">
                              Locate <ChevronRight size={10} />
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* RIGHT PANEL: MAP & ANCHORS (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Georeferencing Tracker Map */}
              <motion.div variants={fadeUp} className="glass-card overflow-hidden" style={{ borderRadius: 16 }}>
                <div className="px-6 pt-5 pb-3 border-b border-border bg-dark-surface/40 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-md font-bold text-text">
                    <MapPin size={16} color="#ff6b4a" />
                    Georeferencing Path Overlay
                  </h2>
                  {activeHop && (
                    <span className="text-[10px] font-mono font-bold text-accent">
                      Active: Hop #{activeHop.seqNumber}
                    </span>
                  )}
                </div>

                <div style={{ height: 520 }}>
                  {parsedHops.length > 0 ? (
                    <MapContainer
                      center={defaultCenter}
                      zoom={13}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                      zoomControl={true}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution=""
                      />
                      {/* Path route connection */}
                      {polylinePath.length > 1 && (
                        <Polyline
                          positions={polylinePath}
                          pathOptions={{ color: "#00e5ff", weight: 3, opacity: 0.6 }}
                        />
                      )}
                      {/* Numbered tower markers */}
                      {parsedHops.map((hop, idx) => {
                        const isSelected = activeHop && activeHop.seqNumber === hop.seqNumber;
                        return (
                          <Marker
                            key={idx}
                            position={[hop.lat, hop.lng]}
                            icon={createNumberedIcon(hop.seqNumber, isSelected)}
                          >
                            <Popup>
                              <div className="text-xs font-sans text-dark font-medium" style={{ color: "#082229" }}>
                                <strong>Cell Hop #${hop.seqNumber}</strong>
                                <br />CGI: {hop.cgi}
                                <br />Time: {hop.date} {hop.time}
                                <br />Type: {hop.type} | Service: {hop.service}
                                <br />Coords: {hop.lat.toFixed(5)}, {hop.lng.toFixed(5)}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                      {activeHop && <MapController center={[activeHop.lat, activeHop.lng]} />}
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full bg-dark/80 flex flex-col items-center justify-center text-center p-4">
                      <MapPin size={28} className="text-text-subtle mb-2 animate-pulse" />
                      <span className="text-xs font-bold text-text-subtle">GPS SIGNAL LOST</span>
                      <span className="text-[10px] text-text-subtle/80 mt-1 max-w-[200px]">
                        Suspect's records contain no valid cellular sector geolocation coordinates.
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Top Cellular Anchors Table */}
              <motion.div variants={fadeUp} className="glass-card p-6">
                <h2 className="mb-5 flex items-center gap-2 text-md font-bold text-text">
                  <Radio size={16} color="#ff6b4a" />
                  Top Transceiver Anchors
                </h2>
                <div className="overflow-x-auto font-sans">
                  <table className="ct-table">
                    <thead>
                      <tr>
                        <th>Tower CGI</th>
                        <th>Total Handshakes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTowers.map(([tower, count], idx) => (
                        <tr key={idx}>
                          <td
                            className="font-mono text-[13px] font-semibold"
                            style={{ color: "#00e5ff" }}
                          >
                            {tower}
                          </td>
                          <td className="font-bold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default Mobility;