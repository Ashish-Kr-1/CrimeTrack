import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Octagon, AlertTriangle, CheckCircle2, BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function RiskCenter() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

  const contactCounts = {};
  records.forEach((row) => {
    const contact = row[3]?.replace(/'/g, "").trim();
    if (!contact) return;
    if (!/^\d{5,15}$/.test(contact)) return;
    contactCounts[contact] = (contactCounts[contact] || 0) + 1;
  });

  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const highRisk   = topContacts.filter(([, c]) => c > 30).length;
  const mediumRisk = topContacts.filter(([, c]) => c > 10 && c <= 30).length;
  const lowRisk    = topContacts.filter(([, c]) => c <= 10).length;

  const chartData = topContacts.slice(0, 10).map(([num, count]) => ({
    name:  num.slice(-4),
    value: count,
    full:  num,
    level: count > 30 ? "critical" : count > 10 ? "suspicious" : "nominal",
  }));

  const riskCards = [
    {
      icon:   Octagon,
      label:  "Critical Nodes",
      value:  highRisk,
      color:  "#ff6b4a",
      bg:     "rgba(255, 107, 74, 0.1)",
      border: "rgba(255, 107, 74, 0.25)",
      desc:   "Contacts with >30 interactions",
    },
    {
      icon:   AlertTriangle,
      label:  "Suspicious Nodes",
      value:  mediumRisk,
      color:  "var(--color-accent)",
      bg:     "rgba(0, 212, 245, 0.08)",
      border: "rgba(0, 212, 245, 0.2)",
      desc:   "Contacts with 10–30 interactions",
    },
    {
      icon:   CheckCircle2,
      label:  "Stable Contacts",
      value:  lowRisk,
      color:  "var(--color-text-muted)",
      bg:     "rgba(77, 125, 138, 0.1)",
      border: "rgba(77, 125, 138, 0.2)",
      desc:   "Contacts with ≤10 interactions",
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: "var(--color-dark-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 12,
          boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{ color: "var(--color-text)", fontWeight: 700, marginBottom: 4, fontFamily: "var(--font-mono)" }}>{d.full}</div>
          <div style={{ color: "var(--color-text-muted)" }}>{d.value} interactions</div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="page-container"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(255, 107, 74, 0.1)",
                border: "1px solid rgba(255, 107, 74, 0.22)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                marginBottom: 10,
              }}
            >
              <TrendingUp size={10} />
              Risk Intelligence
            </div>
            <h1 className="page-title">Entity Risk Center</h1>
            <p className="page-subtitle">
              Contact threat levels classified by high-frequency calling and messaging telemetry patterns.
            </p>
          </div>
        </div>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-state-icon" style={{ background: "rgba(255,107,74,0.1)", borderColor: "rgba(255,107,74,0.25)" }}>
            <AlertTriangle size={30} color="var(--color-gold)" strokeWidth={1.8} />
          </div>
          <div className="empty-state-title">No Dataset Loaded</div>
          <p className="empty-state-body">
            No CDR records found. Please ingest a dataset in the Upload Center to analyse entity threat levels.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {riskCards.map((card, i) => (
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
                  borderLeft: `3px solid ${card.color}`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <card.icon size={20} color={card.color} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 3 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: card.color, fontFamily: "var(--font-mono)" }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 4 }}>
                    {card.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Chart */}
          <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px", marginBottom: 24 }}>
            <div className="section-header">
              <div className="section-title">
                <BarChart3 size={16} className="section-title-icon" />
                Contact Interaction Density
              </div>
              <span style={{ fontSize: 11, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>
                Top 10 contacts
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 45, 54, 0.8)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="transparent"
                  tick={{ fill: "var(--color-text-subtle)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fill: "var(--color-text-subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.level === "critical"
                          ? "#ff6b4a"
                          : entry.level === "suspicious"
                          ? "var(--color-accent)"
                          : "var(--color-text-subtle)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
              {[
                { color: "#ff6b4a", label: "Critical (>30)" },
                { color: "var(--color-accent)", label: "Suspicious (11–30)" },
                { color: "var(--color-text-subtle)", label: "Nominal (≤10)" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-text-muted)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Threat Matrix */}
          <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px" }}>
            <div className="section-header">
              <div className="section-title">
                <Octagon size={16} className="section-title-icon" style={{ color: "var(--color-gold)" }} />
                Entity Threat Matrix
              </div>
              <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>
                {topContacts.length} contacts
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Contact Number</th>
                    <th>Forensic Interactions</th>
                    <th>Threat Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([number, count], idx) => {
                    const isCritical   = count > 30;
                    const isSuspicious = count > 10;
                    const cellColor = isCritical ? "#ff6b4a" : isSuspicious ? "var(--color-accent)" : "var(--color-text-muted)";
                    const cellBg    = isCritical ? "rgba(255,107,74,0.08)" : isSuspicious ? "rgba(0,212,245,0.07)" : "rgba(77,125,138,0.08)";
                    const label     = isCritical ? "Critical" : isSuspicious ? "Suspicious" : "Nominal";

                    return (
                      <tr key={idx}>
                        <td style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                          {number}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                height: 4,
                                width: Math.max(20, Math.min(100, (count / topContacts[0][1]) * 100)),
                                borderRadius: 2,
                                background: cellColor,
                                opacity: 0.7,
                              }}
                            />
                            <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>
                              {count}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 10px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              background: cellBg,
                              color: cellColor,
                              border: `1px solid ${cellColor}30`,
                            }}
                          >
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default RiskCenter;