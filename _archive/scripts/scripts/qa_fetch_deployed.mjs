export default async function run(page, ui) {
  const resp = await page.goto('https://familyalbumvault.netlify.app', { waitUntil: 'load' });
  const html = await resp.text();
  return { deployedLen: html.length };
}
