import requests
import sys

print("[*] Testing FastAPI Backend on http://localhost:8000")

# 1. Root Check
try:
    res = requests.get("http://localhost:8000/", timeout=2.0)
    print(f"[+] Root response: {res.status_code} | {res.json()}")
except Exception as e:
    print(f"[-] Root check failed: {str(e)}")
    sys.exit(1)

# 2. PCAP Export Check
try:
    payload = {"records": [
        {"src": "192.168.1.102", "dst": "8.8.8.8", "proto": "TCP", "port": 443},
        {"src": "192.168.1.102", "dst": "185.220.101.5", "proto": "UDP", "port": 53}
    ]}
    res = requests.post("http://localhost:8000/api/pcap/export", json=payload, timeout=2.0)
    print(f"[+] PCAP Export response: {res.status_code} | Content length: {len(res.content)} bytes")
    if res.status_code == 200:
        header = res.content[:4]
        print(f"    Magic Bytes: {header}")
except Exception as e:
    print(f"[-] PCAP Export check failed: {str(e)}")

# 3. OSINT Scan Check
try:
    res = requests.get("http://localhost:8000/api/osint/scan-stream?target=9520995378", timeout=5.0)
    print(f"[+] OSINT Scan status: {res.status_code}")
    print("    Stream response snippet:")
    lines = res.text.split("\n")
    for l in lines[:10]:
        if l.strip():
            print(f"      {l}")
except Exception as e:
    print(f"[-] OSINT Scan check failed: {str(e)}")
