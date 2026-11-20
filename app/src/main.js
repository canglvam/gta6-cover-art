// Neon Coast editor: upload photos, pick a layout and grade, write the caption,
// crop each panel by dragging, and export the cover as a PNG. Photos never leave
// this machine. A `?shot=` query sets up a fixed scene for a screenshot instead.
import { drawCover, drawSelection, layoutSlots, defaultPanels, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const state = {
  layout: 'grid9',
  grade: 'sunset',
  title: 'Neon Shore',
  subtitle: 'a sunset coast story',
  badge: 'EST. 2026',
  size: 'wide',
  grain: true,
  vignette: true,
  halftone: true,
  photos: [], // {img, name, thumb}
  panels: defaultPanels(9, [], null),
  selected: 0,
};

// --- history (undo / redo) -------------------------------------------------
const undoStack = [];
const redoStack = [];
let editing = false;

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, badge: state.badge, size: state.size,
    grain: state.grain, vignette: state.vignette, halftone: state.halftone,
    panels: state.panels, selected: state.selected,
  });
}
function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.photos = state.photos; // photos are never part of a snapshot
  resizeCanvas();
  syncControls();
  redraw();
}
/** Records the state before a discrete change, so undo can return to it. */
function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}
function beginEdit() {
  if (!editing) { commit(); editing = true; }
}
function endEdit() { editing = false; }
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  syncUndoButtons();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  syncUndoButtons();
}
function syncUndoButtons() {
  document.getElementById('undo').disabled = !undoStack.length;
  document.getElementById('redo').disabled = !redoStack.length;
}

// --- drawing ---------------------------------------------------------------
function resizeCanvas() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
}
function redraw() {
  drawCover(canvas, state);
  // the selection outline is an editor aid: never on a cover shot
  if (!document.body.classList.contains('shot-cover')) drawSelection(ctx, state, state.selected);
}
function selectedPanel() {
  return state.panels[state.selected] || { photo: 0, zoom: 1, ox: 0, oy: 0, rot: 0 };
}
function panelAspects() {
  return layoutSlots(state.layout, canvas.width, canvas.height).panels.map((r) => r.w / r.h);
}
function freshPanels() {
  return defaultPanels(
    LAYOUTS[state.layout].slots,
    state.photos.map((p) => p.img),
    panelAspects(),
  );
}
function ensurePanels() {
  const count = LAYOUTS[state.layout].slots;
  while (state.panels.length < count) {
    state.panels.push(freshPanels()[state.panels.length]);
  }
  if (state.selected >= count) state.selected = 0;
}

// --- photos ----------------------------------------------------------------
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
function thumbnail(img) {
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const s = Math.max(128 / img.naturalWidth, 128 / img.naturalHeight);
  c.drawImage(img, (128 - img.naturalWidth * s) / 2, (128 - img.naturalHeight * s) / 2,
    img.naturalWidth * s, img.naturalHeight * s);
  return t.toDataURL('image/jpeg', 0.8);
}
function addPhoto(img, name) {
  state.photos.push({ img, name, thumb: thumbnail(img) });
  // panels that had no photo yet take the new one in turn
  state.panels.forEach((p, i) => { if (!state.photos[p.photo]) p.photo = state.photos.length - 1; });
  renderTray();
}
async function addSample(name) {
  if (state.photos.some((p) => p.name === name)) return;
  const img = await loadImage(`samples/${name}.jpg`);
  addPhoto(img, name);
}
function renderTray() {
  const tray = document.getElementById('tray');
  tray.innerHTML = '';
  state.photos.forEach((p, i) => {
    const el = document.createElement('img');
    el.src = p.thumb;
    el.alt = p.name;
    el.title = p.name;
    if (selectedPanel().photo === i) el.classList.add('active');
    if (state.panels.some((panel) => panel.photo === i)) el.classList.add('assigned');
    el.addEventListener('click', () => {
      commit();
      selectedPanel().photo = i;
      renderTray();
      redraw();
      status.textContent = `Panel ${state.selected + 1} now shows ${p.name}.`;
    });
    tray.appendChild(el);
  });
}

// --- controls --------------------------------------------------------------
function buildPickers() {
  const layouts = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      commit();
      state.layout = key;
      ensurePanels();
      syncControls();
      redraw();
    });
    layouts.appendChild(b);
  });
  const grades = document.getElementById('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.title = def.name;
    b.dataset.grade = key;
    b.style.background = `linear-gradient(135deg, ${def.stops[0] || '#888'}, ${def.stops[def.stops.length - 1] || '#444'})`;
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      commit();
      state.grade = key;
      syncControls();
      redraw();
    });
    grades.appendChild(b);
  });
  const sizes = document.getElementById('sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.dataset.size = key;
    b.addEventListener('click', () => {
      if (state.size === key) return;
      commit();
      state.size = key;
      resizeCanvas();
      syncControls();
      redraw();
    });
    sizes.appendChild(b);
  });
}
function syncControls() {
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizes button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('halftone').checked = state.halftone;
  const p = selectedPanel();
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('rotate').value = p.rot;
  renderTray();
}

