import { useState } from "react";

const emptyVariant = () => ({ label: "", value: 0 });

export default function IndicatorForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [ruleType, setRuleType] = useState(initial?.rule_type ?? "per_occurrence");
  const [perOccurrenceValue, setPerOccurrenceValue] = useState(initial?.per_occurrence_value ?? 1);
  const [firstValue, setFirstValue] = useState(initial?.first_value ?? 0);
  const [repeatValue, setRepeatValue] = useState(initial?.repeat_value ?? -1);
  const [variants, setVariants] = useState(
    initial?.variants?.length ? initial.variants.map((v) => ({ label: v.label, value: v.value })) : [emptyVariant()]
  );
  const [error, setError] = useState(null);

  function updateVariant(i, field, value) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  }

  function submit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const body = { name: name.trim(), rule_type: ruleType };
    if (ruleType === "per_occurrence") {
      body.per_occurrence_value = Number(perOccurrenceValue);
    } else if (ruleType === "first_then_repeat") {
      body.first_value = Number(firstValue);
      body.repeat_value = Number(repeatValue);
    } else {
      const cleaned = variants.filter((v) => v.label.trim() !== "");
      if (cleaned.length === 0) {
        setError("Añade al menos una variante.");
        return;
      }
      body.variants = cleaned.map((v) => ({ label: v.label.trim(), value: Number(v.value) }));
    }

    onSubmit(body);
  }

  return (
    <form className="indicator-form" onSubmit={submit}>
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Comer saludable" />
      </label>

      <label>
        Tipo de puntuación
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
          <option value="per_occurrence">Siempre el mismo valor</option>
          <option value="first_then_repeat">La primera vez del día distinto que las siguientes</option>
          <option value="variant">Depende de una variante elegida al registrar</option>
        </select>
      </label>

      {ruleType === "per_occurrence" && (
        <label>
          Valor por registro
          <input
            type="number"
            value={perOccurrenceValue}
            onChange={(e) => setPerOccurrenceValue(e.target.value)}
          />
        </label>
      )}

      {ruleType === "first_then_repeat" && (
        <div className="form-row">
          <label>
            Primera vez del día
            <input type="number" value={firstValue} onChange={(e) => setFirstValue(e.target.value)} />
          </label>
          <label>
            Siguientes veces
            <input type="number" value={repeatValue} onChange={(e) => setRepeatValue(e.target.value)} />
          </label>
        </div>
      )}

      {ruleType === "variant" && (
        <div className="variant-editor">
          {variants.map((v, i) => (
            <div className="form-row" key={i}>
              <input
                placeholder="Etiqueta (p. ej. sin azúcar)"
                value={v.label}
                onChange={(e) => updateVariant(i, "label", e.target.value)}
              />
              <input
                type="number"
                value={v.value}
                onChange={(e) => updateVariant(i, "value", e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setVariants((vs) => [...vs, emptyVariant()])}>
            + variante
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Guardar
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
