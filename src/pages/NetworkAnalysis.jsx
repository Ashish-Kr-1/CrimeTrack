import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function NetworkAnalysis() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const targetNumber =
    records.length > 0
      ? records[0][0]?.replace(/'/g, "")?.trim()
      : "Unknown";

  const contactCounts = {};
  records.forEach((row) => {
    let contact = row[3];
    if (!contact) return;
    contact = contact.replace(/'/g, "").trim();

    // Keep only numeric contacts
    if (!/^\d{5,15}$/.test(contact)) return;

    contactCounts[contact] = (contactCounts[contact] || 0) + 1;
  });

  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const totalContacts = Object.keys(contactCounts).length;
  const strongestContact = topContacts.length > 0 ? topContacts[0][0] : "Unknown";
  const strongestCount = topContacts.length > 0 ? topContacts[0][1] : 0;

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
          Network Analysis Matrix
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Target node calling/messaging linkage graphs and relationship densities.
        </p>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          No network details loaded. Please upload a CDR to analyze node connectivity.
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
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Target Suspect</span>
                <h2 style={{ fontSize: "20px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px", color: "var(--text-main)" }}>
                  {targetNumber}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(6, 182, 212, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Total Connections</span>
                <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
                  {totalContacts}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Strongest Node</span>
                <h2 style={{ fontSize: "15px", fontWeight: "700", marginTop: "2px", color: "var(--success)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                  {strongestContact}
                </h2>
                <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "2px" }}>
                  {strongestCount} link weight
                </div>
              </div>
            </div>
          </div>

          {/* Network Connection Matrix */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "20px" }}>
              🕸 Associated Nodes & Link Densities
            </h2>
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Contact Node</th>
                    <th>Link Weight (Interactions)</th>
                    <th style={{ width: "40%" }}>Relationship Density</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([contact, count], index) => {
                    const weightPct = Math.min((count / strongestCount) * 100, 100);
                    const weightColor = count >= 30 ? "var(--danger)" : count >= 15 ? "var(--warning)" : "var(--success)";
                    return (
                      <tr key={index}>
                        <td style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>
                          {contact}
                        </td>
                        <td style={{ fontWeight: "700" }}>{count}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ flex: 1, height: "6px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${weightPct}%`, height: "100%", backgroundColor: weightColor }} />
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-subtle)", minWidth: "30px", textAlign: "right" }}>
                              {weightPct.toFixed(0)}%
                            </span>
                          </div>
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

export default NetworkAnalysis;