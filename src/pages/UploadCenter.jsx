import { useState, useContext } from "react";
import { CDRContext } from "../context/CDRContext";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, Loader, Shield } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function UploadCenter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { setCdrData } = useContext(CDRContext);

  const [uploads, setUploads] = useState([
    {
      fileName: "cdr_9520995378_1.csv",
      type: "CDR Dataset",
      status: "Completed",
      date: "2026-06-07 12:44:11",
    },
    {
      fileName: "tower_dump_kolkata.xlsx",
      type: "Tower Dump",
      status: "Completed",
      date: "2026-06-07 11:20:00",
    },
    {
      fileName: "imei_suspect_rotations.csv",
      type: "Device Data",
      status: "Processing",
      date: "2026-06-07 14:02:15",
    },
  ]);

  const processFile = (file) => {
    if (!file) return;
    setSelectedFile(file);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    setUploads([
      {
        fileName: file.name,
        type: file.name.endsWith(".csv") ? "CDR Dataset" : "User Data File",
        status: "Completed",
        date: dateStr,
      },
      ...uploads,
    ]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text
        .split("\n")
        .map((row) => row.split(","))
        .filter((row) => row.length > 1);

      let dataStartIdx = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (
          rows[i].some(
            (cell) =>
              cell.includes("Target No") ||
              cell.includes("B Party No") ||
              cell.includes("Call Type")
          )
        ) {
          dataStartIdx = i;
          break;
        }
      }

      const actualData = rows.slice(dataStartIdx);
      setCdrData(actualData);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-[1200px]"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="mb-1 text-[30px] font-bold text-text">
          Data Ingestion & Upload Center
        </h1>
        <p className="text-sm text-text-muted">
          Load raw Call Detail Records (CDR) and cell tower telemetry logs to
          generate automated heuristics reports.
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        variants={fadeUp}
        className="glass-card relative mb-8 cursor-pointer overflow-hidden"
        style={{
          border: isDragging
            ? "2px solid #00e5ff"
            : "2px dashed rgba(21, 60, 69, 0.7)",
          boxShadow: isDragging
            ? "0 0 30px rgba(0, 229, 255, 0.15)"
            : undefined,
        }}
        onClick={() => document.getElementById("fileInput").click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Scan line */}
        <div className="scan-overlay pointer-events-none absolute inset-0" />

        <div className="flex flex-col items-center justify-center px-8 py-14">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
            style={{
              backgroundColor: "rgba(0, 229, 255, 0.08)",
              borderColor: "rgba(0, 229, 255, 0.2)",
            }}
          >
            <UploadCloud size={30} color="#00e5ff" strokeWidth={1.8} />
          </motion.div>

          <h3 className="mb-2 text-lg font-bold text-text">
            Drag & drop raw file here, or{" "}
            <span className="text-accent">browse files</span>
          </h3>
          <p className="text-[13px] text-text-subtle">
            Supported file formats: CSV, XLSX, or TXT (Airtel CDR standard
            layouts)
          </p>

          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.txt"
          />

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold"
              style={{
                backgroundColor: "rgba(45, 138, 94, 0.08)",
                borderColor: "rgba(45, 138, 94, 0.2)",
                color: "#2d8a5e",
              }}
            >
              <CheckCircle2 size={14} />
              Loaded: {selectedFile.name}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Recent Uploads Table */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-text">
          <Shield size={18} color="#00e5ff" />
          Recent Audited Uploads
        </h2>

        <div className="overflow-x-auto">
          <table className="ct-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category / Type</th>
                <th>Time Ingested</th>
                <th>Auditing Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((file, idx) => {
                const isComplete = file.status === "Completed";
                return (
                  <tr key={idx}>
                    <td className="font-semibold text-text">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-text-subtle" />
                        {file.fileName}
                      </div>
                    </td>
                    <td className="text-text-muted">{file.type}</td>
                    <td className="text-text-muted">{file.date}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          backgroundColor: isComplete
                            ? "rgba(0, 229, 255, 0.1)"
                            : "rgba(255, 107, 74, 0.1)",
                          color: isComplete ? "#00e5ff" : "#ff6b4a",
                          border: `1px solid ${isComplete ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 107, 74, 0.2)"}`,
                        }}
                      >
                        {isComplete ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <Loader size={11} className="animate-spin" />
                        )}
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