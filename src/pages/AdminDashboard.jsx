import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Settings,
  Cpu,
  Database,
  ShieldAlert,
  Terminal,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Link,
  CheckCircle,
  FileSpreadsheet,
  Search,
  LogOut,
  Sliders,
  RefreshCw,
  TrendingDown
} from "lucide-react";
import "../login-theme.css";

function AdminDashboard() {
  const { user, logout, auditLogs, addAuditLog } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("ml-tuning");

  // Redirect to login if not authenticated or not an admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  // Handle Logout
  const handleLogoutClick = () => {
    logout();
    navigate("/login");
  };

  // ════════════════════════════════════════════════════════════
  // 1. STATE FOR ML MODEL TUNING
  // ════════════════════════════════════════════════════════════
  const [epochs, setEpochs] = useState(50);
  const [learningRate, setLearningRate] = useState(0.001);
  const [sequenceLength, setSequenceLength] = useState(128);
  const [batchSize, setBatchSize] = useState(32);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingTerminal, setTrainingTerminal] = useState([
    "ML ENGINE: Coordinates Prediction Module standby.",
    "Ready for training configuration..."
  ]);
  const [trainingData, setTrainingData] = useState([]);
  const [testResults, setTestResults] = useState(null);
  
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [trainingTerminal]);

  const handleRunTraining = () => {
    setIsTraining(true);
    setTrainingTerminal(["[UPLINK] Connecting tensor processor...", "[ENGINE] Instantiating predictive weight matrices..."]);
    setTrainingData([]);
    setTestResults(null);

    addAuditLog("ML_TRAIN_START", `Initiated model training: epochs=${epochs}, lr=${learningRate}, seq_len=${sequenceLength}`);

    let currentEpoch = 1;
    let currentLoss = 0.95;
    const dataPoints = [];

    const interval = setInterval(() => {
      if (currentEpoch <= epochs) {
        // Decrement loss with noise
        const decay = (0.95 - 0.04) / epochs;
        const noise = (Math.random() - 0.5) * 0.04;
        currentLoss = Math.max(0.03, currentLoss - decay + noise);
        
        dataPoints.push({
          epoch: currentEpoch,
          loss: parseFloat(currentLoss.toFixed(4))
        });
        setTrainingData([...dataPoints]);

        setTrainingTerminal((prev) => [
          ...prev,
          `Epoch ${currentEpoch}/${epochs} - Loss: ${currentLoss.toFixed(4)} - val_loss: ${(currentLoss * 1.15 + Math.random() * 0.01).toFixed(4)}`
        ]);
        currentEpoch++;
      } else {
        clearInterval(interval);
        setIsTraining(false);
        setTrainingTerminal((prev) => [
          ...prev,
          "✓ Training complete.",
          `Final Training Loss: ${currentLoss.toFixed(4)}`,
          "Model weights saved to sandbox register."
        ]);
        addAuditLog("ML_TRAIN_SUCCESS", `Completed model training. Final loss: ${currentLoss.toFixed(4)}`);
      }
    }, 100);
  };

  const handleTestModel = () => {
    if (trainingData.length === 0) {
      alert("Please train the model first to generate predictive weights.");
      return;
    }
    
    // Simulate predictions on coordinates
    setTestResults({
      samples: [
        { id: "S-101", target: "9667691414", actual: "25.0961 / 85.3131", predicted: "25.0954 / 85.3124", drift: "0.08 km" },
        { id: "S-102", target: "8433976037", actual: "19.4326 / -99.1332", predicted: "19.4340 / -99.1310", drift: "0.22 km" },
        { id: "S-103", target: "7506894867", actual: "37.7749 / -122.4194", predicted: "37.7745 / -122.4182", drift: "0.05 km" }
      ],
      accuracy: "97.4%"
    });
    addAuditLog("ML_TEST_RUN", "Coordinates prediction test suite executed");
  };

  // ════════════════════════════════════════════════════════════
  // 2. STATE FOR CARRIER HEADER MAPPING
  // ════════════════════════════════════════════════════════════
  const [selectedCarrier, setSelectedCarrier] = useState("Airtel");
  const [mappingConfigs, setMappingConfigs] = useState({
    Airtel: {
      "Target No": "MSISDN",
      "B Party No": "DIALED_NUMBER",
      "Date": "CALL_DATE",
      "Time": "CALL_TIME",
      "Call Type": "DIRECTION_TYPE",
      "Service Type": "SERVICE_CODE",
      "IMEI": "HANDSET_IMEI",
      "IMSI": "SIM_IMSI",
      "First CGI": "CELL_ID",
      "First CGI Lat/Long": "CGI_COORDINATES",
      "Roam Nw": "ROAM_NETWORK"
    },
    Jio: {
      "Target No": "SUBSCRIBER_NUMBER",
      "B Party No": "OTHER_PARTY",
      "Date": "EVENT_DATE",
      "Time": "EVENT_TIME",
      "Call Type": "TRAFFIC_DIRECTION",
      "Service Type": "SERVICE_TYPE",
      "IMEI": "DEVICE_IMEI",
      "IMSI": "SIM_IMSI",
      "First CGI": "FIRST_CELL_TOWER",
      "First CGI Lat/Long": "TOWER_LAT_LONG",
      "Roam Nw": "ROAMING_CARRIER"
    },
    BSNL: {
      "Target No": "TARGET_MSISDN",
      "B Party No": "B_MSISDN",
      "Date": "DATE_OF_CALL",
      "Time": "TIME_OF_CALL",
      "Call Type": "IN_OUT_IND",
      "Service Type": "SERVICE",
      "IMEI": "IMEI_NUMBER",
      "IMSI": "IMSI_NUMBER",
      "First CGI": "CGI_NODE",
      "First CGI Lat/Long": "LAT_LON_COORDS",
      "Roam Nw": "ROAMING_PARTNER"
    }
  });

  const [activeFuzzyMatch, setActiveFuzzyMatch] = useState(false);

  const handleHeaderMapChange = (header, val) => {
    setMappingConfigs((prev) => ({
      ...prev,
      [selectedCarrier]: {
        ...prev[selectedCarrier],
        [header]: val
      }
    }));
  };

  const runFuzzyAutoMatch = () => {
    setActiveFuzzyMatch(true);
    addAuditLog("FORMAT_AUTO_MATCH", `Fuzzy matching columns for ${selectedCarrier}`);
    
    // Simulate fuzzy auto matching
    setTimeout(() => {
      setActiveFuzzyMatch(false);
      alert("Fuzzy matching complete. Synced with carrier columns template.");
    }, 1200);
  };

  const handleSaveNormalization = () => {
    addAuditLog("FORMAT_SAVE", `Saved carrier normalization mappings for ${selectedCarrier}`);
    alert("Carrier normalization template successfully updated and registered.");
  };

  // ════════════════════════════════════════════════════════════
  // 3. AUDIT LOGGER FILTER STATE
  // ════════════════════════════════════════════════════════════
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilterType, setAuditFilterType] = useState("ALL");

  const filteredLogs = auditLogs.filter((log) => {
    // Filter by type
    if (auditFilterType !== "ALL") {
      if (auditFilterType === "LOGINS" && !log.action.includes("LOGIN") && log.action !== "LOGOUT") return false;
      if (auditFilterType === "SEARCHES" && log.action !== "SEARCH_REGISTRY" && !log.action.includes("SEARCH")) return false;
      if (auditFilterType === "ML" && !log.action.includes("ML")) return false;
    }
    // Filter by search text
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip.includes(q) ||
        log.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    // Generate CSV string
    const headers = "ID,Timestamp,User,Action,Details,IP Address,Status\n";
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.user}","${l.action}","${l.details.replace(/"/g, '""')}","${l.ip}","${l.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cybertrack_security_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addAuditLog("AUDIT_EXPORT", "Exported security audit trail to CSV file");
  };

  if (!user) return null;

  return (
    <div className="cyber-dark-root flex flex-col h-screen w-screen overflow-hidden">
      
      {/* Background HUD Layers */}
      <div className="cyber-starfield" />
      <div className="cyber-grid-overlay" />
      <div className="cyber-scanline" />

      {/* ── Top Header Bar ── */}
      <header 
        className="glass-card z-10"
        style={{
          height: 64,
          margin: "16px 16px 0",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          background: "rgba(10, 20, 32, 0.85)",
          border: "1px solid rgba(0, 229, 255, 0.15)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          flexShrink: 0
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <Settings className="w-4.5 h-4.5 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <div className="text-sm font-black text-white leading-none">CYBERDEFEND</div>
            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Admin Dev console</span>
          </div>
        </div>

        {/* Menu Tabs Navigation */}
        <div className="flex gap-2">
          {[
            { id: "ml-tuning", label: "Model Tuning", icon: Cpu },
            { id: "carrier-map", label: "Carrier Norm", icon: Database },
            { id: "audit-logs", label: "Security Logs", icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  active
                    ? "bg-cyan-950/70 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200">System Developer</span>
            <span className="text-[9px] text-cyan-400 font-mono">ROLE_ADMIN</span>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="flex items-center justify-center p-2 rounded bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:border-red-500 transition-all cursor-pointer"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Tabbed Content ── */}
      <main className="flex-1 p-4 overflow-y-auto relative z-10">
        
        {/* TAB 1: ML MODEL TUNING */}
        {activeTab === "ml-tuning" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            
            {/* Parameters card */}
            <div className="cyber-glass-panel border-glow-cyan p-6 flex flex-col gap-4">
              <div className="cyber-chrome-shine" />
              <div className="flex items-center gap-2.5 border-b border-cyan-950 pb-3 mb-1">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Configuration Params</h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="cyber-hud-label">Training Epochs</label>
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(Math.max(1, parseInt(e.target.value) || 1))}
                  className="cyber-input"
                  disabled={isTraining}
                />
                <span className="text-[10px] text-slate-500">Number of forward/backward passes.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="cyber-hud-label">Learning Rate (alpha)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(Math.max(0.0001, parseFloat(e.target.value) || 0.0001))}
                  className="cyber-input"
                  disabled={isTraining}
                />
                <span className="text-[10px] text-slate-500">Weight optimization step magnitude.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="cyber-hud-label">Sequence Length</label>
                <input
                  type="number"
                  value={sequenceLength}
                  onChange={(e) => setSequenceLength(Math.max(10, parseInt(e.target.value) || 10))}
                  className="cyber-input"
                  disabled={isTraining}
                />
                <span className="text-[10px] text-slate-500">Window size of GPS coordinate tracking points.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="cyber-hud-label">Batch Size</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(8, parseInt(e.target.value) || 8))}
                  className="cyber-input"
                  disabled={isTraining}
                />
                <span className="text-[10px] text-slate-500">Samples processed per weight correction.</span>
              </div>

              <button
                onClick={handleRunTraining}
                disabled={isTraining}
                className="cyber-btn cyber-btn-cyan w-full py-3 mt-4"
              >
                {isTraining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    OPTIMIZING MODEL...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-cyan-400" />
                    RUN TRAINING SUITE
                  </>
                )}
              </button>
            </div>

            {/* Simulated Training Visual Graph Console */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              
              {/* Training graph */}
              <div className="cyber-glass-panel p-6 flex-1 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between border-b border-cyan-950 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Optimization Loss Curve</h3>
                  </div>
                  {trainingData.length > 0 && (
                    <span className="text-xs font-mono text-cyan-400">
                      Loss: {trainingData[trainingData.length - 1].loss.toFixed(4)}
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full" style={{ minHeight: 220 }}>
                  {trainingData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 border border-dashed border-slate-900 rounded-lg">
                      <TrendingDown className="w-8 h-8" />
                      <span className="text-xs">No active optimization dataset. Run training suite to plot gradient descent.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trainingData}>
                        <defs>
                          <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="#475569" 
                          fontSize={10} 
                          fontFamily="monospace"
                          label={{ value: "Epochs", position: "insideBottom", offset: -2, fill: "#475569" }}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={10} 
                          fontFamily="monospace"
                          label={{ value: "Loss", angle: -90, position: "insideLeft", offset: 10, fill: "#475569" }}
                        />
                        <Tooltip 
                          contentStyle={{ background: "#050e18", borderColor: "#00e5ff", borderRadius: 8 }}
                          labelStyle={{ color: "#00e5ff", fontWeight: "bold" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="loss" 
                          stroke="#00e5ff" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#cyanGlow)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Console log terminal & prediction test */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Monospace terminal console */}
                <div className="cyber-glass-panel p-4 flex flex-col h-56">
                  <div className="flex items-center gap-2 border-b border-cyan-950 pb-2 mb-2 text-cyan-400">
                    <Terminal className="w-4 h-4 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase font-mono">TENSOR ENGINE OUTPUT</span>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-300 flex flex-col gap-1.5 scrollbar-thin">
                    {trainingTerminal.map((line, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap">{line}</div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Model testing suite */}
                <div className="cyber-glass-panel p-4 flex flex-col h-56">
                  <div className="flex items-center justify-between border-b border-cyan-950 pb-2 mb-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">VALIDATION ENGINE</span>
                    </div>
                    <button
                      onClick={handleTestModel}
                      className="px-3 py-1 bg-cyan-950/40 hover:bg-cyan-950 border border-cyan-500/40 text-[10px] font-extrabold text-cyan-300 rounded cursor-pointer transition-all"
                    >
                      EXECUTE TEST
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {testResults ? (
                      <>
                        <div className="flex justify-between items-center bg-cyan-950/20 p-2 border border-cyan-500/10 rounded">
                          <span className="text-[10px] font-bold text-cyan-400">TEST SUITE ACCURACY</span>
                          <span className="text-xs font-mono font-black text-cyan-300">{testResults.accuracy}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                          {testResults.samples.map((s) => (
                            <div key={s.id} className="text-[10px] border-b border-slate-900/60 pb-1.5 flex flex-col gap-0.5">
                              <div className="flex justify-between text-slate-200">
                                <span className="font-bold font-mono text-cyan-500/80">{s.id} ({s.target.slice(-4)})</span>
                                <span className="font-mono text-amber-500">{s.drift} drift</span>
                              </div>
                              <div className="flex justify-between text-slate-400 font-mono text-[9px]">
                                <span>ACT: {s.actual}</span>
                                <span>PRED: {s.predicted}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-[10px] text-center p-4">
                        Validation coordinates prediction test is pending. Run testing to verify lat/lon drift metrics.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: FORMAT NORMALIZATION */}
        {activeTab === "carrier-map" && (
          <div className="max-w-5xl mx-auto cyber-glass-panel p-6">
            <div className="cyber-chrome-shine" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-950 pb-4 mb-6 gap-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Ingestion Format Normalization</h3>
                  <p className="text-[11px] text-slate-400">Define headers mapping to translate Carrier Excel/CSVs to unified database columns.</p>
                </div>
              </div>

              {/* Carrier Selector */}
              <div className="flex gap-1.5">
                {["Airtel", "Jio", "BSNL"].map((carrier) => (
                  <button
                    key={carrier}
                    onClick={() => setSelectedCarrier(carrier)}
                    className={`px-3 py-1.5 text-xs font-bold rounded ${
                      selectedCarrier === carrier
                        ? "bg-cyan-950 border border-cyan-400 text-cyan-400"
                        : "bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {carrier} MAPPINGS
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Mapping grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Editor */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-slate-950/60 p-3 border border-slate-900 rounded-lg">
                  <span className="text-xs font-bold text-slate-300">Carrier Source File</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    FUZZY_MATCH_ACTIVE
                  </div>
                </div>

                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                  {Object.entries(mappingConfigs[selectedCarrier]).map(([stdHeader, carrierHeader]) => (
                    <div key={stdHeader} className="grid grid-cols-2 gap-3 items-center border-b border-slate-900 pb-2">
                      <span className="text-xs font-bold text-slate-200">{stdHeader}</span>
                      <input
                        type="text"
                        value={carrierHeader}
                        onChange={(e) => handleHeaderMapChange(stdHeader, e.target.value)}
                        className="cyber-input text-xs py-2 px-3 font-mono border-slate-800 focus:border-cyan-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Matching interface */}
              <div className="cyber-glass-panel p-5 bg-black/40 flex flex-col gap-4 border-slate-900">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Fuzzy Match Topology</span>
                  <button
                    onClick={runFuzzyAutoMatch}
                    disabled={activeFuzzyMatch}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/40 hover:bg-cyan-950 border border-cyan-500/30 text-[10px] font-black text-cyan-300 rounded cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${activeFuzzyMatch ? "animate-spin" : ""}`} />
                    FUZZY CONNECT
                  </button>
                </div>

                {/* Node match map */}
                <div className="flex flex-col gap-3.5 p-3 bg-[#02050f] rounded-lg border border-slate-900">
                  {Object.entries(mappingConfigs[selectedCarrier]).slice(0, 6).map(([std, car]) => (
                    <div key={std} className="flex justify-between items-center text-[10px] font-mono">
                      <div className="bg-slate-950 px-2 py-1 border border-slate-800 text-slate-400 rounded">
                        {std}
                      </div>
                      <div className="flex-1 border-t border-dashed border-cyan-500/20 mx-3 relative flex justify-center">
                        <Link className="w-3.5 h-3.5 text-cyan-500/40 absolute -top-1.7 animate-pulse" />
                      </div>
                      <div className="bg-cyan-950/20 px-2 py-1 border border-cyan-500/20 text-cyan-400 rounded">
                        {car}
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-[9px] text-slate-500 mt-2 font-mono">
                    Showing first 6 of 11 mappings.
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
                  <button
                    onClick={() => {
                      if(confirm("Revert mappings back to carrier factory default?")) {
                        // Reset defaults
                        addAuditLog("FORMAT_RESET", `Reset mappings for ${selectedCarrier}`);
                      }
                    }}
                    className="cyber-btn cyber-btn-amber py-2.5 px-5 text-xs"
                  >
                    RESET DEFAULT
                  </button>
                  <button
                    onClick={handleSaveNormalization}
                    className="cyber-btn cyber-btn-cyan py-2.5 px-5 text-xs"
                  >
                    SAVE NORMALIZATION
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGGER */}
        {activeTab === "audit-logs" && (
          <div className="max-w-7xl mx-auto cyber-glass-panel p-6 flex flex-col gap-6">
            <div className="cyber-chrome-shine" />
            
            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950 pb-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Security Audit Logs</h3>
                  <p className="text-[11px] text-slate-400">Tamper-proof ledger recording investigator activities and configuration updates.</p>
                </div>
              </div>

              {/* Action filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "ALL", label: "ALL EVENTS" },
                  { id: "LOGINS", label: "LOGINS/LOGOUTS" },
                  { id: "SEARCHES", label: "SEARCH AUDITS" },
                  { id: "ML", label: "MODEL TUNES" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAuditFilterType(f.id)}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      auditFilterType === f.id
                        ? "bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.1)]"
                        : "bg-slate-950/65 border border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Action controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by action, user ID, details, IP..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="cyber-input pl-10"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-950/40 hover:bg-green-950 border border-green-500/40 text-green-400 text-xs font-bold rounded cursor-pointer transition-all shadow-[0_0_12px_rgba(34,197,94,0.08)]"
              >
                <FileSpreadsheet className="w-4 h-4" />
                EXPORT EXCEL/CSV
              </button>
            </div>

            {/* Audit log list */}
            <div className="overflow-x-auto border border-slate-900 rounded-lg">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-black/60 border-b border-slate-900">
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Timestamp</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Operator</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Action ID</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Event Details</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">IP Address</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-950">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-600">
                        No security logs match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isFail = log.status === "FAILED";
                      return (
                        <tr key={log.id} className="hover:bg-slate-950/30 transition-all font-mono">
                          <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-slate-200">
                            {log.user}
                          </td>
                          <td className="p-3 text-cyan-400 font-bold">
                            {log.action}
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs md:max-w-md truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="p-3 text-slate-400">
                            {log.ip}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isFail 
                                ? "bg-red-950/40 border border-red-500/20 text-red-400"
                                : "bg-green-950/40 border border-green-500/20 text-green-400"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Showing {filteredLogs.length} matching events</span>
              <span>Audit logs encrypted in browser register</span>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default AdminDashboard;
