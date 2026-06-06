import csv
from collections import Counter, defaultdict
from datetime import datetime

csv_path = '/Users/ayushk/SummerIntern/9520995378_1.csv'

def clean_val(val):
    if not val:
        return ''
    val = val.strip()
    if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
        val = val[1:-1]
    return val.strip()

records = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = [clean_val(h) for h in next(reader)]
    for row in reader:
        if not row:
            continue
        record = {col: clean_val(val) for col, val in zip(header, row)}
        records.append(record)

for r in records:
    d = r.get('Date', '')
    t = r.get('Time', '')
    try:
        r['dt'] = datetime.strptime(f"{d} {t}", "%d/%m/%Y %H:%M:%S")
    except ValueError:
        try:
            r['dt'] = datetime.strptime(f"{d} {t}", "%Y-%m-%d %H:%M:%S")
        except ValueError:
            r['dt'] = None

records = [r for r in records if r['dt'] is not None]
records.sort(key=lambda x: x['dt'])

bank_keywords = ['BK', 'SMS', 'IND', 'BUP', 'BOI', 'BOB', 'PNB', 'IOB', 'UPI', 'PAYTM', 'AXIS', 'HDFC', 'ICICI', 'UNION', 'ADHAAR', 'SBI', 'PSBANK', 'CKYCR']
bank_records = []
bank_counts = Counter()

for r in records:
    b_party = r['B Party No']
    is_bank = False
    for kw in bank_keywords:
        if kw in b_party.upper():
            is_bank = True
            break
    # also check if length is short or has format XX-XXXXXX
    if len(b_party) <= 12 and '-' in b_party:
        is_bank = True
        
    if is_bank:
        bank_records.append(r)
        bank_counts[b_party] += 1

print(f"Total Bank/OTP Records: {len(bank_records)} out of {len(records)}")
print("\nTop Bank/Service Sender Identifiers:")
for num, count in bank_counts.most_common(25):
    print(f"  {num}: {count} events")

# Group by Date
bank_by_date = Counter()
for r in bank_records:
    date_str = r['dt'].strftime("%Y-%m-%d")
    bank_by_date[date_str] += 1

print("\nBank Alert Activity by Date:")
for d, count in sorted(bank_by_date.items()):
    print(f"  {d}: {count} alerts")

# Let's inspect SMO (Outgoing SMS) on Jan 14
smo_jan14 = [r for r in records if r['dt'].strftime("%Y-%m-%d") == '2026-01-14' and r['Call Type'] == 'SMO']
print(f"\nOutgoing SMS (SMO) on Jan 14:")
for r in smo_jan14:
    print(f"  {r['dt'].strftime('%H:%M:%S')} to {r['B Party No']} (SMSC: {r['SMSC No']})")
