// Neon Coast cover engine: draws a GTA-style multi-panel poster onto a 2D canvas.
// Everything is drawn in code — no Rockstar logo, artwork or font. Lettering uses
// Anton (display) and Pacifico (script), both vendored under the SIL Open Font License.

export const LAYOUTS = {
  grid9: { name: 'Nine-panel grid', slots: 9 },
  hero3: { name: 'Hero + three', slots: 4 },
  tilt: { name: 'Tilted snapshots', slots: 3 },
  fullbleed: { name: 'Full bleed', slots: 1 },
  grid4: { name: 'Four-panel grid', slots: 4 },
  strips: { name: 'Three strips', slots: 3 },
};

export const GRADES = {
  sunset: {
    name: 'Vice Sunset', base: '#1c0b33',
    stops: ['#ffb347', '#ff5e62', '#c0249b', '#5b2a86'], mode: 'overlay', alpha: 0.55,
    title: ['#ffe259', '#ff7e5f', '#ff2e88'],
  },
  neon: {
    name: 'Neon Nights', base: '#0a061f',
    stops: ['#00e5ff', '#7b2ff7', '#ff2d95'], mode: 'overlay', alpha: 0.6,
    title: ['#7df9ff', '#b967ff', '#ff2d95'],
  },
  golden: {
    name: 'Golden Hour', base: '#241505',
    stops: ['#ffe259', '#ffa751', '#e25822'], mode: 'soft-light', alpha: 0.85,
    title: ['#fff3b0', '#ffc46b', '#ff8c42'],
  },
  dusk: {
    name: 'Teal Dusk', base: '#06182e',
    stops: ['#2dd4ff', '#2b6cb0', '#1b3a8f'], mode: 'overlay', alpha: 0.55,
    title: ['#bfe9ff', '#6ec1ff', '#4a6cf7'],
  },
  noir: {
    name: 'Mono Noir', base: '#111111',
    stops: [], mode: 'none', alpha: 0, filter: 'grayscale(1) contrast(1.25) brightness(1.05)',
    title: ['#ffffff', '#e8e8e8', '#bdbdbd'],
  },
  original: {
    name: 'Original', base: '#20142e',
    stops: ['#ffffff'], mode: 'soft-light', alpha: 0.25,
    title: ['#ffffff', '#ffe9c9', '#ffb46b'],
  },
};

export const SIZES = {
  square: { name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { name: 'Story 1080 x 1350', w: 1080, h: 1350 },
  wide: { name: 'Landscape 1920 x 1080', w: 1920, h: 1080 },
};

const TITLE_FRACTION = 0.17; // bottom band of the cover holds the title block

/** Panel rectangles for a layout, as fractions of the cover, plus the title band. */
export function layoutSlots(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.008)); // white gutter between panels
  const ph = h * (1 - TITLE_FRACTION); // panel area height
  const title = { x: 0, y: ph, w, h: h - ph };
  let panels = [];
  if (layout === 'grid9') {
    const cw = (w - g * 4) / 3, ch = (ph - g * 4) / 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
    }
  } else if (layout === 'grid4') {
    const cw = (w - g * 3) / 2, ch = (ph - g * 3) / 2;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
    }
  } else if (layout === 'strips') {
    const cw = (w - g * 4) / 3;
    for (let c = 0; c < 3; c++) {
      panels.push({ x: g + c * (cw + g), y: g, w: cw, h: ph - g * 2, rot: 0 });
    }
  } else if (layout === 'hero3') {
    const hw = w * 0.6, rx = hw + g, rw = w - rx - g;
    const ch = (ph - g * 4) / 3;
    panels.push({ x: g, y: g, w: hw - g, h: ph - g * 2, rot: 0 });
    for (let r = 0; r < 3; r++) {
      panels.push({ x: rx, y: g + r * (ch + g), w: rw, h: ch, rot: 0 });
    }
  } else if (layout === 'tilt') {
    const cw = w * 0.4, ch = ph * 0.88;
    panels = [
      { x: w * 0.03, y: ph * 0.04, w: cw, h: ch, rot: -6 },
      { x: w * 0.32, y: ph * 0.0, w: cw, h: ch, rot: 2.5 },
      { x: w * 0.60, y: ph * 0.05, w: cw * 0.92, h: ch, rot: -2 },
    ];
  } else { // fullbleed
    panels = [{ x: 0, y: 0, w, h, rot: 0 }];
  }
  return { panels, title, gutter: g };
}

let noisePattern = null;
/** A reusable film-grain tile, drawn once and tiled over the cover. */
function grainTile(ctx) {
  if (noisePattern) return noisePattern;
  const t = document.createElement('canvas');
  t.width = 160; t.height = 160;
  const c = t.getContext('2d');
  const img = c.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 110);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  noisePattern = ctx.createPattern(t, 'repeat');
  return noisePattern;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's pan/zoom/rotation. */
