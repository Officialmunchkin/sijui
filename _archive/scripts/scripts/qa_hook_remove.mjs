export default async function run(page, ui) {
  const log = [];
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.evaluate(() => {
    window.__removes = [];
    const orig = Node.prototype.removeChild;
    Node.prototype.removeChild = function (c) {
      if (this.id === 'root') {
        window.__removes.push(new Error().stack.split('\n').slice(1, 6).join(' | '));
      }
      return orig.call(this, c);
    };
  });
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const removes = await page.evaluate(() => window.__removes.slice(0, 3));
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { rootLen, removes, log: log.slice(-8) };
}
