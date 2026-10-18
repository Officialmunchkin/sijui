export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  const r = {};
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.locator('button:text-is("ADMIN")').first().click();
  await page.waitForTimeout(1500);
  r.bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  r.adminArea = await page.evaluate(() => {
    // find elements whose text contains 'STORAGE' or 'BIRTHDAYS' or 'PERMS'
    const hits = [];
    document.querySelectorAll('div,section,main').forEach(d => {
      const t = d.innerText || '';
      if ((t.includes('STORAGE') || t.includes('BIRTHDAYS')) && t.length < 3000 && d.offsetParent !== null) {
        hits.push({ cls: (d.className || '').toString().slice(0, 120), text: t.slice(0, 200) });
      }
    });
    return hits.slice(0, 5);
  });
  r.errs = errs;
  return r;
}
