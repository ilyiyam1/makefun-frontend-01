// Small helpers for showing API values. No dependencies.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('792.00', 500 or 0.5) as '$792' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** A count with thousands separators. */
export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
}

/** A deadline as a short UTC date and time. */
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`;
}

/** Time until a deadline: '2d 4h left', '35m left', '42s left', or 'ended'. */
export function timeLeft(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'ended';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

/**
 * Whether a bounty still takes entries. A bounty past its deadline may still
 * read status "open" until its results are published, so the deadline decides,
 * not the status alone.
 */
export function takesEntries(bounty) {
  if (!bounty || !bounty.deadline) return false;
  if (new Date(bounty.deadline).getTime() <= Date.now()) return false;
  if (bounty.acceptingSubmissions === false) return false;
  return true;
}

/** Shorten a Solana address for display, keeping it recognisable. */
export function shortAddress(address) {
  const s = String(address ?? '');
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}
