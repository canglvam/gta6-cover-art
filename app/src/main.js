// Vice Nights — wires the editor: photo slots, layout and tone pickers, caption,
// per-panel crop controls, undo/redo, PNG export, and the ?shot= screenshot scenes.
import { drawCover, panelAt, LAYOUTS, TONES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const selectedLabel = document.getElementById('selected-panel');

const SAMPLE_NAMES = ['boulevard', 'pier'];
const SLOT_COUNT = 3;

function defaultPanels() {
  return Array.from({ length: 4 }, (_, i) => ({
    slot: i % SLOT_COUNT,
    zoom: 1,
    panX: 0,
    panY: 0,
    rotate: 0,
  }));
}

function defaultState() {
  return {
    layout: 'hero',
    tone: 'sunset',
    title: 'Vice Nights',
    subtitle: 'Neon Coast',
    panels: defaultPanels(),
  };
}

let state = defaultState();
let photos = [null, null, null];
let selected = 0;
let undoStack = [];
let redoStack = [];

function snapshot() {
  return JSON.stringify(state);
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}

function applySnapshot(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}

function refreshUndoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

function redraw() {
  drawCover(canvas, state, photos);
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadFonts() {
  const faces = [
    new FontFace('Bebas Neue', 'url(./fonts/BebasNeue-Regular.ttf)'),
    new FontFace('Great Vibes', 'url(./fonts/GreatVibes-Regular.ttf)'),
  ];
  const loaded = await Promise.all(faces.map((f) => f.load().catch(() => null)));
  for (const face of loaded) if (face) document.fonts.add(face);
  await document.fonts.ready;
}

// ---- controls ----

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  for (const [id, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.layout = id;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      pushUndo();
      state.layout = id;
      selected = 0;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  const toneBox = document.getElementById('tones');
  for (const [id, def] of Object.entries(TONES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.tone = id;
    b.title = def.label;
    b.style.setProperty('--sw', def.accent);
    b.innerHTML = `<span>${def.label}</span>`;
    b.addEventListener('click', () => {
      if (state.tone === id) return;
      pushUndo();
      state.tone = id;
      syncControls();
      redraw();
    });
    toneBox.appendChild(b);
  }
}

function syncControls() {
  for (const b of document.querySelectorAll('#layouts .pick')) {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  }
  for (const b of document.querySelectorAll('#tones .swatch')) {
    b.classList.toggle('active', b.dataset.tone === state.tone);
  }
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  const panel = state.panels[selected];
  selectedLabel.textContent = `Panel ${selected + 1} — photo slot ${panel.slot + 1}`;
  setSlider('zoom', Math.round(panel.zoom * 100));
  setSlider('panx', Math.round(panel.panX * 100));
  setSlider('pany', Math.round(panel.panY * 100));
  setSlider('rotate', panel.rotate);
  for (let i = 0; i < SLOT_COUNT; i++) {
    const name = document.getElementById(`slot-name-${i}`);
    name.textContent = photos[i] ? photos[i].dataset.label : 'empty slot';
  }
}

function setSlider(id, value) {
  const input = document.getElementById(id);
  input.value = value;
  document.getElementById(`${id}-val`).textContent = id === 'zoom' ? `${value}%` : `${value}`;
}

function bindSlider(id, apply) {
  document.getElementById(id).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    apply(value);
    setSlider(id, value);
    redraw();
  });
  document.getElementById(id).addEventListener('change', () => pushUndo());
}

function bindSlots() {
  for (let i = 0; i < SLOT_COUNT; i++) {
    const file = document.getElementById(`slot-file-${i}`);
    file.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const img = await loadImage(URL.createObjectURL(f));
      img.dataset.label = f.name;
      photos[i] = img;
      pushUndo();
      syncControls();
      redraw();
      statusEl.textContent = `Loaded ${f.name} into slot ${i + 1}.`;
    });
    document.getElementById(`slot-sample-${i}`).addEventListener('click', async () => {
      const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
      const img = await loadImage(`samples/${name}.jpg`);
      img.dataset.label = `${name}.jpg (sample)`;
      photos[i] = img;
      pushUndo();
      syncControls();
      redraw();
    });
  }
}

function bindPanelCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const hit = panelAt(state, canvas.width, canvas.height, px, py);
    if (hit >= 0) {
      selected = hit;
      dragging = true;
      lastX = px;
      lastY = py;
      pushUndo();
      syncControls();
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const panel = state.panels[selected];
    panel.panX = Math.max(-0.4, Math.min(0.4, panel.panX + (px - lastX) / canvas.width));
    panel.panY = Math.max(-0.4, Math.min(0.4, panel.panY + (py - lastY) / canvas.height));
    lastX = px;
    lastY = py;
    setSlider('panx', Math.round(panel.panX * 100));
    setSlider('pany', Math.round(panel.panY * 100));
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selected];
    panel.zoom = Math.max(0.5, Math.min(2.5, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    setSlider('zoom', Math.round(panel.zoom * 100));
    redraw();
  }, { passive: false });
}

// ---- export ----

const SIZES = {
  square: { w: 1080, h: 1080, name: 'vice-nights-1080x1080.png' },
  portrait: { w: 1080, h: 1350, name: 'vice-nights-1080x1350.png' },
  wide: { w: 1920, h: 1080, name: 'vice-nights-1920x1080.png' },
};

function exportSize(key) {
  const size = SIZES[key];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state, photos);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = size.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved ${size.name}`;
  }, 'image/png');
}

function bindExport() {
  document.getElementById('export-square').addEventListener('click', () => exportSize('square'));
  document.getElementById('export-portrait').addEventListener('click', () => exportSize('portrait'));
  document.getElementById('export-wide').addEventListener('click', () => exportSize('wide'));
  document.getElementById('export-all').addEventListener('click', () => {
    for (const key of Object.keys(SIZES)) exportSize(key);
    statusEl.textContent = 'Saved all three sizes.';
  });
}

function bindHistory() {
  document.getElementById('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    applySnapshot(undoStack.pop());
    refreshUndoButtons();
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    applySnapshot(redoStack.pop());
    refreshUndoButtons();
  });
  document.getElementById('randomize').addEventListener('click', () => {
    pushUndo();
    const layouts = Object.keys(LAYOUTS);
    const tones = Object.keys(TONES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.tone = tones[Math.floor(Math.random() * tones.length)];
    for (const panel of state.panels) {
      panel.zoom = 0.9 + Math.random() * 0.7;
      panel.panX = (Math.random() - 0.5) * 0.3;
      panel.panY = (Math.random() - 0.5) * 0.3;
      panel.rotate = Math.round((Math.random() - 0.5) * 10);
    }
    syncControls();
    redraw();
  });
  document.getElementById('reset').addEventListener('click', () => {
    pushUndo();
    state = defaultState();
    syncControls();
    redraw();
  });
}

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
titleInput.addEventListener('change', () => pushUndo());
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
subtitleInput.addEventListener('change', () => pushUndo());

buildPickers();
bindSlots();
bindPanelCanvas();
bindExport();
bindHistory();
bindSlider('zoom', (v) => { state.panels[selected].zoom = v / 100; });
bindSlider('panx', (v) => { state.panels[selected].panX = v / 100; });
bindSlider('pany', (v) => { state.panels[selected].panY = v / 100; });
bindSlider('rotate', (v) => { state.panels[selected].rotate = v; });
refreshUndoButtons();

async function start() {
  await loadFonts();
  // Sample photos into the first two slots so the cover is alive at once.
  for (let i = 0; i < 2; i++) {
    try {
      const img = await loadImage(`samples/${SAMPLE_NAMES[i]}.jpg`);
      img.dataset.label = `${SAMPLE_NAMES[i]}.jpg (sample)`;
      photos[i] = img;
    } catch {
      photos[i] = null;
    }
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    if (shot === 'cover') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    await runShot(shot, params, {
      async setupShot({ layout, tone, title, subtitle, photoA, photoB }) {
        state.layout = layout;
        state.tone = tone;
        state.title = title;
        state.subtitle = subtitle;
        const a = await loadImage(`samples/${photoA}.jpg`);
        a.dataset.label = `${photoA}.jpg (sample)`;
        const b = await loadImage(`samples/${photoB}.jpg`);
        b.dataset.label = `${photoB}.jpg (sample)`;
        photos = [a, b, a];
        state.panels = defaultPanels();
        syncControls();
        redraw();
      },
    });
  } else {
    syncControls();
    redraw();
  }
}

start();
