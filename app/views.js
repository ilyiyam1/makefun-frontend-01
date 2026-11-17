// The four surfaces, each a function from API data to HTML.
// Every value from the API goes through esc() before it lands in markup.

import { date, esc, money, num, shortAddress, takesEntries, timeLeft } from './format.js';

/** The live pot: prize plus entry fees paid into it. */
const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee chip, when the bounty charges one. */
const feeChip = (b) =>
  b.entryFeeUsd ? `<span class="chip chip-fee">${money(b.entryFeeUsd)} fee</span>` : '';

/** Open / closed chip, decided by the deadline, not the status alone. */
const statusChip = (b) =>
  takesEntries(b)
    ? '<span class="chip chip-open">Open</span>'
    : '<span class="chip chip-closed">Closed</span>';

function sortItems(items, sort) {
  const list = [...items];
  if (sort === 'pot') list.sort((a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount));
  else if (sort === 'entries') list.sort((a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0));
  else list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)); // closing soonest
  return list;
}

export function boardView(data, state) {
  const q = (state.query ?? '').trim().toLowerCase();
  const items = sortItems(data.items ?? [], state.sort ?? 'closing').filter((b) =>
    !q || `${b.title} ${b.slug} ${b.category ?? ''}`.toLowerCase().includes(q),
  );
  const cards = items
    .map(
      (b) => `
      <article class="card">
        <div class="card-top">${statusChip(b)}${b.category ? `<span class="chip">${esc(b.category)}</span>` : ''}${feeChip(b)}</div>
        <h2 class="card-title"><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h2>
        <p class="card-summary">${esc(b.summary ?? '')}</p>
        <dl class="card-facts">
          <div><dt>Live pot</dt><dd class="pot">${pot(b)}</dd></div>
          <div><dt>Closes</dt><dd><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></dd></div>
          <div><dt>Entries</dt><dd>${num(b.submissionCount)}</dd></div>
        </dl>
        <p class="card-foot"><a class="btn" href="#/bounty/${encodeURIComponent(b.slug)}">View bounty →</a>
        <a class="btn btn-quiet" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard</a></p>
      </article>`,
    )
    .join('');
  return `
    <section class="page-head">
      <h1>Live bounties</h1>
      <p class="lede">${num(data.items?.length ?? 0)} open right now. Pots grow as entry fees are paid in.</p>
    </section>
    <div class="toolbar" role="search">
      <label class="visually-hidden" for="board-search">Search bounties</label>
      <input id="board-search" type="search" placeholder="Search title or slug…" value="${esc(state.query ?? '')}" autocomplete="off">
      <label class="visually-hidden" for="board-sort">Sort bounties</label>
      <select id="board-sort">
        <option value="closing"${state.sort === 'closing' ? ' selected' : ''}>Closing soonest</option>
        <option value="pot"${state.sort === 'pot' ? ' selected' : ''}>Biggest pot</option>
        <option value="entries"${state.sort === 'entries' ? ' selected' : ''}>Most entries</option>
      </select>
    </div>
    ${cards ? `<div class="grid">${cards}</div>` : '<p class="empty">No bounties match that search.</p>'}`;
}

function rewardsTable(b) {
  const live = Array.isArray(b.rewardsNow) && b.rewardsNow.length > 0;
  const rows = live
    ? b.rewardsNow.map(
        (r) => `<tr><td>${num(r.place)}</td><td>${money(r.baseUsd)}</td><td>${money(r.feeShareUsd)}</td><td class="pot">${money(r.amountUsd)}</td></tr>`,
      )
    : Object.entries(b.rewards ?? {}).map(
        ([place, amount]) => `<tr><td>${num(place)}</td><td>${money(amount)}</td><td>—</td><td class="pot">${money(amount)}</td></tr>`,
      );
  if (rows.length === 0) return '<p class="empty">No reward table published yet.</p>';
  return `
    <table class="rewards">
      <thead><tr><th scope="col">Place</th><th scope="col">Prize</th><th scope="col">Fee share</th><th scope="col">Total now</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <p class="fineprint">Totals are live: the pot is the $500 prize plus every $0.50 entry fee paid so far.</p>`;
}

export function bountyView(b) {
  const open = takesEntries(b);
  return `
    <p class="crumbs"><a href="#/">← All bounties</a></p>
    <section class="hero">
      <div class="hero-top">${statusChip(b)}${b.category ? `<span class="chip">${esc(b.category)}</span>` : ''}${feeChip(b)}</div>
      <h1>${esc(b.title)}</h1>
      <p class="lede">${esc(b.summary ?? '')}</p>
      <dl class="hero-facts">
        <div><dt>Live pot</dt><dd class="pot pot-big">${pot(b)}</dd></div>
        <div><dt>Deadline</dt><dd>${date(b.deadline)}<br><span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></dd></div>
        <div><dt>Entries</dt><dd>${num(b.submissionCount)}</dd></div>
        <div><dt>Status</dt><dd>${open ? 'Takes entries' : 'No longer takes entries'}</dd></div>
      </dl>
      <p class="hero-actions">
        <a class="btn" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a>
        <a class="btn btn-quiet" href="https://make.fun/bounty/${encodeURIComponent(b.slug)}">On make.fun ↗</a>
      </p>
    </section>
    <section class="block">
      <h2>Rewards</h2>
      ${rewardsTable(b)}
    </section>
    <section class="block">
      <h2>About this bounty</h2>
      <div class="prose">${esc(b.description ?? '')}</div>
    </section>
    ${b.rules ? `<section class="block"><h2>Rules</h2><div class="prose">${esc(b.rules)}</div></section>` : ''}`;
}

