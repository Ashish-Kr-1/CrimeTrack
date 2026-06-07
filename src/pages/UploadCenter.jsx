import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader,
  Shield,
  Lock,
  Info,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

function UploadCenter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const { setCdrData }                  = useContext(CDRContext);
  const navigate                        = useNavigate();

  const [uploads, setUploads] = useState([
    { fileName: "cdr_9520995378_1.csv",      type: "CDR Dataset",  status: "Completed", date: "2026-06-07 12:44:11" },
    { fileName: "tower_dump_kolkata.xlsx",    type: "Tower Dump",   status: "Completed", date: "2026-06-07 11:20:00" },
    { fileName: "imei_suspect_rotations.csv", type: "Device Data",  status: "Processing",date: "2026-06-07 14:02:15" },
  ]);

  const processFile = (file) => {
    if (!file) return;
    setSelectedFile(file);

    const now     = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;

    setUploads([
      { fileName: file.name, type: file.name.endsWith(".csv") ? "CDR Dataset" : "User Data File", status: "Completed", date: dateStr },
      ...uploads,
    ]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").map((row) => row.split(",")).filter((row) => row.length > 1);

      let dataStartIdx = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some((cell) => cell.includes("Target No") || cell.includes("B Party No") || cell.includes("Call Type"))) {
          dataStartIdx = i;
          break;
        }
      }
      setCdrData(rows.slice(dataStartIdx));
      navigate("/");
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => processFile(e.target.files[0]);
  const handleDrop       = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const supportedFormats = [
    { ext: "CSV", desc: "Call Detail Records" },
    { ext: "XLSX", desc: "Excel worksheets" },
    { ext: "TXT", desc: "Airtel CDR layout" },
  ];

  return (
    <motion.div className="page-container theme-upload" initial="initial" animate="animate">
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(0, 212, 245, 0.1)",
              border: "1px solid rgba(0, 212, 245, 0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UploadCloud size={18} color="var(--color-accent)" strokeWidth={2} />
          </div>
          <h1 className="page-title">Data Ingestion Center</h1>
        </div>
        <p className="page-subtitle">
          Load raw Call Detail Records (CDR) and cell tower telemetry logs to generate automated heuristics reports.
        </p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        variants={fadeUp}
        onClick={() => document.getElementById("fileInput").click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          position: "relative",
          marginBottom: 22,
          borderRadius: "var(--radius-xl)",
          border: isDragging
            ? "2px solid var(--color-accent)"
            : "2px dashed var(--color-border-hover)",
          background: isDragging
            ? "rgba(0, 184, 148, 0.05)"
            : "rgba(255, 255, 255, 0.6)",
          boxShadow: isDragging ? "0 0 40px rgba(0, 212, 245, 0.12)" : "none",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Scan overlay */}
        <div className="scan-overlay pointer-events-none absolute inset-0" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "52px 40px",
            gap: 0,
          }}
        >
          <motion.div
            animate={{ y: isDragging ? -6 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(0, 184, 148, 0.08)",
              border: "1px solid rgba(0, 184, 148, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              boxShadow: isDragging ? "0 0 30px rgba(0, 212, 245, 0.2)" : "none",
              transition: "box-shadow 0.25s ease",
            }}
          >
            <UploadCloud size={28} color="var(--color-accent)" strokeWidth={1.6} />
          </motion.div>

          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 8, textAlign: "center" }}>
            {isDragging ? "Release to upload" : (
              <>Drag & drop your file, or <span style={{ color: "var(--color-accent)" }}>browse files</span></>
            )}
          </h3>

          <p style={{ fontSize: 13, color: "var(--color-text-subtle)", textAlign: "center", lineHeight: 1.6 }}>
            Supported formats: CSV, XLSX, or TXT (Airtel CDR standard layouts)
          </p>

          {/* Format pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {supportedFormats.map((f) => (
              <span
                key={f.ext}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "rgba(0, 212, 245, 0.07)",
                  border: "1px solid rgba(0, 212, 245, 0.15)",
                  color: "var(--color-accent)",
                }}
              >
                .{f.ext}
              </span>
            ))}
          </div>

          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.txt"
          />

          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "rgba(46, 196, 182, 0.1)",
                  border: "1px solid rgba(46, 196, 182, 0.25)",
                  color: "var(--color-success)",
                }}
              >
                <CheckCircle2 size={14} />
                Loaded: {selectedFile.name}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        variants={fadeUp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 18px",
          borderRadius: "var(--radius-md)",
          background: "rgba(0, 212, 245, 0.04)",
          border: "1px solid rgba(0, 212, 245, 0.12)",
          marginBottom: 22,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}
      >
        <Lock size={13} style={{ flexShrink: 0, color: "var(--color-accent)" }} />
        <span>
          All uploads are processed entirely on your local device. No data is transmitted to external servers.
        </span>
      </motion.div>

      {/* Recent Uploads Table */}
      <motion.div variants={fadeUp} className="glass-card" style={{ padding: "22px 24px" }}>
        <div className="section-header">
          <div className="section-title">
            <Shield size={16} className="section-title-icon" />
            Recent Audited Uploads
          </div>
          <span style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>
            {uploads.length} files
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="ct-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Time Ingested</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((file, idx) => {
                const isComplete = file.status === "Completed";
                return (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: "rgba(0, 212, 245, 0.07)",
                            border: "1px solid var(--color-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={14} color="var(--color-text-muted)" />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text)" }}>
                          {file.fileName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>
                        {file.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-subtle)" }}>
                        {file.date}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          background: isComplete ? "rgba(46, 196, 182, 0.1)" : "rgba(255, 107, 74, 0.1)",
                          color: isComplete ? "var(--color-success)" : "var(--color-gold)",
                          border: `1px solid ${isComplete ? "rgba(46,196,182,0.25)" : "rgba(255,107,74,0.25)"}`,
                        }}
                      >
                        {isComplete ? <CheckCircle2 size={11} /> : <Loader size={11} className="animate-spin" />}
                        {file.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UploadCenter;