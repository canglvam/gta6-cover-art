// Vice Cover Studio — cover renderer (pure canvas, no DOM).
// Draws a GTA-poster-style multi-panel cover from a state object:
// pick a layout, a colour grade, a title and a photo per panel,
// and the renderer paints panels, grade, grain, lettering and badge.

export const LAYOUTS = {
  'hero-split': { name: 'Hero Split', panels: 3 },
  triptych: { name: 'Triptych', panels: 3 },
  full: { name: 'Full Frame', panels: 1 },
  quad: { name: 'Quad', panels: 4 },
};

export const TONES = {
  sunset: { name: 'Vice Sunset', top: '#ff9a3d', bottom: '#ff2e63', tint: '#ff7a18', accent: '#ffd166' },
  neon: { name: 'Neon Nights', top: '#ff2ea6', bottom: '#00e5ff', tint: '#b537f2', accent: '#00e5ff' },
  gold: { name: 'Golden Hour', top: '#ffc93d', bottom: '#ff7b00', tint: '#ffb703', accent: '#ffe08a' },
  noir: { name: 'Noir Teal', top: '#7dd3d8', bottom: '#0f2027', tint: '#5bc0be', accent: '#e0fbfc' },
};

export const POST_SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

// Panel rectangles for a layout, in pixels. The bottom 20% of the canvas
// is the title band; panels fill the area above it (the full-bleed panel
// runs under the band and the band darkens over it).
export function panelRects(layout, W, H) {
  const m = W * 0.018; // outer margin
  const g = W * 0.014; // gutter between panels
  const bandH = H * 0.2;
  const top = m;
  const areaH = H - bandH - m;
  const areaW = W - m * 2;
  const col = (i, n) => m + i * (areaW + g) / n;
  const colW = (n) => (areaW - g * (n - 1)) / n;
  const row = (i, n) => top + i * (areaH + g) / n;
  const rowH = (n) => (areaH - g * (n - 1)) / n;
  switch (layout) {
    case 'hero-split': {
      const lw = areaW * 0.62;
      return [
        { x: m, y: top, w: lw, h: areaH },
        { x: m + lw + g, y: top, w: areaW - lw - g, h: rowH(2) },
        { x: m + lw + g, y: row(1, 2), w: areaW - lw - g, h: rowH(2) },
      ];
    }
    case 'triptych':
      return [0, 1, 2].map((i) => ({ x: col(i, 3), y: top, w: colW(3), h: areaH }));
    case 'full':
      return [{ x: m, y: top, w: areaW, h: H - m - top }];
    case 'quad':
    default: {
      const cw = colW(2);
      const rh = rowH(2);
      return [
        { x: col(0, 2), y: row(0, 2), w: cw, h: rh },
        { x: col(1, 2), y: row(0, 2), w: cw, h: rh },
        { x: col(0, 2), y: row(1, 2), w: cw, h: rh },
        { x: col(1, 2), y: row(1, 2), w: cw, h: rh },
      ];
    }
  }
}

// Paint one photo into a panel rect, honouring the panel's crop transform:
// scale is a zoom multiplier over cover-fit, dx/dy pan in panel fractions,
// rot is a rotation in degrees about the panel centre.
export function drawPhoto(ctx, img, rect, t) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * (t.scale || 1);
  const cx = rect.x + rect.w / 2 + (t.dx || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (t.dy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(((t.rot || 0) * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 140;
  c.height = 140;
  const g = c.getContext('2d');
  const data = g.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  grainTile = ctx.createPattern(c, 'repeat');
  return grainTile;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The whole cover: panels, colour grade, vignette, grain, title band,
// big condensed title, script subtitle and a small badge pill.
export function drawCover(ctx, state, images, W, H) {
  const tone = TONES[state.tone] || TONES.sunset;
  const rects = panelRects(state.layout, W, H);
  const count = LAYOUTS[state.layout]?.panels || 1;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#120a18';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < count; i++) {
    const img = images[state.panels[i]?.photo];
    if (img) drawPhoto(ctx, img, rects[i], state.panels[i]);
    else {
      ctx.fillStyle = '#241a30';
      ctx.fillRect(rects[i].x, rects[i].y, rects[i].w, rects[i].h);
    }
  }
  // Colour grade: a sunset/neon wash over everything, then a tint.
  const grad = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grad.addColorStop(0, tone.top);
  grad.addColorStop(1, tone.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = tone.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Vignette and film grain.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // Title band: a dark fade so the lettering reads on any photo.
  const bandH = H * 0.2;
  const bandY = H - bandH;
  const fade = ctx.createLinearGradient(0, bandY - H * 0.08, 0, H);
  fade.addColorStop(0, 'rgba(8,4,14,0)');
  fade.addColorStop(1, 'rgba(8,4,14,0.66)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY - H * 0.08, W, bandH + H * 0.08);
  // Badge pill, top left.
  if (state.badge) {
    const fs = H * 0.026;
    ctx.font = `${fs}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(fs * 0.18)}px`; } catch { /* older canvas */ }
    const tw = ctx.measureText(state.badge.toUpperCase()).width;
    const padX = W * 0.016;
    const bx = W * 0.018;
    const by = H * 0.018;
    const bh = fs * 1.9;
    ctx.save();
    ctx.fillStyle = 'rgba(10,6,16,0.62)';
    roundRect(ctx, bx, by, tw + padX * 2, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = tone.accent;
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge.toUpperCase(), bx + padX, by + bh / 2 + fs * 0.04);
    ctx.restore();
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  // Big title, shrunk to fit, with a dark outline and a drop shadow.
  const title = (state.title || '').toUpperCase();
  let fs = H * 0.105;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fs}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(fs * 0.03)}px`; } catch { /* older canvas */ }
  const maxW = W * 0.92;
  let tw = ctx.measureText(title).width;
  while (tw > maxW && fs > H * 0.03) {
    fs *= 0.92;
    ctx.font = `${fs}px Anton, sans-serif`;
    tw = ctx.measureText(title).width;
  }
  const titleY = bandY + bandH * 0.42;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = H * 0.012;
  ctx.shadowOffsetY = H * 0.005;
  ctx.lineWidth = Math.max(2, fs * 0.09);
  ctx.strokeStyle = 'rgba(16,6,20,0.9)';
  ctx.strokeText(title, W / 2, titleY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, W / 2, titleY);
  ctx.restore();
  // Script subtitle under the title.
  if (state.subtitle) {
    const sfs = H * 0.042;
    ctx.font = `${sfs}px Pacifico, cursive`;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    ctx.fillStyle = tone.accent;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = H * 0.006;
    ctx.shadowOffsetY = H * 0.002;
    ctx.fillText(state.subtitle, W / 2, bandY + bandH * 0.82);
    ctx.restore();
  }
  // Outer frame.
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeRect(0, 0, W, H);
}

// Fresh default state: three panels, sunset grade, sample photos in.
export function defaultState() {
  return {
    layout: 'hero-split',
    tone: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'Vice City',
    badge: 'Vice City',
    panels: [
      { photo: 'pier', scale: 1, dx: 0, dy: 0, rot: 0 },
      { photo: 'boulevard', scale: 1, dx: 0, dy: 0, rot: 0 },
      { photo: 'pier', scale: 1, dx: 0, dy: 0, rot: 0 },
      { photo: 'boulevard', scale: 1, dx: 0, dy: 0, rot: 0 },
    ],
  };
}
