const fs=require('fs');
const f='C:/Users/Admin/OneDrive/Desktop/Wallpaper/fvpro.js';
const L=fs.readFileSync(f,'utf8').split('\n');
L[314]='cov&&h("button",{onClick:function(){setCover(al.name,cov.id)},className:"h-[28px] px-3 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},"SET COVER")))))))),';
fs.writeFileSync(f,L.join('\n'));
console.log('written');
