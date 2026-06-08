const fs = require('fs');

const BANK_KEYWORDS = [
  'BK', 'BOI', 'BOB', 'BUP', 'IND', 'PNB', 'IOB',
  'UPI', 'PAYTM', 'AXIS', 'HDFC', 'ICICI', 'UNION',
  'ADHAAR', 'SBI', 'PSBANK', 'CKYCR', 'GRAMIN'
];
const UPI_GATEWAY_NUMBERS = new Set([
  '9667691414', '8433976037', '7506894867', '9071234567',
  '52263', '56161020', '9220592205', '9222692226'
]);
const HIGH_RISK_CIRCLES = new Set(['AIR BHR', 'VF JHK', 'JIO BHR', 'VF BHR', 'IDEA BHR']);

const cleanVal = (val) => {
  if (!val) return '';
  let s = val.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('\"') && s.endsWith('\"'))) {
    s = s.slice(1, -1);
  }
  return s.trim();
};

const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const dParts = dateStr.split('/');
  if (dParts.length === 3) {
    const day = parseInt(dParts[0], 10);
    const month = parseInt(dParts[1], 10) - 1;
    const year = parseInt(dParts[2], 10);
    const tParts = timeStr.split(':');
    if (tParts.length === 3) {
      const hours = parseInt(tParts[0], 10);
      const minutes = parseInt(tParts[1], 10);
      const seconds = parseInt(tParts[2], 10);
      return new Date(year, month, day, hours, minutes, seconds);
    }
  }
  const d = new Date(dateStr + ' ' + timeStr);
  return isNaN(d.getTime()) ? null : d;
};

const parseCoords = (latLongStr) => {
  if (!latLongStr || latLongStr === "-") return null;
  const parts = latLongStr.split("/");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng];
    }
  }
  return null;
};

const generateRelationshipGraphData = (targetNum, records, topContacts, topCGIs) => {
  const nodes = [
    { id: targetNum, label: targetNum, type: "target", val: 24, info: "Suspect SIM Target" }
  ];
  const links = [];
  const addedNodes = new Set([targetNum]);

  // Unique IMEIs
  const uniqueImeis = new Set();
  records.forEach(r => {
    if (r.IMEI && r.IMEI !== "-" && r.IMEI !== "Unknown") {
      uniqueImeis.add(r.IMEI);
    }
  });
  uniqueImeis.forEach(imei => {
    const id = `IMEI:${imei}`;
    if (!addedNodes.has(id)) {
      nodes.push({
        id,
        label: `IMEI: ${imei.slice(-6)}`,
        type: "imei",
        val: 16,
        info: `Handset ID: ${imei}`
      });
      addedNodes.add(id);
    }
    links.push({
      source: targetNum,
      target: id,
      type: "hardware",
      label: "Used Hardware"
    });
  });

  // Unique Banks
  const detectedBanks = new Set();
  records.forEach(r => {
    const bp = r["B Party No"];
    if (bp) {
      BANK_KEYWORDS.forEach(kw => {
        if (bp.toUpperCase().includes(kw)) {
          detectedBanks.add(kw);
        }
      });
    }
  });
  detectedBanks.forEach(bank => {
    const id = `BANK:${bank}`;
    if (!addedNodes.has(id)) {
      nodes.push({
        id,
        label: bank,
        type: "bank",
        val: 18,
        info: `Financial Institution: ${bank}`
      });
      addedNodes.add(id);
    }
    links.push({
      source: targetNum,
      target: id,
      type: "financial",
      label: "Receives Alerts"
    });
  });

  // Top contacts
  topContacts.forEach(([contact, count]) => {
    const id = `CONTACT:${contact}`;
    const isUpi = UPI_GATEWAY_NUMBERS.has(contact);
    const isBank = BANK_KEYWORDS.some(kw => contact.toUpperCase().includes(kw));
    if (isUpi || isBank) return;

    if (!addedNodes.has(id)) {
      nodes.push({
        id,
        label: contact.slice(-4),
        type: "contact",
        val: 14,
        info: `Associate Node: ${contact}`
      });
      addedNodes.add(id);
    }
    links.push({
      source: targetNum,
      target: id,
      type: "associate",
      label: `${count} Interactions`
    });
  });

  // Top locations
  topCGIs.forEach(([cgi, count]) => {
    const id = `CGI:${cgi}`;
    if (!addedNodes.has(id)) {
      nodes.push({
        id,
        label: cgi.slice(-6),
        type: "location",
        val: 12,
        info: `Cell Tower: ${cgi}`
      });
      addedNodes.add(id);
    }
    links.push({
      source: targetNum,
      target: id,
      type: "geospatial",
      label: `${count} Hops`
    });
  });

  return { nodes, links };
};

