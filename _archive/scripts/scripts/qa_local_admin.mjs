export default async function run(page, ui) {
  const log = [];
  page.on('console', m => log.push('CONSOLE: ' + m.text().slice(0, 400)));
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message + '\n' + String(e.stack).slice(0, 3000)));

  const r = { log, phases: [] };
  // local file first
  await page.goto('file:///C:/Users/Admin/OneDrive/Desktop/Wallpaper/Famvault-Readable-Version.html');
  await page.waitForTimeout(2000);
  r.phases.push('local loaded, root len=' + (await page.evaluate(() => document.getElementById('root').innerHTML.length)));
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  r.phases.push('local after login, root len=' + (await page.evaluate(() => document.getElementById('root').innerHTML.length)));
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(2500);
  r.phases.push('local after ADMIN click, root len=' + (await page.evaluate(() => document.getElementById('root').innerHTML.length)) + ', body text=' + (await page.evaluate(() => document.body.innerText.slice(0, 150).replace(/\n/g, ' '))));
  return r;
}
