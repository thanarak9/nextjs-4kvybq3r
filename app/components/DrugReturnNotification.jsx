"use client";
import { useState } from "react";

const mockData = [
  { id: 1, hn: "HN 0012345", patientName: "นายสมชาย ใจดี", initials: "สม", ward: "Ward ศัลยกรรม 3", room: "ห้อง 302", bed: "เตียง A", drug: "Amoxicillin 500 mg capsule", qty: "12 แคปซูล", lot: "AMX-2025-04", expire: "12/2026", nurse: "พย. สมหญิง วงษ์ดี", time: "09:35", status: "pending", isNew: true },
  { id: 2, hn: "HN 0098712", patientName: "นางวิภา รักสุขภาพ", initials: "วิ", ward: "Ward อายุรกรรม 1", room: "ห้อง 115", bed: "เตียง B", drug: "Metformin 500 mg tablet", qty: "30 เม็ด", lot: "MFM-2024-11", expire: "06/2026", nurse: "พย. วิภา รักงาน", time: "08:50", status: "checking", isNew: false },
  { id: 3, hn: "HN 0054321", patientName: "ด.ช.ปิยะ มีสุข", initials: "ปิ", ward: "Ward กุมารเวช", room: "ห้อง 210", bed: "เตียง C", drug: "Paracetamol syrup 250 mg/5 mL", qty: "2 ขวด (120 mL)", lot: "-", expire: "-", nurse: "พย. ปิยะ สุขใจ", time: "08:10", status: "received", isNew: false },
  { id: 4, hn: "HN 0031188", patientName: "นางสาวรัตนา พงษ์ดี", initials: "รต", ward: "Ward สูติกรรม", room: "ห้อง 408", bed: "เตียง D", drug: "Folic acid 5 mg tablet", qty: "60 เม็ด", lot: "FOL-2025-02", expire: "03/2027", nurse: "พย. รัตนา ดูแลดี", time: "07:55", status: "pending", isNew: true },
];

