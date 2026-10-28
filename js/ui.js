/*
 * Small UI helpers shared by every view. Views return HTML strings;
 * buttons carry data-action="name" and app.js calls App.actions[name].
 */
window.App = window.App || {};
App.views = App.views || {};
App.actions = App.actions || {};

(function (App) {
  const M = 60e3, H = 60 * M, D = 24 * H;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "4 min", "6 h", "3 d"
  function dur(ms) {
    ms = Math.max(0, ms);
    if (ms < M) return 'under 1 min';
    if (ms < H) return Math.round(ms / M) + ' min';
    if (ms < 4 * D) return Math.round(ms / H) + ' h';
    return Math.round(ms / D) + ' d';
  }
  // "Mon 10:42"
  function clock(ts) {
    const d = new Date(ts);
    const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${wd} ${t}`;
  }
  // "Fri 14 Nov" from "2026-11-14"
  function date(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  }

  // "26 Oct" from "2026-10-26"
  const dshort = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const chip = (label, kind = 'grey') => `<span class="chip ${kind}">${esc(label)}</span>`;
  const attrs = (data) => Object.entries(data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const btn = (label, action, data = {}, kind = 'primary', extra = '') => `<button type="button" class="btn ${kind}" data-action="${action}"${attrs(data)} ${extra}>${esc(label)}</button>`;

  // ---------- icons (simple inline SVG, stroke style) ----------
  const P = {
    chat: '<path d="M4 5h16v11H8l-4 4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    funnel: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c1-3.5 3.5-5 7-5s6 1.5 7 5M15 15.5c3 0 5 1.5 6 4.5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 13l2.5 2.5 4.5-5"/>',
    book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-5a3 3 0 00-3 3"/><path d="M20 4v14h-6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5 15a8 8 0 102-8.5L4 10"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    send: '<path d="M3 11l18-8-8 18-2-8z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

  // ---------- toast and modal ----------
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
  function modal(title, bodyHtml) {
    const el = document.getElementById('modal');
    el.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-action="closeModal" aria-label="Close">${icon('x')}</button></div>
      <div class="modal-body">${bodyHtml}</div></div>`;
    el.hidden = false;
  }
  function closeModal() { const el = document.getElementById('modal'); el.hidden = true; el.innerHTML = ''; }

  // ---------- building blocks ----------
  // A phone frame with a WhatsApp-style chat
  function phone({ title, sub, body, footer, code }) {
    return `<div class="phone">
      <div class="phone-notch"></div>
      <div class="phone-head"><span class="avatar red">${icon('chat')}</span><span class="phone-title"><b>${esc(title)}</b><small>${esc(sub)}</small></span>${code ? chip(code, 'red') : ''}</div>
      <div class="chat-body" data-scroll="bottom">${body}</div>
      <div class="phone-foot">${footer}</div>
    </div>`;
  }
  // The numbered "what to notice" panel next to each screen
  function notes(items, title = 'What to notice') {
    return `<aside class="notes"><h3>${esc(title)}</h3><ol>${items.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ol></aside>`;
  }
  const mark = (n) => `<span class="mark" aria-hidden="true">${n}</span>`;
  const empty = (title, text, actions = '') => `<div class="empty card"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="row gap">${actions}</div></div>`;
  // Percentage bar
  const bar = (pct, kind = 'green') => `<span class="bar"><span class="bar-fill ${kind}" style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`;

  App.ui = { esc, dur, clock, date, dshort, chip, btn, icon, toast, modal, closeModal, phone, notes, mark, empty, bar, attrs, M, H, D };
})(window.App);
