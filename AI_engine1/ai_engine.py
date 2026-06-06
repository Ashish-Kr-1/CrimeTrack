"""
CDR AI Classification Engine
=================================
Pipeline:
  Step 1 — Load cdr_stats.json
  Step 2 — Feature Engineering: derive numerical signals from raw stats
  Step 3 — Heuristic Scoring Engine (Approach A): rule-based scoring with thresholds
  Step 4 — Output: Structured Diagnostic JSON saved to diagnostic_output.json

Author: AI Engine (SummerIntern Project)
"""

import json
import os
import sys
from datetime import datetime

# ─────────────────────────────────────────────────────────
#  PATHS & CONFIG
# ─────────────────────────────────────────────────────────
STATS_PATH   = '/Users/ayushk/SummerIntern/cdr_stats.json'
OUTPUT_PATH  = '/Users/ayushk/SummerIntern/diagnostic_output.json'

# Known UPI gateway / verification short-codes used by PhonePe, GPay, Paytm etc.
UPI_GATEWAY_NUMBERS = {
    '9667691414', '8433976037', '7506894867', '9071234567',
    '52263', '56161020', '9220592205', '9222692226'
}

# Known bank sender ID keyword fragments
BANK_KEYWORDS = [
    'BK', 'BOI', 'BOB', 'BUP', 'IND', 'PNB', 'IOB',
    'UPI', 'PAYTM', 'AXIS', 'HDFC', 'ICICI', 'UNION',
    'ADHAAR', 'SBI', 'PSBANK', 'CKYCR', 'GRAMIN'
]

# Regions historically flagged as cyber-fraud hubs (operator circle codes)
HIGH_RISK_CIRCLES = {'AIR BHR', 'VF JHK', 'JIO BHR', 'VF BHR', 'IDEA BHR'}


# ─────────────────────────────────────────────────────────
#  STEP 1 — Load Statistics JSON
# ─────────────────────────────────────────────────────────
def load_stats(path: str) -> dict:
    with open(path, 'r') as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────
#  STEP 2 — Feature Engineering
# ─────────────────────────────────────────────────────────
def engineer_features(stats: dict) -> dict:
    """
    Convert raw cdr_stats.json fields into a flat numerical feature vector.
    Each feature is a float in a meaningful range (0.0 – 1.0 where possible,
    or a raw count/ratio otherwise).
    """
    features = {}
    total = stats['total_records']

    # ── Traffic ratios ──────────────────────────────────
    call_types = stats.get('call_types', {})
    svc_types  = stats.get('service_types', {})

    sms_total   = svc_types.get('SMS', 0)
    voice_total = svc_types.get('Voice', 0)
    smt_count   = call_types.get('SMT', 0)   # incoming SMS
    smo_count   = call_types.get('SMO', 0)   # outgoing SMS
    out_count   = call_types.get('OUT', 0)   # outgoing voice
    in_count    = call_types.get('IN', 0)    # incoming voice

    features['sms_ratio']           = sms_total / total if total else 0
    features['voice_ratio']         = voice_total / total if total else 0
    features['incoming_sms_ratio']  = smt_count / total if total else 0
    features['outgoing_sms_ratio']  = smo_count / total if total else 0
    features['outgoing_voice_ratio']= out_count / total if total else 0

    # ── Active duration (days) ───────────────────────────
    dr = stats.get('date_range', {})
    try:
        t_start = datetime.strptime(dr['start'], "%Y-%m-%d %H:%M:%S")
        t_end   = datetime.strptime(dr['end'],   "%Y-%m-%d %H:%M:%S")
        active_days = max((t_end - t_start).days, 1)
    except Exception:
        active_days = 1
    features['active_days'] = active_days

    # ── Device churn ─────────────────────────────────────
    imeis = stats.get('imeis', {})
    num_imeis = len(imeis)
    features['unique_imei_count']      = num_imeis
    features['device_swap_frequency']  = num_imeis / (active_days / 30.0)  # swaps per month

    # ── Financial / bank exposure ─────────────────────────
    top_b = stats.get('top_b_parties', [])
    bank_senders = set()
    upi_burst_count = 0
    outgoing_personal_contacts = set()

    for bp in top_b:
        num    = bp['number']
        types  = bp.get('types', {})
        is_bank = any(kw in num.upper() for kw in BANK_KEYWORDS)
        is_upi  = num in UPI_GATEWAY_NUMBERS

        if is_bank:
            bank_senders.add(num)
        if is_upi:
            upi_burst_count += types.get('SMO', 0)
        if not is_bank and not is_upi:
            # Is a real personal number (10-digit)
            if num.isdigit() and len(num) == 10:
                outgoing_personal_contacts.add(num)

    features['bank_sender_count']      = len(bank_senders)
    features['upi_burst_sms_count']    = upi_burst_count
    features['personal_contact_count'] = len(outgoing_personal_contacts)

    total_unique_contacts = len({bp['number'] for bp in top_b})
    features['bank_sender_ratio'] = (
        len(bank_senders) / total_unique_contacts if total_unique_contacts else 0
    )

    # ── Voice cessation check (Dynamic Heuristic) ──────────
    # Did voice calls stop well before the end of the period?
    features['voice_silence_fraction'] = 0.0
    last_voice_event = stats.get('last_voice_event')
    if last_voice_event:
        try:
            voice_end_dt = datetime.strptime(last_voice_event, "%Y-%m-%d %H:%M:%S")
            silence_days = (t_end - voice_end_dt).days
            features['voice_silence_fraction'] = silence_days / active_days
        except Exception:
            pass
    else:
        # If there were never any voice calls in the entire log, silence fraction is 1.0 (100% silent)
        features['voice_silence_fraction'] = 1.0

    # ── Geographic risk ───────────────────────────────────
    roaming = stats.get('roaming_networks', {})
    risk_circle_events = sum(v for k, v in roaming.items() if k in HIGH_RISK_CIRCLES)
    features['high_risk_circle_ratio'] = risk_circle_events / total if total else 0
    features['unique_circles_count']   = len(roaming)

    return features


