export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 25).join('\n')));
  page.on('console', m => { if (m.type() !== 'log') evts.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 500)); });
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(() => {}); });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const log = [];
  await page.getByRole('button', { name: /HERMAN ADMIN/ }).click();
  await page.waitForTimeout(500);
  await page.locator('input:not([disabled])').first().fill('h1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);

  // trap errors after login
  await page.evaluate(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('ERR: ' + e.message + ' @ ' + (e.filename || '') + ':' + e.lineno));
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJ: ' + (e.reason && (e.reason.stack || e.reason.message) || String(e.reason))));
    const ce = console.error;
    console.error = (...a) => { window.__errs.push('CE: ' + a.map(x => (x && (x.stack || x.message)) || String(x)).join(' | ').slice(0, 800)); ce(...a); };
  });

  // call onClick of ADMIN directly
  const adminClick = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'ADMIN');
    if (!btns.length) return 'no admin btn';
    const b = btns[0];
    const k = Object.keys(b).find(k => k.startsWith('__reactFiber'));
    let fib = b[k];
    while (fib) {
      if (fib.memoizedProps && fib.memoizedProps.onClick) {
        try { fib.memoizedProps.onClick({ preventDefault(){}, stopPropagation(){} }); return 'onClick called OK'; }
        catch (e) { return 'onClick THREW: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 20).join('\n'); }
      }
      fib = fib.return;
    }
    return 'no onClick prop found';
  });
  log.push('adminClick: ' + adminClick);
  await page.waitForTimeout(2500);
  const trapped = await page.evaluate(() => window.__errs || ['no window.__errs']);
  log.push('trapped: ' + JSON.stringify(trapped, null, 1));
  log.push('body after: "' + (await page.evaluate(() => document.body.innerText.slice(0, 300))) + '"');
  log.push('evts: ' + JSON.stringify(evts));
  return { log };
}
