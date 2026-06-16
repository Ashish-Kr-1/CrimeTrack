import { useState, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, CheckCircle2, Loader, Shield, Lock,
  AlertTriangle, X, ChevronRight, Table2, Cpu, Zap,
  Eye, Clock, Trash2, ArrowRight,
} from "lucide-react";

/* ─── Column detection map — fuzzy regex patterns per column ──────────────── */
const KNOWN_COLS = [
  { pattern: /target.?no|a.?party|msisdn/i,          label: "Suspect's Phone Number",       critical: true  },
  { pattern: /b.?party|called.?no|contact.?no/i,     label: "Contact's Phone Number",       critical: true  },
  { pattern: /call.?type|event.?type|type/i,          label: "Type of Activity (Call/SMS)",  critical: true  },
  { pattern: /date|time|timestamp/i,                  label: "Date and Time",                critical: false },
  { pattern: /duration|dur/i,                         label: "Call Duration (seconds)",      critical: false },
  { pattern: /cgi|cell.?id|tower/i,                  label: "Tower Location Code",          critical: false },
  { pattern: /imei/i,                                 label: "Phone Device ID",              critical: false },
  { pattern: /roam/i,                                 label: "Roaming (Away from Home)",     critical: false },
  { pattern: /sms.?content|message|content/i,         label: "Message Text (if available)",  critical: false },
  { pattern: /circle|operator|teleop/i,               label: "Telecom Region / Circle",      critical: false },
];

/* ─── Processing steps shown during analysis ─────────────────────────────── */
const STEPS = [
  { id: "read",    label: "Reading file contents",         icon: FileText },
  { id: "detect",  label: "Detecting column structure",    icon: Table2 },
  { id: "parse",   label: "Parsing all records",           icon: Cpu },
  { id: "analyse", label: "Running 7 heuristic checks",   icon: Zap },
  { id: "done",    label: "Analysis complete — loading dashboard", icon: CheckCircle2 },
];

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

/* ─── Utility: format bytes ──────────────────────────────────────────────── */
const fmtBytes = (b) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

