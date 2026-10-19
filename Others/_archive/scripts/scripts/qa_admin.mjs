export default async function run(page, ui) {
  const evts = [];
  for (const f of page.frames()) {
    f.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 8).join('\n')));
    f.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 400)); });
  }
  await page.waitForTimeout(3000);
  let F = page;
  const herman = F.locator('text=HERMAN ADMIN').first();
  if (await herman.count()) { await herman.click(); await page.waitForTimeout(800); }
  const pwd = F.locator('input[type="password"]').first();
  if (await pwd.count()) { await pwd.fill('h1999'); await pwd.press('Enter'); await page.waitForTimeout(2500); }
  const r = {};
  r.bodyAfterLogin = await F.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n/g, ' | '));
  const adminBtn = F.locator('button', { hasText: /^ADMIN$/ }).first();
  if (await adminBtn.count()) {
    await adminBtn.click();
    await page.waitForTimeout(3000);
    r.bodyAfterAdmin = await F.evaluate(() => document.body.innerText.slice(0, 500).replace(/\n/g, ' | '));
    r.rootChildren = await F.evaluate(() => [...(document.querySelector('#root')||document.body).children].map(c => c.tagName + ':' + (c.className||'').toString().slice(0,80) + ' h=' + c.offsetHeight));
    r.screenshot = await page.screenshot({ path: 'admin_black.png' });
  } else { r.noAdminButton = true; r.buttons = await F.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).slice(0, 40)); }
  r.evts = evts;
  return r;
}