# ─────────────────────────────────────────────────────────
#  STEP 3 — Heuristic Scoring Engine (Approach A)
# ─────────────────────────────────────────────────────────

RULES = [
    {
        "code"     : "HIGH_SMS_RATIO",
        "severity" : "CRITICAL",
        "points"   : 30,
        "condition": lambda f: f['sms_ratio'] > 0.90,
        "detail"   : lambda f: (
            f"SMS traffic is {f['sms_ratio']*100:.1f}% of total events "
            f"(threshold: >90%). Strongly indicates an OTP/alert receiver role."
        )
    },
    {
        "code"     : "MULTI_BANK_AGGREGATION",
        "severity" : "CRITICAL",
        "points"   : 30,
        "condition": lambda f: f['bank_sender_count'] >= 5,
        "detail"   : lambda f: (
            f"SIM received traffic from {f['bank_sender_count']} distinct financial "
            f"institutions (threshold: ≥5). A single user holding 5+ active bank accounts "
            f"on one prepaid SIM is characteristic of a mule account cluster."
        )
    },
    {
        "code"     : "UPI_BIND_BURST",
        "severity" : "CRITICAL",
        "points"   : 25,
        "condition": lambda f: f['upi_burst_sms_count'] > 0,
        "detail"   : lambda f: (
            f"Detected {f['upi_burst_sms_count']} outgoing verification SMS to UPI "
            f"gateway numbers. This pattern is generated by batch-binding multiple "
            f"UPI wallet apps to bank accounts on a new device."
        )
    },
    {
        "code"     : "RAPID_DEVICE_SWAPPING",
        "severity" : "HIGH",
        "points"   : 20,
        "condition": lambda f: f['unique_imei_count'] >= 4,
        "detail"   : lambda f: (
            f"SIM card swapped across {f['unique_imei_count']} unique IMEIs "
            f"({f['device_swap_frequency']:.1f} swaps/month) over {f['active_days']} days. "
            f"Coordinated device handoffs are used to evade IMEI-based fraud tracking."
        )
    },
    {
        "code"     : "VOICE_CESSATION",
        "severity" : "HIGH",
        "points"   : 20,
        "condition": lambda f: f['voice_silence_fraction'] > 0.80,
        "detail"   : lambda f: (
            f"Voice calls stopped after the first {100 - f['voice_silence_fraction']*100:.0f}% "
            f"of the active period ({f['voice_silence_fraction']*100:.1f}% of total time was "
            f"voice-silent). This 'line warming then abandonment' pattern is typical of "
            f"an operational SIM after the testing phase."
        )
    },
    {
        "code"     : "NO_PERSONAL_SOCIAL_FOOTPRINT",
        "severity" : "MEDIUM",
        "points"   : 15,
        "condition": lambda f: f['personal_contact_count'] <= 2,
        "detail"   : lambda f: (
            f"Only {f['personal_contact_count']} recurring personal contacts found. "
            f"Genuine users maintain a stable social network of 10+ contacts. "
            f"This SIM shows near-zero personal social activity."
        )
    },
    {
        "code"     : "HIGH_RISK_GEOGRAPHIC_CIRCLE",
        "severity" : "MEDIUM",
        "points"   : 10,
        "condition": lambda f: f['high_risk_circle_ratio'] > 0,
        "detail"   : lambda f: (
            f"Detected activity in known high-risk telecom circle(s). "
            f"{f['high_risk_circle_ratio']*100:.1f}% of events originated from circles "
            f"flagged as cyber-fraud operational hubs."
        )
    },
    {
        "code"     : "HIGH_BANK_SENDER_RATIO",
        "severity" : "MEDIUM",
        "points"   : 10,
        "condition": lambda f: f['bank_sender_ratio'] > 0.60,
        "detail"   : lambda f: (
            f"{f['bank_sender_ratio']*100:.0f}% of all unique contacts are financial "
            f"institutions or UPI services (threshold: >60%). No substantial "
            f"personal messaging detected."
        )
    },
]

