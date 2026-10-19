export default async function run(page) {
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  await page.reload();
  await page.waitForTimeout(4000);
  // Simulate admin: show the tab, click it
  await page.addScriptTag({
    content: `
    const tab = document.getElementById('adminTabBtn');
    tab.style.display = 'inline-block';
    tab.click();
    // report panel state to DOM
    const res = {
      adminPanelVisible: getComputedStyle(document.getElementById('game-admin')).display,
      dashVisible: getComputedStyle(document.getElementById('admin-dash')).display,
      subTabs: document.querySelectorAll('#adminTabs .btn').length,
      dashUsers: document.getElementById('adUsers').textContent,
      dashFb: document.getElementById('adFeedback').textContent,
      dashPlays: document.getElementById('adPlays').textContent,
      adminShowType: typeof window.adminShow,
      adminLoadDashType: typeof window.adminLoadDash,
      adminLoadFeedbackType: typeof window.adminLoadFeedback,
      adminLoadUsersType: typeof window.adminLoadUsers,
      adminLoadBoardType: typeof window.adminLoadBoard,
      adminLoadConfigType: typeof window.adminLoadConfig,
      adminLoadAnnounceType: typeof window.adminLoadAnnounce,
      adminLoadMaintType: typeof window.adminLoadMaint,
      adminLoadSupportLogType: typeof window.adminLoadSupportLog,
      adminLoadAnalyticsType: typeof window.adminLoadAnalytics,
      adminLoadLogsType: typeof window.adminLoadLogs
    };
    const el = document.createElement('div'); el.id = 'qa-res'; el.textContent = JSON.stringify(res); document.body.appendChild(el);
  `});
  await page.waitForTimeout(2500);
  const out = await page.evaluate(() => document.getElementById('qa-res')?.textContent);
  return { result: out ? JSON.parse(out) : null, logs };
}
