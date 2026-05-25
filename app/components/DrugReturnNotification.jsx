"use client";
import { useState } from "react";

const mockData = [
  {
    id: 1,
    ward: "ICU",
    hn: "65001234",
    patientName: "นายสมชาย ใจดี",
    room: "ICU-01",

    returnDrug: true,
    returnType: "ทางกระสวย",

    doctorOrder: false,

    homeMedication: false,

    createdAt: "25/05/2026 09:35",
    updatedAt: "-",
    updatedBy: "-",
  },
];

export default function DrugReturnNotification({
  user,
}) {
  const [selected, setSelected] = useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [data, setData] = useState(mockData);

  const [form, setForm] = useState({
    hn: "",
    patientName: "",
    room: "",

    returnDrug: false,
    returnType: "ทางกระสวย",

    doctorOrder: false,
  });

  const visibleData =
    user?.role === "pharmacist"
      ? data
      : data.filter(
          (item) => item.ward === user?.ward
        );

  function getCurrentTime() {
    return new Date().toLocaleString("th-TH");
  }

  // SAVE
  function handleSave() {
    // EDIT
    if (editingId) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
                updatedAt:
                  getCurrentTime(),
                updatedBy:
                  user?.name,
              }
            : item
        )
      );

      resetForm();
      return;
    }

    // CHECK DUPLICATE
    const exists = data.find(
      (d) => d.hn === form.hn
    );

    if (exists) {
      alert("HN นี้มีอยู่แล้ว");
      return;
    }

    // ADD NEW
    const newItem = {
      id: Date.now(),
      ward: user?.ward,

      hn: form.hn,
      patientName: form.patientName,
      room: form.room,

      returnDrug: form.returnDrug,
      returnType: form.returnType,

      doctorOrder: form.doctorOrder,

      homeMedication: false,

      createdAt: getCurrentTime(),
      updatedAt: "-",
      updatedBy: "-",
    };

    setData([newItem, ...data]);

    resetForm();
  }

  function resetForm() {
    setForm({
      hn: "",
      patientName: "",
      room: "",

      returnDrug: false,
      returnType: "ทางกระสวย",

      doctorOrder: false,
    });

    setEditingId(null);
    setShowForm(false);
  }

  // EDIT
  function handleEdit(item) {
    setEditingId(item.id);

    setForm({
      hn: item.hn,
      patientName: item.patientName,
      room: item.room,

      returnDrug: item.returnDrug,
      returnType: item.returnType,

      doctorOrder: item.doctorOrder,
    });

    setShowForm(true);
  }

  // PHARM UPDATE
  function updateTask(key) {
    if (user?.role !== "pharmacist")
      return;

    setData((prev) =>
      prev.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              [key]: !item[key],
              updatedAt:
                getCurrentTime(),
              updatedBy:
                user?.name,
            }
          : item
      )
    );

    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
      updatedAt: getCurrentTime(),
      updatedBy: user?.name,
    }));
  }

  return (
    <div
      style={{
        fontFamily:
          "'Sarabun', sans-serif",
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right,#ECFDF5,#F0FDF4,#DCFCE7)",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* HEADER */}
      <div
        style={{
          background:
            "linear-gradient(90deg,#065F46,#16A34A)",
          padding: "18px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              Nakornthon Pharmacy
            </div>

            <div
              style={{
                color: "#DCFCE7",
                fontSize: 13,
              }}
            >
              Return Workflow Dashboard
            </div>
          </div>

          <div
            style={{
              background:
                "rgba(255,255,255,0.15)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 14,
            }}
          >
            {user?.role === "pharmacist"
              ? "Pharmacist"
              : user?.ward}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: 24,
        }}
      >
        {/* ADD BUTTON */}
        {user?.role === "nurse" && (
          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() =>
                setShowForm(true)
              }
              style={{
                padding: "14px 20px",
                border: "none",
                borderRadius: 18,
                background:
                  "linear-gradient(90deg,#15803D,#22C55E)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + เพิ่มรายการ
            </button>
          </div>
        )}

        {/* LIST */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {visibleData.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: 22,
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  flexWrap: "wrap",
                  gap: 20,
                }}
              >
                <div
                  onClick={() =>
                    setSelected(item)
                  }
                  style={{
                    flex: 1,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                    }}
                  >
                    {item.patientName}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#64748B",
                    }}
                  >
                    HN : {item.hn}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#64748B",
                    }}
                  >
                    {item.ward} · ห้อง{" "}
                    {item.room}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge
                      active={
                        item.returnDrug
                      }
                      text={
                        item.returnDrug
                          ? `Return (${item.returnType})`
                          : "Return"
                      }
                    />

                    <Badge
                      active={
                        item.doctorOrder
                      }
                      text="Doctor Order"
                    />

                    {user?.role ===
                      "pharmacist" && (
                      <Badge
                        active={
                          item.homeMedication
                        }
                        text="HomeMedication"
                      />
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: "#94A3B8",
                    }}
                  >
                    Updated :
                    {" " + item.updatedAt}
                  </div>
                </div>

                {/* EDIT BUTTON */}
                {user?.role === "nurse" && (
                  <button
                    onClick={() =>
                      handleEdit(item)
                    }
                    style={{
                      height: 44,
                      padding:
                        "0 18px",
                      border: "none",
                      borderRadius: 14,
                      background:
                        "#E0F2FE",
                      color: "#0369A1",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    แก้ไข
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL */}
      {selected && (
        <div
          onClick={() =>
            setSelected(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 28,
              padding: 28,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#15803D",
                marginBottom: 20,
              }}
            >
              รายละเอียดรายการ
            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >
              <b>HN :</b>{" "}
              {selected.hn}
            </div>

            <div
              style={{
                marginBottom: 10,
              }}
            >
              <b>ชื่อ :</b>{" "}
              {selected.patientName}
            </div>

            <div
              style={{
                marginBottom: 20,
              }}
            >
              <b>ห้อง :</b>{" "}
              {selected.room}
            </div>

            {/* PHARM ONLY */}
            {user?.role ===
              "pharmacist" && (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <TaskButton
                  active={
                    selected.returnDrug
                  }
                  text={`Return IPD (${selected.returnType})`}
                  onClick={() =>
                    updateTask(
                      "returnDrug"
                    )
                  }
                />

                <TaskButton
                  active={
                    selected.doctorOrder
                  }
                  text="Doctor Order Complete"
                  onClick={() =>
                    updateTask(
                      "doctorOrder"
                    )
                  }
                />

                <TaskButton
                  active={
                    selected.homeMedication
                  }
                  text="Homemedication Complete"
                  onClick={() =>
                    updateTask(
                      "homeMedication"
                    )
                  }
                />
              </div>
            )}

            <button
              onClick={() =>
                setSelected(null)
              }
              style={{
                width: "100%",
                padding: 14,
                border: "none",
                borderRadius: 18,
                background:
                  "linear-gradient(90deg,#15803D,#22C55E)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div
          onClick={resetForm}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 28,
              padding: 28,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#15803D",
                marginBottom: 24,
              }}
            >
              {editingId
                ? "แก้ไขรายการ"
                : "เพิ่มรายการใหม่"}
            </div>

            <input
              placeholder="HN"
              value={form.hn}
              onChange={(e) =>
                setForm({
                  ...form,
                  hn: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="ชื่อ - นามสกุล"
              value={form.patientName}
              onChange={(e) =>
                setForm({
                  ...form,
                  patientName:
                    e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              placeholder="ห้อง"
              value={form.room}
              onChange={(e) =>
                setForm({
                  ...form,
                  room: e.target.value,
                })
              }
              style={inputStyle}
            />

            {/* RETURN */}
            <label
              style={labelStyle}
            >
              <input
                type="checkbox"
                checked={
                  form.returnDrug
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    returnDrug:
                      e.target.checked,
                  })
                }
              />
              Return IPD Drug
            </label>

            {form.returnDrug && (
              <select
                value={form.returnType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    returnType:
                      e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option>
                  ทางกระสวย
                </option>

                <option>
                  ลิฟต์
                </option>
              </select>
            )}

            {/* DOCTOR */}
            <label
              style={labelStyle}
            >
              <input
                type="checkbox"
                checked={
                  form.doctorOrder
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    doctorOrder:
                      e.target.checked,
                  })
                }
              />
              Doctor Order Complete
            </label>

            <button
              onClick={handleSave}
              style={{
                width: "100%",
                padding: 14,
                border: "none",
                borderRadius: 18,
                background:
                  "linear-gradient(90deg,#15803D,#22C55E)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {editingId
                ? "บันทึกการแก้ไข"
                : "บันทึกข้อมูล"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({
  active,
  text,
}) {
  return (
    <div
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: active
          ? "#DCFCE7"
          : "#E5E7EB",
        color: active
          ? "#15803D"
          : "#6B7280",
      }}
    >
      {text}
    </div>
  );
}

function TaskButton({
  active,
  text,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 14,
        border: "none",
        borderRadius: 14,
        background: active
          ? "#15803D"
          : "#E5E7EB",
        color: active
          ? "#fff"
          : "#374151",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  padding: 14,
  marginBottom: 16,
  borderRadius: 14,
  border: "1px solid #D1D5DB",
};

const labelStyle = {
  display: "flex",
  gap: 10,
  marginBottom: 14,
  fontWeight: 600,
};