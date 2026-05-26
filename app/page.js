"use client";

import { useState } from "react";
import DrugReturnNotification from "./components/DrugReturnNotification";

const WARD_LIST = ["ICU", "CCU", "W05", "W6A", "W6B", "W07", "W08", "W09", "W10", "W12", "NSY"];

const CREDENTIALS = [
  { username: "nurse", password: "1234", role: "nurse" },
  { username: "pharm", password: "1234", role: "pharmacist" },
];

export default function Home() {
  // step: "login" | "ward" | "info"
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [detectedRole, setDetectedRole] = useState(null);
  const [selectedWard, setSelectedWard] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputEmpId, setInputEmpId] = useState("");
  const [user, setUser] = useState(null);

  function handleLogin() {
    const cred = CREDENTIALS.find(
      (c) => c.username === username.trim() && c.password === password.trim()
    );
    if (!cred) {
      setLoginError("Username หรือ Password ไม่ถูกต้อง");
      return;
    }
    setDetectedRole(cred.role);
    setLoginError("");
    if (cred.role === "pharmacist") {
      setStep("info");
    } else {
      setStep("ward");
    }
  }

  function handleWardSelect(ward) {
    setSelectedWard(ward);
    setStep("info");
  }

  function handleInfoSubmit() {
    if (!inputName.trim() || !inputEmpId.trim()) return;
    setUser({
      name: inputName.trim(),
      displayName: inputName.trim(),
      displayEmpId: inputEmpId.trim(),
      role: detectedRole,
      ward: detectedRole === "nurse" ? selectedWard : null,
    });
  }

  function handleLogout() {
    setUser(null);
    setStep("login");
    setUsername(""); setPassword(""); setLoginError("");
    setDetectedRole(null); setSelectedWard("");
    setInputName(""); setInputEmpId("");
  }

  const inputStyle = {
    width: "100%", padding: 14, borderRadius: 14,
    border: "1px solid #D1D5DB", marginBottom: 14,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'Sarabun', sans-serif",
  };

  if (user) {
    return (
      <div>
        <DrugReturnNotification user={user} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "linear-gradient(135deg,#064E3B 0%,#065F46 50%,#14532D 100%)",
      fontFamily: "'Sarabun', sans-serif", padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Nakornthon Pharmacy</div>
        <div style={{ color: "#6EE7B7", fontSize: 14, marginBottom: 36 }}>Workflow Dashboard</div>

        {/* ── STEP 1: Login ── */}
        {step === "login" && (
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 24, textAlign: "center" }}>เข้าสู่ระบบ</div>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                ...inputStyle,
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                ...inputStyle,
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
            />
            {loginError && (
              <div style={{ color: "#FCA5A5", fontSize: 13, marginBottom: 14, textAlign: "center" }}>{loginError}</div>
            )}
            <button
              onClick={handleLogin}
              disabled={!username.trim() || !password.trim()}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: username.trim() && password.trim()
                  ? "linear-gradient(90deg,#15803D,#22C55E)"
                  : "rgba(255,255,255,0.15)",
                color: "#fff", fontWeight: 700, fontSize: 16,
                cursor: username.trim() && password.trim() ? "pointer" : "not-allowed",
                fontFamily: "'Sarabun', sans-serif",
              }}
            >เข้าสู่ระบบ →</button>
            <div style={{
              marginTop: 20, background: "rgba(255,255,255,0.08)", padding: 14,
              borderRadius: 14, fontSize: 13, color: "#6EE7B7", textAlign: "center",
            }}>
              nurse / 1234 &nbsp;·&nbsp; pharm / 1234
            </div>
          </div>
        )}

        {/* ── STEP 2: เลือก Ward (พยาบาล) ── */}
        {step === "ward" && (
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>เลือก Ward</div>
            <div style={{ color: "#6EE7B7", fontSize: 13, marginBottom: 20, textAlign: "center" }}>กรุณาเลือก Ward ของคุณ</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {WARD_LIST.map((ward) => (
                <button key={ward} onClick={() => handleWardSelect(ward)} style={{
                  padding: "16px 8px", borderRadius: 14,
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  fontFamily: "'Sarabun', sans-serif",
                }}>{ward}</button>
              ))}
            </div>
            <div onClick={() => { setStep("login"); setDetectedRole(null); }}
              style={{ color: "#6EE7B7", fontSize: 13, marginTop: 20, textAlign: "center", cursor: "pointer" }}>
              ← กลับ
            </div>
          </div>
        )}

        {/* ── STEP 3: กรอกชื่อ + เลขบัตร ── */}
        {step === "info" && (
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>ยืนยันตัวตน</div>
            <div style={{
              background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 16px",
              marginBottom: 20, textAlign: "center", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: detectedRole === "pharmacist" ? "#065F46" : "#1D4ED8",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{detectedRole === "pharmacist" ? "ภก" : "RN"}</div>
              <div style={{ color: "#6EE7B7", fontSize: 14, fontWeight: 600 }}>
                {detectedRole === "pharmacist" ? "เภสัชกร → ห้องยา" : `พยาบาล → Ward ${selectedWard}`}
              </div>
            </div>
            <div style={{ color: "#6EE7B7", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
              กรุณากรอกชื่อ-นามสกุล และเลขบัตรประจำตัว
            </div>
            <input
              placeholder="ชื่อ-นามสกุล"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              style={{
                ...inputStyle,
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
              autoFocus
            />
            <input
              placeholder="เลขบัตรประจำตัว"
              value={inputEmpId}
              onChange={(e) => setInputEmpId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInfoSubmit()}
              style={{
                ...inputStyle,
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.2)",
              }}
            />
            <button
              onClick={handleInfoSubmit}
              disabled={!inputName.trim() || !inputEmpId.trim()}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: inputName.trim() && inputEmpId.trim()
                  ? "linear-gradient(90deg,#15803D,#22C55E)"
                  : "rgba(255,255,255,0.15)",
                color: "#fff", fontWeight: 700, fontSize: 16,
                cursor: inputName.trim() && inputEmpId.trim() ? "pointer" : "not-allowed",
                fontFamily: "'Sarabun', sans-serif",
              }}
            >เข้าสู่ระบบ →</button>
            <div onClick={() => {
              if (detectedRole === "nurse") setStep("ward");
              else setStep("login");
            }}
              style={{ color: "#6EE7B7", fontSize: 13, marginTop: 16, textAlign: "center", cursor: "pointer" }}>
              ← กลับ
            </div>
          </div>
        )}
      </div>
    </div>
  );
}