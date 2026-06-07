import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Octagon, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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

  const highRisk = topContacts.filter(([, c]) => c > 30).length;
  const mediumRisk = topContacts.filter(([, c]) => c > 10 && c <= 30).length;
  const lowRisk = topContacts.filter(([, c]) => c <= 10).length;

  const chartData = topContacts.slice(0, 10).map(([num, count]) => ({
    name: num.slice(-4),
    value: count,
    full: num,
    level: count > 30 ? "critical" : count > 10 ? "suspicious" : "nominal",
  }));

  const riskCards = [
    {
      icon: Octagon,
      label: "Critical Nodes",
      value: highRisk,
      color: "#c93c3c",
      bg: "rgba(201, 60, 60, 0.1)",
      border: "#c93c3c",
    },
    {
      icon: AlertTriangle,
      label: "Suspicious Nodes",
      value: mediumRisk,
      color: "#c18833",
      bg: "rgba(193, 136, 51, 0.1)",
      border: "#c18833",
    },
    {
      icon: CheckCircle2,
      label: "Stable Contacts",
      value: lowRisk,
      color: "#2d8a5e",
      bg: "rgba(45, 138, 94, 0.1)",
      border: "#2d8a5e",
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
          Entity Risk Intelligence Center
        </h1>
        <p className="text-sm text-text-muted">
          Target node threat levels classified by high-frequency calling and
          messaging telemetry patterns.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No CDR records loaded. Please ingest a dataset to check entity threat
          levels.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <motion.div
            variants={fadeUp}
            className="mb-8 grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {riskCards.map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.015 }}
                className="glass-card flex items-center gap-4 p-5"
                style={{ borderLeft: `4px solid ${card.border}` }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: card.bg,
                    borderColor: `${card.color}30`,
                  }}
                >
                  <card.icon size={20} color={card.color} strokeWidth={2.2} />
                </div>
                <div>
                  <span className="text-xs font-medium text-text-muted">
                    {card.label}
                  </span>
                  <h2
                    className="mt-0.5 text-2xl font-bold"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </h2>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Risk Distribution Bar Chart */}
          <motion.div variants={fadeUp} className="glass-card mb-8 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-text">
              <BarChart3 size={18} color="#3b5fab" />
              Contact Interaction Density
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#5a6f94"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#5a6f94" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111d38",
                    border: "1px solid #1e2e52",
                    borderRadius: 10,
                    color: "#e9f1f8",
                    fontSize: 12,
                  }}
                  formatter={(val, name, props) => [
                    `${val} interactions`,
                    props.payload.full,
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.level === "critical"
                          ? "#c93c3c"
                          : entry.level === "suspicious"
                            ? "#c18833"
                            : "#2d8a5e"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Threat Matrix Table */}
          <motion.div variants={fadeUp} className="glass-card p-6">
            <h2 className="mb-5 text-lg font-bold text-text">
              Entity Threat Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Contact Number</th>
                    <th>Forensic Interactions</th>
                    <th>Threat Level</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([number, count], idx) => {
                    const cellColor =
                      count > 30
                        ? "#c93c3c"
                        : count > 10
                          ? "#c18833"
                          : "#2d8a5e";
                    const cellBg =
                      count > 30
                        ? "rgba(201, 60, 60, 0.08)"
                        : count > 10
                          ? "rgba(193, 136, 51, 0.08)"
                          : "rgba(45, 138, 94, 0.08)";
                    return (
                      <tr key={idx}>
                        <td className="font-mono text-sm font-semibold text-text">
                          {number}
                        </td>
                        <td className="font-bold">{count}</td>
                        <td>
                          <span
                            className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{
                              backgroundColor: cellBg,
                              color: cellColor,
                              border: `1px solid ${cellColor}30`,
                            }}
                          >
                            {count > 30
                              ? "Critical"
                              : count > 10
                                ? "Suspicious"
                                : "Nominal"}
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