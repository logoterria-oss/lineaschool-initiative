import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFoundPage = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--graphite, #1c1c1c)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "IBM Plex Sans, sans-serif",
      }}
    >
      <p
        style={{
          fontFamily: "Cormorant, serif",
          fontSize: "clamp(6rem, 20vw, 12rem)",
          fontWeight: 300,
          color: "rgba(245,242,238,0.08)",
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "Cormorant, serif",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 400,
          color: "var(--cream, #f5f2ee)",
          margin: "1rem 0 0.75rem",
          letterSpacing: "0.02em",
          textAlign: "center",
        }}
      >
        Страница не найдена
      </h1>
      <p
        style={{
          fontSize: "0.85rem",
          color: "rgba(245,242,238,0.4)",
          textAlign: "center",
          maxWidth: "320px",
          lineHeight: 1.7,
          margin: "0 0 2.5rem",
        }}
      >
        Возможно, ссылка устарела или была удалена
      </p>
      <a
        href="https://annauvarova.ru/"
        style={{
          display: "inline-block",
          backgroundColor: "var(--cream, #f5f2ee)",
          color: "var(--graphite, #1c1c1c)",
          fontFamily: "IBM Plex Sans, sans-serif",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          padding: "14px 36px",
          textDecoration: "none",
          transition: "opacity 0.3s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.8")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
      >
        Вернуться на главную
      </a>
    </div>
  );
};

export default NotFoundPage;
