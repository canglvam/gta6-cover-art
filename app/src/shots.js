// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, full frame. Query params pick the
// layout, grade, size, title, subtitle, badge and the samples to load.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photos') ?? 'boulevard,pier').split(',').filter(Boolean);
  const settings = {
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    size: query.get('size') ?? undefined,
    title: query.get('title') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    badge: query.get('badge') ?? undefined,
  };
  await load(photos, settings);
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
