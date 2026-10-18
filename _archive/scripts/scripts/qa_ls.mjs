export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' | ' + (e.stack || '').split('\n').slice(1, 4).join(' ~ ').slice(0, 400)));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const st = await page.evaluate(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); try { ls[k] = (localStorage.getItem(k) || '').slice(0, 400); } catch (e) {} }
    return ls;
  });
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(2500);
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { st, rootLen, errs };
}
