import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { MENU, TABS } from "./menuData.js";
import introVideo from "./assets/intro.mp4";

function imgHref(file) {
  return new URL(`./assets/menu/${file}`, import.meta.url).href;
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[“”„«»"]/g, '"')
    .trim();
}

export default function App() {
  // --- Splash state ---
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 3 секунды показываем видео, затем fade
    const t1 = setTimeout(() => setFadeOut(true), 3000);
    const t2 = setTimeout(() => setShowSplash(false), 3400); // fade ~0.4s
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // --- Menu state (твоя текущая логика) ---
  const [activeTab, setActiveTab] = useState("food");
  const [query, setQuery] = useState("");

  const q = normalize(query);

  const filtered = useMemo(() => {
    if (q.length > 0) {
      return MENU.filter((item) => {
        const hay = normalize(
          `${item.title} ${item.desc} ${(item.tags || []).join(" ")}`
        );
        return hay.includes(q);
      });
    }
    if (activeTab === "all") return MENU;
    if (activeTab === "hits") {
      return MENU.filter((i) =>
        (i.tags || []).some((t) => normalize(t) === "хит")
      );
    }
    return MENU.filter((item) => item.category === activeTab);
  }, [q, activeTab]);

  const countLabel = useMemo(() => {
    if (q.length > 0) return `Найдено: ${filtered.length}`;
    if (activeTab === "hits") return `Хиты: ${filtered.length}`;
    const tab = TABS.find((t) => t.id === activeTab);
    return `${tab?.label ?? "Меню"}: ${filtered.length}`;
  }, [q, filtered.length, activeTab]);

  return (
    <div className="page">
      {showSplash && (
        <div className={"splash " + (fadeOut ? "fade" : "")}>
          <video
            className="splashVideo"
            src={introVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
          />
        </div>
      )}

      <div className="glow" />

      <header className="topbar">
        <div className="brand">
          <div className="title">Squanch Bar</div>
        </div>

        <div className="actions">
          <div className="searchWrap">
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по всему меню…"
              inputMode="search"
            />
            {query && (
              <button className="clear" onClick={() => setQuery("")} title="Очистить">
                ✕
              </button>
            )}
          </div>

          <button
            className={"hitBtn " + (activeTab === "hits" && q.length === 0 ? "active" : "")}
            onClick={() => {
              if (q.length > 0) setQuery("");
              setActiveTab((prev) => (prev === "hits" ? "food" : "hits"));
            }}
            title="Показать хиты"
          >
            Хиты
          </button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => {
          const isActive = q.length === 0 && activeTab === t.id;
          return (
            <button
              key={t.id}
              className={
              "tab " +
              (isActive ? "active " : "") +
              (t.id === "food" ? "tab-red " : "") +
              (t.id === "dessert" ? "tab-green " : "") +
              (t.id === "drinks" ? "tab-purple " : "")
              }
              onClick={() => setActiveTab(t.id)}
              disabled={q.length > 0}
              title={q.length > 0 ? "Очисти поиск, чтобы переключать категории" : ""}
              >
              {t.label}
            </button>
          );
        })}
      </nav>

      <main className="content">
        <div className="metaRow">
          <div className="count">{countLabel}</div>
          {q.length > 0 && <div className="hint">Поиск активен: категории игнорируются</div>}
        </div>

        <section className="grid">
          {filtered.map((item) => (
            <article key={item.id} className="card">
              <div className="imgWrap">
                <img className="img" src={imgHref(item.image)} alt={item.title} loading="lazy" />
                <div className="price">
                  {item.price} <span className="uah">грн</span>
                </div>
              </div>

              <div className="body">
                <h3 className="name">{item.title}</h3>
                {item.desc && <p className="desc">{item.desc}</p>}

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="tags">
                    {item.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {filtered.length === 0 && (
          <div className="empty">
            Ничего не найдено. Попробуй другое слово (например: “хит”, “остро”, “бургер”).
          </div>
        )}
      </main>
    </div>
  );
}