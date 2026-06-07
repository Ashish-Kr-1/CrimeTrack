import { createContext, useState } from "react";

export const CDRContext = createContext();

// Constants identical to the backend ai_engine.py
const BANK_KEYWORDS = [
  "BK", "BOI", "BOB", "BUP", "IND", "PNB", "IOB",
  "UPI", "PAYTM", "AXIS", "HDFC", "ICICI", "UNION",
  "ADHAAR", "SBI", "PSBANK", "CKYCR", "GRAMIN"
];

const UPI_GATEWAY_NUMBERS = new Set([
  "9667691414", "8433976037", "7506894867", "9071234567",
  "52263", "56161020", "9220592205", "9222692226"
]);

const HIGH_RISK_CIRCLES = new Set(["AIR BHR", "VF JHK", "JIO BHR", "VF BHR", "IDEA BHR"]);

const cleanVal = (val) => {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1);
  }
  return s.trim();
};

const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  // Format typically dd/mm/yyyy hh:mm:ss
  const dParts = dateStr.split("/");
  if (dParts.length === 3) {
    const day = parseInt(dParts[0], 10);
    const month = parseInt(dParts[1], 10) - 1; // 0-indexed month
    const year = parseInt(dParts[2], 10);
    const tParts = timeStr.split(":");
    if (tParts.length === 3) {
      const hours = parseInt(tParts[0], 10);
      const minutes = parseInt(tParts[1], 10);
      const seconds = parseInt(tParts[2], 10);
      return new Date(year, month, day, hours, minutes, seconds);
    }
  }
  // Try ISO fallback
  const d = new Date(`${dateStr} ${timeStr}`);
  return isNaN(d.getTime()) ? null : d;
};

