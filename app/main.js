// Bountyline: a make.fun frontend on hash routes.
//
//   #/                              the bounty board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a route loads and true once its data is
// on screen, so a screenshot script knows when to capture.

import { getBoard, getBounty, getLeaderboard, getProfile } from './api.js';
import { boardView, bountyView, leaderboardView, profileView } from './views.js';
import { timeLeft } from './format.js';

const app = document.getElementById('app');
window.__shotReady = false;

// Board toolbar state, kept across re-renders of the same route.
const boardState = { query: '', sort: 'closing' };
let lbPage = 1;

function fail(message, retry) {
  app.innerHTML = `
    <section class="page-head"><h1>Something went wrong</h1>
    <p class="lede">${message}</p>
    <p><button type="button" class="btn" id="retry">Try again</button>
    <a class="btn btn-quiet" href="#/">Back to the board</a></p></section>`;
  document.getElementById('retry').addEventListener('click', retry);
  window.__shotReady = true; // an error page is still a finished render
}

function parseRoute() {
  const hash = location.hash || '#/';
  const [path, queryString] = hash.slice(1).split('?');
  const query = new URLSearchParams(queryString ?? '');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') {
    return { name: 'leaderboard', slug: decodeURIComponent(parts[1]), view: query.get('view') === 'overall' ? 'overall' : 'performance' };
  }
  if (parts[0] === 'bounty' && parts[1]) return { name: 'bounty', slug: decodeURIComponent(parts[1]) };
  if (parts[0] === 'u' && parts[1]) return { name: 'profile', handle: decodeURIComponent(parts[1]) };
  return { name: 'board' };
}

async function render() {
  window.__shotReady = false;
  const route = parseRoute();
  app.innerHTML = '<p class="loading">Loading…</p>';
  try {
    if (route.name === 'board') {
      const data = await getBoard();
      document.title = 'Bountyline — make.fun bounties';
      app.innerHTML = boardView(data, boardState);
      wireBoard();
    } else if (route.name === 'bounty') {
      const b = await getBounty(route.slug);
      document.title = `${b.title} | Bountyline`;
      app.innerHTML = bountyView(b);
    } else if (route.name === 'leaderboard') {
      const lb = await getLeaderboard(route.slug, route.view);
      document.title = `Leaderboard — ${lb.competition.title} | Bountyline`;
      app.innerHTML = leaderboardView(lb, lbPage, route.view);
      wirePager(route);
    } else {
      const p = await getProfile(route.handle);
      document.title = `@${p.handle} | Bountyline`;
      app.innerHTML = profileView(p);
    }
  } catch (err) {
    const status = err?.status;
    const message =
      status === 404
        ? 'That page does not exist on make.fun.'
        : 'make.fun did not answer. Check your connection and try again.';
    fail(message, render);
    return;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

function wireBoard() {
  const search = document.getElementById('board-search');
  const sort = document.getElementById('board-sort');
  if (search) {
    search.addEventListener('input', () => {
      boardState.query = search.value;
      refreshBoardOnly();
    });
  }
  if (sort) sort.addEventListener('change', () => {
    boardState.sort = sort.value;
    refreshBoardOnly();
  });
}

// Re-render the board from the cache without touching the network: the
// toolbar filters and sorts what is already on screen.
async function refreshBoardOnly() {
  const data = await getBoard();
  const scroll = window.scrollY;
  app.innerHTML = boardView(data, boardState);
  wireBoard();
  const search = document.getElementById('board-search');
  if (search) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
  window.scrollTo(0, scroll);
}

function wirePager(route) {
  app.querySelectorAll('.pager button[data-page]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      lbPage = Number(btn.dataset.page);
      const lb = await getLeaderboard(route.slug, route.view);
      app.innerHTML = leaderboardView(lb, lbPage, route.view);
      wirePager(route);
      window.scrollTo(0, 0);
    });
  });
}

// Keep every "time left" on screen fresh without a re-fetch.
setInterval(() => {
  document.querySelectorAll('[data-deadline]').forEach((el) => {
    el.textContent = timeLeft(el.dataset.deadline);
  });
}, 30_000);

// Profile lookup in the header.
document.getElementById('lookup').addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = document.getElementById('lookup-handle').value.trim().replace(/^@/, '');
  if (handle) location.hash = `#/u/${encodeURIComponent(handle)}`;
});

window.addEventListener('hashchange', () => {
  lbPage = 1;
  render();
});

render();
