export default async function run(page) {
  const logs = [];
  page.on('pageerror', e => logs.push(e.message.slice(0, 200)));
  await page.waitForTimeout(3000);
  await page.addScriptTag({
    content: `
    const el = document.createElement('div'); el.id = 'qa-res';
    el.textContent = JSON.stringify({ loadMyFeedback: typeof window.loadMyFeedback, renderFeedback: typeof renderFeedback });
    document.body.appendChild(el);
  `});
  const out = await page.evaluate(() => document.getElementById('qa-res')?.textContent);
  return { result: JSON.parse(out), pageErrors: logs };
}
