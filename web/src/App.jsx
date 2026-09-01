import { useEffect, useState } from "react";
import { consumeRedirectSession, isSignedIn, signOut } from "./auth";
import { api } from "./api";
import SignIn from "./components/SignIn";
import Nav from "./components/Nav";
import Dashboard from "./components/Dashboard";
import IndicatorManager from "./components/IndicatorManager";
import QuickLogBar from "./components/QuickLogBar";
import "./App.css";

consumeRedirectSession();

export default function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [tab, setTab] = useState("dashboard");
  const [indicators, setIndicators] = useState([]);
  const [refreshSignal, setRefreshSignal] = useState(0);

  function loadIndicators() {
    api.listIndicators().then(setIndicators);
  }

  useEffect(() => {
    if (signedIn) loadIndicators();
  }, [signedIn]);

  if (!signedIn) {
    return <SignIn />;
  }

  const indicatorsById = Object.fromEntries(indicators.map((i) => [i.id, i]));

  async function handleQuickLog(body) {
    await api.createLog(body);
    setRefreshSignal((n) => n + 1);
  }

  function handleSignOut() {
    signOut();
    setSignedIn(false);
  }

  return (
    <div className="app">
      <Nav tab={tab} onTabChange={setTab} onSignOut={handleSignOut} />
      <main className="app-main">
        {tab === "dashboard" ? (
          <>
            <QuickLogBar indicators={indicators} onQuickLog={handleQuickLog} />
            <Dashboard
              indicatorsById={indicatorsById}
              refreshSignal={refreshSignal}
              onEntryDeleted={() => setRefreshSignal((n) => n + 1)}
            />
          </>
        ) : (
          <IndicatorManager
            indicators={indicators}
            onChanged={loadIndicators}
            onQuickLog={handleQuickLog}
          />
        )}
      </main>
    </div>
  );
}
