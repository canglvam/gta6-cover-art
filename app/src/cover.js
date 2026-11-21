// Vice Nights — the cover engine. Draws a multi-panel GTA-style poster cover onto any
// canvas at any size. Everything is proportional, so the same state renders a square,
// portrait or landscape cover. Photos are drawn cover-fit per panel with per-panel
// pan, zoom and rotation; the caption band is lettered with Bebas Neue (title) and
// Great Vibes (subtitle) over a procedural synthwave sun and palm silhouettes.

export const TONES = {
  sunset: {
    label: 'Vice Sunset',
    washTop: 'rgba(255, 122, 26, 0)',
    washBottom: 'rgba(214, 48, 120, 0.55)',
    tint: '#ff7a1a',
    accent: '#ff2e88',
    band: '#1c0b2e',
    bandTop: 'rgba(28, 11, 46, 0.92)',
  },
  neon: {
    label: 'Neon Nights',
    washTop: 'rgba(0, 229, 255, 0)',
    washBottom: 'rgba(255, 0, 128, 0.5)',
    tint: '#00e5ff',
    accent: '#ff2e88',
    band: '#0a0618',
    bandTop: 'rgba(10, 6, 24, 0.92)',
  },
  gold: {
    label: 'Golden Hour',
    washTop: 'rgba(255, 196, 0, 0)',
    washBottom: 'rgba(176, 92, 0, 0.55)',
    tint: '#ffc400',
    accent: '#ff8f00',
    band: '#241503',
    bandTop: 'rgba(36, 21, 3, 0.92)',
  },
  teal: {
    label: 'Noir Teal',
    washTop: 'rgba(0, 255, 204, 0)',
    washBottom: 'rgba(0, 64, 96, 0.6)',
    tint: '#00ffcc',
    accent: '#00e5ff',
    band: '#03181c',
    bandTop: 'rgba(3, 24, 28, 0.92)',
  },
  mono: {
    label: 'Mono Heat',
    washTop: 'rgba(255, 255, 255, 0)',
    washBottom: 'rgba(0, 0, 0, 0.5)',
    tint: '#ffffff',
    accent: '#ff2e88',
    band: '#111111',
    bandTop: 'rgba(17, 17, 17, 0.92)',
  },
};

// Panel rectangles are fractions of the photo area (x, y, w, h). The photo area is
// the top of the cover; the caption band takes the bottom 22%.
export const LAYOUTS = {
  hero: {
    label: 'Hero Split',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.6, w: 0.49, h: 0.4 },
      { x: 0.51, y: 0.6, w: 0.49, h: 0.4 },
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.34, y: 0, w: 0.32, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
  },
  quad: {
    label: 'Quad',
    panels: [
      { x: 0, y: 0, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0, w: 0.49, h: 0.49 },
      { x: 0, y: 0.51, w: 0.49, h: 0.49 },
      { x: 0.51, y: 0.51, w: 0.49, h: 0.49 },
    ],
  },
  full: {
    label: 'Full Frame',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  strip: {
    label: 'Center Strip',
    panels: [
      { x: 0, y: 0, w: 0.24, h: 1 },
      { x: 0.26, y: 0, w: 0.48, h: 1 },
      { x: 0.76, y: 0, w: 0.24, h: 1 },
    ],
  },
};

export const BAND_FRACTION = 0.22;

// Deterministic grain so every render of the same state looks the same.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A synthwave sun: a disc cut by horizontal slats that widen toward the bottom. */
export function drawSun(ctx, cx, cy, r, top, bottom) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slats: erase widening horizontal bands from the lower half.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let gap = r * 0.05;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
    y += gap + r * 0.16;
    gap *= 1.7;
  }
  ctx.restore();
}

