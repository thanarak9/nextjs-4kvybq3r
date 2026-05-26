"use client";
import { useState, useEffect, useRef } from "react";

// ─── MOCK USERS ───────────────────────────────────────────────
const USERS = [
  { id: 1, name: "นางสาวมาลี สุขใจ", empId: "N001", role: "nurse", ward: "ICU", pin: "1234" },
  { id: 2, name: "นายวิชัย รักดี", empId: "N002", role: "nurse", ward: "Ward 4A", pin: "1111" },
  { id: 3, name: "ภก.สมหมาย ใจดี", empId: "P001", role: "pharmacist", ward: null, pin: "9999" },
];

const WARDS = ["ICU", "Ward 4A", "Ward 5B", "CCU", "NICU"];

// ─── MOCK DATA ────────────────────────────────────────────────
const INITIAL_DATA = [
  {
    id: 1, ward: "ICU", hn: "65001234", patientName: "นายสมชาย ใจดี", room: "ICU-01",
    returnDrug: true, returnType: "ทางกระสวย", doctorOrder: true,
    createdAt: "25/05/2026 09:35", updatedAt: "25/05/2026 10:12", updatedBy: "ภก.สมหมาย ใจดี",
    genDrug: true, genDrugTime: "25/05/2026 09:50",
    deleteGenDrug: false, deleteGenDrugTime: "",
    genApprove: true, genApproveTime: "25/05/2026 10:00",
    deleteGenDrug2: false, deleteGenDrug2Time: "",
    genLocation: "",
    hmDrug: true, hmDrugTime: "25/05/2026 10:05",
    wardScan: false, wardScanTime: "",
    keyOrder: false, keyOrderTime: "",
    prepareDrug: false, prepareDrugTime: "",
    checkHM: false, checkHMTime: "",
    pendingKeyDrugs: [],
    returnReceive: false, returnReceiveTime: "",
    returnKey: false, returnKeyTime: "",
    returnCheck: false, returnCheckTime: "",
    completeAll: false, completeAllTime: "",
    approveTakeHome: false, approveTakeHomeTime: "",
    transport: "", transportTime: "",
    auditLog: [
      { time: "25/05/2026 09:35", user: "นางสาวมาลี สุขใจ (N001)", action: "สร้างรายการ" },
      { time: "25/05/2026 09:50", user: "ภก.สมหมาย ใจดี (P001)", action: "เปิด Gen Drug" },
      { time: "25/05/2026 10:00", user: "ภก.สมหมาย ใจดี (P001)", action: "Approve Gen Drug" },
      { time: "25/05/2026 10:05", user: "ภก.สมหมาย ใจดี (P001)", action: "เปิด HM Drug" },
    ],
  },
  {
    id: 2, ward: "Ward 4A", hn: "65005678", patientName: "นางสาวนิภา รักษ์ดี", room: "401",
    returnDrug: true, returnType: "ลิฟต์", doctorOrder: false,
    createdAt: "25/05/2026 08:10", updatedAt: "-", updatedBy: "-",
    genDrug: false, genDrugTime: "",
    deleteGenDrug: false, deleteGenDrugTime: "",
    genApprove: false, genApproveTime: "",
    deleteGenDrug2: false, deleteGenDrug2Time: "",
    genLocation: "",
    hmDrug: false, hmDrugTime: "",
    wardScan: false, wardScanTime: "",
    keyOrder: false, keyOrderTime: "",
    prepareDrug: false, prepareDrugTime: "",
    checkHM: false, checkHMTime: "",
    pendingKeyDrugs: [],
    returnReceive: false, returnReceiveTime: "",
    returnKey: false, returnKeyTime: "",
    returnCheck: false, returnCheckTime: "",
    completeAll: false, completeAllTime: "",
    approveTakeHome: false, approveTakeHomeTime: "",
    pharmacistDispense: false, pharmacistDispenseTime: "",
    transport: "", transportTime: "",
    auditLog: [
      { time: "25/05/2026 08:10", user: "นายวิชัย รักดี (N002)", action: "สร้างรายการ" },
    ],
  },
  {
    id: 3, ward: "ICU", hn: "65009999", patientName: "นายประสิทธิ์ มั่นคง", room: "ICU-03",
    returnDrug: false, returnType: "ทางกระสวย", doctorOrder: true,
    createdAt: "25/05/2026 11:00", updatedAt: "-", updatedBy: "-",
    genDrug: false, genDrugTime: "",
    deleteGenDrug: false, deleteGenDrugTime: "",
    genApprove: false, genApproveTime: "",
    deleteGenDrug2: false, deleteGenDrug2Time: "",
    genLocation: "",
    hmDrug: false, hmDrugTime: "",
    wardScan: false, wardScanTime: "",
    keyOrder: false, keyOrderTime: "",
    prepareDrug: false, prepareDrugTime: "",
    checkHM: false, checkHMTime: "",
    pendingKeyDrugs: [],
    returnReceive: false, returnReceiveTime: "",
    returnKey: false, returnKeyTime: "",
    returnCheck: false, returnCheckTime: "",
    completeAll: false, completeAllTime: "",
    approveTakeHome: false, approveTakeHomeTime: "",
    pharmacistDispense: false, pharmacistDispenseTime: "",
    transport: "", transportTime: "",
    auditLog: [
      { time: "25/05/2026 11:00", user: "นางสาวมาลี สุขใจ (N001)", action: "สร้างรายการ" },
    ],
  },
];

