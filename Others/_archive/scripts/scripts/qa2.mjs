export default async function run(page) {
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.reload();
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => {
    return {
      auth: !!window.__arcadeAuth,
      showGame: typeof window.showGame,
      submitFeedback: typeof window.submitFeedback,
      cfgTime: typeof window.cfgTime,
      overlay: document.getElementById('loginOverlay').style.display,
      scriptCount: document.scripts.length,
      scripts: Array.from(document.scripts).map(s => (s.type || 'classic') + (s.src ? ':' + s.src : ':inline(' + (s.textContent || '').length + ')'))
    };
  });
  return { r, logs };
}
