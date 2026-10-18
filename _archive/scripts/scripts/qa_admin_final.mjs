export default async function run(page, ui) {
  const log = [];
  page.on('console', m => log.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 500)));
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message + '\n' + String(e.stack).slice(0, 2000)));
  page.on('requestfailed', r => log.push('REQFAIL: ' + r.url().slice(0, 150) + ' ' + (r.failure() || {}).errorText));

  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const r = {};
  r.rootHTMLlen = await page.evaluate(() => (document.getElementById('root') || {}).innerHTML?.length ?? -1);
  r.bodyKids = await page.evaluate(() => [...document.body.children].map(c => c.tagName + '#' + (c.id || '') + ' len=' + (c.innerHTML || '').length).join(' | '));

  // login as herman
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  const pwd = page.locator('input[type="password"]').first();
  r.hasPwd = await pwd.count();
  if (r.hasPwd) {
    await pwd.fill('herman1999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }
  r.afterLoginText = (await page.evaluate(() => document.body.innerText)).slice(0, 400);

  // click ADMIN tab
  const admin = page.locator('button', { hasText: 'ADMIN' }).first();
  r.adminCount = await admin.count();
  if (r.adminCount) {
    await admin.click();
    await page.waitForTimeout(2500);
  }
  r.afterAdminText = (await page.evaluate(() => document.body.innerText)).slice(0, 600);
  r.bodyHTMLlen = await page.evaluate(() => document.body.innerHTML.length);
  r.screenshot = 'admin_shot.png';
  await page.screenshot({ path: 'admin_shot.png', fullPage: true });
  r.log = log.slice(-25);
  return r;
}
