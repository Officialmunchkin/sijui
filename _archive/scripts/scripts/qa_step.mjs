export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 15).join('\n')));
  page.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 400)); });
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(() => {}); });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const log = [];
  const step = async (name, fn) => {
    try { await fn(); } catch (e) { log.push(name + ' ERR: ' + e.message); return false; }
    log.push(name + ' OK');
    return true;
  };

  // 1. click herman card
  await step('click herman', () => page.getByRole('button', { name: /HERMAN ADMIN/ }).click());
  await page.waitForTimeout(800);
  let snap = await ui.snapshot();
  log.push('SNAP after herman click:\n' + snap);

  // 2. password
  const pwd = page.locator('input:not([disabled])').first();
  const n = await page.locator('input:not([disabled])').count();
  log.push('input count: ' + n);
  if (n) {
    await step('fill pwd', () => pwd.fill('h1999'));
    await step('enter', () => page.keyboard.press('Enter'));
    await page.waitForTimeout(2000);
    log.push('after login body: ' + (await page.evaluate(() => document.body.innerText.slice(0, 300))));
  }

  // 3. find ADMIN tab
  const adminBtn = page.getByRole('button', { name: 'ADMIN', exact: true });
  log.push('admin buttons: ' + (await adminBtn.count()));
  if (await adminBtn.count()) {
    await step('click ADMIN tab', () => adminBtn.first().click());
    await page.waitForTimeout(3000);
    log.push('after ADMIN click body: ' + (await page.evaluate(() => document.body.innerText.slice(0, 500))));
    log.push('root html len: ' + (await page.evaluate(() => (document.getElementById('root')?.innerHTML || '').length)));
    log.push('errors: ' + JSON.stringify(evts));
  }
  return { log };
}
