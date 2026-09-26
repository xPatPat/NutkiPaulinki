"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

type Wynik = {
  wynik: number;
  liczbaPytan: number;
  data: Date | null;
};

export default function Postep() {
  const [wyniki, setWyniki] = useState<Wynik[]>([]);
  const [ladowanie, setLadowanie] = useState(true);

  useEffect(() => {
    async function pobierzWyniki() {
      if (!auth.currentUser) {
        setLadowanie(false);
        return;
      }

      try {
        const q = query(
          collection(db, "wyniki"),
          where("userId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);

        const pobraneWyniki: Wynik[] = snapshot.docs.map((doc) => {
          const dane = doc.data();

          return {
            wynik: dane.wynik ?? 0,
            liczbaPytan: dane.liczbaPytan ?? 10,
            data: dane.data?.toDate
              ? dane.data.toDate()
              : null,
          };
        });

        pobraneWyniki.sort((a, b) => {
          if (!a.data || !b.data) return 0;

          return b.data.getTime() - a.data.getTime();
        });

        setWyniki(pobraneWyniki);
      } catch (error) {
        console.error(
          "Błąd podczas pobierania wyników:",
          error
        );
      } finally {
        setLadowanie(false);
      }
    }

    pobierzWyniki();
  }, []);

  const liczbaCwiczen = wyniki.length;

  const sredniWynik =
    liczbaCwiczen > 0
      ? Math.round(
          wyniki.reduce(
            (suma, wynik) =>
              suma +
              (wynik.wynik / wynik.liczbaPytan) * 100,
            0
          ) / liczbaCwiczen
        )
      : 0;

  const najlepszyWynik =
    liczbaCwiczen > 0
      ? Math.max(
          ...wyniki.map((wynik) => wynik.wynik)
        )
      : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "25px 20px",
        background:
          "linear-gradient(135deg, #fdf6ff, #eef9ff)",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "750px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/uczen"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            padding: "9px 15px",
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
            borderRadius: "25px",
            padding: "30px 20px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "55px" }}>
            📊
          </div>

          <h1
            style={{
              color: "#5b4b8a",
              marginBottom: "10px",
            }}
          >
            Mój postęp
          </h1>

          <p
            style={{
              color: "#777",
              fontSize: "17px",
            }}
          >
            Twoje wyniki w ćwiczeniach z nut 🎵
          </p>

          {ladowanie ? (
            <p
              style={{
                marginTop: "30px",
                color: "#777",
              }}
            >
              Ładowanie wyników... ⏳
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  marginTop: "30px",
                }}
              >
                <div
                  style={{
                    background: "#f3edff",
                    padding: "20px",
                    borderRadius: "18px",
                  }}
                >
                  <div style={{ fontSize: "30px" }}>
                    📝
                  </div>

                  <h3>Ćwiczenia</h3>

                  <strong
                    style={{
                      fontSize: "28px",
                      color: "#7b61c9",
                    }}
                  >
                    {liczbaCwiczen}
                  </strong>

                  <p style={{ color: "#777" }}>
                    ukończonych
                  </p>
                </div>

                <div
                  style={{
                    background: "#eefbf1",
                    padding: "20px",
                    borderRadius: "18px",
                  }}
                >
                  <div style={{ fontSize: "30px" }}>
                    🎯
                  </div>

                  <h3>Średni wynik</h3>

                  <strong
                    style={{
                      fontSize: "28px",
                      color: "#4c9a59",
                    }}
                  >
                    {sredniWynik}%
                  </strong>

                  <p style={{ color: "#777" }}>
                    poprawnych odpowiedzi
                  </p>
                </div>

                <div
                  style={{
                    background: "#fff4df",
                    padding: "20px",
                    borderRadius: "18px",
                  }}
                >
                  <div style={{ fontSize: "30px" }}>
                    🏆
                  </div>

                  <h3>Najlepszy wynik</h3>

                  <strong
                    style={{
                      fontSize: "28px",
                      color: "#c58a32",
                    }}
                  >
                    {najlepszyWynik}/10
                  </strong>

                  <p style={{ color: "#777" }}>
                    najlepsze ćwiczenie
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  background: "#faf7ff",
                  borderRadius: "18px",
                  textAlign: "left",
                }}
              >
                <h2 style={{ color: "#5b4b8a" }}>
                  📅 Ostatnie wyniki
                </h2>

                {wyniki.length === 0 ? (
                  <p
                    style={{
                      color: "#888",
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    Nie masz jeszcze żadnych wyników.
                  </p>
                ) : (
                  <div>
                    {wyniki
                      .slice(0, 10)
                      .map((wynik, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            padding: "12px 15px",
                            marginBottom: "8px",
                            background: "white",
                            borderRadius: "12px",
                          }}
                        >
                          <span
                            style={{
                              color: "#666",
                            }}
                          >
                            {wynik.data
                              ? wynik.data.toLocaleDateString(
                                  "pl-PL"
                                )
                              : "Brak daty"}
                          </span>

                          <strong
                            style={{
                              color: "#7b61c9",
                              fontSize: "18px",
                            }}
                          >
                            {wynik.wynik}/
                            {wynik.liczbaPytan}
                          </strong>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <Link
                href="/nuty"
                style={{
                  display: "inline-block",
                  marginTop: "20px",
                  padding: "13px 25px",
                  borderRadius: "15px",
                  background: "#d9c8ff",
                  color: "#4b3b70",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                🎵 Rozpocznij kolejne ćwiczenie
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}