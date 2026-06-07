import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CDRContext } from "../context/CDRContext";
import CallTrendChart from "../CallTrendChart";
import RiskChart from "../RiskChart";

function Dashboard() {
  const { cdrData, diagnosticReport } = useContext(CDRContext);
  const navigate = useNavigate();

  const records = cdrData.slice(1);

  // If no data is uploaded, display a premium empty state
  if (!diagnosticReport || records.length === 0) {
    return (
      <div style={{ maxWidth: "1000px", margin: "40px auto", textAlign: "center" }}>
        <div
          className="glass-card"
          style={{
            padding: "60px 40px",
            backgroundColor: "rgba(12, 16, 32, 0.4)",
            border: "1px solid var(--border-main)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.05)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              fontFamily: "var(--font-heading)",
              color: "var(--text-main)",
            }}
          >
            Forensic Engine Offline
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              maxWidth: "500px",
              lineHeight: "1.6",
            }}
          >
            No active datasets detected. Upload a standard Call Detail Record (CDR) dataset in the Upload Center to activate AI Heuristic analysis and classification.
          </p>

          <button
            onClick={() => navigate("/upload")}
            style={{
              marginTop: "10px",
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.filter = "brightness(1.1)")}
            onMouseOut={(e) => (e.target.style.filter = "none")}
          >
            Go to Upload Center
          </button>
        </div>
      </div>
    );
  }

  // Define colors based on risk level
  const isMule = diagnosticReport.classification === "HIGHLY_SUSPECT_FINANCIAL_MULE";
  const statusColor = isMule ? "var(--danger)" : "var(--warning)";
  const statusGlow = isMule ? "var(--danger-glow)" : "var(--warning-glow)";

  return (
    <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "25px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            fontFamily: "var(--font-heading)",
            marginBottom: "8px",
          }}
        >
          Telecom Forensics Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Target analysis for Subject: <strong style={{ color: "white" }}>{diagnosticReport.target_phone}</strong>
        </p>
      </div>

      {/* AI Diagnostic Verdict Panel */}
      <div
        className="glass-card"
        style={{
          borderLeft: `4px solid ${statusColor}`,
          padding: "24px",
          marginBottom: "25px",
          backgroundColor: "rgba(12, 16, 32, 0.4)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "20px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: statusGlow,
                  color: statusColor,
                  border: `1px solid ${statusColor}33`,
                }}
              >
                {diagnosticReport.classification.replace(/_/g, " ")}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: "500" }}>
                Confidence: <strong style={{ color: "white" }}>{diagnosticReport.confidence_level}</strong>
              </span>
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                fontFamily: "var(--font-heading)",
                marginBottom: "8px",
              }}
            >
              Forensic AI Diagnostic Verdict
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13.5px", maxWidth: "800px", lineHeight: "1.5" }}>
              Heuristic engines indicate severe telemetry patterns mirroring financial mule account clusters. Multiple banking registrations, device switches, and rapid geographic movement are present.
            </p>
          </div>

          <div style={{ textAlign: "right", minWidth: "180px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "500" }}>
              SUSPICION RATE
            </div>
            <div
              style={{
                fontSize: "44px",
                fontWeight: "700",
                color: statusColor,
                fontFamily: "var(--font-heading)",
                lineHeight: "1",
              }}
            >
              {(diagnosticReport.suspicion_score * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "6px" }}>
              ({diagnosticReport.raw_heuristic_score} / {diagnosticReport.max_possible_score} pts)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "3px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={{ width: `${diagnosticReport.suspicion_score * 100}%`, height: "100%", backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
        </div>

        {/* Action Recommendation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(6, 8, 19, 0.4)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--border-main)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--danger)", letterSpacing: "0.02em" }}>
            RECOMMENDED PROTOCOL: {diagnosticReport.risk_summary.recommended_action}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.05)", display: "flex", alignItems: "center", justifyCenter: "center", border: "1px solid rgba(59, 130, 246, 0.15)", flexShrink: 0, justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Total Audit Logs</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
              {records.length}
            </h2>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(6, 182, 212, 0.05)", display: "flex", alignItems: "center", justifyCenter: "center", border: "1px solid rgba(6, 182, 212, 0.15)", flexShrink: 0, justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Unique Contacts</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
              {diagnosticReport.feature_vector.personal_contact_count + diagnosticReport.feature_vector.bank_sender_count}
            </h2>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(139, 92, 246, 0.05)", display: "flex", alignItems: "center", justifyCenter: "center", border: "1px solid rgba(139, 92, 246, 0.15)", flexShrink: 0, justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>Device Swaps</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
              {diagnosticReport.feature_vector.unique_imei_count} <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: "500" }}>({diagnosticReport.feature_vector.device_swaps_per_month}/mo)</span>
            </h2>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.05)", display: "flex", alignItems: "center", justifyCenter: "center", border: "1px solid rgba(16, 185, 129, 0.15)", flexShrink: 0, justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>SMS Traffic Ratio</span>
            <h2 style={{ fontSize: "22px", fontWeight: "700", fontFamily: "var(--font-heading)", marginTop: "2px" }}>
              {diagnosticReport.feature_vector.sms_ratio_pct}% <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: "500" }}>({diagnosticReport.feature_vector.upi_burst_sms_count} UPI registered)</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Triggered Indicators & Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px", marginBottom: "25px", alignItems: "start" }}>
        {/* Triggered Indicators List */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              fontFamily: "var(--font-heading)",
              marginBottom: "20px",
            }}
          >
            Triggered Heuristics ({diagnosticReport.triggered_indicators.length})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {diagnosticReport.triggered_indicators.map((indicator, index) => {
              const indicatorColor = indicator.severity === "CRITICAL" ? "var(--danger)" : indicator.severity === "HIGH" ? "#ff7849" : "var(--warning)";
              const indicatorBg = indicator.severity === "CRITICAL" ? "var(--danger-glow)" : indicator.severity === "HIGH" ? "rgba(255, 120, 73, 0.08)" : "var(--warning-glow)";
              return (
                <div
                  key={index}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(6, 8, 19, 0.3)",
                    border: "1px solid var(--border-main)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "14px", fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>
                      {indicator.code.replace(/_/g, " ")}
                    </strong>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        backgroundColor: indicatorBg,
                        color: indicatorColor,
                        border: `1px solid ${indicatorColor}33`,
                      }}
                    >
                      {indicator.severity}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "12.5px", lineHeight: "1.4", margin: "0" }}>
                    {indicator.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts & Graphs Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div className="glass-card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "15px" }}>
              📈 Call Activity Over Time
            </h2>
            <CallTrendChart />
          </div>

          <div className="glass-card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", fontFamily: "var(--font-heading)", marginBottom: "15px" }}>
              🎯 Target Risk Weight Distribution
            </h2>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RiskChart />
            </div>
          </div>
        </div>
      </div>

      {/* Device Rotation Operational Phases */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            fontFamily: "var(--font-heading)",
            marginBottom: "20px",
          }}
        >
          SIM Card Device Swap Phases
        </h2>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Phase Description</th>
                <th>Hardware Identifier (IMEI)</th>
                <th>Ingress Time</th>
                <th>Egress Time</th>
                <th>Audited Events</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticReport.operational_phases.map((phase, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: "600", color: "var(--text-main)" }}>{phase.phase}</td>
                  <td style={{ color: "var(--accent-cyan)", fontFamily: "monospace", fontSize: "13px" }}>
                    {phase.imei || "Unknown Device"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{phase.start}</td>
                  <td style={{ color: "var(--text-muted)" }}>{phase.end}</td>
                  <td style={{ fontWeight: "600" }}>{phase.event_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;