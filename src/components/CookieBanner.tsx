import { useState, useEffect } from "react";

const COOKIE_KEY = "cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--graphite)] text-[var(--cream)] text-sm font-['IBM_Plex_Sans',sans-serif] flex-wrap">
      <p className="leading-relaxed opacity-90">
        Этот сайт использует файлы cookie для улучшения работы.{" "}
        <a
          href="/privacy"
          className="underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          Политика конфиденциальности
        </a>
      </p>
      <button
        onClick={accept}
        className="shrink-0 px-5 py-2 border border-[var(--cream)] text-[var(--cream)] hover:bg-[var(--cream)] hover:text-[var(--graphite)] transition-colors text-sm tracking-wide"
      >
        Принять
      </button>
    </div>
  );
}