/* ─── Utility: now string ────────────────────────────────────────────────── */
const nowStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   UPLOAD CENTER
═══════════════════════════════════════════════════════════════════════════ */
function UploadCenter() {
  const { setCdrData } = useContext(CDRContext);
  const navigate       = useNavigate();
  const fileInputRef   = useRef(null);

  /* ── Stages: idle → preview → processing ── */
  const [stage,        setStage]        = useState("idle");
  const [isDragging,   setIsDragging]   = useState(false);
  const [pendingFile,  setPendingFile]  = useState(null);     // raw File object
  const [previewRows,  setPreviewRows]  = useState([]);       // first 8 rows
  const [detectedCols, setDetectedCols] = useState([]);       // { header, label, found, critical }
  const [rawRows,      setRawRows]      = useState([]);       // all parsed rows
  const [headerIdx,    setHeaderIdx]    = useState(0);
  const [processStep,  setProcessStep]  = useState(-1);
  const [uploads, setUploads] = useState([
    { fileName: "cdr_9520995378_1.csv",      type: "CDR Dataset",  status: "Completed", rows: "4,812",  date: "2026-06-07 12:44:11" },
    { fileName: "tower_dump_kolkata.xlsx",    type: "Tower Dump",   status: "Completed", rows: "12,290", date: "2026-06-07 11:20:00" },
    { fileName: "imei_suspect_rotations.csv", type: "Device Data",  status: "Processing",rows: "—",     date: "2026-06-07 14:02:15" },
  ]);

  /* ── File selected → immediately start processing ── */
  const startProcessing = useCallback((file) => {
    if (!file) return;
    setPendingFile(file);
    setStage("processing");
    setProcessStep(0);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    const reader = new FileReader();
    reader.onload = async (e) => {
      await delay(400); setProcessStep(1);

      const text = e.target.result;
      const rows = text
        .split("\n")
        .map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")))
        .filter(r => r.length > 1 && r.some(c => c.length > 0));

      await delay(400); setProcessStep(2);

      // find header row
      let hIdx = 0;
      for (let i = 0; i < Math.min(12, rows.length); i++) {
        if (rows[i].some(c => /Target No|B Party|Call Type|Date|Time/i.test(c))) {
          hIdx = i;
          break;
        }
      }

      await delay(600); setProcessStep(3);

      const dataRows = rows.slice(hIdx);
      setCdrData(dataRows);

      await delay(700); setProcessStep(4);

      setUploads(prev => [
        { fileName: file.name, type: "CDR Dataset", status: "Completed", rows: (dataRows.length - 1).toLocaleString(), date: nowStr() },
        ...prev,
      ]);

      await delay(500);
      navigate("/");
    };
    reader.readAsText(file);
  }, [setCdrData, navigate]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    startProcessing(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    startProcessing(e.target.files[0]);
    e.target.value = null;
  };

  return (
    <motion.div className="page-container theme-upload" variants={stagger} initial="initial" animate="animate">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UploadCloud size={18} color="var(--color-accent)" strokeWidth={2} />
          </div>
          <h1 className="page-title">Upload CDR File</h1>
        </div>
        <p className="page-subtitle">
          Upload a phone's Call Detail Record (CDR) from your telecom operator. The system will automatically analyse it for suspicious patterns — no technical knowledge needed.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            STAGE: IDLE — Drop Zone
        ══════════════════════════════════════════════════════ */}
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>

            {/* Drop zone */}
            <motion.div variants={fadeUp}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                marginBottom: 20, borderRadius: 20, cursor: "pointer", overflow: "hidden",
                border: isDragging ? "2px solid var(--color-accent)" : "2px dashed rgba(37,99,235,0.3)",
                background: isDragging ? "rgba(37,99,235,0.05)" : "rgba(255,255,255,0.65)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                transition: "all 0.22s ease",
                boxShadow: isDragging ? "0 0 40px rgba(37,99,235,0.1)" : "none",
              }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 40px", gap: 0 }}>
                <motion.div animate={{ y: isDragging ? -8 : 0, scale: isDragging ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(37,99,235,0.08)", border: "2px solid rgba(37,99,235,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                  <UploadCloud size={32} color="var(--color-accent)" strokeWidth={1.5} />
                </motion.div>

                <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)", marginBottom: 8, textAlign: "center" }}>
                  {isDragging ? "Drop your file here" : (
                    <>Drag & drop your CDR file, or <span style={{ color: "var(--color-accent)" }}>click to browse</span></>
                  )}
                </h3>
                <p style={{ fontSize: 13, color: "var(--color-text-subtle)", textAlign: "center", lineHeight: 1.7, maxWidth: 380, marginBottom: 20 }}>
                  Works with files from Airtel, Jio, Vi, BSNL, and other operators. Analysis starts automatically the moment you upload.
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {[".CSV", ".XLSX", ".TXT"].map(f => (
                    <span key={f} style={{ padding: "5px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.18)", color: "var(--color-accent)" }}>{f}</span>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileInput} accept=".csv,.xlsx,.txt" />
              </div>
            </motion.div>

            {/* What happens to your data */}
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderRadius: 12, background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)", marginBottom: 24 }}>
              <Lock size={13} style={{ flexShrink: 0, color: "var(--color-accent)" }} />
              <span style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--color-text)" }}>Your data never leaves this device.</strong> All analysis happens locally in your browser — nothing is sent to any server or stored online.
              </span>
            </motion.div>

            {/* What to expect — 2 steps (no preview step anymore) */}
            <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px", marginBottom: 24 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 18 }}>What happens after you upload</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { step: "1", title: "Analysis runs automatically", body: "The moment you drop or select your file, 7 fraud-detection checks run instantly — no extra clicks needed.", color: "#6c5ce7" },
                  { step: "2", title: "Plain-English results appear", body: "The Dashboard shows exactly what was found in simple language — no technical terms, with charts and visualisations.", color: "#00b894" },
                ].map(s => (
                  <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: s.color, fontFamily: "var(--font-mono)" }}>{s.step}</span>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{s.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STAGE: PREVIEW — File info + column check + data preview
        ══════════════════════════════════════════════════════ */}
        {stage === "preview" && pendingFile && (
          <motion.div key="preview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* File info bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={20} color="var(--color-accent)" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingFile.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
                  Size: <strong>{fmtBytes(pendingFile.size)}</strong> · Rows preview: <strong>{previewRows.length - 1}</strong> shown below (showing first 8 of your data)
                </p>
              </div>
              <button onClick={reset} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <X size={13} /> Choose different file
              </button>
            </div>

            {/* Column detection */}
            <div className="glass-card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Table2 size={13} color="var(--color-accent)" /> Columns Detected in Your File
                </h3>
                {missingCritical
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: "#d63031", background: "rgba(214,48,49,0.08)", padding: "4px 10px", borderRadius: 8 }}>Missing required columns</span>
                  : <span style={{ fontSize: 11, fontWeight: 700, color: "#00b894", background: "rgba(0,184,148,0.08)", padding: "4px 10px", borderRadius: 8 }}>All required columns found</span>
                }
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {detectedCols.map(col => (
                  <div key={col.header} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: col.found ? "rgba(0,184,148,0.05)" : col.critical ? "rgba(214,48,49,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${col.found ? "rgba(0,184,148,0.2)" : col.critical ? "rgba(214,48,49,0.2)" : "rgba(0,0,0,0.06)"}` }}>
                    {col.found
                      ? <CheckCircle2 size={15} color="#00b894" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                      : <AlertTriangle size={15} color={col.critical ? "#d63031" : "#95a5a6"} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: col.found ? "var(--color-text)" : "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.label}</p>
                      <p style={{ margin: 0, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>
                        {col.found ? `Matched as "${col.matchedAs}"` : col.critical ? "Not found — required" : "Not found — optional"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview Table */}
            <div className="glass-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}>
                <Eye size={13} color="var(--color-accent)" /> Data Preview — First 8 Rows
              </h3>
              <p style={{ fontSize: 12, color: "var(--color-text-subtle)", marginBottom: 16, marginTop: 4 }}>
                Confirm this looks like the correct file before starting analysis.
              </p>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    {previewRows[0] && (
                      <tr style={{ background: "rgba(37,99,235,0.04)" }}>
                        {previewRows[0].map((cell, ci) => (
                          <th key={ci} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 800, fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
                            {cell || `Col ${ci + 1}`}
                          </th>
                        ))}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {previewRows.slice(1).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: "8px 12px", color: "var(--color-text)", fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cell || <span style={{ color: "var(--color-text-subtle)", opacity: 0.5 }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm / Cancel */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
              <button onClick={reset} style={{ padding: "11px 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--color-text-muted)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={runAnalysis} disabled={missingCritical}
                style={{ padding: "12px 26px", borderRadius: 11, fontSize: 13, fontWeight: 800, background: missingCritical ? "rgba(0,0,0,0.08)" : "var(--color-accent)", color: missingCritical ? "var(--color-text-subtle)" : "white", border: "none", cursor: missingCritical ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease", boxShadow: missingCritical ? "none" : "0 6px 20px rgba(37,99,235,0.3)" }}>
                {missingCritical ? "Cannot proceed — missing columns" : "Looks correct — Start Analysis"}
                {!missingCritical && <ArrowRight size={15} />}
              </button>
            </div>

          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            STAGE: PROCESSING — Animated steps
        ══════════════════════════════════════════════════════ */}
        {stage === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 40 }}>

            {/* Pulse ring */}
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid var(--color-accent)" }} />
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(37,99,235,0.07)", border: "2px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cpu size={38} color="var(--color-accent)" strokeWidth={1.4} />
              </div>
            </div>

            <div style={{ width: "100%", maxWidth: 420 }}>
              <p style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: "var(--color-text)", marginBottom: 6, letterSpacing: "-0.02em" }}>Analysing your CDR file…</p>
              <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", marginBottom: 28 }}>This takes a few seconds. 7 heuristic checks are running.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const done    = processStep > i;
                  const active  = processStep === i;
                  const pending = processStep < i;
                  return (
                    <motion.div key={step.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: pending ? 0.35 : 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: active ? "rgba(37,99,235,0.06)" : done ? "rgba(0,184,148,0.04)" : "rgba(0,0,0,0.02)", border: `1px solid ${active ? "rgba(37,99,235,0.2)" : done ? "rgba(0,184,148,0.15)" : "rgba(0,0,0,0.05)"}`, transition: "all 0.3s ease" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: done ? "rgba(0,184,148,0.1)" : active ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.03)", border: `1px solid ${done ? "rgba(0,184,148,0.25)" : active ? "rgba(37,99,235,0.25)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done
                          ? <CheckCircle2 size={14} color="#00b894" strokeWidth={2.5} />
                          : active
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={14} color="var(--color-accent)" /></motion.div>
                          : <StepIcon size={14} color="var(--color-text-subtle)" strokeWidth={2} />
                        }
                      </div>
                      <span style={{ fontSize: 13, fontWeight: done ? 600 : active ? 700 : 500, color: done ? "#00b894" : active ? "var(--color-accent)" : "var(--color-text-subtle)" }}>
                        {step.label}
                      </span>
                      {done && <CheckCircle2 size={13} color="#00b894" style={{ marginLeft: "auto" }} />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          UPLOAD HISTORY — always visible
      ══════════════════════════════════════════════════════ */}
      {stage === "idle" && (
        <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={13} color="var(--color-accent)" /> Recent Uploads
            </h3>
            <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>{uploads.length} files</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {uploads.map((file, idx) => {
              const done = file.status === "Completed";
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.85)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: done ? "rgba(0,184,148,0.07)" : "rgba(225,112,85,0.07)", border: `1px solid ${done ? "rgba(0,184,148,0.2)" : "rgba(225,112,85,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={16} color={done ? "#00b894" : "#e17055"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>{file.date} · {file.rows} rows</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "4px 10px", borderRadius: 99, background: done ? "rgba(0,184,148,0.1)" : "rgba(225,112,85,0.1)", color: done ? "#00b894" : "#e17055", border: `1px solid ${done ? "rgba(0,184,148,0.25)" : "rgba(225,112,85,0.25)"}`, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {done ? <CheckCircle2 size={10} /> : <Loader size={10} className="animate-spin" />}
                    {file.status}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-subtle)", background: "rgba(0,0,0,0.04)", padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>{file.type}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}

export default UploadCenter;
