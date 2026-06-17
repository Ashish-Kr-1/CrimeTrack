import os
import re
import sys

user_dir = "C:\\Users\\Lenovo"
print(f"[*] Scanning recursively for downloaded files starting from: {user_dir}")

target_patterns = [
    # PCAPs
    r"network_audit_trace_.*\.pcap",
    # JSON STIX
    r"stix_ioc_.*\.json",
    r"stix_observable_.*\.json",
    # Notice PDF
    r"CrPC_Section_91_Notice_.*\.pdf"
]

target_uuids = {
    "f32c849c-5934-4762-8de3-73c7a7e34bdb",
    "4e93c76f-e2f6-4aab-980d-68462a69820f",
    "af727be6-1f10-414a-9625-b51eadfef9fe",
    "224256da-0d94-4b40-8b93-2ca8b81d30a7"
}

target_files = []

# Scan common folders first for fast response
common_folders = [
    os.path.join(user_dir, "Downloads"),
    os.path.join(user_dir, "Desktop"),
    os.path.join(user_dir, "Documents"),
    "c:\\Projects\\CrimeTrack\\CrimeTrack"
]

for folder in common_folders:
    if os.path.exists(folder):
        for root, dirs, files in os.walk(folder):
            for name in files:
                # Extensionless UUID checks
                is_uuid = name in target_uuids or (len(name) == 36 and name.count("-") == 4 and "." not in name)
                # Check named patterns
                is_pattern = any(re.match(pat, name, re.IGNORECASE) for pat in target_patterns)
                
                if is_uuid or is_pattern:
                    target_files.append(os.path.join(root, name))

# Broader scan if none found in common folders
if not target_files:
    for root, dirs, files in os.walk(user_dir):
        # Skip heavy folders
        if any(x in root for x in ["node_modules", ".git", ".venv", "AppData\\Local\\Microsoft", "AppData\\Local\\Google"]):
            continue
        for name in files:
            is_uuid = name in target_uuids
            is_pattern = any(re.match(pat, name, re.IGNORECASE) for pat in target_patterns)
            if is_uuid or is_pattern:
                target_files.append(os.path.join(root, name))

# Remove duplicates
target_files = list(set(target_files))

if not target_files:
    print("[-] No downloaded forensic files found on your system yet.")
    print("    Please click the download buttons in your browser again to download them.")
    sys.exit(0)

print(f"[+] Found {len(target_files)} forensic files to process.")

for f in target_files:
    try:
        filename = os.path.basename(f)
        
        # If the file already has a valid forensic extension, open it directly!
        if filename.endswith((".pcap", ".pdf", ".json")):
            # Check if it is the fallback text PCAP trace (meaning the server was offline during download)
            # We want to let the user know, but still open it in notepad!
            if filename.endswith(".pcap"):
                with open(f, "rb") as file_in:
                    header = file_in.read(100)
                if b"PCAP Packet Trace Summary" in header:
                    print(f"    [!] File {filename} is a plain-text fallback PCAP summary.")
                    print(f"    [+] Opening {filename} in text editor...")
                    os.system(f'notepad.exe "{f}"')
                    continue
            
            print(f"    [+] Opening {filename} directly...")
            os.startfile(f)
            continue
            
        # For extensionless UUID files, parse magic headers and rename them
        with open(f, "rb") as file_in:
            header = file_in.read(16)
            
        new_name = None
        # PDF Check
        if header.startswith(b"%PDF"):
            new_name = "CrPC_Section_91_Notice.pdf"
        # PCAP Check
        elif header.startswith(b"\xa1\xb2\xc3\xd4") or header.startswith(b"\xd4\xc3\xb2\xa1") or header.startswith(b"\x0a\x0d\x0d\x0a"):
            new_name = "Network_Audit_Trace.pcap"
        # JSON / STIX Check
        elif header.startswith(b"{") or header.startswith(b"[") or b"spec_version" in header:
            new_name = "STIX_Threat_Observable.json"
        else:
            # Check text fallback headers
            try:
                text = header.decode("utf-8", errors="ignore")
                if "PCAP" in text or "Packet" in text:
                    new_name = "Network_Audit_Trace.pcap"
                elif "bundle" in text or "stix" in text:
                    new_name = "STIX_Threat_Observable.json"
            except:
                pass
                
        if new_name:
            parent_dir = os.path.dirname(f)
            base, ext = os.path.splitext(new_name)
            target_path = os.path.join(parent_dir, new_name)
            
            # Avoid overwriting existing files
            counter = 1
            while os.path.exists(target_path):
                target_path = os.path.join(parent_dir, f"{base}_{counter}{ext}")
                counter += 1
                
            os.rename(f, target_path)
            print(f"    [+] Renamed UUID file: {filename} -> {os.path.basename(target_path)}")
            print(f"    [+] Opening {os.path.basename(target_path)}...")
            os.startfile(target_path)
        else:
            print(f"    [-] Unknown format for UUID file: {filename} (Header bytes: {header})")
    except Exception as e:
        print(f"    [-] Error opening {os.path.basename(f)}: {str(e)}")

print("[*] Processing complete.")
