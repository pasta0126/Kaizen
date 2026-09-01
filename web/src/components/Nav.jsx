import navIcon from "../assets/nav-icon.png";

export default function Nav({ tab, onTabChange, onSignOut }) {
  return (
    <header className="nav">
      <button type="button" className="nav-home" onClick={() => onTabChange("dashboard")}>
        <img src={navIcon} alt="" className="nav-icon" />
        <span className="nav-title">Kaizen</span>
      </button>
      <nav className="nav-tabs">
        <button
          className={tab === "dashboard" ? "nav-tab nav-tab-active" : "nav-tab"}
          onClick={() => onTabChange("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={tab === "indicators" ? "nav-tab nav-tab-active" : "nav-tab"}
          onClick={() => onTabChange("indicators")}
        >
          Indicadores
        </button>
      </nav>
      <button className="btn btn-ghost" onClick={onSignOut}>
        Salir
      </button>
    </header>
  );
}