function drawPhotoInPanel(ctx, photo, rect, panel, grade) {
  const { x, y, w, h, rot } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate((rot * Math.PI) / 180);
  const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const ox = (panel.ox || 0) * w;
  const oy = (panel.oy || 0) * h;
  if (grade.filter) ctx.filter = grade.filter;
  ctx.drawImage(photo, -pw / 2 + ox, -ph / 2 + oy, pw, ph);
  ctx.filter = 'none';
  if (grade.stops.length > 1) {
    const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    grade.stops.forEach((s, i) => grad.addColorStop(i / (grade.stops.length - 1), s));
    ctx.globalCompositeOperation = grade.mode;
    ctx.globalAlpha = grade.alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade.stops.length === 1) {
    ctx.globalCompositeOperation = grade.mode;
    ctx.globalAlpha = grade.alpha;
    ctx.fillStyle = grade.stops[0];
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  // white poster border + a hairline inner shadow so panels read as separate shots
  ctx.save();
  ctx.lineWidth = Math.max(2, Math.round(w * 0.006));
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

/** A rounded-rectangle path (ctx.roundRect is new in some browsers). */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Halftone dots across a band: bigger toward the right, like a printed poster. */
function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(9, Math.round(h / 7));
  ctx.fillStyle = color;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = (0.6 + 2.6 * ((xx - x) / w)) * (step / 9);
      ctx.beginPath();
      ctx.arc(xx, yy, Math.min(r, step * 0.42), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Fits text to a width by shrinking the font, then returns the size used. */
function fitFont(ctx, text, font, maxWidth, startSize) {
  let size = startSize;
  ctx.font = font(size);
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

/** The title band: halftone dark band, gradient Anton title, neon Pacifico subtitle. */
function drawTitleBand(ctx, state, band, grade) {
  const { x, y, w, h } = band;
  ctx.save();
  ctx.fillStyle = '#150826';
  ctx.fillRect(x, y, w, h);
  if (state.halftone) drawHalftone(ctx, x, y, w, h, 'rgba(255,255,255,0.10)');
  // neon rule along the top of the band
  const rule = ctx.createLinearGradient(x, 0, x + w, 0);
  grade.stops.forEach((s, i) => rule.addColorStop(i / Math.max(1, grade.stops.length - 1), s));
  ctx.fillStyle = rule;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.04));
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const titleMax = subtitle ? w * 0.60 : w * 0.92;
  if (title) {
    const size = fitFont(ctx, title, (s) => `${s}px Anton, sans-serif`, titleMax, h * 0.62);
    const grad = ctx.createLinearGradient(x + w * 0.04, 0, x + w * 0.04 + ctx.measureText(title).width, 0);
    grade.title.forEach((s, i) => grad.addColorStop(i / (grade.title.length - 1), s));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = 'rgba(16,4,36,0.9)';
    ctx.lineJoin = 'round';
    const tx = x + w * 0.04, ty = y + h * 0.56;
    ctx.strokeText(title, tx, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, tx, ty);
  }
  if (subtitle) {
    const size = fitFont(ctx, subtitle, (s) => `${s}px Pacifico, cursive`, w * 0.32, h * 0.34);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff5db1';
    ctx.shadowColor = '#ff2d95';
    ctx.shadowBlur = h * 0.14;
    ctx.fillText(subtitle, x + w * 0.96, y + h * 0.58);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/** A small rotated badge ribbon in the top-right corner of the cover. */
function drawBadge(ctx, state, w, h) {
  const text = (state.badge || '').trim();
  if (!text) return;
  const size = Math.max(14, Math.round(h * 0.028));
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + size * 1.6, bh = size * 1.9;
  ctx.translate(w - bw / 2 - w * 0.02, bh * 0.9);
  ctx.rotate(-0.1);
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(20,8,40,0.88)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = '#ff2d95';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
}

/** Draws the sunset-sky backdrop used by the tilted-snapshots layout. */
function drawSkyBackdrop(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#3b1d6e');
  sky.addColorStop(0.38, '#c65d8f');
  sky.addColorStop(0.58, '#ff7e5f');
  sky.addColorStop(0.75, '#feb47b');
  sky.addColorStop(1, '#2a1145');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // low sun with a soft glow, placed where the cards leave a gap
  const sx = w * 0.5, sy = h * 0.34, sr = h * 0.11;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.4);
  glow.addColorStop(0, 'rgba(255,214,130,0.9)');
  glow.addColorStop(1, 'rgba(255,214,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffdf8a';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  // distant skyline with a few lit windows along the bottom of the panel area
  const base = h * 0.74;
  // warm horizon glow so the band under the cards is not dead black
  const horizon = ctx.createLinearGradient(0, base - h * 0.12, 0, h);
  horizon.addColorStop(0, 'rgba(255,126,95,0)');
  horizon.addColorStop(0.6, 'rgba(255,126,95,0.35)');
  horizon.addColorStop(1, 'rgba(255,94,144,0.25)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, base - h * 0.12, w, h - base + h * 0.12);
  ctx.fillStyle = 'rgba(52,24,88,0.95)';
  const towers = [
    [0.02, 0.10, 0.20], [0.14, 0.16, 0.26], [0.32, 0.12, 0.16],
    [0.46, 0.20, 0.24], [0.68, 0.13, 0.18], [0.83, 0.17, 0.26],
  ];
  towers.forEach(([fx, fw, fh]) => {
    ctx.fillRect(w * fx, base - h * fh, w * fw, h * fh + h * 0.26);
  });
  ctx.fillRect(0, base, w, h - base);
  const lit = ['#ff5db1', '#00e5ff', '#ffd76a'];
  for (let i = 0; i < 64; i++) {
    const wx = w * (0.03 + 0.94 * ((i * 0.6180339) % 1));
    const wy = base - h * (0.02 + 0.22 * ((i * 0.381966) % 1));
    ctx.fillStyle = lit[i % 3];
    ctx.globalAlpha = 0.9;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.005), Math.max(2, w * 0.005));
  }
  ctx.globalAlpha = 1;
}

/** Draws the whole cover for `state` onto `canvas` (its own width/height). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grade.base;
  ctx.fillRect(0, 0, w, h);
  const { panels, title } = layoutSlots(state.layout, w, h);
  if (state.layout === 'tilt') drawSkyBackdrop(ctx, w, title.y, grade);
  panels.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0, rot: 0 };
    const entry = state.photos[panel.photo];
    const photo = entry && entry.img;
    if (!photo) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
      return;
    }
    if (state.layout === 'tilt') {
      // polaroid-style card: shadow + white frame, photo inside
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = w * 0.02;
      ctx.shadowOffsetY = h * 0.012;
      ctx.fillStyle = '#ffffff';
      const pad = Math.max(4, w * 0.006);
      ctx.fillRect(-rect.w / 2 - pad, -rect.h / 2 - pad, rect.w + pad * 2, rect.h + pad * 2);
      ctx.restore();
      drawPhotoInPanel(ctx, photo, rect, panel, grade);
    } else {
      drawPhotoInPanel(ctx, photo, rect, panel, grade);
    }
  });
  // full-bleed covers get a dark scrim under the title so the lettering pops
  if (state.layout === 'fullbleed') {
    const scrim = ctx.createLinearGradient(0, title.y - h * 0.1, 0, h);
    scrim.addColorStop(0, 'rgba(21,8,38,0)');
    scrim.addColorStop(1, 'rgba(21,8,38,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, title.y - h * 0.1, w, h - title.y + h * 0.1);
  }
  drawTitleBand(ctx, state, title, grade);
  drawBadge(ctx, state, w, h);
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainTile(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Outlines the selected panel on a preview canvas (editor only, never exported). */
export function drawSelection(ctx, state, selected) {
  if (selected == null) return;
  const { panels } = layoutSlots(state.layout, ctx.canvas.width, ctx.canvas.height);
  const rect = panels[selected];
  if (!rect) return;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = Math.max(3, ctx.canvas.width * 0.003);
  ctx.strokeStyle = '#00e5ff';
  ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.setLineDash([]);
  ctx.restore();
}

/** Default per-panel crops: alternate the photos with a different framing each.
 *  The vertical offset leans positive (photo down, showing its top) because the
 *  sample photos — and most portraits — keep the face in the upper third. For a
 *  panel much wider than its photo, the offset grows so the visible window, which
 *  is only a band of the photo's height, sits on the face instead of the torso:
 *  `aspects` holds each slot's width/height and `photos` the loaded images. */
export function defaultPanels(count, photos, aspects) {
  const frames = [
    { zoom: 1.08, ox: 0.04, oy: 0.07, rot: 0 },
    { zoom: 1.15, ox: -0.06, oy: 0.05, rot: 0 },
    { zoom: 1.05, ox: 0, oy: 0.08, rot: 0 },
    { zoom: 1.22, ox: 0.08, oy: 0.03, rot: 0 },
    { zoom: 1.12, ox: -0.03, oy: 0.06, rot: 0 },
    { zoom: 1.06, ox: 0.05, oy: 0.07, rot: 0 },
  ];
  const out = [];
  for (let i = 0; i < count; i++) {
    const f = frames[i % frames.length];
    const photo = photos && photos.length ? photos[i % photos.length] : null;
    let oy = f.oy;
    if (photo && aspects && aspects[i]) {
      const photoAspect = photo.naturalWidth / photo.naturalHeight;
      const panelAspect = aspects[i];
      if (panelAspect > photoAspect) {
        // visible height is only photoAspect/panelAspect of the photo: shift the
        // window up toward the face, at most to the photo's top edge
        const visible = photoAspect / panelAspect;
        oy += Math.min(0.8, (1 - visible) / (2 * visible));
      }
    }
    out.push({ photo: photos && photos.length ? i % photos.length : 0, zoom: f.zoom, ox: f.ox, oy, rot: f.rot });
  }
  return out;
}
