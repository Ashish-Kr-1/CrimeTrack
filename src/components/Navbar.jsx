import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Navbar() {
  const { diagnosticReport } = useContext(CDRContext);

  return (
    <div
      style={{
        height: "70px",
        backgroundColor: "rgba(12, 16, 32, 0.6)",
        border: "1px solid var(--border-main)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        marginBottom: "25px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Search Input Container */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <svg
          style={{ position: "absolute", left: "14px", color: "var(--text-subtle)" }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search phone numbers, cells, IMEIs..."
          style={{
            width: "380px",
            padding: "10px 16px 10px 40px",
            borderRadius: "12px",
            border: "1px solid var(--border-main)",
            outline: "none",
            backgroundColor: "rgba(6, 8, 19, 0.4)",
            color: "var(--text-main)",
            fontSize: "13px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontFamily: "var(--font-sans)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-main)")}
        />
        <span
          style={{
            position: "absolute",
            right: "12px",
            fontSize: "10px",
            backgroundColor: "var(--bg-surface-elevated)",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "var(--text-subtle)",
            fontWeight: "600",
            border: "1px solid var(--border-main)",
            pointerEvents: "none",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Target Subject Details & User badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {diagnosticReport && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "6px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--danger)",
              fontFamily: "var(--font-heading)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--danger)",
                boxShadow: "0 0 6px var(--danger)",
                display: "inline-block",
              }}
            />
            ACTIVE TARGET: {diagnosticReport.target_phone}
          </div>
        )}

        {/* User profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 12px",
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "white",
            }}
          >
            A
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
            Forensic Analyst
          </span>
        </div>
      </div>
    </div>
  );
}

export default Navbar;