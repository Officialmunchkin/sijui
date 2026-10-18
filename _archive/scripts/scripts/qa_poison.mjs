export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('dialog', async d => { if (d.type() === 'prompt') await d.accept('1999'); else await d.accept(); });
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html');
  await page.waitForTimeout(1200);
  // Simulate the user's poisoned localStorage: members WITHOUT handle field
  await page.evaluate(() => {
    const m = JSON.parse(localStorage.getItem('famvault_members') || '[]');
    const stripped = m.map(x => { const c = { ...x }; delete c.handle; return c; });
    localStorage.setItem('famvault_members', JSON.stringify(stripped));
  });
  await page.reload();
  await page.waitForTimeout(1500);
  const r = {};
  r.start = await page.evaluate(() => document.body.innerText.slice(0, 120));
  await page.getByText('HERMAN ADMIN', { exact: false }).first().click();
  await page.waitForTimeout(800);
  const pwd = page.locator('input[type="password"]').first();
  r.hasPwdModal = (await pwd.count()) > 0;
  if (r.hasPwdModal) { await pwd.fill('test123'); await page.keyboard.press('Enter'); await page.waitForTimeout(1000); }
  r.afterLogin = await page.evaluate(() => document.body.innerText.slice(0, 200));
  r.errs = errs;
  return r;
}
