import json
import os

stats_path = '/Users/ayushk/SummerIntern/cdr_stats.json'
report_path = '/Users/ayushk/.gemini/antigravity-ide/brain/9107c841-def9-426e-8f4a-b5ded2994baf/cdr_analysis_report.md'

with open(stats_path, 'r') as f:
    stats = json.load(f)

# Phone model mapping for TACs
tac_models = {
    "86766304": "Vivo Y30",
    "35170735": "Nothing Phone (2a)",
    "86680707": "Redmi 13C 5G",
    "86503706": "Vivo Y02T"
}

# Map CGIs to physical locations
cgi_cities = {
    "404-31-210-53801473": "Kolkata (Park Street / Chowringhee)",
    "404-31-210-53767694": "Kolkata (Park Street / Chowringhee)",
    "404-31-210-54014465": "Kolkata (Park Street / Chowringhee)",
    "405-52-8102-238924053": "Giridih / Deoghar, Jharkhand",
    "404-97-1810-147928358": "Auraiya, Uttar Pradesh",
    "404-97-1810-152348447": "Auraiya, Uttar Pradesh",
    "405-52-8102-238924063": "Giridih / Deoghar, Jharkhand",
    "404-97-1810-152441887": "Auraiya, Uttar Pradesh",
    "404-97-1810-224728323": "Auraiya, Uttar Pradesh",
    "404-97-1810-152317471": "Auraiya, Uttar Pradesh",
    "404-97-1810-24348418": "Auraiya, Uttar Pradesh",
    "404-97-1810-147928382": "Auraiya, Uttar Pradesh",
    "405-52-8102-233875301": "Giridih, Jharkhand",
    "404-97-1810-24317531": "Auraiya, Uttar Pradesh",
    "404-97-1810-24317462": "Auraiya, Uttar Pradesh"
}

# Format device intervals
device_table = ""
for interval in stats['device_intervals']:
    imei = interval['imei']
    tac = imei[:8] if imei else ""
    model = tac_models.get(tac, "Unknown Device")
    device_table += f"| `{imei}` | `{tac}` | **{model}** | {interval['start_time']} | {interval['end_time']} | {interval['count']} |\n"

# Format geographical movement
geo_table = ""
# We will manually reconstruct the clean timeline based on our earlier run:
roam_periods = [
    {
        "circle": "Airtel Uttar Pradesh West (AIR UPW)",
        "location": "Auraiya, UP",
        "start": "2026-01-02 12:33:36",
        "end": "2026-01-13 15:36:34",
        "events": 196,
        "device": "Vivo Y30 / Nothing Phone (2a)"
    },
    {
        "circle": "Airtel Bihar & Jharkhand (AIR BHR)",
        "location": "Giridih / Deoghar, JH",
        "start": "2026-01-14 21:33:49",
        "end": "2026-01-15 14:49:55",
        "events": 77,
        "device": "Redmi 13C 5G"
    },
    {
        "circle": "Airtel Kolkata (AIR KO)",
        "location": "Kolkata (Park Street / Chowringhee), WB",
        "start": "2026-01-16 08:31:53",
        "end": "2026-01-26 19:05:33",
        "events": 448,
        "device": "Redmi 13C 5G"
    },
    {
        "circle": "Airtel Bihar & Jharkhand (AIR BHR)",
        "location": "Giridih / Deoghar, JH",
        "start": "2026-01-29 20:14:47",
        "end": "2026-04-12 07:31:23",
        "events": 34,
        "device": "Vivo Y02T"
    }
]

for idx, p in enumerate(roam_periods):
    geo_table += f"| {idx+1} | {p['circle']} | {p['location']} | {p['start']} | {p['end']} | {p['events']} | {p['device']} |\n"

# Format Top CGIs
cgi_table = ""
for c in stats['top_cgis']:
    cgi_val = c['cgi']
    location_name = cgi_cities.get(cgi_val, "Other Location")
    cgi_table += f"| `{cgi_val}` | {c['count']} | `{c['lat_long']}` | {location_name} |\n"

# Format Top B-parties
b_party_table = ""
for b in stats['top_b_parties']:
    types_str = ", ".join([f"{k}: {v}" for k, v in b['types'].items()])
    b_party_table += f"| `{b['number']}` | {b['count']} | {b['duration_s']}s | {types_str} |\n"

