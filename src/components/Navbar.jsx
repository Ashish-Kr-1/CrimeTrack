function Navbar() {
  return (
    <div
      style={{
        height: "70px",
        backgroundColor: "#111827",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        marginBottom: "20px",
      }}
    >
      <input
        type="text"
        placeholder="Search..."
        style={{
          width: "350px",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          outline: "none",
          backgroundColor: "#1E293B",
          color: "white",
        }}
      />

      <div>👤 Admin</div>
    </div>
  );
}

export default Navbar;