const statusConfig = {
  pending:  { label: "รอตรวจรับ", bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  checking: { label: "กำลังตรวจ", bg: "#FFEDD5", color: "#9A3412", border: "#FDBA74" },
  received: { label: "รับแล้ว",   bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
};

const avatarColors = [
  { bg: "#EFF6FF", color: "#1D4ED8" },
  { bg: "#FEF9C3", color: "#854D0E" },
  { bg: "#F0FDF4", color: "#166534" },
  { bg: "#FDF4FF", color: "#7E22CE" },
];

export default function DrugReturnNotification({ user, onLogout }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(mockData);

  const isPharmacist = user?.role === "pharmacist";
  const visibleData = isPharmacist ? data : data.filter((d) => d.ward === user?.ward);

  const filters = [
    { key: "all", label: "ทั้งหมด" },
    { key: "pending", label: "รอตรวจรับ" },
    { key: "checking", label: "กำลังตรวจ" },
    { key: "received", label: "รับแล้ว" },
  ];

  const filtered = filter === "all" ? visibleData : visibleData.filter((d) => d.status === filter);
  const counts = {
    new:      visibleData.filter((d) => d.isNew).length,
    pending:  visibleData.filter((d) => d.status === "pending").length,
    received: visibleData.filter((d) => d.status === "received").length,
    all:      visibleData.length,
  };

  function handleConfirm(id) {
    setData((prev) => prev.map((d) => d.id === id ? { ...d, status: "received", isNew: false } : d));
    setSelected(null);
  }
  function handleChecking(id) {
    setData((prev) => prev.map((d) => d.id === id ? { ...d, status: "checking", isNew: false } : d));
    setSelected(null);
  }

  const card = selected ? data.find((d) => d.id === selected) : null;

  return (
    <div style={{ fontFamily: "'Sarabun', sans-serif", minHeight: "100vh", background: "#F0F4F8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ background: "#0F3460", padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E94560", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>PharmAlert</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: isPharmacist ? "#E94560" : "#7C3AED", color: "#fff" }}>
              {isPharmacist ? "เภสัชกร" : "พยาบาล Ward"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#CBD5E1", fontSize: 13 }}>{user?.name}</span>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#CBD5E1", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Sarabun', sans-serif" }}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px" }}>
        {!isPharmacist && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#F5F3FF", borderRadius: 10, border: "1px solid #DDD6FE" }}>
            <span style={{ fontSize: 13, color: "#6D28D9", fontWeight: 500 }}>แสดงเฉพาะรายการของ {user?.ward}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "รายการใหม่",   value: counts.new,      color: "#3B82F6" },
            { label: "รอตรวจรับ",    value: counts.pending,  color: "#D97706" },
            { label: "รับแล้ววันนี้", value: counts.received, color: "#16A34A" },
            { label: "ทั้งหมดวันนี้", value: counts.all,      color: "#475569" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#fff", padding: "6px", borderRadius: 10, border: "1px solid #E2E8F0", width: "fit-content" }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: filter === f.key ? "#0F3460" : "transparent", color: filter === f.key ? "#fff" : "#64748B", fontFamily: "'Sarabun', sans-serif" }}>
              {f.label}
              {f.key !== "all" && (
                <span style={{ marginLeft: 6, fontSize: 11, background: filter === f.key ? "rgba(255,255,255,0.2)" : "#F1F5F9", color: filter === f.key ? "#fff" : "#94A3B8", padding: "1px 6px", borderRadius: 10 }}>
                  {visibleData.filter((d) => d.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>ไม่มีรายการ</div>
          )}
          {filtered.map((item, i) => {
            const av = avatarColors[i % avatarColors.length];
            const st = statusConfig[item.status];
            return (
              <div key={item.id} onClick={() => setSelected(item.id)} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${item.isNew ? "#BFDBFE" : "#E2E8F0"}`, padding: "14px 18px", cursor: "pointer", borderLeft: item.isNew ? "4px solid #3B82F6" : item.status === "checking" ? "4px solid #F59E0B" : "4px solid #E2E8F0" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: av.bg, color: av.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{item.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{item.patientName}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#94A3B8" }}>{item.hn}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#94A3B8", flexShrink: 0 }}>{item.time} น.</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>{item.ward}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20, background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" }}>{item.room} · {item.bed}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{item.drug}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{item.qty} · {item.nurse}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0, marginLeft: 8 }}>{st.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {card && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: "#0F3460", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>รายละเอียดยาส่งคืน</span>
              <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13, fontFamily: "'Sarabun', sans-serif" }}>ปิด</button>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EFF6FF", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600 }}>{card.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#0F172A" }}>{card.patientName}</div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>{card.hn}</div>
                </div>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>ที่อยู่</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>{card.ward}</span>
                  <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE" }}>{card.room} · {card.bed}</span>
                </div>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>ข้อมูลยา</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A", marginBottom: 10 }}>{card.drug}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ label: "จำนวน", value: card.qty }, { label: "Lot number", value: card.lot }, { label: "วันหมดอายุ", value: card.expire }, { label: "ผู้ส่ง", value: card.nurse }, { label: "เวลาแจ้ง", value: card.time + " น." }].map((r) => (
                    <div key={r.label}>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {isPharmacist && card.status !== "received" && (
                <div style={{ display: "flex", gap: 10 }}>
                  {card.status === "pending" && (
                    <button onClick={() => handleChecking(card.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Sarabun', sans-serif" }}>เริ่มตรวจรับ</button>
                  )}
                  <button onClick={() => handleConfirm(card.id)} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "#0F3460", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sarabun', sans-serif" }}>ยืนยันรับยา</button>
                </div>
              )}
              {!isPharmacist && card.status !== "received" && (
                <div style={{ textAlign: "center", padding: "10px", background: "#FEF9C3", borderRadius: 10, color: "#854D0E", fontSize: 13 }}>รอเภสัชกรตรวจรับ</div>
              )}
              {card.status === "received" && (
                <div style={{ textAlign: "center", padding: "10px", background: "#F0FDF4", borderRadius: 10, color: "#166534", fontSize: 14, fontWeight: 500 }}>✓ รับยาเรียบร้อยแล้ว</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
