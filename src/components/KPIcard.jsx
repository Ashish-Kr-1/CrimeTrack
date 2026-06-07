function KPIcard({ title, value, color = "white" }) {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        borderRadius: "16px",
        padding: "25px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <h3>{title}</h3>

      <h1
        style={{
          fontSize: "48px",
          color: color,
        }}
      >
        {value}
      </h1>
    </div>
  );
}

export default KPIcard;