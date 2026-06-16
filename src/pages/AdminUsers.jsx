import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, ShieldAlert, Key, Plus, ToggleLeft, ToggleRight, Search } from "lucide-react";

export default function AdminUsers() {
  const [userList, setUserList] = useState([
    { username: "admin", role: "admin", fullName: "Ashish Kumar", status: "Active", lastLogin: "Just now" },
    { username: "analyst", role: "analyst", fullName: "Vikram Sharma", status: "Active", lastLogin: "2 hours ago" },
    { username: "officer", role: "officer", fullName: "Inspector Singh", status: "Active", lastLogin: "1 day ago" },
    { username: "intern", role: "analyst", fullName: "Priya Das", status: "Inactive", lastLogin: "Never" },
  ]);

  const toggleStatus = (username) => {
    setUserList(prev => prev.map(u => {
      if (u.username === username) {
        return { ...u, status: u.status === "Active" ? "Inactive" : "Active" };
      }
      return u;
    }));
  };

  return (
    <div className="page-container theme-dashboard" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.035em", color: "var(--color-text)", margin: 0 }}>
            User Accounts Workspace
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
            Administrate registered investigators, configure security roles, and monitor user statuses.
          </p>
        </div>
        <button
          onClick={() => alert("Add User modal placeholder triggered.")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#6c5ce7",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "10px 20px",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(108, 92, 231, 0.28)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#5b4cd3"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#6c5ce7"}
        >
          <Plus size={16} />
          Register User
        </button>
      </div>

      {/* Counters Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Users</span>
            <Users size={14} color="#6c5ce7" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>{userList.length}</div>
        </div>

        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Sessions</span>
            <UserCheck size={14} color="#00b894" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
            {userList.filter(u => u.status === "Active").length}
          </div>
        </div>

        <div className="glass-card stat-mini" style={{ padding: "20px", background: "rgba(255, 255, 255, 0.75)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-subtle)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Audit Alerts</span>
            <ShieldAlert size={14} color="#d63031" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: "#d63031", fontFamily: "var(--font-mono)" }}>0</div>
        </div>
      </div>

      {/* Users List Card */}
      <div className="glass-card" style={{ padding: "28px", background: "rgba(255, 255, 255, 0.78)", overflowX: "auto" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", margin: "0 0 20px 0" }}>
          Registered Accounts
        </h2>

        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: "#64748b", textTransform: "uppercase", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em" }}>
              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Full Name</th>
              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Username</th>
              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Security Role</th>
              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Last Access</th>
              <th style={{ textAlign: "center", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Status</th>
              <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr
                key={u.username}
                style={{
                  background: "rgba(255,255,255,0.4)",
                  borderRadius: "12px",
                  transition: "background 0.2s ease",
                }}
              >
                <td style={{ padding: "14px 16px", fontWeight: "700", color: "var(--color-text)" }}>{u.fullName}</td>
                <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{u.username}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      backgroundColor: u.role === "admin" ? "rgba(108, 92, 231, 0.08)" : u.role === "officer" ? "rgba(0, 184, 148, 0.08)" : "rgba(225, 112, 85, 0.08)",
                      color: u.role === "admin" ? "#6c5ce7" : u.role === "officer" ? "#00b894" : "#e17055",
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>{u.lastLogin}</td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "10px",
                      fontWeight: "700",
                      backgroundColor: u.status === "Active" ? "rgba(0,184,148,0.1)" : "rgba(100,116,139,0.1)",
                      color: u.status === "Active" ? "#00b894" : "#64748b",
                    }}
                  >
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                    <button
                      onClick={() => toggleStatus(u.username)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: u.status === "Active" ? "#00b894" : "#94a3b8",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {u.status === "Active" ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                    <button
                      onClick={() => alert(`Resetting credentials for: ${u.username}`)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px"
                      }}
                      title="Reset Password"
                    >
                      <Key size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
