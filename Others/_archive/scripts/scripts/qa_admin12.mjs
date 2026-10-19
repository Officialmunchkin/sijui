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
  // go straight to ADMIN and observe live bodyLen over time — is it always 0 or does it flash?
  await page.locator('button:text-is("ADMIN")').first().click();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    errs.push('t' + (i*400) + ' bodyLen=' + await page.evaluate(() => document.body.innerText.length) + ' rootKids=' + await page.evaluate(() => document.getElementById('root').firstChild ? document.getElementById('root').firstChild.childNodes.length : -1));
  }
  r.errs = errs;
  return r;
}
