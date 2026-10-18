export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').slice(0, 1200)));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push('CONSOLE-' + m.type().toUpperCase() + ': ' + m.text().slice(0, 800)); });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  // list all buttons whose text contains ADMIN, so we click the right one
  const adminBtns = await page.evaluate(() => [...document.querySelectorAll('button')].map((b, i) => ({ i, t: b.textContent.trim().slice(0, 40) })).filter(x => x.t.includes('ADMIN')));
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { adminBtns, rootLen, errs };
}
