import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { FolderOpen, Save, FileSearch, Crosshair } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
  let riskColor = "#2d8a5e";
  let riskBg = "rgba(45, 138, 94, 0.1)";

  if (totalRecords > 500) {
    riskLevel = "Critical";
    riskColor = "#c93c3c";
    riskBg = "rgba(201, 60, 60, 0.1)";
  } else if (totalRecords > 200) {
    riskLevel = "Suspicious";
    riskColor = "#c18833";
    riskBg = "rgba(193, 136, 51, 0.1)";
  }

  const dossierFields = [
    {
      label: "Target Suspect Number",
      value: targetNumber,
      mono: true,
      color: "#3b5fab",
    },
    { label: "Total Event Footprints", value: `${totalRecords} events` },
    { label: "Associated Contacts", value: `${uniqueContacts} unique nodes` },
    { label: "Associated Cell Towers", value: `${uniqueTowers} towers` },
    {
      label: "Primary Connected Node",
      value: topContact[0],
      sub: `(${topContact[1]} interactions)`,
      mono: true,
    },
    {
      label: "Primary Active Cell Tower",
      value: topTower[0],
      sub: `(${topTower[1]} events)`,
      mono: true,
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
          Investigation Cases
        </h1>
        <p className="text-sm text-text-muted">
          Automated case dossiers compiled from uploaded telecom records and cell
          telemetry indicators.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No active cases. Please ingest a telecom dataset in the Upload Center
          to initialize a case dossier.
        </div>
      ) : (
        <div
          className="grid items-start gap-6"
          style={{ gridTemplateColumns: "1.5fr 1fr" }}
        >
          {/* Dossier Card */}
          <motion.div variants={fadeUp} className="glass-card overflow-hidden">
            {/* Gold header bar */}
            <div
              className="flex items-center justify-between px-7 py-4"
              style={{
                background:
                  "linear-gradient(90deg, rgba(193, 136, 51, 0.12), rgba(193, 136, 51, 0.03))",
                borderBottom: "1px solid rgba(193, 136, 51, 0.15)",
              }}
            >
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                  <FileSearch size={18} color="#c18833" />
                  CASE-001 / Target Dossier
                </h2>
                <span className="text-[11px] font-medium text-text-subtle">
                  Initialized automatically on data ingestion
                </span>
              </div>
              <span
                className="rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase"
                style={{
                  backgroundColor: riskBg,
                  color: riskColor,
                  border: `1px solid ${riskColor}30`,
                }}
              >
                {riskLevel} Threat
              </span>
            </div>

            <div className="p-7">
              <table className="ct-table">
                <tbody>
                  {dossierFields.map((field, idx) => (
                    <tr key={idx}>
                      <td className="w-[35%] font-semibold text-text-muted">
                        {field.label}
                      </td>
                      <td>
                        <span
                          className={
                            field.mono
                              ? "font-mono text-[13px] font-bold"
                              : "font-semibold text-text"
                          }
                          style={field.color ? { color: field.color } : undefined}
                        >
                          {field.value}
                        </span>
                        {field.sub && (
                          <span className="ml-2 text-xs text-text-subtle">
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
          <motion.div variants={fadeUp} className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text">
              <Crosshair size={16} color="#3b5fab" />
              Investigator Annotations
            </h3>
            <div className="flex flex-col gap-4">
              <textarea
                id="case-annotations"
                placeholder="Enter investigation logs, subject aliases, or physical address annotations..."
                rows="7"
                className="w-full resize-none rounded-xl border border-border bg-dark/60 p-3.5 text-[13px] text-text outline-none transition-colors focus:border-accent"
                style={{ fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />
              <button
                id="save-dossier"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#3b5fab",
                  boxShadow: "0 4px 15px rgba(59, 95, 171, 0.3)",
                }}
              >
                <Save size={14} />
                Save Dossier Logs
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default Cases;