function wireTextInputs() {
  const bind = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('focus', beginEdit);
    el.addEventListener('input', () => { state[key] = el.value; redraw(); });
    el.addEventListener('blur', endEdit);
    el.addEventListener('change', endEdit);
  };
  bind('title', 'title');
  bind('subtitle', 'subtitle');
  bind('badge', 'badge');
  ['grain', 'vignette', 'halftone'].forEach((key) => {
    document.getElementById(key).addEventListener('change', (e) => {
      commit();
      state[key] = e.target.checked;
      redraw();
    });
  });
  const zoom = document.getElementById('zoom');
  zoom.addEventListener('pointerdown', beginEdit);
  zoom.addEventListener('input', () => { selectedPanel().zoom = Number(zoom.value); redraw(); });
  zoom.addEventListener('change', endEdit);
  const rotate = document.getElementById('rotate');
  rotate.addEventListener('pointerdown', beginEdit);
  rotate.addEventListener('input', () => { selectedPanel().rot = Number(rotate.value); redraw(); });
  rotate.addEventListener('change', endEdit);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
}

function wireUploads() {
  document.getElementById('photo').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const img = await loadImage(URL.createObjectURL(file));
      commit();
      addPhoto(img, file.name);
    }
    redraw();
    status.textContent = `${state.photos.length} photo(s) loaded. Click one to put it in the selected panel.`;
    e.target.value = '';
  });
  document.getElementById('sample-boulevard').addEventListener('click', async () => {
    await addSample('boulevard');
    redraw();
  });
  document.getElementById('sample-pier').addEventListener('click', async () => {
    await addSample('pier');
    redraw();
  });
}

// --- canvas interaction: select a panel, drag to pan, scroll to zoom --------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
function hitPanel(pt) {
  const { panels } = layoutSlots(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const rect = panels[i];
    let px = pt.x - (rect.x + rect.w / 2);
    let py = pt.y - (rect.y + rect.h / 2);
    if (rect.rot) {
      const a = (-rect.rot * Math.PI) / 180;
      const rx = px * Math.cos(a) - py * Math.sin(a);
      const ry = px * Math.sin(a) + py * Math.cos(a);
      px = rx; py = ry;
    }
    if (Math.abs(px) <= rect.w / 2 && Math.abs(py) <= rect.h / 2) return i;
  }
  return -1;
}
function wireCanvas() {
  let drag = null;
  let wheelTimer = null;
  canvas.addEventListener('pointerdown', (e) => {
    const pt = canvasPoint(e);
    const i = hitPanel(pt);
    if (i < 0) return;
    beginEdit();
    state.selected = i;
    syncControls();
    const rect = layoutSlots(state.layout, canvas.width, canvas.height).panels[i];
    drag = { last: pt, rect };
    canvas.classList.add('dragging');
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = canvasPoint(e);
    const p = selectedPanel();
    p.ox += (pt.x - drag.last.x) / drag.rect.w;
    p.oy += (pt.y - drag.last.y) / drag.rect.h;
    p.ox = Math.max(-1, Math.min(1, p.ox));
    p.oy = Math.max(-1, Math.min(1, p.oy));
    drag.last = pt;
    redraw();
  });
  const endDrag = () => { drag = null; canvas.classList.remove('dragging'); endEdit(); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pt = canvasPoint(e);
    const i = hitPanel(pt);
    if (i < 0) return;
    if (!editing) beginEdit();
    state.selected = i;
    const p = selectedPanel();
    p.zoom = Math.max(1, Math.min(3, p.zoom * Math.exp(-e.deltaY * 0.0012)));
    syncControls();
    redraw();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(endEdit, 400);
  }, { passive: false });
}

// --- export ----------------------------------------------------------------
function slug(text) {
  return (text || 'cover').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}
function renderAt(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  return off;
}
function exportPNG(sizeKey) {
  return new Promise((resolve) => {
    const off = renderAt(sizeKey);
    const name = `${slug(state.title)}-${SIZES[sizeKey].w}x${SIZES[sizeKey].h}.png`;
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      status.textContent = `Saved ${name}`;
      resolve(name);
    }, 'image/png');
  });
}
function wireExport() {
  document.getElementById('export').addEventListener('click', () => exportPNG(state.size));
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) {
      await exportPNG(key);
      await new Promise((r) => setTimeout(r, 400));
    }
    status.textContent = 'Saved all three sizes.';
  });
}

// --- boot ------------------------------------------------------------------
buildPickers();
wireTextInputs();
wireUploads();
wireCanvas();
wireExport();
resizeCanvas();
syncControls();
syncUndoButtons();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (photos, settings) => {
    for (const name of photos) await addSample(name);
    if (settings) {
      if (settings.layout) state.layout = settings.layout;
      if (settings.grade) state.grade = settings.grade;
      if (settings.size) state.size = settings.size;
      if (settings.title !== undefined) state.title = settings.title;
      if (settings.subtitle !== undefined) state.subtitle = settings.subtitle;
      if (settings.badge !== undefined) state.badge = settings.badge;
    }
    // fresh panels for this scene: cycle the loaded photos with varied framings
    // (resize first: the framing bias depends on the cover's own aspect ratio)
    resizeCanvas();
    state.panels = freshPanels();
    ensurePanels();
    syncControls();
    redraw();
  });
} else {
  // the app opens with both samples already in, so one click exports a cover
  Promise.all([addSample('boulevard'), addSample('pier')]).then(() => {
    state.panels = freshPanels();
    redraw();
  });
  redraw();
}

// lettering fonts arrive after the first paint; redraw once they are ready
document.fonts.ready.then(() => redraw());

// test hook: lets the screenshot script export covers without clicking
window.__coverApp = {
  state,
  redraw,
  exportDataURL(sizeKey) {
    return new Promise((resolve) => renderAt(sizeKey).toBlob(
      (b) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(b); },
      'image/png',
    ));
  },
};
