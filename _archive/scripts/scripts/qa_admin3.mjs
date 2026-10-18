export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 8).join('\n')));
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(()=>{}); });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  if (await page.locator('input[type="password"]').count()) {
    await page.locator('input[type="password"]').first().fill('herman1999');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
  await page.locator('button:has-text("ADMIN")').first().click();
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 400),
    rootLen: document.getElementById('root').innerHTML.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    rootBg: getComputedStyle(document.getElementById('root').firstElementChild || document.documentElement).backgroundColor
  }));
  await page.screenshot({ path: 'admin_tab2.png' });
  return { s, evts };
}
