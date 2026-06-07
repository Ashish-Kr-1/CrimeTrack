import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { FolderOpen, Save, FileSearch, Crosshair, Activity, Hash, Radio, MapPin } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function Cases() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const targetNumber =
    records.length > 0 ? records[0][0]?.replace(/'/g, "")?.trim() : "Unknown";

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
  const topContact = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0] || ["Unknown", 0];

  const towerCounts = {};
  records.forEach((row) => {
    const tower = row[10];
    if (!tower) return;
    towerCounts[tower] = (towerCounts[tower] || 0) + 1;
  });

  const uniqueTowers = Object.keys(towerCounts).length;
  const topTower = Object.entries(towerCounts).sort((a, b) => b[1] - a[1])[0] || ["Unknown", 0];

  let riskLevel = "Nominal";
  let riskColor = "var(--color-text-muted)";
  let riskBg    = "rgba(77, 125, 138, 0.1)";
  let riskBorder = "rgba(77, 125, 138, 0.25)";

  if (totalRecords > 500) {
    riskLevel  = "Critical";
    riskColor  = "var(--color-gold)";
    riskBg     = "rgba(255, 107, 74, 0.1)";
    riskBorder = "rgba(255, 107, 74, 0.25)";
  } else if (totalRecords > 200) {
    riskLevel  = "Suspicious";
    riskColor  = "var(--color-accent)";
    riskBg     = "rgba(0, 212, 245, 0.08)";
    riskBorder = "rgba(0, 212, 245, 0.22)";
  }

  const quickStats = [
    { icon: Hash,     label: "Total Events",     value: totalRecords.toLocaleString(), color: "var(--color-accent)" },
    { icon: Activity, label: "Unique Contacts",  value: uniqueContacts,                color: "var(--color-accent)" },
    { icon: MapPin,   label: "Cell Towers",      value: uniqueTowers,                  color: "var(--color-accent)" },
    { icon: Radio,    label: "Primary Node",     value: `…${topContact[0].slice(-4)}`, color: "var(--color-gold)", sub: `${topContact[1]} calls` },
  ];

  const dossierFields = [
    { label: "Target Suspect Number", value: targetNumber, mono: true, color: "var(--color-accent)" },
    { label: "Total Event Footprints", value: `${totalRecords} events` },
    { label: "Associated Contacts",   value: `${uniqueContacts} unique nodes` },
    { label: "Associated Cell Towers",value: `${uniqueTowers} towers` },
    { label: "Primary Connected Node",value: topContact[0], sub: `(${topContact[1]} interactions)`, mono: true },
    { label: "Primary Active Cell Tower", value: topTower[0], sub: `(${topTower[1]} events)`, mono: true },
  ];

  return (
    <motion.div className="page-container theme-cases" initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255, 107, 74, 0.1)",
              border: "1px solid rgba(255, 107, 74, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FolderOpen size={18} color="var(--color-gold)" strokeWidth={2} />
          </div>
          <h1 className="page-title">Investigation Cases</h1>
        </div>
        <p className="page-subtitle">
          Automated case dossiers compiled from uploaded telecom records and cell telemetry indicators.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon" style={{ background: "rgba(255,107,74,0.08)", borderColor: "rgba(255,107,74,0.2)" }}>
            <FolderOpen size={30} color="var(--color-gold)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No Active Cases</div>
          <p className="empty-state-body">
            Please ingest a telecom dataset in the Upload Center to initialize a case dossier.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Stats Row */}
          <motion.div
            variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 22 }}
          >
            {quickStats.map((s, i) => (
              <div key={i} className="stat-mini">
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <s.icon size={13} color={s.color} />
                  <span className="stat-mini-label">{s.label}</span>
                </div>
                <div className="stat-mini-value" style={{ color: s.color }}>{s.value}</div>
                {s.sub && <div className="stat-mini-sub">{s.sub}</div>}
              </div>
            ))}
          </motion.div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}>
            {/* Main Dossier Card */}
            <motion.div variants={fadeUp} className="glass-card" style={{ overflow: "hidden" }}>
              {/* Header bar */}
              <div
                style={{
                  padding: "16px 22px",
                  background: "linear-gradient(90deg, rgba(255, 107, 74, 0.1), rgba(255, 107, 74, 0.03))",
                  borderBottom: "1px solid rgba(255, 107, 74, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.015em" }}>
                    <FileSearch size={16} color="var(--color-gold)" />
                    CASE-001 · Target Dossier
                  </h2>
                  <span style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 2, display: "block" }}>
                    Auto-initialized on data ingestion
                  </span>
                </div>
                <span
                  style={{
                    padding: "5px 14px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: riskBg,
                    color: riskColor,
                    border: `1px solid ${riskBorder}`,
                    flexShrink: 0,
                  }}
                >
                  {riskLevel} Threat
                </span>
              </div>

              <div style={{ padding: "0" }}>
                <table className="ct-table">
                  <tbody>
                    {dossierFields.map((field, idx) => (
                      <tr key={idx}>
                        <td style={{ width: "40%", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 13, paddingLeft: 22 }}>
                          {field.label}
                        </td>
                        <td style={{ paddingRight: 22 }}>
                          <span
                            style={{
                              fontFamily: field.mono ? "var(--font-mono)" : "inherit",
                              fontSize: field.mono ? 13 : 13,
                              fontWeight: 600,
                              color: field.color ?? "var(--color-text)",
                            }}
                          >
                            {field.value}
                          </span>
                          {field.sub && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--color-text-subtle)" }}>
                              {field.sub}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Annotations Panel */}
            <motion.div variants={fadeUp} className="glass-card" style={{ padding: "20px 22px" }}>
              <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ fontSize: 14 }}>
                  <Crosshair size={15} style={{ color: "var(--color-accent)" }} />
                  Investigator Annotations
                </div>
              </div>

              <textarea
                id="case-annotations"
                placeholder="Enter investigation logs, subject aliases, physical address annotations, or behavioral notes..."
                rows={8}
                style={{
                  width: "100%",
                  resize: "vertical",
                  background: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  lineHeight: 1.65,
                  padding: "12px 14px",
                  outline: "none",
                  transition: "var(--transition-base)",
                  marginBottom: 14,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--color-accent-dim)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border)";
                  e.target.style.boxShadow = "none";
                }}
              />

              <button
                id="save-dossier"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "11px 20px" }}
              >
                <Save size={14} />
                Save Dossier Logs
              </button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default Cases;