const generateReplayEvents = (records) => {
  const events = [];
  
  records.forEach((rec, idx) => {
    const dateStr = rec["Date"];
    const timeStr = rec["Time"];
    const bParty = rec["B Party No"] || "Unknown";
    const callType = rec["Call Type"] || "Unknown";
    const service = rec["Service Type"] || "Unknown";
    const imei = rec["IMEI"] || "Unknown";
    const cgi = rec["First CGI"] || "Unknown";
    const latLong = rec["First CGI Lat/Long"];
    const roam = rec["Roam Nw"] || "Unknown";

    const dt = parseDateTime(dateStr, timeStr);
    if (!dt) return;

    let type = "SMS";
    let details = "";
    let isAnomaly = false;

    const isUpi = UPI_GATEWAY_NUMBERS.has(bParty);
    const isBank = BANK_KEYWORDS.some(kw => bParty.toUpperCase().includes(kw));

    if (isUpi) {
      type = "UPI_REG";
      details = `Outgoing SMS to UPI Verification Gateway: ${bParty}`;
      isAnomaly = true;
    } else if (isBank) {
      type = "FINANCIAL";
      details = `Incoming Financial Notification (Sender: ${bParty})`;
      isAnomaly = true;
    } else if (callType === "IN" || callType === "OUT" || service === "Voice") {
      type = "VOICE";
      details = `${callType === "IN" ? "Incoming" : "Outgoing"} voice call with B-Party: ${bParty} (${rec["Dur(s)"]}s)`;
    } else {
      type = "SMS";
      details = `${callType === "SMT" ? "Incoming" : "Outgoing"} SMS from/to B-Party: ${bParty}`;
    }

    const prevRec = idx > 0 ? records[idx - 1] : null;
    if (prevRec && prevRec.IMEI && rec.IMEI && prevRec.IMEI !== rec.IMEI) {
      isAnomaly = true;
      details += ` [DEVICE SWAP: Handset changed from ${prevRec.IMEI} to ${rec.IMEI}]`;
    }

    events.push({
      id: idx + 1,
      timestamp: dt,
      timeLabel: `${dateStr} ${timeStr}`,
      type,
      direction: (callType === "IN" || callType === "SMT") ? "INCOMING" : "OUTGOING",
      bParty,
      cgi,
      coordinates: parseCoords(latLong),
      imei,
      roam,
      details,
      isAnomaly
    });
  });

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
};


const csv = fs.readFileSync('AI_engine1/9520995378_1.csv', 'utf8');
const rows = csv.split('\n').map(r => r.split(',')).filter(r => r.length > 1);

const processCDRData = (rows) => {
    const header = rows[0].map(h => cleanVal(h));
    const records = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length <= 1) continue;
      
      const record = {};
      header.forEach((colName, idx) => {
        record[colName] = cleanVal(row[idx]);
      });
      records.push(record);
    }
    const targetNum = records[0]["Target No"] || "Unknown";
    const bParties = {};
    const cgiCounts = {};
    
    records.forEach(r => {
        const bp = r["B Party No"];
        const cgi = r["First CGI"];
        if (bp) bParties[bp] = (bParties[bp] || 0) + 1;
        if (cgi) cgiCounts[cgi] = (cgiCounts[cgi] || 0) + 1;
    });

    const topContacts = Object.entries(bParties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const topCGIs = Object.entries(cgiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    try {
        const relationshipGraph = generateRelationshipGraphData(
            targetNum,
            records,
            topContacts,
            topCGIs
        );
        const replayEvents = generateReplayEvents(records);
        console.log("No crash. nodes:", relationshipGraph.nodes.length, "events:", replayEvents.length);
    } catch (e) {
        console.error(e);
    }
};
processCDRData(rows);
