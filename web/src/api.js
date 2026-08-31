import { getValidAccessToken, signOut } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `request failed with status ${status}`);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = await getValidAccessToken();
  if (!token) {
    signOut();
    throw new ApiError(401, "not signed in");
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    signOut();
    throw new ApiError(401, "session expired");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  listIndicators: (includeArchived = false) =>
    request(`/indicators${includeArchived ? "?include_archived=true" : ""}`),
  createIndicator: (indicator) => request("/indicators", { method: "POST", body: indicator }),
  updateIndicator: (id, patch) => request(`/indicators/${id}`, { method: "PATCH", body: patch }),
  archiveIndicator: (id) => request(`/indicators/${id}/archive`, { method: "POST" }),

  createLog: (log) => request("/logs", { method: "POST", body: log }),
  deleteLog: (id) => request(`/logs/${id}`, { method: "DELETE" }),

  dashboardDay: (date) => request(`/dashboard/day${date ? `?date=${date}` : ""}`),
  dashboardWeek: (date) => request(`/dashboard/week${date ? `?date=${date}` : ""}`),
  dashboardMonth: (year, month) => request(`/dashboard/month?year=${year}&month=${month}`),
  dashboardYear: (year) => request(`/dashboard/year?year=${year}`),
  dashboardHeatmap: (from, to) =>
    request(`/dashboard/heatmap?${from ? `date_from=${from}&` : ""}${to ? `date_to=${to}` : ""}`),
};

export { ApiError, api };
