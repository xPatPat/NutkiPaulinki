"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Login() {
const router = useRouter();
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [rejestracja, setRejestracja] = useState(false);
  const [komunikat, setKomunikat] = useState("");

  async function obsluz() {
    setKomunikat("");

    try {
      if (rejestracja) {
        await createUserWithEmailAndPassword(
          auth,
          email,
          haslo
        );

        setKomunikat("Konto zostało utworzone!");
      } else {
        await signInWithEmailAndPassword(
  auth,
  email,
  haslo
);

router.push("/uczen");
      }
    } catch (error) {
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
        background: "#f4f7fb",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          width: "350px",
        }}
      >
        <h1>
          {rejestracja ? "📝 Rejestracja" : "🔐 Logowanie"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={haslo}
          onChange={(e) => setHaslo(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
          }}
        />

        <button
          onClick={obsluz}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {rejestracja ? "Utwórz konto" : "Zaloguj się"}
        </button>

        <button
          onClick={() => setRejestracja(!rejestracja)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          {rejestracja
            ? "Mam już konto"
            : "Utwórz nowe konto"}
        </button>

        <p>{komunikat}</p>
      </div>
    </main>
  );
}