export default async function run(page, ui) {
  const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').slice(0, 2000)));
  page.on('console', m => logs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 500)));
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(2000);
  return logs;
}