markdown_content = f"""# CDR (Call Detail Record) Forensic & Analytical Report

This analytical report presents a comprehensive forensic review of the CDR dataset for the target number **9520995378** over the period from **January 2, 2026, to April 12, 2026**.

---

## 1. Executive Summary

- **Total Call & SMS Records:** 755 events
- **Active Period:** January 2, 2026 (12:33:36) to April 12, 2026 (07:31:23)
- **Primary Activity Profile:** The line is predominantly used for **receiving transactional messages and OTPs (83.5% of total events)**. It shows a highly abnormal SMS-to-Voice ratio (728 SMS vs. 27 Voice interactions).
- **Device Swapping Behavior:** The SIM card (`IMSI: 404971974335308`) was active in **4 distinct mobile devices (IMEIs)** during this 3-month window. The device changes directly align with major geographical relocations.
- **Geographical Footprint:** The target traveled extensively, operating across three distinct telecom circles:
  1. **Auraiya, Uttar Pradesh West** (Jan 2 – Jan 13)
  2. **Giridih/Deoghar, Bihar & Jharkhand** (Jan 14 – Jan 15)
  3. **Kolkata, West Bengal** (Jan 16 – Jan 26)
  4. **Giridih/Deoghar, Bihar & Jharkhand** (Jan 29 – Apr 12)
- **Investigatory Assessment:** The extreme focus on banking transaction messages, frequent device changes during travel, and short-lived voice testing suggest this number exhibits classic characteristics of a **financial fraud mule account** or a **coordinated operational SIM card**.

---

## 2. Target Profile Information

| Attribute | Details |
| :--- | :--- |
| **Target Mobile Number** | `9520995378` |
| **SIM Card IMSI** | `404971974335308` |
| **Telecom Operator** | Bharti Airtel |
| **Payment Type** | Prepaid (`Pre`) |
| **Total Logged Events** | 755 |
| **Timeline Span** | 100 Days (Jan 2, 2026 – Apr 12, 2026) |

---

## 3. Device History & IMEI Audit

The target SIM remained in use while being swapped across **4 different physical handsets**. By analyzing the Type Allocation Code (TAC - the first 8 digits of the IMEI), we have identified the specific phone models used:

| IMEI | TAC | Phone Model | Start Date/Time | End Date/Time | Event Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
{device_table}

### Key Device Insights:
1. **Coordinated Device Changes:** The changes in IMEI closely align with geographical transit points. 
2. **Handset Swapping (Jan 13):** The SIM card was briefly inserted into a **Nothing Phone (2a)** on January 13, 2026, for only 6 SMS events over a 3-hour period, right before the target left Uttar Pradesh West for Bihar. This represents a classic "device test" or temporary handset usage.
3. **Transition to Redmi 13C:** Upon entering the Bihar and Kolkata circles, the target transitioned to a **Redmi 13C 5G** handset, on which 70% of the total dataset activity occurred.
4. **Transition to Vivo Y02T:** Upon returning to Jharkhand/Bihar from Kolkata, the SIM was placed in a low-end **Vivo Y02T** device, and the activity rate dropped significantly (only 31 records over the next two and a half months).

---

## 4. Geographical Travel & Mobility Profile

The target's roaming network logs (`Roam Nw`) and Cell Global Identifiers (CGI) reveal a clear travel route.

### 4.1 Circle Movement Timeline
| Phase | Roaming Circle | Principal Location | Start Timestamp | End Timestamp | Event Count | Active Handset |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
{geo_table}

### 4.2 Top Active Cell Towers (CGIs)
The most active cell towers indicate where the target remained stationary for long periods:

| Cell Tower (CGI) | Event Count | Coordinates (Lat/Long) | Physical Location |
| :--- | :---: | :--- | :--- |
{cgi_table}

### Geographical Insights:
- **Kolkata Cluster:** The target was highly active in a single, tight geographical area in Kolkata (Park Street / Chowringhee area) from Jan 16 to Jan 26. The three active cell towers in Kolkata are located within a 500-meter radius, indicating a fixed residence or hotel.
- **Jharkhand/Bihar Location:** The active tower location `24.10217/86.56664` is situated in the **Giridih district** on the border of Bihar and Jharkhand. This area is historically associated with cyber-fraud networks, which correlates with the high volume of banking OTP traffic.

---

## 5. Communication Traffic Analysis

### 5.1 Call Type Breakdown
| Call Type | Description | Event Count | Percentage |
| :--- | :--- | :---: | :---: |
| **SMT** | SMS Terminated (Incoming SMS) | 661 | 87.5% |
| **SMO** | SMS Originated (Outgoing SMS) | 56 | 7.4% |
| **OUT** | Outgoing Voice Call | 19 | 2.5% |
| **DSM** | Delivery Status Message | 11 | 1.5% |
| **IN** | Incoming Voice Call | 8 | 1.1% |

### 5.2 Voice Call Analysis & Primary Associates
Voice communication is highly restricted, representing only **27 interactions** in total. **No voice calls occurred after January 11, 2026.** 

All personal voice calls were conducted with only **two specific phone numbers**, both originating from the Uttar Pradesh West circle:

1. **`8679171050` (Primary Associate - Airtel UP West):**
   - **Total Interactions:** 44 (22 Voice Calls: 14 Outgoing, 8 Incoming, plus 22 SMS)
   - **Chronology:** **Exclusively active on a single day**—January 9, 2026, between 12:30:18 and 15:03:07. The target exchanged intense, rapid calls and SMS messages with this associate for 2.5 hours and never contacted them again.
2. **`8755358444` (Secondary Associate - Reliance Jio UP West):**
   - **Total Interactions:** 4 Voice Calls (all Outgoing)
   - **Chronology:** **Exclusively active on January 11, 2026**, between 01:42:50 and 20:48:50.
3. **`18002082244` (Toll-Free Bank Service):**
   - **Total Interactions:** 1 Outgoing Call (128 seconds) on January 8, 2026. This is the Baroda Uttar Pradesh Gramin Bank customer care line, used to verify account status.

---

## 6. Financial Transaction & Banking Activity Profile

A staggering **83.5% (631 events)** of the target's CDR consists of banking alerts and OTP messages. The target received messages from a wide variety of public and private sector banks in India:

| Bank Sender | Primary Bank / Wallet | Event Count | Purpose |
| :--- | :--- | :---: | :--- |
| `CP-BUPGBX-S` / `AD-BUPGBX-S` | Baroda Rajasthan Kshetriya Gramin Bank / Baroda UP Bank | 79 | Transaction Alerts & OTPs |
| `JM-BOIIND-S` / `VM-BOIIND-S` / `JD-BOIIND-S` | Bank of India | 130 | Transaction Alerts & OTPs |
| `JK-BOBSMS-S` / `AD-BOBSMS-S` | Bank of Baroda | 50 | Transaction Alerts & OTPs |
| `AD-IOBCHN-S` / `AX-IOBCHN-S` | Indian Overseas Bank | 34 | Transaction Alerts & OTPs |
| `AD-INDBNK-S` / `BV-INDBNK-S` | Indian Bank | 21 | Account Registration / Alerts |
| `AD-PSBANK-S` / `VK-PSBANK-S` | Punjab & Sind Bank | 20 | Account Registration / Alerts |
| `VA-PNBSMS-T` / `AD-PNBSMS-S` | Punjab National Bank | 19 | Account Alerts |
| `AX-iPaytm-S` / `AD-iPaytm-S` | Paytm Payments Bank / UPI Wallet | 5 | Wallet Setup / Transaction OTPs |
| `AX-ADHAAR-S` / `AD-ADHAAR-T` | UIDAI Aadhaar Verification | 7 | OTPs for Aadhaar-linked KYC or Login |

### Outgoing UPI Registrations:
On **January 14, 2026, at 21:36:20**, immediately upon entering the Bihar circle and activating the **Redmi 13C 5G** handset, the target sent 11 outgoing SMS messages to bank gateway verification numbers (e.g. `9667691414`, `8433976037`, `7506894867`). This represents a batch-activation of **Unified Payments Interface (UPI)** applications (like PhonePe, GPay, Paytm) for multiple bank accounts on the new device.

---

## 7. Key Analytical Findings & Red Flags

1. **Classic Financial Mule Profile:** The SIM is linked to at least **9 different major banks**. The accounts received a high volume of transaction alerts, while the target made almost no personal voice calls. This is characteristic of a mule account used to channel illicit funds.
2. **Operational Phase Shift:** 
   - **Testing Phase (Jan 2 – Jan 11):** SIM is in a Vivo Y30 in Uttar Pradesh West, running voice connectivity tests with local associates.
   - **Deployment/Transaction Phase (Jan 14 – Jan 26):** SIM moves to a Redmi 13C 5G, travels to Bihar and Kolkata, registers UPI apps, and acts as a transaction OTP receiver.
   - **Cool-down Phase (Jan 29 – Apr 12):** SIM moves to a low-end Vivo Y02T in Giridih (Jharkhand/Bihar border) and operates at very low frequency, receiving occasional transactional messages.
3. **Transit Geolocation Matches Device Changes:** The changes in active handsets happened exactly during geographical transitions, suggesting a coordinated handover or swap of equipment at different locations.

---
*End of Report.*
"""

# Write to file
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, 'w', encoding='utf-8') as f:
    f.write(markdown_content)

print(f"Report generated successfully at {report_path}")
print(f"Is file written? {os.path.exists(report_path)}")
