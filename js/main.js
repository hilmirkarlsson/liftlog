import { el } from './dom.js';
import * as state from './state.js';
import { todayKey, addDays, formatDisplayDate } from './util.js';
import { renderLog } from './views/log.js';
import { renderHistory } from './views/history.js';
import { renderProgress } from './views/progress.js';
import { renderSettings } from './views/settings.js';
import { drainQueue } from './sync.js';

const topbar = document.getElementById('topbar');
const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const tabButtons = document.querySelectorAll('.tab-btn');
const TAB_ORDER = Array.from(tabButtons).map((btn) => btn.dataset.tab);
tabbar.style.setProperty('--tab-count', String(TAB_ORDER.length));

const ctx = { tab: 'log', dateKey: todayKey() };
const TAB_TITLES = { history: 'History', progress: 'Progress', settings: 'Settings' };

function renderTopbar() {
  topbar.innerHTML = '';
  if (ctx.tab === 'log') {
    const isToday = ctx.dateKey === todayKey();
    topbar.append(el('div', { class: 'date-nav' }, [
      el('button', { class: 'icon-btn', onclick: () => { ctx.dateKey = addDays(ctx.dateKey, -1); render(); } },
        el('div', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' })),
      el('div', { style: 'text-align:center' }, [
        el('div', { class: 'date-label' }, formatDisplayDate(ctx.dateKey)),
        !isToday ? el('button', { class: 'date-jump', onclick: () => { ctx.dateKey = todayKey(); render(); } }, 'Jump to today') : null,
      ]),
      el('button', { class: 'icon-btn', onclick: () => { ctx.dateKey = addDays(ctx.dateKey, 1); render(); } },
        el('div', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' })),
    ]));
  } else {
    topbar.append(el('h1', {}, TAB_TITLES[ctx.tab] || ''));
  }
}

function renderView() {
  view.innerHTML = '';
  if (ctx.tab === 'log') renderLog(view, ctx.dateKey);
  else if (ctx.tab === 'history') renderHistory(view);
  else if (ctx.tab === 'progress') renderProgress(view);
  else if (ctx.tab === 'settings') renderSettings(view);
}

function renderTabbar() {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === ctx.tab));
  tabbar.style.setProperty('--active-index', String(TAB_ORDER.indexOf(ctx.tab)));
}

function render() {
  renderTopbar();
  renderView();
  renderTabbar();
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => { ctx.tab = btn.dataset.tab; render(); });
});

state.subscribe(render);
render();
drainQueue();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
