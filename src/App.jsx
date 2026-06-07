
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Cases from "./pages/Cases";
import { Routes, Route } from "react-router-dom";
import GeoIntelligence from "./pages/GeoIntelligence";
import Dashboard from "./pages/Dashboard";
import UploadCenter from "./pages/UploadCenter";
import RiskCenter from "./pages/RiskCenter";
import Mobility from "./pages/Mobility";
import NetworkAnalysis from "./pages/NetworkAnalysis";

function App() {
  

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#020617",
        color: "white",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        <Navbar />

<Routes>
  <Route
  index
  element={<Dashboard />}
/>
  <Route
    path="/upload"
    element={<UploadCenter />}
  />

  <Route
    path="/risk"
    element={<RiskCenter />}
  />
   
   <Route
  path="/mobility"
  element={<Mobility />}
/>

<Route
  path="/cases"
  element={<Cases />}
/>

<Route
  path="/geo"
  element={<GeoIntelligence />}
/>
<Route
  path="/network"
  element={<NetworkAnalysis />}
/>
</Routes>


      </div>
    </div>
  );
}

export default App;