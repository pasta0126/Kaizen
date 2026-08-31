import { useEffect, useMemo, useRef } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const MIN_BAR_SLOT = 32;

function formatDMY(isoDate) {
  return `${isoDate.slice(8, 10)}-${isoDate.slice(5, 7)}-${isoDate.slice(0, 4)}`;
}

function DayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const day = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{formatDMY(day.date)}</strong>
      <span>{day.total > 0 ? `+${day.total}` : day.total} pts</span>
      <span>{day.entry_count} registros</span>
    </div>
  );
}

export default function DailyBarChart({ days, today, selectedDate, onSelectDay, loading }) {
  const scrollRef = useRef(null);
  const data = useMemo(() => {
    const nonZero = days.filter((d) => d.total !== 0);
    const todayDay = days.find((d) => d.date === today);
    if (todayDay && !nonZero.some((d) => d.date === today)) {
      nonZero.push(todayDay);
      nonZero.sort((a, b) => a.date.localeCompare(b.date));
    }
    return nonZero;
  }, [days, today]);
  const width = Math.max(data.length * MIN_BAR_SLOT, 1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [data.length]);

  if (loading) {
    return (
      <div className="bar-chart-wrap">
        <div className="chart-skeleton" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bar-chart-wrap">
        <p className="entry-empty">Aún no hay registros con puntuación.</p>
      </div>
    );
  }

  return (
    <div className="bar-chart-wrap" ref={scrollRef}>
      <div style={{ width, minWidth: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDMY(d).slice(0, 5)}
              tick={{ fill: "var(--text-dim)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--text-dim)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<DayTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              animationDuration={500}
              onClick={(bar) => onSelectDay(bar.date)}
              cursor="pointer"
              minPointSize={3}
              fill="#16a34a"
            >
              {data.map((day) => (
                <Cell
                  key={day.date}
                  fill="#16a34a"
                  stroke={day.date === selectedDate ? "var(--text)" : "none"}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
