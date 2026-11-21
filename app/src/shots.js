// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos;
// ?shot=cover shows the cover alone, full frame. Query params pick the layout,
// tone, title, subtitle and sample photos. window.__shotReady is set once the
// fonts are loaded and the cover is painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout') ?? 'hero';
  const tone = query.get('tone') ?? 'sunset';
  const title = query.get('title') ?? 'Vice Nights';
  const subtitle = query.get('subtitle') ?? 'Neon Coast';
  const photoA = query.get('photo') ?? 'boulevard';
  const photoB = query.get('photo2') ?? 'pier';
  await api.setupShot({ layout, tone, title, subtitle, photoA, photoB });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
