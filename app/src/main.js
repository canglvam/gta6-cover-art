// Palms & Neon — wires the page: photos in, layout and tone picked, caption
// typed, panels dragged and zoomed, cover exported as a PNG. Everything runs
// on the person's own machine; no photo is ever uploaded anywhere.
import { drawCover, layoutById, toneById, panelRects, LAYOUTS, TONES } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const panelLabel = document.getElementById('panel-label');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');

const state = {
  layout: 'classic',
  tone: 'sunset',
  title: 'VICE CITY',
  subtitle: 'Neon Nights',
  size: '1080x1080',
  photos: [null, null, null],
  photoNames: ['Empty', 'Empty', 'Empty'],
  adjust: {},
};

let selectedPanel = 0;
let undoStack = [];
let redoStack = [];

function snapshot() {
  return JSON.parse(JSON.stringify({
    layout: state.layout,
    tone: state.tone,
    title: state.title,
    subtitle: state.subtitle,
    size: state.size,
    adjust: state.adjust,
  }));
}

function restore(snap) {
  state.layout = snap.layout;
  state.tone = snap.tone;
  state.title = snap.title;
  state.subtitle = snap.subtitle;
  state.size = snap.size;
  state.adjust = snap.adjust;
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  syncPickers();
  applySize();
  syncPanelControls();
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
  setStatus('Undid the last change.');
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
  setStatus('Redid the change.');
}

function syncUndoButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function applySize() {
  const [w, h] = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  canvas.style.aspectRatio = `${w} / ${h}`;
  redraw();
}

function redraw() {
  drawCover(canvas, state);
}

function adjKey() {
  return `${state.layout}:${selectedPanel}`;
}

function getAdj() {
  const key = adjKey();
  if (!state.adjust[key]) state.adjust[key] = { zoom: 1, ox: 0, oy: 0 };
  return state.adjust[key];
}

function syncPanelControls() {
  const layout = layoutById(state.layout);
  if (selectedPanel >= layout.panels.length) selectedPanel = 0;
  const panel = layout.panels[selectedPanel];
  const slotNames = ['Photo A', 'Photo B', 'Photo C'];
  panelLabel.textContent = `Panel ${selectedPanel + 1} — ${slotNames[panel.slot]} (${state.photoNames[panel.slot]})`;
  const adj = getAdj();
  zoomInput.value = adj.zoom;
  panXInput.value = adj.ox;
  panYInput.value = adj.oy;
  document.getElementById('zoom-val').textContent = `${Math.round(adj.zoom * 100)}%`;
  document.getElementById('pan-x-val').textContent = adj.ox.toFixed(2);
  document.getElementById('pan-y-val').textContent = adj.oy.toFixed(2);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadSampleInto(slot, name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos[slot] = img;
    state.photoNames[slot] = `Sample: ${name}`;
    updateSlotCards();
    redraw();
  } catch {
    setStatus(`Could not load the sample photo ${name}.`);
  }
}

function updateSlotCards() {
  for (let i = 0; i < 3; i++) {
    document.getElementById(`slot-name-${i}`).textContent = state.photoNames[i];
    document.getElementById(`slot-thumb-${i}`).textContent = state.photos[i] ? '✓' : '·';
  }
  syncPanelControls();
}

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.id = layout.id;
    btn.title = layout.hint;
    btn.innerHTML = `<b>${layout.name}</b><span>${layout.hint}</span>`;
    btn.addEventListener('click', () => {
      if (state.layout === layout.id) return;
      pushHistory();
      state.layout = layout.id;
      selectedPanel = 0;
      syncPickers();
      syncPanelControls();
      redraw();
      setStatus(`Layout: ${layout.name}.`);
    });
    layoutBox.appendChild(btn);
  }
  const toneBox = document.getElementById('tones');
  for (const tone of TONES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.id = tone.id;
    btn.title = tone.name;
    btn.style.background = tone.swatch;
    btn.innerHTML = `<span>${tone.name}</span>`;
    btn.addEventListener('click', () => {
      if (state.tone === tone.id) return;
      pushHistory();
      state.tone = tone.id;
      syncPickers();
      redraw();
      setStatus(`Colour grade: ${tone.name}.`);
    });
    toneBox.appendChild(btn);
  }
}

function syncPickers() {
  for (const btn of document.querySelectorAll('#layouts .pick')) {
    btn.classList.toggle('active', btn.dataset.id === state.layout);
  }
  for (const btn of document.querySelectorAll('#tones .swatch')) {
    btn.classList.toggle('active', btn.dataset.id === state.tone);
  }
  for (const btn of document.querySelectorAll('#sizes .pick')) {
    btn.classList.toggle('active', btn.dataset.id === state.size);
  }
}

function buildSizeButtons() {
  const box = document.getElementById('sizes');
  for (const key of Object.keys(SIZES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.id = key;
    btn.textContent = key.replace('x', ' × ');
    btn.addEventListener('click', () => {
      if (state.size === key) return;
      pushHistory();
      state.size = key;
      syncPickers();
      applySize();
      setStatus(`Preview size: ${key}.`);
    });
    box.appendChild(btn);
  }
}

function wirePhotos() {
  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`photo-${i}`);
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        state.photos[i] = img;
        state.photoNames[i] = file.name;
        updateSlotCards();
        redraw();
        setStatus(`Loaded ${file.name} into slot ${'ABC'[i]}.`);
      } catch {
        setStatus('That file could not be read as a photo.');
      }
    });
    document.getElementById(`sample-a-${i}`).addEventListener('click', () => loadSampleInto(i, 'pier'));
    document.getElementById(`sample-b-${i}`).addEventListener('click', () => loadSampleInto(i, 'boulevard'));
  }
}

