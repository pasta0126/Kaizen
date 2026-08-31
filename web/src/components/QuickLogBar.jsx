export default function QuickLogBar({ indicators, onQuickLog }) {
  if (indicators.length === 0) {
    return (
      <p className="quicklog-empty">
        No tienes indicadores todavía — ve a la pestaña "Indicadores" para crear el primero.
      </p>
    );
  }

  return (
    <div className="quicklog-bar">
      {indicators.map((ind) =>
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
    </div>
  );
}
