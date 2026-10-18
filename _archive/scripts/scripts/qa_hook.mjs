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
  // Monkey-patch React's error boundary? no — instead patch React internals via window hooks:
  // patch Object.keys? too broad. Instead patch Array.prototype.entries? Not used.
  // Simplest: override Error constructor stack trace won't help.
  // Instead: use a MutationObserver + requestAnimationFrame and see if root empties, plus check React's internal dispatch
  await page.evaluate(() => {
    const proto = Object.getPrototypeOf((() => { try { return new Proxy({}, {}); } catch { return {}; } })());
    // Patch Array.prototype[Symbol.iterator] to log calls that throw — too invasive.
    // Instead: patch the specific loop by overriding Array.prototype[Symbol.iterator] temporarily:
    window.__origIter = Array.prototype[Symbol.iterator];
    Array.prototype[Symbol.iterator] = function* () {
      if (this && this.O === undefined) { /* noop */ }
      yield* window.__origIter.call(this);
    };
  });
  // Instead simpler: capture the exact moment root goes to 0 via observer
  const info = await page.evaluate(() => new Promise(res => {
    const root = document.getElementById('root');
    const mo = new MutationObserver(() => {
      if (root.innerHTML.length === 0) { mo.disconnect(); res({ emptied: true, at: Date.now() }); }
    });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => { mo.disconnect(); res({ emptied: false, len: root.innerHTML.length }); }, 3000);
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADMIN');
    btn && btn.click();
  }));
  return { info, errs };
}
