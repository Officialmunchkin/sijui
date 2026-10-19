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
  r.pre = await page.evaluate(() => document.getElementById('root').firstChild.childNodes.length);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(2000);
  r.post = await page.evaluate(() => ({
    rootChildCount: document.getElementById('root').childNodes.length,
    rootFirstChildExists: !!document.getElementById('root').firstChild,
    rootFirstChildIsText: document.getElementById('root').firstChild ? document.getElementById('root').firstChild.nodeType : null,
    rootInnerHTML: document.getElementById('root').innerHTML.slice(0, 300),
    bodyChildren: document.body.children.length,
    bodyFirstTag: document.body.firstElementChild ? document.body.firstElementChild.tagName : null
  }));
  r.errs = errs;
  return r;
}
