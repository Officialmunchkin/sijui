export default async function run(page, ui) {
  const log = [];
  page.on('console', m => log.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 400)));
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message + ' :: ' + String(e.stack).slice(0, 1500)));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.evaluate(() => {
    window.__errs = [];
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJECTION: ' + (e.reason && (e.reason.stack || e.reason.message))));
    window.addEventListener('error', e => window.__errs.push('WINDOW ERROR: ' + e.message + ' @ ' + e.filename + ':' + e.lineno));
    const origError = console.error;
    console.error = (...a) => { window.__errs.push('CE: ' + a.map(x => String(x && x.stack || x).slice(0, 800)).join(' ')); origError(...a); };
  });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const errsBefore = await page.evaluate(() => window.__errs);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const errsAfter = await page.evaluate(() => window.__errs);
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { errsBefore, errsAfter, rootLen, log: log.slice(-10) };
}
