import { useAnimSection } from "./shared";

const PORTRAIT = "https://cdn.poehali.dev/projects/ac059f9e-802b-4f7c-8586-eadc1391eb04/bucket/13083852-0ee0-4b57-adf1-a7468819896a.jpg";

interface HeroSectionProps {
  scrollTo: (id: string) => void;
}

export default function HeroSection({ scrollTo }: HeroSectionProps) {
  const masshtab = useAnimSection();

  return (
    <>
      {/* HERO */}
      <section id="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "4rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }} className="hero-pad">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <p
                className="animate-fade-in-up animate-delay-1"
                style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--graphite-light)", marginBottom: "2rem" }}
              >
                Москва&nbsp;&nbsp;/&nbsp;&nbsp;Онлайн
              </p>

              <h1
                className="animate-fade-in-up animate-delay-2"
                style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(3rem, 10vw, 5.5rem)", fontWeight: 300, lineHeight: 1, color: "var(--graphite)", marginBottom: "1.5rem" }}
              >
                Анна<br />Уварова
              </h1>

              <p
                className="animate-fade-in-up animate-delay-3"
                style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1rem, 3vw, 1.3rem)", fontWeight: 300, fontStyle: "italic", color: "var(--graphite-light)", marginBottom: "2.5rem", lineHeight: 1.5 }}
              >
                Бизнес-психолог для собственников<br />и руководителей
              </p>

              <div
                className="animate-fade-in-up animate-delay-3"
                style={{ width: "40px", borderTop: "1px solid var(--indigo)", marginBottom: "2.5rem" }}
              />

              <p
                className="animate-fade-in-up animate-delay-4"
                style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.8rem", color: "var(--graphite-light)", marginBottom: "0.75rem" }}
              >
                14 лет частной практики
              </p>

              <p
                className="animate-fade-in-up animate-delay-4"
                style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontWeight: 300, color: "var(--graphite)", marginBottom: "3rem", lineHeight: 1.4 }}
              >
                Индивидуальная работа<br />на уровне стратегических решений.
              </p>

              <button
                onClick={() => scrollTo("contact")}
                className="animate-fade-in-up animate-delay-5"
                style={{
                  backgroundColor: "var(--indigo)",
                  color: "var(--cream)",
                  fontFamily: "IBM Plex Sans, sans-serif",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  padding: "16px 28px",
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.3s ease",
                  width: "100%",
                  maxWidth: "340px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Запросить установочную встречу
              </button>
            </div>

            {/* Portrait */}
            <div className="animate-fade-in-up animate-delay-3 order-first md:order-last" style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  transform: "translate(10px, 10px)",
                  backgroundColor: "var(--rule)",
                }}
              />
              <img
                src={PORTRAIT}
                alt="Анна Уварова"
                style={{ width: "100%", maxHeight: "clamp(320px, 60vw, 600px)", objectFit: "cover", objectPosition: "top center", position: "relative", zIndex: 1 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* MASSHTAB BLOCK */}
      <section
        ref={masshtab.ref}
        style={{ borderTop: "1px solid var(--rule)", ...masshtab.style }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="section-pad">
          <div style={{ maxWidth: "600px" }}>
            <h2
              style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, lineHeight: 1.25, color: "var(--graphite)", marginBottom: "2rem" }}
            >
              Когда растёт масштаб —<br />растёт внутренняя нагрузка
            </h2>
            <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.875rem", lineHeight: 2, color: "var(--graphite-light)" }}>
              Помогаю принимать сложные решения, проходить личные и профессиональные
              кризисы и выстраивать устойчивую внутреннюю опору — чтобы масштабировать
              бизнес без потери себя.
            </p>
            <div style={{ marginTop: "3rem" }}>
              <button
                onClick={() => scrollTo("contact")}
                style={{
                  border: "1px solid var(--indigo)",
                  color: "var(--indigo)",
                  backgroundColor: "transparent",
                  fontFamily: "IBM Plex Sans, sans-serif",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  padding: "14px 28px",
                  cursor: "pointer",
                  transition: "opacity 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Запросить встречу
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
