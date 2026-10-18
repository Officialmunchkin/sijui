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
  r.dump = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('div').forEach(d => {
      if (d.offsetParent === null) return;
      const cls = (d.className || '').toString();
      if (cls.includes('max-w-') && d.children.length === 0) {
        out.push({ cls: cls.slice(0, 120), text: d.innerText.slice(0, 80), rect: d.getBoundingClientRect().height });
      }
    });
    return out.slice(0, 10);
  });
  r.errs = errs;
  return r;
}
