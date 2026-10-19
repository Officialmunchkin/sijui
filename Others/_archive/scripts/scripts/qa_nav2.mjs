export default async function run(page, ui) {
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const n0 = await page.evaluate(() => performance.getEntriesByType('navigation').length + ':' + performance.getEntriesByType('navigation')[0].type);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({
    url: location.href,
    navCount: performance.getEntriesByType('navigation').length,
    navType: performance.getEntriesByType('navigation')[0].type,
    rootLen: document.getElementById('root').innerHTML.length
  }));
  r.navBefore = n0;
  return r;
}
