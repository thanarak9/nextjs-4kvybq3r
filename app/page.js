"use client";
import { useState } from "react";
import LoginPage from "./components/LoginPage";
import DrugReturnNotification from "./components/DrugReturnNotification";

export default function Home() {
  const [user, setUser] = useState(null);

  return (
    <main>
      {!user ? (
        <LoginPage onLogin={(u) => setUser(u)} />
      ) : (
        <DrugReturnNotification user={user} onLogout={() => setUser(null)} />
      )}
    </main>
  );
}