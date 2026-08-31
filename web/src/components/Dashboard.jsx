import { useEffect, useState } from "react";
import { api } from "../api";
import Heatmap from "./Heatmap";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

function shiftMonth(year, month, delta) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function scoreLabel(total) {
  return total > 0 ? `+${total}` : `${total}`;
}

export default function Dashboard({ indicatorsById, refreshSignal }) {
  const [granularity, setGranularity] = useState("day");
  const [cursor, setCursor] = useState(isoDate(new Date()));
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);

  const [heatmapDays, setHeatmapDays] = useState([]);
  const [periodData, setPeriodData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.dashboardHeatmap().then((res) => setHeatmapDays(res.days));
  }, [refreshSignal]);

  useEffect(() => {
    setLoading(true);
    const load =
      granularity === "day"
        ? api.dashboardDay(cursor)
        : granularity === "week"
          ? api.dashboardWeek(cursor)
          : granularity === "month"
            ? api.dashboardMonth(year, month)
            : api.dashboardYear(year);
    load.then((data) => {
      setPeriodData(data);
      setLoading(false);
    });
  }, [granularity, cursor, year, month, refreshSignal]);

  function selectDay(date) {
    setCursor(date);
    setGranularity("day");
  }

  function goPrev() {
    if (granularity === "day") setCursor((c) => shiftDate(c, -1));
    else if (granularity === "week") setCursor((c) => shiftDate(c, -7));
    else if (granularity === "month") setMonth((m) => {
      const { year: y, month: nm } = shiftMonth(year, m, -1);
      setYear(y);
      return nm;
    });
    else setYear((y) => y - 1);
  }

  function goNext() {
    if (granularity === "day") setCursor((c) => shiftDate(c, 1));
    else if (granularity === "week") setCursor((c) => shiftDate(c, 7));
    else if (granularity === "month") setMonth((m) => {
      const { year: y, month: nm } = shiftMonth(year, m, 1);
      setYear(y);
      return nm;
    });
    else setYear((y) => y + 1);
  }

  return (
    <div className="dashboard">
      <Heatmap days={heatmapDays} selectedDate={granularity === "day" ? cursor : null} onSelectDay={selectDay} />

      <div className="period-switcher">
        {["day", "week", "month", "year"].map((g) => (
          <button
            key={g}
            className={g === granularity ? "btn btn-tab btn-tab-active" : "btn btn-tab"}
            onClick={() => setGranularity(g)}
          >
            {{ day: "Día", week: "Semana", month: "Mes", year: "Año" }[g]}
          </button>
        ))}
        <div className="period-nav">
          <button className="btn btn-ghost" onClick={goPrev}>
            ‹
          </button>
          <button className="btn btn-ghost" onClick={goNext}>
            ›
          </button>
        </div>
      </div>

      {loading || !periodData ? (
        <p>Cargando…</p>
      ) : (
        <PeriodView granularity={granularity} data={periodData} indicatorsById={indicatorsById} />
      )}
    </div>
  );
}

function PeriodView({ granularity, data, indicatorsById }) {
  if (granularity === "day") {
    return (
      <div className="period-view">
        <h2>
          {data.date} · total {scoreLabel(data.total)}
        </h2>
        <ul className="entry-list">
          {data.entries.length === 0 && <li className="entry-empty">Sin registros este día.</li>}
          {data.entries.map((e) => (
            <li key={e.id} className="entry-row">
              <span>{indicatorsById[e.indicator_id]?.name ?? "Indicador"}</span>
              <span className={e.score >= 0 ? "score-pos" : "score-neg"}>{scoreLabel(e.score)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (granularity === "week") {
    return (
      <div className="period-view">
        <h2>
          Semana {data.week_start} → {data.week_end} · total {scoreLabel(data.total)}
        </h2>
        <ul className="entry-list">
          {data.days.map((d) => (
            <li key={d.date} className="entry-row">
              <span>{d.date}</span>
              <span className={d.total >= 0 ? "score-pos" : "score-neg"}>{scoreLabel(d.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (granularity === "month") {
    return (
      <div className="period-view">
        <h2>
          {data.year}-{String(data.month).padStart(2, "0")} · total {scoreLabel(data.total)}
        </h2>
        <ul className="entry-list">
          {data.days.map((d) => (
            <li key={d.date} className="entry-row">
              <span>{d.date}</span>
              <span className={d.total >= 0 ? "score-pos" : "score-neg"}>{scoreLabel(d.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="period-view">
      <h2>
        {data.year} · total {scoreLabel(data.total)}
      </h2>
      <ul className="entry-list">
        {data.months.map((m) => (
          <li key={m.month} className="entry-row">
            <span>{String(m.month).padStart(2, "0")}</span>
            <span className={m.total >= 0 ? "score-pos" : "score-neg"}>{scoreLabel(m.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
