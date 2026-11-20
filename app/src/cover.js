// Palms & Neon — the cover renderer.
// Draws a multi-panel GTA-style poster cover onto any 2D canvas: the photos in
// their panels, a colour grade ("tone"), a synthwave sun and a palm silhouette,
// and the caption lettered in the genre's style. Pure canvas, no network.

export const LAYOUTS = [
  {
    id: 'classic',
    name: 'Classic',
    hint: 'Big hero panel, two stacked on the right',
    panels: [
      { slot: 0, x: 0, y: 0, w: 0.62, h: 0.78 },
      { slot: 1, x: 0.62, y: 0, w: 0.38, h: 0.39 },
      { slot: 2, x: 0.62, y: 0.39, w: 0.38, h: 0.39 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  {
    id: 'duo',
    name: 'Duo',
    hint: 'Two tall halves side by side',
    panels: [
      { slot: 0, x: 0, y: 0, w: 0.5, h: 0.8 },
      { slot: 1, x: 0.5, y: 0, w: 0.5, h: 0.8 },
    ],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: 'quad',
    name: 'Quad',
    hint: 'Four panels, hero photo twice',
    panels: [
      { slot: 0, x: 0, y: 0, w: 0.5, h: 0.4 },
      { slot: 1, x: 0.5, y: 0, w: 0.5, h: 0.4 },
      { slot: 2, x: 0, y: 0.4, w: 0.5, h: 0.4 },
      { slot: 0, x: 0.5, y: 0.4, w: 0.5, h: 0.4 },
    ],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: 'solo',
    name: 'Solo',
    hint: 'One full-bleed photo, caption over it',
    panels: [{ slot: 0, x: 0, y: 0, w: 1, h: 1 }],
    caption: { x: 0, y: 0.7, w: 1, h: 0.3, overlay: true },
  },
  {
    id: 'strip',
    name: 'Strip',
    hint: 'Three horizontal bands',
    panels: [
      { slot: 0, x: 0, y: 0, w: 1, h: 0.26 },
      { slot: 1, x: 0, y: 0.26, w: 1, h: 0.26 },
      { slot: 2, x: 0, y: 0.52, w: 1, h: 0.26 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
];

export const TONES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#ff2975,#ff7a18)',
    filter: 'saturate(1.3) contrast(1.08)',
    washTop: 'rgba(255,41,117,0.10)',
    washBottom: 'rgba(255,122,24,0.55)',
    washComposite: 'overlay',
    bandFrom: '#2a0a4a',
    bandTo: '#7a1042',
    accent: '#ffd319',
    sub: '#ff9ecf',
    sun: ['#ffe259', '#ff7a18', '#ff2975'],
    vignette: 0.32,
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    swatch: 'linear-gradient(135deg,#22d3ee,#ff2975)',
    filter: 'saturate(1.45) contrast(1.12) brightness(0.96)',
    washTop: 'rgba(34,211,238,0.45)',
    washBottom: 'rgba(255,41,117,0.5)',
    washComposite: 'overlay',
    bandFrom: '#0a1030',
    bandTo: '#3d0f56',
    accent: '#22d3ee',
    sub: '#ff7ad9',
    sun: ['#a5f3fc', '#22d3ee', '#ff2975'],
    vignette: 0.38,
  },
  {
    id: 'pink',
    name: 'Hot Pink',
    swatch: 'linear-gradient(135deg,#ff7ad9,#b537f2)',
    filter: 'saturate(1.55) contrast(1.06)',
    washTop: 'rgba(255,122,217,0.25)',
    washBottom: 'rgba(181,55,242,0.5)',
    washComposite: 'soft-light',
    bandFrom: '#3d0a3d',
    bandTo: '#8a1d8f',
    accent: '#ffd319',
    sub: '#ffb3ec',
    sun: ['#ffd319', '#ff7ad9', '#b537f2'],
    vignette: 0.3,
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#fbbf24,#f97316)',
    filter: 'sepia(0.28) saturate(1.35) contrast(1.06)',
    washTop: 'rgba(251,191,36,0.18)',
    washBottom: 'rgba(249,115,22,0.5)',
    washComposite: 'soft-light',
    bandFrom: '#2b1602',
    bandTo: '#7c2d12',
    accent: '#fde68a',
    sub: '#fdba74',
    sun: ['#fef08a', '#fbbf24', '#f97316'],
    vignette: 0.3,
  },
  {
    id: 'teal',
    name: 'Teal Noir',
    swatch: 'linear-gradient(135deg,#0d9488,#0f172a)',
    filter: 'saturate(0.7) contrast(1.18) brightness(0.92)',
    washTop: 'rgba(13,148,136,0.4)',
    washBottom: 'rgba(15,23,42,0.55)',
    washComposite: 'overlay',
    bandFrom: '#04202b',
    bandTo: '#0b3b4a',
    accent: '#5eead4',
    sub: '#99f6e4',
    sun: ['#ccfbf1', '#2dd4bf', '#0e7490'],
    vignette: 0.42,
  },
  {
    id: 'mono',
    name: 'Noir Mono',
    swatch: 'linear-gradient(135deg,#e5e5e5,#404040)',
    filter: 'grayscale(1) contrast(1.28) brightness(1.04)',
    washTop: 'rgba(255,255,255,0.08)',
    washBottom: 'rgba(0,0,0,0.35)',
    washComposite: 'soft-light',
    bandFrom: '#111111',
    bandTo: '#333333',
    accent: '#fafafa',
    sub: '#d4d4d4',
    sun: ['#ffffff', '#d4d4d4', '#737373'],
    vignette: 0.45,
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function toneById(id) {
  return TONES.find((t) => t.id === id) ?? TONES[0];
}

/** The pixel rects of a layout's panels on a cover of w x h — the same rects drawCover uses. */
export function panelRects(w, h, layoutId) {
  const layout = layoutById(layoutId);
  const gutter = Math.max(3, Math.round(Math.min(w, h) * 0.006));
  return layout.panels.map((panel) => {
    if (layout.panels.length === 1) return { x: 0, y: 0, w, h };
    return {
      x: panel.x * w + gutter / 2,
      y: panel.y * h + gutter / 2,
      w: panel.w * w - gutter,
      h: panel.h * h - gutter,
    };
  });
}

/** Cover-fits an image into a rect, with a zoom factor and a pan offset (fractions of the rect). */
export function coverFitRect(img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  return {
    x: rect.x + (rect.w - dw) / 2 + ox * rect.w,
    y: rect.y + (rect.h - dh) / 2 + oy * rect.h,
    w: dw,
    h: dh,
  };
}

/** Shrinks a font until the text fits maxWidth; returns the size in px. */
export function fitFont(ctx, text, family, weight, maxWidth, startPx, minPx = 10) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > minPx && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

/** A synthwave sun: a gradient disc cut by horizontal slats that widen toward the bottom. */
export function drawSynthSun(ctx, cx, cy, r, colors, bg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.55, colors[1]);
  g.addColorStop(1, colors[2]);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = bg;
  let y = cy + r * 0.08;
  let thick = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick + r * 0.11;
    thick *= 1.45;
  }
  ctx.restore();
}

/** A small palm silhouette: a curved trunk with five drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.lineWidth = s * 0.13;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.18, y - s * 0.88);
  ctx.stroke();
  const topX = x + s * 0.18;
  const topY = y - s * 0.88;
  // Fronds fan out from the crown and droop at the tips, like a real palm.
  const fronds = [
    [-0.7, -0.3, -0.8, 0.05],
    [-0.5, -0.55, -0.55, -0.1],
    [-0.1, -0.62, -0.05, -0.18],
    [0.3, -0.55, 0.45, -0.15],
    [0.6, -0.3, 0.95, 0.1],
  ];
  ctx.lineWidth = s * 0.085;
  for (const [dx1, dy1, dx2, dy2] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + dx1 * s * 0.6, topY + dy1 * s * 0.6, topX + dx2 * s * 0.6, topY + dy2 * s * 0.6);
    ctx.stroke();
  }
  // A couple of coconuts.
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.05, s * 0.05, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.05, topY + s * 0.06, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** An empty panel: a dusk gradient, a small sun, and an invitation to add a photo. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, '#241239');
  g.addColorStop(1, '#12081f');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const r = Math.min(rect.w, rect.h) * 0.2;
  drawSynthSun(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.42, r, ['#ffe259', '#ff7a18', '#ff2975'], '#1a0d2e');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${Math.max(12, Math.min(rect.w, rect.h) * 0.07)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.82);
}

function drawCaptionBand(ctx, w, h, band, tone, title, subtitle) {
  const bx = band.x * w;
  const by = band.y * h;
  const bw = band.w * w;
  const bh = band.h * h;
  const g = ctx.createLinearGradient(bx, by, bx, by + bh);
  g.addColorStop(0, tone.bandFrom);
  g.addColorStop(1, tone.bandTo);
  ctx.fillStyle = g;
  ctx.globalAlpha = band.overlay ? 0.88 : 1;
  ctx.fillRect(bx, by, bw, bh);
  ctx.globalAlpha = 1;
  // Accent rule above the band.
  ctx.fillStyle = tone.accent;
  ctx.fillRect(bx, by, bw, Math.max(2, h * 0.004));

  // Sun and palm on the right, kept clear of the title.
  const sunR = bh * 0.52;
  const sunCx = bx + bw - bh * 0.62;
  const sunCy = by + bh * 0.52;
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawSynthSun(ctx, sunCx, sunCy, sunR, tone.sun, tone.bandTo);
  ctx.restore();
  // The palm stays inside the band, left of the title.
  drawPalm(ctx, bx + bw * 0.03, by + bh * 1.02, bh * 0.6, 'rgba(8,3,16,0.9)');

  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  const textX = bx + bw * 0.05 + bh * 0.7;
  const textW = sunCx - sunR - textX - bw * 0.02;
  if (text) {
    const size = fitFont(ctx, text, 'Anton, "Arial Narrow", sans-serif', 400, textW, bh * 0.46);
    ctx.save();
    ctx.translate(textX, by + bh * 0.56);
    ctx.rotate(-0.02);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    try {
      ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`;
    } catch {
      // Older canvas: letterSpacing is ignored.
    }
    ctx.font = `400 ${size}px Anton, "Arial Narrow", sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160418';
    ctx.lineWidth = Math.max(2, size * 0.14);
    ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'rgba(255,41,117,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  if (sub) {
    const subSize = fitFont(ctx, sub, 'Pacifico, cursive', 400, textW * 0.9, bh * 0.26);
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `400 ${subSize}px Pacifico, cursive`;
    ctx.fillStyle = tone.sub;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = subSize * 0.15;
    ctx.fillText(sub, textX, by + bh * 0.9);
    ctx.restore();
  }
  // Tiny tagline, top of the band, clear of the sun.
  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  const tagSize = Math.max(9, bh * 0.11);
  ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
  try {
    ctx.letterSpacing = `${tagSize * 0.3}px`;
  } catch {
    // Ignored where unsupported.
  }
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('EST. 2026', sunCx - sunR - bw * 0.015, by + bh * 0.16);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * state: { layout, tone, title, subtitle, photos: [img|null, img|null, img|null],
 *          adjust: { "<layout>:<panelIndex>": { zoom, ox, oy } } }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = layoutById(state.layout);
  const tone = toneById(state.tone);
  const gutter = Math.max(3, Math.round(Math.min(w, h) * 0.006));

  // White gutters show between the panels.
  ctx.filter = 'none';
  ctx.fillStyle = '#f5f0f8';
  ctx.fillRect(0, 0, w, h);

  layout.panels.forEach((panel, i) => {
    const rect = {
      x: panel.x * w + gutter / 2,
      y: panel.y * h + gutter / 2,
      w: panel.w * w - gutter,
      h: panel.h * h - gutter,
    };
    // The solo layout has a single full-bleed panel: no inset.
    if (layout.panels.length === 1) {
      rect.x = 0;
      rect.y = 0;
      rect.w = w;
      rect.h = h;
    }
    const photo = state.photos[panel.slot] ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo) {
      const adj = state.adjust?.[`${layout.id}:${i}`] ?? { zoom: 1, ox: 0, oy: 0 };
      const fit = coverFitRect(photo, rect, adj.zoom, adj.ox, adj.oy);
      ctx.filter = tone.filter;
      ctx.drawImage(photo, fit.x, fit.y, fit.w, fit.h);
      ctx.filter = 'none';
    } else {
      drawEmptyPanel(ctx, rect);
    }
    ctx.restore();
  });

  // The colour grade washes over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, tone.washTop);
  wash.addColorStop(1, tone.washBottom);
  ctx.save();
  ctx.globalCompositeOperation = tone.washComposite;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Vignette, before the caption so the lettering stays bright.
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(5,2,12,${tone.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  drawCaptionBand(ctx, w, h, layout.caption, tone, state.title, state.subtitle);
}
