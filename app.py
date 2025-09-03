import os, re, time, random,  requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv


load_dotenv()

AUTHKEY = os.getenv("465811A2kO7v0l3b68a99f06P1", "").strip()
SENDER_ID = os.getenv("xyzboys", "TESTIN")
TEMPLATE_ID = os.getenv("68a9a20ea9daf420b25a0db8", "").strip()

app = Flask(__name__)
CORS(app)

# Store OTP in memory (only for testing, in production use DB)
OTP_TTL = 120
otp_store = {}

def is_valid_phone(num: str) -> bool:
    return bool(re.fullmatch(r"(?:\+91)?[6-9]\d{9}", num.strip()))

def send_otp_msg91(phone: str, otp: str) -> tuple[bool, str]:
    if not AUTHKEY or not TEMPLATE_ID:
        return False, "MSG91 AuthKey or TemplateID missing"

    url = "https://control.msg91.com/api/v5/otp"
    headers = {
        "accept": "application/json",
        "authkey": AUTHKEY,
        "content-type": "application/json"
    }
    payload = {
        "template_id": TEMPLATE_ID,
        "mobile": phone.replace("+91", ""),
        "otp": otp,
        "sender": SENDER_ID
    }

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        data = r.json()
        if r.status_code == 200 and data.get("type") == "success":
            return True, "OTP sent"
        return False, str(data)
    except Exception as e:
        return False, str(e)

@app.route("/")
def home():
    return jsonify(ok=True, service="Flask OTP API with MSG91")

@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json(silent=True) or {}
    phone = str(data.get("phone","")).strip()

    if not is_valid_phone(phone):
        return jsonify(ok=False, error="Enter valid Indian mobile"), 400

    otp = f"{random.randint(100000, 999999)}"
    otp_store[phone] = {"otp": otp, "exp": time.time() + OTP_TTL}

    ok, msg = send_otp_msg91(phone, otp)
    if not ok:
        otp_store.pop(phone, None)
        return jsonify(ok=False, error=f"SMS failed: {msg}"), 502

    return jsonify(ok=True, message="OTP sent successfully")

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    phone = str(data.get("phone","")).strip()
    otp = str(data.get("otp","")).strip()

    rec = otp_store.get(phone)
    if not rec:
        return jsonify(ok=False, error="Send OTP first"), 400
    if time.time() > rec["exp"]:
        otp_store.pop(phone, None)
        return jsonify(ok=False, error="OTP expired"), 400
    if otp != rec["otp"]:
        return jsonify(ok=False, error="Invalid OTP"), 400

    otp_store.pop(phone, None)
    return jsonify(ok=True, message="OTP verified successfully")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)