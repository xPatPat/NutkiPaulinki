"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Uczen() {
  const [user, setUser] = useState<User | null>(null);
  const [imie, setImie] = useState("UID: sprawdzam...");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (aktualnyUser) => {
      setUser(aktualnyUser);

      if (aktualnyUser) {
        const dokument = await getDoc(
          doc(db, "uzytkownicy", aktualnyUser.uid)
        );

        if (dokument.exists()) { console.log("DANE UZYTKOWNIKA:", dokument.data()); setImie(String(dokument.data().imię || "BRAK IMIENIA")); } else { setImie("BRAK DOKUMENTU: " + aktualnyUser.uid); }
      }
    });

    return () => unsubscribe();
  }, []);

  async function wyloguj() {
    await signOut(auth);
    window.location.href = "/login";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fdf6ff, #eef9ff)",
        fontFamily: "Arial",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "10px 15px",
              borderRadius: "15px",
              color: "#5b4b8a",
              fontWeight: "bold",
              boxShadow: "0 5px 15px rgba(0,0,0,0.06)",
            }}
          >
            👤 {imie}
          </div>

          <button
            onClick={wyloguj}
            style={{
              border: "none",
              background: "#eee5ff",
              color: "#5b4b8a",
              padding: "10px 14px",
              borderRadius: "15px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Wyloguj
          </button>
        </div>

        <h1
          style={{
            textAlign: "center",
            color: "#5b4b8a",
            marginBottom: "10px",
            paddingTop: "55px",
          }}
        >
          👨‍🎓 Panel ucznia
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#777",
            marginBottom: "30px",
          }}
        >
          Wybierz, czego chcesz się teraz uczyć 🎵
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
          }}
        >
          <Link href="/zadania" style={{ textDecoration: "none" }}>
            <div style={karta}>
              <div style={{ fontSize: "45px" }}>📝</div>
              <h2 style={{ color: "#5b4b8a" }}>Zadania</h2>
              <p style={{ color: "#777" }}>Twoje zadania do wykonania</p>
            </div>
          </Link>

          <Link href="/materialy" style={{ textDecoration: "none" }}>
            <div style={karta}>
              <div style={{ fontSize: "45px" }}>📚</div>
              <h2 style={{ color: "#5b4b8a" }}>Materiały</h2>
              <p style={{ color: "#777" }}>Materiały do nauki</p>
            </div>
          </Link>

          <Link href="/nuty" style={{ textDecoration: "none" }}>
            <div style={karta}>
              <div style={{ fontSize: "45px" }}>🎵</div>
              <h2 style={{ color: "#5b4b8a" }}>Nauka nut</h2>
              <p style={{ color: "#777" }}>Ćwicz rozpoznawanie nut</p>
            </div>
          </Link>

          <Link href="/postep" style={{ textDecoration: "none" }}>
            <div style={karta}>
              <div style={{ fontSize: "45px" }}>📊</div>
              <h2 style={{ color: "#5b4b8a" }}>Mój postęp</h2>
              <p style={{ color: "#777" }}>Zobacz swoje wyniki</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

const karta = {
  background: "white",
  borderRadius: "25px",
  padding: "25px",
  textAlign: "center" as const,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};



