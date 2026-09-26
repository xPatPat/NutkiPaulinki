"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

type Uczen = {
  id: string;
  imie: string;
};

type Zadanie = {
  id: string;
  uczenId: string;
  tytul: string;
  opis: string;
  typ: string;
  linki: string[];
  dataUtworzenia: Date | null;
  termin: Date | null;
  wykonane: boolean;
  dataWykonania: Date | null;
};

export default function ZadaniaNauczyciela() {
  const [user, setUser] = useState<User | null>(null);
  const [uczniowie, setUczniowie] = useState<Uczen[]>([]);
  const [zadania, setZadania] = useState<Zadanie[]>([]);
  const [wybranyUczen, setWybranyUczen] = useState("");
  const [zakladka, setZakladka] = useState<"aktywne" | "historia">(
    "aktywne"
  );

  const [tytul, setTytul] = useState("");
  const [opis, setOpis] = useState("");
  const [typ, setTyp] = useState("Obejrzyj film");
  const [linki, setLinki] = useState("");
  const [termin, setTermin] = useState("");

  const [ladowanie, setLadowanie] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (aktualnyUser) => {
      setUser(aktualnyUser);

      if (!aktualnyUser) {
        setLadowanie(false);
        return;
      }

      await Promise.all([pobierzUczniow(), pobierzZadania()]);
      setLadowanie(false);
    });

    return () => unsubscribe();
  }, []);

  async function pobierzUczniow() {
    try {
      const snapshot = await getDocs(collection(db, "uzytkownicy"));

      const lista: Uczen[] = snapshot.docs
        .map((dokument) => ({
          id: dokument.id,
          imie: String(dokument.data().imię || "Nieznany uczeń"),
        }))
        .filter((uczen) => uczen.id !== auth.currentUser?.uid)
        .sort((a, b) => a.imie.localeCompare(b.imie));

      setUczniowie(lista);
    } catch (error) {
      console.error("Błąd pobierania uczniów:", error);
    }
  }

  async function pobierzZadania() {
    try {
      const q = query(
        collection(db, "zadania"),
        orderBy("dataUtworzenia", "desc")
      );

      const snapshot = await getDocs(q);

      const lista: Zadanie[] = snapshot.docs.map((dokument) => {
        const dane = dokument.data();

        return {
          id: dokument.id,
          uczenId: dane.uczenId || "",
          tytul: dane.tytul || "",
          opis: dane.opis || "",
          typ: dane.typ || "Inne",
          linki: Array.isArray(dane.linki) ? dane.linki : [],
          dataUtworzenia: dane.dataUtworzenia?.toDate
            ? dane.dataUtworzenia.toDate()
            : null,
          termin: dane.termin?.toDate
            ? dane.termin.toDate()
            : null,
          wykonane: dane.wykonane === true,
          dataWykonania: dane.dataWykonania?.toDate
            ? dane.dataWykonania.toDate()
            : null,
        };
      });

      setZadania(lista);
    } catch (error) {
      console.error("Błąd pobierania zadań:", error);
    }
  }

  async function dodajZadanie() {
    if (!user) return;

    if (!wybranyUczen || !tytul.trim() || !termin) {
      alert("Wybierz ucznia, wpisz tytuł i termin.");
      return;
    }

    try {
      const listaLinkow = linki
        .split("\n")
        .map((link) => link.trim())
        .filter(Boolean);

      await addDoc(collection(db, "zadania"), {
        uczenId: wybranyUczen,
        nauczycielId: user.uid,
        tytul: tytul.trim(),
        opis: opis.trim(),
        typ,
        linki: listaLinkow,
        dataUtworzenia: Timestamp.now(),
        termin: Timestamp.fromDate(
          new Date(termin + "T23:59:59")
        ),
        wykonane: false,
        dataWykonania: null,
      });

      setTytul("");
      setOpis("");
      setLinki("");
      setTermin("");

      await pobierzZadania();

      alert("Zadanie zostało przypisane.");
    } catch (error) {
      console.error("Błąd dodawania zadania:", error);
      alert("Nie udało się dodać zadania.");
    }
  }

  async function usunZadanie(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć to zadanie?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "zadania", id));
      await pobierzZadania();
    } catch (error) {
      console.error("Błąd usuwania zadania:", error);
      alert("Nie udało się usunąć zadania.");
    }
  }

  async function cofnijWykonanie(id: string) {
    try {
      await updateDoc(doc(db, "zadania", id), {
        wykonane: false,
        dataWykonania: null,
      });

      await pobierzZadania();
    } catch (error) {
      console.error("Błąd zmiany statusu:", error);
    }
  }

  function formatData(data: Date | null) {
    if (!data) return "Brak daty";

    return data.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function nazwaUcznia(id: string) {
    return (
      uczniowie.find((uczen) => uczen.id === id)?.imie ||
      "Nieznany uczeń"
    );
  }

  const zadaniaFiltrowane = zadania.filter((zadanie) => {
    if (
      wybranyUczen &&
      zadanie.uczenId !== wybranyUczen
    ) {
      return false;
    }

    if (zakladka === "aktywne") {
      return !zadanie.wykonane;
    }

    return zadanie.wykonane;
  });

  if (ladowanie) {
    return (
      <main style={mainStyle}>
        <h2 style={{ color: "#5b4b8a" }}>
          Ładowanie... ⏳
        </h2>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>

        <Link
          href="/nauczyciel"
          style={{
            color: "#5b4b8a",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ← Panel nauczyciela
        </Link>

        <div style={headerStyle}>
          <div style={{ fontSize: "55px" }}>📝</div>

          <h1 style={{ color: "#5b4b8a" }}>
            Zadania
          </h1>

          <p style={{ color: "#777" }}>
            Przypisuj zadania uczniom i sprawdzaj ich wykonanie.
          </p>
        </div>

        <div style={formStyle}>
          <h2 style={sectionTitle}>
            ➕ Przypisz nowe zadanie
          </h2>

          <label style={labelStyle}>
            Uczeń
          </label>

          <select
            value={wybranyUczen}
            onChange={(e) =>
              setWybranyUczen(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              -- wybierz ucznia --
            </option>

            {uczniowie.map((uczen) => (
              <option
                key={uczen.id}
                value={uczen.id}
              >
                {uczen.imie}
              </option>
            ))}
          </select>

          <label style={labelStyle}>
            Typ zadania
          </label>

          <select
            value={typ}
            onChange={(e) => setTyp(e.target.value)}
            style={inputStyle}
          >
            <option>Obejrzyj film</option>
            <option>Poćwicz utwór</option>
            <option>Nagraj coś</option>
            <option>Inne</option>
          </select>

          <label style={labelStyle}>
            Tytuł zadania
          </label>

          <input
            value={tytul}
            onChange={(e) => setTytul(e.target.value)}
            placeholder="Np. Poćwicz utwór..."
            style={inputStyle}
          />

          <label style={labelStyle}>
            Opis / instrukcja
          </label>

          <textarea
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            placeholder="Napisz, co uczeń ma zrobić..."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          <label style={labelStyle}>
            Linki / materiały
          </label>

          <textarea
            value={linki}
            onChange={(e) => setLinki(e.target.value)}
            placeholder={
              "Jeden link w każdej linii"
            }
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          <label style={labelStyle}>
            Termin wykonania
          </label>

          <input
            type="date"
            value={termin}
            onChange={(e) => setTermin(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={dodajZadanie}
            style={primaryButton}
          >
            📤 Przypisz zadanie
          </button>
        </div>

        <div style={tabsStyle}>
          <button
            onClick={() => setZakladka("aktywne")}
            style={{
              ...tabButton,
              ...(zakladka === "aktywne"
                ? activeTabButton
                : {}),
            }}
          >
            📌 Aktywne
          </button>

          <button
            onClick={() => setZakladka("historia")}
            style={{
              ...tabButton,
              ...(zakladka === "historia"
                ? activeTabButton
                : {}),
            }}
          >
            📚 Historia
          </button>
        </div>

        <div style={filterStyle}>
          <label style={labelStyle}>
            Pokaż zadania ucznia:
          </label>

          <select
            value={wybranyUczen}
            onChange={(e) =>
              setWybranyUczen(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Wszyscy uczniowie
            </option>

            {uczniowie.map((uczen) => (
              <option
                key={uczen.id}
                value={uczen.id}
              >
                {uczen.imie}
              </option>
            ))}
          </select>
        </div>

        <h2 style={sectionTitle}>
          {zakladka === "aktywne"
            ? "📌 Aktywne zadania"
            : "📚 Historia zadań"}
        </h2>

        {zadaniaFiltrowane.length === 0 ? (
          <div style={emptyStyle}>
            Brak zadań.
          </div>
        ) : (
          zadaniaFiltrowane.map((zadanie) => (
            <div
              key={zadanie.id}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "22px",
                marginBottom: "15px",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,0.07)",
                borderLeft: zadanie.wykonane
                  ? "6px solid #65b96b"
                  : "6px solid #d9c8ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: "#7b61c9",
                      fontWeight: "bold",
                    }}
                  >
                    👤 {nazwaUcznia(zadanie.uczenId)}
                  </div>

                  <h3 style={{ color: "#4d416d" }}>
                    {zadanie.tytul}
                  </h3>

                  <div style={{ color: "#777" }}>
                    {zadanie.typ}
                  </div>

                  <p
                    style={{
                      color: "#666",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {zadanie.opis}
                  </p>

                  <div style={{ color: "#666" }}>
                    📅 Termin:{" "}
                    <strong>
                      {formatData(zadanie.termin)}
                    </strong>
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                      fontWeight: "bold",
                      color: zadanie.wykonane
                        ? "#4c9a59"
                        : "#c58a32",
                    }}
                  >
                    {zadanie.wykonane
                      ? `✓ Uczeń wykonał zadanie${
                          zadanie.dataWykonania
                            ? `: ${formatData(
                                zadanie.dataWykonania
                              )}`
                            : ""
                        }`
                      : "🟡 Uczeń jeszcze nie wykonał"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {zadanie.wykonane && (
                    <button
                      onClick={() =>
                        cofnijWykonanie(zadanie.id)
                      }
                      style={secondaryButton}
                    >
                      Cofnij wykonanie
                    </button>
                  )}

                  <button
                    onClick={() =>
                      usunZadanie(zadanie.id)
                    }
                    style={deleteButton}
                  >
                    🗑 Usuń
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #fdf6ff, #eef9ff)",
  fontFamily: "Arial",
  padding: "30px 20px",
};

const containerStyle = {
  maxWidth: "900px",
  margin: "0 auto",
};

const headerStyle = {
  background: "white",
  borderRadius: "25px",
  padding: "30px",
  textAlign: "center" as const,
  marginTop: "20px",
  marginBottom: "25px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.08)",
};

const formStyle = {
  background: "white",
  borderRadius: "25px",
  padding: "25px",
  marginBottom: "25px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitle = {
  color: "#5b4b8a",
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  color: "#5b4b8a",
  fontWeight: "bold",
  marginBottom: "7px",
  marginTop: "15px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "15px",
  background: "white",
};

const primaryButton = {
  width: "100%",
  marginTop: "20px",
  border: "none",
  borderRadius: "14px",
  padding: "14px",
  background: "#d9c8ff",
  color: "#4b3b70",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
};

const tabsStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
};

const tabButton = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 20px",
  background: "white",
  color: "#5b4b8a",
  fontWeight: "bold",
  cursor: "pointer",
};

const activeTabButton = {
  background: "#d9c8ff",
};

const filterStyle = {
  background: "white",
  borderRadius: "20px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow:
    "0 5px 15px rgba(0,0,0,0.05)",
};

const secondaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "#eee5ff",
  color: "#5b4b8a",
  fontWeight: "bold",
  cursor: "pointer",
};

const deleteButton = {
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "#ffe5e5",
  color: "#a33",
  fontWeight: "bold",
  cursor: "pointer",
};

const emptyStyle = {
  background: "white",
  borderRadius: "18px",
  padding: "25px",
  color: "#777",
  textAlign: "center" as const,
};