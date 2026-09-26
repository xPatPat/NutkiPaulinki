"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

type Nutka = {
  nazwa: string;
  plik: string;
};

function wymieszaj<T>(tablica: T[]) {
  return [...tablica].sort(() => Math.random() - 0.5);
}

export default function NaukaNut() {
  const [nuty, setNuty] = useState<Nutka[]>([]);
  const [nuta, setNuta] = useState<Nutka | null>(null);
  const [odpowiedzi, setOdpowiedzi] = useState<Nutka[]>([]);
  const [pytanie, setPytanie] = useState(1);
  const [poprawne, setPoprawne] = useState(0);
  const [wybranaOdpowiedz, setWybranaOdpowiedz] =
    useState<Nutka | null>(null);
  const [koniec, setKoniec] = useState(false);
  const [zapisywanie, setZapisywanie] = useState(false);

  useEffect(() => {
    async function pobierzNuty() {
      try {
        const odpowiedz = await fetch("/api/nuty");
        const dane = await odpowiedz.json();

        setNuty(dane);

        if (dane.length >= 4) {
          przygotujPytanie(dane);
        }
      } catch (error) {
        console.error(
          "Błąd podczas pobierania nut:",
          error
        );
      }
    }

    pobierzNuty();
  }, []);

  function przygotujPytanie(lista: Nutka[]) {
    const poprawna =
      lista[Math.floor(Math.random() * lista.length)];

    const inne = lista.filter(
      (nutka) => nutka.nazwa !== poprawna.nazwa
    );

    const losoweInne = wymieszaj(inne).slice(0, 3);

    setNuta(poprawna);
    setOdpowiedzi(
      wymieszaj([poprawna, ...losoweInne])
    );
    setWybranaOdpowiedz(null);
  }

  function wybierzOdpowiedz(odpowiedz: Nutka) {
    if (wybranaOdpowiedz !== null || nuta === null) {
      return;
    }

    setWybranaOdpowiedz(odpowiedz);

    if (odpowiedz.nazwa === nuta.nazwa) {
      setPoprawne((wynik) => wynik + 1);
    }
  }

  async function zapiszWynik(wynik: number) {
    if (!auth.currentUser) {
      console.error(
        "Brak zalogowanego użytkownika."
      );
      return false;
    }

    try {
      setZapisywanie(true);

      await addDoc(collection(db, "wyniki"), {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        wynik: wynik,
        liczbaPytan: 10,
        data: new Date(),
      });

      console.log("Wynik zapisany w Firebase.");

      return true;
    } catch (error) {
      console.error(
        "Błąd podczas zapisywania wyniku:",
        error
      );

      return false;
    } finally {
      setZapisywanie(false);
    }
  }

  async function nastepnePytanie() {
    if (pytanie === 10) {
      const wynikKoncowy =
        poprawne +
        (wybranaOdpowiedz?.nazwa === nuta?.nazwa
          ? 1
          : 0);

      await zapiszWynik(wynikKoncowy);

      setPoprawne(wynikKoncowy);
      setKoniec(true);
      return;
    }

    przygotujPytanie(nuty);
    setPytanie((numer) => numer + 1);
  }

  function rozpocznijPonownie() {
    setPytanie(1);
    setPoprawne(0);
    setKoniec(false);
    setZapisywanie(false);
    przygotujPytanie(nuty);
  }

  if (nuty.length === 0 || nuta === null) {
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
        <h2 style={{ color: "#5b4b8a" }}>
          Ładowanie nut... 🎵
        </h2>
      </main>
    );
  }

  if (koniec) {
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
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "35px",
            borderRadius: "30px",
            textAlign: "center",
            maxWidth: "450px",
            width: "100%",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "55px" }}>
            🎉
          </div>

          <h1 style={{ color: "#5b4b8a" }}>
            Świetna robota!
          </h1>

          <p
            style={{
              fontSize: "20px",
              color: "#666",
            }}
          >
            Twój wynik:
          </p>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#7b61c9",
              margin: "15px",
            }}
          >
            {poprawne}/10
          </div>

          {zapisywanie && (
            <p style={{ color: "#777" }}>
              Zapisywanie wyniku... 💾
            </p>
          )}

          {!zapisywanie && (
            <p
              style={{
                color: "#4c9a59",
                fontWeight: "bold",
              }}
            >
              ✅ Wynik zapisany!
            </p>
          )}

          <button
            onClick={rozpocznijPonownie}
            style={{
              border: "none",
              padding: "14px 28px",
              borderRadius: "15px",
              background: "#d9c8ff",
              color: "#4b3b70",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🔄 Spróbuj jeszcze raz
          </button>

          <br />

          <Link
            href="/postep"
            style={{
              display: "inline-block",
              marginTop: "15px",
              color: "#7b61c9",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            📊 Zobacz mój postęp
          </Link>

          <br />

          <Link
            href="/uczen"
            style={{
              display: "inline-block",
              marginTop: "10px",
              color: "#7b61c9",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Powrót do menu
          </Link>
        </div>
      </main>
    );
  }

  const odpowiedzSprawdzona =
    wybranaOdpowiedz !== null;

  const czyPoprawna =
    nuta !== null &&
    wybranaOdpowiedz?.nazwa === nuta.nazwa;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fdf6ff, #eef9ff)",
        fontFamily: "Arial",
        padding: "15px 20px 25px",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/uczen"
          style={{
            display: "inline-block",
            marginBottom: "10px",
            padding: "8px 14px",
            borderRadius: "12px",
            background: "white",
            color: "#5b4b8a",
            textDecoration: "none",
            fontWeight: "bold",
            boxShadow:
              "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          ← Powrót do menu
        </Link>

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "10px 20px",
            marginBottom: "10px",
            textAlign: "center",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#777",
              fontSize: "16px",
            }}
          >
            🎵 Rozpoznawanie nut
          </p>

          <h2
            style={{
              color: "#5b4b8a",
              margin: "5px 0 0",
            }}
          >
            Pytanie {pytanie} / 10
          </h2>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "25px",
            padding: "20px 18px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <p
            style={{
              color: "#777",
              fontSize: "16px",
              margin: "0 0 5px",
            }}
          >
            Jaka to nuta?
          </p>

          <div
            style={{
              height: "160px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "5px 0 12px",
            }}
          >
            <img
              src={`/nutki/${nuta.plik}`}
              alt={`Nuta ${nuta.nazwa}`}
              style={{
                maxWidth: "180px",
                maxHeight: "155px",
                objectFit: "contain",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              maxWidth: "450px",
              margin: "0 auto",
            }}
          >
            {odpowiedzi.map((odpowiedz) => {
              let tlo = "#eee5ff";

              if (
                odpowiedzSprawdzona &&
                odpowiedz.nazwa === nuta.nazwa
              ) {
                tlo = "#d9f7df";
              }

              if (
                odpowiedzSprawdzona &&
                odpowiedz.nazwa ===
                  wybranaOdpowiedz?.nazwa &&
                odpowiedz.nazwa !== nuta.nazwa
              ) {
                tlo = "#ffdede";
              }

              return (
                <button
                  key={odpowiedz.nazwa}
                  onClick={() =>
                    wybierzOdpowiedz(odpowiedz)
                  }
                  style={{
                    border: "none",
                    borderRadius: "15px",
                    padding: "12px",
                    fontSize: "21px",
                    fontWeight: "bold",
                    background: tlo,
                    color: "#57427f",
                    cursor: odpowiedzSprawdzona
                      ? "default"
                      : "pointer",
                  }}
                >
                  {odpowiedz.nazwa}
                </button>
              );
            })}
          </div>

          {odpowiedzSprawdzona && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                borderRadius: "18px",
                background: czyPoprawna
                  ? "#ecfff0"
                  : "#fff0f0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 5px",
                  fontSize: "21px",
                  color: czyPoprawna
                    ? "#3c8c4a"
                    : "#c44b4b",
                }}
              >
                {czyPoprawna
                  ? "✅ Dobrze!"
                  : "❌ Źle!"}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "#555",
                }}
              >
                Poprawna odpowiedź:{" "}
                <strong>{nuta.nazwa}</strong>
              </p>

              <button
                onClick={nastepnePytanie}
                style={{
                  marginTop: "10px",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "13px",
                  background: "#d9c8ff",
                  color: "#4b3b70",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {pytanie === 10
                  ? "Zobacz wynik 🎉"
                  : "Następne pytanie →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}