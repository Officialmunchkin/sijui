export default async function run(page, ui) {
  await page.addInitScript(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('ERR: ' + e.message + ' @ ' + (e.filename || '') + ':' + e.lineno + '\n' + (e.error && e.error.stack || '').slice(0, 3000)));
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJECTION: ' + (e.reason && (e.reason.stack || e.reason.message) || String(e.reason)).slice(0, 3000)));
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const before = await page.evaluate(() => window.__errs);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  const afterLogin = await page.evaluate(() => window.__errs);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(2500);
  const errs = await page.evaluate(() => window.__errs);
  const root = await page.evaluate(() => document.getElementById('root').innerHTML.slice(0, 200));
  return { before, afterLogin, errs, root };
}