const PAGE_SIZE = 25;

export function leaderboardView(lb, page, view) {
  const columns = lb.columns ?? [];
  const entries = lb.entries ?? [];
  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pages);
  const slice = entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const otherView = view === 'overall' ? 'performance' : 'overall';
  const rows = slice
    .map(
      (e) => `
      <tr>
        <td class="rank">${num(e.rank)}</td>
        <td class="entry-cell">
          <a class="entry-title" href="#/u/${encodeURIComponent(e.handle)}">${esc(e.title || e.handle)}</a>
          <span class="entry-handle">${esc(e.handle)}</span>
        </td>
        ${columns.map((c) => `<td>${esc(e.display?.[c.key] ?? e.values?.[c.key] ?? '—')}</td>`).join('')}
      </tr>`,
    )
    .join('');
  return `
    <p class="crumbs"><a href="#/bounty/${encodeURIComponent(lb.competition.slug)}">← ${esc(lb.competition.title)}</a></p>
    <section class="page-head">
      <h1>Leaderboard</h1>
      <p class="lede">${esc(lb.competition.title)} · ${esc(lb.phase?.title ?? '')} · ${num(entries.length)} entries</p>
      <p class="view-toggle">View:
        <a href="#/bounty/${encodeURIComponent(lb.competition.slug)}/leaderboard?view=performance" aria-current="${view === 'performance'}">Performance</a>
        <a href="#/bounty/${encodeURIComponent(lb.competition.slug)}/leaderboard?view=overall" aria-current="${view === 'overall'}">Overall</a>
      </p>
    </section>
    ${rows
      ? `<div class="table-wrap"><table class="leaderboard">
          <thead><tr><th scope="col">#</th><th scope="col">Entry</th>${columns.map((c) => `<th scope="col">${esc(c.title)}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <nav class="pager" aria-label="Leaderboard pages">
          <button type="button" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''}>← Prev</button>
          <span>Page ${num(safePage)} of ${num(pages)}</span>
          <button type="button" data-page="${safePage + 1}" ${safePage >= pages ? 'disabled' : ''}>Next →</button>
        </nav>`
      : '<p class="empty">No entries on this leaderboard yet.</p>'}`;
}

export function profileView(p) {
  const avatar = p.avatar || p.image;
  const name = p.display_name || p.handle;
  const record = p.record ?? {};
  const entries = (p.solutions ?? [])
    .map(
      (s) => `
      <tr>
        <td><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a></td>
        <td>${s.placement ? `#${num(s.placement)}` : '—'}</td>
        <td>${esc(s.score?.display ?? s.score?.value ?? '—')}</td>
        <td>${s.prize_usd ? money(s.prize_usd) : '—'}</td>
        <td>${date(s.entered_at)}</td>
      </tr>`,
    )
    .join('');
  return `
    <section class="profile-head">
      ${avatar ? `<img class="avatar" crossorigin="anonymous" src="${esc(avatar)}" alt="" width="96" height="96">` : '<span class="avatar avatar-fallback" aria-hidden="true">◆</span>'}
      <div>
        <h1>${esc(name)}</h1>
        <p class="handle">@${esc(p.handle)}</p>
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
        <p class="fineprint">Joined ${date(p.joined_at)}</p>
      </div>
    </section>
    <dl class="stat-grid">
      <div><dt>Entered</dt><dd>${num(record.competitions_entered)}</dd></div>
      <div><dt>Placed</dt><dd>${num(record.competitions_placed)}</dd></div>
      <div><dt>Won</dt><dd>${num(record.competitions_won)}</dd></div>
      <div><dt>Best place</dt><dd>${record.best_placement ? `#${num(record.best_placement)}` : '—'}</dd></div>
      <div><dt>Prize money</dt><dd>${money(record.prize_usd ?? 0)}</dd></div>
      <div><dt>Wallet</dt><dd>${p.wallet?.address ? `<a href="${esc(p.wallet.explorer_url)}">${shortAddress(p.wallet.address)}</a>` : '—'}</dd></div>
    </dl>
    <section class="block">
      <h2>Entries</h2>
      ${entries
        ? `<div class="table-wrap"><table>
            <thead><tr><th scope="col">Bounty</th><th scope="col">Place</th><th scope="col">Score</th><th scope="col">Prize</th><th scope="col">Entered</th></tr></thead>
            <tbody>${entries}</tbody>
          </table></div>`
        : '<p class="empty">No entries yet.</p>'}
    </section>`;
}
