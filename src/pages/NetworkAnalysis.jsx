import { useContext, useMemo, useRef, useCallback, useState, useEffect } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { Network, Users, Star, Phone } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function NetworkAnalysis() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: 420
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(-400);
      graphRef.current.d3Force("link").distance(130);
    }
  }, [graphData]);

  const targetNumber =
    records.length > 0
      ? records[0][0]?.replace(/'/g, "")?.trim()
      : "Unknown";

  const contactCounts = {};
  records.forEach((row) => {
    let contact = row[3];
    if (!contact) return;
    contact = contact.replace(/'/g, "").trim();
    if (!/^\d{5,15}$/.test(contact)) return;
    contactCounts[contact] = (contactCounts[contact] || 0) + 1;
  });

  const topContacts = Object.entries(contactCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const totalContacts = Object.keys(contactCounts).length;
  const strongestContact =
    topContacts.length > 0 ? topContacts[0][0] : "Unknown";
  const strongestCount = topContacts.length > 0 ? topContacts[0][1] : 0;

  // Build graph data for force graph
  const graphData = useMemo(() => {
    if (topContacts.length === 0) return { nodes: [], links: [] };

    const nodes = [
      {
        id: targetNumber,
        label: targetNumber,
        val: 28,
        isTarget: true,
      },
    ];

    const links = [];
    const maxCount = topContacts[0][1];

    topContacts.forEach(([contact, count]) => {
      const ratio = count / maxCount;
      nodes.push({
        id: contact,
        label: contact.slice(-4),
        val: 5 + ratio * 18,
        count,
        level:
          count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal",
      });
      links.push({
        source: targetNumber,
        target: contact,
        value: count,
        ratio,
      });
    });

    return { nodes, links };
  }, [topContacts, targetNumber]);

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const size = node.val || 8;
      const fontSize = Math.max(10 / globalScale, 3);

      // Glow effect
      if (node.isTarget) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(59, 95, 171, 0.15)";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      if (node.isTarget) {
        ctx.fillStyle = "#3b5fab";
      } else if (node.level === "critical") {
        ctx.fillStyle = "#c93c3c";
      } else if (node.level === "suspicious") {
        ctx.fillStyle = "#c18833";
      } else {
        ctx.fillStyle = "#23356e";
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(233, 241, 248, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e9f1f8";
      ctx.font = `${node.isTarget ? "bold " : ""}${fontSize}px "SF Pro", -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(node.label, node.x, node.y + size + fontSize + 2);
    },
    []
  );

  const linkCanvasObject = useCallback(
    (link, ctx) => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.strokeStyle = `rgba(59, 95, 171, ${0.1 + link.ratio * 0.4})`;
      ctx.lineWidth = 0.5 + link.ratio * 2.5;
      ctx.stroke();
    },
    []
  );

  const kpis = [
    {
      icon: Phone,
      label: "Target Suspect",
      value: targetNumber,
      isMonospace: true,
      color: "#3b5fab",
      bg: "rgba(59, 95, 171, 0.08)",
    },
    {
      icon: Users,
      label: "Total Connections",
      value: totalContacts,
      color: "#c18833",
      bg: "rgba(193, 136, 51, 0.08)",
    },
    {
      icon: Star,
      label: "Strongest Node",
      value: strongestContact,
      sub: `${strongestCount} weight`,
      isMonospace: true,
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
          Network Analysis Matrix
        </h1>
        <p className="text-sm text-text-muted">
          Target node calling/messaging linkage graphs and relationship
          densities.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No network details loaded. Please upload a CDR to analyze node
          connectivity.
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
                    className={`mt-0.5 truncate ${kpi.isMonospace ? "font-mono text-[14px] font-bold" : "text-xl font-bold text-text"}`}
                    style={kpi.isMonospace ? { color: kpi.color } : undefined}
                  >
                    {kpi.value}
                  </h2>
                  {kpi.sub && (
                    <div className="mt-0.5 text-[11px] text-text-subtle">
                      {kpi.sub}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Force Graph */}
          {graphData.nodes.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="glass-card mb-8 overflow-hidden"
              style={{ borderRadius: 16 }}
            >
              <div className="px-6 pt-5 pb-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                  <Network size={18} color="#3b5fab" />
                  Contact Network Graph
                </h2>
              </div>
              <div ref={containerRef} style={{ height: 420 }}>
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  width={dimensions.width}
                  height={dimensions.height}
                  backgroundColor="#0c162d"
                  nodeCanvasObject={nodeCanvasObject}
                  linkCanvasObject={linkCanvasObject}
                  cooldownTicks={60}
                  d3AlphaDecay={0.04}
                  d3VelocityDecay={0.3}
                  enableZoomInteraction={true}
                  enablePanInteraction={true}
                  nodeLabel={(node) => {
                    if (node.isTarget) {
                      return `<div style="background:#111d38;border:1px solid #1e2e52;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#e9f1f8;">
                        <strong style="color:#3b5fab;">Target SIM Suspect</strong><br/>
                        Phone: ${node.id}
                      </div>`;
                    }
                    return `<div style="background:#111d38;border:1px solid #1e2e52;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#e9f1f8;">
                      <strong style="color:${node.level === "critical" ? "#c93c3c" : node.level === "suspicious" ? "#c18833" : "#3b5fab"}">${node.level.toUpperCase()} ASSOCIATE</strong><br/>
                      Phone: ${node.id}<br/>
                      Interactions: ${node.count}
                    </div>`;
                  }}
                  linkLabel={(link) => {
                    return `<div style="background:#111d38;border:1px solid #1e2e52;padding:6px 10px;border-radius:6px;font-family:sans-serif;color:#e9f1f8;font-size:11px;">
                      Interactions: <strong>${link.value}</strong>
                    </div>`;
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Connection Matrix Table */}
          <motion.div variants={fadeUp} className="glass-card p-6">
            <h2 className="mb-5 text-lg font-bold text-text">
              Associated Nodes & Link Densities
            </h2>
            <div className="overflow-x-auto">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Contact Node</th>
                    <th>Link Weight</th>
                    <th style={{ width: "40%" }}>Relationship Density</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([contact, count], idx) => {
                    const weightPct = Math.min(
                      (count / strongestCount) * 100,
                      100
                    );
                    const weightColor =
                      count >= 30
                        ? "#c93c3c"
                        : count >= 15
                          ? "#c18833"
                          : "#2d8a5e";
                    return (
                      <tr key={idx}>
                        <td className="font-mono text-sm font-semibold text-text">
                          {contact}
                        </td>
                        <td className="font-bold">{count}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-elevated">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${weightPct}%`,
                                  backgroundColor: weightColor,
                                }}
                              />
                            </div>
                            <span className="min-w-[30px] text-right text-[11px] font-semibold text-text-subtle">
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
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default NetworkAnalysis;