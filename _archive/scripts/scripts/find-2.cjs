const fs = require('fs');
const s = fs.readFileSync('C:/Users/Admin/OneDrive/Desktop/famvault-site/kashifamily.html', 'utf8');
function show(label, needle, len) {
  const i = s.indexOf(needle);
  console.log('== ' + label + ' @ ' + i + (i >= 0 ? '\n' + s.slice(i, i + len) : ' NOT FOUND'));
}
show('homeHTML start', 'function homeHTML', 3000);
show('albumsHTML start', 'function albumsHTML', 2200);
show('downloadPhoto', 'function downloadPhoto', 800);
show('filteredPhotos', 'function filteredPhotos', 900);
