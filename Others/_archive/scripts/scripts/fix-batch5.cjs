const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
let s = fs.readFileSync(file, 'utf8');
let changes = 0;
function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) { console.log('NOT FOUND:', label); return; }
  s = s.split(oldStr).join(newStr);
  changes++;
  console.log('applied:', label);
}

// 10a. dispatcher case
rep('      case "goto-bbq":         state.tab = "ALBUMS"; state.albumFilter = "FAMILY BBQ"; render(); break;',
`      case "goto-bbq":         state.tab = "ALBUMS"; state.albumFilter = "FAMILY BBQ"; render(); break;
      case "show-more":        state.visibleLimit = (state.visibleLimit || 100) + 100; render(); break;`,
'fix 10 dispatcher case');

// 10b. show-more buttons must use the growing limit, not hardcoded 100
rep('  ${list.length > 100 ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - 100} REMAINING)</button>` : ""}',
'  ${(list.length > (state.visibleLimit || 100)) ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - (state.visibleLimit || 100)} REMAINING)</button>` : ""}', 'fix 10 home show-more dynamic');

rep('  ${list.length > 100 ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - 100} REMAINING)</button>` : ""}\n  <div class="album-grid">',
'  ${(list.length > (state.visibleLimit || 100)) ? `<button class="btn" style="margin:16px auto;display:block" data-action="show-more">\\u2192 SHOW MORE (${list.length - (state.visibleLimit || 100)} REMAINING)</button>` : ""}\n  <div class="album-grid">', 'fix 10 albums show-more dynamic');

rep('  const visible = list.slice(0, 100);\n  const last = visible[0];',
'  const visible = list.slice(0, state.visibleLimit || 100);\n  const last = visible[0];', 'fix 10 home visible dynamic');

rep('  const visible = list.slice(0, 100);\n  const chips = ["ALL", ...state.albums];',
'  const visible = list.slice(0, state.visibleLimit || 100);\n  const chips = ["ALL", ...state.albums];', 'fix 10 albums visible dynamic');

// 10c. reset limit when tab or filter changes so new views start fresh
rep('      state.albumFilter = el.dataset.albumCard;\n      state.tab = "ALBUMS";\n      render(); return;',
'      state.albumFilter = el.dataset.albumCard;\n      state.tab = "ALBUMS";\n      state.visibleLimit = 100;\n      render(); return;', 'fix 10 reset on album card');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
