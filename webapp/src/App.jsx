import { useMemo, useState } from "react";
import "./App.css";
import { MENU, TABS } from "./menuData.js";

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
  const [activeTab, setActiveTab] = useState("food");
  const [query, setQuery] = useState("");

  const q = normalize(query);

  const filtered = useMemo(() => {
    // Поиск НЕ пустой -> игнорируем таб и ищем по всем категориям
    if (q.length > 0) {
      return MENU.filter((item) => {
        const hay = normalize(
          `${item.title} ${item.desc} ${(item.tags || []).join(" ")}`
        );
        return hay.includes(q);
      });
    }

    // Поиск пустой -> фильтр по табу
    if (activeTab === "all") return MENU;
    return MENU.filter((item) => item.category === activeTab);
  }, [q, activeTab]);

  const hits = useMemo(() => {
    return MENU.filter((i) => (i.tags || []).some((t) => normalize(t) === "хит"));
  }, []);

  const shownItems = useMemo(() => {
    // Кнопка "Хиты" будет работать как быстрый фильтр по хиту,
    // но только когда поиск пустой (логично).
    // Реализуем через activeTab === "hits" (внутренний режим).
    if (q.length === 0 && activeTab === "hits") return hits;
    return filtered;
  }, [q, activeTab, hits, filtered]);

  const countLabel = useMemo(() => {
    if (q.length > 0) return `Найдено: ${shownItems.length}`;
    if (activeTab === "hits") return `Хиты: ${shownItems.length}`;
    const tab = TABS.find((t) => t.id === activeTab);
    return `${tab?.label ?? "Меню"}: ${shownItems.length}`;
  }, [q, shownItems.length, activeTab]);

  return (
    <div className="page">
      <div className="glow" />

      <header className="topbar">
        <div className="brand">
          <div className="title">Squanch Bar</div>
          <div className="subtitle">Neon • Glass • Menu</div>
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
              // если идет поиск — сначала чистим поиск, иначе переключаем hits
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
              className={"tab " + (isActive ? "active" : "")}
              onClick={() => setActiveTab(t.id)}
              disabled={q.length > 0} // когда поиск активен — табы “игнорируются”
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
          {shownItems.map((item) => (
            <article key={item.id} className="card">
              <div className="imgWrap">
                <img className="img" src={imgHref(item.image)} alt={item.title} loading="lazy" />
                <div className="price">
                  {item.price} <span className="uah">грн</span>
                </div>
              </div>

              <div className="body">
                <div className="row1">
                  <h3 className="name">{item.title}</h3>
                </div>

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

        {shownItems.length === 0 && (
          <div className="empty">
            Ничего не найдено. Попробуй другое слово (например: “хит”, “остро”, “бургер”).
          </div>
        )}
      </main>
    </div>
  );
}