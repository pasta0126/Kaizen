import { useState } from "react";
import { api } from "../api";
import IndicatorForm from "./IndicatorForm";

function ruleSummary(indicator) {
  if (indicator.rule_type === "per_occurrence") {
    return `siempre ${indicator.per_occurrence_value >= 0 ? "+" : ""}${indicator.per_occurrence_value}`;
  }
  if (indicator.rule_type === "first_then_repeat") {
    return `1ª del día ${indicator.first_value >= 0 ? "+" : ""}${indicator.first_value}, luego ${
      indicator.repeat_value >= 0 ? "+" : ""
    }${indicator.repeat_value}`;
  }
  return `según variante: ${indicator.variants.map((v) => `${v.label} (${v.value >= 0 ? "+" : ""}${v.value})`).join(", ")}`;
}

export default function IndicatorManager({ indicators, onChanged, onQuickLog }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function handleCreate(body) {
    await api.createIndicator(body);
    setCreating(false);
    onChanged();
  }

  async function handleUpdate(id, body) {
    await api.updateIndicator(id, body);
    setEditingId(null);
    onChanged();
  }

  async function handleArchive(id) {
    setBusyId(id);
    await api.archiveIndicator(id);
    setBusyId(null);
    onChanged();
  }

  return (
    <div className="indicator-manager">
      <div className="indicator-manager-header">
        <h2>Indicadores</h2>
        {!creating && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + Nuevo indicador
          </button>
        )}
      </div>

      {creating && (
        <IndicatorForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      )}

      <ul className="indicator-list">
        {indicators.map((ind) =>
          editingId === ind.id ? (
            <li key={ind.id} className="indicator-row indicator-row-editing">
              <IndicatorForm
                initial={ind}
                onSubmit={(body) => handleUpdate(ind.id, body)}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={ind.id} className="indicator-row">
              <div className="indicator-info">
                <strong>{ind.name}</strong>
                <span className="indicator-rule">{ruleSummary(ind)}</span>
              </div>
              <div className="indicator-actions">
                {ind.rule_type === "variant" ? (
                  ind.variants.map((v) => (
                    <button
                      key={v.id}
                      className="btn btn-log"
                      onClick={() => onQuickLog({ indicator_id: ind.id, variant_id: v.id })}
                    >
                      {v.label}
                    </button>
                  ))
                ) : (
                  <button className="btn btn-log" onClick={() => onQuickLog({ indicator_id: ind.id })}>
                    Registrar
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setEditingId(ind.id)}>
                  Editar
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busyId === ind.id}
                  onClick={() => handleArchive(ind.id)}
                >
                  Archivar
                </button>
              </div>
            </li>
          )
        )}
        {indicators.length === 0 && !creating && (
          <li className="entry-empty">Aún no tienes indicadores. Crea el primero arriba.</li>
        )}
      </ul>
    </div>
  );
}
