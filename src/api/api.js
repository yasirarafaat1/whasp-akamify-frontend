import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const TOKEN_KEY = "waspakamify_token";
const WORKSPACE_KEY = "waspakamify_workspace_id";

function workspaceFromToken(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return "";
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return String(payload?.workspaceId || "");
  } catch {
    return "";
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getWorkspaceId() {
  return localStorage.getItem(WORKSPACE_KEY) || "";
}

export function setWorkspaceId(workspaceId) {
  if (!workspaceId) localStorage.removeItem(WORKSPACE_KEY);
  else localStorage.setItem(WORKSPACE_KEY, String(workspaceId));
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  const workspaceId = workspaceFromToken(token);
  if (workspaceId) setWorkspaceId(workspaceId);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  const workspaceId = getWorkspaceId();
  if (workspaceId) {
    config.headers = config.headers || {};
    config.headers["x-workspace-id"] = workspaceId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // If the token is invalid/expired, clear it so the UI can re-auth cleanly.
      setToken("");
    }
    return Promise.reject(err);
  }
);

function unwrap(res) {
  return res.data;
}

export const API = {
  baseUrl: API_BASE_URL,

  auth: {
    register: (payload) => api.post("/auth/register", payload).then(unwrap),
    login: (payload) => api.post("/auth/login", payload).then(unwrap),
    me: () => api.get("/auth/me").then(unwrap),
    rotateApiKey: () => api.post("/auth/api-key/rotate").then(unwrap),
    metaConnectUrl: () => api.get("/auth/meta").then(unwrap),
    metaSave: (payload) => api.post("/meta/save", payload).then(unwrap),
  },

  workspaces: {
    list: () => api.get("/workspaces").then(unwrap),
    create: (payload) => api.post("/workspaces", payload).then(unwrap),
  },

  credentials: {
    getWhatsApp: () => api.get("/credentials/whatsapp").then(unwrap),
    upsertWhatsApp: (payload) => api.put("/credentials/whatsapp", payload).then(unwrap),
    deleteWhatsApp: () => api.delete("/credentials/whatsapp").then(unwrap),
  },

  templates: {
    list: (params) => api.get("/templates", { params }).then(unwrap),
    create: (payload) => api.post("/templates", payload).then(unwrap),
    get: (id) => api.get(`/templates/${id}`).then(unwrap),
    update: (id, payload) => api.put(`/templates/${id}`, payload).then(unwrap),
    remove: (id) => api.delete(`/templates/${id}`).then(unwrap),
    submit: (id) => api.post(`/templates/${id}/submit`).then(unwrap),
    status: (id) => api.get(`/templates/${id}/status`).then(unwrap),
    syncMeta: (payload) => api.post("/templates/sync-meta", payload || {}).then(unwrap),
  },

  messages: {
    send: (payload) => api.post("/messages/send", payload).then(unwrap),
    bulk: (payload) => api.post("/messages/bulk", payload).then(unwrap),
    logs: (params) => api.get("/messages/logs", { params }).then(unwrap),
    byPhone: (phone, params) => api.get(`/messages/${phone}`, { params }).then(unwrap),
  },

  analytics: {
    overview: () => api.get("/analytics/overview").then(unwrap),
    template: (id) => api.get(`/analytics/template/${id}`).then(unwrap),
  },

  meta: {
    status: () => api.get("/meta/status").then(unwrap),
    save: (payload) => api.post("/meta/save", payload).then(unwrap),
  },

  links: {
    create: (payload) => api.post("/links", payload).then(unwrap),
  },

  wallet: {
    get: () => api.get("/wallet").then(unwrap),
    createRechargeOrder: (payload) => api.post("/wallet/recharge/order", payload).then(unwrap),
  },

  campaigns: {
    list: (params) => api.get("/campaigns", { params }).then(unwrap),
    create: (payload) => api.post("/campaigns", payload).then(unwrap),
  },

  conversations: {
    list: (params) => api.get("/conversations", { params }).then(unwrap),
    get: (phone) => api.get(`/conversations/${phone}`).then(unwrap),
    read: (phone) => api.post(`/conversations/${phone}/read`).then(unwrap),
  },

  contacts: {
    list: (params) => api.get("/contacts", { params }).then(unwrap),
    get: (id) => api.get(`/contacts/${id}`).then(unwrap),
    lookupByPhone: (phone) => api.get(`/contacts/lookup/${phone}`).then(unwrap),
    create: (payload) => api.post("/contacts", payload).then(unwrap),
    update: (id, payload) => api.put(`/contacts/${id}`, payload).then(unwrap),
    remove: (id) => api.delete(`/contacts/${id}`).then(unwrap),
  },

  automation: {
    triggerEvent: (payload) => api.post("/trigger-event", payload).then(unwrap),
  },
};
