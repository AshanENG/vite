export const API = "http://localhost:3036";

// Small helper to fetch with timeout
async function fetchWithTimeout(resource, options = {}, timeout = 2000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function tryFetchApi(path) {
  try {
    const r = await fetchWithTimeout(`${API}${path}`, { credentials: 'include' }, 2000);
    if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
    return r.json();
  } catch (err) {
    // Rethrow and let caller handle fallback
    throw err;
  }
}

// Public helper that falls back to `public/events-dummy.json` when API is down
export async function apiGet(path) {
  try {
    return await tryFetchApi(path);
  } catch (err) {
    // Attempt to load local dummy data for testing
    try {
      const fallback = await fetch(`/events-dummy.json`);
      if (!fallback.ok) throw new Error('Fallback not found');
      return fallback.json();
    } catch (fallbackErr) {
      // Surface original error if fallback fails
      throw err;
    }
  }
}

export async function apiJSON(method, path, body) {
  try {
    const r = await fetchWithTimeout(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {})
    }, 2000);
    if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}`);
    return r.json();
  } catch (err) {
    // No fallback for non-GET operations; rethrow
    throw err;
  }
}