function getCurrentTime() {
  return new Date().toLocaleString("th-TH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getProgress(item) {
  let done = 0;
  // ข้อ 1: ตอบแล้ว (ใช่ หรือ ไม่ใช่)
  if (item.genDrug === true || item._genAnswered) done++;
  // ข้อ 2: ตอบแล้ว (approve หรือ ยังไม่ approve)
  if (item.genApprove === true || item._approveAnswered) done++;
  // ยา HM
  if (item.wardScan) done++;
  if (item.keyOrder) done++;
  if (item.prepareDrug) done++;
  if (item.checkHM) done++;
  // ยาคืน
  if (item.returnReceive) done++;
  if (item.returnKey) done++;
  if (item.returnCheck) done++;
  // complete
  if (item.pharmacistDispense) done++;
  if (item.approveTakeHome) done++;
  return Math.round((done / 11) * 100);
}

function getStatus(item) {
  if (item.approveTakeHome && item.transport) return { label: "สำเร็จ", color: "#16A34A", bg: "#DCFCE7" };
  if (item.genApprove) return { label: "กำลังดำเนินการ", color: "#D97706", bg: "#FEF3C7" };
  if (item.genDrug) return { label: "Gen Drug", color: "#2563EB", bg: "#DBEAFE" };
  return { label: "รอดำเนินการ", color: "#6B7280", bg: "#F3F4F6" };
}

// ══════════════════════════════════════════════════════════════
// LOGIN  (3 steps: เลือก role → PIN → กรอกชื่อ+รหัส)
// ══════════════════════════════════════════════════════════════
const WARD_LIST = ["ICU", "CCU", "5", "6A", "6B", "7", "8", "9", "10", "12", "NSY"];

// ── credentials ──────────────────────────────────────────────
const CREDENTIALS = [
  { username: "nurse", password: "1234", role: "nurse" },
  { username: "pharm", password: "1234", role: "pharmacist" },
];

function LoginScreen({ onLogin }) {
  // step: "login" | "ward" | "info"
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [detectedRole, setDetectedRole] = useState(null); // "nurse" | "pharmacist"
  const [selectedWard, setSelectedWard] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputEmpId, setInputEmpId] = useState("");

  function handleLogin() {
    const cred = CREDENTIALS.find(c => c.username === username.trim() && c.password === password.trim());
    if (!cred) { setLoginError("username หรือ password ไม่ถูกต้อง"); return; }
    setDetectedRole(cred.role);
    setLoginError("");
    if (cred.role === "pharmacist") {
      setStep("info"); // เภสัชไม่ต้องเลือก ward
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
    const baseUser = USERS.find(u => u.role === detectedRole) || USERS[0];
    onLogin({
      ...baseUser,
      role: detectedRole,
      ward: detectedRole === "nurse" ? selectedWard : null,
      displayName: inputName.trim(),
      displayEmpId: inputEmpId.trim(),
    });
  }

  const glassInput = {
    width: "100%", padding: "14px 16px", borderRadius: 14,
    border: "1.5px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)", color: "#fff",
    fontFamily: "'Sarabun', sans-serif", fontSize: 15,
    outline: "none", boxSizing: "border-box", marginBottom: 14,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#064E3B 0%,#065F46 50%,#14532D 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Sarabun', sans-serif", padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Nakornthon Pharmacy</div>
      <div style={{ color: "#6EE7B7", fontSize: 14, marginBottom: 36 }}>Workflow Dashboard</div>

      {/* ── STEP 1: Login ── */}
      {step === "login" && (
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 24, textAlign: "center" }}>เข้าสู่ระบบ</div>
          <input
            placeholder="Username"
            value={username}
            onChange={e => { setUsername(e.target.value); setLoginError(""); }}
            style={glassInput}
            autoFocus
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setLoginError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={glassInput}
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
              fontFamily: "'Sarabun', sans-serif", transition: "background 0.2s",
            }}
          >เข้าสู่ระบบ →</button>
          <div style={{ color: "#6EE7B7", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            nurse / 1234 &nbsp;·&nbsp; pharm / 1234
          </div>
        </div>
      )}

      {/* ── STEP 2: เลือก Ward (เฉพาะพยาบาล) ── */}
      {step === "ward" && (
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>เลือก Ward</div>
          <div style={{ color: "#6EE7B7", fontSize: 13, marginBottom: 20, textAlign: "center" }}>กรุณาเลือก Ward ของคุณ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {WARD_LIST.map(ward => (
              <button key={ward} onClick={() => handleWardSelect(ward)} style={{
                padding: "16px 8px", borderRadius: 14,
                border: "1.5px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                fontFamily: "'Sarabun', sans-serif", transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              >{ward}</button>
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
          <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>
            ยืนยันตัวตน
          </div>
          <div style={{
            background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 16px",
            marginBottom: 20, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
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
            onChange={e => setInputName(e.target.value)}
            style={glassInput}
            autoFocus
          />
          <input
            placeholder="เลขบัตรประจำตัว"
            value={inputEmpId}
            onChange={e => setInputEmpId(e.target.value)}
            style={glassInput}
            onKeyDown={e => e.key === "Enter" && handleInfoSubmit()}
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
              fontFamily: "'Sarabun', sans-serif", transition: "background 0.2s",
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
  );
}

// ══════════════════════════════════════════════════════════════
// STAT DASHBOARD
// ══════════════════════════════════════════════════════════════
function StatDashboard({ data }) {
  const total = data.length;
  const complete = data.filter(d => d.approveTakeHome && d.transport).length;
  const inProgress = data.filter(d => d.genDrug && !(d.approveTakeHome && d.transport)).length;
  const pending = data.filter(d => !d.genDrug).length;
  const wardCounts = {};
  data.forEach(d => { wardCounts[d.ward] = (wardCounts[d.ward] || 0) + 1; });

  const cards = [
    { label: "รายการทั้งหมด", value: total, color: "#2563EB", bg: "#DBEAFE" },
    { label: "สำเร็จแล้ว", value: complete, color: "#16A34A", bg: "#DCFCE7" },
    { label: "กำลังดำเนินการ", value: inProgress, color: "#D97706", bg: "#FEF3C7" },
    { label: "รอดำเนินการ", value: pending, color: "#6B7280", bg: "#F3F4F6" },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: c.bg }}>
              <div style={{
                height: "100%", borderRadius: 99, background: c.color,
                width: total ? `${(c.value / total) * 100}%` : "0%", transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>รายการแยกตาม Ward</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(wardCounts).map(([ward, count]) => (
            <div key={ward} style={{ padding: "6px 14px", borderRadius: 99, background: "#F0FDF4", color: "#15803D", fontSize: 13, fontWeight: 600 }}>
              {ward}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BELL
// ══════════════════════════════════════════════════════════════
function NotificationBell({ data }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const alerts = data.filter(d => !d.approveTakeHome && d.genApprove && !d.wardScan);
  const unread = alerts.length;
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12,
        width: 40, height: 40, cursor: "pointer", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && (
          <div style={{
            position: "absolute", top: 6, right: 6, width: 16, height: 16,
            borderRadius: "50%", background: "#EF4444", color: "#fff",
            fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</div>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: 48, width: 300,
          background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, color: "#15803D" }}>
            การแจ้งเตือน {unread > 0 && <span style={{ color: "#EF4444" }}>({unread})</span>}
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: "20px 18px", color: "#94A3B8", fontSize: 14, textAlign: "center" }}>ไม่มีการแจ้งเตือน</div>
          ) : alerts.map(a => (
            <div key={a.id} style={{ padding: "12px 18px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patientName}</div>
              <div style={{ fontSize: 12, color: "#EF4444", marginTop: 2 }}>⚠️ Approved แล้ว รอ Ward Scan ใบยา</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{a.ward} · ห้อง {a.room}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════
function AuditLog({ log }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#15803D", marginBottom: 12 }}>📋 ประวัติการแก้ไข</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {log.map((entry, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "10px 14px",
            background: i % 2 === 0 ? "#F8FAFC" : "#fff", borderRadius: 10, fontSize: 13,
          }}>
            <div style={{ color: "#94A3B8", minWidth: 130 }}>{entry.time}</div>
            <div style={{ color: "#374151", flex: 1 }}>
              <span style={{ fontWeight: 600 }}>{entry.user}</span> · {entry.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════════════════════
function ProgressBar({ value }) {
  const color = value === 100 ? "#16A34A" : value > 50 ? "#D97706" : "#3B82F6";
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>ความคืบหน้า</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#E5E7EB" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: `${value}%`, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function StatusBadge({ active, text }) {
  return (
    <div style={{
      padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: active ? "#DCFCE7" : "#E5E7EB",
      color: active ? "#15803D" : "#6B7280",
    }}>{text}</div>
  );
}

// ══════════════════════════════════════════════════════════════
// TASK BUTTON — tick + time always shown when active
// ══════════════════════════════════════════════════════════════
function TaskButton({ active, text, onClick, time, disabled }) {
  return (
    <div>
      <button onClick={disabled ? undefined : onClick} style={{
        width: "100%", padding: 14, border: "none", borderRadius: 14,
        background: active ? "#15803D" : disabled ? "#F3F4F6" : "#E5E7EB",
        color: active ? "#fff" : disabled ? "#CBD5E1" : "#374151",
        fontWeight: 700, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Sarabun', sans-serif", fontSize: 14, transition: "background 0.2s",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: active ? "none" : "2px solid #9CA3AF",
          background: active ? "#fff" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#15803D", fontWeight: 900, fontSize: 13,
        }}>{active ? "✓" : ""}</span>
        {text}
      </button>
      {active && time && (
        <div style={{ marginTop: 4, marginLeft: 8, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
          🕐 {time}
        </div>
      )}
    </div>
  );
}

function Section({ title, children, locked, lockMsg }) {
  return (
    <div style={{
      background: locked ? "#F9FAFB" : "#F8FAFC", padding: 18, borderRadius: 18, marginBottom: 12,
      opacity: locked ? 0.6 : 1,
      border: locked ? "1.5px dashed #E5E7EB" : "none",
    }}>
      <div style={{ fontWeight: 700, marginBottom: locked ? 8 : 14, color: locked ? "#94A3B8" : "#15803D", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        {locked && <span>🔒</span>}{title}
      </div>
      {locked ? (
        <div style={{ fontSize: 13, color: "#94A3B8" }}>{lockMsg}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>{children}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DETAIL MODAL CONTENT (Pharmacist workflow)
// ══════════════════════════════════════════════════════════════
function WorkflowDetail({ selected, user, updateTask, updateField }) {
  const [newDrugText, setNewDrugText] = useState("");

  // ข้อ 1 หรือ 2 ตอบแล้ว → ปลดล็อก HM/ยาคืน
  const genAnswered = selected.genDrug === true || selected._genAnswered || selected.genApprove === true || selected._approveAnswered;
  // Section HM gate
  const hmComplete = selected.wardScan && selected.keyOrder && selected.prepareDrug && selected.checkHM;
  // Section 2 gates
  const returnComplete = selected.returnReceive && selected.returnKey && selected.returnCheck;
  // Section 3 gate
  const canComplete = hmComplete && returnComplete;

  function addPendingDrug() {
    if (!newDrugText.trim()) return;
    const updated = [...(selected.pendingKeyDrugs || []), {
      id: Date.now(),
      name: newDrugText.trim(),
      done: false,
      doneTime: "",
      pharmacistDispensed: false,
    }];
    updateField({ pendingKeyDrugs: updated }, `เพิ่มยารอ Key: ${newDrugText.trim()}`);
    setNewDrugText("");
  }

  function removePendingDrug(id) {
    const drug = (selected.pendingKeyDrugs || []).find(d => d.id === id);
    const updated = (selected.pendingKeyDrugs || []).filter(d => d.id !== id);
    updateField({ pendingKeyDrugs: updated }, `ลบยารอ Key: ${drug?.name || ""}`);
  }

  function toggleDrugDone(id) {
    const now = getCurrentTime();
    const drug = (selected.pendingKeyDrugs || []).find(d => d.id === id);
    const updated = (selected.pendingKeyDrugs || []).map(d =>
      d.id === id ? { ...d, done: !d.done, doneTime: !d.done ? now : "" } : d
    );
    updateField({ pendingKeyDrugs: updated }, `${!drug?.done ? "✓ ทำเสร็จ" : "ยกเลิก"}: ${drug?.name || ""}`);
  }

  function togglePharmacistDispensed(id) {
    const drug = (selected.pendingKeyDrugs || []).find(d => d.id === id);
    const updated = (selected.pendingKeyDrugs || []).map(d =>
      d.id === id ? { ...d, pharmacistDispensed: !d.pharmacistDispensed } : d
    );
    updateField({ pendingKeyDrugs: updated }, `${!drug?.pharmacistDispensed ? "เภสัชจ่ายยา" : "ยกเลิกเภสัชจ่ายยา"}: ${drug?.name || ""}`);
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>

      {/* ──────── ส่วนที่ 1: อยู่ในช่วง Gen ยา ──────── */}
      <Section title="1. อยู่ในช่วง Gen ยาหรือไม่">
        {/* 1.ใช่ */}
        <TaskButton
          active={selected.genDrug === true}
          text="1. ใช่"
          time={selected.genDrugTime}
          onClick={() => {
            const now = getCurrentTime();
            updateField({
              genDrug: true, genDrugTime: now,
              genApprove: false, genApproveTime: "",
              deleteGenDrug: false, deleteGenDrugTime: "",
              deleteGenDrug2: false, deleteGenDrug2Time: "",
              genLocation: "",
            }, "เลือก: อยู่ในช่วง Gen ยา (ใช่)");
          }}
        />
        {/* ถ้าเลือก ใช่ → ลบยา Gen แล้ว */}
        {selected.genDrug === true && (
          <div style={{ paddingLeft: 16, borderLeft: "3px solid #86EFAC" }}>
            <TaskButton
              active={selected.deleteGenDrug}
              text="ลบยา Gen แล้ว"
              time={selected.deleteGenDrugTime}
              onClick={() => updateTask("deleteGenDrug", "ลบยา Gen แล้ว (จากช่วง Gen)")}
            />
          </div>
        )}

        {/* 2.ไม่ใช่ */}
        <TaskButton
          active={selected.genDrug === false && selected.genDrug !== undefined && selected._genAnswered}
          text="2. ไม่ใช่"
          onClick={() => {
            updateField({
              genDrug: false, genDrugTime: "",
              _genAnswered: true,
              deleteGenDrug: false, deleteGenDrugTime: "",
            }, "เลือก: ไม่อยู่ในช่วง Gen ยา (ไม่ใช่)");
          }}
        />
      </Section>

      {/* ──────── ส่วนที่ 2: ยา Gen Approve หรือยัง ──────── */}
      <Section title="2. ยา Gen Approve หรือยัง">
        {/* 1. Approve แล้ว */}
        <TaskButton
          active={selected.genApprove === true}
          text="1. Approve แล้ว"
          time={selected.genApproveTime}
          onClick={() => {
            const now = getCurrentTime();
            updateField({
              genApprove: true, genApproveTime: now,
              deleteGenDrug2: false, deleteGenDrug2Time: "",
              genLocation: "",
            }, "ยา Gen Approve แล้ว");
          }}
        />

        {/* ถ้า Approve แล้ว → ลบยา Gen แล้ว + เลือก location */}
        {selected.genApprove === true && (
          <div style={{ paddingLeft: 16, borderLeft: "3px solid #86EFAC", display: "grid", gap: 10 }}>
            <TaskButton
              active={selected.deleteGenDrug2}
              text="ลบยา Gen แล้ว"
              time={selected.deleteGenDrug2Time}
              onClick={() => updateTask("deleteGenDrug2", "ลบยา Gen แล้ว (หลัง Approve)")}
            />
            {/* เลือก location */}
            {selected.deleteGenDrug2 && (
              <div>
                <div style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginBottom: 8 }}>ยา Gen อยู่ที่ไหน?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["อยู่บน Ward", "อยู่ห้องยา"].map(loc => (
                    <button key={loc} onClick={() => {
                      const now = getCurrentTime();
                      updateField({ genLocation: loc }, `เลือกตำแหน่งยา Gen: ${loc}`);
                    }} style={{
                      padding: "12px 8px", borderRadius: 12, border: "2px solid",
                      borderColor: selected.genLocation === loc ? "#15803D" : "#E5E7EB",
                      background: selected.genLocation === loc ? "#DCFCE7" : "#fff",
                      color: selected.genLocation === loc ? "#15803D" : "#374151",
                      fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun', sans-serif", fontSize: 13,
                    }}>{selected.genLocation === loc ? "✓ " : ""}{loc}</button>
                  ))}
                </div>
                {selected.genLocation && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                    📍 {selected.genLocation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. ยังไม่ Approve */}
        <TaskButton
          active={selected.genApprove === false && selected._approveAnswered}
          text="2. ยังไม่ Approve"
          onClick={() => {
            updateField({
              genApprove: false, genApproveTime: "",
              _approveAnswered: true,
              deleteGenDrug2: false, deleteGenDrug2Time: "",
              genLocation: "",
            }, "ยา Gen ยังไม่ Approve");
          }}
        />
      </Section>

      {/* ──────── ส่วนที่ 1: ยา HM ──────── */}
      <Section
        title="1. ยา HM"
        locked={!genAnswered}
        lockMsg="ต้องตอบข้อ 1 หรือข้อ 2 ก่อนจึงจะดำเนินการส่วนนี้ได้"
      >
        <TaskButton active={selected.wardScan} text="Ward Scan ใบยา" time={selected.wardScanTime} onClick={() => updateTask("wardScan", "Ward Scan ใบยา")} />
        <TaskButton active={selected.keyOrder} text="Key Order" time={selected.keyOrderTime} onClick={() => updateTask("keyOrder", "Key Order")} />
        <TaskButton active={selected.prepareDrug} text="จัดยา" time={selected.prepareDrugTime} onClick={() => updateTask("prepareDrug", "จัดยา")} />
        <TaskButton active={selected.checkHM} text="Check HM" time={selected.checkHMTime} onClick={() => updateTask("checkHM", "Check HM")} />

        {/* ── ข้อ 4: ยาที่ยังไม่ Key รอยาคืน ── */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 14,
          border: "1.5px solid #E5E7EB",
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            4. ยาที่ยังไม่ Key รอยาคืน
            {(selected.pendingKeyDrugs || []).length > 0 && (
              <span style={{
                background: (selected.pendingKeyDrugs || []).every(d => d.done) ? "#DCFCE7" : "#FEF3C7",
                color: (selected.pendingKeyDrugs || []).every(d => d.done) ? "#15803D" : "#D97706",
                borderRadius: 99, padding: "2px 10px", fontSize: 12, fontWeight: 700,
              }}>
                {(selected.pendingKeyDrugs || []).filter(d => d.done).length}/{(selected.pendingKeyDrugs || []).length} เสร็จ
              </span>
            )}
          </div>

          {/* รายการยา */}
          {(selected.pendingKeyDrugs || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(selected.pendingKeyDrugs || []).map((drug, i) => (
                <div key={drug.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  borderRadius: 12, border: `1.5px solid ${drug.done ? "#86EFAC" : "#E5E7EB"}`,
                  background: drug.done ? "#F0FDF4" : "#FFFBEB",
                  padding: "10px 12px",
                }}>
                  {/* ปุ่ม tick */}
                  <button onClick={() => toggleDrugDone(drug.id)} style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                    border: `2px solid ${drug.done ? "#15803D" : "#9CA3AF"}`,
                    background: drug.done ? "#15803D" : "transparent",
                    color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{drug.done ? "✓" : ""}</button>

                  {/* ชื่อยา + เวลา */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: drug.done ? "#15803D" : "#374151",
                      textDecoration: drug.done ? "line-through" : "none",
                    }}>
                      <span style={{ color: "#D97706", marginRight: 4 }}>{i + 1}.</span>
                      {drug.name}
                    </div>
                    {drug.done && drug.doneTime && (
                      <div style={{ fontSize: 11, color: "#15803D", marginTop: 2, fontWeight: 600 }}>
                        🕐 เสร็จเมื่อ {drug.doneTime}
                      </div>
                    )}
                  </div>

                  {/* ปุ่มลบ */}
                  <button onClick={() => removePendingDrug(drug.id)} style={{
                    flexShrink: 0, background: "none", border: "none", cursor: "pointer",
                    color: "#EF4444", fontSize: 16, padding: "0 4px", lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* กรอกยาใหม่ */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newDrugText}
              onChange={e => setNewDrugText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPendingDrug()}
              placeholder="พิมพ์ชื่อยา..."
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: "1.5px solid #D1D5DB", fontFamily: "'Sarabun', sans-serif",
                fontSize: 14, outline: "none",
              }}
            />
            <button onClick={addPendingDrug} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "#15803D", color: "#fff", fontWeight: 700,
              cursor: "pointer", fontSize: 14, fontFamily: "'Sarabun', sans-serif",
            }}>+ เพิ่ม</button>
          </div>
        </div>
        {genAnswered && (
          <div style={{
            marginTop: 4, padding: "10px 14px", borderRadius: 12,
            background: hmComplete ? "#DCFCE7" : "#FEF3C7",
            color: hmComplete ? "#15803D" : "#D97706", fontSize: 13, fontWeight: 600,
          }}>
            {hmComplete ? "✅ ยา HM ครบทุกขั้นตอน" : `⏳ ยังดำเนินการไม่ครบ (${[selected.wardScan,selected.keyOrder,selected.prepareDrug,selected.checkHM].filter(Boolean).length}/4 ขั้นตอน)`}
          </div>
        )}
      </Section>

      {/* ──────── ส่วนที่ 2: ยาคืน ──────── */}
      <Section
        title="2. ยาคืน"
        locked={!genAnswered}
        lockMsg="ต้องตอบข้อ 1 หรือข้อ 2 ก่อนจึงจะดำเนินการส่วนนี้ได้"
      >
        <TaskButton active={selected.returnReceive} text="ได้รับยาคืน" time={selected.returnReceiveTime} onClick={() => updateTask("returnReceive", "ได้รับยาคืน")} />
        <TaskButton active={selected.returnKey} text="Key ยาคืนเสร็จ" time={selected.returnKeyTime} onClick={() => updateTask("returnKey", "Key ยาคืนเสร็จ")} />
        <TaskButton active={selected.returnCheck} text="Check คืน" time={selected.returnCheckTime} onClick={() => updateTask("returnCheck", "Check คืน")} />
        {genAnswered && (
          <div style={{
            marginTop: 4, padding: "10px 14px", borderRadius: 12,
            background: returnComplete ? "#DCFCE7" : "#FEF3C7",
            color: returnComplete ? "#15803D" : "#D97706", fontSize: 13, fontWeight: 600,
          }}>
            {returnComplete ? "✅ ยาคืนครบทุกขั้นตอน" : `⏳ ยังดำเนินการไม่ครบ (${[selected.returnReceive,selected.returnKey,selected.returnCheck].filter(Boolean).length}/3)`}
          </div>
        )}
      </Section>

      {/* ──────── ส่วนที่ 3: Complete ──────── */}
      <Section
        title="3. ยา HM/ยาคืน Complete"
        locked={!canComplete}
        lockMsg="ต้องทำ ยา HM และ ยาคืน ให้ครบทุกขั้นตอนก่อน"
      >
        <TaskButton
          active={selected.approveTakeHome}
          text="กด Approve Drug Take Home"
          time={selected.approveTakeHomeTime}
          onClick={() => updateTask("approveTakeHome", "Approve Drug Take Home")}
        />
        {selected.approveTakeHome && (
          <div style={{ display: "grid", gap: 12, paddingLeft: 4 }}>
            {/* 1. ส่งยาทาง */}
            <div>
              <div style={{ fontSize: 13, color: "#374151", fontWeight: 700, marginBottom: 8 }}>1. ส่งยาทาง</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["กระสวย", "ลิฟต์"].map(t => (
                  <button key={t} onClick={() => {
                    const now = getCurrentTime();
                    updateField({ transport: t, transportTime: now }, `ส่งยาทาง ${t}`);
                  }} style={{
                    padding: "14px 8px", borderRadius: 12, border: "2px solid",
                    borderColor: selected.transport === t ? "#15803D" : "#E5E7EB",
                    background: selected.transport === t ? "#DCFCE7" : "#fff",
                    color: selected.transport === t ? "#15803D" : "#374151",
                    fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun', sans-serif", fontSize: 15,
                  }}>{selected.transport === t ? "✓ " : ""}{t}</button>
                ))}
              </div>
              {selected.transport && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                  🚀 ส่งทาง{selected.transport} · 🕐 {selected.transportTime}
                </div>
              )}
            </div>
            {/* 2. เภสัชจ่ายยา */}
            <div>
              <div style={{ fontSize: 13, color: "#374151", fontWeight: 700, marginBottom: 8 }}>2. เภสัชจ่ายยา</div>
              <TaskButton
                active={selected.pharmacistDispense}
                text="เภสัชจ่ายยา"
                time={selected.pharmacistDispenseTime}
                onClick={() => updateTask("pharmacistDispense", "เภสัชจ่ายยา")}
              />
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function MainDashboard({ user, onLogout }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterWard, setFilterWard] = useState("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [showStats, setShowStats] = useState(false);
  const [form, setForm] = useState({ hn: "", patientName: "", room: "", returnDrug: false, returnType: "ทางกระสวย", doctorOrder: false });

  const userLabel = `${user.displayName || user.name} (${user.displayEmpId || user.empId})`;

  const visibleData = (user.role === "pharmacist" ? data : data.filter(d => d.ward === user.ward))
    .filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.patientName.toLowerCase().includes(q) || d.hn.includes(q) || d.room.toLowerCase().includes(q);
      const matchWard = filterWard === "ทั้งหมด" || d.ward === filterWard;
      const isComplete = d.approveTakeHome && d.transport;
      const matchStatus = filterStatus === "ทั้งหมด" ||
        (filterStatus === "สำเร็จ" && isComplete) ||
        (filterStatus === "กำลังดำเนินการ" && d.genDrug && !isComplete) ||
        (filterStatus === "รอดำเนินการ" && !d.genDrug && !isComplete);
      return matchSearch && matchWard && matchStatus;
    });

  function handleSave() {
    if (editingId) {
      setData(prev => prev.map(item => item.id === editingId
        ? {
            ...item, ...form,
            updatedAt: getCurrentTime(), updatedBy: userLabel,
            auditLog: [...item.auditLog, { time: getCurrentTime(), user: userLabel, action: "แก้ไขข้อมูลผู้ป่วย" }],
          }
        : item
      ));
      resetForm(); return;
    }
    if (data.find(d => d.hn === form.hn)) { alert("HN นี้มีอยู่แล้ว"); return; }
    const newItem = {
      id: Date.now(), ward: user.ward, ...form,
      createdAt: getCurrentTime(), updatedAt: "-", updatedBy: "-",
      genDrug: false, genDrugTime: "", _genAnswered: false,
      deleteGenDrug: false, deleteGenDrugTime: "",
      genApprove: false, genApproveTime: "", _approveAnswered: false,
      deleteGenDrug2: false, deleteGenDrug2Time: "",
      genLocation: "", hmDrug: false, hmDrugTime: "",
      wardScan: false, wardScanTime: "",
      keyOrder: false, keyOrderTime: "", prepareDrug: false, prepareDrugTime: "",
      checkHM: false, checkHMTime: "", pendingKeyDrugs: [], returnReceive: false, returnReceiveTime: "",
      returnKey: false, returnKeyTime: "", returnCheck: false, returnCheckTime: "",
      completeAll: false, completeAllTime: "", approveTakeHome: false, approveTakeHomeTime: "",
      pharmacistDispense: false, pharmacistDispenseTime: "",
      transport: "", transportTime: "",
      auditLog: [{ time: getCurrentTime(), user: userLabel, action: "สร้างรายการ" }],
    };
    setData([newItem, ...data]);
    resetForm();
  }

  function resetForm() {
    setForm({ hn: "", patientName: "", room: "", returnDrug: false, returnType: "ทางกระสวย", doctorOrder: false });
    setEditingId(null); setShowForm(false);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({ hn: item.hn, patientName: item.patientName, room: item.room, returnDrug: item.returnDrug, returnType: item.returnType, doctorOrder: item.doctorOrder });
    setShowForm(true);
  }

  // Toggle boolean field + timestamp
  function updateTask(key, actionLabel) {
    const now = getCurrentTime();
    setData(prev => prev.map(item => {
      if (item.id !== selected.id) return item;
      const newVal = !item[key];
      return {
        ...item,
        [key]: newVal,
        [`${key}Time`]: newVal ? now : "",
        updatedAt: now, updatedBy: userLabel,
        auditLog: [...item.auditLog, { time: now, user: userLabel, action: (newVal ? "✓ " : "✗ ") + actionLabel }],
      };
    }));
    setSelected(prev => {
      const newVal = !prev[key];
      return {
        ...prev,
        [key]: newVal,
        [`${key}Time`]: newVal ? now : "",
        updatedAt: now, updatedBy: userLabel,
        auditLog: [...prev.auditLog, { time: now, user: userLabel, action: (newVal ? "✓ " : "✗ ") + actionLabel }],
      };
    });
  }

  // Set arbitrary fields
  function updateField(fields, actionLabel) {
    const now = getCurrentTime();
    setData(prev => prev.map(item => {
      if (item.id !== selected.id) return item;
      return {
        ...item, ...fields,
        updatedAt: now, updatedBy: userLabel,
        auditLog: [...item.auditLog, { time: now, user: userLabel, action: actionLabel }],
      };
    }));
    setSelected(prev => ({
      ...prev, ...fields,
      updatedAt: now, updatedBy: userLabel,
      auditLog: [...prev.auditLog, { time: now, user: userLabel, action: actionLabel }],
    }));
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", marginBottom: 14, borderRadius: 12,
    border: "1.5px solid #D1D5DB", fontFamily: "'Sarabun', sans-serif", fontSize: 15,
    boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ fontFamily: "'Sarabun', sans-serif", minHeight: "100vh", background: "#F0FDF4" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "linear-gradient(90deg,#065F46,#16A34A)", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>Nakornthon Pharmacy</div>
            <div style={{ color: "#DCFCE7", fontSize: 13 }}>Workflow Dashboard</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NotificationBell data={data} />
            <button onClick={() => setShowStats(s => !s)} style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12,
              padding: "8px 14px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
              fontFamily: "'Sarabun', sans-serif",
            }}>📊 {showStats ? "ซ่อน" : "สถิติ"}</button>
            <div style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: 12, fontSize: 13 }}>
              {(user.displayName || user.name).split(" ")[0]} · {user.displayEmpId || user.empId} · {user.role === "pharmacist" ? "เภสัชกร" : user.ward}
            </div>
            <button onClick={onLogout} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 12, padding: "8px 14px", color: "#fff", cursor: "pointer",
              fontFamily: "'Sarabun', sans-serif", fontSize: 13,
            }}>ออกจากระบบ</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {showStats && <StatDashboard data={user.role === "pharmacist" ? data : data.filter(d => d.ward === user.ward)} />}

        {/* SEARCH & FILTER */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: 18, marginBottom: 20,
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
        }}>
          <input placeholder="🔍 ค้นหาชื่อผู้ป่วย, HN, ห้อง..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, flex: "1 1 200px", fontSize: 14 }}
          />
          {user.role === "pharmacist" && (
            <select value={filterWard} onChange={e => setFilterWard(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0, flex: "0 1 160px", fontSize: 14 }}>
              <option>ทั้งหมด</option>
              {WARD_LIST.map(w => <option key={w}>{w}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, flex: "0 1 180px", fontSize: 14 }}>
            <option>ทั้งหมด</option>
            <option>รอดำเนินการ</option>
            <option>กำลังดำเนินการ</option>
            <option>สำเร็จ</option>
          </select>
          <div style={{ fontSize: 13, color: "#94A3B8", whiteSpace: "nowrap" }}>
            แสดง {visibleData.length} รายการ
          </div>
        </div>

        {/* ADD BUTTON */}
        {user.role === "nurse" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => setShowForm(true)} style={{
              padding: "12px 24px", border: "none", borderRadius: 16,
              background: "linear-gradient(90deg,#15803D,#22C55E)",
              color: "#fff", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Sarabun', sans-serif", fontSize: 15,
            }}>+ เพิ่มรายการ</button>
          </div>
        )}

        {/* CARD LIST */}
        {visibleData.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 16 }}>ไม่พบรายการที่ค้นหา</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibleData.map(item => {
              const status = getStatus(item);
              const progress = getProgress(item);
              return (
                <div key={item.id} style={{
                  background: "#fff", borderRadius: 22, padding: 20,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${status.color}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelected(item)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{item.patientName}</div>
                        <div style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: status.bg, color: status.color }}>{status.label}</div>
                      </div>
                      <div style={{ marginTop: 5, color: "#64748B", fontSize: 14 }}>HN: {item.hn} · {item.ward} · ห้อง {item.room}</div>
                      {/* แสดงยาที่ยังไม่ Key */}
                      {(item.pendingKeyDrugs || []).length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(item.pendingKeyDrugs || []).map(drug => (
                            <span key={drug.id} style={{
                              padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                              background: drug.done ? "#DCFCE7" : "#FEF9C3",
                              color: drug.done ? "#15803D" : "#D97706",
                              textDecoration: drug.done ? "line-through" : "none",
                            }}>
                              {drug.done ? "✓ " : "⏳ "}{drug.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <StatusBadge active={item.returnDrug} text={item.returnDrug ? `Return (${item.returnType})` : "Return"} />
                        <StatusBadge active={item.doctorOrder} text="Doctor Order" />
                        {item.genDrug && <StatusBadge active text="Gen Drug" />}
                        {item.genApprove && <StatusBadge active text="Approved" />}
                        {item.approveTakeHome && <StatusBadge active text="✓ Complete" />}
                        {item.transport && <StatusBadge active text={`🚀 ${item.transport}`} />}
                      </div>
                      <ProgressBar value={progress} />
                      <div style={{ marginTop: 8, fontSize: 11, color: "#CBD5E1" }}>
                        สร้าง: {item.createdAt} · อัปเดต: {item.updatedAt}
                        {item.updatedBy !== "-" && ` โดย ${item.updatedBy}`}
                      </div>
                    </div>
                    {user.role === "nurse" && (
                      <button onClick={() => handleEdit(item)} style={{
                        height: 40, padding: "0 16px", border: "none", borderRadius: 12,
                        background: "#E0F2FE", color: "#0369A1", fontWeight: 700, cursor: "pointer",
                        fontFamily: "'Sarabun', sans-serif", fontSize: 14,
                      }}>แก้ไข</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", justifyContent: "center", alignItems: "center", padding: 20, zIndex: 999,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", width: "100%", maxWidth: 700, borderRadius: 26,
            padding: 28, maxHeight: "90vh", overflow: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.patientName}</div>
                <div style={{ fontSize: 14, color: "#64748B" }}>HN: {selected.hn} · {selected.ward} · ห้อง {selected.room}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: "#F1F5F9", cursor: "pointer", fontSize: 18,
              }}>✕</button>
            </div>

            <ProgressBar value={getProgress(selected)} />
            <div style={{ height: 16 }} />

            {user.role === "pharmacist" && (
              <WorkflowDetail
                selected={selected}
                user={user}
                updateTask={updateTask}
                updateField={updateField}
              />
            )}

            <AuditLog log={selected.auditLog} />
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div onClick={resetForm} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", justifyContent: "center", alignItems: "center", padding: 20, zIndex: 999,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", width: "100%", maxWidth: 480, borderRadius: 26, padding: 28,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D", marginBottom: 22 }}>
              {editingId ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
            </div>

            {/* แสดงผู้บันทึก */}
            <div style={{
              background: "#F0FDF4", borderRadius: 12, padding: "10px 14px", marginBottom: 18,
              fontSize: 13, color: "#15803D", fontWeight: 600,
            }}>
              👤 บันทึกโดย: {user.displayName || user.name} · รหัส {user.displayEmpId || user.empId}
            </div>

            <input placeholder="HN" value={form.hn} onChange={e => setForm({ ...form, hn: e.target.value })} style={inputStyle} />
            <input placeholder="ชื่อ - นามสกุล" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} style={inputStyle} />
            <input placeholder="ห้อง" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={inputStyle} />
            <label style={{ display: "flex", gap: 10, marginBottom: 14, fontWeight: 600, alignItems: "center" }}>
              <input type="checkbox" checked={form.returnDrug} onChange={e => setForm({ ...form, returnDrug: e.target.checked })} />
              Return IPD Drug
            </label>
            {form.returnDrug && (
              <select value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })} style={inputStyle}>
                <option>ทางกระสวย</option>
                <option>ลิฟต์</option>
              </select>
            )}
            <label style={{ display: "flex", gap: 10, marginBottom: 22, fontWeight: 600, alignItems: "center" }}>
              <input type="checkbox" checked={form.doctorOrder} onChange={e => setForm({ ...form, doctorOrder: e.target.checked })} />
              Doctor Order Complete
            </label>
            <button onClick={handleSave} style={{
              width: "100%", padding: 14, border: "none", borderRadius: 16,
              background: "linear-gradient(90deg,#15803D,#22C55E)",
              color: "#fff", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Sarabun', sans-serif", fontSize: 16,
            }}>{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <MainDashboard user={user} onLogout={() => setUser(null)} />;
}