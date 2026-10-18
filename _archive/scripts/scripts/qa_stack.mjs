export default async function run(page, ui) {
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  // try each of the ADMIN-block dependencies by evaluating them manually
  const probe = await page.evaluate(() => {
    const out = {};
    try {
      // inspect the React state of the app component through the fiber
      const root = document.getElementById('root');
      const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber'));
      out.hasFiber = !!fiberKey;
      // walk fiber to find memoizedState chain values
      let f = root[fiberKey];
      out.fiberTag = f && f.tag;
    } catch (e) { out.err = e.message; }
    return out;
  });
  // trigger the crash and catch the stack from React's console.error via page.evaluate overriding console
  await page.evaluate(() => {
    window.__stacks = [];
    const origErr = console.error;
    console.error = function (...a) {
      try { window.__stacks.push(a.map(x => (typeof x === 'string' ? x : (x && x.stack) || String(x))).join(' | ').slice(0, 3000)); } catch {}
      origErr.apply(console, a);
    };
    const origWarn = console.warn;
    console.warn = function (...a) {
      try { window.__stacks.push('WARN: ' + a.map(String).join(' | ').slice(0, 2000)); } catch {}
      origWarn.apply(console, a);
    };
  });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADMIN');
    btn && btn.click();
  });
  await page.waitForTimeout(2500);
  const stacks = await page.evaluate(() => window.__stacks);
  return { probe, stacks, errs };
}
