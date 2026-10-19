export default async function run(page, ui) {
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/famvault.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message()); if (d.type() === 'prompt') await d.accept('1999'); else await d.accept(); });
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  const pwd = page.locator('input[type="password"]').first();
  await pwd.fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => document.body.innerText.slice(0, 400));
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => document.body.innerText.slice(0, 400));
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { dialogs, before, after, rootLen };
}
