const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
const checks = [
  ['1 fileURL split-join', 'key.split(\'/\').map(encodeURIComponent).join(\'/\')'],
  ['2 no ACCOUNT_ID in frontend', 'ACCOUNT_ID'],
  ['2 no BUCKET in frontend', 'BUCKET'],
  ['3 revoke uploadPreview', 'URL.revokeObjectURL(state.uploadPreview)'],
  ['3 revoke file previews', 'f._previewUrl) URL.revokeObjectURL'],
  ['4 normalize size', 'p.size || p.fileSize || 0'],
  ['5 deleteAlbum persists', 'photos/update-album'],
  ['6 DELETE worker call', 'apiDeletePhoto'],
  ['7 100MB check', '100*1024*1024'],
  ['7 compressImage', 'async function compressImage'],
  ['7 use compress in upload', 'await compressImage('],
  ['8 progress ids', 'id="upload-bar-fill"'],
  ['9 guest cannot upload', 'GUESTS CANNOT UPLOAD'],
  ['10 pagination', 'state.visibleLimit'],
  ['11 blob download', 'async function downloadPhoto'],
  ['12 no raw UTF8 icons in JS', '✕'],
];
for (const [label, needle] of checks) {
  const count = s.split(needle).length - 1;
  const shouldNotExist = label.startsWith('2 no') || label.startsWith('12 no');
  const ok = shouldNotExist ? count === 0 : count > 0;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + label + ' | occurrences: ' + count);
}
