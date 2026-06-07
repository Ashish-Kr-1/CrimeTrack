import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function RiskCenter() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const contactCounts = {};

 records.forEach((row) => {
  const contact = row[3]
    ?.replace(/'/g, "")
    .trim();

  if (!contact) return;

  // Only keep numeric contacts
  if (!/^\d{5,15}$/.test(contact))
    return;

  contactCounts[contact] =
    (contactCounts[contact] || 0) + 1;
});

  const topContacts = Object.entries(
    contactCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const highRisk = topContacts.filter(
    ([, count]) => count > 30
  ).length;

  const mediumRisk = topContacts.filter(
    ([, count]) => count > 10 && count <= 30
  ).length;

  const lowRisk = topContacts.filter(
    ([, count]) => count <= 10
  ).length;

  return (
    <div>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
        }}
      >
        Risk Center
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        High-risk telecom entities
        identified from uploaded CDR.
      </p>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            backgroundColor: "#111827",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#EF4444",
            }}
          >
            🔴 High Risk
          </h2>

          <h1>{highRisk}</h1>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#FACC15",
            }}
          >
            🟡 Medium Risk
          </h2>

          <h1>{mediumRisk}</h1>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#22C55E",
            }}
          >
            🟢 Low Risk
          </h2>

          <h1>{lowRisk}</h1>
        </div>
      </div>

      {/* Risk Table */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Risk Analysis Table
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  paddingBottom: "10px",
                }}
              >
                Contact Number
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Interaction Count
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Risk Level
              </th>
            </tr>
          </thead>

          <tbody>
            {topContacts.map(
              (
                [number, count],
                index
              ) => (
                <tr key={index}>
                  <td
                    style={{
                      padding:
                        "12px 0",
                    }}
                  >
                    {number}
                  </td>

                  <td>{count}</td>

                  <td
                    style={{
                      color:
                        count > 30
                          ? "#EF4444"
                          : count > 10
                          ? "#FACC15"
                          : "#22C55E",
                    }}
                  >
                    {count > 30
                      ? "High"
                      : count > 10
                      ? "Medium"
                      : "Low"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RiskCenter;