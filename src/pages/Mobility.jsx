import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Mobility() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  // Remove empty/broken rows
  const validRecords = records.filter(
    (row) => row && row.length > 10 && row[6] && row[7]
  );

  const towerCounts = {};
  validRecords.forEach((row) => {
    const tower = row[10];
    if (!tower) return;
    towerCounts[tower] = (towerCounts[tower] || 0) + 1;
  });

  const topTowers = Object.entries(towerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const uniqueTowers = new Set(
    validRecords.map((row) => row[10]).filter(Boolean)
  ).size;

  const mostUsedTower = topTowers.length > 0 ? topTowers[0][0] : "Unknown";
  const recentMovements = validRecords.slice(-10).reverse();
  const latestMovement = recentMovements.length > 0 ? recentMovements[0] : [];
  const lastActivity = latestMovement.length > 0 ? `${latestMovement[6]} ${latestMovement[7]}` : "Unknown";

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
          Mobility Tracker & Intelligence
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Chronological spatial mapping and cell tower transition footprints logged from target activity.
        </p>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No records loaded. Please upload a dataset in the Upload Center to trace cellular mobility.
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
                  <path d="M12 2a10 10 0 0 0-7.75 16.3l.06.07L12 22l7.69-3.63.06-.07A10 10 0 0 0 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Unique Towers</span>
                <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
                  {uniqueTowers}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(6, 182, 212, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Primary Cell Tower</span>
                <h2 style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                  {mostUsedTower}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Last Logged Activity</span>
                <h2 style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px", color: "var(--text-main)" }}>
                  {lastActivity}
                </h2>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px", alignItems: "start" }}>
            {/* Visual Movement Timeline */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  fontFamily: "var(--font-heading)",
                  marginBottom: "20px",
                }}
              >
                Chronological Hops Timeline
              </h2>

              <div style={{ display: "flex", flexDirection: "column", paddingLeft: "10px" }}>
                {recentMovements.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "20px",
                      position: "relative",
                      paddingBottom: index === recentMovements.length - 1 ? "0" : "24px",
                    }}
                  >
                    {/* Visual Line */}
                    {index !== recentMovements.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "20px",
                          bottom: "0",
                          width: "2px",
                          backgroundColor: "var(--border-main)",
                        }}
                      />
                    )}

                    {/* Timeline Node dot */}
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: index === 0 ? "var(--primary)" : "var(--bg-main)",
                        border: `3px solid ${index === 0 ? "rgba(59, 130, 246, 0.4)" : "var(--border-main)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                        boxShadow: index === 0 ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
                      }}
                    />

                    {/* Timeline Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-subtle)" }}>
                          {row[6]} @ {row[7]}
                        </span>
                        {index === 0 && (
                          <span style={{ fontSize: "9px", fontWeight: "700", color: "var(--success)", backgroundColor: "var(--success-glow)", padding: "2px 6px", borderRadius: "8px" }}>
                            LATEST HOP
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)", fontFamily: "monospace" }}>
                        CGI: {row[10]}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Service Type: {row[14] || "Unknown"} | Type: {row[1] || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Used Towers Table */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  fontFamily: "var(--font-heading)",
                  marginBottom: "20px",
                }}
              >
                Top Cellular Anchors
              </h2>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tower CGI</th>
                      <th>Total Audit Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTowers.map(([tower, count], index) => (
                      <tr key={index}>
                        <td style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--accent-cyan)", fontWeight: "600" }}>
                          {tower}
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

export default Mobility;