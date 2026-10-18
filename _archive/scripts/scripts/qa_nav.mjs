export default async function run(page, ui) {
  await page.addInitScript(() => {
    window.__events = [];
    const rec = (type, info) => { try { window.__events.push({ type, info: String(info).slice(0, 600) }); } catch {} };
    window.addEventListener('error', e => rec('WINERR', e.message));
    window.addEventListener('unhandledrejection', e => rec('REJECT', e.reason && (e.reason.stack || e.reason.message)));
    window.__setMark = () => { window.__pageLoaded = true; rec('LOAD', 'load fired'); };
    window.addEventListener('load', window.__setMark);
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({ url: location.href, events: window.__events.slice(-15) })).catch(e => ({ evalError: e.message }));
  return r;
}
