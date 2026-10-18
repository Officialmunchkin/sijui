// Birthday + formatting helpers ported from album.html.

export const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export function parseBirthday(str) {
  if (!str) return null;
  const parts = str.trim().split("-");
  if (parts.length === 3) { const mo = +parts[1], d = +parts[2]; if (mo && d) return { month: mo, day: d }; }
  if (parts.length === 2) { const mo = +parts[0], d = +parts[1]; if (mo && d) return { month: mo, day: d }; }
  if (str.includes("/")) { const p = str.split("/"); const mo = +p[0], d = +p[1]; if (mo && d) return { month: mo, day: d }; }
  return null;
}

export function daysUntilBirthday(str) {
  const b = parseBirthday(str);
  if (!b) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let next = new Date(now.getFullYear(), b.month - 1, b.day);
  if (next < now) next = new Date(now.getFullYear() + 1, b.month - 1, b.day);
  return Math.round((next - now) / 86400000);
}

export function bdayLabel(str) {
  const b = parseBirthday(str);
  return b ? `${MONTHS[b.month - 1]} ${b.day}` : str;
}

export function bdayInfo(m) {
  const d = daysUntilBirthday(m.birthday);
  if (d === null) return { text: "NO BIRTHDAY SET", isToday: false, days: null };
  if (d === 0) return { text: "🎉 TODAY • HAPPY BIRTHDAY", isToday: true, days: 0 };
  if (d <= 7) return { text: `BIRTHDAY IN ${d} DAYS • ${bdayLabel(m.birthday)}`, isToday: false, days: d };
  return { text: `BIRTHDAY • ${bdayLabel(m.birthday)}`, isToday: false, days: d };
}
