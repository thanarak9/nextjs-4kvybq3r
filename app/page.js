"use client";

import { useState } from "react";
import DrugReturnNotification from "./components/DrugReturnNotification";

export default function Home() {
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    ward: "ICU",
  });

  const [user, setUser] = useState(null);

  function handleLogin(e) {
    e.preventDefault();

    // PHARMACIST
    if (
      loginData.username === "pharm" &&
      loginData.password === "1234"
    ) {
      setUser({
        name: "Pharmacist",
        role: "pharmacist",
      });

      return;
    }

    // NURSE
    if (
      loginData.username === "nurse" &&
      loginData.password === "1234"
    ) {
      setUser({
        name: `Nurse ${loginData.ward}`,
        role: "nurse",
        ward: loginData.ward,
      });

      return;
    }

    alert("Username หรือ Password ไม่ถูกต้อง");
  }

  function handleLogout() {
    setUser(null);
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(to bottom right,#ECFDF5,#F0FDF4,#DCFCE7)",
          fontFamily: "'Sarabun', sans-serif",
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <form
          onSubmit={handleLogin}
          style={{
            background: "#fff",
            width: 380,
            padding: 36,
            borderRadius: 28,
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#15803D",
              }}
            >
              Nakornthon
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#0F172A",
                fontWeight: 600,
                fontSize: 18,
              }}
            >
              Pharmacy System
            </div>
          </div>

          <input
            placeholder="Username"
            value={loginData.username}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                username: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              border: "1px solid #D1D5DB",
              marginBottom: 14,
              fontSize: 14,
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                password: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              border: "1px solid #D1D5DB",
              marginBottom: 14,
              fontSize: 14,
              outline: "none",
            }}
          />

          <select
            value={loginData.ward}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                ward: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              border: "1px solid #D1D5DB",
              marginBottom: 20,
              fontSize: 14,
              outline: "none",
            }}
          >
            <option>ICU</option>
            <option>CCU</option>
            <option>W05</option>
            <option>W6A</option>
            <option>W6B</option>
            <option>NSY</option>
            <option>W07</option>
            <option>W08</option>
            <option>W09</option>
            <option>W10</option>
            <option>W12</option>
          </select>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 14,
              border: "none",
              borderRadius: 14,
              background:
                "linear-gradient(90deg,#15803D,#22C55E)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            เข้าสู่ระบบ
          </button>

          <div
            style={{
              marginTop: 20,
              background: "#F0FDF4",
              padding: 14,
              borderRadius: 14,
              fontSize: 13,
              color: "#166534",
            }}
          >
            <div>
              <b>Pharmacist</b>
            </div>
            user: pharm / pass: 1234

            <div style={{ marginTop: 10 }}>
              <b>Nurse</b>
            </div>
            user: nurse / pass: 1234
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 999,
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            padding: "12px 18px",
            border: "none",
            borderRadius: 14,
            background: "#DC2626",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow:
              "0 10px 25px rgba(220,38,38,0.3)",
          }}
        >
          Logout
        </button>
      </div>

      <DrugReturnNotification user={user} />
    </div>
  );
}