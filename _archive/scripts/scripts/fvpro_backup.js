/* ===== FAMVAULT PRO — injected into module scope (uses in-scope $, a, s, Fr, Su, tv, Cu, Ao, np) ===== */
var FPK="fvpro_";
function fL(k,d){try{var v=localStorage.getItem(FPK+k);return v==null?d:JSON.parse(v)}catch(x){return d}}
function fS(k,v){try{localStorage.setItem(FPK+k,JSON.stringify(v))}catch(x){}}
function devId(){var d=localStorage.getItem(FPK+"device");if(!d){d="dev_"+Math.random().toString(36).slice(2,10);localStorage.setItem(FPK+"device",d)}return d}
var DEFM=_.map(function(m){return{id:m.id,name:m.name,handle:m.handle,relation:m.relation,bio:m.bio,birthday:m.birthday,color:m.color,initial:m.initial,role:(m.id==="herman"?"ADMIN":m.id==="lucy"?"COADMIN":m.id==="faith"?"MODERATOR":m.id==="amber"?"CHILD":"MEMBER"),muted:false,year:1999}});
var DEFA=Su.map(function(n){return{name:n,locked:false,allowed:[],allowDl:true,cover:null}});
var SEEDP=tv().map(function(p){p.pinned=false;p.views=0;return p});
var SEEDBOARD=[{user:"LUCY",text:"DINNER SUNDAY 6PM. NO EXCUSES. BRING APPETITE.",t:"2H AGO",color:"#06B6D4"},{user:"HERMAN",text:"UPLOADED SUMMER 24 ALBUM. PLEASE TAG FACES.",t:"5H AGO",color:"#F59E0B"},{user:"FAITH",text:"WHO TOOK MY POLAROID CAMERA?? RETURN IT.",t:"1D AGO",color:"#EC4899"}];
var SEEDINV=[{token:"WELCOME-HERMAN-01",role:"MEMBER",expiry:Date.now()+7*864e5,createdAt:Date.now(),createdBy:null,usedCount:1,oneTime:true,usedBy:null,album:null}];
var ROLECAP={ADMIN:["manage","edit","upload","download","delete"],COADMIN:["manage","edit","upload","download","delete"],MODERATOR:["edit","upload","download","deletePhotos"],MEMBER:["upload","download","editOwn"],CHILD:["download"]};
function roleOf(m){return m?m.role||"MEMBER":"GUEST"}
function can(m,what){if(!m)return false;if(m.muted)return false;var cap=ROLECAP[roleOf(m)]||ROLECAP.MEMBER;return cap.indexOf(what)>=0}
function isMgr(m){return m&&(roleOf(m)==="ADMIN"||roleOf(m)==="COADMIN")}
function logAct(list,msg,who){var t=nowTs();return[{id:uid("a"),who:who||null,msg:msg,at:t}].concat(list).slice(0,60)}
function bdayText(m){var d=Ao(m.birthday);if(d===null)return"NO BIRTHDAY SET";if(d===0){var ag=ageOf(m);return"🎂 TODAY • HAPPY BIRTHDAY"+(ag!==null?" — TURNS "+(ag+1):"")}if(d<=7)return"BIRTHDAY IN "+d+" DAYS • "+Cu(m.birthday);return"BIRTHDAY • "+Cu(m.birthday)}

