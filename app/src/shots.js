// Vice Cover Studio — screenshot presets.
// ?shot=cover renders just the cover, edge to edge, for the cover shots;
// ?shot=editor shows the editor with a photo loaded. Both accept
// photo=<sample id>, caption=<text>, layout=<id> and tone=<id> so a
// screenshot run can set the scene from the URL alone.

import { LAYOUTS, TONES } from './cover.js';

export function applyShotPreset(state, photos, api) {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return;
  if (q.get('photo') && photos.has(q.get('photo'))) {
    for (const p of state.panels) p.photo = q.get('photo');
  }
  // photos=a,b,c assigns a different photo per panel, in order.
  if (q.get('photos')) {
    const list = q.get('photos').split(',').filter((id) => photos.has(id));
    if (list.length) state.panels.forEach((p, i) => { p.photo = list[i % list.length]; });
  }
  if (q.get('caption')) state.title = q.get('caption');
  if (q.get('subtitle')) state.subtitle = q.get('subtitle');
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('tone') && TONES[q.get('tone')]) state.tone = q.get('tone');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Math.min(1600, Math.max(480, +q.get('w') || 1080));
    const h = Math.min(1600, Math.max(480, +q.get('h') || 1080));
    const canvas = document.getElementById('preview');
    canvas.width = w;
    canvas.height = h;
    canvas.dataset.shotSize = `${w}x${h}`;
  }
}
