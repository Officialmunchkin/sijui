export default async function run(page, ui) {
  const evts = [];
  page.on('pageerror', e => evts.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 12).join('\n')));
  page.on('console', m => { if (m.type() === 'error') evts.push('CONSOLE: ' + m.text().slice(0, 500)); });
  page.on('dialog', async d => { evts.push('DIALOG ' + d.type() + ': ' + d.message()); await d.accept('1999').catch(() => { }); });
  await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const snap = await ui.snapshot();
  return { evts, snap };
}
