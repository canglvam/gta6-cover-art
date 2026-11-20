// Fixed scenes for screenshots: ?shot=editor shows the app with photos loaded;
// ?shot=cover shows one exported cover alone, at the size the query asks for.
// Query knobs: layout, tone, title, subtitle, size, photoA, photoB, photoC.
// window.__shotReady is set once the cover is painted.
export async function runShot(shot, query, api) {
  const layout = query.get('layout') ?? 'classic';
  const tone = query.get('tone') ?? 'sunset';
  const title = query.get('title') ?? 'VICE CITY';
  const subtitle = query.get('subtitle') ?? 'Neon Nights';
  const size = query.get('size') ?? '1080x1080';
  await api.loadSample(0, query.get('photoA') ?? 'pier');
  await api.loadSample(1, query.get('photoB') ?? 'boulevard');
  await api.loadSample(2, query.get('photoC') ?? 'pier');
  api.setAll({ layout, tone, title, subtitle, size });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  try {
    await Promise.all([
      document.fonts.load('400 80px Anton'),
      document.fonts.load('400 40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallback fonts still draw; the cover just loses its display faces.
  }
  api.draw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
