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
  try {
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
    
    console.log('Parsed Records:', records.length);
    console.log('Sample Record:', records[0]);
    
    let score = 0;
    // Just testing to see if any errors are thrown during execution
  } catch (err) {
    console.error('Error during parsing:', err);
  }
};
processCDRData(rows);
