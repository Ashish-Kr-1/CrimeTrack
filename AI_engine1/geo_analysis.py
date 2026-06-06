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

# Parse datetimes and sort
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

# Analyze circle changes (Roam Nw)
roam_timeline = []
current_roam = {
    'network': records[0]['Roam Nw'],
    'start_time': records[0]['dt'],
    'end_time': records[0]['dt'],
    'count': 1,
    'cgis': {records[0]['First CGI']}
}

for r in records[1:]:
    net = r['Roam Nw']
    cgi = r['First CGI']
    if net == current_roam['network']:
        current_roam['end_time'] = r['dt']
        current_roam['count'] += 1
        current_roam['cgis'].add(cgi)
    else:
        roam_timeline.append(current_roam)
        current_roam = {
            'network': net,
            'start_time': r['dt'],
            'end_time': r['dt'],
            'count': 1,
            'cgis': {cgi}
        }
roam_timeline.append(current_roam)

print("--- Geolocation & Circle Movement Timeline ---")
for idx, entry in enumerate(roam_timeline):
    start_str = entry['start_time'].strftime("%Y-%m-%d %H:%M:%S")
    end_str = entry['end_time'].strftime("%Y-%m-%d %H:%M:%S")
    print(f"{idx+1}. Network: {entry['network']}")
    print(f"   Period: {start_str} to {end_str}")
    print(f"   Events: {entry['count']}")
    print(f"   Unique CGIs: {len(entry['cgis'])}")
    print(f"   CGIs: {entry['cgis']}")

# Analyze outgoing communications (Voice/SMS)
outgoing = [r for r in records if r['Call Type'] in ('OUT', 'SMO')]
print(f"\nTotal Outgoing interactions: {len(outgoing)}")
for r in outgoing[:20]:
    print(f"[{r['Call Type']}] to {r['B Party No']} on {r['dt'].strftime('%Y-%m-%d %H:%M:%S')} (Dur: {r['Dur(s)']}s) via CGI {r['First CGI']} (Lat/Long: {r['First CGI Lat/Long']})")
