export default async function run(page, ui) {
  const wipe = [];
  await page.exposeFunction('__pushWipe', e => wipe.push(e));
  await page.addInitScript(() => {
    window.__pushWipe({ phase: 'init', ua: navigator.userAgent.slice(0, 80) });
    window.addEventListener('DOMContentLoaded', () => {
      const root = document.getElementById('root');
      window.__pushWipe({ phase: 'domready', hasRoot: !!root });
      if (!root) return;
      const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      Object.defineProperty(root, 'innerHTML', {
        set(v) { window.__pushWipe({ via: 'innerHTML', val: String(v).slice(0, 150), stack: (new Error().stack || '').slice(0, 1600) }); return d.set.call(root, v); },
        get() { return d.get.call(root); }, configurable: true
      });
      const oc2 = Node.prototype.removeChild;
      Node.prototype.removeChild = function (c) {
        if (this.id === 'root') window.__pushWipe({ via: 'nodeRemoveChild', tag: c && c.tagName, stack: (new Error().stack || '').slice(0, 1600) });
        return oc2.call(this, c);
      };
    });
  });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const mid = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const end = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { mid, end, wipe: wipe.slice(-6) };
}
