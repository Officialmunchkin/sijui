export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => errs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 300)));
  const r = {};
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  // count divs with class containing 'root-25Nt8' or whatever the app's main container class is
  r.top = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#root > *').forEach(c => {
      out.push({ tag: c.tagName, cls: (c.className || '').toString().slice(0, 200), kids: c.children.length });
    });
    return out;
  });
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(1500);
  r.topAfter = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#root > *').forEach(c => {
      out.push({ tag: c.tagName, cls: (c.className || '').toString().slice(0, 200), kids: c.children.length, text: c.innerText.slice(0, 100) });
    });
    return out;
  });
  r.errs = errs;
  return r;
}
