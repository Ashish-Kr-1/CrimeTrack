import { useState, useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function UploadCenter() {
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
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
        .filter(row => row.length > 1);

      // Simple detection of titles
      // Check if first line contains column headers or meta titles
      let dataStartIdx = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (rows[i].some(cell => cell.includes("Target No") || cell.includes("B Party No") || cell.includes("Call Type"))) {
          dataStartIdx = i;
          break;
        }
      }
      
      const actualData = rows.slice(dataStartIdx);
      setCdrData(actualData);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "35px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            fontFamily: "var(--font-heading)",
            marginBottom: "8px",
          }}
        >
          Data Ingestion & Upload Center
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Load raw Call Detail Records (CDR) and cell tower telemetry logs to generate automated heuristics reports.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className="glass-card"
        style={{
          border: "2px dashed var(--border-hover)",
          padding: "50px 30px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor: "rgba(12, 16, 32, 0.4)",
          marginBottom: "35px",
        }}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
          Drag & drop raw file here, or <span style={{ color: "var(--primary)" }}>browse files</span>
        </h3>
        <p style={{ color: "var(--text-subtle)", fontSize: "13px", marginBottom: "0" }}>
          Supported file formats: **CSV**, **XLSX**, or **TXT** (Airtel CDR standard layouts)
        </p>

        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileUpload}
          accept=".csv,.xlsx,.txt"
        />

        {selectedFile && (
          <div
            style={{
              marginTop: "20px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "8px 16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--success)",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--success)",
              }}
            />
            Loaded: {selectedFile.name}
          </div>
        )}
      </div>

      {/* Recent Uploads Table */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            fontFamily: "var(--font-heading)",
            marginBottom: "20px",
          }}
        >
          Recent Audited Uploads
        </h2>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category / Type</th>
                <th>Time Ingested</th>
                <th>Auditing Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((file, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {file.fileName}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{file.type}</td>
                  <td style={{ color: "var(--text-muted)" }}>{file.date}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor: file.status === "Completed" ? "var(--success-glow)" : "var(--warning-glow)",
                        color: file.status === "Completed" ? "var(--success)" : "var(--warning)",
                        border: `1px solid ${file.status === "Completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)"}`,
                      }}
                    >
                      {file.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UploadCenter;