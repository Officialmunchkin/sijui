export default async function run(page, ui) {
  await page.addInitScript(() => {
    window.__wipe = [];
    window.addEventListener('DOMContentLoaded', () => {
      const root = document.getElementById('root');
      if (!root) return;
      const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      Object.defineProperty(root, 'innerHTML', {
        set(v) { window.__wipe.push({ via: 'innerHTML', val: String(v).slice(0, 150), stack: (new Error().stack || '').slice(0, 1400) }); return d.set.call(root, v); },
        get() { return d.get.call(root); }, configurable: true
      });
      const oc = Element.prototype.removeChild;
      root.removeChild = function (c) { window.__wipe.push({ via: 'removeChild', stack: (new Error().stack || '').slice(0, 1400) }); return oc.call(root, c); };
      // React 18 createRoot uses clearContainer / parentNode.removeChild on child
      const oc2 = Node.prototype.removeChild;
      Node.prototype.removeChild = function (c) {
        if (this === document.getElementById('root')) window.__wipe.push({ via: 'nodeRemoveChild', tag: c && c.tagName, stack: (new Error().stack || '').slice(0, 1400) });
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
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  return await page.evaluate(() => ({ rootLen: document.getElementById('root').innerHTML.length, wipe: window.__wipe }));
}
