// Vice Cover Studio — editor: state, photos, preview, controls, export.
// The cover itself is painted by cover.js; this file wires the page around it.

import { LAYOUTS, TONES, POST_SIZES, panelRects, drawCover, defaultState } from './cover.js';
import { applyShotPreset } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

// Photos by id: the two kit samples plus anything the person uploads.
const photos = new Map();
const BUILTIN = [
  { id: 'pier', name: 'Pier at dusk', src: 'samples/pier.jpg' },
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
];
let uploadCount = 0;

function loadImage(id, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { photos.set(id, img); render(); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

let state = defaultState();
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let exportSize = POST_SIZES[0];

function snapshot() { return JSON.stringify(state); }
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  selectedPanel = 0;
  syncControls();
  render();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undoBtn').disabled = !undoStack.length;
  $('redoBtn').disabled = !redoStack.length;
}

// Preview canvas follows the chosen export size's aspect — unless a
// ?shot=cover preset already sized it for a cover screenshot.
function sizePreview() {
  if (document.body.classList.contains('shot-cover')) return;
  const w = 900;
  const h = Math.round((900 * exportSize.h) / exportSize.w);
  preview.width = w;
  preview.height = h;
}

function render() {
  sizePreview();
  const images = {};
  for (const [id, img] of photos) images[id] = img;
  drawCover(pctx, state, images, preview.width, preview.height);
}

function panelCount() { return LAYOUTS[state.layout].panels; }

function syncControls() {
  document.querySelectorAll('#layoutRow button').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#toneRow button').forEach((b) =>
    b.classList.toggle('active', b.dataset.tone === state.tone));
  document.querySelectorAll('#sizeRow button').forEach((b) =>
    b.classList.toggle('active', +b.dataset.w === exportSize.w && +b.dataset.h === exportSize.h));
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  buildPanelControls();
}

function buildPanelControls() {
  const wrap = $('panelControls');
  wrap.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const p = state.panels[i];
    const div = document.createElement('div');
    div.className = 'panel-card' + (i === selectedPanel ? ' selected' : '');
    div.innerHTML = `
      <div class="panel-head">Panel ${i + 1}</div>
      <label>Photo
        <select data-panel="${i}" class="photo-select"></select>
      </label>
      <label>Zoom <span class="val">${p.scale.toFixed(2)}×</span>
        <input type="range" min="0.6" max="3" step="0.01" value="${p.scale}" data-panel="${i}" data-field="scale">
      </label>
      <label>Rotate <span class="val">${p.rot}°</span>
        <input type="range" min="-30" max="30" step="1" value="${p.rot}" data-panel="${i}" data-field="rot">
      </label>`;
    const sel = div.querySelector('select');
    for (const [id, img] of photos) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = BUILTIN.find((b) => b.id === id)?.name || `Uploaded photo ${id.replace('up', '')}`;
      if (id === p.photo) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      commit();
      state.panels[i].photo = sel.value;
      render();
    });
    div.querySelectorAll('input[type=range]').forEach((input) => {
      input.addEventListener('input', () => {
        state.panels[i][input.dataset.field] = +input.value;
        input.parentElement.querySelector('.val').textContent =
          input.dataset.field === 'scale' ? `${(+input.value).toFixed(2)}×` : `${input.value}°`;
        render();
      });
      input.addEventListener('change', () => commit());
    });
    div.addEventListener('click', () => { selectedPanel = i; buildPanelControls(); render(); });
    wrap.appendChild(div);
  }
}

function buildButtons() {
  const layoutRow = $('layoutRow');
  for (const [id, l] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.textContent = l.name;
    b.dataset.layout = id;
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      commit();
      state.layout = id;
      selectedPanel = 0;
      syncControls();
      render();
    });
    layoutRow.appendChild(b);
  }
  const toneRow = $('toneRow');
  for (const [id, t] of Object.entries(TONES)) {
    const b = document.createElement('button');
    b.textContent = t.name;
    b.dataset.tone = id;
    b.style.setProperty('--sw', t.accent);
    b.addEventListener('click', () => {
      if (state.tone === id) return;
      commit();
      state.tone = id;
      syncControls();
      render();
    });
    toneRow.appendChild(b);
  }
  const sizeRow = $('sizeRow');
  for (const s of POST_SIZES) {
    const b = document.createElement('button');
    b.textContent = s.label;
    b.dataset.w = s.w;
    b.dataset.h = s.h;
    b.addEventListener('click', () => {
      exportSize = s;
      syncControls();
      render();
    });
    sizeRow.appendChild(b);
  }
}

// Drag to pan the selected panel, wheel to zoom it.
let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const r = preview.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * preview.width;
  const y = ((e.clientY - r.top) / r.height) * preview.height;
  const rects = panelRects(state.layout, preview.width, preview.height);
  const hit = rects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
  if (hit >= 0 && hit < panelCount()) {
    selectedPanel = hit;
    buildPanelControls();
    drag = { x, y, rect: rects[hit], p: { ...state.panels[hit] } };
    preview.setPointerCapture(e.pointerId);
  }
});
preview.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = preview.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * preview.width;
  const y = ((e.clientY - r.top) / r.height) * preview.height;
  const p = state.panels[selectedPanel];
  p.dx = drag.p.dx + (x - drag.x) / drag.rect.w;
  p.dy = drag.p.dy + (y - drag.y) / drag.rect.h;
  render();
});
preview.addEventListener('pointerup', () => { if (drag) { commit(); drag = null; } });
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selectedPanel];
  p.scale = Math.min(3, Math.max(0.6, p.scale * Math.exp(-e.deltaY * 0.0012)));
  buildPanelControls();
  render();
}, { passive: false });

$('uploadInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const id = `up${++uploadCount}`;
    const url = URL.createObjectURL(file);
    await loadImage(id, url);
  }
  buildPanelControls();
  e.target.value = '';
});
$('titleInput').addEventListener('change', (e) => { commit(); state.title = e.target.value; render(); });
$('subtitleInput').addEventListener('change', (e) => { commit(); state.subtitle = e.target.value; render(); });
$('badgeInput').addEventListener('change', (e) => { commit(); state.badge = e.target.value; render(); });
$('undoBtn').addEventListener('click', undo);
$('redoBtn').addEventListener('click', redo);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
});

async function exportPNG(w, h) {
  await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const images = {};
  for (const [id, img] of photos) images[id] = img;
  drawCover(c.getContext('2d'), state, images, w, h);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
$('exportBtn').addEventListener('click', async () => {
  const blob = await exportPNG(exportSize.w, exportSize.h);
  download(blob, `vice-cover-${exportSize.w}x${exportSize.h}.png`);
});
$('exportAllBtn').addEventListener('click', async () => {
  for (const s of POST_SIZES) {
    const blob = await exportPNG(s.w, s.h);
    download(blob, `vice-cover-${s.w}x${s.h}.png`);
    await new Promise((r) => setTimeout(r, 300));
  }
});

// Test hook: the screenshot script drives the app through this.
window.__cover = {
  get state() { return state; },
  setState(next) { commit(); state = next; syncControls(); render(); },
  render,
  exportPNG,
  get photos() { return photos; },
  get selectedPanel() { return selectedPanel; },
};

async function init() {
  buildButtons();
  await Promise.all(BUILTIN.map((b) => loadImage(b.id, b.src)));
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.load('40px Pacifico');
  } catch { /* fonts fall back to system faces */ }
  applyShotPreset(state, photos, { render, syncControls });
  syncControls();
  render();
}

init();
