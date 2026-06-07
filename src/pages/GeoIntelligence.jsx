import { useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function GeoIntelligence() {
  const { cdrData } = useContext(CDRContext);

  const records = cdrData.slice(1);

  const locationCounts = {};
  const cgiCounts = {};

  records.forEach((row) => {
    const location = row[9];
    const cgi = row[10];

    if (
      location &&
      location !== "0"
    ) {
      locationCounts[location] =
        (locationCounts[location] || 0) + 1;
    }

    if (
      cgi &&
      cgi !== "---"
    ) {
      cgiCounts[cgi] =
        (cgiCounts[cgi] || 0) + 1;
    }
  });

  const topLocations = Object.entries(
    locationCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCGIs = Object.entries(
    cgiCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const uniqueLocations =
    Object.keys(locationCounts).length;

  const mostFrequentLocation =
    topLocations.length > 0
      ? topLocations[0][0]
      : "Unknown";

  const mostFrequentCGI =
    topCGIs.length > 0
      ? topCGIs[0][0]
      : "Unknown";

  return (
    <div>
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "10px",
        }}
      >
        Geo Intelligence
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Geographic analysis of telecom
        activity using real CDR data.
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
          <h3>📍 Unique Locations</h3>

          <h2>
            {uniqueLocations}
          </h2>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>
            🌎 Most Frequent Location
          </h3>

          <div
            style={{
              marginTop: "10px",
              fontSize: "18px",
              wordBreak:
                "break-all",
            }}
          >
            {mostFrequentLocation}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#111827",
            padding: "20px",
            borderRadius: "16px",
          }}
        >
          <h3>
            📡 Most Frequent CGI
          </h3>

          <div
            style={{
              marginTop: "10px",
              fontSize: "18px",
              wordBreak:
                "break-all",
            }}
          >
            {mostFrequentCGI}
          </div>
        </div>
      </div>

      {/* Top Coordinates */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2>
          🛰️ Top Coordinates
        </h2>

        <table
          style={{
            width: "100%",
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
                Coordinates
              </th>

              <th
                style={{
                  textAlign: "left",
                }}
              >
                Occurrences
              </th>
            </tr>
          </thead>

          <tbody>
            {topLocations.map(
              (
                [location, count],
                index
              ) => (
                <tr key={index}>
                  <td
                    style={{
                      padding:
                        "12px 0",
                    }}
                  >
                    {location}
                  </td>

                  <td>{count}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Top CGI Towers */}
      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h2>
          📡 Top CGI Towers
        </h2>

        <table
          style={{
            width: "100%",
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
                CGI Tower
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
            {topCGIs.map(
              ([cgi, count], index) => (
                <tr key={index}>
                  <td
                    style={{
                      padding:
                        "12px 0",
                    }}
                  >
                    {cgi}
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

export default GeoIntelligence;