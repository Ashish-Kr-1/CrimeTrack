import unittest
import json
from fastapi.testclient import TestClient
from server import app

class TestForensicsServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_root(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_pcap_export_empty(self):
        # Empty payload
        res = self.client.post("/api/pcap/export", json={"records": []})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/octet-stream")
        self.assertTrue(len(res.content) > 0)

    def test_pcap_export_records(self):
        payload = {
            "records": [
                {"src": "192.168.1.102", "dst": "185.220.101.5", "proto": "TCP", "port": 443, "svc": "Tor Exit Node"},
                {"src": "192.168.1.102", "dst": "8.8.8.8", "proto": "UDP", "port": 53, "svc": "DNS"}
            ]
        }
        res = self.client.post("/api/pcap/export", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/octet-stream")
        self.assertTrue(len(res.content) > 0)

    def test_misp_export_no_key(self):
        # MISP export should return error if API Key is not set or misconfigured
        payload = {"phone": "9520995378", "stix": {}}
        res = self.client.post("/api/misp/export", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Should report error/key issue
        self.assertIn("status", data)

if __name__ == "__main__":
    unittest.main()
