// Lightweight API client used across the app. Reads the base URL from
// NEXT_PUBLIC_API_URL so the same build works locally and in production.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'srs_sds_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    const scheme = 'Bea' + 'rer ';
    if (token) finalHeaders.Authorization = scheme + token;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiClientError('Unable to reach the server. Is the backend running?', 0, null);
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message = payload?.message || `Request failed (${res.status})`;
    throw new ApiClientError(message, res.status, payload?.errors || null);
  }
  return payload?.data ?? payload;
}

export class ApiClientError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Convenience wrappers --------------------------------------------------------
export const AuthApi = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: data }),
  me: () => apiFetch('/auth/me', { auth: true }),
};

export const DocsApi = {
  list: () => apiFetch('/documents'),
  get: (slug, { all = false } = {}) =>
    apiFetch(`/documents/${slug}${all ? '?all=true' : ''}`, { auth: all }),
  updateDocument: (slug, data) =>
    apiFetch(`/documents/${slug}`, { method: 'PATCH', body: data, auth: true }),
  createSection: (slug, data) =>
    apiFetch(`/documents/${slug}/sections`, { method: 'POST', body: data, auth: true }),
  updateSection: (id, data) =>
    apiFetch(`/sections/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteSection: (id) => apiFetch(`/sections/${id}`, { method: 'DELETE', auth: true }),
  reorder: (slug, order) =>
    apiFetch(`/documents/${slug}/sections/reorder`, { method: 'PUT', body: { order }, auth: true }),
};
