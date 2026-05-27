"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection, doc,
  onSnapshot, addDoc, updateDoc,
  query, orderBy
} from "firebase/firestore";

// ─── CONSTANTS ────────────────────────────────────────────────
const WARD_LIST = ["ICU", "CCU", "5", "6A", "6B", "7", "8", "9", "10", "12", "NSY"];
const CREDENTIALS = [
  { username: "nurse", password: "1234", role: "nurse" },
  { username: "pharm", password: "1234", role: "pharmacist" },
];
const USERS = [
  { id: 1, name: "นางสาวมาลี สุขใจ", empId: "N001", role: "nurse", ward: "ICU" },
  { id: 2, name: "นายวิชัย รักดี", empId: "N002", role: "nurse", ward: "Ward 4A" },
  { id: 3, name: "ภก.สมหมาย ใจดี", empId: "P001", role: "pharmacist", ward: null },
];

// ─── HELPERS ──────────────────────────────────────────────────
function getCurrentTime() {
  return new Date().toLocaleString("th-TH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getProgress(item) {
  let done = 0;
  if (item.genDrug === true || item._genAnswered) done++;
  if (item.genApprove === true || item._approveAnswered) done++;
  if (item.wardScan) done++;
  if (item.keyOrder) done++;
  if (item.prepareDrug) done++;
  if (item.checkHM) done++;
  if (item.returnReceive) done++;
  if (item.returnKey) done++;
  if (item.returnCheck) done++;
  if (item.pharmacistDispense) done++;
  if (item.approveTakeHome) done++;
  return Math.round((done / 11) * 100);
}

function getStatus(item) {
  if (item.approveTakeHome && item.transport) return { label: "สำเร็จ", color: "#059669", bg: "#D1FAE5", dot: "#10B981" };
  if (item.genApprove) return { label: "กำลังดำเนินการ", color: "#D97706", bg: "#FEF3C7", dot: "#F59E0B" };
  if (item.genDrug) return { label: "Gen Drug", color: "#2563EB", bg: "#DBEAFE", dot: "#3B82F6" };
  return { label: "รอดำเนินการ", color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" };
}

function getStuckHours(item) {
  if (!item.createdAt || item.approveTakeHome) return 0;
  try {
    const [datePart, timePart] = item.createdAt.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hour, min] = timePart.split(":");
    const created = new Date(parseInt(year) - 543, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return Math.round(diff * 10) / 10;
  } catch { return 0; }
}

// ─── CSS-IN-JS GLOBALS ────────────────────────────────────────
const G = {
  primary: "#065F46",
  primaryLight: "#059669",
  accent: "#10B981",
  accentSoft: "#D1FAE5",
  bg: "#F0FDF4",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  textMuted: "#6B7280",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  shadow: "0 4px 24px rgba(6,95,70,0.08)",
  shadowHover: "0 8px 32px rgba(6,95,70,0.14)",
  radius: 16,
  radiusSm: 10,
  radiusLg: 24,
};

// ══════════════════════════════════════════════════════════════
// EXPORT UTILS
// ══════════════════════════════════════════════════════════════
function exportToCSV(data) {
  const headers = ["ชื่อผู้ป่วย", "HN", "Ward", "ห้อง", "สถานะ", "ความคืบหน้า(%)", "สร้างเมื่อ", "อัปเดตล่าสุด", "อัปเดตโดย"];
  const rows = data.map(item => {
    const status = getStatus(item);
    const progress = getProgress(item);
    return [
      item.patientName, item.hn, item.ward, item.room,
      status.label, progress,
      item.createdAt, item.updatedAt, item.updatedBy
    ].map(v => `"${v}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharmacy_report_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToPrint(data) {
  const rows = data.map(item => {
    const status = getStatus(item);
    const progress = getProgress(item);
    const stuck = getStuckHours(item);
    return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:10px 12px;font-weight:600">${item.patientName}</td>
        <td style="padding:10px 12px;color:#6b7280">${item.hn}</td>
        <td style="padding:10px 12px">${item.ward}</td>
        <td style="padding:10px 12px">${item.room}</td>
        <td style="padding:10px 12px">
          <span style="background:${status.bg};color:${status.color};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700">${status.label}</span>
        </td>
        <td style="padding:10px 12px;font-weight:700;color:${progress===100?"#059669":progress>50?"#d97706":"#3b82f6"}">${progress}%</td>
        <td style="padding:10px 12px;color:${stuck>2?"#ef4444":"#6b7280"}">${stuck > 0 ? stuck + " ชม." : "-"}</td>
        <td style="padding:10px 12px;color:#6b7280;font-size:12px">${item.createdAt}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Pharmacy Report</title>
    <style>
      body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 24px; color: #111827; }
      h1 { color: #065F46; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #065F46; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
      tr:nth-child(even) { background: #f9fafb; }
      @media print { body { padding: 0; } }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    </head><body>
    <h1>🏥 Nakornthon Pharmacy Report</h1>
    <div style="color:#6b7280;font-size:13px">พิมพ์เมื่อ: ${getCurrentTime()} · รายการทั้งหมด: ${data.length}</div>
    <table>
      <thead><tr>
        <th>ชื่อผู้ป่วย</th><th>HN</th><th>Ward</th><th>ห้อง</th>
        <th>สถานะ</th><th>ความคืบหน้า</th><th>ค้างมา</th><th>สร้างเมื่อ</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>
  `;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

// ══════════════════════════════════════════════════════════════
// MINI CHART (SVG bar chart)
// ══════════════════════════════════════════════════════════════
function MiniBarChart({ data, label, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: G.textMuted, minWidth: 60, textAlign: "right" }}>{d.label}</div>
          <div style={{ flex: 1, height: 20, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: color,
              width: `${(d.value / max) * 100}%`,
              transition: "width 0.8s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6,
            }}>
              {d.value > 0 && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{d.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STAT DASHBOARD — upgraded with charts
// ══════════════════════════════════════════════════════════════
function StatDashboard({ data, onExportCSV, onExportPrint }) {
  const total = data.length;
  const complete = data.filter(d => d.approveTakeHome && d.transport).length;
  const inProgress = data.filter(d => d.genDrug && !(d.approveTakeHome && d.transport)).length;
  const pending = data.filter(d => !d.genDrug).length;
  const stuck = data.filter(d => getStuckHours(d) >= 2 && !d.approveTakeHome).length;

  const wardCounts = {};
  data.forEach(d => { wardCounts[d.ward] = (wardCounts[d.ward] || 0) + 1; });
  const wardData = Object.entries(wardCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const progressBuckets = [
    { label: "0–25%", value: data.filter(d => getProgress(d) <= 25).length },
    { label: "26–50%", value: data.filter(d => getProgress(d) > 25 && getProgress(d) <= 50).length },
    { label: "51–75%", value: data.filter(d => getProgress(d) > 50 && getProgress(d) <= 75).length },
    { label: "76–99%", value: data.filter(d => getProgress(d) > 75 && getProgress(d) < 100).length },
    { label: "100%", value: data.filter(d => getProgress(d) === 100).length },
  ];

  const cards = [
    { label: "ทั้งหมด", value: total, color: G.info, icon: "📋" },
    { label: "สำเร็จ", value: complete, color: G.primaryLight, icon: "✅" },
    { label: "ดำเนินการ", value: inProgress, color: G.warning, icon: "⏳" },
    { label: "รอดำเนินการ", value: pending, color: G.textMuted, icon: "🕐" },
    { label: "ค้างนาน ≥2ชม", value: stuck, color: G.danger, icon: "🚨" },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: G.card, borderRadius: G.radius, padding: "14px 16px", boxShadow: G.shadow, borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: G.textMuted, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: G.card, borderRadius: G.radius, padding: "16px 18px", boxShadow: G.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.primary, marginBottom: 12 }}>📊 รายการแยกตาม Ward</div>
          <MiniBarChart data={wardData} color={G.primaryLight} />
        </div>
        <div style={{ background: G.card, borderRadius: G.radius, padding: "16px 18px", boxShadow: G.shadow }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: G.primary, marginBottom: 12 }}>📈 ความคืบหน้า</div>
          <MiniBarChart data={progressBuckets} color={G.info} />
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onExportCSV} style={{ padding: "10px 18px", borderRadius: G.radiusSm, border: `1.5px solid ${G.primary}`, background: "transparent", color: G.primary, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          📥 Export CSV
        </button>
        <button onClick={onExportPrint} style={{ padding: "10px 18px", borderRadius: G.radiusSm, border: `1.5px solid ${G.info}`, background: "transparent", color: G.info, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          🖨️ พิมพ์รายงาน
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STUCK ALERT BANNER
// ══════════════════════════════════════════════════════════════
function StuckAlertBanner({ data }) {
  const stuckItems = data.filter(d => getStuckHours(d) >= 2 && !d.approveTakeHome);
  if (stuckItems.length === 0) return null;
  return (
    <div style={{ background: "#FEF2F2", border: `1.5px solid #FECACA`, borderRadius: G.radius, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>🚨</div>
      <div>
        <div style={{ fontWeight: 700, color: G.danger, fontSize: 14, marginBottom: 4 }}>มีรายการค้างนานเกิน 2 ชั่วโมง ({stuckItems.length} รายการ)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {stuckItems.map(item => (
            <span key={item.id} style={{ background: "#FEE2E2", color: G.danger, borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
              {item.patientName} · {getStuckHours(item)} ชม.
            </span>
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
  const stuckAlerts = data.filter(d => getStuckHours(d) >= 2 && !d.approveTakeHome);
  const allAlerts = [...alerts.map(a => ({ ...a, type: "wardScan" })), ...stuckAlerts.map(a => ({ ...a, type: "stuck" }))];
  const unread = allAlerts.length;

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, width: 40, height: 40, cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && <div style={{ position: "absolute", top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 99, background: G.danger, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread}</div>}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 48, width: 320, background: G.card, borderRadius: G.radius, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${G.border}`, fontWeight: 700, color: G.primary, display: "flex", justifyContent: "space-between" }}>
            <span>การแจ้งเตือน</span>
            {unread > 0 && <span style={{ background: G.danger, color: "#fff", borderRadius: 99, padding: "2px 8px", fontSize: 12 }}>{unread}</span>}
          </div>
          {allAlerts.length === 0 ? (
            <div style={{ padding: "24px 18px", color: G.textMuted, fontSize: 14, textAlign: "center" }}>✓ ไม่มีการแจ้งเตือน</div>
          ) : allAlerts.map((a, i) => (
            <div key={i} style={{ padding: "12px 18px", borderBottom: `1px solid ${G.border}`, background: i % 2 === 0 ? "#FAFAFA" : "#fff" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.patientName}</div>
              {a.type === "wardScan" ? (
                <div style={{ fontSize: 12, color: G.warning, marginTop: 2 }}>⚠️ Approved แล้ว รอ Ward Scan</div>
              ) : (
                <div style={{ fontSize: 12, color: G.danger, marginTop: 2 }}>🚨 ค้างมา {getStuckHours(a)} ชั่วโมง</div>
              )}
              <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{a.ward} · ห้อง {a.room}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// UI ATOMS
// ══════════════════════════════════════════════════════════════
function ProgressBar({ value }) {
  const color = value === 100 ? G.primaryLight : value > 50 ? G.warning : G.info;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: G.textMuted }}>ความคืบหน้า</span>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#E5E7EB" }}>
        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${color}CC,${color})`, width: `${value}%`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function StatusBadge({ active, text }) {
  return (
    <div style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: active ? G.accentSoft : "#F3F4F6", color: active ? G.primary : G.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
      {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent, display: "inline-block" }} />}
      {text}
    </div>
  );
}

function TaskButton({ active, text, onClick, time, disabled }) {
  return (
    <div>
      <button onClick={disabled ? undefined : onClick} style={{
        width: "100%", padding: "12px 14px", border: "none", borderRadius: G.radiusSm,
        background: active ? `linear-gradient(135deg,${G.primary},${G.primaryLight})` : disabled ? "#F9FAFB" : "#F3F4F6",
        color: active ? "#fff" : disabled ? "#CBD5E1" : G.text,
        fontWeight: 700, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Sarabun',sans-serif", fontSize: 14,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: active ? "0 4px 12px rgba(6,95,70,0.25)" : "none",
        transition: "all 0.2s",
      }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          border: active ? "none" : `2px solid ${disabled ? "#E5E7EB" : "#D1D5DB"}`,
          background: active ? "rgba(255,255,255,0.25)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900,
        }}>{active ? "✓" : ""}</span>
        {text}
      </button>
      {active && time && (
        <div style={{ marginTop: 4, marginLeft: 10, fontSize: 11, color: G.primaryLight, fontWeight: 600 }}>🕐 {time}</div>
      )}
    </div>
  );
}

function Section({ title, children, locked, lockMsg }) {
  return (
    <div style={{
      background: locked ? "#FAFAFA" : G.card, padding: 16, borderRadius: G.radius, marginBottom: 10,
      opacity: locked ? 0.55 : 1, border: locked ? `1.5px dashed ${G.border}` : `1px solid ${G.border}`,
    }}>
      <div style={{ fontWeight: 700, marginBottom: locked ? 6 : 12, color: locked ? G.textMuted : G.primary, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
        {locked ? "🔒" : "▸"} {title}
      </div>
      {locked ? <div style={{ fontSize: 13, color: G.textMuted }}>{lockMsg}</div> : <div style={{ display: "grid", gap: 8 }}>{children}</div>}
    </div>
  );
}

function AuditLog({ log }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: G.primary, marginBottom: 10 }}>📋 ประวัติการแก้ไข</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
        {(log || []).slice().reverse().map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: i % 2 === 0 ? "#F8FAFC" : "#fff", borderRadius: 8, fontSize: 12 }}>
            <div style={{ color: G.textMuted, minWidth: 120, flexShrink: 0 }}>{entry.time}</div>
            <div style={{ color: G.text }}><span style={{ fontWeight: 600 }}>{entry.user}</span> · {entry.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WORKFLOW DETAIL
// ══════════════════════════════════════════════════════════════
function WorkflowDetail({ selected, user, updateTask, updateField }) {
  const [newDrugText, setNewDrugText] = useState("");
  const genAnswered = selected.genDrug === true || selected._genAnswered || selected.genApprove === true || selected._approveAnswered;
  const hmComplete = selected.wardScan && selected.keyOrder && selected.prepareDrug && selected.checkHM;
  const returnComplete = selected.returnReceive && selected.returnKey && selected.returnCheck;
  const canComplete = hmComplete && returnComplete;

  function addPendingDrug() {
    if (!newDrugText.trim()) return;
    const updated = [...(selected.pendingKeyDrugs || []), { id: Date.now(), name: newDrugText.trim(), done: false, doneTime: "", pharmacistDispensed: false }];
    updateField({ pendingKeyDrugs: updated }, `เพิ่มยารอ Key: ${newDrugText.trim()}`);
    setNewDrugText("");
  }

  function removePendingDrug(id) {
    const drug = (selected.pendingKeyDrugs || []).find(d => d.id === id);
    updateField({ pendingKeyDrugs: (selected.pendingKeyDrugs || []).filter(d => d.id !== id) }, `ลบยารอ Key: ${drug?.name || ""}`);
  }

  function toggleDrugDone(id) {
    const now = getCurrentTime();
    const drug = (selected.pendingKeyDrugs || []).find(d => d.id === id);
    const updated = (selected.pendingKeyDrugs || []).map(d => d.id === id ? { ...d, done: !d.done, doneTime: !d.done ? now : "" } : d);
    updateField({ pendingKeyDrugs: updated }, `${!drug?.done ? "✓ ทำเสร็จ" : "ยกเลิก"}: ${drug?.name || ""}`);
  }

  return (
    <div style={{ display: "grid", gap: 0 }}>
      <Section title="1. อยู่ในช่วง Gen ยาหรือไม่">
        <TaskButton active={selected.genDrug === true} text="✓ ใช่" time={selected.genDrugTime}
          onClick={() => { const now = getCurrentTime(); updateField({ genDrug: true, genDrugTime: now, genApprove: false, genApproveTime: "", deleteGenDrug: false, deleteGenDrugTime: "", deleteGenDrug2: false, deleteGenDrug2Time: "", genLocation: "" }, "เลือก: อยู่ในช่วง Gen ยา"); }} />
        {selected.genDrug === true && (
          <div style={{ paddingLeft: 14, borderLeft: `3px solid ${G.accent}` }}>
            <TaskButton active={selected.deleteGenDrug} text="ลบยา Gen แล้ว" time={selected.deleteGenDrugTime} onClick={() => updateTask("deleteGenDrug", "ลบยา Gen แล้ว")} />
          </div>
        )}
        <TaskButton active={selected.genDrug === false && selected._genAnswered} text="✕ ไม่ใช่"
          onClick={() => updateField({ genDrug: false, genDrugTime: "", _genAnswered: true, deleteGenDrug: false, deleteGenDrugTime: "" }, "เลือก: ไม่อยู่ในช่วง Gen ยา")} />
      </Section>

      <Section title="2. ยา Gen Approve หรือยัง">
        <TaskButton active={selected.genApprove === true} text="✓ Approve แล้ว" time={selected.genApproveTime}
          onClick={() => { const now = getCurrentTime(); updateField({ genApprove: true, genApproveTime: now, deleteGenDrug2: false, deleteGenDrug2Time: "", genLocation: "" }, "ยา Gen Approve แล้ว"); }} />
        {selected.genApprove === true && (
          <div style={{ paddingLeft: 14, borderLeft: `3px solid ${G.accent}`, display: "grid", gap: 8 }}>
            <TaskButton active={selected.deleteGenDrug2} text="ลบยา Gen แล้ว" time={selected.deleteGenDrug2Time} onClick={() => updateTask("deleteGenDrug2", "ลบยา Gen แล้ว (หลัง Approve)")} />
            {selected.deleteGenDrug2 && (
              <div>
                <div style={{ fontSize: 13, color: G.text, fontWeight: 600, marginBottom: 8 }}>ยา Gen อยู่ที่ไหน?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["อยู่บน Ward", "อยู่ห้องยา"].map(loc => (
                    <button key={loc} onClick={() => updateField({ genLocation: loc }, `เลือกตำแหน่ง: ${loc}`)} style={{ padding: "10px 8px", borderRadius: G.radiusSm, border: `2px solid ${selected.genLocation === loc ? G.primary : G.border}`, background: selected.genLocation === loc ? G.accentSoft : "#fff", color: selected.genLocation === loc ? G.primary : G.text, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 13 }}>{selected.genLocation === loc ? "✓ " : ""}{loc}</button>
                  ))}
                </div>
                {selected.genLocation && <div style={{ marginTop: 6, fontSize: 12, color: G.primaryLight, fontWeight: 600 }}>📍 {selected.genLocation}</div>}
              </div>
            )}
          </div>
        )}
        <TaskButton active={selected.genApprove === false && selected._approveAnswered} text="✕ ยังไม่ Approve"
          onClick={() => updateField({ genApprove: false, genApproveTime: "", _approveAnswered: true, deleteGenDrug2: false, deleteGenDrug2Time: "", genLocation: "" }, "ยา Gen ยังไม่ Approve")} />
      </Section>

      <Section title="ยา HM" locked={!genAnswered} lockMsg="ต้องตอบข้อ 1 หรือข้อ 2 ก่อน">
        <TaskButton active={selected.wardScan} text="Ward Scan ใบยา" time={selected.wardScanTime} onClick={() => updateTask("wardScan", "Ward Scan ใบยา")} />
        <TaskButton active={selected.keyOrder} text="Key Order" time={selected.keyOrderTime} onClick={() => updateTask("keyOrder", "Key Order")} />
        <TaskButton active={selected.prepareDrug} text="จัดยา" time={selected.prepareDrugTime} onClick={() => updateTask("prepareDrug", "จัดยา")} />
        <TaskButton active={selected.checkHM} text="Check HM" time={selected.checkHMTime} onClick={() => updateTask("checkHM", "Check HM")} />

        {/* ยาที่รอ Key */}
        <div style={{ background: "#F8FAFC", borderRadius: G.radiusSm, padding: 12, border: `1px solid ${G.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: G.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            ยาที่รอ Key
            {(selected.pendingKeyDrugs || []).length > 0 && (
              <span style={{ background: (selected.pendingKeyDrugs || []).every(d => d.done) ? G.accentSoft : "#FEF3C7", color: (selected.pendingKeyDrugs || []).every(d => d.done) ? G.primary : G.warning, borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                {(selected.pendingKeyDrugs || []).filter(d => d.done).length}/{(selected.pendingKeyDrugs || []).length}
              </span>
            )}
          </div>
          {(selected.pendingKeyDrugs || []).map((drug, i) => (
            <div key={drug.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "8px 10px", borderRadius: 8, border: `1px solid ${drug.done ? G.accent : G.border}`, background: drug.done ? G.accentSoft : "#fff" }}>
              <button onClick={() => toggleDrugDone(drug.id)} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", border: `2px solid ${drug.done ? G.primary : "#D1D5DB"}`, background: drug.done ? G.primary : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{drug.done ? "✓" : ""}</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: drug.done ? G.primary : G.text, textDecoration: drug.done ? "line-through" : "none" }}><span style={{ color: G.warning, marginRight: 4 }}>{i + 1}.</span>{drug.name}</div>
                {drug.done && drug.doneTime && <div style={{ fontSize: 11, color: G.primaryLight }}>🕐 {drug.doneTime}</div>}
              </div>
              <button onClick={() => removePendingDrug(drug.id)} style={{ background: "none", border: "none", cursor: "pointer", color: G.danger, fontSize: 16 }}>✕</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input value={newDrugText} onChange={e => setNewDrugText(e.target.value)} onKeyDown={e => e.key === "Enter" && addPendingDrug()} placeholder="พิมพ์ชื่อยา..." style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${G.border}`, fontFamily: "'Sarabun',sans-serif", fontSize: 13, outline: "none" }} />
            <button onClick={addPendingDrug} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: G.primary, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Sarabun',sans-serif" }}>+ เพิ่ม</button>
          </div>
        </div>
        {genAnswered && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: hmComplete ? G.accentSoft : "#FEF3C7", color: hmComplete ? G.primary : G.warning, fontSize: 13, fontWeight: 600 }}>
            {hmComplete ? "✅ ยา HM ครบทุกขั้นตอน" : `⏳ ยังไม่ครบ (${[selected.wardScan, selected.keyOrder, selected.prepareDrug, selected.checkHM].filter(Boolean).length}/4)`}
          </div>
        )}
      </Section>

      <Section title="ยาคืน" locked={!genAnswered} lockMsg="ต้องตอบข้อ 1 หรือข้อ 2 ก่อน">
        <TaskButton active={selected.returnReceive} text="ได้รับยาคืน" time={selected.returnReceiveTime} onClick={() => updateTask("returnReceive", "ได้รับยาคืน")} />
        <TaskButton active={selected.returnKey} text="Key ยาคืนเสร็จ" time={selected.returnKeyTime} onClick={() => updateTask("returnKey", "Key ยาคืนเสร็จ")} />
        <TaskButton active={selected.returnCheck} text="Check คืน" time={selected.returnCheckTime} onClick={() => updateTask("returnCheck", "Check คืน")} />
        {genAnswered && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: returnComplete ? G.accentSoft : "#FEF3C7", color: returnComplete ? G.primary : G.warning, fontSize: 13, fontWeight: 600 }}>
            {returnComplete ? "✅ ยาคืนครบทุกขั้นตอน" : `⏳ ยังไม่ครบ (${[selected.returnReceive, selected.returnKey, selected.returnCheck].filter(Boolean).length}/3)`}
          </div>
        )}
      </Section>

      <Section title="Complete" locked={!canComplete} lockMsg="ต้องทำยา HM และยาคืนให้ครบก่อน">
        <TaskButton active={selected.approveTakeHome} text="Approve Drug Take Home" time={selected.approveTakeHomeTime} onClick={() => updateTask("approveTakeHome", "Approve Drug Take Home")} />
        {selected.approveTakeHome && (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 700, marginBottom: 6 }}>ส่งยาทาง</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["กระสวย", "ลิฟต์"].map(t => (
                  <button key={t} onClick={() => { const now = getCurrentTime(); updateField({ transport: t, transportTime: now }, `ส่งยาทาง ${t}`); }} style={{ padding: "12px 8px", borderRadius: G.radiusSm, border: `2px solid ${selected.transport === t ? G.primary : G.border}`, background: selected.transport === t ? G.accentSoft : "#fff", color: selected.transport === t ? G.primary : G.text, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 14 }}>{selected.transport === t ? "✓ " : ""}{t}</button>
                ))}
              </div>
              {selected.transport && <div style={{ marginTop: 6, fontSize: 12, color: G.primaryLight, fontWeight: 600 }}>🚀 ส่งทาง{selected.transport} · 🕐 {selected.transportTime}</div>}
            </div>
            <TaskButton active={selected.pharmacistDispense} text="เภสัชจ่ายยา" time={selected.pharmacistDispenseTime} onClick={() => updateTask("pharmacistDispense", "เภสัชจ่ายยา")} />
          </div>
        )}
      </Section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [detectedRole, setDetectedRole] = useState(null);
  const [selectedWard, setSelectedWard] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputEmpId, setInputEmpId] = useState("");

  function handleLogin() {
    const cred = CREDENTIALS.find(c => c.username === username.trim() && c.password === password.trim());
    if (!cred) { setLoginError("username หรือ password ไม่ถูกต้อง"); return; }
    setDetectedRole(cred.role);
    setLoginError("");
    cred.role === "pharmacist" ? setStep("info") : setStep("ward");
  }

  function handleInfoSubmit() {
    if (!inputName.trim() || !inputEmpId.trim()) return;
    const baseUser = USERS.find(u => u.role === detectedRole) || USERS[0];
    onLogin({ ...baseUser, role: detectedRole, ward: detectedRole === "nurse" ? selectedWard : null, displayName: inputName.trim(), displayEmpId: inputEmpId.trim() });
  }

  const inp = { width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", color: "#fff", fontFamily: "'Sarabun',sans-serif", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#022c22 0%,#064E3B 50%,#065F46 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Sarabun',sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Logo */}
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>💊</div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 26, marginBottom: 4, letterSpacing: "-0.5px" }}>Nakornthon Pharmacy</div>
      <div style={{ color: "#6EE7B7", fontSize: 13, marginBottom: 36 }}>Workflow Dashboard</div>

      {step === "login" && (
        <div style={{ width: "100%", maxWidth: 380 }}>
          <input placeholder="Username" value={username} onChange={e => { setUsername(e.target.value); setLoginError(""); }} style={inp} autoFocus />
          <input placeholder="Password" type="password" value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} style={inp} />
          {loginError && <div style={{ color: "#FCA5A5", fontSize: 13, marginBottom: 10, textAlign: "center" }}>{loginError}</div>}
          <button onClick={handleLogin} disabled={!username.trim() || !password.trim()} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: username && password ? "linear-gradient(90deg,#059669,#10B981)" : "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: username && password ? "pointer" : "not-allowed", fontFamily: "'Sarabun',sans-serif", boxShadow: username && password ? "0 4px 16px rgba(16,185,129,0.4)" : "none" }}>เข้าสู่ระบบ →</button>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16, textAlign: "center" }}>nurse / 1234 · pharm / 1234</div>
        </div>
      )}

      {step === "ward" && (
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ color: "#A7F3D0", fontSize: 14, marginBottom: 16, textAlign: "center", fontWeight: 700 }}>เลือก Ward ของคุณ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {WARD_LIST.map(ward => (
              <button key={ward} onClick={() => { setSelectedWard(ward); setStep("info"); }} style={{ padding: "14px 8px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              >{ward}</button>
            ))}
          </div>
          <div onClick={() => { setStep("login"); setDetectedRole(null); }} style={{ color: "#6EE7B7", fontSize: 13, marginTop: 16, textAlign: "center", cursor: "pointer" }}>← กลับ</div>
        </div>
      )}

      {step === "info" && (
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: detectedRole === "pharmacist" ? "#065F46" : "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{detectedRole === "pharmacist" ? "ภก" : "RN"}</div>
            <div style={{ color: "#6EE7B7", fontSize: 14, fontWeight: 600 }}>{detectedRole === "pharmacist" ? "เภสัชกร → ห้องยา" : `พยาบาล → Ward ${selectedWard}`}</div>
          </div>
          <input placeholder="ชื่อ-นามสกุล" value={inputName} onChange={e => setInputName(e.target.value)} style={inp} autoFocus />
          <input placeholder="เลขบัตรประจำตัว" value={inputEmpId} onChange={e => setInputEmpId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInfoSubmit()} style={inp} />
          <button onClick={handleInfoSubmit} disabled={!inputName.trim() || !inputEmpId.trim()} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: inputName && inputEmpId ? "linear-gradient(90deg,#059669,#10B981)" : "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: inputName && inputEmpId ? "pointer" : "not-allowed", fontFamily: "'Sarabun',sans-serif" }}>เข้าสู่ระบบ →</button>
          <div onClick={() => { detectedRole === "nurse" ? setStep("ward") : setStep("login"); }} style={{ color: "#6EE7B7", fontSize: 13, marginTop: 14, textAlign: "center", cursor: "pointer" }}>← กลับ</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function MainDashboard({ user, onLogout }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterWard, setFilterWard] = useState("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [showStats, setShowStats] = useState(false);
  const [form, setForm] = useState({ hn: "", patientName: "", room: "", returnDrug: false, returnType: "ทางกระสวย", doctorOrder: false });

  const userLabel = `${user.displayName || user.name} (${user.displayEmpId || user.empId})`;

  useEffect(() => {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
      setData(items);
      setLoading(false);
      setSelected(prev => prev ? (items.find(i => i.id === prev.id) || prev) : null);
    }, err => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const visibleData = (user.role === "pharmacist" ? data : data.filter(d => d.ward === user.ward))
    .filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.patientName?.toLowerCase().includes(q) || d.hn?.includes(q) || d.room?.toLowerCase().includes(q);
      const matchWard = filterWard === "ทั้งหมด" || d.ward === filterWard;
      const isComplete = d.approveTakeHome && d.transport;
      const matchStatus = filterStatus === "ทั้งหมด" ||
        (filterStatus === "สำเร็จ" && isComplete) ||
        (filterStatus === "กำลังดำเนินการ" && d.genDrug && !isComplete) ||
        (filterStatus === "รอดำเนินการ" && !d.genDrug && !isComplete) ||
        (filterStatus === "ค้างนาน" && getStuckHours(d) >= 2 && !d.approveTakeHome);
      return matchSearch && matchWard && matchStatus;
    });

  async function handleSave() {
    const now = getCurrentTime();
    if (editingId) {
      const item = data.find(d => d.id === editingId);
      if (!item) return;
      await updateDoc(doc(db, "patients", item._docId), { ...form, updatedAt: now, updatedBy: userLabel, auditLog: [...(item.auditLog || []), { time: now, user: userLabel, action: "แก้ไขข้อมูลผู้ป่วย" }] });
      resetForm(); return;
    }
    if (data.find(d => d.hn === form.hn)) { alert("HN นี้มีอยู่แล้ว"); return; }
    await addDoc(collection(db, "patients"), {
      id: Date.now(), ward: user.ward, ...form, createdAt: now, updatedAt: "-", updatedBy: "-",
      genDrug: false, genDrugTime: "", _genAnswered: false, deleteGenDrug: false, deleteGenDrugTime: "",
      genApprove: false, genApproveTime: "", _approveAnswered: false, deleteGenDrug2: false, deleteGenDrug2Time: "",
      genLocation: "", hmDrug: false, hmDrugTime: "", wardScan: false, wardScanTime: "",
      keyOrder: false, keyOrderTime: "", prepareDrug: false, prepareDrugTime: "", checkHM: false, checkHMTime: "",
      pendingKeyDrugs: [], returnReceive: false, returnReceiveTime: "", returnKey: false, returnKeyTime: "",
      returnCheck: false, returnCheckTime: "", completeAll: false, completeAllTime: "",
      approveTakeHome: false, approveTakeHomeTime: "", pharmacistDispense: false, pharmacistDispenseTime: "",
      transport: "", transportTime: "",
      auditLog: [{ time: now, user: userLabel, action: "สร้างรายการ" }],
    });
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

  async function updateTask(key, actionLabel) {
    const now = getCurrentTime();
    const item = data.find(d => d.id === selected.id);
    if (!item) return;
    const newVal = !item[key];
    const fields = { [key]: newVal, [`${key}Time`]: newVal ? now : "", updatedAt: now, updatedBy: userLabel, auditLog: [...(item.auditLog || []), { time: now, user: userLabel, action: (newVal ? "✓ " : "✗ ") + actionLabel }] };
    await updateDoc(doc(db, "patients", item._docId), fields);
    setSelected(prev => prev ? { ...prev, ...fields } : prev);
  }

  async function updateField(fields, actionLabel) {
    const now = getCurrentTime();
    const item = data.find(d => d.id === selected.id);
    if (!item) return;
    const updated = { ...fields, updatedAt: now, updatedBy: userLabel, auditLog: [...(item.auditLog || []), { time: now, user: userLabel, action: actionLabel }] };
    await updateDoc(doc(db, "patients", item._docId), updated);
    setSelected(prev => prev ? { ...prev, ...updated } : prev);
  }

  const inp = { width: "100%", padding: "11px 14px", marginBottom: 12, borderRadius: G.radiusSm, border: `1.5px solid ${G.border}`, fontFamily: "'Sarabun',sans-serif", fontSize: 14, boxSizing: "border-box", outline: "none" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: G.bg, fontFamily: "'Sarabun',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
      <div style={{ fontSize: 18, color: G.primary, fontWeight: 700 }}>กำลังโหลดข้อมูล...</div>
      <div style={{ fontSize: 13, color: G.textMuted, marginTop: 6 }}>เชื่อมต่อ Firebase Firestore</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif", minHeight: "100vh", background: G.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg,#022c22,${G.primary})`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24 }}>💊</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>Nakornthon Pharmacy</div>
              <div style={{ color: "#6EE7B7", fontSize: 11 }}>Workflow Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 20, padding: "4px 10px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
              <span style={{ color: "#6EE7B7", fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
            <NotificationBell data={data} />
            <button onClick={() => setShowStats(s => !s)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "7px 12px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Sarabun',sans-serif" }}>
              📊 {showStats ? "ซ่อน" : "สถิติ"}
            </button>
            <div style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "7px 12px", borderRadius: 10, fontSize: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
              👤 {(user.displayName || user.name).split(" ").slice(0, 2).join(" ")} · {user.role === "pharmacist" ? "เภสัชกร" : `Ward ${user.ward}`}
            </div>
            <button onClick={onLogout} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "7px 12px", color: "#FCA5A5", cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 12, fontWeight: 600 }}>ออก</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

        {/* STUCK ALERT */}
        <StuckAlertBanner data={user.role === "pharmacist" ? data : data.filter(d => d.ward === user.ward)} />

        {/* STATS */}
        {showStats && (
          <StatDashboard
            data={user.role === "pharmacist" ? data : data.filter(d => d.ward === user.ward)}
            onExportCSV={() => exportToCSV(visibleData)}
            onExportPrint={() => exportToPrint(visibleData)}
          />
        )}

        {/* SEARCH & FILTER */}
        <div style={{ background: G.card, borderRadius: G.radius, padding: 14, marginBottom: 16, boxShadow: G.shadow, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input placeholder="🔍 ค้นหาชื่อผู้ป่วย, HN, ห้อง..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, marginBottom: 0, flex: "1 1 200px", fontSize: 14 }} />
          {user.role === "pharmacist" && (
            <select value={filterWard} onChange={e => setFilterWard(e.target.value)} style={{ ...inp, marginBottom: 0, flex: "0 1 140px" }}>
              <option>ทั้งหมด</option>
              {WARD_LIST.map(w => <option key={w}>{w}</option>)}
            </select>
          )}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, marginBottom: 0, flex: "0 1 160px" }}>
            <option>ทั้งหมด</option>
            <option>รอดำเนินการ</option>
            <option>กำลังดำเนินการ</option>
            <option>สำเร็จ</option>
            <option>ค้างนาน</option>
          </select>
          <div style={{ fontSize: 12, color: G.textMuted, whiteSpace: "nowrap" }}>{visibleData.length} รายการ</div>
        </div>

        {/* ADD BUTTON */}
        {user.role === "nurse" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={() => setShowForm(true)} style={{ padding: "11px 22px", border: "none", borderRadius: G.radius, background: `linear-gradient(135deg,${G.primary},${G.primaryLight})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 14, boxShadow: "0 4px 16px rgba(6,95,70,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
              + เพิ่มรายการ
            </button>
          </div>
        )}

        {/* CARD LIST */}
        {visibleData.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: G.textMuted, fontSize: 15 }}>
            {data.length === 0 ? "ยังไม่มีรายการ กดเพิ่มรายการเพื่อเริ่มต้น" : "ไม่พบรายการที่ค้นหา"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleData.map(item => {
              const status = getStatus(item);
              const progress = getProgress(item);
              const stuck = getStuckHours(item);
              const isStuck = stuck >= 2 && !item.approveTakeHome;
              return (
                <div key={item.id} style={{ background: G.card, borderRadius: G.radius, padding: "16px 18px", boxShadow: isStuck ? "0 4px 20px rgba(239,68,68,0.12)" : G.shadow, borderLeft: `4px solid ${isStuck ? G.danger : status.color}`, transition: "box-shadow 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => setSelected(item)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: G.text }}>{item.patientName}</div>
                        <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: status.bg, color: status.color, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.dot, display: "inline-block" }} />
                          {status.label}
                        </div>
                        {isStuck && <div style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: G.danger }}>🚨 ค้าง {stuck} ชม.</div>}
                      </div>
                      <div style={{ color: G.textMuted, fontSize: 13, marginBottom: 6 }}>HN: {item.hn} · {item.ward} · ห้อง {item.room}</div>

                      {(item.pendingKeyDrugs || []).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                          {(item.pendingKeyDrugs || []).map(drug => (
                            <span key={drug.id} style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: drug.done ? G.accentSoft : "#FEF9C3", color: drug.done ? G.primary : G.warning, textDecoration: drug.done ? "line-through" : "none" }}>
                              {drug.done ? "✓ " : "⏳ "}{drug.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4 }}>
                        <StatusBadge active={item.returnDrug} text={item.returnDrug ? `Return (${item.returnType})` : "Return"} />
                        <StatusBadge active={item.doctorOrder} text="Doctor Order" />
                        {item.genDrug && <StatusBadge active text="Gen Drug" />}
                        {item.genApprove && <StatusBadge active text="Approved" />}
                        {item.approveTakeHome && <StatusBadge active text="✓ Complete" />}
                        {item.transport && <StatusBadge active text={`🚀 ${item.transport}`} />}
                      </div>
                      <ProgressBar value={progress} />
                      <div style={{ marginTop: 6, fontSize: 11, color: "#CBD5E1" }}>สร้าง: {item.createdAt}{item.updatedBy && item.updatedBy !== "-" && ` · อัปเดตโดย ${item.updatedBy}`}</div>
                    </div>
                    {user.role === "nurse" && (
                      <button onClick={() => handleEdit(item)} style={{ height: 36, padding: "0 14px", border: `1px solid ${G.info}`, borderRadius: 10, background: "#EFF6FF", color: G.info, fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 13, flexShrink: 0 }}>แก้ไข</button>
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
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: G.bg, width: "100%", maxWidth: 680, borderRadius: G.radiusLg, padding: 24, maxHeight: "92vh", overflow: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: G.text }}>{selected.patientName}</div>
                <div style={{ fontSize: 13, color: G.textMuted, marginTop: 2 }}>HN: {selected.hn} · {selected.ward} · ห้อง {selected.room}</div>
                {getStuckHours(selected) >= 2 && !selected.approveTakeHome && (
                  <div style={{ marginTop: 6, padding: "4px 10px", borderRadius: 8, background: "#FEE2E2", color: G.danger, fontSize: 12, fontWeight: 700, display: "inline-block" }}>🚨 ค้างมา {getStuckHours(selected)} ชั่วโมง</div>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#F1F5F9", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>
            <ProgressBar value={getProgress(selected)} />
            <div style={{ height: 16 }} />
            {user.role === "pharmacist" && <WorkflowDetail selected={selected} user={user} updateTask={updateTask} updateField={updateField} />}
            <AuditLog log={selected.auditLog} />
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div onClick={resetForm} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16, zIndex: 999, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: G.card, width: "100%", maxWidth: 460, borderRadius: G.radiusLg, padding: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: G.primary, marginBottom: 18 }}>{editingId ? "✏️ แก้ไขรายการ" : "➕ เพิ่มรายการใหม่"}</div>
            <div style={{ background: G.accentSoft, borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: G.primary, fontWeight: 600 }}>
              👤 {user.displayName || user.name} · {user.displayEmpId || user.empId} · Ward {user.ward}
            </div>
            <input placeholder="HN" value={form.hn} onChange={e => setForm({ ...form, hn: e.target.value })} style={inp} />
            <input placeholder="ชื่อ-นามสกุล" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} style={inp} />
            <input placeholder="ห้อง" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={inp} />
            <label style={{ display: "flex", gap: 8, marginBottom: 10, fontWeight: 600, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" checked={form.returnDrug} onChange={e => setForm({ ...form, returnDrug: e.target.checked })} />Return IPD Drug
            </label>
            {form.returnDrug && (
              <select value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })} style={inp}>
                <option>ทางกระสวย</option><option>ลิฟต์</option>
              </select>
            )}
            <label style={{ display: "flex", gap: 8, marginBottom: 20, fontWeight: 600, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" checked={form.doctorOrder} onChange={e => setForm({ ...form, doctorOrder: e.target.checked })} />Doctor Order Complete
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetForm} style={{ flex: 1, padding: 12, border: `1px solid ${G.border}`, borderRadius: G.radiusSm, background: "transparent", color: G.textMuted, fontWeight: 600, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 14 }}>ยกเลิก</button>
              <button onClick={handleSave} style={{ flex: 2, padding: 12, border: "none", borderRadius: G.radiusSm, background: `linear-gradient(135deg,${G.primary},${G.primaryLight})`, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "'Sarabun',sans-serif", fontSize: 14, boxShadow: "0 4px 12px rgba(6,95,70,0.3)" }}>{editingId ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════
export default function DrugReturnNotification({ user, onLogout }) {
  if (!user) return null;
  return <MainDashboard user={user} onLogout={onLogout} />;
}
