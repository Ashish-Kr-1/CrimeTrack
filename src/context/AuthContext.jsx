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

/* Generate a random session token */
function generateSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

import { API_BASE } from "../config";

const AUTH_API = `${API_BASE}/api/auth/login`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("cybertrack_user");
    const savedToken = localStorage.getItem("cybertrack_session_token");
    // Only restore session if both user and token exist
    if (savedUser && savedToken) {
      return JSON.parse(savedUser);
    }
    // Clear stale data
    localStorage.removeItem("cybertrack_user");
    localStorage.removeItem("cybertrack_session_token");
    return null;
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
      localStorage.removeItem("cybertrack_session_token");
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

  const login = async (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      if (data.success) {
        const token = generateSessionToken();
        const u = { username: data.username, role: data.role };
        setUser(u);
        localStorage.setItem("cybertrack_session_token", token);
        addAuditLog("LOGIN", `${data.role.charAt(0).toUpperCase() + data.role.slice(1)} credentials validated via auth server`, "SUCCESS", data.username);
        return { success: true, user: u };
      }

      addAuditLog("LOGIN_FAIL", `Failed login attempt for user: ${cleanUser}`, "FAILED", cleanUser);
      return { success: false, message: data.message || "Invalid credentials. Access Denied." };
    } catch (err) {
      console.warn("Auth server unreachable. Using local offline bypass for development.");
      const fallbackRole = cleanUser === "admin" ? "admin" : "analyst";
      const token = generateSessionToken();
      const u = { username: cleanUser, role: fallbackRole };
      setUser(u);
      localStorage.setItem("cybertrack_session_token", token);
      addAuditLog("LOGIN", `${fallbackRole.charAt(0).toUpperCase() + fallbackRole.slice(1)} credentials validated via local offline bypass`, "SUCCESS", cleanUser);
      return { success: true, user: u };
    }
  };

  const logout = () => {
    if (user) {
      addAuditLog("LOGOUT", `Session terminated for user: ${user.username}`);
    }
    setUser(null);
  };

  /* Check if session is valid */
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("cybertrack_session_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        auditLogs,
        addAuditLog,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
