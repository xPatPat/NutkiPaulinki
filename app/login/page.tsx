
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const EMAIL_NAUCZYCIELA = "pojlola@gmail.com";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [rejestracja, setRejestracja] = useState(false);
  const [komunikat, setKomunikat] = useState("");

  async function obsluz() {
    setKomunikat("");

    const emailLogowania = email.trim().toLowerCase();

    try {
      if (rejestracja) {
        await createUserWithEmailAndPassword(
          auth,
          emailLogowania,
          haslo
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          emailLogowania,
          haslo
        );
      }

      if (
        emailLogowania ===
        EMAIL_NAUCZYCIELA.toLowerCase()
      ) {
        router.push("/nauczyciel");
      } else {
        router.push("/uczen");
      }
    } catch (error: any) {
      console.error(
        "Błąd logowania:",
        error.code,
        error.message
      );

      setKomunikat("Błędny email lub hasło.");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #fdf6ff, #eef9ff)",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "25px",
          width: "350px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#5b4b8a",
            marginBottom: "25px",
          }}
        >
          {rejestracja
            ? "📝 Rejestracja"
            : "🔐 Logowanie"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={haslo}
          onChange={(e) => setHaslo(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            fontSize: "16px",
          }}
        />

        <button
          onClick={obsluz}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "12px",
            background: "#d9c8ff",
            color: "#4b3b70",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {rejestracja
            ? "Utwórz konto"
            : "Zaloguj się"}
        </button>

        <button
          onClick={() => setRejestracja(!rejestracja)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            border: "none",
            borderRadius: "12px",
            background: "#f3edff",
            color: "#5b4b8a",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {rejestracja
            ? "Mam już konto"
            : "Utwórz nowe konto"}
        </button>

        {komunikat && (
          <p
            style={{
              textAlign: "center",
              color: "#c44b4b",
              marginTop: "15px",
            }}
          >
            {komunikat}
          </p>
        )}
      </div>
    </main>
  );
}

