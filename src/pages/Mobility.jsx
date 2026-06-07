import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Radio, Globe, Clock, MapPin } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function Mobility() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);

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
  const lastActivity =
    latestMovement.length > 0
      ? `${latestMovement[6]} ${latestMovement[7]}`
      : "Unknown";

  const kpis = [
    {
      icon: Radio,
      label: "Unique Towers",
      value: uniqueTowers,
      color: "#3b5fab",
      bg: "rgba(59, 95, 171, 0.08)",
    },
    {
      icon: Globe,
      label: "Primary Cell Tower",
      value: mostUsedTower,
      isMonospace: true,
      color: "#c18833",
      bg: "rgba(193, 136, 51, 0.08)",
    },
    {
      icon: Clock,
      label: "Last Logged Activity",
      value: lastActivity,
      color: "#2d8a5e",
      bg: "rgba(45, 138, 94, 0.08)",
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
          Mobility Tracker & Intelligence
        </h1>
        <p className="text-sm text-text-muted">
          Chronological spatial mapping and cell tower transition footprints
          logged from target activity.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No records loaded. Please upload a dataset in the Upload Center to
          trace cellular mobility.
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
                    className={`mt-0.5 truncate text-text ${kpi.isMonospace ? "font-mono text-[14px] font-bold" : "text-xl font-bold"}`}
                    style={kpi.isMonospace ? { color: kpi.color } : undefined}
                  >
                    {kpi.value}
                  </h2>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
            {/* Timeline */}
            <motion.div variants={fadeUp} className="glass-card p-6 lg:col-span-7">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-text">
                <MapPin size={18} color="#3b5fab" />
                Chronological Hops Timeline
              </h2>

              <div className="flex flex-col pl-2">
                {recentMovements.map((row, idx) => (
                  <div
                    key={idx}
                    className="relative flex gap-5"
                    style={{
                      paddingBottom:
                        idx === recentMovements.length - 1 ? 0 : 24,
                    }}
                  >
                    {/* Connecting line */}
                    {idx !== recentMovements.length - 1 && (
                      <div
                        className="absolute left-[8px] top-5 bottom-0 w-[2px]"
                        style={{ backgroundColor: "#1e2e52" }}
                      />
                    )}

                    {/* Node dot */}
                    <div
                      className="z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor:
                          idx === 0 ? "#3b5fab" : "#0c162d",
                        border: `3px solid ${idx === 0 ? "rgba(59, 95, 171, 0.4)" : "#1e2e52"}`,
                        boxShadow:
                          idx === 0
                            ? "0 0 12px rgba(59, 95, 171, 0.5)"
                            : "none",
                      }}
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-subtle">
                          {row[6]} @ {row[7]}
                        </span>
                        {idx === 0 && (
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                            style={{
                              backgroundColor: "rgba(45, 138, 94, 0.12)",
                              color: "#2d8a5e",
                            }}
                          >
                            LATEST HOP
                          </span>
                        )}
                      </div>
                      <h4 className="font-mono text-sm font-semibold text-text">
                        CGI: {row[10]}
                      </h4>
                      <p className="mt-1 text-xs text-text-muted">
                        Service: {row[14] || "Unknown"} | Type:{" "}
                        {row[1] || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Towers */}
            <motion.div variants={fadeUp} className="glass-card p-6 lg:col-span-5">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-text">
                <Radio size={18} color="#c18833" />
                Top Cellular Anchors
              </h2>
              <div className="overflow-x-auto">
                <table className="ct-table">
                  <thead>
                    <tr>
                      <th>Tower CGI</th>
                      <th>Total Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTowers.map(([tower, count], idx) => (
                      <tr key={idx}>
                        <td
                          className="font-mono text-[13px] font-semibold"
                          style={{ color: "#3b5fab" }}
                        >
                          {tower}
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

export default Mobility;