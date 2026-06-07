import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Cases() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const targetNumber =
    records.length > 0
      ? records[0][0]?.replace(/'/g, "")?.trim()
      : "Unknown";

  const totalRecords = records.length;

  const contactCounts = {};
  records.forEach((row) => {
    let contact = row[3];
    if (!contact) return;
    contact = contact.replace(/'/g, "").trim();

    if (!/^\d{5,15}$/.test(contact)) return;

    contactCounts[contact] = (contactCounts[contact] || 0) + 1;
  });

  const uniqueContacts = Object.keys(contactCounts).length;
  const topContact = Object.entries(contactCounts).sort(
    (a, b) => b[1] - a[1]
  )[0] || ["Unknown", 0];

  const towerCounts = {};
  records.forEach((row) => {
    const tower = row[10];
    if (!tower) return;
    towerCounts[tower] = (towerCounts[tower] || 0) + 1;
  });

  const uniqueTowers = Object.keys(towerCounts).length;
  const topTower = Object.entries(towerCounts).sort(
    (a, b) => b[1] - a[1]
  )[0] || ["Unknown", 0];

  let riskLevel = "Low";
  let riskColor = "var(--success)";
  let riskBg = "var(--success-glow)";

  if (totalRecords > 500) {
    riskLevel = "Critical";
    riskColor = "var(--danger)";
    riskBg = "var(--danger-glow)";
  } else if (totalRecords > 200) {
    riskLevel = "Suspicious";
    riskColor = "var(--warning)";
    riskBg = "var(--warning-glow)";
  }

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
          Investigation Cases
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Automated case dossiers compiled from uploaded telecom records and cell telemetry indicators.
        </p>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No active cases. Please ingest a telecom dataset in the Upload Center to initialize a case dossier.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "25px", alignItems: "start" }}>
          {/* Dossier details card */}
          <div className="glass-card" style={{ padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>
                  CASE-001 / Target Dossier
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: "500" }}>
                  Initialized automatically on data ingestion
                </span>
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  backgroundColor: riskBg,
                  color: riskColor,
                  border: `1px solid ${riskColor}33`,
                }}
              >
                {riskLevel} Threat
              </span>
            </div>

            <div className="custom-table-container">
              <table className="custom-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)", width: "30%" }}>Target Suspect Number</td>
                    <td style={{ fontFamily: "monospace", fontSize: "14px", color: "var(--accent-cyan)", fontWeight: "600" }}>
                      {targetNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)" }}>Total Event Footprints</td>
                    <td style={{ fontWeight: "700" }}>{totalRecords} events</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)" }}>Associated Contacts</td>
                    <td>{uniqueContacts} unique nodes</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)" }}>Associated Cell Towers</td>
                    <td>{uniqueTowers} towers</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)" }}>Primary Connected Node</td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-main)" }}>
                      {topContact[0]} <span style={{ color: "var(--text-subtle)", fontWeight: "500" }}>({topContact[1]} interactions)</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600", color: "var(--text-muted)" }}>Primary Active Cell Tower</td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-main)", fontSize: "13px" }}>
                      {topTower[0]} <span style={{ color: "var(--text-subtle)", fontWeight: "500" }}>({topTower[1]} events)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel for annotations */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "15px" }}>
              Investigator Annotations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <textarea
                placeholder="Enter investigation logs, subject aliases, or physical address annotations..."
                rows="6"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-main)",
                  outline: "none",
                  backgroundColor: "rgba(6, 8, 19, 0.4)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  resize: "none",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-main)")}
              />
              <button
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseOver={(e) => (e.target.style.filter = "brightness(1.1)")}
                onMouseOut={(e) => (e.target.style.filter = "none")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Dossier Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cases;