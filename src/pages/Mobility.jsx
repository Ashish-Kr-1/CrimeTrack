import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function Mobility() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  // Remove empty/broken rows
  const validRecords = records.filter(
    (row) =>
      row &&
      row.length > 10 &&
      row[6] &&
      row[7]
  );

  const towerCounts = {};

  validRecords.forEach((row) => {
    const tower = row[10];

    if (!tower) return;

    towerCounts[tower] =
      (towerCounts[tower] || 0) + 1;
  });

  const topTowers = Object.entries(
    towerCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const uniqueTowers = new Set(
    validRecords
      .map((row) => row[10])
      .filter(Boolean)
  ).size;

  const mostUsedTower =
    topTowers.length > 0
      ? topTowers[0][0]
      : "Unknown";

  const recentMovements = validRecords
    .slice(-10)
    .reverse();

  const latestMovement =
    recentMovements.length > 0
      ? recentMovements[0]
      : [];

  const lastActivity =
    latestMovement.length > 0
      ? `${latestMovement[6]} ${latestMovement[7]}`
      : "Unknown";

  return (
    <div>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
        }}
      >
        Mobility Intelligence
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Tower and movement analysis
        from uploaded CDR.
      </p>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
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
          <h3>🗼 Unique Towers</h3>
          <h2>{uniqueTowers}</h2>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>📍 Most Used Tower</h3>

          <div
            style={{
              fontSize: "18px",
              marginTop: "10px",
              wordBreak: "break-all",
            }}
          >
            {mostUsedTower}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>⏱ Last Activity</h3>

          <div
            style={{
              fontSize: "18px",
              marginTop: "10px",
            }}
          >
            {lastActivity}
          </div>
        </div>
      </div>

      {/* Recent Tower Activity */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>Recent Tower Activity</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                }}
              >
                Date
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Time
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Tower
              </th>
            </tr>
          </thead>

          <tbody>
            {recentMovements.map(
              (row, index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding: "12px 0",
                    }}
                  >
                    {row[6]}
                  </td>

                  <td>{row[7]}</td>

                  <td>{row[10]}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Most Used Towers */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h2>Most Used Towers</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                }}
              >
                Tower ID
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Activity Count
              </th>
            </tr>
          </thead>

          <tbody>
            {topTowers.map(
              ([tower, count], index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding: "12px 0",
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {tower}
                  </td>

                  <td>{count}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Mobility;