import { useContext, useMemo } from "react";
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
      color: "#00e5ff",
      bg: "rgba(0, 229, 255, 0.08)",
    },
    {
      icon: Layers,
      label: "Peak Coordinates",
      value: mostFrequentLocation,
      isMonospace: true,
      color: "#ff6b4a",
      bg: "rgba(255, 107, 74, 0.08)",
    },
    {
      icon: Smartphone,
      label: "Peak Cell Tower",
      value: mostFrequentCGI,
      isMonospace: true,
      color: "#88aeb7",
      bg: "rgba(136, 174, 183, 0.12)",
    },
  ];

  return (
    <motion.div
      className="mx-auto w-full max-w-[1200px] pb-10"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="mb-1 text-[30px] font-bold text-text">
          Geo Intelligence Center
        </h1>
        <p className="text-sm text-text-muted">
          Cellular base transceiver station (BTS) coordinates and cell location
          area mappings.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No geolocation data loaded. Please upload a CDR to analyze cellular
          coordinates.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <motion.div
            variants={fadeUp}
            className="mb-8 grid gap-5"
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
                    className={`mt-0.5 truncate ${kpi.isMonospace ? "font-mono text-[14px] font-bold" : "text-xl font-bold text-text"}`}
                    style={kpi.isMonospace ? { color: kpi.color } : undefined}
                  >
                    {kpi.value}
                  </h2>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Dark Map */}
          {markers.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="glass-card mb-8 overflow-hidden p-0"
              style={{ borderRadius: 16 }}
            >
              <div className="px-6 pt-5 pb-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                  <MapPin size={18} color="#ff6b4a" />
                  Cell Tower Geo Plot
                </h2>
              </div>
              <div style={{ height: 550 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution=""
                  />
                  {markers.map((m, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[m.lat, m.lng]}
                      radius={6 + m.ratio * 14}
                      pathOptions={{
                        color: "#ff6b4a",
                        fillColor: "#00e5ff",
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coordinates Table */}
            <motion.div variants={fadeUp} className="glass-card p-6">
              <h2 className="mb-5 text-lg font-bold text-text">
                Peak Visited Coordinates
              </h2>
              <div className="overflow-x-auto">
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
                          <td className="font-mono text-[13px] text-text">
                            {location}
                          </td>
                          <td className="font-bold">{count}</td>
                          <td>
                            <a
                              href={searchUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:brightness-125"
                              style={{ color: "#00e5ff" }}
                            >
                              Maps
                              <ExternalLink size={11} />
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
            <motion.div variants={fadeUp} className="glass-card p-6">
              <h2 className="mb-5 text-lg font-bold text-text">
                Top CGI Cells
              </h2>
              <div className="overflow-x-auto">
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
                          className="font-mono text-[13px] font-semibold"
                          style={{ color: "#00e5ff" }}
                        >
                          {cgi}
                        </td>
                        <td className="font-bold">{count}</td>
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