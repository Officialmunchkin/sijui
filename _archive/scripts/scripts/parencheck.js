const fs=require("fs");
const f="C:/Users/Admin/OneDrive/Desktop/Wallpaper/fvpro.js";
const s=fs.readFileSync(f,"utf8");
let d=0,l=1,min=0,ml=0;
for(const c of s){if(c==="\n")l++;else if(c==="(")d++;else if(c===")"){d--;if(d<min){min=d;ml=l}}}
console.log("final",d,"min",min,"at line",ml);
