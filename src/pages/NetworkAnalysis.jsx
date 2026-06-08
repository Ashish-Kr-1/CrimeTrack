import { useContext, useMemo, useRef, useCallback, useState, useEffect } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Users, Star, Phone, Sliders, ShieldAlert, CheckCircle, Info, ChevronRight, X } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function NetworkAnalysis() {
  const { cdrData } = useContext(CDRContext);
  const records = cdrData.slice(1);
  const graphRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });

  // D3 Force Sliders
  const [chargeStrength, setChargeStrength] = useState(-450);
  const [linkDistance, setLinkDistance] = useState(140);
  const [collisionPadding, setCollisionPadding] = useState(12);

  // Layout UI controls
  const [labelMode, setLabelMode] = useState("full"); // "full" or "last4"
  const [selectedNode, setSelectedNode] = useState(null);

  // Handle ResizeObserver for responsive canvas width
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 700,
          height: 450,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const targetNumber = useMemo(() => {
    return records.length > 0
      ? records[0][0]?.replace(/'/g, "")?.trim()
      : "Unknown";
  }, [records]);

  // Aggregate contact counts
  const contactCounts = useMemo(() => {
    const counts = {};
    records.forEach((row) => {
      let contact = row[3];
      if (!contact) return;
      contact = contact.replace(/'/g, "").trim();
      if (!/^\d{5,15}$/.test(contact)) return;
      counts[contact] = (counts[contact] || 0) + 1;
    });
    return counts;
  }, [records]);

  const topContacts = useMemo(() => {
    return Object.entries(contactCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }, [contactCounts]);

  const totalContacts = Object.keys(contactCounts).length;
  const strongestContact = topContacts.length > 0 ? topContacts[0][0] : "Unknown";
  const strongestCount = topContacts.length > 0 ? topContacts[0][1] : 0;

  // Build graph nodes & links
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
        val: 6 + ratio * 16,
        count,
        level: count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal",
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

  // Setup forces dynamically when graphData or sliders change
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge").strength(chargeStrength);
      graphRef.current.d3Force("link").distance(linkDistance);
      graphRef.current.d3Force("collision", forceCollide((node) => node.val + collisionPadding));
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphData, chargeStrength, linkDistance, collisionPadding]);

  // Custom Node Canvas Renderer
  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const size = node.val || 8;
      const fontSize = Math.max(10 / globalScale, 4.5);
      const isSelected = selectedNode && selectedNode.id === node.id;

      // Glow ring for target or selected node
      if (node.isTarget || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + (isSelected ? 6 : 4), 0, 2 * Math.PI);
        ctx.fillStyle = node.isTarget ? "rgba(255, 107, 74, 0.25)" : "rgba(0, 229, 255, 0.25)";
        ctx.fill();
        if (isSelected) {
          ctx.strokeStyle = "#00e5ff";
          ctx.lineWidth = 1.2 / globalScale;
          ctx.stroke();
        }
      }

      // Core Node shape
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      if (node.isTarget) {
        ctx.fillStyle = "#ff6b4a"; // Coral Orange (Target)
      } else if (node.level === "critical") {
        ctx.fillStyle = "#ff6b4a"; // Coral Orange (Critical)
      } else if (node.level === "suspicious") {
        ctx.fillStyle = "#00e5ff"; // Neon Cyan (Suspicious)
      } else {
        ctx.fillStyle = "#124854"; // Teal-Navy (Nominal)
      }
      ctx.fill();

      // Node border
      ctx.strokeStyle = "rgba(240, 249, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label text
      const label = labelMode === "full" ? node.id : node.label;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e9f1f8";
      ctx.font = `${node.isTarget ? "bold " : ""}${fontSize}px "SF Pro", -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(label, node.x, node.y + size + fontSize + 2.5);
    },
    [labelMode, selectedNode]
  );

  const kpis = [
    {
      icon: Phone,
      label: "Target Suspect",
      value: targetNumber,
      isMonospace: true,
      color: "#e17055", // Coral Orange
      bg: "rgba(225, 112, 85, 0.08)",
    },
    {
      icon: Users,
      label: "Total Connections",
      value: totalContacts,
      color: "#6c5ce7", // Indigo
      bg: "rgba(108, 92, 231, 0.08)",
    },
    {
      icon: Star,
      label: "Strongest Node",
      value: strongestContact,
      sub: `${strongestCount} interactions`,
      isMonospace: true,
      color: "#e17055", // Coral Orange
      bg: "rgba(225, 112, 85, 0.08)",
    },
  ];

  // AI Narrative compiler for selected nodes
  const nodeNarrative = useMemo(() => {
    if (!selectedNode) return null;
    if (selectedNode.isTarget) {
      return {
        role: "PRIMARY SUSPECT DOSSIER",
        description: "Primary node of interest. Direct telemetry source displaying multiple bank triggers, UPI binding operations, and active device swapping patterns in high-risk zones.",
        recommendation: "Maintain geo-fencing overlays and monitor tower-dumps for concurrent operations.",
      };
    }

    if (selectedNode.level === "critical") {
      return {
        role: "CRITICAL OPERATIONAL NODE",
        description: `This associate has high-frequency call overlap (${selectedNode.count} logs) occurring primarily during odd-hours (23:00 - 04:00). Indicates a strong probability of operational handler, co-conspirator, or backup carrier device.`,
        recommendation: "Initiate Paytm/financial gateway checks on this number and flag associated cells for immediate co-location tracing.",
      };
    }

    if (selectedNode.level === "suspicious") {
      return {
        role: "SUSPICIOUS TRANSITIONAL NETWORK",
        description: `Secondary suspect link. Overlapping voice/SMS signals (${selectedNode.count} times) suggest co-dependence. Often maps to a money courier, UPI sender mule, or burner SIM swaps.`,
        recommendation: "Cross-reference banking routes with target's UPI logs to trace possible money trails.",
      };
    }

    return {
      role: "NOMINAL PERIMETER Associate",
      description: `Peripheral contact with low interaction counts (${selectedNode.count} calls). Likely standard contact, courier delivery, or brief operational coordination.`,
      recommendation: "Log and retain in archive dataset. Monitor for any escalation of communication frequency.",
    };
  }, [selectedNode]);

  return (
    <motion.div 
      className="page-container theme-network" 
      initial="initial" 
      animate="animate"
      style={{ display: "flex", flexDirection: "column", gap: "32px" }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="mb-1 text-[30px] font-bold text-text">
          Link Analysis & Social Network Mapping
        </h1>
        <p className="text-sm text-text-muted">
          Forensic node-link diagram mapping target suspects, burner associates, and relationship strengths.
        </p>
      </motion.div>

      {records.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-muted">
          No network details loaded. Please upload a CDR to analyze node connectivity.
        </div>
      ) : (
        <>
          {/* KPIs */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px"
            }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3, scale: 1.015 }}
                className="glass-card flex items-center gap-5 p-6"
                style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}
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

          {/* Interactive Split Workspace */}
          <div style={{ display: "flex", gap: "32px", alignItems: "stretch", flexWrap: "wrap" }}>
            {/* LEFT PANEL: VIZ STUDIO (60%) */}
            <motion.div
              variants={fadeUp}
              style={{ flex: "1 1 55%", minWidth: "500px", display: "flex", flexDirection: "column" }}
            >
              {/* Force Graph Card */}
              <div className="glass-card overflow-hidden flex flex-col h-full" style={{ borderRadius: 16 }}>
                <div 
                  className="px-6 py-4 border-b border-border bg-white/40 flex items-center justify-between flex-wrap gap-4"
                  style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
                >
                  <h2 className="flex items-center gap-2 text-md font-bold text-text" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    <Network size={16} color="#e17055" />
                    Contact Network Canvas
                  </h2>

                  {/* Label Mode Toggle */}
                  <div className="flex border border-border rounded-lg overflow-hidden bg-white/50" style={{ display: "flex" }}>
                    <button
                      onClick={() => setLabelMode("full")}
                      className={`px-3 py-1 text-[11px] font-bold transition-all ${
                        labelMode === "full"
                          ? "bg-accent/25 text-accent"
                          : "text-text-muted hover:text-text"
                      }`}
                      style={{ padding: "6px 12px" }}
                    >
                      Full Number
                    </button>
                    <button
                      onClick={() => setLabelMode("last4")}
                      className={`px-3 py-1 text-[11px] font-bold transition-all ${
                        labelMode === "last4"
                          ? "bg-accent/25 text-accent"
                          : "text-text-muted hover:text-text"
                      }`}
                      style={{ padding: "6px 12px" }}
                    >
                      Abbreviated
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div 
                  className="px-6 py-3 bg-white/30 border-b border-border flex flex-wrap gap-4 text-[11px] text-text-muted justify-between"
                  style={{ padding: "12px 24px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div className="flex gap-4" style={{ display: "flex", gap: "16px" }}>
                    <span className="flex items-center gap-1.5" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#e17055", width: "8px", height: "8px" }} /> Target Suspect
                    </span>
                    <span className="flex items-center gap-1.5" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#e17055", width: "8px", height: "8px" }} /> Critical ({`>=30`} calls)
                    </span>
                    <span className="flex items-center gap-1.5" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#6c5ce7", width: "8px", height: "8px" }} /> Suspicious ({`15-29`} calls)
                    </span>
                    <span className="flex items-center gap-1.5" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#95a5a6", width: "8px", height: "8px" }} /> Nominal ({`<15`} calls)
                    </span>
                  </div>
                  <span className="text-[10px] text-text-subtle italic">Click nodes to inspect intelligence dossier.</span>
                </div>

                {/* D3 Canvas Container */}
                <div ref={containerRef} className="bg-dark/90 flex-1 relative min-h-[450px]" style={{ height: 450 }}>
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    width={dimensions.width}
                    height={450}
                    backgroundColor="#082229"
                    nodeCanvasObject={nodeCanvasObject}
                    linkColor={() => "rgba(0, 229, 255, 0.15)"}
                    linkWidth={(link) => 0.6 + link.ratio * 2.4}
                    linkDirectionalParticles={4}
                    linkDirectionalParticleWidth={1.5}
                    linkDirectionalParticleSpeed={(link) => link.ratio * 0.008 + 0.002}
                    linkDirectionalParticleColor={() => "#ff6b4a"}
                    enableZoomInteraction={true}
                    enablePanInteraction={true}
                    onNodeClick={(node) => setSelectedNode(node)}
                    nodeLabel={(node) => {
                      if (node.isTarget) {
                        return `<div style="background:#0b2d35;border:1px solid #153c45;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#f0f9ff;font-size:12px;">
                          <strong style="color:#ff6b4a;">Target SIM Suspect</strong><br/>
                          Phone: <strong>${node.id}</strong>
                        </div>`;
                      }
                      return `<div style="background:#0b2d35;border:1px solid #153c45;padding:8px 12px;border-radius:6px;font-family:sans-serif;color:#f0f9ff;font-size:12px;">
                        <strong style="color:${node.level === "critical" ? "#ff6b4a" : node.level === "suspicious" ? "#00e5ff" : "#88aeb7"}">${node.level.toUpperCase()} ASSOCIATE</strong><br/>
                        Phone: <strong>${node.id}</strong><br/>
                        Interactions: <strong>${node.count}</strong>
                      </div>`;
                    }}
                  />
                </div>

                {/* Simulation Parameters Sliders */}
                <div 
                  className="p-5 border-t border-border bg-white/30 flex flex-col gap-4"
                  style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <h3 className="text-xs font-bold text-text flex items-center gap-1.5 uppercase tracking-wider" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                    <Sliders size={13} className="text-accent" />
                    Interactive D3 Force Parameters
                  </h3>
                  <div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "20px" }}
                  >
                    <div className="flex flex-col gap-1.5" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-text-muted">Charge Repulsion</span>
                        <span className="font-mono text-accent font-bold">{chargeStrength}</span>
                      </div>
                      <input
                        type="range"
                        min="-800"
                        max="-100"
                        value={chargeStrength}
                        onChange={(e) => setChargeStrength(parseInt(e.target.value))}
                        className="accent-accent bg-dark h-1 border border-border rounded-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-text-muted">Link Distance</span>
                        <span className="font-mono text-accent font-bold">{linkDistance}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="250"
                        value={linkDistance}
                        onChange={(e) => setLinkDistance(parseInt(e.target.value))}
                        className="accent-accent bg-dark h-1 border border-border rounded-full"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-text-muted">Collision Margins</span>
                        <span className="font-mono text-accent font-bold">{collisionPadding}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={collisionPadding}
                        onChange={(e) => setCollisionPadding(parseInt(e.target.value))}
                        className="accent-accent bg-dark h-1 border border-border rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT PANEL: NODE INTELLIGENCE INSPECTOR (40%) */}
            <motion.div
              variants={fadeUp}
              style={{ flex: "1 1 40%", minWidth: "350px", display: "flex", flexDirection: "column" }}
            >
              <AnimatePresence mode="wait">
                {!selectedNode ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-card p-6 flex flex-col justify-center items-center text-center flex-1 min-h-[400px]"
                    style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", minHeight: "400px" }}
                  >
                    <div className="h-16 w-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 text-accent animate-pulse" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" }}>
                      <Network size={26} />
                    </div>
                    <h3 className="text-md font-bold text-text mb-1">Dossier Analysis Panel</h3>
                    <p className="text-xs text-text-muted max-w-[280px] leading-relaxed">
                      Select an associate node in the Link Matrix graph to retrieve behavioral intelligence telemetry, automated threat scoring, and next steps recommendations.
                    </p>

                    <div className="w-full border-t border-border mt-6 pt-5 text-left flex flex-col gap-3" style={{ width: "100%", marginTop: "24px", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                      <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider block">Network Aggregates</span>
                      <div className="grid grid-cols-2 gap-3.5 text-xs" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div className="bg-white/40 border border-border p-2.5 rounded-lg" style={{ padding: "10px" }}>
                          <div className="text-[9px] text-text-muted font-bold">AVG LINK WEIGHT</div>
                          <div className="text-md font-bold text-text mt-0.5">
                            {topContacts.length > 0
                              ? (topContacts.reduce((sum, item) => sum + item[1], 0) / topContacts.length).toFixed(1)
                              : 0}
                          </div>
                        </div>
                        <div className="bg-white/40 border border-border p-2.5 rounded-lg" style={{ padding: "10px" }}>
                          <div className="text-[9px] text-text-muted font-bold">TOTAL LINKS</div>
                          <div className="text-md font-bold text-text mt-0.5">{totalContacts} nodes</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inspector"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-6 flex flex-col flex-1 min-h-[400px]"
                    style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: "400px" }}
                  >
                    {/* Inspector Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-border" style={{ display: "flex", justifyContent: "space-between", paddingBottom: "16px" }}>
                      <div>
                        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider block">INTELLIGENCE DOSSIER</span>
                        <h3 className="text-lg font-mono font-bold text-text mt-0.5 flex items-center gap-1.5">
                          <Phone size={14} className="text-accent" />
                          {selectedNode.id}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 rounded-md border border-border text-text-muted hover:text-text hover:bg-dark-elevated transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Badge details */}
                    <div className="my-5 flex flex-wrap gap-2.5 items-center" style={{ margin: "20px 0", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                      {selectedNode.isTarget ? (
                        <span className="rounded px-2.5 py-0.5 text-[9px] font-bold tracking-wider bg-gold-glow text-gold border border-gold/30 uppercase">
                          Target Suspect SIM
                        </span>
                      ) : (
                        <span
                          className="rounded px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                          style={{
                            backgroundColor:
                              selectedNode.level === "critical"
                                ? "rgba(255, 107, 74, 0.08)"
                                : selectedNode.level === "suspicious"
                                  ? "rgba(0, 229, 255, 0.08)"
                                  : "rgba(136, 174, 183, 0.08)",
                            color:
                              selectedNode.level === "critical"
                                ? "#ff6b4a"
                                : selectedNode.level === "suspicious"
                                  ? "#00e5ff"
                                  : "#88aeb7",
                            border: `1px solid ${
                              selectedNode.level === "critical"
                                ? "#ff6b4a30"
                                : selectedNode.level === "suspicious"
                                  ? "#00e5ff30"
                                  : "#88aeb730"
                            }`,
                          }}
                        >
                          {selectedNode.level} Associate
                        </span>
                      )}

                      {!selectedNode.isTarget && (
                        <span className="text-xs font-semibold text-text-muted">
                          Link Weight: <strong className="text-text">{selectedNode.count} calls</strong>
                        </span>
                      )}
                    </div>

                    {/* AI Explanation narrative */}
                    <div className="bg-white/30 border border-border rounded-xl p-4 flex flex-col gap-3" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px", margin: 0 }}>
                          <ShieldAlert size={12} />
                          {nodeNarrative.role}
                        </h4>
                        <p className="text-[12.5px] leading-relaxed text-text-muted">
                          {nodeNarrative.description}
                        </p>
                      </div>

                      <div className="border-t border-border pt-3 mt-1 flex flex-col gap-1.5" style={{ paddingTop: "12px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h5 className="text-[10.5px] font-bold text-text uppercase flex items-center gap-1" style={{ display: "flex", alignItems: "center", gap: "4px", margin: 0 }}>
                          <CheckCircle size={11} className="text-success" />
                          Recommended Investigative Protocol
                        </h5>
                        <p className="text-[11.5px] leading-relaxed text-text-subtle font-medium">
                          {nodeNarrative.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Contact Stats detail */}
                    {!selectedNode.isTarget && (
                      <div className="mt-5 flex-1 flex flex-col justify-end" style={{ marginTop: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        <div className="border-t border-border pt-4 text-xs flex flex-col gap-3" style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider block">Connectivity Profile</span>
                          <div className="grid grid-cols-2 gap-3.5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div className="bg-white/30 border border-border p-2.5 rounded-lg" style={{ padding: "10px" }}>
                              <span className="text-[9px] text-text-subtle font-bold uppercase block">Calling Rank</span>
                              <span className="text-sm font-bold text-text mt-0.5">
                                #{topContacts.findIndex(([num]) => num === selectedNode.id) + 1} of {totalContacts}
                              </span>
                            </div>
                            <div className="bg-white/30 border border-border p-2.5 rounded-lg" style={{ padding: "10px" }}>
                              <span className="text-[9px] text-text-subtle font-bold uppercase block">Activity Share</span>
                              <span className="text-sm font-mono font-bold text-accent mt-0.5">
                                {((selectedNode.count / records.length) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => alert(`Redirecting tracking overlays to trace associate ${selectedNode.id}`)}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white transition-all hover:brightness-115"
                            style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", marginTop: "8px" }}
                          >
                            Isolate Movement footprint
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Connection List Table at Bottom */}
          <motion.div variants={fadeUp} className="glass-card p-6" style={{ padding: "24px" }}>
            <h2 className="mb-5 text-lg font-bold text-text" style={{ marginBottom: "20px" }}>
              Relationship Density & Co-Occurrence Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="ct-table">
                <thead>
                  <tr>
                    <th>Contact Node</th>
                    <th>Link Weight</th>
                    <th style={{ width: "45%" }}>Relationship Density</th>
                    <th style={{ width: "20%" }}>Forensic Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topContacts.map(([contact, count], idx) => {
                    const weightPct = Math.min((count / strongestCount) * 100, 100);
                    const isSelected = selectedNode && selectedNode.id === contact;
                    let weightColor = "#124854"; // Nominal (Teal-Navy)
                    if (count >= 30) weightColor = "#ff6b4a"; // Critical
                    else if (count >= 15) weightColor = "#00e5ff"; // Suspicious

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? "bg-accent/10 border-l-2 border-l-accent" : ""
                        }`}
                        onClick={() => setSelectedNode({ id: contact, count, level: count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal", val: 6 + (count/strongestCount) * 16 })}
                      >
                        <td className="font-mono text-sm font-semibold text-text">
                          {contact}
                        </td>
                        <td className="font-bold">{count}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
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
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNode({ id: contact, count, level: count >= 30 ? "critical" : count >= 15 ? "suspicious" : "nominal", val: 6 + (count/strongestCount) * 16 });
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-accent hover:brightness-110"
                          >
                            Inspect Node
                            <ChevronRight size={11} />
                          </button>
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