export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 300)); });
  await page.waitForTimeout(2000);
  const r = {};
  r.buttons = await page.evaluate(() => [...document.querySelectorAll('button,div')].map(b => b.innerText.trim()).filter(t => t && t.length < 40).slice(0, 30));
  const herman = page.locator('text=HERMAN ADMIN').first();
  if (await herman.count()) {
    await herman.click();
    await page.waitForTimeout(600);
    const pwd = page.locator('input[type="password"]').first();
    r.pwdInput = await pwd.count();
    if (await pwd.count()) {
      await pwd.fill('h1999');
      await pwd.press('Enter');
      await page.waitForTimeout(2000);
    } else {
      r.inputTypes = await page.evaluate(() => [...document.querySelectorAll('input')].map(i => i.type + ':' + i.disabled + ':' + i.value));
    }
  }
  r.afterLogin = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n/g, ' | '));
  r.rootKids = await page.evaluate(() => (document.getElementById('root') || document.body).children.length);
  const adminBtn = page.getByRole('button', { name: 'ADMIN' }).first();
  r.adminBtnCount = await adminBtn.count();
  if (r.adminBtnCount) {
    await adminBtn.click();
    await page.waitForTimeout(1500);
    r.afterAdmin = await page.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n/g, ' | '));
    r.rootKidsAfter = await page.evaluate(() => (document.getElementById('root') || document.body).children.length);
  }
  r.evts = evts;
  return r;
}
