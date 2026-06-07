import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

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
  const mostFrequentLocation = topLocations.length > 0 ? topLocations[0][0] : "Unknown";
  const mostFrequentCGI = topCGIs.length > 0 ? topCGIs[0][0] : "Unknown";

  return (
    <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "35px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            fontFamily: "var(--font-heading)",
            marginBottom: "8px",
          }}
        >
          Geo Intelligence Center
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Cellular base transceiver station (BTS) coordinates and cell location area mappings.
        </p>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No geolocation data loaded. Please upload a CDR to analyze cellular coordinates.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Unique Coordinates</span>
                <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
                  {uniqueLocations}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(6, 182, 212, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Peak Coordinates</span>
                <h2 style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                  {mostFrequentLocation}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(139, 92, 246, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Peak Cell tower</span>
                <h2 style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent-purple)", fontFamily: "monospace" }}>
                  {mostFrequentCGI}
                </h2>
              </div>
            </div>
          </div>

          {/* Grids for tables */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "25px" }}>
            {/* Top coordinates with search maps trigger */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "20px" }}>
                🛰️ Peak Visited Coordinates
              </h2>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Coordinates (Lat/Long)</th>
                      <th>Events Count</th>
                      <th>Investigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLocations.map(([location, count], index) => {
                      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${location.replace("/", ",")}`;
                      return (
                        <tr key={index}>
                          <td style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--text-main)" }}>
                            {location}
                          </td>
                          <td style={{ fontWeight: "700" }}>{count}</td>
                          <td>
                            <a
                              href={searchUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                textDecoration: "none",
                                color: "var(--primary)",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Maps
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top CGI towers table */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "20px" }}>
                📡 Top CGI Cells
              </h2>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>CGI Identifier</th>
                      <th>Activity Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCGIs.map(([cgi, count], index) => (
                      <tr key={index}>
                        <td style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--accent-purple)", fontWeight: "600" }}>
                          {cgi}
                        </td>
                        <td style={{ fontWeight: "700" }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GeoIntelligence;