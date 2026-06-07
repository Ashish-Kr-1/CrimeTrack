import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Cases() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const targetNumber =
    records.length > 0
      ? records[0][0]
          ?.replace(/'/g, "")
          ?.trim()
      : "Unknown";

  const totalRecords = records.length;

  // Real contacts only
  const contactCounts = {};

  records.forEach((row) => {
    let contact = row[3];

    if (!contact) return;

    contact = contact
      .replace(/'/g, "")
      .trim();

    if (!/^\d{5,15}$/.test(contact))
      return;

    contactCounts[contact] =
      (contactCounts[contact] || 0) + 1;
  });

  const uniqueContacts =
    Object.keys(contactCounts).length;

  const topContact =
    Object.entries(contactCounts).sort(
      (a, b) => b[1] - a[1]
    )[0] || ["Unknown", 0];

  // Tower analysis
  const towerCounts = {};

  records.forEach((row) => {
    const tower = row[10];

    if (!tower) return;

    towerCounts[tower] =
      (towerCounts[tower] || 0) + 1;
  });

  const uniqueTowers =
    Object.keys(towerCounts).length;

  const topTower =
    Object.entries(towerCounts).sort(
      (a, b) => b[1] - a[1]
    )[0] || ["Unknown", 0];

  // Simple risk score
  let riskLevel = "Low";

  if (totalRecords > 500) {
    riskLevel = "High";
  } else if (totalRecords > 200) {
    riskLevel = "Medium";
  }

  return (
    <div>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
        }}
      >
        Cases
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Auto-generated investigation
        cases from uploaded CDR.
      </p>

      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "30px",
        }}
      >
        <h2
          style={{
            marginBottom: "25px",
          }}
        >
          CASE-001
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Target Number
              </td>

              <td>{targetNumber}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Total Records
              </td>

              <td>{totalRecords}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Unique Contacts
              </td>

              <td>{uniqueContacts}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Unique Towers
              </td>

              <td>{uniqueTowers}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Top Contact
              </td>

              <td>{topContact[0]}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Contact Count
              </td>

              <td>{topContact[1]}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Most Used Tower
              </td>

              <td>{topTower[0]}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Tower Usage
              </td>

              <td>{topTower[1]}</td>
            </tr>

            <tr>
              <td
                style={{
                  padding: "8px 0",
                  fontWeight: "bold",
                }}
              >
                Risk Level
              </td>

              <td
                style={{
                  color:
                    riskLevel === "High"
                      ? "#EF4444"
                      : riskLevel ===
                        "Medium"
                      ? "#FACC15"
                      : "#22C55E",
                  fontWeight: "bold",
                }}
              >
                {riskLevel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Cases;