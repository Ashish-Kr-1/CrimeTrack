import csv
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

voice_calls = [r for r in records if r['Call Type'] in ('IN', 'OUT') or r['Service Type'] == 'Voice']

print(f"Total Voice Calls: {len(voice_calls)}")
print("Chronological Voice Call log:")
for idx, r in enumerate(voice_calls):
    print(f"  {idx+1:02d}. [{r['Call Type']}] B-Party: {r['B Party No']} | Date: {r['dt'].strftime('%Y-%m-%d %H:%M:%S')} | Dur: {r['Dur(s)']}s | Network: {r['Roam Nw']} | CGI: {r['First CGI']}")
