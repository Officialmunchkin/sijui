export default async function run(page, ui) {
  const captured = [];
  await page.addInitScript(() => {
    window.__errs = [];
    const orig = window.reportError;
    window.reportError = function (e) {
      try { window.__errs.push('REPORTERROR: ' + (e && (e.stack || e.message))); } catch { }
      if (typeof orig === 'function') return orig.call(window, e);
    };
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJECT: ' + (e.reason && (e.reason.stack || e.reason.message))));
    window.addEventListener('error', e => window.__errs.push('WINERR: ' + e.message + ' :: ' + (e.error && e.error.stack || '')));
    const ce = console.error;
    console.error = (...a) => { window.__errs.push('CE: ' + a.map(x => String(x && (x.stack || x)).slice(0, 600)).join(' ~ ')); ce(...a); };
  });
  page.on('pageerror', e => captured.push('pageerror: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(700);
  if (await page.locator('input[type="password"]').count()) {
    await page.locator('input[type="password"]').first().fill('herman1999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
  await page.locator('button:has-text("ADMIN")').first().click();
  await page.waitForTimeout(4000);
  const errs = await page.evaluate(() => window.__errs);
  const st = await page.evaluate(() => ({ rootLen: document.getElementById('root').innerHTML.length, body: document.body.innerText.slice(0, 120) }));
  return { errs, captured, st };
}
