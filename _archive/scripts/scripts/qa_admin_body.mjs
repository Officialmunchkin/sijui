export default async function run(page, ui) {
  const log = [];
  page.on('console', m => log.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 500)));
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message + ' :: ' + String(e.stack).slice(0, 2500)));

  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(2500);

  const r = await page.evaluate(() => {
    const out = {};
    out.bodyKids = [...document.body.children].map(c => c.tagName + '#' + (c.id || '') + ' cls=' + String(c.className).slice(0, 80) + ' len=' + (c.innerHTML || '').length);
    const root = document.getElementById('root');
    out.rootLen = root.innerHTML.length;
    out.rootHTML = root.innerHTML.slice(0, 500);
    // React internal: check for a detached root marker
    out.hasRootContainer = !!document.querySelector('[data-reactroot]');
    out.bodyEnd = document.body.innerHTML.slice(-800);
    return out;
  });
  r.log = log.slice(-15);
  return r;
}
