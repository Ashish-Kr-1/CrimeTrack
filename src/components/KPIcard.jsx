function KPIcard({ title, value, icon: Icon, sub }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "20px 22px",
        transition: "var(--transition-base)",
        background: `linear-gradient(135deg, rgba(var(--primary-rgb, 108, 92, 231), 0.06) 0%, rgba(var(--primary-rgb, 108, 92, 231), 0.02) 100%)`,
        borderLeft: "3px solid var(--primary, #6c5ce7)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {Icon && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--primary-transparent-18, rgba(108, 92, 231, 0.18))",
            border: "1px solid var(--primary-transparent-30, rgba(108, 92, 231, 0.30))",
            marginBottom: 14,
          }}
        >
          <Icon size={16} color="var(--primary, #6c5ce7)" strokeWidth={2.2} />
        </div>
      )}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-text-subtle)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "var(--primary, #6c5ce7)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            marginTop: 6,
            fontWeight: 500,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default KPIcard;