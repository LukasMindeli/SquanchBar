import { useEffect, useMemo, useRef, useState } from "react";
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

  // --- Laser trail refs ---
  const canvasRef = useRef(null);
  const pointsRef = useRef([]); // {x,y,t}

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 3000);
    const t2 = setTimeout(() => setShowSplash(false), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // --- Laser trail effect (canvas overlay) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const lifeMs = 420;
    let raf = 0;

    function draw() {
      raf = requestAnimationFrame(draw);

      const now = performance.now();
      const pts = pointsRef.current;

      while (pts.length && now - pts[0].t > lifeMs) pts.shift();

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (pts.length < 2) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const age = now - b.t;
        const k = 1 - Math.min(1, age / lifeMs);

        const width = 10 * k + 1;

        // glow
        ctx.lineWidth = width;
        ctx.strokeStyle = `rgba(170, 110, 255, ${0.35 * k})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // core
        ctx.lineWidth = Math.max(1, width * 0.35);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * k})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    raf = requestAnimationFrame(draw);

    function addPoint(x, y) {
      pointsRef.current.push({ x, y, t: performance.now() });
      if (pointsRef.current.length > 80) pointsRef.current.shift();
    }

    function onPointerDown(e) {
      addPoint(e.clientX, e.clientY);
    }

    function onPointerMove(e) {
      // touch: always draw while moving finger
      if (e.pointerType === "touch") {
        addPoint(e.clientX, e.clientY);
        return;
      }
      // mouse: draw only while button is held
      if (e.buttons === 0) return;
      addPoint(e.clientX, e.clientY);
    }

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- Menu state ---
  const [activeTab, setActiveTab] = useState("food");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const q = normalize(query);

  // --- Ripple (neon wave) ---
  function spawnRipple(e, variant = "red") {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const size = Math.max(rect.width, rect.height) * 1.4;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;

    const color =
      variant === "green"
        ? "rgba(80, 255, 140, 0.55)"
        : variant === "purple"
        ? "rgba(170, 110, 255, 0.55)"
        : "rgba(255, 70, 70, 0.55)";

    ripple.style.background = `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 65%)`;

    card.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  }

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
      {/* Laser overlay (above everything) */}
      <canvas ref={canvasRef} className="laserCanvas" />

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
          </div>

          <button
            className={
              "hitBtn " + (activeTab === "hits" && q.length === 0 ? "active" : "")
            }
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
          {q.length > 0 && (
            <div className="hint">Поиск активен: категории игнорируются</div>
          )}
        </div>

        <section className="grid">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="card"
              onClick={() => setSelectedItem(item)}
              onPointerDown={(e) => {
                const variant =
                  item.category === "dessert"
                    ? "green"
                    : item.category === "drinks"
                    ? "purple"
                    : "red";
                spawnRipple(e, variant);
              }}
            >
              <div className="imgWrap">
                <img
                  className="img"
                  src={imgHref(item.image)}
                  alt={item.title}
                  loading="lazy"
                />
                <div className="price">
                  {item.price} <span className="uah">грн</span>
                  {item.size && <span className="size"> • {item.size}</span>}
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

      {/* Modal: full screen dish details */}
      {selectedItem && (
        <div
          className="modalOverlay"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modalClose" onClick={() => setSelectedItem(null)}>
              ✕
            </button>

            <div className="modalImgWrap">
              <img
                className="modalImg"
                src={imgHref(selectedItem.image)}
                alt={selectedItem.title}
              />
              <div className="modalPrice">
                {selectedItem.price} <span className="uah">грн</span>
                {selectedItem.size && <span className="size"> • {selectedItem.size}</span>}
              </div>
            </div>

            <div className="modalBody">
              <h2 className="modalTitle">{selectedItem.title}</h2>
              {selectedItem.desc && <p className="modalDesc">{selectedItem.desc}</p>}

              {Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0 && (
                <div className="tags">
                  {selectedItem.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}