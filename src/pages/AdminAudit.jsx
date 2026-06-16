import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Shield, RefreshCw, FileText, Lock, Server, AlertCircle } from "lucide-react";

export default function AdminAudit() {
  const [filter, setFilter] = useState("");
  const logs = [
    { time: "2026-06-16 06:12:15", user: "admin", action: "User permission state modified", target: "intern -> Inactive", status: "Success", ip: "192.168.1.14" },
    { time: "2026-06-16 06:08:49", user: "analyst", action: "Forensic CDR parsing complete", target: "CDR_suspect_Patna_June.csv", status: "Success", ip: "192.168.1.25" },
    { time: "2026-06-16 06:05:14", user: "officer", action: "Field tower triangulation initiated", target: "Target SIM 9876543210", status: "Success", ip: "192.168.1.189" },
    { time: "2026-06-16 05:44:50", user: "admin", action: "System settings updated", target: "Triangulation Map API keys", status: "Success", ip: "192.168.1.14" },
    { time: "2026-06-16 05:30:10", user: "analyst", action: "Failed login attempt", target: "analyst_guest", status: "Warning", ip: "103.45.210.88" },
  ];

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(filter.toLowerCase()) ||
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.target.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-container theme-dashboard" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--color-text)", margin: 0 }}>
          System Audit Trail
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
          Inspect diagnostic logs, security events, CDR ingestion activities, and system logins.
        </p>
      </div>

      {/* Audit stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Logs Ingested</span>
            <FileText size={14} color="#6c5ce7" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>14,805</div>
        </div>

        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Security Audits</span>
            <Lock size={14} color="#00b894" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>142</div>
        </div>

        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Gateways</span>
            <Server size={14} color="#00b894" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#00b894", fontFamily: "var(--font-mono)" }}>3</div>
        </div>

      </div>

      {/* Logs Card */}
      <div className="glass-card" style={{ padding: "28px", background: "rgba(255, 255, 255, 0.78)" }}>
        
        {/* Search Filter Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: 0 }}>
            Audit Logs Registry
          </h2>
          <div style={{ width: "100%", maxWidth: "320px", position: "relative" }}>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by action, target, or user..."
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                padding: "8px 16px",
                fontWeight: "600",
                fontSize: "13px",
                color: "#0f172a",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", fontSize: "13px" }}>
            <thead>
              <tr style={{ color: "#64748b", textTransform: "uppercase", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Timestamp</th>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>User</th>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Operation Action</th>
                <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Target / Ingest Details</th>
                <th style={{ textAlign: "center", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Status</th>
                <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    borderRadius: "12px",
                    transition: "background 0.2s ease",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{log.time}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "var(--color-text)" }}>{log.user}</td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text)" }}>{log.action}</td>
                  <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", color: "#6c5ce7", fontWeight: "600" }}>{log.target}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "700",
                        backgroundColor: log.status === "Success" ? "rgba(0,184,148,0.1)" : "rgba(225,112,85,0.1)",
                        color: log.status === "Success" ? "#00b894" : "#e17055",
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{log.ip}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                    No audit records match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
