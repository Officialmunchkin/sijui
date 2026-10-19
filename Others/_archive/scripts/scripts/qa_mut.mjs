export default async function run(page, ui) {
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.evaluate(() => {
    window.__mut = [];
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList' && m.target.id === 'root') {
          window.__mut.push({
            removed: [...m.removedNodes].map(n => n.nodeType + ':' + (n.nodeName || '')),
            added: [...m.addedNodes].map(n => n.nodeType + ':' + (n.nodeName || '')),
            stack: new Error().stack.split('\n').slice(2, 8).join(' | ')
          });
        }
      }
    }).observe(document.getElementById('root'), { childList: true, subtree: false });
  });
  await page.locator('button:has-text("HERMAN")').first().click();
  await page.waitForTimeout(800);
  await page.locator('input[type="password"]').first().fill('herman1999');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.locator('button', { hasText: 'ADMIN' }).first().click();
  await page.waitForTimeout(3000);
  const muts = await page.evaluate(() => window.__mut.slice(-6));
  const rootLen = await page.evaluate(() => document.getElementById('root').innerHTML.length);
  return { rootLen, muts };
}
