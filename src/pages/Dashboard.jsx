import CallTrendChart from "../CallTrendChart";
import RiskChart from "../RiskChart";
import KPIcard from "../components/KPIcard";
import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Dashboard() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const uniqueContacts = new Set(
    records.map((row) => row[3])
  ).size;

  const uniqueIMEI = new Set(
    records.map((row) => row[15])
  ).size;

  const smsCount = records.filter(
    (row) => row[1] === "SMT"
  ).length;

  const alerts = [];

  if (uniqueContacts > 100) {
    alerts.push({
      entity: "Network",
      alert: "Large Contact Network",
      risk: "High",
    });
  }

  if (uniqueIMEI > 3) {
    alerts.push({
      entity: "Device",
      alert: "Multiple IMEI Detected",
      risk: "Medium",
    });
  }

  if (smsCount > 500) {
    alerts.push({
      entity: "SMS Activity",
      alert: "High SMS Volume",
      risk: "High",
    });
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "25px" }}>
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "10px",
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            color: "#94A3B8",
          }}
        >
          Telecom Intelligence Overview
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <KPIcard
          title="📄 Total Records"
          value={records.length}
        />

        <KPIcard
          title="📱 Unique Contacts"
          value={uniqueContacts}
        />

        <KPIcard
          title="📟 Unique IMEI"
          value={uniqueIMEI}
        />

        <KPIcard
          title="✉️ SMS Records"
          value={smsCount}
          color="#22C55E"
        />
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#111827",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2>📈 Call Trend</h2>

          <CallTrendChart />
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2>🎯 Risk Distribution</h2>

          <RiskChart />
        </div>
      </div>

      {/* Recent Alerts */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>
          Recent Alerts
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>
                Entity
              </th>

              <th style={{ textAlign: "left" }}>
                Alert Type
              </th>

              <th style={{ textAlign: "left" }}>
                Risk
              </th>
            </tr>
          </thead>

          <tbody>
            {alerts.map(
              (item, index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding:
                        "12px 0",
                    }}
                  >
                    {item.entity}
                  </td>

                  <td>
                    {item.alert}
                  </td>

                  <td
                    style={{
                      color:
                        item.risk ===
                        "High"
                          ? "#EF4444"
                          : "#FACC15",
                    }}
                  >
                    {item.risk}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Active Cases */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>
          Active Cases
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>
                Case ID
              </th>

              <th style={{ textAlign: "left" }}>
                Subject
              </th>

              <th style={{ textAlign: "left" }}>
                Priority
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>CASE-001</td>

              <td>
                High SMS Activity
              </td>

              <td
                style={{
                  color: "#EF4444",
                }}
              >
                High
              </td>
            </tr>

            <tr>
              <td>CASE-002</td>

              <td>
                Multiple IMEI
                Analysis
              </td>

              <td
                style={{
                  color: "#FACC15",
                }}
              >
                Medium
              </td>
            </tr>

            <tr>
              <td>CASE-003</td>

              <td>
                Contact Network
                Review
              </td>

              <td
                style={{
                  color: "#22C55E",
                }}
              >
                Low
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Dashboard;