/** A palm silhouette: a leaning trunk with long fronds that arc up and droop down. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a clear S-curve leaning right, thick enough to read at small sizes.
  ctx.lineWidth = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x - s * 0.05, y - s * 0.35,
    x + s * 0.1, y - s * 0.65,
    x + s * 0.28, y - s * 0.92,
  );
  ctx.stroke();
  const topX = x + s * 0.28;
  const topY = y - s * 0.92;
  // Fronds: each arcs out and up, then droops below the crown — never a starburst.
  // [control-x, control-y, end-x, end-y] relative to the crown, in units of s.
  const fronds = [
    [-0.95, -0.35, -1.55, 0.55],
    [-0.6, -0.7, -1.05, 0.15],
    [-0.15, -0.85, -0.3, -0.1],
    [0.3, -0.85, 0.55, -0.15],
    [0.7, -0.65, 1.15, 0.25],
    [0.95, -0.25, 1.5, 0.65],
  ];
  ctx.lineWidth = s * 0.05;
  for (const [cx, cy, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + s * cx, topY + s * cy, topX + s * ex, topY + s * ey);
    ctx.stroke();
  }
  // Coconuts under the crown.
  ctx.beginPath();
  ctx.arc(topX - s * 0.05, topY + s * 0.07, s * 0.05, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.06, topY + s * 0.09, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPhotoInto(ctx, photo, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo) {
    // Empty slot: a dark gradient with a plus sign inviting a photo.
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#2a2140');
    g.addColorStop(1, '#120d1f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(2, w * 0.012);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 ${Math.max(10, h * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', cx, cy + r + h * 0.07);
    ctx.restore();
    return;
  }
  // Cover-fit with per-panel zoom, pan and rotation around the panel centre.
  const zoom = panel.zoom ?? 1;
  const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * base;
  const ph = photo.naturalHeight * base;
  const cx = x + w / 2 + (panel.panX ?? 0) * w;
  const cy = y + h / 2 + (panel.panY ?? 0) * h;
  ctx.translate(cx, cy);
  ctx.rotate(((panel.rotate ?? 0) * Math.PI) / 180);
  ctx.drawImage(photo, -pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

function applyGrade(ctx, w, h, tone, photoH) {
  // Warm wash rising from the bottom of the photo area.
  const wash = ctx.createLinearGradient(0, photoH * 0.3, 0, photoH);
  wash.addColorStop(0, tone.washTop);
  wash.addColorStop(1, tone.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, photoH);
  // Soft-light tint for the neon/sunset pop.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tone.tint;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, w, photoH);
  ctx.restore();
  // Vignette.
  const vg = ctx.createRadialGradient(
    w / 2, photoH / 2, Math.min(w, photoH) * 0.35,
    w / 2, photoH / 2, Math.max(w, photoH) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, photoH);
  // Grain, seeded so the same state always renders the same dots.
  const rand = mulberry32(20261119);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const dots = Math.floor((w * photoH) / 900);
  for (let i = 0; i < dots; i++) {
    const dx = rand() * w;
    const dy = rand() * photoH;
    ctx.fillRect(dx, dy, 1.6, 1.6);
  }
  ctx.restore();
}

function drawCaptionBand(ctx, w, h, state, tone) {
  const bandH = h * BAND_FRACTION;
  const bandY = h - bandH;
  const grad = ctx.createLinearGradient(0, bandY, 0, h);
  grad.addColorStop(0, tone.bandTop);
  grad.addColorStop(1, tone.band);
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandY, w, bandH);
  // Accent rule above the band.
  ctx.fillStyle = tone.accent;
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  // Sun at the right end of the band, small enough to clear the title.
  const sunR = bandH * 0.28;
  const sunX = w - bandH * 0.42;
  const sunY = bandY + bandH * 0.44;
  drawSun(ctx, sunX, sunY, sunR, tone.tint, tone.accent);
  // Palm at the left end, in the accent colour so it reads as a silhouette.
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawPalm(ctx, bandH * 0.3, bandY + bandH * 0.96, bandH * 0.55, tone.accent);
  ctx.restore();
  // Title: Bebas Neue, white with a dark outline and an accent shadow.
  const title = (state.title || '').trim().toUpperCase() || 'VICE NIGHTS';
  let size = bandH * 0.52;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = w * 0.68;
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  while (ctx.measureText(title).width > maxW && size > 14) {
    size -= 2;
    ctx.font = `${size}px "Bebas Neue", sans-serif`;
  }
  const titleY = bandY + bandH * 0.4;
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(title, w / 2, titleY);
  ctx.shadowColor = tone.accent;
  ctx.shadowBlur = size * 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, w / 2, titleY);
  ctx.shadowBlur = 0;
  // Subtitle in script, accent colour.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = bandH * 0.26;
    ctx.font = `${subSize}px "Great Vibes", cursive`;
    ctx.fillStyle = tone.accent;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.82);
  }
  // Small tag under the sun, clear of its slats.
  ctx.font = `600 ${Math.max(9, bandH * 0.11)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('EST. 2026', sunX, bandY + bandH * 0.9);
}

/**
 * Draws the whole cover. `state` is { layout, tone, title, subtitle, panels },
 * `photos` is an array of HTMLImageElements (or nulls), one per slot. Panels map
 * to slots by index (panel i uses photos[i % photos.length]).
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const tone = TONES[state.tone] ?? TONES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;
  const photoH = h * (1 - BAND_FRACTION);
  const gutter = Math.round(Math.min(w, h) * 0.012);
  const frame = Math.round(Math.min(w, h) * 0.018);

  // White poster frame.
  ctx.fillStyle = '#f5f1ea';
  ctx.fillRect(0, 0, w, h);
  // Photo area.
  const area = { x: frame, y: frame, w: w - frame * 2, h: photoH - frame };
  ctx.fillStyle = '#120d1f';
  ctx.fillRect(area.x, area.y, area.w, area.h);
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    const rect = {
      x: area.x + p.x * area.w + (p.x > 0 ? gutter / 2 : 0),
      y: area.y + p.y * area.h + (p.y > 0 ? gutter / 2 : 0),
      w: p.w * area.w - (p.x > 0 ? gutter / 2 : 0) - (p.x + p.w < 1 ? gutter / 2 : 0),
      h: p.h * area.h - (p.y > 0 ? gutter / 2 : 0) - (p.y + p.h < 1 ? gutter / 2 : 0),
    };
    const panelState = state.panels?.[i] ?? {};
    const photo = photos[(panelState.slot ?? i) % photos.length] ?? null;
    drawPhotoInto(ctx, photo, rect, panelState);
  }
  applyGrade(ctx, w, h, tone, photoH);
  drawCaptionBand(ctx, w, h, state, tone);
}

/** Hit-tests a point (in canvas pixels) against the layout's panels. */
export function panelAt(state, canvasW, canvasH, px, py) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero;
  const photoH = canvasH * (1 - BAND_FRACTION);
  const frame = Math.round(Math.min(canvasW, canvasH) * 0.018);
  const area = { x: frame, y: frame, w: canvasW - frame * 2, h: photoH - frame };
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    const x = area.x + p.x * area.w;
    const y = area.y + p.y * area.h;
    if (px >= x && px <= x + p.w * area.w && py >= y && py <= y + p.h * area.h) return i;
  }
  return -1;
}
