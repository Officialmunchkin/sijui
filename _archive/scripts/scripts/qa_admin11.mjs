export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => errs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 400)));
  const r = {};
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  // try other tabs first to make sure they work
  for (const tab of ['ALBUMS','MEMBERS','BOARD','UPLOAD']) {
    await page.locator(`button:text-is("${tab}")`).first().click();
    await page.waitForTimeout(300);
    errs.push(tab + ' bodyLen=' + await page.evaluate(() => document.body.innerText.length));
  }
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(1500);
  r.errs = errs;
  return r;
}
