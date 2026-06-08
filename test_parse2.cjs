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
    if (totalRecords === 0) {
      console.log('No records');
      return;
    }

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

    deviceTimeline.sort((a, b) => a.timestamp - b.timestamp);

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

    features.voice_silence_fraction = 0.0;
    if (lastVoiceDate && minDate && maxDate) {
      const silenceMs = maxDate - lastVoiceDate;
      const totalMs = maxDate - minDate;
      features.voice_silence_fraction = totalMs > 0 ? silenceMs / totalMs : 0.0;
    } else if (voiceTotal === 0) {
      features.voice_silence_fraction = 1.0;
    }

    let riskCircleEvents = 0;
    Object.keys(roamingNetworks).forEach((k) => {
      if (HIGH_RISK_CIRCLES.has(k)) {
        riskCircleEvents += roamingNetworks[k];
      }
    });
    features.high_risk_circle_ratio = riskCircleEvents / totalRecords;
    
    console.log("Got to the end without crashing!");
};
processCDRData(rows);
