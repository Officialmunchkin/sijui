export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  const r = {};
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  r.before = await page.evaluate(() => document.body.innerText.slice(0, 200));
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(2500);
  r.state = await page.evaluate(() => ({
    bodyLen: document.body.innerText.length,
    body: document.body.innerText.slice(0, 600),
    rootHTML: (document.getElementById('root')?.outerHTML || document.querySelector('#root')?.outerHTML || 'noroot').slice(0, 600),
    htmlLen: document.documentElement.outerHTML.length
  }));
  r.errs = errs;
  return r;
}
