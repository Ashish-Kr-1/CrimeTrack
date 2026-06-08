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


const generateBehavioralNarrative = (target, features, circles, start, end) => {
  let narrative = `Target SIM ${target} was operational over an active period of ${features.active_days} days (from ${start || "N/A"} to ${end || "N/A"}), generating a total of ${features.total_records} activity records. `;
  
  narrative += `The device telemetry revealed a footprint of ${features.unique_imei_count} distinct hardware device identifiers (IMEIs). This represents a device swap rate of ${features.device_swaps_per_month.toFixed(1)} swaps/month. Coordinated hardware transitions of this frequency are highly indicative of structured attempts to bypass terminal-based blacklisting and geo-fencing systems. `;

  if (features.bank_sender_count >= 5) {
    narrative += `A critical telemetry alert was triggered due to bank aggregation: the SIM card received SMS alerts and notifications from ${features.bank_sender_count} separate financial entities. In high-security investigations, a single prepaid subscriber holding 5 or more distinct active bank accounts on one SIM is a hallmark of financial mule accounts. `;
  } else if (features.bank_sender_count > 0) {
    narrative += `The SIM registered active banking notifications from ${features.bank_sender_count} distinct financial institutions. `;
  }

  if (features.upi_burst_sms_count > 0) {
    narrative += `Furthermore, the system logged ${features.upi_burst_sms_count} outgoing SMS transactions to UPI registration gateway short-codes. This signature indicates batch activation of UPI apps (GPay, PhonePe, Paytm) to bind bank accounts on a newly swapped device terminal. `;
  }

  if (features.voice_silence_fraction_pct > 80) {
    narrative += `Social footprint analysis detected total voice call cessation (voice-silent fraction: ${features.voice_silence_fraction_pct.toFixed(1)}%). The SIM card ceased voice activity after an initial "warming" phase, transitioning into an exclusive receiver for incoming text notifications and verification codes. `;
  }

  if (features.personal_contact_count <= 2) {
    narrative += `The subscriber's personal network footprint was extremely sparse, listing only ${features.personal_contact_count} personal communication partners, confirming a near-zero social footprint. This represents an inorganic, transaction-only profile rather than retail usage. `;
  } else {
    narrative += `The subscriber maintained regular communication with a social circle of ${features.personal_contact_count} contacts. `;
  }

  if (features.high_risk_circle_ratio_pct > 0) {
    narrative += `Geospatial logs place the target in active roaming circles, with ${features.high_risk_circle_ratio_pct.toFixed(1)}% of all telemetric events originating from circles historically flagged as cyber-fraud operational circles (e.g. Bihar/Jharkhand). `;
  } else {
    narrative += `Activity was mapped entirely within standard nominal circles. `;
  }

  return narrative;
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
    const totalRecords = records.length;
    const targetNum = records[0]["Target No"] || "Unknown";
    
    const fVector = {
      total_records: totalRecords,
      active_days: 10,
      sms_ratio_pct: 10,
      voice_ratio_pct: 20,
      bank_sender_count: 5,
      bank_sender_ratio_pct: 15,
      unique_imei_count: 2,
      device_swaps_per_month: 2,
      upi_burst_sms_count: 5,
      personal_contact_count: 2,
      voice_silence_fraction_pct: 90,
      active_circles: ["AIR BHR"],
      high_risk_circle_ratio_pct: 10
    };
    
    let minDate = new Date();
    let maxDate = new Date();

    try {
        const behavioralNarrative = generateBehavioralNarrative(
            targetNum,
            fVector,
            fVector.active_circles,
            formatDate(minDate),
            formatDate(maxDate)
        );
        console.log("No crash. narrative:", behavioralNarrative.substring(0, 50));
    } catch (e) {
        console.error(e);
    }
};
processCDRData(rows);
