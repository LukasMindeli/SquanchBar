import "./App.css";

export default function App() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="title">Squanch Bar</div>
          <div className="subtitle">Neon • Glass • Menu</div>
        </div>
      </header>

      <main className="content">
        <div className="card">
          <h1>Меню</h1>
          <p>
            Если ты это видишь — базовый каркас готов. Дальше подключим menuData,
            табы, поиск и карточки.
          </p>
        </div>
      </main>
    </div>
  );
}