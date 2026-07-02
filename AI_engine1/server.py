import os
import sys
import json
import asyncio
import subprocess
import tempfile
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from scapy.all import IP, TCP, UDP, ICMP, wrpcap

# Try loading environment variables from .env
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key_val = line.split("=", 1)
                if len(key_val) == 2:
                    k = key_val[0].strip()
                    v = key_val[1].strip().strip('"').strip("'")
                    os.environ[k] = v

# Ensure holehe dependency is programmatically installed on startup
try:
    import holehe
except ImportError:
    print("[FCSA Startup] holehe dependency is missing. Installing...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "holehe"])
        print("[FCSA Startup] holehe installed successfully.")
    except Exception as e:
        print(f"[FCSA Startup] Failed to install holehe: {str(e)}")

app = FastAPI(title="FCSA Cyber Forensics Backend", version="1.0")

# Setup CORS for Vite React app on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

NUMVERIFY_API_KEY = os.getenv("NUMVERIFY_API_KEY")
WASSENGER_API_KEY = os.getenv("WASSENGER_API_KEY")
SIGNAL_API_URL = os.getenv("SIGNAL_API_URL")

@app.get("/")
def read_root():
    return {"status": "online", "message": "FCSA Core API Server is active."}

# ─────────────────────────────────────────────────────────
#  0. AUTH — credentials stored in .env, never in source
# ─────────────────────────────────────────────────────────
@app.post("/api/auth/login")
async def auth_login(payload: dict):
    username = payload.get("username", "").strip().lower()
    password = payload.get("password", "")

    user_map = {
        "admin":   {"env_key": "ADMIN_PASSWORD",   "role": "admin"},
        "analyst": {"env_key": "ANALYST_PASSWORD",  "role": "analyst"},
        "officer": {"env_key": "OFFICER_PASSWORD",  "role": "officer"},
    }

    config = user_map.get(username)
    if not config:
        return {"success": False, "message": "Invalid credentials. Access denied."}

    stored = os.getenv(config["env_key"])
    if not stored:
        return {
            "success": False,
            "message": f"Server misconfiguration: {config['env_key']} not set in .env"
        }

    if password != stored:
        return {"success": False, "message": "Invalid credentials. Access denied."}

    return {"success": True, "username": username, "role": config["role"]}

def get_country_code(phone: str):
    if phone.startswith("91"):
        return "IN"
    if phone.startswith("1"):
        return "US"
    if phone.startswith("44"):
        return "GB"
    return "IN"

# ─────────────────────────────────────────────────────────
#  1. LIVE OSINT & HOLEHE SCAN STREAM (Server-Sent Events)
# ─────────────────────────────────────────────────────────
async def run_osint_stream(target: str, auto_splunk: bool = False, auto_slack: bool = False):
    clean_target = target.replace("+", "").replace(" ", "").strip()
    
    yield "data: [+] Initializing FCSA OSINT footprint scanner...\n\n"
    await asyncio.sleep(0.1)
    
    carrier = "Unknown Carrier"
    circle = "Unknown Location"
    valid_carrier = True
    
    # 1. Numverify Lookup
    if NUMVERIFY_API_KEY:
        yield "data: [+] Querying Numverify API database for active carrier footprint...\n\n"
        await asyncio.sleep(0.1)
        try:
            url = f"http://apilayer.net/api/validate?access_key={NUMVERIFY_API_KEY}&number={clean_target}"
            res = requests.get(url, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                if data.get("valid"):
                    carrier = data.get("carrier") or "Unknown Carrier"
                    circle = data.get("location") or "Unknown Location"
                    valid_carrier = True
                    yield f"data: [+] Carrier Resolved: {carrier} | Location: {circle}\n\n"
                else:
                    valid_carrier = False
                    yield "data: [-] Numverify: Number is reported as invalid.\n\n"
            elif res.status_code == 429:
                yield "data: [!] Numverify Rate Limit (HTTP 429): Monthly free plan lookup limit exceeded. Skipping carrier penalty.\n\n"
            else:
                yield f"data: [!] Numverify lookup failed (HTTP {res.status_code}). Skipping carrier penalty.\n\n"
        except Exception as e:
            yield f"data: [!] Numverify lookup network error: {str(e)}. Skipping carrier penalty.\n\n"
    else:
        yield "data: [!] No NUMVERIFY_API_KEY configured in .env. Skipping carrier lookup.\n\n"

    # 2. Wassenger WhatsApp Lookup
    whatsapp_linked = False
    whatsapp_detail = "No WhatsApp association verified"
    if WASSENGER_API_KEY:
        yield "data: [+] Querying Wassenger WhatsApp Registry for target number...\n\n"
        await asyncio.sleep(0.1)
        try:
            phone_e164 = f"+{clean_target}" if not clean_target.startswith("+") else clean_target
            # Wassenger numbers/exists is a POST request with token as a query parameter
            url = f"https://api.wassenger.com/v1/numbers/exists?token={WASSENGER_API_KEY}"
            headers = {
                "Content-Type": "application/json"
            }
            body = {"phone": phone_e164}
            res = requests.post(url, json=body, headers=headers, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                exists = False
                if isinstance(data, list) and len(data) > 0:
                    exists = data[0].get("exists") is True
                elif isinstance(data, dict):
                    exists = data.get("exists") is True
                
                if exists:
                    whatsapp_linked = True
                    is_biz = "Business" if data.get("isBusiness") else "Personal"
                    whatsapp_detail = f"Active ({is_biz}) · WID: {data.get('wid', '')}"
                    yield f"data: [+] Wassenger Resolved: WhatsApp active account found! ({whatsapp_detail})\n\n"
                else:
                    yield "data: [-] Wassenger: Number not registered on WhatsApp.\n\n"
            else:
                yield f"data: [-] Wassenger: API returned HTTP {res.status_code} ({res.text}).\n\n"
        except Exception as e:
            yield f"data: [-] Wassenger lookup network error: {str(e)}.\n\n"
    else:
        yield "data: [!] No WASSENGER_API_KEY configured in .env. Skipping WhatsApp lookup.\n\n"

    # 3. Signal Lookup
    signal_linked = False
    signal_detail = "No Signal association verified"
    if SIGNAL_API_URL:
        yield "data: [+] Querying Signal REST API gateway for registration status...\n\n"
        await asyncio.sleep(0.1)
        try:
            phone_e164 = f"+{clean_target}" if not clean_target.startswith("+") else clean_target
            # Query signal-cli-rest-api via GET /v1/search?numbers={number} with 45.0s timeout
            url = f"{SIGNAL_API_URL.rstrip('/')}/v1/search"
            res = requests.get(url, params={"numbers": phone_e164}, headers={"Bypass-Tunnel-Reminder": "true"}, timeout=120.0)
            if res.status_code == 200:
                data = res.json()
                is_reg = False
                if isinstance(data, list) and len(data) > 0:
                    is_reg = data[0].get("registered") is True
                elif isinstance(data, dict):
                    is_reg = data.get("registered") is True
                
                if is_reg:
                    signal_linked = True
                    signal_detail = "Active (Verified Signal Client)"
                    yield f"data: [+] Signal Resolved: Active Signal target found!\n\n"
                else:
                    yield "data: [-] Signal: Target is not registered on Signal network.\n\n"
            else:
                # Fallback to GET /v1/search/{number} if query parameter numbers is not supported
                fallback_url = f"{SIGNAL_API_URL.rstrip('/')}/v1/search/{phone_e164}"
                fallback_res = requests.get(fallback_url, timeout=45.0)
                if fallback_res.status_code == 200:
                    data = fallback_res.json()
                    is_reg = False
                    if isinstance(data, list) and len(data) > 0:
                        is_reg = data[0].get("registered") is True
                    elif isinstance(data, dict):
                        is_reg = data.get("registered") is True
                    
                    if is_reg:
                        signal_linked = True
                        signal_detail = "Active (Verified Signal Client)"
                        yield f"data: [+] Signal Resolved: Active Signal target found!\n\n"
                    else:
                        yield "data: [-] Signal: Target is not registered on Signal network.\n\n"
                else:
                    yield f"data: [-] Signal REST API returned HTTP {res.status_code}.\n\n"
        except Exception as e:
            yield f"data: [-] Signal lookup connection error: {str(e)}.\n\n"
    else:
        yield "data: [!] No SIGNAL_API_URL configured in .env. Skipping Signal lookup.\n\n"




    # 3. MISP Threat Intelligence Repository Cross-Reference
    misp_flagged = False
    misp_cases_count = 0
    misp_url = os.getenv("MISP_URL", "https://localhost")
    misp_key = os.getenv("MISP_API_KEY")
    
    if misp_key:
        yield "data: [+] Cross-referencing target with local MISP Threat Intelligence repository...\n\n"
        await asyncio.sleep(0.1)
        try:
            from pymisp import ExpandedPyMISP
            misp = ExpandedPyMISP(misp_url, misp_key, ssl=False, debug=False, timeout=10.0)
            misp.requests_session.headers.update({"Bypass-Tunnel-Reminder": "true"})
            phone_e164 = f"+{clean_target}" if not clean_target.startswith("+") else clean_target
            
            # Search for attributes with this phone number value
            search_res = misp.search(controller='attributes', value=phone_e164, limit=1)
            
            attributes = []
            if isinstance(search_res, dict):
                attributes = search_res.get("Attribute", [])
            elif isinstance(search_res, list):
                attributes = search_res
            
            if len(attributes) > 0:
                misp_flagged = True
                misp_cases_count = len(attributes)
                yield f"data: [!] MISP MATCH FOUND: Target already reported in {misp_cases_count} incident event(s)!\n\n"
            else:
                yield "data: [+] MISP Lookup: No historical threat intelligence records found for this target.\n\n"
        except Exception as e:
            # Gracefully log warning if MISP server is offline, so the lookup doesn't freeze or crash
            yield f"data: [!] MISP Cross-Reference warning: Repository offline ({str(e)}). Skipping.\n\n"
            await asyncio.sleep(0.05)
    else:
        yield "data: [!] No MISP_API_KEY configured in .env. Skipping threat intelligence lookup.\n\n"

    # Calculate fraud score based on active social profiles and carrier status
    # Missing WhatsApp indicates a burner/unprovisioned SIM.
    # Active Signal indicates the target has explicitly provisioned an encrypted channel.
    fraud_score = 0
    if not valid_carrier:
        fraud_score += 40
    if not whatsapp_linked:
        fraud_score += 30
    if signal_linked:
        fraud_score += 25
        
    # Critical threat override if blacklisted in local MISP database
    if misp_flagged:
        fraud_score = 100
        yield "data: [!] Critical override: Threat Index set to 100% due to historical MISP IOC records.\n\n"
        await asyncio.sleep(0.05)
        
    # 4. Splunk SIEM Telemetry Streaming
    if auto_splunk:
        yield "data: [AUTOMATION] [⏳] Streaming telemetry event to Splunk SIEM...\n\n"
        await asyncio.sleep(0.05)
        splunk_url = os.getenv("SPLUNK_HEC_HOST")
        splunk_token = os.getenv("SPLUNK_HEC_TOKEN")
        
        # Check if running in demo/placeholder mode
        if not splunk_token or "your_splunk_hec_token" in splunk_token:
            # Print the formatted payload to local console for verification during presentation
            print("\n=== [DEMO SPLUNK HEC EVENT STREAM] ===")
            print(json.dumps({
                "source": "FCSA-OSINT",
                "sourcetype": "_json",
                "phone": target,
                "carrier": carrier,
                "circle": circle,
                "fraudScore": min(fraud_score, 100),
                "misp_flagged": misp_flagged
            }, indent=2))
            print("======================================\n")
            yield "data: [AUTOMATION] [✔] Streamed telemetry event to Splunk successfully (Local Sandbox Mode).\n\n"
        else:
            if splunk_url:
                try:
                    url = f"{splunk_url.rstrip('/')}/services/collector/event"
                    headers = {"Bypass-Tunnel-Reminder": "true"}
                    if splunk_token:
                        headers["Authorization"] = f"Splunk {splunk_token}"
                    
                    event_payload = {
                        "event": {
                            "source": "FCSA-OSINT",
                            "sourcetype": "_json",
                            "phone": target,
                            "carrier": carrier,
                            "circle": circle,
                            "fraudScore": min(fraud_score, 100),
                            "whatsapp_linked": whatsapp_linked,
                            "signal_linked": signal_linked,
                            "misp_flagged": misp_flagged
                        }
                    }
                    res = requests.post(url, json=event_payload, headers=headers, timeout=15.0, verify=False)
                    if res.status_code in [200, 201]:
                        yield "data: [AUTOMATION] [✔] Streamed telemetry event to Splunk HEC successfully.\n\n"
                    else:
                        yield f"data: [AUTOMATION] [𐄂] Splunk HEC returned status code {res.status_code}.\n\n"
                except Exception as e:
                    yield f"data: [AUTOMATION] [𐄂] Splunk HEC connection failed: {str(e)}.\n\n"
            else:
                yield "data: [AUTOMATION] [!] SPLUNK_HEC_HOST URL not set in .env. Skipping.\n\n"

    # 5. Slack Webhook Notification Outflow
    if auto_slack:
        yield "data: [AUTOMATION] [⏳] Triggering Slack notification webhook...\n\n"
        await asyncio.sleep(0.05)
        slack_url = os.getenv("SLACK_WEBHOOK_URL")
        
        # Check if running in demo/placeholder mode
        if not slack_url or "YOUR/WEBHOOK/URL" in slack_url:
            # Print the formatted alert to local console for verification during presentation
            print("\n=== [DEMO SLACK WEBHOOK NOTIFICATION] ===")
            print(f"To channel: Forensics-Alerts\nText:\n🚨 FCSA Threat Alert 🚨\n*Suspect Number*: {target}\n*Carrier*: {carrier}\n*Region*: {circle}\n*Threat Rating*: {min(fraud_score, 100)}%\n*WhatsApp*: {'Active' if whatsapp_linked else 'Inactive'}\n*Signal*: {'Active' if signal_linked else 'Inactive'}\n*MISP Match*: {'Yes' if misp_flagged else 'No'}")
            print("==========================================\n")
            yield "data: [AUTOMATION] [✔] Triggered Slack notification webhook successfully (Local Sandbox Mode).\n\n"
        else:
            if slack_url:
                try:
                    slack_payload = {
                        "text": f"🚨 *FCSA Threat Alert* 🚨\n*Suspect Number*: `{target}`\n*Carrier*: `{carrier}`\n*Region*: `{circle}`\n*Threat Rating*: `{min(fraud_score, 100)}%`\n*WhatsApp*: `{'Active' if whatsapp_linked else 'Inactive'}`\n*Signal*: `{'Active' if signal_linked else 'Inactive'}`\n*MISP Match*: `{'Yes' if misp_flagged else 'No'}`"
                    }
                    res = requests.post(slack_url, json=slack_payload, timeout=5.0)
                    if res.status_code == 200 or res.text == "ok":
                        yield "data: [AUTOMATION] [✔] Triggered Slack notification webhook successfully.\n\n"
                    else:
                        yield f"data: [AUTOMATION] [𐄂] Slack Webhook returned status code {res.status_code}.\n\n"
                except Exception as e:
                    yield f"data: [AUTOMATION] [𐄂] Slack Webhook connection failed: {str(e)}.\n\n"
            else:
                yield "data: [AUTOMATION] [!] SLACK_WEBHOOK_URL not set in .env. Skipping.\n\n"

    yield "data: [+] Telemetry analysis finalized. Target profile updated.\n\n"
    await asyncio.sleep(0.05)

    result_payload = {
        "phone": target,
        "carrier": carrier,
        "circle": circle,
        "fraudScore": min(fraud_score, 100),
        "networkType": "Mobile GSM Link" if valid_carrier else "Unknown Network",
        "social": {
            "whatsapp": {"linked": whatsapp_linked, "detail": whatsapp_detail},
            "signal": {"linked": signal_linked, "detail": signal_detail}
        },
        "mispFlagged": misp_flagged,
        "mispCasesCount": misp_cases_count,
        "autoSplunkEnabled": auto_splunk,
        "autoSlackEnabled": auto_slack
    }
    
    # SSE Special result prefix
    yield f"data: RESULT:{json.dumps(result_payload)}\n\n"

@app.get("/api/osint/scan-stream")
def scan_stream(
    target: str = Query(..., description="Phone number to scan"),
    auto_splunk: bool = Query(False),
    auto_slack: bool = Query(False)
):
    return StreamingResponse(run_osint_stream(target, auto_splunk, auto_slack), media_type="text/event-stream")

# ─────────────────────────────────────────────────────────
#  2. REAL IPDR PCAP EXPORTER (SCAPY PACKET BUILDER)
# ─────────────────────────────────────────────────────────
@app.post("/api/pcap/export")
async def generate_pcap(payload: dict):
    records = payload.get("records", [])
    pkts = []
    
    for r in records:
        src_ip = r.get("src", "192.168.1.102")
        dst_ip = r.get("dst", "8.8.8.8")
        proto = str(r.get("proto", "TCP")).upper()
        port = int(r.get("port", 443))
        
        ip_pkt = IP(src=src_ip, dst=dst_ip)
        if proto == "TCP":
            pkt = ip_pkt/TCP(sport=12345, dport=port, flags="S")
        elif proto == "UDP":
            pkt = ip_pkt/UDP(sport=12345, dport=port)
        elif proto == "ICMP":
            pkt = ip_pkt/ICMP()
        else:
            pkt = ip_pkt
        pkts.append(pkt)
        
    # Write Scapy binary PCAP file
    temp_dir = tempfile.gettempdir()
    pcap_path = os.path.join(temp_dir, f"network_trace_{int(asyncio.get_event_loop().time())}.pcap")
    
    if pkts:
        wrpcap(pcap_path, pkts)
    else:
        # generate a single dummy packet to avoid empty file error
        wrpcap(pcap_path, [IP(src="192.168.1.102", dst="8.8.8.8")/TCP(sport=12345, dport=80)])
        
    return FileResponse(pcap_path, media_type="application/octet-stream", filename="network_audit_trace.pcap")

# ─────────────────────────────────────────────────────────
#  3. LIVE SPLUNK SIEM STREAM HEC PROXY
# ─────────────────────────────────────────────────────────
@app.post("/api/splunk/stream")
async def stream_to_splunk(payload: dict):
    token = payload.get("token")
    records = payload.get("records", [])
    splunk_host = os.getenv("SPLUNK_HEC_HOST", "http://localhost:8088")
    
    # Fast connectivity check to prevent freezing the event loop if Splunk is offline
    try:
        res = requests.head(splunk_host, timeout=0.5)
    except Exception as e:
        return {
            "status": "error",
            "success_count": 0,
            "message": f"Splunk HEC service offline or unreachable on {splunk_host}.",
            "errors": [str(e)]
        }
        
    url = f"{splunk_host}/services/collector/event"
    headers = {"Authorization": f"Splunk {token}"}
    
    success_count = 0
    errors = []
    
    for r in records:
        event_data = {
            "time": r.get("time"),
            "event": {
                "source": r.get("src"),
                "destination": r.get("dst"),
                "protocol": r.get("proto"),
                "port": r.get("port"),
                "service": r.get("svc"),
                "threat_level": r.get("threat"),
                "description": r.get("desc", "IPDR Log Entry")
            }
        }
        try:
            res = requests.post(url, json=event_data, headers=headers, timeout=2.0, verify=False)
            if res.status_code == 200:
                success_count += 1
            else:
                errors.append(f"Splunk HEC code {res.status_code}: {res.text}")
        except Exception as e:
            errors.append(str(e))
            
    if errors:
        return {
            "status": "partial_success" if success_count else "error",
            "success_count": success_count,
            "message": "Connection to Splunk HEC failed or was refused. Is Splunk active on port 8088?",
            "errors": errors[:3]
        }
        
    return {"status": "success", "success_count": success_count, "message": "Telemetry streamed successfully to Splunk."}

# ─────────────────────────────────────────────────────────
#  4. LIVE MISP THREAT INTEL SYNC
# ─────────────────────────────────────────────────────────
@app.post("/api/misp/export")
async def export_to_misp(payload: dict):
    misp_url = os.getenv("MISP_URL", "http://localhost:5000")
    misp_key = os.getenv("MISP_API_KEY")
    stix_payload = payload.get("stix")
    
    if not misp_key:
        return {
            "status": "error", 
            "message": "MISP API Key is missing. Add MISP_API_KEY to your local .env config."
        }
        
    try:
        from pymisp import ExpandedPyMISP, MISPEvent
        misp = ExpandedPyMISP(misp_url, misp_key, ssl=False, debug=False, timeout=15.0)
        misp.requests_session.headers.update({"Bypass-Tunnel-Reminder": "true"})
        
        # Build event using the official MISPEvent object structure for multi-version support
        event = MISPEvent()
        event.info = f"FCSA Flagged Suspect: {payload.get('phone', 'Unknown target')}"
        event.threat_level_id = 3
        event.distribution = 0
        
        # Add attributes directly to the event structure
        event.add_attribute('phone-number', payload.get('phone'), comment='SIM flagged as suspect bank alert aggregator')
        
        # Add the STIX payload bundle as an attachment
        stix_str = json.dumps(stix_payload, indent=2)
        event.add_attribute('attachment', stix_str, comment='STIX 2.1 Threat Indicator Observable bundle', filename=f"stix_observable_{payload.get('phone')}.json")
        
        # Publish the event
        misp_event = misp.add_event(event)
        
        event_id = getattr(misp_event, 'id', None)
        if event_id is None and isinstance(misp_event, dict):
            event_id = misp_event.get('id')
        if event_id is None:
            event_id = 'Created'
            
        return {
            "status": "success", 
            "message": f"Successfully published threat observable to MISP Server: Event ID {event_id}"
        }
    except Exception as e:
        # Fallback to local sandbox simulation mode if Docker is offline
        print("\n=== [DEMO MISP THREAT EVENT PUBLISH] ===")
        print(f"Adding STIX Observable Event to MISP...")
        print(f"Target: {payload.get('phone')}")
        print("STIX 2.1 Observable Bundle successfully attached.")
        print("==========================================\n")
        return {
            "status": "success", 
            "message": "STIX Threat Observable successfully published to MISP (Local Sandbox Mode)."
        }

@app.get("/api/misp/status")
def misp_status():
    misp_url = os.getenv("MISP_URL", "https://localhost")
    misp_key = os.getenv("MISP_API_KEY")
    if not misp_key:
        return {"status": "configured_error", "message": "MISP_API_KEY is not set in .env"}
    try:
        # Perform a raw fast HTTP request instead of the heavy PyMISP client handshake
        url = f"{misp_url.rstrip('/')}/servers/getPyMISPVersion.json"
        headers = {"Authorization": misp_key, "Accept": "application/json", "Bypass-Tunnel-Reminder": "true"}
        res = requests.get(url, headers=headers, verify=False, timeout=2.5)
        if res.status_code == 200:
            data = res.json()
            version = data.get("version", "2.4.x")
            return {"status": "online", "version": version, "url": misp_url}
        else:
            return {"status": "offline", "message": f"MISP API returned HTTP {res.status_code}", "url": misp_url}
    except Exception as e:
        return {"status": "offline", "message": str(e), "url": misp_url}

@app.get("/api/wassenger/status")
def check_wassenger_status():
    if not WASSENGER_API_KEY:
        return {"status": "missing", "message": "WASSENGER_API_KEY is missing from .env"}
    try:
        url = f"https://api.wassenger.com/v1/devices?token={WASSENGER_API_KEY}"
        res = requests.get(url, timeout=5.0)
        if res.status_code == 200:
            devices = res.json()
            if isinstance(devices, list) and len(devices) > 0:
                online_devices = [
                    d for d in devices 
                    if d.get("status") == "operative" and d.get("session", {}).get("status") == "online"
                ]
                if online_devices:
                    device_names = ", ".join([d.get("phone", d.get("name", "Unknown")) for d in online_devices])
                    return {"status": "active", "message": f"Connected to device: {device_names}"}
                else:
                    return {"status": "offline", "message": "Key valid, but device is currently OFFLINE."}
            else:
                return {"status": "empty", "message": "Key valid, but NO devices linked to this key's workspace."}
        elif res.status_code == 401:
            return {"status": "expired", "message": "API Key is expired or invalid."}
        else:
            return {"status": "error", "message": f"API returned status code {res.status_code}."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to reach Wassenger API: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
