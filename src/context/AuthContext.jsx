import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const MOCK_INITIAL_LOGS = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: "admin",
    action: "SYSTEM_INITIALIZE",
    details: "CyberTrack Core Security Engine initialized (v5.0.4-secure)",
    ip: "192.168.1.1",
    status: "SUCCESS"
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    user: "analyst",
    action: "INGEST_CDR",
    details: "Uploaded Airtel CDR dataset - Suspect target phone: 9667691414",
    ip: "192.168.1.102",
    status: "SUCCESS"
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    user: "admin",
    action: "MODEL_TUNING",
    details: "Updated prediction parameters: epochs=50, lr=0.001, seq_length=128",
    ip: "192.168.1.100",
    status: "SUCCESS"
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    user: "analyst",
    action: "VIEW_GEOSPATIAL",
    details: "Accessed CGI tower locations for target roaming footprint",
    ip: "192.168.1.102",
    status: "SUCCESS"
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: "analyst",
    action: "SEARCH_REGISTRY",
    details: "Queried IMEI hardware database for suspect IMSI binding",
    ip: "192.168.1.102",
    status: "SUCCESS"
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cybertrack_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem("cybertrack_audit_logs");
    return saved ? JSON.parse(saved) : MOCK_INITIAL_LOGS;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("cybertrack_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cybertrack_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("cybertrack_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action, details, status = "SUCCESS", username = null) => {
    const activeUser = username || (user ? user.username : "anonymous");
    const ipAddress = activeUser === "admin" ? "192.168.1.100" : activeUser === "analyst" ? "192.168.1.102" : "192.168.1.254";
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      user: activeUser,
      action,
      details,
      ip: ipAddress,
      status
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    
    if (cleanUser === "admin" && password === "admin123") {
      const u = { username: "admin", role: "admin" };
      setUser(u);
      addAuditLog("LOGIN", "Admin credentials successfully validated", "SUCCESS", "admin");
      return { success: true, user: u };
    }
    
    if (cleanUser === "analyst" && password === "analyst123") {
      const u = { username: "analyst", role: "analyst" };
      setUser(u);
      addAuditLog("LOGIN", "Analyst credentials successfully validated", "SUCCESS", "analyst");
      return { success: true, user: u };
    }

    addAuditLog("LOGIN_FAIL", `Failed login attempt for user: ${username}`, "FAILED", username);
    return { success: false, message: "Invalid credentials. Access Denied." };
  };

  const logout = () => {
    if (user) {
      addAuditLog("LOGOUT", `Session terminated for user: ${user.username}`);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        auditLogs,
        addAuditLog
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
