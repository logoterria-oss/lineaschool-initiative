import { TASKS, RESULTS, useAnimSection } from "./shared";

interface AboutServicesProps {
  scrollTo: (id: string) => void;
}

export default function AboutServices({ scrollTo }: AboutServicesProps) {
  const about = useAnimSection();
  const services = useAnimSection();

  return (
    <>
      {/* ABOUT */}
      <section
        id="about"
        ref={about.ref}
        style={{ borderTop: "1px solid var(--rule)", backgroundColor: "var(--graphite)", ...about.style }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="section-pad">
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(245,242,238,0.4)", marginBottom: "3rem" }}>
            О подходе
          </p>
          <div className="grid md:grid-cols-2 gap-8 md:gap-16">
            <div>
              <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, lineHeight: 1.25, color: "var(--cream)", marginBottom: "2rem" }}>
                Профессиональная позиция
              </h2>
              <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.875rem", lineHeight: 2, color: "rgba(245,242,238,0.6)" }}>
                Работаю в экзистенциально-гуманистическом подходе. Это означает
                внимание к смыслам, выборам и ответственности — а не к симптомам
                или техникам быстрого исправления.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                "Экзистенциально-гуманистический подход",
                "Психология лидерства",
                "Зрелость управленческой позиции",
                "Устойчивость при высоких ставках",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ width: "1px", height: "48px", backgroundColor: "var(--indigo)", flexShrink: 0, marginTop: "4px" }} />
                  <p style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1rem, 2.5vw, 1.2rem)", fontWeight: 300, color: "var(--cream)", paddingTop: "4px", lineHeight: 1.4 }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3 steps */}
          <div className="steps-grid">
            {[
              { n: "01", title: "Запрос", text: "Формулируем, что происходит и что важно изменить." },
              { n: "02", title: "Решение", text: "Исследуем паттерны, выборы и то, что за ними стоит." },
              { n: "03", title: "Осознанность", text: "Новая устойчивость, которая остаётся после завершения работы." },
            ].map((step, i) => (
              <div key={i} className="step-item">
                <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.65rem", color: "rgba(245,242,238,0.25)", letterSpacing: "0.15em", marginBottom: "1rem" }}>{step.n}</p>
                <p style={{ fontFamily: "Cormorant, serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--cream)", marginBottom: "0.75rem" }}>{step.title}</p>
                <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.8rem", lineHeight: 1.9, color: "rgba(245,242,238,0.5)" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        ref={services.ref}
        style={{ borderTop: "1px solid var(--rule)", ...services.style }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="section-pad">
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--graphite-light)", marginBottom: "3rem" }}>
            Услуги
          </p>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16" style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, lineHeight: 1.25, color: "var(--graphite)" }}>
              С какими задачами<br />работаю
            </h2>
            <div className="tasks-grid">
              {TASKS.map((task, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "16px", borderTop: "1px solid var(--indigo)", flexShrink: 0 }} />
                  <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.8rem", color: "var(--graphite)" }}>{task}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Manifest */}
          <div style={{ borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", padding: "3rem 0", margin: "2rem 0" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
              <p style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.8, color: "var(--graphite)" }}>
                «Личность. Семья. Наследие.<br />
                Три измерения, которые определяют,<br />
                какой бизнес вы строите<br />
                и кем становитесь в этом процессе.»
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-16" style={{ marginTop: "3rem" }}>
            <div>
              <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 300, color: "var(--graphite)", marginBottom: "2rem" }}>Результат</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {RESULTS.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "24px", borderTop: "1px solid var(--indigo)" }} />
                    <p style={{ fontFamily: "Cormorant, serif", fontSize: "1.2rem", fontWeight: 300, color: "var(--graphite)" }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: "Cormorant, serif", fontSize: "1.8rem", fontWeight: 300, color: "var(--graphite)", marginBottom: "2rem" }}>Формат</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  ["Сессия", "50 минут"],
                  ["Место", "Москва / Онлайн"],
                  ["Конфиденциальность", "Полная"],
                  ["Приём", "Ограниченное число клиентов"],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem 1.5rem", borderBottom: "1px solid var(--rule)", padding: "1rem 0" }}>
                    <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--graphite-light)", minWidth: "120px" }}>{label}</p>
                    <p style={{ fontFamily: "Cormorant, serif", fontSize: "1.1rem", fontWeight: 300, color: "var(--graphite)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
