export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  // Capture errors the moment React tears down — use CDP-level pageerror + patch console
  await page.evaluate(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('ERR: ' + e.message + ' @ ' + (e.filename || '') + ':' + e.lineno + ':' + e.colno));
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJECT: ' + ((e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)).slice(0, 800)));
  });
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const errs = await page.evaluate(() => window.__errs);
  return { errs };
}