def run_heuristic_scorer(features: dict) -> tuple[int, list]:
    """
    Evaluate every rule against the feature vector.
    Returns (total_score, list_of_triggered_rule_dicts).
    """
    total_score       = 0
    triggered_rules   = []

    for rule in RULES:
        if rule['condition'](features):
            total_score += rule['points']
            triggered_rules.append({
                "code"    : rule['code'],
                "severity": rule['severity'],
                "points"  : rule['points'],
                "detail"  : rule['detail'](features)
            })

    return total_score, triggered_rules


# ─────────────────────────────────────────────────────────
#  Classification Thresholds
# ─────────────────────────────────────────────────────────
def classify(score: int) -> tuple[str, str]:
    """
    Returns (classification_label, confidence_level).
    Max possible score from rules = 160 points.
    """
    if score >= 100:
        return "HIGHLY_SUSPECT_FINANCIAL_MULE", "HIGH"
    elif score >= 70:
        return "SUSPECT_OPERATIONAL_SIM", "MEDIUM-HIGH"
    elif score >= 40:
        return "ANOMALOUS_USAGE_PATTERN", "MEDIUM"
    else:
        return "NORMAL_USER", "LOW"


def suspicion_score_normalized(score: int) -> float:
    MAX_SCORE = sum(r['points'] for r in RULES)
    return round(min(score / MAX_SCORE, 1.0), 4)


