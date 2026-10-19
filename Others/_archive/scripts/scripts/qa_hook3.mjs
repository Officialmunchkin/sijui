export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  // catch errors globally with a script injected at document start via addInitScript alternative: use context route — instead, patch Error and console before load using page.addInitScript equivalent
  await page.context().addInitScript(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('ERR: ' + e.message + ' @ ' + (e.filename || '') + ':' + e.lineno + ':' + e.colno));
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJECT: ' + ((e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)).slice(0, 800)));
    // catch React's re-throw via setTimeout
    const origSetTimeout = window.setTimeout;
    window.setTimeout = function (fn, ...a) {
      if (typeof fn === 'function') {
        return origSetTimeout.call(window, function (...args) {
          try { return fn.apply(this, args); } catch (e) { window.__errs.push('SETTIMEOUT-THROW: ' + e.message + '\n' + (e.stack || '').slice(0, 800)); }
        }, ...a);
      }
      return origSetTimeout.call(window, fn, ...a);
    };
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const errs = await page.evaluate(() => window.__errs);
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { errs, rootLen };
}
