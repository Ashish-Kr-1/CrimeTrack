import { useState, useContext } from "react";
import { CDRContext } from "../context/CDRContext";

function UploadCenter() {
  const [selectedFile, setSelectedFile] = useState(null);

  const { setCdrData } = useContext(CDRContext);

  const [uploads, setUploads] = useState([
    {
      fileName: "cdr_june.csv",
      type: "CDR",
      status: "Completed",
    },
    {
      fileName: "tower_dump.xlsx",
      type: "Tower Dump",
      status: "Processing",
    },
    {
      fileName: "devices.csv",
      type: "Device Data",
      status: "Completed",
    },
  ]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    setUploads([
      {
        fileName: file.name,
        type: "User Upload",
        status: "Completed",
      },
      ...uploads,
    ]);

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;

      const rows = text
        .split("\n")
        .map((row) => row.split(","));

      // Skip Airtel report title rows
      const actualData = rows.slice(6);

      setCdrData(actualData);

      console.log(
        "CDR Loaded:",
        actualData.length
      );

      console.log(
        "HEADER:",
        actualData[0]
      );

      console.log(
        "FIRST RECORD:",
        actualData[1]
      );
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "10px",
        }}
      >
        Upload Center
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Upload telecom datasets for analysis.
      </p>

      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          height: "350px",
          border: "2px dashed #334155",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2>📁 Drag & Drop Files Here</h2>

        <p
          style={{
            color: "#94A3B8",
            marginTop: "10px",
          }}
        >
          Supported: CDR, Tower Dump, Device Data
        </p>

        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        <button
          onClick={() =>
            document
              .getElementById("fileInput")
              .click()
          }
          style={{
            marginTop: "20px",
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Browse Files
        </button>

        {selectedFile && (
          <p
            style={{
              marginTop: "15px",
              color: "#22C55E",
            }}
          >
            Selected File: {selectedFile.name}
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "#111827",
          borderRadius: "16px",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>
          Recent Uploads
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
                File Name
              </th>
              <th style={{ textAlign: "left" }}>
                Type
              </th>
              <th style={{ textAlign: "left" }}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {uploads.map((file, index) => (
              <tr key={index}>
                <td>{file.fileName}</td>

                <td>{file.type}</td>

                <td
                  style={{
                    color:
                      file.status ===
                      "Completed"
                        ? "#22C55E"
                        : "#FACC15",
                  }}
                >
                  {file.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UploadCenter;