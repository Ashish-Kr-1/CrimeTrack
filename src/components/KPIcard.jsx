function KPIcard({ title, value, icon: Icon, sub }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: "18px 20px",
        transition: "var(--transition-base)",
        background: `linear-gradient(135deg, rgba(var(--primary-rgb, 47, 102, 144), 0.05) 0%, rgba(var(--primary-rgb, 47, 102, 144), 0.01) 100%)`,
        borderLeft: "3px solid var(--primary, #3a7ca5)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
    >
      {Icon && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "var(--primary-transparent-18, rgba(47,102,144,0.14))",
            border: "1px solid var(--primary-transparent-30, rgba(47,102,144,0.22))",
            marginBottom: 12,
          }}
        >
          <Icon size={15} color="var(--primary, #3a7ca5)" strokeWidth={2.2} />
        </div>
      )}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "var(--color-text-subtle)",
          marginBottom: 5,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "var(--primary, #3a7ca5)",
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
            marginTop: 5,
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
