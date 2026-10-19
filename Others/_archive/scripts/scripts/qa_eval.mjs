export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => errs.push('CONSOLE-' + m.type() + ': ' + m.text().slice(0, 500)));
  page.on('dialog', d => errs.push('DIALOG: ' + d.type() + ' ' + d.message()).then(() => d.accept()).catch(() => {}));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  // Click ADMIN via evaluate with error capture
  const r = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADMIN');
    if (!btn) return { err: 'no admin button' };
    try { btn.click(); return { clicked: true }; } catch (e) { return { err: e.message, stack: e.stack.slice(0, 800) }; }
  });
  await page.waitForTimeout(2500);
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { r, rootLen, errs };
}
