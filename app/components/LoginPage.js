"use client";
import { useState } from "react";

const USERS = [
  { username: "pharmacist1", password: "pharma123", role: "pharmacist", name: "ภก. สมศักดิ์ ดีมาก" },
  { username: "pharmacist2", password: "pharma456", role: "pharmacist", name: "ภญ. วรรณา รักษ์ยา" },
  { username: "ward_surg", password: "ward123", role: "nurse", name: "พย. สมหญิง วงษ์ดี", ward: "Ward ศัลยกรรม 3" },
  { username: "ward_med", password: "ward456", role: "nurse", name: "พย. วิภา รักงาน", ward: "Ward อายุรกรรม 1" },
  { username: "ward_ped", password: "ward789", role: "nurse", name: "พย. ปิยะ สุขใจ", ward: "Ward กุมารเวช" },
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username.trim() && u.password === password);
      if (user) { onLogin(user); } else { setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F3460", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>เข้าสู่ระบบ PharmAlert</div>
        <form onSubmit={handleSubmit}>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้" required style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, boxSizing: "border-box", marginBottom: 14, display: "block" }} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="รหัสผ่าน" required style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, boxSizing: "border-box", marginBottom: 14, display: "block" }} />
          {error && <div style={{ color: "red", marginBottom: 10, fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#0F3460", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}