export function CDRProvider({ children }) {
  const [cdrData, setCdrData] = useState([]);
  const [diagnosticReport, setDiagnosticReport] = useState(null);

  const processCDRData = (rows) => {
    // rows includes header row at index 0, so records start from index 1
    if (!rows || rows.length <= 1) {
      setDiagnosticReport(null);
      return;
    }

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

    const totalRecords = records.length;
    if (totalRecords === 0) {
      setDiagnosticReport(null);
      return;
    }

    // 1. Gather stats
    const targetNum = records[0]["Target No"] || "Unknown";
    const callTypes = {};
    const serviceTypes = {};
    const imeis = {};
    const imsis = {};
    const roamingNetworks = {};
    const cgiLocations = {};
    const cgiCounts = {};
    const bParties = {};
    const bPartyTypes = {};
    
    let minDate = null;
    let maxDate = null;
    let lastVoiceDate = null;
    
    const deviceTimeline = [];

    records.forEach((rec) => {
      const callType = rec["Call Type"];
      const svcType = rec["Service Type"];
      const bParty = rec["B Party No"];
      const imei = rec["IMEI"];
      const imsi = rec["IMSI"];
      const roam = rec["Roam Nw"];
      const cgi = rec["First CGI"];
      const latLong = rec["First CGI Lat/Long"];
      const dateStr = rec["Date"];
      const timeStr = rec["Time"];
      
      // Update simple counters
      if (callType) callTypes[callType] = (callTypes[callType] || 0) + 1;
      if (svcType) serviceTypes[svcType] = (serviceTypes[svcType] || 0) + 1;
      if (imei) imeis[imei] = (imeis[imei] || 0) + 1;
      if (imsi) imsis[imsi] = (imsis[imsi] || 0) + 1;
      if (roam) roamingNetworks[roam] = (roamingNetworks[roam] || 0) + 1;
      if (cgi) {
        cgiCounts[cgi] = (cgiCounts[cgi] || 0) + 1;
        if (latLong && latLong !== "-") {
          cgiLocations[cgi] = latLong;
        }
      }
      
      if (bParty) {
        bParties[bParty] = (bParties[bParty] || 0) + 1;
        if (!bPartyTypes[bParty]) bPartyTypes[bParty] = {};
        bPartyTypes[bParty][callType] = (bPartyTypes[bParty][callType] || 0) + 1;
      }

      // Parse dates
      const dt = parseDateTime(dateStr, timeStr);
      if (dt) {
        if (!minDate || dt < minDate) minDate = dt;
        if (!maxDate || dt > maxDate) maxDate = dt;
        
        const isVoice = (callType === "IN" || callType === "OUT" || svcType === "Voice");
        if (isVoice) {
          if (!lastVoiceDate || dt > lastVoiceDate) {
            lastVoiceDate = dt;
          }
        }

        deviceTimeline.push({
          timestamp: dt,
          imei,
          imsi,
          cgi,
          latLong,
          callType,
          bParty
        });
      }
    });

    // Sort device timeline
    deviceTimeline.sort((a, b) => a.timestamp - b.timestamp);

    // Group timeline into device usage intervals (operational phases)
    const deviceIntervals = [];
    if (deviceTimeline.length > 0) {
      let currentInterval = {
        imei: deviceTimeline[0].imei,
        imsi: deviceTimeline[0].imsi,
        start_time: deviceTimeline[0].timestamp,
        end_time: deviceTimeline[0].timestamp,
        count: 1
      };
      
      for (let j = 1; j < deviceTimeline.length; j++) {
        const x = deviceTimeline[j];
        if (x.imei === currentInterval.imei && x.imsi === currentInterval.imsi) {
          currentInterval.end_time = x.timestamp;
          currentInterval.count++;
        } else {
          deviceIntervals.push(currentInterval);
          currentInterval = {
            imei: x.imei,
            imsi: x.imsi,
            start_time: x.timestamp,
            end_time: x.timestamp,
            count: 1
          };
        }
      }
      deviceIntervals.push(currentInterval);
    }

    // Convert dates to display strings
    const formatDate = (d) => {
      if (!d) return null;
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      const hr = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const sc = String(d.getSeconds()).padStart(2, "0");
      return `${yr}-${mo}-${dy} ${hr}:${mi}:${sc}`;
    };

    // Calculate active days
    let activeDays = 1;
    if (minDate && maxDate) {
      const diffMs = maxDate - minDate;
      activeDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
    }

    // 2. Feature Engineering
    const features = {};
    const smsTotal = serviceTypes["SMS"] || 0;
    const voiceTotal = serviceTypes["Voice"] || 0;
    
    features.sms_ratio = smsTotal / totalRecords;
    features.voice_ratio = voiceTotal / totalRecords;
    features.active_days = activeDays;
    
    const numImeis = Object.keys(imeis).length;
    features.unique_imei_count = numImeis;
    features.device_swap_frequency = numImeis / (activeDays / 30.0);

    // Financial Features
    const bankSenders = new Set();
    let upiBurstCount = 0;
    const outgoingPersonalContacts = new Set();

    Object.keys(bParties).forEach((num) => {
      const isBank = BANK_KEYWORDS.some((kw) => num.toUpperCase().includes(kw));
      const isUpi = UPI_GATEWAY_NUMBERS.has(num);
      const types = bPartyTypes[num] || {};
      
      if (isBank) {
        bankSenders.add(num);
      }
      if (isUpi) {
        upiBurstCount += (types["SMO"] || 0);
      }
      if (!isBank && !isUpi) {
        // Real personal number (10-digit)
        if (/^\d{10}$/.test(num)) {
          outgoingPersonalContacts.add(num);
        }
      }
    });

    features.bank_sender_count = bankSenders.size;
    features.upi_burst_sms_count = upiBurstCount;
    features.personal_contact_count = outgoingPersonalContacts.size;

    const totalUniqueContacts = Object.keys(bParties).length;
    features.bank_sender_ratio = totalUniqueContacts ? bankSenders.size / totalUniqueContacts : 0;

    // Voice Cessation
    features.voice_silence_fraction = 0.0;
    if (lastVoiceDate && minDate && maxDate) {
      const silenceMs = maxDate - lastVoiceDate;
      const totalMs = maxDate - minDate;
      features.voice_silence_fraction = totalMs > 0 ? silenceMs / totalMs : 0.0;
    } else if (voiceTotal === 0) {
      features.voice_silence_fraction = 1.0;
    }

    // High risk circles
    let riskCircleEvents = 0;
    Object.keys(roamingNetworks).forEach((k) => {
      if (HIGH_RISK_CIRCLES.has(k)) {
        riskCircleEvents += roamingNetworks[k];
      }
    });
    features.high_risk_circle_ratio = riskCircleEvents / totalRecords;

    // 3. Evaluate rules
    const rules = [
      {
        code: "HIGH_SMS_RATIO",
        severity: "CRITICAL",
        points: 30,
        condition: (f) => f.sms_ratio > 0.90,
        detail: (f) => `SMS traffic is ${(f.sms_ratio * 100).toFixed(1)}% of total events (threshold: >90%). Strongly indicates an OTP/alert receiver role.`
      },
      {
        code: "MULTI_BANK_AGGREGATION",
        severity: "CRITICAL",
        points: 30,
        condition: (f) => f.bank_sender_count >= 5,
        detail: (f) => `SIM received traffic from ${f.bank_sender_count} distinct financial institutions (threshold: ≥5). A single user holding 5+ active bank accounts on one prepaid SIM is characteristic of a mule account cluster.`
      },
      {
        code: "UPI_BIND_BURST",
        severity: "CRITICAL",
        points: 25,
        condition: (f) => f.upi_burst_sms_count > 0,
        detail: (f) => `Detected ${f.upi_burst_sms_count} outgoing verification SMS to UPI gateway numbers. This pattern is generated by batch-binding multiple UPI wallet apps to bank accounts on a new device.`
      },
      {
        code: "RAPID_DEVICE_SWAPPING",
        severity: "HIGH",
        points: 20,
        condition: (f) => f.unique_imei_count >= 4,
        detail: (f) => `SIM card swapped across ${f.unique_imei_count} unique IMEIs (${f.device_swap_frequency.toFixed(1)} swaps/month) over ${f.active_days} days. Coordinated device handoffs are used to evade IMEI-based fraud tracking.`
      },
      {
        code: "VOICE_CESSATION",
        severity: "HIGH",
        points: 20,
        condition: (f) => f.voice_silence_fraction > 0.80,
        detail: (f) => `Voice calls stopped after the first ${(100 - f.voice_silence_fraction * 100).toFixed(0)}% of the active period (${(f.voice_silence_fraction * 100).toFixed(1)}% of total time was voice-silent). This 'line warming then abandonment' pattern is typical of an operational SIM after the testing phase.`
      },
      {
        code: "NO_PERSONAL_SOCIAL_FOOTPRINT",
        severity: "MEDIUM",
        points: 15,
        condition: (f) => f.personal_contact_count <= 2,
        detail: (f) => `Only ${f.personal_contact_count} recurring personal contacts found. Genuine users maintain a stable social network of 10+ contacts. This SIM shows near-zero personal social activity.`
      },
      {
        code: "HIGH_RISK_GEOGRAPHIC_CIRCLE",
        severity: "MEDIUM",
        points: 10,
        condition: (f) => f.high_risk_circle_ratio > 0,
        detail: (f) => `Detected activity in known high-risk telecom circle(s). ${(f.high_risk_circle_ratio * 100).toFixed(1)}% of events originated from circles flagged as cyber-fraud operational hubs.`
      },
      {
        code: "HIGH_BANK_SENDER_RATIO",
        severity: "MEDIUM",
        points: 10,
        condition: (f) => f.bank_sender_ratio > 0.60,
        detail: (f) => `${(f.bank_sender_ratio * 100).toFixed(0)}% of all unique contacts are financial institutions or UPI services (threshold: >60%). No substantial personal messaging detected.`
      }
    ];

    let score = 0;
    const triggeredRules = [];
    rules.forEach((rule) => {
      if (rule.condition(features)) {
        score += rule.points;
        triggeredRules.push({
          code: rule.code,
          severity: rule.severity,
          points: rule.points,
          detail: rule.detail(features)
        });
      }
    });

    // Classification
    let classification = "NORMAL_USER";
    let confidence = "LOW";
    if (score >= 100) {
      classification = "HIGHLY_SUSPECT_FINANCIAL_MULE";
      confidence = "HIGH";
    } else if (score >= 70) {
      classification = "SUSPECT_OPERATIONAL_SIM";
      confidence = "MEDIUM-HIGH";
    } else if (score >= 40) {
      classification = "ANOMALOUS_USAGE_PATTERN";
      confidence = "MEDIUM";
    }

    const maxPoints = rules.reduce((sum, r) => sum + r.points, 0);
    const suspicionNormalized = Math.round((Math.min(score / maxPoints, 1.0)) * 10000) / 10000;

    // Build operational phase display items
    const phaseMap = {
      0: "Testing / Line Warm-up Phase",
      1: "Device Handoff / Transit Phase",
      2: "Active Deployment / Transaction Phase",
      3: "Cool-down / Standby Phase"
    };

    const phases = deviceIntervals.map((interval, idx) => ({
      phase: phaseMap[idx] || `Phase ${idx + 1}`,
      imei: interval.imei,
      start: formatDate(interval.start_time),
      end: formatDate(interval.end_time),
      event_count: interval.count
    }));

    const report = {
      target_phone: targetNum,
      active_period: {
        from: formatDate(minDate),
        to: formatDate(maxDate),
        total_days: activeDays
      },
      classification,
      confidence_level: confidence,
      suspicion_score: suspicionNormalized,
      raw_heuristic_score: score,
      max_possible_score: maxPoints,
      feature_vector: {
        total_records: totalRecords,
        sms_ratio_pct: Math.round(features.sms_ratio * 10000) / 100,
        voice_ratio_pct: Math.round(features.voice_ratio * 10000) / 100,
        bank_sender_count: features.bank_sender_count,
        bank_sender_ratio_pct: Math.round(features.bank_sender_ratio * 10000) / 100,
        unique_imei_count: features.unique_imei_count,
        device_swaps_per_month: Math.round(features.device_swap_frequency * 100) / 100,
        upi_burst_sms_count: features.upi_burst_sms_count,
        personal_contact_count: features.personal_contact_count,
        voice_silence_fraction_pct: Math.round(features.voice_silence_fraction * 10000) / 100,
        active_circles: Object.keys(roamingNetworks),
        high_risk_circle_ratio_pct: Math.round(features.high_risk_circle_ratio * 10000) / 100
      },
      triggered_indicators: triggeredRules,
      operational_phases: phases,
      risk_summary: {
        red_flags_count: triggeredRules.filter(r => r.severity === "CRITICAL").length,
        yellow_flags_count: triggeredRules.filter(r => r.severity !== "CRITICAL").length,
        recommended_action: classification === "HIGHLY_SUSPECT_FINANCIAL_MULE" ? "REFER TO LEO / FREEZE ACCOUNTS" : "MONITOR AND RE-EVALUATE"
      }
    };

    setDiagnosticReport(report);
  };

  const updateCDRDataAndProcess = (data) => {
    setCdrData(data);
    processCDRData(data);
  };

  return (
    <CDRContext.Provider
      value={{
        cdrData,
        setCdrData: updateCDRDataAndProcess,
        diagnosticReport
      }}
    >
      {children}
    </CDRContext.Provider>
  );
}