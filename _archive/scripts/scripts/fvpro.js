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
function trashCleanup(){return true}
if(!id){var nonGuest=mem.filter(function(m){return roleOf(m)!=="GUEST"});
var lg=loginAs;
var curPw=lg?pws[lg.id]:null,first=!curPw;
return h("div",{className:"min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center px-4 py-8",style:{background:theme==="light"?"#F4F4FA":"#08080F",color:theme==="light"?"#1A1A2E":"#E6E6F0"}},
h("div",{className:"pointer-events-none absolute inset-0"},h("div",{className:"absolute top-[-20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] h-[600px] bg-[#8B5CF6]/[0.18] blur-[120px] rounded-full"})),
h("div",{className:"relative z-10 w-full max-w-[760px]"},
h("div",{className:"text-center mb-8"},
h("h1",{className:"text-[52px] md:text-[72px] font-[800] tracking-[0.12em] leading-none",style:{background:"linear-gradient(180deg, #C4B5FD 0%, #8B5CF6 50%, #6366F1 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}},
h("span",{children:"FAM"}),h("br",{}),h("span",{children:"VAULT PRO"})),
h("div",{className:"mt-4 text-[11px] tracking-[0.32em] font-bold uppercase",children:"HERMAN • PRIVATE FAMILY ALBUM • PRO"})),
h("div",{className:"grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"},nonGuest.map(function(D){
var locked=!!pws[D.id];
return h("button",{key:D.id,onClick:function(){openLogin(D)},className:"group text-left border rounded-[24px] p-4 md:p-5 transition-all hover:-translate-y-[2px] bg-[#151525] border-[#2A2A4A] hover:border-[#8B5CF6]/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]"},
h("div",{className:"flex items-center justify-between mb-4"},
h("div",{className:"w-12 h-12 rounded-full flex items-center justify-center font-black text-[18px] text-white",style:{background:D.color}},D.initial),
h("div",{className:"flex items-center gap-1.5"},h("span",{className:"text-[8px] tracking-widest text-[#5A80]",children:locked?"LOCKED":"NEW"}))),
h("div",{className:"text-[13px] font-[800] tracking-[0.18em] text-white"},D.name," ",h("span",{className:"ml-1 text-[8px] px-1.5 py-0.5 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[#C4B5FD]",children:D.role})),
h("div",{className:"text-[10px] tracking-[0.2em] text-[#8B8BB0] mt-1 lowercase",children:D.handle}),
h("div",{className:"mt-3 inline-flex px-2.5 py-1 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-[0.18em] text-[#5A5A80]",children:D.relation}))})),
h("div",{className:"mt-8 flex gap-3 justify-center items-center"},
h("button",{onClick:loginGuest,className:"h-[44px] px-8 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-white text-[11px] font-[800] tracking-[0.22em] hover:border-[#8B5CF6]/50",children:"CONTINUE AS GUEST • VIEW ONLY"})),
h("div",{className:"mt-6 text-[9px] tracking-[0.2em] text-[#5A5A80]",children:"VAULT CONTAINS "+photos.filter(function(p){return!p.deleted}).length+" MEMORIES • PRIVATE • FAMILY ONLY"})),
lg&&h("div",{className:"fixed inset-0 z-[80] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-[#08080F]/80 backdrop-blur-[14px]",onClick:function(){setLA(null)}}),
h("div",{className:"relative w-full max-w-[400px] bg-[#151525] border border-[#8B5CF6]/40 rounded-[24px] p-6"},
h("div",{className:"text-[12px] font-[800] tracking-[0.2em] text-white",children:"LOGIN AS "+lg.name}),
h("div",{className:"mt-3 text-[10px] tracking-widest text-[#5A5A80]",children:first?"FIRST TIME • SET PASSWORD":"ENTER PASSWORD"}),
h("input",{type:"password",value:pwIn,autoFocus:true,onChange:function(ev){setPWI(ev.target.value);setPWM("")},onKeyDown:function(ev){if(ev.key==="Enter")doLogin()},placeholder:first?"CREATE PASSWORD":"ENTER PASSWORD",className:"mt-3 w-full h-[44px] rounded-[12px] bg-[#0E0E1E] border border-[#8B5CF6]/40 px-4 text-[12px] tracking-wide text-white focus:outline-none"}),
pwMsg&&h("div",{className:"mt-2 px-3 py-2 rounded-[10px] bg-[#FF6B8A]/10 border border-[#FF6B8A]/30 text-[10px] tracking-widest text-[#FF6B8A]",children:pwMsg}),
h("div",{className:"mt-5 flex gap-3"},
h("button",{onClick:function(){setLA(null)},className:"flex-1 h-[44px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]",children:"CANCEL"}),
h("button",{onClick:doLogin,className:"flex-1 h-[44px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[11px] font-[800]",children:first?"SET & LOGIN →":"LOGIN →"})))));
var tabs=[{k:"HOME",l:"HOME"},{k:"ALBUMS",l:"ALBUMS"},{k:"MEMBERS",l:"MEMBERS"},{k:"BOARD",l:"BOARD"},{k:"TOOLS",l:"PHOTO TOOLS"},{k:"EVENTS",l:"EVENTS"},{k:"FUN",l:"FUN"},{k:"ADMIN",l:"ADMIN",red:true}];
var shownTabs=tabs.filter(function(t2){if(t2.k==="ADMIN"&&!(isMgr_||isAdm))return false;return true});
var themeCard=theme==="light";
var cardCls=themeCard?"bg-white border-[#D5D5E8]":"bg-[#151525] border-[#2A2A4A]";
var txtMain=themeCard?"text-[#1A1A2E]":"text-white";
var txtSub=themeCard?"text-[#55557A]":"text-[#8B8BB0]";
return h("div",{className:"min-h-screen relative",style:{background:themeCard?"#F4F4FA":"#08080F",color:themeCard?"#1A1A2E":"#E6E6F0"}},
ann&&h("div",{className:"w-full bg-gradient-to-r from-[#F59E0B] to-[#EC4899] text-white py-2 text-center text-[11px] tracking-widest font-bold"},ann.text," ",isAdm&&h("button",{className:"ml-2 underline",onClick:function(){reqPin("REMOVE ANNOUNCEMENT",function(){setAnn(null)})}},[h("span",{children:"✕"})])),
bdayToday.length>0&&h("div",{className:"w-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#EC4899] text-white py-3 text-center"},
h("span",{className:"text-[14px] font-[900] tracking-[0.2em]"},"🎉 IT'S ",bdayToday.map(function(m){return m.name}).join(" & "),"'S BIRTHDAY"+(bdayToday[0]?ageOf(bdayToday[0])!==null?" — TURNS "+(ageOf(bdayToday[0])+1):"":"")+"! 🎉"),
bdayToday[0]&&h("div",{className:"mt-1 text-[10px] tracking-widest opacity-90"},"LEAVE A MESSAGE ON THE BIRTHDAY WALL (HOME)")),
h("header",{className:"sticky top-0 z-40 backdrop-blur-[18px] border-b",style:{background:themeCard?"rgba(244,244,250,0.9)":"rgba(8,8,15,0.8)",borderColor:themeCard?"#D5D5E8":"#1A1A2E"}},
h("div",{className:"max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between"},
h("div",{className:"flex items-center gap-3"},
h("span",{className:"text-[13px] font-[800] tracking-widest",className2:null},"FAMVAULT PRO"),
h("span",{className:"text-[10px] tracking-widest "+txtSub},me.name," • ",meRole," ",me.muted&&"• MUTED")),
h("div",{className:"flex items-center gap-2"},
h("button",{onClick:function(){setTh(themeCard?"dark":"light")},className:"h-[32px] px-3 rounded-full border text-[10px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},themeCard?"🌙 DARK":"☀ LIGHT"),
h("button",{onClick:logout,className:"h-[32px] px-4 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[10px] font-[800] tracking-widest"},"LOGOUT")))),
h("div",{className:"max-w-[1280px] mx-auto px-4 md:px-6 pt-6"},
h("div",{className:"flex flex-wrap gap-2 mb-4"},shownTabs.map(function(t2){
return h("button",{key:t2.k,onClick:function(){setT(t2.k)},className:"h-[34px] px-4 rounded-full text-[11px] font-[800] tracking-widest border "+(tab===t2.k?"bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] border-[#8B5CF6] text-white":(t2.red?"bg-[#1A1220] border-[#3A1A2A] text-[#FF6B8A]":"bg-[#1A1A2E] border-[#2A2A4A] text-[#8B8BB0]"))},t2.l)})),
h("div",{className:"flex flex-wrap gap-2 mb-6 items-center"},
h("input",{value:search,onChange:function(ev){setS(ev.target.value)},placeholder:"SEARCH VAULT...",className:"h-[38px] w-[220px] md:w-[280px] rounded-full px-4 text-[11px] tracking-widest",style:{background:themeCard?"#fff":"#151525",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}}),
canUpload&&h("button",{onClick:function(){setUp(true)},className:"h-[38px] px-5 rounded-full bg-white text-black text-[11px] font-[800] tracking-widest"},"+ UPLOAD"),
canEdit&&h("button",{onClick:function(){setSelM(!selMode);setSelI([])},className:"h-[38px] px-5 rounded-full border text-[11px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},selMode?"EXIT SELECT":"SELECT"),
h("button",{onClick:function(){setTB(!trashBin)},className:"h-[38px] px-4 rounded-full border text-[11px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},"🗑 TRASH ("+trash.length+")"),
h("button",{onClick:function(){reqPin("EXPORT ALL PHOTOS AS ZIP",function(){var parts=photos.filter(function(p){return!p.deleted}).map(function(p){return p.id+":"+p.album+":"+p.caption}).join("\n");
var blob=new Blob([parts],{type:"text/plain"});var url=URL.createObjectURL(blob);var link=document.createElement("a");link.href=url;link.download="famvault-export.txt";link.click();setTimeout(function(){URL.revokeObjectURL(url)},1000)})},className:"h-[38px] px-4 rounded-full border text-[11px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},"⬇ EXPORT"))));
// trash bin panel
if(trashBin)return h("div",{className:"max-w-[900px] mx-auto px-4 md:px-6 pt-6 pb-32"},
h("button",{onClick:function(){setTB(false)},className:"mb-4 h-[32px] px-4 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[10px] tracking-widest text-white"},"← BACK"),
h("div",{className:"text-[13px] font-[800] tracking-widest mb-4"},"TRASH BIN • ITEMS AUTO-EXPIRE AFTER 30 DAYS"),
trash.length===0&&h("div",{className:textSub,"children":"EMPTY"}),
h("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3"},trash.map(function(p){
var days=30-Math.floor((Date.now()-(p.delAt||Date.now()))/864e5);
return h("div",{key:p.id,className:"rounded-[16px] p-3 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("img",{src:p.src,className:"w-full rounded-[10px]"}),
h("div",{className:"mt-2 text-[10px] truncate "+txtSub},p.caption),
h("div",{className:"text-[9px] text-[#F59E0B]"},"RESTORE IN "+days+"D"),
h("button",{onClick:function(){restorePhoto(p.id)},className:"mt-2 w-full h-[28px] rounded-full bg-white text-black text-[10px] font-bold"},"RESTORE"))})));
// pin modal
if(pinAct)return h("div",{className:"fixed inset-0 z-[90] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-black/80 backdrop-blur"}),
h("div",{className:"relative w-full max-w-[360px] bg-[#151525] border border-[#8B5CF6]/40 rounded-[24px] p-6 text-white"},
h("div",{className:"text-[13px] font-[800] tracking-widest"},"2FA PIN REQUIRED"),
h("div",{className:"mt-1 text-[10px] tracking-widest text-[#8B8BB0]",children:pinAct.label}),
h("input",{type:"password",value:pinIn,autoFocus:true,onChange:function(ev){setPI(ev.target.value);setPM("")},onKeyDown:function(ev){if(ev.key==="Enter")tryPin()},placeholder:"ENTER ADMIN PIN",className:"mt-4 w-full h-[44px] rounded-[12px] bg-[#0E0E1E] border border-[#8B5CF6]/40 px-4 text-[14px] tracking-[0.4em] text-white focus:outline-none text-center"}),
pinMsg&&h("div",{className:"mt-2 text-[10px] tracking-widest text-[#FF6B8A]",children:pinMsg}),
h("div",{className:"mt-5 flex gap-3"},
h("button",{onClick:function(){pinAct(null);setPI("");setPM("")},className:"flex-1 h-[40px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]"},"CANCEL"),
h("button",{onClick:tryPin,className:"flex-1 h-[40px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[11px] font-[800]"},"CONFIRM"))));
// photo edit modal
if(editPhoto)return h("div",{className:"fixed inset-0 z-[90] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-black/80 backdrop-blur",onClick:function(){setEP(null)}}),
h("div",{className:"relative w-full max-w-[460px] bg-[#151525] border border-[#8B5CF6]/40 rounded-[24px] p-6 text-white max-h-[90vh] overflow-y-auto"},
h("div",{className:"text-[13px] font-[800] tracking-widest"},"EDIT PHOTO DETAILS"),
h("div",{className:"mt-4 space-y-3"},
h("div",{},h("div",{className:"text-[9px] tracking-widest text-[#5A5A80] mb-1"},"CAPTION"),h("input",{value:editPhoto.caption,onChange:function(ev){setEP(Object.assign({},editPhoto,{caption:ev.target.value}))},className:"w-full h-[40px] rounded-[10px] bg-[#0E0E1E] border border-[#2A2A4A] px-3 text-[11px] text-white"})),
h("div",{},h("div",{className:"text-[9px] tracking-widest text-[#5A5A80] mb-1"},"ALBUM"),h("select",{value:editPhoto.album,onChange:function(ev){setEP(Object.assign({},editPhoto,{album:ev.target.value}))},className:"w-full h-[40px] rounded-[10px] bg-[#0E0E1E] border border-[#2A2A4A] px-3 text-[11px] text-white"},albs.map(function(al){return h("option",{key:al.name,value:al.name,children:al.name})}))),
h("div",{},h("div",{className:"text-[9px] tracking-widest text-[#5A5A80] mb-1"},"DATE TAKEN"),h("input",{value:editPhoto.date,onChange:function(ev){setEP(Object.assign({},editPhoto,{date:ev.target.value}))},className:"w-full h-[40px] rounded-[10px] bg-[#0E0E1E] border border-[#2A2A4A] px-3 text-[11px] text-white"})),
h("div",{},h("div",{className:"text-[9px] tracking-widest text-[#5A5A80] mb-1"},"TAGGED (click to toggle)"),h("div",{className:"flex flex-wrap gap-2"},mem.filter(function(m){return roleOf(m)!=="GUEST"}).map(function(m){
var on=editPhoto.tagged.includes(m.id);
return h("button",{key:m.id,onClick:function(){var t2=editPhoto.tagged.slice();if(on)t2=t2.filter(function(x){return x!==m.id});else t2.push(m.id);setEP(Object.assign({},editPhoto,{tagged:t2}))},className:"h-[28px] px-3 rounded-full text-[10px] border "+(on?"bg-[#8B5CF6] border-[#8B5CF6] text-white":"bg-[#1A1A2E] border-[#2A2A4A] text-[#8B8BB0]")},m.name)})))),
h("div",{className:"mt-5 flex gap-3"},
h("button",{onClick:function(){setEP(null)},className:"flex-1 h-[40px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]"},"CANCEL"),
h("button",{onClick:function(){editPhotoSave(editPhoto)},className:"flex-1 h-[40px] rounded-full bg-white text-black text-[11px] font-[800]"},"SAVE"))));
// view modal
if(view)return h("div",{className:"fixed inset-0 z-[60] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-[#050510]/90 backdrop-blur-[16px]",onClick:function(){setV(null)}}),
h("div",{className:"relative w-full max-w-[920px] bg-[#151525] border border-[#2A2A4A] rounded-[24px] overflow-hidden flex flex-col md:flex-row text-white"},
h("div",{className:"flex-1 bg-black flex items-center justify-center min-h-[320px] relative"},
h("img",{src:view.src,className:"max-w-full max-h-[70vh] object-contain",style:isGst?{filter:"blur(14px)"}:null}),
isGst&&h("div",{className:"absolute bottom-3 left-0 right-0 text-center text-[10px] tracking-widest text-white/80"},"FACES BLURRED IN GUEST VIEW")),
h("div",{className:"w-full md:w-[340px] p-6 flex flex-col"},
h("div",{className:"flex items-center justify-between"},
h("span",{className:"px-2.5 py-1 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[10px] tracking-widest text-[#C4B5FD]",children:view.album}),
h("button",{onClick:function(){setV(null)},className:"w-8 h-8 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[#8B8BB0]"},"✕")),
h("div",{className:"mt-4 text-[14px] font-bold",children:view.caption}),
h("div",{className:"mt-2 text-[11px] tracking-widest text-[#5A5A80]"},view.date," • BY ",(mem.find(function(m){return m.id===view.uploadedBy})||{}).name," • ",(view.views||0)," VIEWS"),
canEdit&&h("button",{onClick:function(){setEP(view);setV(null)},className:"mt-3 h-[30px] px-3 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[10px] tracking-widest text-white"},"✎ EDIT DETAILS"),
canEdit&&h("button",{onClick:function(){togglePinPhoto(view.id)},className:"mt-2 h-[30px] px-3 rounded-full border border-[#8B5CF6]/40 text-[10px] tracking-widest text-[#C4B5FD]"},view.pinned?"📌 UNPIN":"📌 PIN TO TOP"),
canEdit&&h("button",{onClick:function(){reqPin("DELETE PHOTO",function(){trashPhoto(view.id);setV(null)})},className:"mt-2 h-[30px] px-3 rounded-full bg-[#1A1220] border border-[#3A1A2A] text-[10px] tracking-widest text-[#FF6B8A]"},"🗑 MOVE TO TRASH"),
canDlAlbum(view)&&h("button",{onClick:function(){doDl(view)},className:"mt-auto pt-4 w-full h-[40px] rounded-full bg-white text-black text-[11px] font-[800]"},"⬇ DOWNLOAD"))));
// main body
var bodyEl=null;
if(tab==="HOME")bodyEl=h("div",{},
pinned.length>0&&h("div",{className:"mb-6"},h("div",{className:"text-[11px] tracking-[0.3em] font-bold mb-3 "+txtSub},"📌 PINNED"),h("div",{className:"flex flex-wrap gap-3"},pinned.map(function(p){return h("button",{key:p.id,onClick:function(){openView(p)},className:"rounded-[16px] overflow-hidden border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},h("img",{src:p.src,className:"w-[140px] h-[100px] object-cover"}),h("div",{className:"p-2 text-[10px] truncate "+txtMain},p.caption))}))),
bdayToday.length>0&&h("div",{className:"mb-6 rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[12px] font-[800] tracking-widest "+txtMain},"🎂 BIRTHDAY WALL — LEAVE A MESSAGE FOR "+bdayToday.map(function(m){return m.name}).join(" & ")),
h("div",{className:"mt-2 flex gap-2"},h("input",{value:bdayMsgIn,onChange:function(ev){setBMI(ev.target.value)},placeholder:"HAPPY BIRTHDAY! ...",className:"flex-1 h-[36px] rounded-full px-4 text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"},onKeyDown:function(ev){if(ev.key==="Enter"&&bdayMsgIn.trim()){setBM([{who:me.name,text:bdayMsgIn.trim(),t:nowT()}].concat(bdayMsgs));setBMI("")}}},null),
h("button",{onClick:function(){if(bdayMsgIn.trim()){setBM([{who:me.name,text:bdayMsgIn.trim(),t:nowT()}].concat(bdayMsgs));setBMI("")}},className:"h-[36px] px-4 rounded-full bg-white text-black text-[10px] font-bold"},"POST")),
bdayMsgs.length>0&&h("div",{className:"mt-3 space-y-2"},bdayMsgs.slice(0,6).map(function(m2,i2){return h("div",{key:i2,className:"text-[11px] "+txtSub},h("span",{className:"font-bold "+txtMain},m2.who," • "),m2.text," ",h("span",{className:"text-[9px]"},m2.t))}))),
h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"},
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},h("div",{className:"text-[10px] tracking-[0.3em] font-bold mb-3 "+txtSub},"VAULT"),h("div",{className:"text-[24px] font-[800] "+txtMain},photos.filter(function(p){return!p.deleted}).length," PHOTOS"),h("div",{className:"text-[10px] "+txtSub},storageUsed," MB • TRASH ",trash.length)),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},h("div",{className:"text-[10px] tracking-[0.3em] font-bold mb-3 "+txtSub},"MOST VIEWED"),h("div",{className:"text-[12px] font-bold truncate "+txtMain},mostViewed?mostViewed.caption:"—"),h("div",{className:"text-[10px] "+txtSub},mostViewed?(mostViewed.views||0)+" VIEWS":"NO DATA")),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},h("div",{className:"text-[10px] tracking-[0.3em] font-bold mb-3 "+txtSub},"NEXT EVENT"),h("div",{className:"text-[12px] font-bold "+txtMain},(events[0]||{}).name||"—"),h("div",{className:"text-[10px] "+txtSub},(events[0]||{}).date||""))),
h("div",{className:"columns-1 md:columns-2 lg:columns-3 gap-4"},shown.map(function(p){
var am=albMeta[p.album]||{};
return h("div",{key:p.id,className:"break-inside-avoid rounded-[20px] overflow-hidden border mb-4 relative",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
selMode&&h("button",{onClick:function(){setSelI(selIds.includes(p.id)?selIds.filter(function(x){return x!==p.id}):selIds.concat([p.id]))},className:"absolute top-2 left-2 z-20 w-6 h-6 rounded-full border text-[10px] "+(selIds.includes(p.id)?"bg-[#8B5CF6] text-white border-[#8B5CF6]":"bg-black/60 text-white border-white/40")},selIds.includes(p.id)?"✓":""),
p.pinned&&h("div",{className:"absolute top-2 right-2 z-10 text-[12px]"},"📌"),
h("img",{src:p.src,className:"w-full cursor-pointer",onClick:function(){openView(p)}}),
h("div",{className:"p-2 text-[10px] "+txtMain},p.caption))})));
if(tab==="ALBUMS")bodyEl=h("div",{},
h("div",{className:"flex flex-wrap gap-2 mb-6 items-center"},h("button",{onClick:function(){setAF("ALL")},className:"h-[32px] px-4 rounded-full text-[11px] border "+(albumF==="ALL"?"bg-[#8B5CF6] border-[#8B5CF6] text-white":"border-[#2A2A4A] text-[#8B8BB0]")},"ALL • "+vis.length),
albs.map(function(al){var am=albMeta[al.name]||{};var cnt=photos.filter(function(p){return!p.deleted&&p.album===al.name}).length;
return h("button",{key:al.name,onClick:function(){setAF(al.name)},className:"h-[32px] px-4 rounded-full text-[11px] border "+(albumF===al.name?"bg-[#8B5CF6] border-[#8B5CF6] text-white":"border-[#2A2A4A] text-[#8B8BB0]")},al.name," • ",cnt,am.locked?" 🔒":"")})),
isMgr_&&h("button",{onClick:function(){setNA(true)},className:"h-[32px] px-4 rounded-full bg-white text-black text-[11px] font-[800]"},"+ NEW ALBUM")),
h("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"},albs.map(function(al){
var am=albMeta[al.name]||{locked:false,allowed:[],allowDl:true,cover:null};
var cnt=photos.filter(function(p){return!p.deleted&&p.album===al.name}).length;
var cov=photos.find(function(p){return p.id===am.cover&&!p.deleted})||photos.find(function(p){return!p.deleted&&p.album===al.name});
return h("div",{key:al.name,className:"rounded-[20px] overflow-hidden border",style:{borderColor:themeCard?"#D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"aspect-[4/3] relative bg-black/20"},cov?h("img",{src:cov.src,className:"w-full h-full object-cover",style:am.locked?{filter:"blur(10px)"}:null}):h("div",{className:"w-full h-full flex items-center justify-center text-[10px] tracking-widest "+txtSub},"EMPTY"),
am.locked&&h("div",{className:"absolute inset-0 flex items-center justify-center"},"🔒")),
h("div",{className:"p-4"},h("div",{className:"text-[13px] font-[800] tracking-widest "+txtMain},al.name," ",am.locked?"🔒":""," ",!am.allowDl?"• ⛔DL":""),
h("div",{className:"text-[10px] "+txtSub},cnt," PHOTOS • ",am.locked?"PRIVATE • "+((am.allowed||[]).length)+" ALLOWED":"OPEN • DL "+(am.allowDl?"ON":"OFF")),
isMgr_&&h("div",{className:"mt-3 flex flex-wrap gap-2"},
h("button",{onClick:function(){toggleLock(al.name)},className:"h-[28px] px-3 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},am.locked?"🔓 UNLOCK":"🔒 LOCK"),
h("button",{onClick:function(){toggleDl(al.name)},className:"h-[28px] px-3 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},"⬇ DL "+(am.allowDl?"ON":"OFF")),
cov&&h("button",{onClick:function(){setCover(al.name,cov.id)},className:"h-[28px] px-3 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},"SET COVER")))))))),
h("div",{className:"columns-1 md:columns-3 gap-4"},shown.map(function(p){return h("div",{key:p.id,className:"break-inside-avoid rounded-[16px] overflow-hidden border mb-4",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},h("img",{src:p.src,className:"w-full cursor-pointer",onClick:function(){openView(p)}}))})));
if(tab==="MEMBERS")bodyEl=h("div",{},
isMgr_&&h("button",{onClick:function(){setNM({name:"",relation:"",birthday:"",bio:"",color:"#8B5CF6"})},className:"mb-4 h-[34px] px-4 rounded-full bg-white text-black text-[11px] font-[800]"},"+ ADD MEMBER"),
h("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"},mem.map(function(m){
var up=(uplByMem[m.id]||0);
return h("div",{key:m.id,className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"flex items-start justify-between"},
h("div",{className:"w-12 h-12 rounded-full flex items-center justify-center font-black text-white",style:{background:m.color}},m.initial),
h("div",{className:"text-right"},h("span",{className:"text-[9px] px-2 py-1 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[#C4B5FD]",children:m.role}),m.muted&&h("span",{className:"ml-1 text-[9px] px-2 py-1 rounded-full bg-[#FF6B8A]/20 text-[#FF6B8A]"},"MUTED"))),
h("div",{className:"mt-3 text-[14px] font-[800] tracking-widest "+txtMain},m.name),
h("div",{className:"text-[10px] tracking-widest "+txtSub},m.relation," • B.",m.birthday," • UPLOADED ",up),
isMgr_&&h("div",{className:"mt-3 flex flex-wrap gap-2"},
h("button",{onClick:function(){setEM(m);setEMF({role:m.role,muted:m.muted})},className:"h-[26px] px-2 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},"✎ ROLE"),
h("button",{onClick:function(){reqPin("MUTE / UNMUTE "+m.name,function(){setM(mem.map(function(x){return x.id===m.id?Object.assign({},x,{muted:!x.muted}):x}))})},className:"h-[26px] px-2 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[9px] tracking-widest text-white"},m.muted?"🔊 UNMUTE":"🔇 MUTE")))})));
if(tab==="BOARD")bodyEl=h("div",{className:"max-w-[720px] mx-auto"},
h("div",{className:"rounded-[24px] p-6 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold "+txtSub},"FAMILY BOARD"),
h("div",{className:"mt-4 space-y-3"},board.map(function(b,i2){return h("div",{key:i2,className:"flex gap-3 p-4 rounded-[16px] border",style:{borderColor:themeCard?"#E5E5F0":"#2A2A4A",background:themeCard?"#F7F7FC":"#1A1A2E"}},
h("div",{className:"w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",style:{background:b.color}},(b.user||"U")[0]),
h("div",{className:"flex-1"},h("div",{className:"text-[11px] font-bold tracking-widest "+txtMain},b.user," ",h("span",{className:"text-[#5A80] font-normal"},b.t)),
h("div",{className:"mt-1 text-[12px] "+txtSub},b.text))})),
h("div",{className:"mt-4 flex gap-2"},
h("input",{value:brdIn,disabled:isGst||me.muted,onChange:function(ev){setBI(ev.target.value)},onKeyDown:function(ev){if(ev.key==="Enter")postBoard()},placeholder:"WRITE ON BOARD...",className:"flex-1 h-[40px] rounded-full px-4 text-[11px] tracking-widest",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}}),
h("button",{onClick:postBoard,disabled:isGst||me.muted,className:"h-[40px] px-5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[11px] font-bold tracking-widest disabled:opacity-30"},"POST")),
(isGst||me.muted)&&h("div",{className:"mt-2 text-[9px] tracking-widest "+txtSub},me.muted?"YOU ARE MUTED — ASK AN ADMIN":"GUESTS CANNOT POST ON BOARD")));)
if(tab==="TOOLS")bodyEl=h("div",{},
h("div",{className:"text-[13px] font-[800] tracking-widest mb-4 "+txtMain},"PHOTO TOOLS • "+shown.length+" PHOTOS"),
selMode&&h("div",{className:"mb-4 flex gap-3 items-center"},h("span",{className:"text-[11px] "+txtSub},selIds.length," SELECTED"),
h("button",{disabled:!selIds.length,onClick:bulkDelete,className:"h-[32px] px-4 rounded-full bg-[#1A1220] border border-[#3A1A2A] text-[10px] tracking-widest text-[#FF6B8A] disabled:opacity-30"},"🗑 BULK DELETE (2FA)"),
h("button",{onClick:function(){setSelI(shown.map(function(p){return p.id}))},className:"h-[32px] px-4 rounded-full border text-[10px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},"SELECT ALL")),
h("div",{className:"columns-1 md:columns-3 gap-4"},shown.map(function(p){
return h("div",{key:p.id,className:"break-inside-avoid rounded-[16px] overflow-hidden border mb-4 relative",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
selMode&&h("button",{onClick:function(){setSelI(selIds.includes(p.id)?selIds.filter(function(x){return x!==p.id}):selIds.concat([p.id]))},className:"absolute top-2 left-2 z-20 w-6 h-6 rounded-full border text-[10px] "+(selIds.includes(p.id)?"bg-[#8B5CF6] text-white border-[#8B5CF6]":"bg-black/60 text-white border-white/40")},selIds.includes(p.id)?"✓":""),
h("img",{src:p.src,className:"w-full cursor-pointer",onClick:function(){openView(p)}}),
canEdit&&h("div",{className:"p-2 flex flex-wrap gap-1"},h("button",{onClick:function(){setEP(p)},className:"h-[24px] px-2 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[8px] tracking-widest text-white"},"✎ EDIT"),
h("button",{onClick:function(){togglePinPhoto(p.id)},className:"h-[24px] px-2 rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[8px] tracking-widest text-white"},p.pinned?"UNPIN":"📌 PIN"),
h("button",{onClick:function(){reqPin("DELETE PHOTO",function(){trashPhoto(p.id)})},className:"h-[24px] px-2 rounded-full bg-[#1A1220] border border-[#3A1A2A] text-[8px] tracking-widest text-[#FF6B8A]"},"🗑")))})));
if(tab==="EVENTS")bodyEl=h("div",{className:"max-w-[900px]"},
h("div",{className:"text-[13px] font-[800] tracking-widest mb-4 "+txtMain},"BIRTHDAYS & EVENTS"),
h("div",{className:"space-y-2 mb-6"},mem.map(function(m){var d=Ao(m.birthday);return h("div",{key:m.id,className:"flex items-center justify-between p-3 rounded-[16px] border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#1A1A2E"}},
h("div",{className:"flex items-center gap-3"},h("div",{className:"w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-black text-white",style:{background:m.color}},m.initial),
h("div",{},h("div",{className:"text-[12px] font-bold tracking-widest "+txtMain},m.name," • ",Cu(m.birthday)),h("div",{className:"text-[10px] "+txtSub},d===0?"TODAY!":d===1?"TOMORROW":"IN "+d+" DAYS"))))}),
events.map(function(ev2){var d=Ao(ev2.date);return h("div",{key:ev2.id,className:"flex items-center justify-between p-3 rounded-[16px] border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#1A1A2E"}},
h("div",{className:"text-[12px] font-bold tracking-widest "+txtMain},ev2.name," ",h("span",{className:"text-[9px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD]",children:ev2.type}),h("div",{className:"text-[10px] "+txtSub},ev2.date," • ",d===null?"—":d===0?"TODAY":"IN "+d+" DAYS")),
isMgr_&&h("button",{onClick:function(){setEv(events.filter(function(x){return x.id!==ev2.id}))},className:"text-[#FF6B8A] text-[11px]"},"✕"))})),
isMgr_&&h("div",{className:"mt-4 rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[10px] tracking-widest mb-2 "+txtSub},"ADD EVENT / ANNIVERSARY / GRADUATION"),
h("div",{className:"flex flex-wrap gap-2"},
h("input",{value:newEvent.name,onChange:function(ev){setNE(Object.assign({},newEvent,{name:ev.target.value.toUpperCase()}))},placeholder:"NAME",className:"h-[34px] px-3 rounded-full text-[11px] flex-1",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}}),
h("input",{value:newEvent.date,onChange:function(ev){setNE(Object.assign({},newEvent,{date:ev.target.value}))},placeholder:"MM-DD",className:"h-[34px] px-3 rounded-full text-[11px] w-[110px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}}),
h("select",{value:newEvent.type,onChange:function(ev){setNE(Object.assign({},newEvent,{type:ev.target.value}))},className:"h-[34px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},h("option",{value:"EVENT"},"EVENT"),h("option",{value:"ANNIVERSARY"},"ANNIVERSARY"),h("option",{value:"GRADUATION"},"GRADUATION")),
h("button",{onClick:function(){if(!newEvent.name||!newEvent.date)return;setEv(events.concat([{id:uid("ev"),name:newEvent.name,date:newEvent.date,type:newEvent.type}]));setNE({name:"",date:"",type:"EVENT"})},className:"h-[34px] px-4 rounded-full bg-white text-black text-[10px] font-bold"},"ADD"))),
h("div",{className:"mt-4 text-[9px] tracking-widest "+txtSub},"📧 REMINDER EMAILS: in this local build reminders are logged on the ADMIN → ACTIVITY tab instead of being emailed — the browser cannot send mail without a backend."));
if(tab==="FUN")bodyEl=h("div",{className:"max-w-[900px] space-y-4"},
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[12px] font-[800] tracking-widest mb-3 "+txtMain},"📊 POLLS"),
polls.map(function(pl){var total=Object.values(pl.votes||{}).reduce(function(x,y){return x+y},0);
return h("div",{key:pl.id,className:"mb-3"},h("div",{className:"text-[12px] font-bold "+txtMain},pl.q),h("div",{className:"mt-2 space-y-1"},pl.opts.map(function(o2){var v2=(pl.votes||{})[o2]||0;var pct=total?Math.round(v2*100/total):0;
return h("button",{key:o2,onClick:function(){if(isGst)return;var nv=Object.assign({},pl.votes);nv[o2]=(nv[o2]||0)+1;setPoll(polls.map(function(x){return x.id===pl.id?Object.assign({},x,{votes:nv}):x}))},className:"w-full text-left h-[30px] px-3 rounded-full text-[11px] border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#F4F4FA":"#0E0E1E",color:themeCard?"#1A1A2E":"#fff"}},o2," — "+v2+" ("+pct+"%)")})),
isAdm&&h("button",{onClick:function(){setPoll(polls.filter(function(x){return x.id!==pl.id}))},className:"mt-1 text-[9px] text-[#FF6B8A]"},"DELETE POLL")})),
isAdm&&h("div",{className:"mt-2 flex gap-2"},h("input",{value:newPoll,onChange:function(ev){setNP(ev.target.value.toUpperCase())},placeholder:"NEW POLL QUESTION",className:"flex-1 h-[34px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},
h("button",{onClick:function(){if(!newPoll)return;setPoll(polls.concat([{id:uid("poll"),q:newPoll,opts:["YES","NO","MAYBE"],votes:{}}]));setNP("")},className:"h-[34px] px-4 rounded-full bg-white text-black text-[10px] font-bold"},"CREATE")))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[12px] font-[800] tracking-widest mb-3 "+txtMain},"📣 ANNOUNCEMENT"),
ann?h("div",{className:"text-[12px] "+txtMain},"CURRENT: ",ann.text," • ",ann.by):h("div",{className:"text-[11px] "+txtSub},"NONE"),
isMgr_&&h("div",{className:"mt-2 flex gap-2"},h("input",{value:ann&&ann.text||"",onChange:function(ev){setAnn({text:ev.target.value.toUpperCase(),by:me.name})},placeholder:"FAMILY MEETING SUNDAY!",className:"flex-1 h-[34px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},
h("button",{onClick:function(){setAnn({text:(ann&&ann.text||"FAMILY MEETING SUNDAY!").toUpperCase(),by:me.name})},className:"h-[34px] px-4 rounded-full bg-white text-black text-[10px] font-bold"},"POST TO ALL")))));
if(tab==="ADMIN")bodyEl=h("div",{className:"max-w-[1000px] space-y-4"},
h("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4"},
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold "+txtSub},"📊 ANALYTICS"),
h("div",{className:"mt-3 text-[11px] "+txtSub},"MOST VIEWED: ",h("span",{className:txtMain},mostViewed?mostViewed.caption+" ("+(mostViewed.views||0)+")":"—")),
h("div",{className:"text-[11px] "+txtSub},"MOST ACTIVE: ",h("span",{className:txtMain},Object.keys(uplByMem).sort(function(x,y){return uplByMem[y]-uplByMem[x]})[0]?((mem.find(function(m){return m.id===Object.keys(uplByMem).sort(function(x,y){return uplByMem[y]-uplByMem[x]})[0]})||{}).name+" • "+uplByMem[Object.keys(uplByMem).sort(function(x,y){return uplByMem[y]-uplByMem[x]})[0]]+" uploads"):"—")),
h("div",{className:"text-[11px] "+txtSub},"STORAGE: ",h("span",{className:txtMain},storageUsed," MB / 5000 MB")),h("div",{className:"mt-2 h-[6px] rounded-full bg-black/10 overflow-hidden"},h("div",{className:"h-full bg-[#8B5CF6]",style:{width:Math.min(100,(storageUsed/5000*100))+"%"}}))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold "+txtSub},"👥 LOGIN HISTORY"),
h("div",{className:"mt-2 space-y-1 max-h-[150px] overflow-y-auto"},logH.length===0&&h("div",{className:"text-[10px] "+txtSub},"NO LOGINS YET"),logH.slice(-10).reverse().map(function(l2){return h("div",{key:l2.id,className:"flex justify-between text-[9px] font-mono "+txtSub},h("span",{},(mem.find(function(m){return m.id===l2.who})||{}).name||l2.who," • ",l2.dev||"—"),h("span",{className:l2.result==="FAIL"?"text-[#FF6B8A]":l2.result==="OK"?"text-[#10B981]":"text-[#F59E0B]"},l2.result," ",new Date(l2.time).toLocaleTimeString()))})),
isAdm&&h("button",{onClick:function(){setLog([])},className:"mt-2 text-[9px] text-[#FF6B8A]"},"CLEAR LOG"))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#3A1A2A",background:themeCard?"#fff":"#1A1220"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold text-[#FF6B8A]"},"🛡 DEVICE BANS"),
h("div",{className:"mt-2 space-y-1"},bans.length===0&&h("div",{className:"text-[10px] "+txtSub},"NO BANS"),bans.map(function(b){return h("div",{key:b.dev,className:"flex justify-between items-center text-[10px] "+txtSub},h("span",{},b.dev," • ",b.note||""),h("div",{className:"flex gap-2"},h("button",{onClick:function(){setBan(bans.map(function(x){return x.dev===b.dev?Object.assign({},x,{active:!x.active}):x}))},className:"text-[9px] underline"},b.active?"UNBAN":"SUSPEND"),h("button",{onClick:function(){setBan(bans.filter(function(x){return x.dev!==b.dev}))},className:"text-[9px] text-[#FF6B8A]"},"✕")))})),
isAdm&&h("div",{className:"mt-2 flex gap-2"},h("input",{value:banNote,onChange:function(ev){setBN(ev.target.value)},placeholder:"BAN DEVICE ID / NOTE",className:"flex-1 h-[30px] px-3 rounded-full text-[10px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid #3A1A2A",color:"#fff"}},
h("button",{onClick:function(){reqPin("BAN A DEVICE",function(){if(banNote.trim()){setBan(bans.concat([{dev:banNote.trim(),active:true,note:"BY "+me.name,at:nowTs()}]));setBN("")}})},className:"h-[30px] px-3 rounded-full bg-[#FF6B8A] text-white text-[10px] font-bold"},"🚫 BAN")),
h("div",{className:"text-[9px] "+txtSub},"THIS DEVICE: ",h("span",{className:"font-mono"},devId())))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#8B5CF6",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold text-[#C4B5FD]"},"🔐 2FA ADMIN PIN"),
h("div",{className:"mt-2 text-[10px] "+txtSub},adminPin===null?"NO PIN SET — SET ONE TO ENABLE DELETIONS/BANS":"PIN IS SET • REQUIRED FOR DELETIONS, BANS, EXPORT"),
adminPin===null&&h("div",{className:"mt-2 flex gap-2"},h("input",{value:pinIn,onChange:function(ev){setPI(ev.target.value.replace(/\D/g,"").slice(0,6))},placeholder:"4-6 DIGIT PIN",className:"h-[32px] px-3 rounded-full text-[12px] tracking-widest",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid #8B5CF6",color:themeCard?"#1A1A2E":"#fff"}},
h("button",{onClick:function(){if(pinIn.length>=4){setAP(parseInt(pinIn,10));setPI("")}},className:"h-[32px] px-3 rounded-full bg-white text-black text-[10px] font-bold"},"SET PIN")),
adminPin!==null&&h("button",{onClick:function(){reqPin("CLEAR PIN",function(){setAP(null)})},className:"mt-2 text-[9px] text-[#FF6B8A]"},"CLEAR PIN")))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold "+txtSub},"🔗 INVITE LINKS"),
h("div",{className:"mt-2 flex flex-wrap gap-2"},
h("select",{value:newInviteRole,onChange:function(ev){setNIR(ev.target.value)},className:"h-[32px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},h("option",{value:"GUEST"},"GUEST"),h("option",{value:"MEMBER"},"MEMBER")),
h("select",{value:newInviteExp,onChange:function(ev){setNIE(parseInt(ev.target.value,10))},className:"h-[32px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},h("option",{value:1},"1 DAY"),h("option",{value:7},"7 DAYS"),h("option",{value:0},"NEVER")),
h("select",{value:newInviteAlb,onChange:function(ev){setNIA(ev.target.value)},className:"h-[32px] px-3 rounded-full text-[11px]",style:{background:themeCard?"#F4F4FA":"#0E0E1E",border:"1px solid "+(themeCard?"#D5D5E8":"#2A2A4A"),color:themeCard?"#1A1A2E":"#fff"}},h("option",{value:""},"ALL ALBUMS"),albs.map(function(al){return h("option",{key:al.name,value:al.name,children:al.name})})),
h("label",{className:"text-[10px] "+txtSub},h("input",{type:"checkbox",checked:newInviteOT,onChange:function(ev){setNIOT(ev.target.checked)}}," ONE-TIME")),
h("button",{onClick:function(){var tok=uid("INV").toUpperCase();
setInv(invites.concat([{token:tok,role:newInviteRole,expiry:newInviteExp===0?null:Date.now()+newInviteExp*864e5,createdAt:nowTs(),createdBy:me.id,usedCount:0,oneTime:newInviteOT,album:newInviteAlb||null,uses:[]}]));
setIM(tok)},className:"h-[32px] px-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-[10px] font-[800]"},"GENERATE")),
inviteMsg&&h("div",{className:"mt-2 text-[10px] font-mono text-[#C4B5FD]"},"LINK: https://famvault.local/?invite="+inviteMsg),
h("div",{className:"mt-3 space-y-1 max-h-[140px] overflow-y-auto"},invites.slice(-8).reverse().map(function(iv){var exp=iv.expiry===null?false:Date.now()>iv.expiry;
return h("div",{key:iv.token,className:"flex justify-between items-center text-[9px] font-mono px-3 py-1 rounded-full",style:{background:themeCard?"#F4F4FA":"#0E0E1E",color:themeCard?"#55557A":"#8B8BB0"}},
h("span",{},iv.token," • ",iv.role," • ",iv.usedCount," USES",iv.oneTime?" • 1X":""," • ",iv.album?"ALBUM:"+iv.album:"ALL")),
h("span",{className:exp?"text-[#FF6B8A]":"text-[#10B981]"},iv.expiry===null?"NEVER":exp?"EXPIRED":Math.ceil((iv.expiry-Date.now())/864e5)+"D LEFT"))}))),
h("div",{className:"rounded-[20px] p-4 border",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A",background:themeCard?"#fff":"#151525"}},
h("div",{className:"text-[11px] tracking-[0.3em] font-bold "+txtSub},"💾 BACKUP & SAFETY"),
h("div",{className:"mt-2 flex flex-wrap gap-2"},
h("button",{onClick:function(){reqPin("DAILY BACKUP SNAPSHOT",function(){fS("backup",photos.filter(function(p){return!p.deleted}));alert("SNAPSHOT SAVED TO LOCAL BACKUP SLOT")})},className:"h-[30px] px-3 rounded-full border text-[10px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},"💾 BACKUP NOW"),
h("button",{onClick:function(){reqPin("TOGGLE MAINTENANCE MODE",function(){setAnn({text:ann&&ann.text==="FAMILY REUNION, BACK SOON"?"":"FAMILY REUNION, BACK SOON",by:me.name,maint:!(ann&&ann.maint)})})},className:"h-[30px] px-3 rounded-full border text-[10px] tracking-widest",style:{borderColor:themeCard?"#D5D5E8":"#2A2A4A"}},"🚧 MAINTENANCE "+(ann&&ann.maint?"ON":"OFF")),
h("div",{className:"text-[9px] "+txtSub},"☁ R2 AUTO-BACKUP needs a real backend — use BACKUP NOW for a local snapshot."")));
return h("div",{},
bodyEl,
// new member modal
h("div",{className:"mt-8 pb-32"}),
newMem.name!==undefined&&h("div",{className:"hidden"}),
// upload modal
uploading&&h("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-black/80 backdrop-blur",onClick:function(){setUp(false)}}),
h("div",{className:"relative w-full max-w-[560px] bg-[#151525] border border-[#2A2A4A] rounded-[24px] p-6 text-white"},
h("div",{className:"text-[13px] font-[800] tracking-widest"},"UPLOAD • NEW MEMORY"),
h("div",{onClick:function(){fileRef.current&&fileRef.current.click()},className:"mt-4 rounded-[16px] border-2 border-dashed border-[#8B5CF6]/50 p-6 text-center cursor-pointer"},
h("input",{ref:fileRef,type:"file",accept:"image/*",className:"hidden",onChange:function(ev){var f2=ev.target.files&&ev.target.files[0];if(!f2)return;var rd=new FileReader();rd.onload=function(){setUpD({dataUrl:rd.result})};rd.readAsDataURL(f2)}}),
upDraft?h("img",{src:upDraft.dataUrl||upDraft,className:"max-h-[180px] rounded-[10px] mx-auto"}):h("div",{className:"text-[11px] tracking-widest text-[#8B8BB0]"},"DRAG / CLICK TO PICK PHOTO")),
h("input",{value:upCap,onChange:function(ev){setUpC(ev.target.value)},placeholder:"CAPTION // E.G. BEACH DAY 25",className:"mt-3 w-full h-[42px] rounded-[12px] bg-[#0E0E1E] border border-[#2A2A4A] px-4 text-[12px] text-white"}),
h("div",{className:"mt-3 flex flex-wrap gap-2"},albs.map(function(al){return h("button",{key:al.name,onClick:function(){setUpA(al.name)},className:"h-[30px] px-3 rounded-full text-[10px] border "+(upAlb===al.name?"bg-[#8B5CF6] border-[#8B5CF6] text-white":"bg-[#1A1A2E] border-[#2A2A4A] text-[#8B8BB0]")},al.name)})),
h("div",{className:"mt-5 flex gap-3"},h("button",{onClick:function(){setUp(false)},className:"flex-1 h-[42px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]"},"CANCEL"),
h("button",{onClick:addPhoto,disabled:!upDraft,className:"flex-1 h-[42px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-[11px] font-[800] disabled:opacity-40"},"UPLOAD TO VAULT →"))),
// new album modal
newAlb&&h("div",{className:"fixed inset-0 z-[70] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-black/80 backdrop-blur",onClick:function(){setNA(false)}}),
h("div",{className:"relative w-full max-w-[380px] bg-[#151525] border border-[#2A2A4A] rounded-[20px] p-6 text-white"},
h("div",{className:"text-[12px] font-[800] tracking-widest"},"CREATE NEW ALBUM"),
h("input",{value:newAlbName,onChange:function(ev){setNAN(ev.target.value.toUpperCase())},onKeyDown:function(ev){if(ev.key==="Enter")addAlbum()},placeholder:"ALBUM NAME",autoFocus:true,className:"mt-4 w-full h-[44px] rounded-[12px] bg-[#0E0E1E] border border-[#2A2A4A] px-4 text-[12px] text-white"}),
h("div",{className:"mt-4 flex gap-2"},h("button",{onClick:function(){setNA(false)},className:"flex-1 h-[40px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]"},"CANCEL"),
h("button",{onClick:addAlbum,className:"flex-1 h-[40px] rounded-full bg-white text-black text-[11px] font-[800]"},"CREATE →"))),
// edit member modal
editMem&&h("div",{className:"fixed inset-0 z-[70] flex items-center justify-center p-4"},
h("div",{className:"absolute inset-0 bg-black/80 backdrop-blur",onClick:function(){setEM(null)}}),
h("div",{className:"relative w-full max-w-[420px] bg-[#151525] border border-[#2A2A4A] rounded-[24px] p-6 text-white"},
h("div",{className:"text-[13px] font-[800] tracking-widest"},"EDIT ROLE • "+editMem.name),
h("div",{className:"mt-4 space-y-3"},
h("div",{},h("div",{className:"text-[9px] tracking-widest text-[#5A5A80] mb-1"},"ROLE"),h("select",{value:editMemF.role,onChange:function(ev){setEMF(Object.assign({},editMemF,{role:ev.target.value}))},className:"w-full h-[40px] rounded-[12px] bg-[#0E0E1E] border border-[#2A2A4A] px-3 text-[12px] text-white"},["ADMIN","COADMIN","MODERATOR","MEMBER","CHILD"].map(function(r2){return h("option",{key:r2,value:r2,children:r2})})),
h("div",{className:"text-[9px] "+txtSub},"ADMIN: full control • COADMIN: manage everything • MODERATOR: delete photos only • CHILD: view+download, no upload • MEMBER: upload+download"),
h("label",{className:"text-[11px] flex items-center gap-2"},h("input",{type:"checkbox",checked:!!editMemF.muted,onChange:function(ev){setEMF(Object.assign({},editMemF,{muted:ev.target.checked}))}}," MUTED (temporarily disable)"))),
h("div",{className:"mt-5 flex gap-3"},h("button",{onClick:function(){setEM(null)},className:"flex-1 h-[40px] rounded-full bg-[#1A1A2E] border border-[#2A2A4A] text-[11px] text-[#8B8BB0]"},"CANCEL"),
h("button",{onClick:function(){reqPin("CHANGE ROLE FOR "+editMem.name,function(){setM(mem.map(function(x){return x.id===editMem.id?Object.assign({},x,{role:editMemF.role,muted:editMemF.muted}):x}));setEM(null)})},className:"flex-1 h-[40px] rounded-full bg-white text-black text-[11px] font-[800]"},"SAVE (2FA)"))))));
}
createRoot(document.getElementById("root")).render(a(React.default?React.default.StrictMode:rp.default.StrictMode,{children:a(ProApp,{})}));
