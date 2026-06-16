import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const USERS = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    username: "analyst",
    password: "analyst123",
    role: "analyst",
  },
  {
    username: "officer",
    password: "officer123",
    role: "officer",
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const foundUser = USERS.find(
      (u) =>
        u.username === username &&
        u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}