// make.fun's public API, read-only GET, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Answers are cached in memory for 60 seconds and revalidated with the
// ETag the API sends: an If-None-Match inside the same minute answers 304
// and costs no new body, so a view that re-renders (or a route visited
// twice) usually makes no fresh request at all. Requests already in flight
// for the same path share one fetch.

const API = 'https://make.fun/api';
const TTL_MS = 60_000;

const cache = new Map(); // path -> { etag, data, at }
const inflight = new Map(); // path -> Promise

async function fetchJson(path, headers = {}) {
  const res = await fetch(API + path, { headers });
  if (res.status === 304) return null; // not modified: caller keeps the cache
  if (!res.ok) {
    const err = new Error(`make.fun API ${res.status} for ${path}`);
    err.status = res.status;
    throw err;
  }
  return { data: await res.json(), etag: res.headers.get('etag') };
}

async function get(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  if (inflight.has(path)) return inflight.get(path);
  const job = (async () => {
    try {
      const headers = hit?.etag ? { 'If-None-Match': hit.etag } : {};
      const fresh = await fetchJson(path, headers);
      if (fresh === null) {
        hit.at = Date.now(); // 304: the cached body is still good
        return hit.data;
      }
      cache.set(path, { etag: fresh.etag, data: fresh.data, at: Date.now() });
      return fresh.data;
    } finally {
      inflight.delete(path);
    }
  })();
  inflight.set(path, job);
  return job;
}

/** The live bounty board: open bounties, newest activity first. */
export const getBoard = () => get('/competitions?status=open&activity=times');

/** One bounty, by its slug. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard. view is 'performance' or 'overall'. */
export const getLeaderboard = (slug, view = 'performance') =>
  get(`/competitions/${encodeURIComponent(slug)}/leaderboard?view=${encodeURIComponent(view)}`);

/** An account's public profile, by handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
