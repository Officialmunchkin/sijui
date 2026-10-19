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

// ---- 8b. add IDs to progress markup so uploadPool can update in place ----
rep(`      \${state.uploadTotal > 0 ? \`
      <div style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.15em;color:#C4B5FD;margin-bottom:6px">
          <span>UPLOADING \u2022 \${state.uploadDone} / \${state.uploadTotal}</span>
          <span>\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%</span>
        </div>
        <div style="height:6px;border-radius:999px;background:var(--surface2);overflow:hidden">
          <div style="height:100%;width:\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%;background:linear-gradient(90deg,var(--accent),#8B5CF6);transition:width .2s"></div>
        </div>
      </div>\` : ""}`,
`      \${state.uploadTotal > 0 ? \`
      <div id="upload-progress" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.15em;color:#C4B5FD;margin-bottom:6px">
          <span id="upload-count">UPLOADING \u2022 \${state.uploadDone} / \${state.uploadTotal}</span>
          <span id="upload-pct">\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%</span>
        </div>
        <div style="height:6px;border-radius:999px;background:var(--surface2);overflow:hidden">
          <div id="upload-bar-fill" style="height:100%;width:\${Math.round((state.uploadDone / state.uploadTotal) * 100)}%;background:linear-gradient(90deg,var(--accent),#8B5CF6);transition:width .2s"></div>
        </div>
      </div>\` : ""}`, 'fix 8 progress ids');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
