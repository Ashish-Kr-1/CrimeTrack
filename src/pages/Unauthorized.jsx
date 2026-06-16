import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#decbb7",
        color: "#0f172a",
        fontFamily: "var(--font-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* Ambient background gradients */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: [
            "radial-gradient(ellipse 75% 65% at 50% 15%, rgba(214,48,49,0.08) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(108,92,231,0.04) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card empty-state"
        style={{
          maxWidth: "500px",
          width: "100%",
          padding: "40px",
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.95)",
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(214, 48, 49, 0.08)",
            border: "1px solid rgba(214, 48, 49, 0.2)",
            boxShadow: "0 0 20px rgba(214, 48, 49, 0.08)",
            margin: "0 auto 24px",
          }}
        >
          <ShieldAlert size={36} color="#d63031" strokeWidth={1.8} />
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text)", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
          Access Restriction Alert
        </h1>

        <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--color-text-muted)", margin: "0 0 32px 0" }}>
          Your security role does not have authorization to access this page. Please contact a system administrator if you believe this is a credential configuration error.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "12px 0",
            fontSize: "13px",
            background: "linear-gradient(135deg, #d63031 0%, #ff7675 100%)",
            border: "none",
            boxShadow: "0 4px 14px rgba(214, 48, 49, 0.25)",
            color: "white",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
        >
          <ArrowLeft size={16} />
          Return to Portal Access
        </button>
      </motion.div>
    </div>
  );
}