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

const BT = String.fromCharCode(96); // backtick
const NL = String.fromCharCode(10); // newline

// ---- 2. state defaults ----
rep('uploadAlbum: SEED_ALBUMS[0], uploadNewAlbum: false, newAlbumName: "",',
    'uploadAlbum: SEED_ALBUMS[0], uploadNewAlbum: false, newAlbumName: "", uploadFiles: null, uploadDone: 0, uploadTotal: 0,',
    'state defaults');

// ---- 3a. multiple attribute ----
rep('<input type="file" id="upload-file" accept="image/*,video/*" style="display:none">',
    '<input type="file" id="upload-file" accept="image/*,video/*" multiple style="display:none">',
    'file input multiple');

// ---- 3b. dropzone text ----
rep('DRAG & DROP PHOTO</div>',
    'DRAG & DROP PHOTOS / VIDEOS</div>',
    'dropzone line1');
rep('OR CLICK TO BROWSE</div>',
    'CLICK TO BROWSE \\u2022 SELECT MANY AT ONCE</div>',
    'dropzone line2');

// ---- 3c. progress bar before caption field ----
rep('      <div style="margin-top:16px">' + NL + '        <div class="field-label">CAPTION \\u2022 FAMILY STYLE</div>',
    '      ${state.uploadTotal > 0 ? ' + BT + NL +
    '      <div style="margin-top:14px">' + NL +
    '        <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.15em;color:#C4B5FD;margin-bottom:6px">' + NL +
    '          <span>UPLOADING \\u2022 ${state.uploadDone} / ${state.uploadTotal}</span>' + NL +
    '          <span>${Math.round((state.uploadDone / state.uploadTotal) * 100)}%</span>' + NL +
    '        </div>' + NL +
    '        <div style="height:6px;border-radius:999px;background:var(--surface2);overflow:hidden">' + NL +
    '          <div style="height:100%;width:${Math.round((state.uploadDone / state.uploadTotal) * 100)}%;background:linear-gradient(90deg,var(--accent),#8B5CF6);transition:width .2s"></div>' + NL +
    '        </div>' + NL +
    '      </div>' + BT + ' : ""}' + NL +
    '      ${state.uploadFiles && state.uploadFiles.length > 1 ? ' + BT + NL +
    '      <div style="margin-top:10px;font-size:10px;letter-spacing:.15em;color:var(--dim)">${state.uploadFiles.length} FILES QUEUED \\u2022 ${state.uploadFiles.filter(f => f.type.startsWith("video/")).length} VIDEOS</div>' + BT + ' : ""}' + NL +
    '      <div style="margin-top:16px">' + NL + '        <div class="field-label">CAPTION \\u2022 FAMILY STYLE</div>',
    'progress bar + queue count');

// ---- 3d. upload button ----
rep('${state.uploading ? "UPLOADING..." : "UPLOAD TO VAULT \\u2192"}',
    '${state.uploading ? "UPLOADING " + state.uploadDone + "/" + state.uploadTotal + "..." : "UPLOAD " + ((state.uploadFiles && state.uploadFiles.length) || 0) + " TO VAULT \\u2192"}',
    'button label');
rep('data-action="do-upload" ${!state.uploadFile || state.uploading ? "disabled" : ""}',
    'data-action="do-upload" ${!(state.uploadFiles && state.uploadFiles.length) || state.uploading ? "disabled" : ""}',
    'button disabled');

// ---- 4. bindings ----
rep('fi.addEventListener("change", e => { if(e.target.files[0]) onUploadFile(e.target.files[0]); });',
    'fi.addEventListener("change", e => { if(e.target.files.length) onUploadFiles(e.target.files); e.target.value = ""; });',
    'change listener multi');
rep('      const f = e.dataTransfer.files[0];' + NL + '      if(f) onUploadFile(f);',
    '      if(e.dataTransfer.files.length) onUploadFiles(e.dataTransfer.files);',
    'drop listener multi');

fs.writeFileSync(file, s, 'utf8');
console.log('total changes:', changes);
