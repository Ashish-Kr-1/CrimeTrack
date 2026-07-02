import requests
import json

print("=== FCSA Backend Diagnosis ===")

endpoints = {
    "MISP Status": "http://localhost:8001/api/misp/status",
    "Wassenger Status": "http://localhost:8001/api/wassenger/status",
}

for name, url in endpoints.items():
    print(f"\nQuerying {name} ({url})...")
    try:
        res = requests.get(url, timeout=3.0)
        print(f"Status Code: {res.status_code}")
        print("Response Headers:")
        for k, v in res.headers.items():
            if "access-control" in k.lower():
                print(f"  {k}: {v}")
        print("Response Body:")
        print(json.dumps(res.json(), indent=2))
    except Exception as e:
        print(f"Connection Failed: {e}")

print("\n===============================")
