"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Zadanie = {
  id: string;
  uczenId: string;
  nauczycielId: string;
  tytul: string;
  opis: string;
  typ: string;
  linki: string[];
  dataUtworzenia: Date | null;
  termin: Date | null;
  wykonane: boolean;
  dataWykonania: Date | null;
};

export default function ZadaniaUczen() {
  const [user, setUser] = useState<User | null>(null);
  const [zadania, setZadania] = useState<Zadanie[]>([]);
  const [ladowanie, setLadowanie] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (aktualnyUser) => {
      setUser(aktualnyUser);

      if (!aktualnyUser) {
        setLadowanie(false);
        return;
      }

      await pobierzZadania(aktualnyUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function pobierzZadania(uid: string) {
    try {
      const q = query(
        collection(db, "zadania"),
        where("uczenId", "==", uid)
      );

      const snapshot = await getDocs(q);

      const lista: Zadanie[] = snapshot.docs.map((dokument) => {
        const dane = dokument.data();

        return {
          id: dokument.id,
          uczenId: dane.uczenId ?? "",
          nauczycielId: dane.nauczycielId ?? "",
          tytul: dane.tytul ?? "",
          opis: dane.opis ?? "",
          typ: dane.typ ?? "Inne",
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

      lista.sort((a, b) => {
        const dataA = a.termin?.getTime() ?? 0;
        const dataB = b.termin?.getTime() ?? 0;
        return dataA - dataB;
      });

      setZadania(lista);
    } catch (error) {
      console.error("Błąd pobierania zadań:", error);
    } finally {
      setLadowanie(false);
    }
  }

  async function zmienStatus(zadanie: Zadanie) {
    try {
      const noweWykonane = !zadanie.wykonane;

      await updateDoc(doc(db, "zadania", zadanie.id), {
        wykonane: noweWykonane,
        dataWykonania: noweWykonane
          ? Timestamp.now()
          : null,
      });

      if (user) {
        await pobierzZadania(user.uid);
      }
    } catch (error) {
      console.error("Błąd zmiany statusu:", error);
      alert("Nie udało się zmienić statusu zadania.");
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

  const aktywne = zadania.filter((zadanie) => !zadanie.wykonane);
  const historia = zadania.filter((zadanie) => zadanie.wykonane);

  if (ladowanie) {
    return (
      <main style={mainStyle}>
        <h2 style={{ color: "#5b4b8a" }}>
          Ładowanie zadań... ⏳
        </h2>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={containerStyle}>
        <a
          href="/uczen"
          style={{
            color: "#5b4b8a",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ← Panel ucznia
        </a>

        <div style={headerStyle}>
          <div style={{ fontSize: "55px" }}>📝</div>

          <h1 style={{ color: "#5b4b8a", marginBottom: "8px" }}>
            Zadania
          </h1>

          <p style={{ color: "#777" }}>
            Zadania przesłane przez nauczyciela
          </p>
        </div>

        <section>
          <h2 style={sectionTitle}>
            📌 Aktywne zadania ({aktywne.length})
          </h2>

          {aktywne.length === 0 ? (
            <div style={emptyStyle}>
              Nie masz obecnie żadnych aktywnych zadań. 🎉
            </div>
          ) : (
            aktywne.map((zadanie) => (
              <ZadanieKarta
                key={zadanie.id}
                zadanie={zadanie}
                onStatus={() => zmienStatus(zadanie)}
                formatData={formatData}
              />
            ))
          )}
        </section>

        <section style={{ marginTop: "40px" }}>
          <h2 style={sectionTitle}>
            📚 Historia wykonanych zadań ({historia.length})
          </h2>

          {historia.length === 0 ? (
            <div style={emptyStyle}>
              Nie ma jeszcze wykonanych zadań.
            </div>
          ) : (
            historia.map((zadanie) => (
              <ZadanieKarta
                key={zadanie.id}
                zadanie={zadanie}
                onStatus={() => zmienStatus(zadanie)}
                formatData={formatData}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function ZadanieKarta({
  zadanie,
  onStatus,
  formatData,
}: {
  zadanie: Zadanie;
  onStatus: () => void;
  formatData: (data: Date | null) => string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "22px",
        marginBottom: "15px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.07)",
        borderLeft: zadanie.wykonane
          ? "6px solid #65b96b"
          : "6px solid #d9c8ff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: "#7b61c9",
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            {zadanie.typ}
          </div>

          <h3
            style={{
              margin: "0 0 10px",
              color: "#4d416d",
            }}
          >
            {zadanie.tytul}
          </h3>

          <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>
            {zadanie.opis}
          </p>

          <div style={{ color: "#666", fontSize: "14px" }}>
            📅 Termin: <strong>{formatData(zadanie.termin)}</strong>
          </div>

          {zadanie.dataUtworzenia && (
            <div
              style={{
                color: "#999",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              Dodano: {formatData(zadanie.dataUtworzenia)}
            </div>
          )}

          {zadanie.wykonane && zadanie.dataWykonania && (
            <div
              style={{
                color: "#4c9a59",
                fontSize: "13px",
                marginTop: "4px",
                fontWeight: "bold",
              }}
            >
              ✓ Wykonano: {formatData(zadanie.dataWykonania)}
            </div>
          )}

          {zadanie.linki.length > 0 && (
            <div style={{ marginTop: "15px" }}>
              <strong style={{ color: "#5b4b8a" }}>
                🔗 Materiały:
              </strong>

              {zadanie.linki.map((link, index) => (
                <div key={index} style={{ marginTop: "6px" }}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#6b4fc4",
                      fontWeight: "bold",
                    }}
                  >
                    Otwórz materiał {index + 1} →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onStatus}
          style={{
            border: "none",
            borderRadius: "14px",
            padding: "12px 18px",
            background: zadanie.wykonane
              ? "#dff4e1"
              : "#eee5ff",
            color: zadanie.wykonane
              ? "#397843"
              : "#5b4b8a",
            fontWeight: "bold",
            cursor: "pointer",
            minWidth: "145px",
          }}
        >
          {zadanie.wykonane
            ? "✓ Zrobione"
            : "☐ Zaznacz jako zrobione"}
        </button>
      </div>
    </div>
  );
}

const mainStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #fdf6ff, #eef9ff)",
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
  marginBottom: "30px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitle = {
  color: "#5b4b8a",
  marginBottom: "18px",
};

const emptyStyle = {
  background: "white",
  borderRadius: "18px",
  padding: "25px",
  color: "#777",
  textAlign: "center" as const,
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
};
