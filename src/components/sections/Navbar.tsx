import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "./shared";

interface NavbarProps {
  scrollTo: (id: string) => void;
}

export default function Navbar({ scrollTo }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleScrollTo = (id: string) => {
    setMenuOpen(false);
    scrollTo(id);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.4s ease",
        backgroundColor: scrolled ? "rgba(245,242,238,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(8px)" : "none",
        borderBottom: scrolled ? "1px solid var(--rule)" : "none",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }} className="nav-inner h-16 flex items-center justify-between">
        <button
          onClick={() => handleScrollTo("hero")}
          style={{ color: "var(--graphite)", letterSpacing: "0.18em", fontFamily: "Cormorant, serif", fontSize: "1.1rem", background: "none", border: "none", cursor: "pointer" }}
          className="uppercase"
        >
          A·U
        </button>

        <nav className="hidden md:flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              style={{ color: "var(--graphite-light)", letterSpacing: "0.14em", fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer" }}
              className="uppercase transition-opacity duration-200 hover:opacity-50"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleScrollTo("contact")}
            style={{
              borderColor: "var(--indigo)",
              color: "var(--cream)",
              backgroundColor: "var(--indigo)",
              letterSpacing: "0.1em",
              fontFamily: "IBM Plex Sans, sans-serif",
              fontSize: "0.7rem",
              padding: "10px 20px",
              border: "1px solid var(--indigo)",
              cursor: "pointer",
            }}
            className="uppercase transition-opacity duration-200 hover:opacity-70"
          >
            Записаться
          </button>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color: "var(--graphite)", background: "none", border: "none", cursor: "pointer" }}
        >
          <Icon name={menuOpen ? "X" : "Menu"} size={20} />
        </button>
      </div>

      {menuOpen && (
        <div style={{ backgroundColor: "var(--cream)", borderTop: "1px solid var(--rule)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }} className="flex flex-col gap-5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                style={{ color: "var(--graphite-light)", letterSpacing: "0.14em", fontFamily: "IBM Plex Sans, sans-serif", fontSize: "0.7rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                className="uppercase"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}