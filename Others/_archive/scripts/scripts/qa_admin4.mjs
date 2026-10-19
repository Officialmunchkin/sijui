export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  const r = {};
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(1500);
  // what tabs exist and which is active
  r.tabs = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => ({ t: b.innerText.trim().slice(0, 30), cls: b.className.includes('fuchsia') || b.className.includes('#FF6B8A') || b.className.includes('white') ? 'ACTIVE?' : '' })).filter(x => x.t && x.t.length < 30));
  // find the content container right after the tab bar
  r.containerHTML = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'ADMIN');
    let el = btn;
    // climb to the tab bar
    while (el && el.parentElement && el.parentElement.children.length < 3) el = el.parentElement;
    const bar = el.parentElement;
    let sib = bar.nextElementSibling;
    const out = [];
    let i = 0;
    while (sib && i < 3) {
      out.push({ tag: sib.tagName, cls: (sib.className || '').slice(0, 100), html: sib.outerHTML.slice(0, 400), children: sib.children.length });
      sib = sib.nextElementSibling; i++;
    }
    return out;
  });
  r.errs = errs;
  return r;
}
