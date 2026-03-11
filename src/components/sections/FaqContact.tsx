import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FAQ_ITEMS, useAnimSection } from "./shared";

const SEND_URL = "https://functions.poehali.dev/9e87fd1d-b86d-4540-81a9-10b123f14787";

interface FaqContactProps {
  scrollTo: (id: string) => void;
}

export default function FaqContact({ scrollTo }: FaqContactProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faq = useAnimSection();
  const contact = useAnimSection();

  const [name, setName] = useState("");
  const [contactVal, setContactVal] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit() {
    if (!name.trim() || !contactVal.trim() || !agreed) return;
    setStatus("sending");
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact: contactVal, message }),
      });
      if (res.ok) {
        setStatus("sent");
        setName(""); setContactVal(""); setMessage(""); setAgreed(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* FAQ */}
      <section
        id="faq"
        ref={faq.ref}
        style={{ borderTop: "1px solid var(--rule)", backgroundColor: "#EFECE8", ...faq.style }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="section-pad">
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--graphite-light)", marginBottom: "3rem" }}>
            Вопросы и ответы
          </p>
          <div style={{ maxWidth: "700px" }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ borderTop: "1px solid var(--rule)" }}>
                <button
                  style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "1.5rem 0", textAlign: "left", gap: "1rem", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <p style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)", fontWeight: 300, color: "var(--graphite)", lineHeight: 1.4, opacity: openFaq === i ? 1 : 0.85 }}>
                    {item.q}
                  </p>
                  <span style={{ color: "var(--indigo)", flexShrink: 0, marginTop: "4px", transition: "transform 0.3s ease", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", display: "block" }}>
                    <Icon name="Plus" size={16} />
                  </span>
                </button>
                <div style={{ maxHeight: openFaq === i ? "400px" : "0", overflow: "hidden", transition: "max-height 0.4s ease, opacity 0.3s ease", opacity: openFaq === i ? 1 : 0 }}>
                  <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem", lineHeight: 1.9, color: "var(--graphite-light)", paddingBottom: "2rem", paddingRight: "1rem" }}>
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--rule)" }} />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        ref={contact.ref}
        style={{ borderTop: "1px solid var(--rule)", backgroundColor: "var(--graphite)", ...contact.style }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="section-pad">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(245,242,238,0.35)", marginBottom: "2rem" }}>
                Контакты
              </p>
              <h2 style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, lineHeight: 1.25, color: "var(--cream)", marginBottom: "1.5rem" }}>
                Запросить<br />установочную встречу
              </h2>
              <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem", lineHeight: 1.9, color: "rgba(245,242,238,0.5)", marginBottom: "3rem" }}>
                Установочная встреча — 50 минут. Это возможность понять контекст
                и формат предстоящей работы.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <a
                  href="mailto:anna.uvarova2012@yandex.ru"
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(245,242,238,0.45)", textDecoration: "none", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <Icon name="Mail" size={14} />
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem", wordBreak: "break-all" }}>anna.uvarova2012@yandex.ru</span>
                </a>
                <a
                  href="tel:+79269191718"
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "rgba(245,242,238,0.45)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <Icon name="Phone" size={14} />
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem" }}>+7 926 919-17-18</span>
                </a>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "rgba(245,242,238,0.45)" }}>
                  <Icon name="MapPin" size={14} />
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem" }}>Москва, Цветной б-р. 26 стр. 1</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  borderBottom: "1px solid rgba(216,211,204,0.25)",
                  padding: "1rem 0",
                  fontFamily: "IBM Plex Sans, sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--cream)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.7)")}
                onBlur={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.25)")}
              />
              <input
                type="text"
                placeholder="Номер мобильного"
                value={contactVal}
                onChange={(e) => setContactVal(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  borderBottom: "1px solid rgba(216,211,204,0.25)",
                  padding: "1rem 0",
                  fontFamily: "IBM Plex Sans, sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--cream)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.7)")}
                onBlur={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.25)")}
              />
              <textarea
                rows={4}
                placeholder="Кратко о запросе (необязательно)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  borderBottom: "1px solid rgba(216,211,204,0.25)",
                  padding: "1rem 0",
                  fontFamily: "IBM Plex Sans, sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--cream)",
                  outline: "none",
                  resize: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.7)")}
                onBlur={(e) => (e.target.style.borderBottomColor = "rgba(216,211,204,0.25)")}
              />
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", paddingTop: "0.5rem" }}>
                <div
                  onClick={() => setAgreed(!agreed)}
                  style={{
                    width: "16px",
                    height: "16px",
                    flexShrink: 0,
                    border: "1px solid rgba(216,211,204,0.4)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: agreed ? "rgba(245,242,238,0.15)" : "transparent",
                    transition: "background-color 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {agreed && <Icon name="Check" size={10} style={{ color: "var(--cream)" }} />}
                </div>
                <span
                  style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.75rem", color: "rgba(245,242,238,0.45)", lineHeight: 1.6 }}
                  onClick={() => setAgreed(!agreed)}
                >
                  Я ознакомился(ась) с{" "}
                  <a
                    href="/privacy"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "rgba(245,242,238,0.65)", textDecoration: "underline" }}
                  >
                    политикой конфиденциальности
                  </a>{" "}
                  и даю согласие на обработку персональных данных
                </span>
              </label>
              <div style={{ paddingTop: "0.5rem" }}>
                {status === "sent" ? (
                  <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.85rem", color: "rgba(245,242,238,0.65)", textAlign: "center", padding: "16px 0" }}>
                    Заявка отправлена. Я свяжусь с вами в ближайшее время.
                  </p>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={!name.trim() || !contactVal.trim() || !agreed || status === "sending"}
                      style={{
                        width: "100%",
                        backgroundColor: "var(--cream)",
                        color: "var(--graphite)",
                        fontFamily: "IBM Plex Sans, sans-serif",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        padding: "16px 32px",
                        border: "none",
                        cursor: (!name.trim() || !contactVal.trim() || !agreed || status === "sending") ? "not-allowed" : "pointer",
                        opacity: (!name.trim() || !contactVal.trim() || !agreed || status === "sending") ? 0.45 : 1,
                        transition: "opacity 0.3s ease",
                      }}
                    >
                      {status === "sending" ? "Отправляем..." : "Отправить запрос"}
                    </button>
                    {status === "error" && (
                      <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.75rem", color: "rgba(255,100,100,0.7)", marginTop: "0.75rem", textAlign: "center" }}>
                        Ошибка отправки. Попробуйте позже или напишите напрямую.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(216,211,204,0.12)", backgroundColor: "var(--graphite)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="footer-inner">
          <p style={{ fontFamily: "Cormorant, serif", fontSize: "1rem", letterSpacing: "0.18em", color: "rgba(245,242,238,0.25)" }}>A·U</p>
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.65rem", color: "rgba(245,242,238,0.25)", textAlign: "center" }}>
            ИП Уварова А. С. · ОГРНИП 322508100398078 · Права защищены ·{" "}
            <a href="/privacy" style={{ color: "rgba(245,242,238,0.25)", textDecoration: "underline" }}>Политика конфиденциальности</a>
          </p>
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.7rem", color: "rgba(245,242,238,0.2)" }}>© 2024 Анна Уварова</p>
        </div>
      </footer>
    </>
  );
}