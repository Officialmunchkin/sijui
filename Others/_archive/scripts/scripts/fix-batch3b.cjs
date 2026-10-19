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

// The file stores the escape sequence as literal backslash-u2022, so build it here.
const B = String.fromCharCode(92) + 'u2022'; // literal "\u2022" text

// ---- 8b. add IDs to progress markup ----
rep(`          <span>UPLOADING ${B} \${state.uploadDone} / \${state.uploadTotal}</span>
          <span>\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%</span>`,
`          <span id="upload-count">UPLOADING ${B} \${state.uploadDone} / \${state.uploadTotal}</span>
          <span id="upload-pct">\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%</span>`, 'fix 8 ids (count/pct)');

rep(`          <div style="height:100%;width:\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%;background:linear-gradient(90deg,var(--accent),#8B5CF6);transition:width .2s"></div>`,
`          <div id="upload-bar-fill" style="height:100%;width:\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%;background:linear-gradient(90deg,var(--accent),#8B5CF6);transition:width .2s"></div>`, 'fix 8 ids (bar fill)');

rep(`      <div style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.15em;color:#C4B5FD;margin-bottom:6px">`,
`      <div id="upload-progress" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.15em;color:#C4B5FD;margin-bottom:6px">`, 'fix 8 ids (wrapper)');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
