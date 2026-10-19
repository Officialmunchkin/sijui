export default async function run(page, ui) {
  await page.addInitScript(() => {
    window.__events = [];
    window.rec = (type, info) => { try { window.__events.push({ type, info: String(info).slice(0, 600) }); } catch {} };
    window.addEventListener('error', e => window.rec('WINERR', e.message));
    window.addEventListener('unhandledrejection', e => window.rec('REJECT', e.reason && (e.reason.stack || e.reason.message)));
    const orig = console.error.bind(console);
    console.error = (...a) => { window.rec('CE', a.map(x => String(x && (x.stack || x)).slice(0, 300)).join(' ~ ')); orig(...a); };
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const st0 = await page.evaluate(() => { window.__snap = (window.__events || []).slice(); return 'init' });
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  const hasPwd = await page.locator('input[type="password"]').count();
  if (hasPwd) {
    await page.locator('input[type="password"]').first().fill('herman1999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }
  const st1 = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 250),
    rootLen: document.getElementById('root').innerHTML.length,
    evs: (window.__events || []).length
  }));
  const adminBtn = page.locator('button', { hasText: 'ADMIN' }).first();
  await adminBtn.click({ timeout: 5000 });
  await page.waitForTimeout(3500);
  const st2 = await page.evaluate(() => ({
    body: document.body.innerText.slice(0, 250),
    rootLen: document.getElementById('root').innerHTML.length,
    evs: (window.__events || []).slice(-10)
  }));
  return { st1, st2, hasPwd };
}
