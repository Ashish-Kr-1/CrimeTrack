import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function RiskCenter() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const contactCounts = {};

  records.forEach((row) => {
    // Column 3 is B Party No
    const contact = row[3]?.replace(/'/g, "").trim();
    if (!contact) return;

    // Only keep numeric contacts (or short codes >= 5 digits)
    if (!/^\d{5,15}$/.test(contact)) return;

    contactCounts[contact] = (contactCounts[contact] || 0) + 1;
  });

  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const highRisk = topContacts.filter(([, count]) => count > 30).length;
  const mediumRisk = topContacts.filter(([, count]) => count > 10 && count <= 30).length;
  const lowRisk = topContacts.filter(([, count]) => count <= 10).length;

  return (
    <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
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
          Entity Risk Intelligence Center
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Target node threat levels classified by high-frequency calling and messaging telemetry patterns.
        </p>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No CDR records loaded. Please ingest a dataset to check entity threat levels.
        </div>
      ) : (
        <>
          {/* KPI Risk Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid var(--danger)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "var(--danger-glow)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Critical Nodes</span>
                <h2 style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px", color: "var(--danger)" }}>
                  {highRisk}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid var(--warning)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "var(--warning-glow)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Suspicious Nodes</span>
                <h2 style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px", color: "var(--warning)" }}>
                  {mediumRisk}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", borderLeft: "4px solid var(--success)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "var(--success-glow)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Stable Contacts</span>
                <h2 style={{ fontSize: "24px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px", color: "var(--success)" }}>
                  {lowRisk}
                </h2>
              </div>
            </div>
          </div>

          {/* Risk Table */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                fontFamily: "var(--font-heading)",
                marginBottom: "20px",
              }}
            >
              Entity Threat Matrix
            </h2>

            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Contact Number</th>
                    <th>Forensic Interactions</th>
                    <th>Threat Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([number, count], index) => {
                    const cellColor = count > 30 ? "var(--danger)" : count > 10 ? "var(--warning)" : "var(--success)";
                    const cellBg = count > 30 ? "var(--danger-glow)" : count > 10 ? "var(--warning-glow)" : "var(--success-glow)";
                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: "600", color: "var(--text-main)", fontFamily: "monospace", fontSize: "14px" }}>
                          {number}
                        </td>
                        <td style={{ fontWeight: "600" }}>{count}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "700",
                              backgroundColor: cellBg,
                              color: cellColor,
                              border: `1px solid ${cellColor}33`,
                            }}
                          >
                            {count > 30 ? "Critical" : count > 10 ? "Suspicious" : "Nominal"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RiskCenter;