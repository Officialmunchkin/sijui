const fs = require('fs');
const file = 'C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html';
const s = fs.readFileSync(file, 'utf8');
function show(label, needle, len) {
  const i = s.indexOf(needle);
  console.log('== ' + label + ' @ ' + i + (i >= 0 ? '\n' + s.slice(i, i + len) : ' NOT FOUND'));
}
show('fileURL', 'function fileURL', 300);
show('R2_CONFIG', 'const R2_CONFIG', 400);
show('apiListPhotos', 'async function apiListPhotos', 700);
show('deleteAlbum', 'function deleteAlbum', 900);
show('apiDeletePhoto', 'function apiDeletePhoto', 400);
show('onUploadFiles', 'function onUploadFiles', 500);
show('uploadPool lane render', 'state.uploadDone = (state.uploadDone || 0) + 1', 300);
show('doUpload guest check', 'async function doUpload', 200);
show('downloadPhoto', 'function downloadPhoto', 600);
show('filteredPhotos', 'function filteredPhotos', 700);
show('doUpload loop / pool call', 'uploadPool(files', 300);
