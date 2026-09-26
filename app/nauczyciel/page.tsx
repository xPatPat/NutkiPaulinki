"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { db, auth } from "../../lib/firebase";

type Wynik = {
  id: string;
  userId: string;
  email: string;
  wynik: number;
  liczbaPytan: number;
  data: Date | null;
};

type Uczen = {
  userId: string;
  imie: string;
  wyniki: Wynik[];
  liczbaCwiczen: number;
  sredniWynik: number;
  najlepszyWynik: number;
};

export default function Nauczyciel() {
  const [user, setUser] = useState<User | null>(null);
  const [imieNauczyciela, setImieNauczyciela] = useState("Nauczyciel");
  const [uczniowie, setUczniowie] = useState<Uczen[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [wybranyUczen, setWybranyUczen] =
    useState<Uczen | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (aktualnyUser) => {
        setUser(aktualnyUser);

        if (aktualnyUser) {
          const dokument = await getDoc(
            doc(db, "uzytkownicy", aktualnyUser.uid)
          );

          if (dokument.exists()) {
            setImieNauczyciela(
              String(
                dokument.data().imię || "Nauczyciel"
              )
            );
          }

          await pobierzWyniki();
        } else {
          setLadowanie(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  async function pobierzWyniki() {
    try {
      setLadowanie(true);

      const snapshot = await getDocs(
        collection(db, "wyniki")
      );

      const wyniki: Wynik[] = snapshot.docs.map(
        (dokument) => {
          const dane = dokument.data();

          return {
            id: dokument.id,
            userId: dane.userId ?? "",
            email: dane.email ?? "",
            wynik: dane.wynik ?? 0,
            liczbaPytan: dane.liczbaPytan ?? 10,
            data: dane.data?.toDate
              ? dane.data.toDate()
              : null,
          };
        }
      );

      const mapa = new Map<string, Uczen>();

      for (const wynik of wyniki) {
        if (!mapa.has(wynik.userId)) {
          let imie = "Nieznany uczeń";

          try {
            const dokumentUzytkownika = await getDoc(
              doc(db, "uzytkownicy", wynik.userId)
            );

            if (dokumentUzytkownika.exists()) {
              imie = String(
                dokumentUzytkownika.data().imię ||
                  "Nieznany uczeń"
              );
            }
          } catch (error) {
            console.error(
              "Błąd pobierania imienia:",
              error
            );
          }

          mapa.set(wynik.userId, {
            userId: wynik.userId,
            imie,
            wyniki: [],
            liczbaCwiczen: 0,
            sredniWynik: 0,
            najlepszyWynik: 0,
          });
        }

        mapa.get(wynik.userId)!.wyniki.push(wynik);
      }

      const lista = Array.from(mapa.values());

      lista.forEach((uczen) => {
        uczen.liczbaCwiczen =
          uczen.wyniki.length;

        const procenty = uczen.wyniki.map(
          (wynik) =>
            (wynik.wynik / wynik.liczbaPytan) * 100
        );

        uczen.sredniWynik =
          procenty.length > 0
            ? Math.round(
                procenty.reduce(
                  (suma, wartosc) =>
                    suma + wartosc,
                  0
                ) / procenty.length
              )
            : 0;

        uczen.najlepszyWynik =
          uczen.wyniki.length > 0
            ? Math.max(
                ...uczen.wyniki.map(
                  (wynik) => wynik.wynik
                )
              )
            : 0;

        uczen.wyniki.sort((a, b) => {
          if (!a.data || !b.data) return 0;

          return (
            b.data.getTime() -
            a.data.getTime()
          );
        });
      });

      lista.sort((a, b) =>
        a.imie.localeCompare(b.imie)
      );

      setUczniowie(lista);
    } catch (error) {
      console.error(
        "Błąd podczas pobierania wyników uczniów:",
        error
      );
    } finally {
      setLadowanie(false);
    }
  }

  async function wyloguj() {
    await signOut(auth);
    window.location.href = "/login";
  }

  if (ladowanie) {
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
          Ładowanie panelu... ⏳
        </h2>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fdf6ff, #eef9ff)",
        fontFamily: "Arial",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#5b4b8a",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Strona główna
          </Link>

          <div
            style={{
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
                boxShadow:
                  "0 5px 15px rgba(0,0,0,0.06)",
              }}
            >
              👤 {imieNauczyciela}
            </div>

            <button
              onClick={wyloguj}
              style={{
                border: "none",
                background: "#eee5ff",
                color: "#5b4b8a",
                padding: "10px 15px",
                borderRadius: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "25px",
            padding: "30px 25px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "55px" }}>
              👨‍🏫
            </div>
            <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  }}
>
  <Link
    href="/nauczyciel/zadania"
    style={{
      background: "#d9c8ff",
      color: "#4b3b70",
      padding: "12px 22px",
      borderRadius: "14px",
      textDecoration: "none",
      fontWeight: "bold",
    }}
  >
    📝 Zadania
  </Link>
</div>
            <h1
              style={{
                color: "#5b4b8a",
                marginBottom: "8px",
              }}
            >
              Panel nauczyciela
            </h1>

            <p style={{ color: "#777" }}>
              Wyniki i postępy uczniów
            </p>
          </div>

          {uczniowie.length === 0 ? (
            <div
              style={{
                marginTop: "30px",
                padding: "30px",
                background: "#faf7ff",
                borderRadius: "18px",
                textAlign: "center",
                color: "#777",
              }}
            >
              <div style={{ fontSize: "40px" }}>
                👨‍🎓
              </div>

              <p>
                Nie ma jeszcze zapisanych wyników
                uczniów.
              </p>
            </div>
          ) : (
            <>
              <h2
                style={{
                  color: "#5b4b8a",
                  marginTop: "30px",
                }}
              >
                👨‍🎓 Uczniowie
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "15px",
                }}
              >
                {uczniowie.map((uczen) => (
                  <button
                    key={uczen.userId}
                    onClick={() =>
                      setWybranyUczen(uczen)
                    }
                    style={{
                      border: "none",
                      background: "#faf7ff",
                      borderRadius: "20px",
                      padding: "20px",
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow:
                        "0 5px 15px rgba(0,0,0,0.05)",
                    }}
                  >
                    <h3
                      style={{
                        color: "#5b4b8a",
                        marginTop: 0,
                      }}
                    >
                      👤 {uczen.imie}
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr 1fr 1fr",
                        gap: "8px",
                        textAlign: "center",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            color: "#7b61c9",
                            fontSize: "22px",
                          }}
                        >
                          {uczen.liczbaCwiczen}
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                          }}
                        >
                          ćwiczeń
                        </div>
                      </div>

                      <div>
                        <strong
                          style={{
                            color: "#4c9a59",
                            fontSize: "22px",
                          }}
                        >
                          {uczen.sredniWynik}%
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                          }}
                        >
                          średnia
                        </div>
                      </div>

                      <div>
                        <strong
                          style={{
                            color: "#c58a32",
                            fontSize: "22px",
                          }}
                        >
                          {uczen.najlepszyWynik}/10
                        </strong>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                          }}
                        >
                          najlepszy
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {wybranyUczen && (
            <div
              style={{
                marginTop: "30px",
                padding: "20px",
                background: "#f7f3ff",
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#5b4b8a",
                      margin: 0,
                    }}
                  >
                    📊 Wyniki ucznia
                  </h2>

                  <p
                    style={{
                      color: "#777",
                      marginBottom: 0,
                    }}
                  >
                    {wybranyUczen.imie}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setWybranyUczen(null)
                  }
                  style={{
                    border: "none",
                    background: "#eee5ff",
                    color: "#5b4b8a",
                    padding: "10px 15px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Zamknij
                </button>
              </div>

              <div style={{ marginTop: "20px" }}>
                {wybranyUczen.wyniki.map(
                  (wynik) => (
                    <div
                      key={wynik.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        background: "white",
                        padding: "13px 15px",
                        borderRadius: "12px",
                        marginBottom: "8px",
                        gap: "15px",
                      }}
                    >
                      <span
                        style={{
                          color: "#666",
                        }}
                      >
                        {wynik.data
                          ? wynik.data.toLocaleString(
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
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
