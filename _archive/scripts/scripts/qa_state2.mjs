export default async function run(page, ui) {
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  const hasPwd = await page.locator('input[type="password"]').count();
  const step = {};
  if (hasPwd) {
    await page.locator('input[type="password"]').first().fill('herman1999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }
  step.afterLogin = await page.evaluate(() => ({ body: document.body.innerText.slice(0, 220), rootLen: document.getElementById('root').innerHTML.length, url: location.href }));
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3500);
  step.afterAdmin = await page.evaluate(() => ({ body: document.body.innerText.slice(0, 220), rootLen: document.getElementById('root').innerHTML.length, url: location.href, navType: performance.getEntriesByType('navigation')[0].type }));
  return { hasPwd, step };
}
