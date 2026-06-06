import csv
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime

# Set default CSV path
default_csv = '/Users/ayushk/SummerIntern/9520995378_1.csv'
csv_path = sys.argv[1] if len(sys.argv) > 1 else default_csv
output_json_path = '/Users/ayushk/SummerIntern/cdr_stats.json'

if not os.path.exists(csv_path):
    print(f"Error: CSV file not found at {csv_path}")
    print("Usage: python3 analyze.py <path_to_cdr_csv>")
    sys.exit(1)

# Extract target number from filename (e.g. "9520995378_1.csv" -> "9520995378")
base_filename = os.path.basename(csv_path)
target_num = base_filename.split('_')[0].split('.')[0]

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
        record = {}
        for col_name, val in zip(header, row):
            record[col_name] = clean_val(val)
        records.append(record)

total_records = len(records)

# 1. Temporal range & trends
dates = []
hourly_counts = Counter()
daily_counts = Counter()
weekday_counts = Counter()
call_type_counts = Counter()
service_type_counts = Counter()
toc_counts = Counter()

# 2. Devices (IMEI, IMSI)
imeis = Counter()
imsis = Counter()
imei_imsi_pairs = Counter()
device_timeline = []

# 3. B-Party (Contacts)
b_parties = Counter()
b_party_durations = defaultdict(int)
b_party_types = defaultdict(Counter)

# 4. Locations (CGI)
cgis = Counter()
cgi_locations = {} # cgi -> lat/long
roaming_networks = Counter()
msc_ids = Counter()

last_voice_dt = None

for rec in records:
    date_str = rec.get('Date', '')
    time_str = rec.get('Time', '')
    call_type = rec.get('Call Type', '')
    toc = rec.get('TOC', '')
    b_party = rec.get('B Party No', '')
    dur_str = rec.get('Dur(s)', '0')
    cgi = rec.get('First CGI', '')
    lat_long = rec.get('First CGI Lat/Long', '')
    smsc = rec.get('SMSC No', '')
    service = rec.get('Service Type', '')
    imei = rec.get('IMEI', '')
    imsi = rec.get('IMSI', '')
    roam = rec.get('Roam Nw', '')
    msc = rec.get('SW & MSC ID', '')
    
    try:
        dur = int(dur_str) if dur_str else 0
    except ValueError:
        dur = 0

    # Parse date
    dt = None
    if date_str and time_str:
        try:
            dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M:%S")
        except ValueError:
            try:
                dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
            except ValueError:
                pass
                
    if dt:
        dates.append(dt)
        hourly_counts[dt.hour] += 1
        daily_counts[dt.strftime("%Y-%m-%d")] += 1
        weekday_counts[dt.strftime("%A")] += 1
        
        device_timeline.append({
            'timestamp': dt.strftime("%Y-%m-%d %H:%M:%S"),
            'imei': imei,
            'imsi': imsi,
            'cgi': cgi,
            'lat_long': lat_long,
            'call_type': call_type,
            'b_party': b_party
        })

        # Track last voice event dynamically
        is_voice = (call_type in ('IN', 'OUT') or service == 'Voice')
        if is_voice:
            if last_voice_dt is None or dt > last_voice_dt:
                last_voice_dt = dt

    call_type_counts[call_type] += 1
    service_type_counts[service] += 1
    toc_counts[toc] += 1
    
    if imei:
        imeis[imei] += 1
    if imsi:
        imsis[imsi] += 1
    if imei and imsi:
        imei_imsi_pairs[(imei, imsi)] += 1
        
    if b_party:
        b_parties[b_party] += 1
        b_party_durations[b_party] += dur
        b_party_types[b_party][call_type] += 1
        
    if cgi:
        cgis[cgi] += 1
        if lat_long and lat_long != '-':
            cgi_locations[cgi] = lat_long
            
    if roam:
        roaming_networks[roam] += 1
    if msc:
        msc_ids[msc] += 1

# Sort device timeline by timestamp
device_timeline.sort(key=lambda x: x['timestamp'])

# Group timeline into intervals of IMEI/IMSI usage
device_intervals = []
if device_timeline:
    current_interval = {
        'imei': device_timeline[0]['imei'],
        'imsi': device_timeline[0]['imsi'],
        'start_time': device_timeline[0]['timestamp'],
        'end_time': device_timeline[0]['timestamp'],
        'count': 1
    }
    for x in device_timeline[1:]:
        if x['imei'] == current_interval['imei'] and x['imsi'] == current_interval['imsi']:
            current_interval['end_time'] = x['timestamp']
            current_interval['count'] += 1
        else:
            device_intervals.append(current_interval)
            current_interval = {
                'imei': x['imei'],
                'imsi': x['imsi'],
                'start_time': x['timestamp'],
                'end_time': x['timestamp'],
                'count': 1
            }
    device_intervals.append(current_interval)

# Movement timeline (CGI location changes)
location_timeline = []
if device_timeline:
    current_loc = {
        'cgi': device_timeline[0]['cgi'],
        'lat_long': device_timeline[0]['lat_long'],
        'start_time': device_timeline[0]['timestamp'],
        'end_time': device_timeline[0]['timestamp'],
        'count': 1
    }
    for x in device_timeline[1:]:
        if x['cgi'] == current_loc['cgi']:
            current_loc['end_time'] = x['timestamp']
            current_loc['count'] += 1
        else:
            location_timeline.append(current_loc)
            current_loc = {
                'cgi': x['cgi'],
                'lat_long': x['lat_long'],
                'start_time': x['timestamp'],
                'end_time': x['timestamp'],
                'count': 1
            }
    location_timeline.append(current_loc)

# Compile results
stats = {
    'target_num': target_num,
    'total_records': total_records,
    'date_range': {
        'start': min(dates).strftime("%Y-%m-%d %H:%M:%S") if dates else None,
        'end': max(dates).strftime("%Y-%m-%d %H:%M:%S") if dates else None
    },
    'last_voice_event': last_voice_dt.strftime("%Y-%m-%d %H:%M:%S") if last_voice_dt else None,
    'call_types': dict(call_type_counts),
    'service_types': dict(service_type_counts),
    'toc': dict(toc_counts),
    'imeis': dict(imeis),
    'imsis': dict(imsis),
    'imei_imsi_pairs': {f"{k[0]} / {k[1]}": v for k, v in imei_imsi_pairs.items()},
    'device_intervals': device_intervals,
    'roaming_networks': dict(roaming_networks),
    'msc_ids': dict(msc_ids),
    'top_b_parties': [
        {
            'number': num,
            'count': count,
            'duration_s': b_party_durations[num],
            'types': dict(b_party_types[num])
        } for num, count in b_parties.most_common(20)
    ],
    'top_cgis': [
        {
            'cgi': cgi,
            'count': count,
            'lat_long': cgi_locations.get(cgi, 'Unknown')
        } for cgi, count in cgis.most_common(15)
    ],
    'location_timeline': location_timeline[-30:], # Last 30 locations for summary
    'hourly_activity': dict(sorted(hourly_counts.items())),
    'daily_activity': dict(sorted(daily_counts.items())),
    'weekday_activity': dict(weekday_counts)
}

with open(output_json_path, 'w') as f:
    json.dump(stats, f, indent=2)

print(f"Analysis completed successfully for {target_num}. Output saved to cdr_stats.json.")
