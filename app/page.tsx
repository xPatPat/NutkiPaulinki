import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1>🎓 Platforma dla uczniów</h1>

        <p>
          Wybierz miejsce, do którego chcesz przejść:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <Link href="/login">
            <div style={box}>
              <h2>🔐 Logowanie</h2>
              <p>Zaloguj się do platformy.</p>
            </div>
          </Link>

          <Link href="/uczen">
            <div style={box}>
              <h2>👨‍🎓 Uczeń</h2>
              <p>Przejdź do panelu ucznia.</p>
            </div>
          </Link>

          <Link href="/nauczyciel">
            <div style={box}>
              <h2>👨‍🏫 Nauczyciel</h2>
              <p>Przejdź do panelu nauczyciela.</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

const box = {
  background: "white",
  padding: "30px",
  borderRadius: "16px",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
};