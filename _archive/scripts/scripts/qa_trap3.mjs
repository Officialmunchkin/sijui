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

  await page.evaluate(() => {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push('ERR: ' + e.message + '\n' + (e.error && e.error.stack || '').split('\n').slice(0, 20).join('\n')));
    window.addEventListener('unhandledrejection', e => window.__errs.push('REJ: ' + (e.reason && (e.reason.stack || e.reason.message) || String(e.reason))));
    const ce = console.error;
    console.error = (...a) => { window.__errs.push('CE: ' + a.map(x => (x && (x.stack || x.message)) || String(x)).join(' | ').slice(0, 900)); ce(...a); };
  });

  // click ADMIN via synthetic mouse event
  const r = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADMIN');
    if (!btn) return 'no admin';
    const rect = btn.getBoundingClientRect();
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t =>
      btn.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, clientX: rect.x + rect.width/2, clientY: rect.y + rect.height/2 })));
    return 'dispatched';
  });
  log.push('adminClick: ' + r);
  await page.waitForTimeout(3000);
  log.push('body after: "' + (await page.evaluate(() => document.body.innerText.slice(0, 400))) + '"');
  log.push('root len: ' + (await page.evaluate(() => document.getElementById('root').innerHTML.length)));
  const trapped = await page.evaluate(() => window.__errs || ['none']);
  log.push('trapped: ' + JSON.stringify(trapped, null, 1));
  log.push('evts: ' + JSON.stringify(evts));
  return { log };
}