# ─────────────────────────────────────────────────────────
#  STEP 4 — Build & Output Structured Diagnostic JSON
# ─────────────────────────────────────────────────────────
def build_diagnostic(target_num, stats, features, score, triggered_rules) -> dict:
    classification, confidence = classify(score)
    suspicion_normalized       = suspicion_score_normalized(score)

    dr = stats.get('date_range', {})
    device_intervals = stats.get('device_intervals', [])
    roaming = stats.get('roaming_networks', {})

    # Operational phases (inferred from device intervals)
    phases = []
    for idx, interval in enumerate(device_intervals):
        phase_map = {
            0: "Testing / Line Warm-up Phase",
            1: "Device Handoff / Transit Phase",
            2: "Active Deployment / Transaction Phase",
            3: "Cool-down / Standby Phase"
        }
        phases.append({
            "phase"     : phase_map.get(idx, f"Phase {idx+1}"),
            "imei"      : interval['imei'],
            "start"     : interval['start_time'],
            "end"       : interval['end_time'],
            "event_count": interval['count']
        })

    diagnostic = {
        "engine"             : "CDR Heuristic AI Classifier v1.0",
        "generated_at"       : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "target_phone"       : target_num,
        "active_period"      : {
            "from"      : dr.get('start'),
            "to"        : dr.get('end'),
            "total_days": features['active_days']
        },
        "classification"     : classification,
        "confidence_level"   : confidence,
        "suspicion_score"    : suspicion_normalized,
        "raw_heuristic_score": score,
        "max_possible_score" : sum(r['points'] for r in RULES),

        "feature_vector"     : {
            "total_records"          : stats['total_records'],
            "sms_ratio_pct"          : round(features['sms_ratio'] * 100, 2),
            "voice_ratio_pct"        : round(features['voice_ratio'] * 100, 2),
            "bank_sender_count"      : features['bank_sender_count'],
            "bank_sender_ratio_pct"  : round(features['bank_sender_ratio'] * 100, 2),
            "unique_imei_count"      : features['unique_imei_count'],
            "device_swaps_per_month" : round(features['device_swap_frequency'], 2),
            "upi_burst_sms_count"    : features['upi_burst_sms_count'],
            "personal_contact_count" : features['personal_contact_count'],
            "voice_silence_fraction_pct": round(features['voice_silence_fraction'] * 100, 2),
            "active_circles"         : list(roaming.keys()),
            "high_risk_circle_ratio_pct": round(features['high_risk_circle_ratio'] * 100, 2),
        },

        "triggered_indicators": triggered_rules,

        "operational_phases" : phases,

        "risk_summary"       : {
            "red_flags_count"   : len([r for r in triggered_rules if r['severity'] == 'CRITICAL']),
            "yellow_flags_count": len([r for r in triggered_rules if r['severity'] in ('HIGH', 'MEDIUM')]),
            "recommended_action": (
                "REFER TO LEO / FREEZE ACCOUNTS"
                if classification == "HIGHLY_SUSPECT_FINANCIAL_MULE"
                else "MONITOR AND RE-EVALUATE"
            )
        }
    }
    return diagnostic


# ─────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    # CLI Argument override handling
    stats_path = sys.argv[1] if len(sys.argv) > 1 else STATS_PATH
    output_path = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_PATH

    print("=" * 60)
    print("   CDR AI CLASSIFICATION ENGINE (GENERIC)")
    print("=" * 60)

    print(f"\n[1/4] Loading {os.path.basename(stats_path)} ...")
    stats = load_stats(stats_path)
    target_num = stats.get('target_num', 'Unknown')
    print(f"      Loaded {stats['total_records']} records for Target Number: {target_num}.")

    print("[2/4] Engineering features dynamically ...")
    features = engineer_features(stats)
    print(f"      Features engineered: {len(features)}")

    print("[3/4] Running heuristic scoring rules ...")
    score, triggered_rules = run_heuristic_scorer(features)
    classification, confidence = classify(score)
    print(f"      Score: {score} / {sum(r['points'] for r in RULES)}  →  [{classification}]  Confidence: {confidence}")
    print(f"      Triggered rules: {len(triggered_rules)}")
    for rule in triggered_rules:
        print(f"        [{rule['severity']:8s}] +{rule['points']:2d} pts  {rule['code']}")

    print("[4/4] Building structured diagnostic JSON ...")
    diagnostic = build_diagnostic(target_num, stats, features, score, triggered_rules)

    with open(output_path, 'w') as f:
        json.dump(diagnostic, f, indent=2)

    print(f"\n✅  Diagnostic output saved → {output_path}")
    print("\n" + "=" * 60)
    print("   QUICK VERDICT")
    print("=" * 60)
    print(f"   Target       : {target_num}")
    print(f"   Classification: {classification}")
    print(f"   Confidence   : {confidence}")
    print(f"   Score        : {score} pts  (suspicion: {suspicion_score_normalized(score):.2%})")
    print(f"   Action       : {diagnostic['risk_summary']['recommended_action']}")
    print("=" * 60)
