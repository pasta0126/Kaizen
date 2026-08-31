import { useEffect, useState } from "react";
import { api } from "../api";
import DailyBarChart from "./DailyBarChart";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

function scoreLabel(total) {
  return total > 0 ? `+${total}` : `${total}`;
}

function bestBy(days, key) {
  if (days.length === 0) return null;
  let best = days[0];
  for (const day of days) {
    if (day[key] >= best[key]) best = day;
  }
  return best;
}

const HISTORY_DAYS = 20;

export default function Dashboard({ indicatorsById, refreshSignal }) {
  const today = isoDate(new Date());
  const yesterday = shiftDate(today, -1);
  const historyFrom = shiftDate(today, -(HISTORY_DAYS - 1));

  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    setChartLoading(true);
    api.dashboardHeatmap(historyFrom, today).then((res) => {
      setDays(res.days);
      setChartLoading(false);
    });
  }, [refreshSignal]);

  useEffect(() => {
    setLoading(true);
    api.dashboardDay(selectedDate).then((data) => {
      setDayData(data);
      setLoading(false);
    });
  }, [selectedDate, refreshSignal]);

  const todayTotal = days.find((d) => d.date === today)?.total ?? 0;
  const yesterdayTotal = days.find((d) => d.date === yesterday)?.total ?? 0;
  const delta = todayTotal - yesterdayTotal;
  const bestScoreDay = bestBy(days, "total");
  const bestEntriesDay = bestBy(days, "entry_count");

  return (
    <div className="dashboard">
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Ayer</span>
          <span className="stat-value">{scoreLabel(yesterdayTotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hoy</span>
          <span className="stat-value">{scoreLabel(todayTotal)}</span>
          <span className={delta > 0 ? "stat-sub score-pos" : delta < 0 ? "stat-sub score-neg" : "stat-sub"}>
            {delta === 0 ? "= que ayer" : delta > 0 ? `↑ +${delta} vs. ayer` : `↓ ${delta} vs. ayer`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Máx. puntuación</span>
          <span className="stat-value">{bestScoreDay ? scoreLabel(bestScoreDay.total) : "—"}</span>
          <span className="stat-sub">{bestScoreDay?.date ?? ""}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Máx. registros</span>
          <span className="stat-value">{bestEntriesDay ? bestEntriesDay.entry_count : "—"}</span>
          <span className="stat-sub">{bestEntriesDay?.date ?? ""}</span>
        </div>
      </div>

      <DailyBarChart
        days={days}
        today={today}
        selectedDate={selectedDate}
        onSelectDay={setSelectedDate}
        loading={chartLoading}
      />

      <div className="period-view">
        <h2>
          {selectedDate} · total {dayData ? scoreLabel(dayData.total) : "…"}
        </h2>
        {loading || !dayData ? (
          <p>Cargando…</p>
        ) : (
          <ul className="entry-list">
            {dayData.entries.length === 0 && <li className="entry-empty">Sin registros este día.</li>}
            {dayData.entries.map((e) => (
              <li key={e.id} className="entry-row">
                <span>{indicatorsById[e.indicator_id]?.name ?? "Indicador"}</span>
                <span className={e.score >= 0 ? "score-pos" : "score-neg"}>{scoreLabel(e.score)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
