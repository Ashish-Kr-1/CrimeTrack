import { useContext, useState, useMemo } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { MapPin, Layers, Smartphone, ExternalLink } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function GeoIntelligence() {
  const { cdrData } = useContext(CDRContext);
  const [mapStyle, setMapStyle] = useState("light");
  const records = cdrData.slice(1);

  const locationCounts = {};
  const cgiCounts = {};

  records.forEach((row) => {
    const location = row[9];
    const cgi = row[10];

    if (location && location !== "0" && location !== "-") {
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    }
    if (cgi && cgi !== "---" && cgi !== "-") {
      cgiCounts[cgi] = (cgiCounts[cgi] || 0) + 1;
    }
  });

  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCGIs = Object.entries(cgiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const uniqueLocations = Object.keys(locationCounts).length;
  const mostFrequentLocation =
    topLocations.length > 0 ? topLocations[0][0] : "Unknown";
  const mostFrequentCGI = topCGIs.length > 0 ? topCGIs[0][0] : "Unknown";

  // Parse coordinates for map markers
  const markers = useMemo(() => {
    const maxCount = topLocations.length > 0 ? topLocations[0][1] : 1;
    return topLocations
      .map(([loc, count]) => {
        const parts = loc.split("/");
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            return { lat, lng, count, ratio: count / maxCount };
          }
        }
        return null;
      })
      .filter(Boolean);
  }, [topLocations]);

  const mapCenter = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : [22.5, 78.9]; // Default: India center

  const kpis = [
    {
      icon: MapPin,
      label: "Unique Coordinates",
      value: uniqueLocations,
      color: "#0984e3",
      bg: "rgba(9, 132, 227, 0.08)",
    },
    {
      icon: Layers,
      label: "Peak Coordinates",
      value: mostFrequentLocation,
      isMonospace: true,
      color: "#e17055",
      bg: "rgba(225, 112, 85, 0.08)",
    },
    {
      icon: Smartphone,
      label: "Peak Cell Tower",
      value: mostFrequentCGI,
      isMonospace: true,
      color: "#636e72",
      bg: "rgba(99, 110, 114, 0.08)",
    },
  ];

  return (
    <motion.div
      className="page-container theme-geo"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <h1 className="page-title">
          Geo Intelligence Center
        </h1>
        <p className="page-subtitle">
          Cellular base transceiver station (BTS) coordinates and cell location
          area mappings.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">
            <MapPin size={30} color="var(--color-accent)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No Geolocation Data Loaded</div>
          <p className="empty-state-body">
            Please upload a CDR to analyze cellular coordinates.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.012 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="glass-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderLeft: `3px solid ${kpi.color}`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: kpi.bg,
                    border: `1px solid ${kpi.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <kpi.icon size={20} color={kpi.color} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 3 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: kpi.color, fontFamily: kpi.isMonospace ? "var(--font-mono)" : "var(--font-sans)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {kpi.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Dark Map */}
          {markers.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="glass-card"
              style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}
            >
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--color-border)", background: "rgba(255,255,255,0.4)" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
                  <MapPin size={18} color="var(--color-accent)" />
                  Cell Tower Geo Plot
                </h2>
              </div>
              <div style={{ height: 550, position: "relative" }}>
                {/* Map Style Selector Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 1000,
                    background: "rgba(255, 255, 255, 0.82)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    borderRadius: 10,
                    padding: 3,
                    display: "flex",
                    gap: 3,
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                  }}
                >
                  {[
                    { id: "light", label: "Light" },
                    { id: "dark", label: "Dark" },
                    { id: "satellite", label: "Satellite" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setMapStyle(style.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: mapStyle === style.id ? "#0984e3" : "transparent",
                        color: mapStyle === style.id ? "#ffffff" : "var(--color-text-muted)",
                      }}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url={
                      mapStyle === "dark"
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : mapStyle === "satellite"
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                    attribution=""
                  />
                  {markers.map((m, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[m.lat, m.lng]}
                      radius={6 + m.ratio * 14}
                      pathOptions={{
                        color: "#e17055",
                        fillColor: "#0984e3",
                        fillOpacity: 0.6 + m.ratio * 0.3,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div style={{ fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: "#082229" }}>
                          <strong>{m.lat.toFixed(4)}, {m.lng.toFixed(4)}</strong>
                          <br />
                          Events: {m.count}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </motion.div>
          )}

          {/* Tables */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 18 }}>
            {/* Coordinates Table */}
            <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px" }}>
              <div className="section-header">
                <div className="section-title">
                  <MapPin size={16} className="section-title-icon" />
                  Peak Visited Coordinates
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>Coordinates (Lat/Long)</th>
                      <th>Events</th>
                      <th>Investigate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLocations.map(([location, count], idx) => {
                      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${location.replace("/", ",")}`;
                      return (
                        <tr key={idx}>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--color-text)" }}>
                            {location}
                          </td>
                          <td style={{ fontWeight: 700 }}>{count}</td>
                          <td>
                            <a
                              href={searchUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}
                            >
                              Maps
                              <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* CGI Table */}
            <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px" }}>
              <div className="section-header">
                <div className="section-title flex justify-between">
                  <Layers size={16} className="section-title-icon" />
                  Top CGI Cells
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>CGI Identifier</th>
                      <th>Activity Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCGIs.map(([cgi, count], idx) => (
                      <tr key={idx}>
                        <td
                          style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#0984e3" }}
                        >
                          {cgi}
                        </td>
                        <td style={{ fontWeight: 700 }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default GeoIntelligence;