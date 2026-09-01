// Fixed, product-owned category set. Mirrors ALLOWED_CATEGORIES in
// server/kaizen_api/routes/indicators.py. Each category has one stable color
// used for its indicators' logging buttons.

export const UNCATEGORIZED = { label: "Sin categoría", color: "#4f7cff" };

export const CATEGORIES = [
  { label: "Salud", color: "#2fae66" },
  { label: "Productividad", color: "#e0873a" },
  { label: "Relaciones", color: "#d5568c" },
  { label: "Finanzas", color: "#3aa5b8" },
  { label: "Crecimiento personal", color: "#8a63d2" },
  { label: "Ocio y descanso", color: "#c9a227" },
];

const BY_LABEL = new Map(CATEGORIES.map((c) => [c.label, c]));

export function colorForCategory(category) {
  return BY_LABEL.get(category)?.color ?? UNCATEGORIZED.color;
}
