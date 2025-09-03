const API_BASE = "http://127.0.0.1:5000"; // Flask backend

function normalizePhone(raw) {
  let p = raw.trim();
  // If user typed 10 digits only, prefix +91
  if (/^\d{10}$/.test(p)) return "+91" + p;
  // If user typed 0XXXXXXXXXX, remove leading 0 and add +91
  if (/^0\d{10}$/.test(p)) return "+91" + p.slice(1);
  // If already in +91xxxxxxxxxx or full E.164, keep it
  return p;
}

async function sendOTP() {
  const phoneInput = document.getElementById("phone");
  const result = document.getElementById("result");
  const btn = document.getElementById("sendBtn");

  const phone = normalizePhone(phoneInput.value);
  if (!/^\+\d{10,15}$/.test(phone)) {
    result.textContent = "Please enter a valid phone number (e.g., +9198XXXXXXXX).";
    return;
  }

  btn.disabled = true;
  result.textContent = "Sending OTP...";

  try {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    result.textContent = data.message || "OTP send attempt done.";
  } catch (e) {
    result.textContent = "Network error while sending OTP.";
  } finally {
    btn.disabled = false;
  }
}

async function verifyOTP() {
  const otpInput = document.getElementById("otp");
  const phoneInput = document.getElementById("phone");
  const result = document.getElementById("result");
  const btn = document.getElementById("verifyBtn");

  const phone = normalizePhone(phoneInput.value);
  const otp = otpInput.value.trim();

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    result.textContent = "Enter the 6-digit OTP.";
    return;
  }

  btn.disabled = true;
  result.textContent = "Verifying OTP...";

  try {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();
    result.textContent = data.message || "Verification done.";

    if (data.ok) {
      // SUCCESS: redirect to your home page
      // Change this path as per your project:
      window.location.href = "/home.html";
    }
  } catch (e) {
    result.textContent = "Network error while verifying OTP.";
  } finally {
    btn.disabled = false;
  }
}