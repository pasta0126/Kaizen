const MAX_POINTS = 50;
const SQUARES = 5;
const VISIBLE_DAYS = 20;

// Below 26 points each square is worth 5 (green tier, caps at 25).
// From 26 points each square is worth 10 (gold tier, caps at 50).
function squaresFor(total) {
  const points = Math.max(0, Math.min(MAX_POINTS, total));
  if (points === 0) return Array(SQUARES).fill("empty");

  const unit = points <= 25 ? 5 : 10;
  const tier = points <= 25 ? "green" : "gold";
  const filled = Math.min(SQUARES, Math.floor(points / unit));
  const remainder = points - filled * unit;

  return Array.from({ length: SQUARES }, (_, i) => {
    if (i < filled) return `${tier}-medium`;
    if (i === filled && remainder > 0) return `${tier}-light`;
    return "empty";
  });
}

export default function Heatmap({ days, selectedDate, onSelectDay }) {
  const visibleDays = days.slice(-VISIBLE_DAYS);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap">
        {visibleDays.map((day) => (
          <button
            key={day.date}
            className={`heatmap-col ${day.date === selectedDate ? "heatmap-col-selected" : ""}`}
            title={`${day.date}: ${day.total}`}
            onClick={() => onSelectDay(day.date)}
          >
            {squaresFor(day.total)
              .slice()
              .reverse()
              .map((level, i) => (
                <span key={i} className={`heatmap-cell heatmap-${level}`} />
              ))}
          </button>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-cell heatmap-empty" />
        <span>0</span>
        <span className="heatmap-cell heatmap-green-light" />
        <span className="heatmap-cell heatmap-green-medium" />
        <span>1-25</span>
        <span className="heatmap-cell heatmap-gold-light" />
        <span className="heatmap-cell heatmap-gold-medium" />
        <span>26-50</span>
      </div>
    </div>
  );
}
