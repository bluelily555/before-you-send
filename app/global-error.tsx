export default function GlobalError() {
  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>오류가 발생했습니다</h2>
          <a href="/" style={{ padding: "0.5rem 1.5rem", background: "#4f46e5", color: "white", borderRadius: "0.5rem", textDecoration: "none" }}>
            홈으로 돌아가기
          </a>
        </div>
      </body>
    </html>
  );
}
