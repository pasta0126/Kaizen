import { useState } from "react";

export default function QuickLogBar({ indicators, onQuickLog }) {
  const [search, setSearch] = useState("");

  if (indicators.length === 0) {
    return (
      <p className="quicklog-empty">
        No tienes indicadores todavía — ve a la pestaña "Indicadores" para crear el primero.
      </p>
    );
  }

  const visible = indicators
    .filter((ind) => ind.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  return (
    <div className="quicklog">
      {indicators.length > 5 && (
        <input
          type="search"
          className="indicator-search"
          placeholder="Buscar indicador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      <div className="quicklog-bar">
        {visible.map((ind) =>
          ind.rule_type === "variant" ? (
            <div className="quicklog-group" key={ind.id}>
              <span className="quicklog-name">{ind.name}</span>
              {ind.variants.map((v) => (
                <button
                  key={v.id}
                  className="btn btn-log"
                  onClick={() => onQuickLog({ indicator_id: ind.id, variant_id: v.id })}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ) : (
            <button key={ind.id} className="btn btn-log" onClick={() => onQuickLog({ indicator_id: ind.id })}>
              {ind.name}
            </button>
          )
        )}
        {visible.length === 0 && <span className="quicklog-empty">Ningún indicador coincide con "{search}".</span>}
      </div>
    </div>
  );
}