function ProApp(){
var that={};
var[id,setI]=e.useState(null);
var[tab,setT]=e.useState("HOME");
var[albumF,setAF]=e.useState("ALL");
var[search,setS]=e.useState("");
var[mem,setM]=e.useState(function(){return fL("members",DEFM)});
var[albs,setA]=e.useState(function(){return fL("albums",DEFA)});
var[photos,setP]=e.useState(function(){return fL("photos",SEEDP)});
var[pws,setPW]=e.useState(function(){return fL("pw",{})});
var[invites,setInv]=e.useState(function(){return fL("inv",SEEDINV)});
var[board,setB]=e.useState(function(){var b=fL("board",null);return b||SEEDBOARD});
var[brdIn,setBI]=e.useState("");
var[trash,setTrash]=e.useState(function(){return fL("trash",[])});
var[albMeta,setAM]=e.useState(function(){return fL("albmeta",{})});
var[logH,setLog]=e.useState(function(){return fL("logh",[])});
var[bans,setBan]=e.useState(function(){return fL("bans",[])});
var[adminPin,setAP]=e.useState(function(){return fL("adminpin",null)});
var[pinIn,setPI]=e.useState("");
var[pinMsg,setPM]=e.useState("");
var[pinAct,setPA]=e.useState(null);
var[events,setEv]=e.useState(function(){return fL("events",[{id:"ev0",name:"FAMILY BBQ",date:"12-24",type:"EVENT"}])});
var[polls,setPoll]=e.useState(function(){return fL("polls",[{id:"poll0",q:"WHERE FOR CHRISTMAS?",opts:["HOME","GRANDMAS","CABIN"],votes:{}}])});
var[ann,setAnn]=e.useState(function(){return fL("ann",null)});
var[theme,setTh]=e.useState(function(){return fL("theme","dark")});
var[view,setV]=e.useState(null);
var[uploading,setUp]=e.useState(false);
var[upDraft,setUpD]=e.useState(null);
var[upCap,setUpC]=e.useState("");
var[upAlb,setUpA]=e.useState(Su[0]);
var[selMode,setSelM]=e.useState(false);
var[selIds,setSelI]=e.useState([]);
var[editPhoto,setEP]=e.useState(null);
var[newAlb,setNA]=e.useState(false);
var[newAlbName,setNAN]=e.useState("");
var[loginAs,setLA]=e.useState(null);
var[pwIn,setPWI]=e.useState("");
var[pwMsg,setPWM]=e.useState("");
var[logList,setLL]=e.useState([]);
var[newMem,setNM]=e.useState({name:"",relation:"",birthday:"",bio:"",color:"#8B5CF6"});
var[editMem,setEM]=e.useState(null);
var[editMemF,setEMF]=e.useState(null);
var[newPoll,setNP]=e.useState("");
var[newEvent,setNE]=e.useState({name:"",date:"",type:"EVENT"});
var[newInviteExp,setNIE]=e.useState(7);
var[newInviteOT,setNIOT]=e.useState(false);
var[newInviteAlb,setNIA]=e.useState("");
var[newInviteRole,setNIR]=e.useState("GUEST");
var[inviteMsg,setIM]=e.useState(null);
var[trashBin,setTB]=e.useState(false);
var[gallery,setG]=e.useState(true);
var[bdayMsgs,setBM]=e.useState(function(){return fL("bdaymsgs",[])});
var[bdayMsgIn,setBMI]=e.useState("");
var fileRef=e.useRef(null);
var me=e.useMemo(function(){return mem.find(function(m){return m.id===id})||null},[mem,id]);
var meRole=roleOf(me);
var isMgr_=isMgr(me);
var isAdm=meRole==="ADMIN";
var isGst=meRole==="GUEST";
var canUpload=!isGst&&!me.muted&&can(me,"upload");
var canEdit=!isGst&&!me.muted&&(isMgr_||meRole==="MODERATOR");
var canDl=!isGst&&!me.muted&&can(me,"download");
e.useEffect(function(){fS("members",mem)},[mem]);
e.useEffect(function(){fS("albums",albs)},[albs]);
e.useEffect(function(){fS("photos",photos)},[photos]);
e.useEffect(function(){fS("pw",pws)},[pws]);
e.useEffect(function(){fS("inv",invites)},[invites]);
e.useEffect(function(){fS("board",board)},[board]);
e.useEffect(function(){fS("trash",trash)},[trash]);
e.useEffect(function(){fS("albmeta",albMeta)},[albMeta]);
e.useEffect(function(){fS("logh",logH)},[logH]);
e.useEffect(function(){fS("bans",bans)},[bans]);
e.useEffect(function(){fS("adminpin",adminPin)},[adminPin]);
e.useEffect(function(){fS("events",events)},[events]);
e.useEffect(function(){fS("polls",polls)},[polls]);
e.useEffect(function(){fS("ann",ann)},[ann]);
e.useEffect(function(){fS("bdaymsgs",bdayMsgs)},[bdayMsgs]);
e.useEffect(function(){fS("theme",theme);document.body.style.background=theme==="light"?"#F4F4FA":"#08080F";document.body.style.color=theme==="light"?"#1A1A2E":"#E6E6F0"},[theme]);
var pinned=useMemo(function(){return photos.filter(function(p){return p.pinned&&!p.deleted})},[photos]);
var bdayToday=useMemo(function(){return mem.filter(function(m){return Ao(m.birthday)===0})},[mem]);
function visiblePhotos(){var banned=bans.some(function(b){return b.dev===devId()&&b.active});
if(banned)return[];
return photos.filter(function(p){if(p.deleted)return false;
var am=albMeta[p.album];
if(am&&am.locked){if(!isMgr_)return false;if(!(am.allowed||[]).includes(me.id))return false}
return true})}
var vis=useMemo(visiblePhotos,[photos,albumF,search,isMgr_,albMeta,me,bans]);
function filt(base){var o=base;if(albumF!=="ALL")o=o.filter(function(p){return p.album===albumF});
if(search.trim()){var q=search.toLowerCase();o=o.filter(function(p){return p.caption.toLowerCase().includes(q)||p.album.toLowerCase().includes(q)})}return o}
var shown=useMemo(function(){return filt(vis).slice().sort(function(x,y){return(x.pinned?0:1)-(y.pinned?0:1)})},[vis,albumF,search]);
var storageUsed=(photos.filter(function(p){return!p.deleted}).length*0.24).toFixed(1);
var uplByMem=useMemo(function(){var m={};photos.filter(function(p){return!p.deleted}).forEach(function(p){m[p.uploadedBy]=(m[p.uploadedBy]||0)+1});return m},[photos]);
var viewByMem=useMemo(function(){var m={};photos.forEach(function(p){(p.viewedBy||[]).forEach(function(u){m[u]=(m[u]||0)+1})});return m},[photos]);
var mostViewed=useMemo(function(){return vis.slice().sort(function(a2,b2){return(b2.views||0)-(a2.views||0)})[0]||null},[vis]);
var activity=useMemo(function(){return logH.slice(0,10)},[logH]);
function reqPin(label,fn){if(!isAdm){alert("ONLY ADMIN HERMAN CAN DO THIS");return}if(adminPin===null){alert("SET A 2FA PIN FIRST (ADMIN → SECURITY)");return}pinAct({label:label,fn:fn})}
function tryPin(){if(parseInt(pinIn,10)===adminPin){var act=pinAct;pinAct(null);setPI("");setPM("");act&&act.fn&&act.fn()}else{setPM("WRONG PIN");setPI("")}}
function openLogin(m){if(m.muted){alert("THIS MEMBER IS MUTED. ASK ADMIN TO UNMUTE.");return}if(bans.some(function(b){return b.dev===devId()&&b.active})){alert("THIS DEVICE IS BANNED. CONTACT ADMIN.");return}
setLA(m);setPWI("");setPWM("");
setLog(logH.concat([{id:uid("lg"),who:m.id,dev:devInfo(),devId:devId(),time:nowTs(),result:"ATTEMPT"}]).slice(-40))}
function doLogin(){if(!loginAs)return;var cur=pws[loginAs.id],m=loginAs;
if(!cur){if(pwIn.trim().length<4){setPWM("PASSWORD MUST BE AT LEAST 4 CHARS");return}
setPW(Object.assign({},pws,(pws[loginAs.id]=pwIn.trim(),pws)));setI(m.id);setLA(null);setLog(logH.concat([{id:uid("lg"),who:m.id,dev:devInfo(),devId:devId(),time:nowTs(),result:"OK"}]).slice(-40));return}
if(cur===pwIn.trim()){setI(m.id);setLA(null);setLog(logH.concat([{id:uid("lg"),who:m.id,dev:devInfo(),devId:devId(),time:nowTs(),result:"OK"}]).slice(-40));return}
setPWM("WRONG PASSWORD • TRY AGAIN");
setLog(logH.concat([{id:uid("lg"),who:m.id,dev:devInfo(),devId:devId(),time:nowTs(),result:"FAIL"}]).slice(-40))}
function loginGuest(){var g={id:"guest_"+Date.now().toString(36),name:"GUEST",handle:"guest",relation:"GUEST",bio:"VIEW ONLY",birthday:"01-01",color:"#5A5A80",initial:"G",role:"GUEST",muted:false};
setM(mem.concat([g]));setI(g.id);
setLog(logH.concat([{id:uid("lg"),who:g.id,dev:devInfo(),devId:devId(),time:nowTs(),result:"OK"}]).slice(-40))}
function logout(){setI(null);setT("HOME")}
function togglePinPhoto(pid){reqPin("UNPIN PHOTO",function(){setP(photos.map(function(p){return p.id===pid?Object.assign({},p,{pinned:!p.pinned}):p}))})}
function editPhotoSave(f){setP(photos.map(function(p){return p.id===f.id?Object.assign({},p,f):p}));setEP(null)}
function trashPhoto(pid){var p=photos.find(function(x){return x.id===pid});if(!p)return;
setP(photos.map(function(x){return x.id===pid?Object.assign({},x,{deleted:true,delAt:Date.now()}):x}));
setTrash(trash.concat([p]).slice(-60))}
function restorePhoto(pid){var p=trash.find(function(x){return x.id===pid});if(!p)return;
setTrash(trash.filter(function(x){return x.id!==pid}));
setP(photos.map(function(x){return x.id===pid?Object.assign({},x,{deleted:false,delAt:null}):x}))}
function permuteTrash(){} 
function bulkDelete(){if(!selIds.length)return;reqPin("BULK DELETE "+selIds.length+" PHOTOS",function(){var ids=selIds.slice();setP(photos.map(function(p){return ids.includes(p.id)?Object.assign({},p,{deleted:true,delAt:Date.now()}):p}));
setTrash(trash.concat(photos.filter(function(p){return ids.includes(p.id)})).slice(-60));setSelI([]);setSelM(false)})}
function openView(p){setV(p);setP(photos.map(function(x){return x.id===p.id?Object.assign({},x,{views:(x.views||0)+1,viewedBy:(x.viewedBy||[]).concat(me.id)}):x}))}
function canDlAlbum(p){var am=albMeta[p.album];return am&&!am.allowDl?isMgr_:canDl}
function doDl(p){if(!canDlAlbum(p)){alert("DOWNLOADS DISABLED FOR ALBUM \""+p.album+"\"");return}Ln(p)}
function addPhoto(){if(!upDraft)return;
var g={id:uid("p"),src:upDraft.dataUrl||upDraft,w:400,h:500,album:upAlb,uploadedBy:me.id,tagged:[me.id],caption:upCap||"NEW MEMORY",date:new Date().toISOString().slice(0,10),likes:0,views:0,pinned:false};
setP([g].concat(photos));setUp(false);setUpD(null);setUpC("");setLog(logH.concat([{id:uid("lg"),who:me.id,msg:"UPLOADED TO "+upAlb,time:nowTs()}]).slice(-40))}
function addAlbum(){var n=newAlbName.trim().toUpperCase();if(!n)return;
if(albs.some(function(a2){return a2.name===n})){alert("ALBUM EXISTS");return}
setA(albs.concat([{name:n,locked:false,allowed:[],allowDl:true,cover:null}]));setNAN("");setNA(false)}
function toggleLock(name){if(!isAdm){alert("ONLY ADMIN CAN LOCK ALBUMS");return}
var am=albMeta[name]||{locked:false,allowed:[]};
var allowed=(am.allowed||[]).slice();var who=me.id;
if(!allowed.includes(who))allowed.push(who);
setAM(Object.assign({},albMeta,(albMeta[name]={locked:!(am&&am.locked),allowed:allowed,allowDl:am.allowDl!==false,cover:am.cover||null},albMeta)))}
function toggleDl(name){if(!isAdm){alert("ONLY ADMIN CAN SET ALBUM DL");return}
var am=albMeta[name]||{locked:false,allowed:[]};
setAM(Object.assign({},albMeta,(albMeta[name]={locked:!!(am&&am.locked),allowed:(am.allowed||[]),allowDl:!(am&&am.allowDl!==false),cover:am.cover||null},albMeta)))}
function setCover(name,pid){if(!isMgr_)return;var am=albMeta[name]||{};
setAM(Object.assign({},albMeta,(albMeta[name]={locked:!!(am&&am.locked),allowed:(am.allowed||[]),allowDl:am.allowDl!==false,cover:pid},albMeta)))}
function postBoard(){if(isGst||me.muted)return;if(!brdIn.trim())return;
setB([{user:me.name,text:brdIn.trim().toUpperCase(),t:"JUST NOW",color:me.color}].concat(board));
setBI("")}
