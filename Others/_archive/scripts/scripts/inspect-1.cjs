const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
for (const name of ['function removeMember', 'function onUploadFiles', 'async function doUpload', 'function apiDeletePhoto', 'async function apiDeletePhoto', 'function deleteCurrentPhoto', 'function uploadPool', 'function editMemberSave', 'function addMember']) {
  let i = -1, count = 0;
  while ((i = s.indexOf(name, i + 1)) >= 0) { count++; console.log('===', name, '@', i); if (count <= 2) console.log(s.slice(i, i + 1600)); }
  if (!count) console.log('=== ', name, 'NOT FOUND');
}
