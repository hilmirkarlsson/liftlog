import { el } from './dom.js';

const root = document.getElementById('modal-root');
let activeOverlay = null;

export function openModal({ title, body, foot }) {
  closeModal();
  const overlay = el('div', { class: 'modal-overlay', onclick: (e) => {
    if (e.target === overlay) closeModal();
  } });
  const sheet = el('div', { class: 'modal-sheet' }, [
    el('div', { class: 'modal-head' }, [
      el('h3', {}, title),
      el('button', { class: 'modal-close', onclick: () => closeModal() }, '✕'),
    ]),
    el('div', { class: 'modal-body' }, body),
    foot ? el('div', { class: 'modal-foot' }, foot) : null,
  ]);
  overlay.append(sheet);
  root.append(overlay);
  activeOverlay = overlay;
  return closeModal;
}

export function closeModal() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}
