import { createContext, useState } from "react";

export const CDRContext = createContext();

export function CDRProvider({ children }) {
  const [cdrData, setCdrData] = useState([]);

  return (
    <CDRContext.Provider
      value={{
        cdrData,
        setCdrData,
      }}
    >
      {children}
    </CDRContext.Provider>
  );
}