function wireCaption() {
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value;
    redraw();
  });
  titleInput.addEventListener('change', () => {
    pushHistory();
    redraw();
  });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    redraw();
  });
  subtitleInput.addEventListener('change', () => {
    pushHistory();
    redraw();
  });
}

function wirePanelControls() {
  const applyAdj = () => {
    const adj = getAdj();
    adj.zoom = Number(zoomInput.value);
    adj.ox = Number(panXInput.value);
    adj.oy = Number(panYInput.value);
    syncPanelControls();
    redraw();
  };
  zoomInput.addEventListener('input', applyAdj);
  panXInput.addEventListener('input', applyAdj);
  panYInput.addEventListener('input', applyAdj);
  for (const el of [zoomInput, panXInput, panYInput]) {
    el.addEventListener('change', pushHistory);
  }
  document.getElementById('reset-panel').addEventListener('click', () => {
    pushHistory();
    state.adjust[adjKey()] = { zoom: 1, ox: 0, oy: 0 };
    syncPanelControls();
    redraw();
    setStatus('Panel crop reset.');
  });
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function hitPanel(p) {
  const rects = panelRects(canvas.width, canvas.height, state.layout);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvas() {
  let dragging = null;
  let gesturePushed = false;
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const hit = hitPanel(p);
    if (hit === -1) return;
    if (hit !== selectedPanel) {
      selectedPanel = hit;
      syncPanelControls();
    }
    const rects = panelRects(canvas.width, canvas.height, state.layout);
    dragging = { start: p, rect: rects[hit], adj: { ...getAdj() } };
    gesturePushed = false;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!gesturePushed) {
      pushHistory();
      gesturePushed = true;
    }
    const p = canvasPoint(e);
    const adj = getAdj();
    adj.ox = Math.max(-0.6, Math.min(0.6, dragging.adj.ox + (p.x - dragging.start.x) / dragging.rect.w));
    adj.oy = Math.max(-0.6, Math.min(0.6, dragging.adj.oy + (p.y - dragging.start.y) / dragging.rect.h));
    syncPanelControls();
    redraw();
  });
  const endDrag = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  let lastWheelPush = 0;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = canvasPoint(e);
    const hit = hitPanel(p);
    if (hit === -1) return;
    if (Date.now() - lastWheelPush > 800) {
      pushHistory();
      lastWheelPush = Date.now();
    }
    if (hit !== selectedPanel) {
      selectedPanel = hit;
      syncPanelControls();
    }
    const adj = getAdj();
    adj.zoom = Math.max(0.8, Math.min(3, adj.zoom * Math.exp(-e.deltaY * 0.0012)));
    syncPanelControls();
    redraw();
  }, { passive: false });
}

function exportPNG(sizeKey) {
  const [w, h] = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — please try again.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palms-neon-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    setStatus(`Saved palms-neon-${w}x${h}.png — share it anywhere.`);
  }, 'image/png');
}

function wireActions() {
  document.getElementById('export').addEventListener('click', () => exportPNG(state.size));
  document.getElementById('export-all').addEventListener('click', () => {
    for (const key of Object.keys(SIZES)) exportPNG(key);
    setStatus('Exported all three sizes.');
  });
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('random').addEventListener('click', () => {
    pushHistory();
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
    state.tone = TONES[Math.floor(Math.random() * TONES.length)].id;
    selectedPanel = 0;
    syncPickers();
    syncPanelControls();
    redraw();
    setStatus('Surprise! A random layout and grade.');
  });
  document.getElementById('reset-all').addEventListener('click', () => {
    pushHistory();
    state.layout = 'classic';
    state.tone = 'sunset';
    state.title = 'VICE CITY';
    state.subtitle = 'Neon Nights';
    state.adjust = {};
    titleInput.value = state.title;
    subtitleInput.value = state.subtitle;
    selectedPanel = 0;
    syncPickers();
    syncPanelControls();
    redraw();
    setStatus('Reset to the starting cover.');
  });
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('400 80px Anton'),
      document.fonts.load('400 40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // System fallbacks still draw; the cover just loses its display fonts.
  }
  redraw();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  document.body.classList.add('shot-mode');
  runShot(shot, new URLSearchParams(location.search), {
    loadSample: loadSampleInto,
    setAll(patch) {
      Object.assign(state, patch);
      titleInput.value = state.title;
      subtitleInput.value = state.subtitle;
      syncPickers();
      applySize();
      syncPanelControls();
    },
    draw: redraw,
    canvas,
    setStatus,
  });
} else {
  buildPickers();
  buildSizeButtons();
  wirePhotos();
  wireCaption();
  wirePanelControls();
  wireCanvas();
  wireActions();
  syncPickers();
  syncUndoButtons();
  applySize();
  updateSlotCards();
  // Start with the two sample photos already in place, so the first paint
  // is a finished-looking cover, not an empty frame.
  loadSampleInto(0, 'pier');
  loadSampleInto(1, 'boulevard');
  ensureFonts();
}
