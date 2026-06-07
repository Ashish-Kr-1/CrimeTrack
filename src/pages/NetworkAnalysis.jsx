import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function NetworkAnalysis() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const targetNumber =
    records.length > 0
      ? records[0][0]
          ?.replace(/'/g, "")
          ?.trim()
      : "Unknown";

  const contactCounts = {};

  records.forEach((row) => {
    let contact = row[3];

    if (!contact) return;

    contact = contact
      .replace(/'/g, "")
      .trim();

    // Keep only numeric contacts
    if (!/^\d{5,15}$/.test(contact))
      return;

    contactCounts[contact] =
      (contactCounts[contact] || 0) + 1;
  });

  const topContacts = Object.entries(
    contactCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const totalContacts =
    Object.keys(contactCounts).length;

  const strongestContact =
    topContacts.length > 0
      ? topContacts[0][0]
      : "Unknown";

  const strongestCount =
    topContacts.length > 0
      ? topContacts[0][1]
      : 0;

  return (
    <div>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
        }}
      >
        Network Analysis
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Communication network extracted
        from uploaded CDR records.
      </p>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>🎯 Target Number</h3>
          <h2>{targetNumber}</h2>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>📞 Unique Contacts</h3>
          <h2>{totalContacts}</h2>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>⭐ Strongest Contact</h3>
          <div
            style={{
              fontSize: "18px",
              marginTop: "10px",
            }}
          >
            {strongestContact}
          </div>

          <div
            style={{
              color: "#22C55E",
              marginTop: "5px",
            }}
          >
            {strongestCount} interactions
          </div>
        </div>
      </div>

      {/* Network Table */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          🕸 Top Connected Contacts
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  paddingBottom: "15px",
                }}
              >
                Contact Number
              </th>

              <th
                style={{
                  textAlign: "left",
                  paddingBottom: "15px",
                }}
              >
                Interactions
              </th>

              <th
                style={{
                  textAlign: "left",
                  paddingBottom: "15px",
                }}
              >
                Network Strength
              </th>
            </tr>
          </thead>

          <tbody>
            {topContacts.map(
              (
                [contact, count],
                index
              ) => (
                <tr key={index}>
                  <td
                    style={{
                      padding:
                        "12px 0",
                    }}
                  >
                    {contact}
                  </td>

                  <td>{count}</td>

                  <td
                    style={{
                      color:
                        count >= 30
                          ? "#EF4444"
                          : count >= 15
                          ? "#FACC15"
                          : "#22C55E",
                    }}
                  >
                    {count >= 30
                      ? "Strong"
                      : count >= 15
                      ? "Medium"
                      : "Weak"}
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

export default NetworkAnalysis;