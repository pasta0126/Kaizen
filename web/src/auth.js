// Sign-in against the shared GoTrue instance (Google OAuth, implicit web flow).
// GoTrue redirects back to this app with the session in the URL fragment
// (#access_token=...&refresh_token=...&expires_in=...); we store it and
// refresh it transparently before it expires.

const AUTH_URL = import.meta.env.VITE_AUTH_URL;
const STORAGE_KEY = "kaizen.session";

function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// If GoTrue just redirected back here with tokens in the URL hash, consume
// them into storage and strip the hash so it isn't left in the address bar.
function consumeRedirectSession() {
  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token")) return;

  const params = new URLSearchParams(hash.slice(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const expires_in = Number(params.get("expires_in") || 0);
  if (!access_token || !refresh_token) return;

  saveSession({
    access_token,
    refresh_token,
    expires_at: Date.now() + expires_in * 1000,
  });
  window.history.replaceState(null, "", window.location.pathname);
}

function signInWithGoogle() {
  const redirectTo = window.location.origin;
  window.location.href = `${AUTH_URL}/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

async function refreshSession(session) {
  const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = await res.json();
  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + Number(data.expires_in || 0) * 1000,
  };
  saveSession(next);
  return next;
}

// Returns a currently-valid access token, refreshing first if it is close to
// expiring, or null if the caller is signed out / the session could not be
// refreshed.
async function getValidAccessToken() {
  let session = loadSession();
  if (!session) return null;

  const closeToExpiry = session.expires_at - Date.now() < 60_000;
  if (closeToExpiry) {
    session = await refreshSession(session);
    if (!session) return null;
  }
  return session.access_token;
}

function isSignedIn() {
  return loadSession() !== null;
}

function signOut() {
  clearSession();
}

export { consumeRedirectSession, signInWithGoogle, getValidAccessToken, isSignedIn, signOut };
