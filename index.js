(() => {
'use strict';
const MODULE='cloud_glass_studio_universal', ROOT_ID='cloud-glass-studio-universal', STYLE_ID='cgs2-dynamic-region-style';
const BASE={
 enabled:true,blur:8,opacity:42,barOpacity:32,glassColor:'#e5edf2',
 font:'ChillHuoSong_F',customFont:'',uploadedFontId:'',uploadedFontName:'',
 lineHeight:1.75,paragraphSpacing:.65,
 textStyles:{
  body:{color:'#263744',size:1,weight:'400',italic:false,highlight:false,highlightColor:'#f2e4a8',highlightOpacity:45,radius:2},
  emphasis:{color:'#476c70',size:1,weight:'700',italic:false,highlight:false,highlightColor:'#f3dcae',highlightOpacity:55,radius:2},
  secondary:{color:'#65727b',size:.96,weight:'400',italic:true,highlight:false,highlightColor:'#d8e8ed',highlightOpacity:45,radius:2}
 },
 templates:[],templatesInitialized:false,
 regions:{chatCanvas:{enabled:true,selector:'#chat'},messages:{enabled:true,selector:'#chat .mes:not([is_system="true"])'},topbar:{enabled:true,selector:'#top-bar, #top-settings-holder'},composer:{enabled:true,selector:'#send_form'},popups:{enabled:false,selector:'.popup, .context-menu, .mes_buttons .dropdown-menu'},panels:{enabled:false,selector:'.drawer-content, #left-nav-panel, #right-nav-panel, #extensions_settings2 .inline-drawer-content, #extensions_settings .inline-drawer-content'}}
};
const STARTERS=[
{id:'starter-sky',name:'☁️ 晴空云雾',values:{blur:9,opacity:38,barOpacity:30,glassColor:'#e5edf2',font:'ChillHuoSong_F',customFont:'',uploadedFontId:'',uploadedFontName:'',lineHeight:1.75,paragraphSpacing:.65,textStyles:{body:{color:'#263744',size:1,weight:'400',italic:false,highlight:false,highlightColor:'#f2e4a8',highlightOpacity:45,radius:2},emphasis:{color:'#4c7180',size:1,weight:'700',italic:false,highlight:false,highlightColor:'#f2d99b',highlightOpacity:55,radius:2},secondary:{color:'#65727b',size:.96,weight:'400',italic:true,highlight:false,highlightColor:'#d8e8ed',highlightOpacity:45,radius:2}}}},
{id:'starter-forest',name:'🌿 森林手札',values:{blur:7,opacity:55,barOpacity:40,glassColor:'#c9ddce',font:'ChillHuoSong_F',customFont:'',uploadedFontId:'',uploadedFontName:'',lineHeight:1.8,paragraphSpacing:.7,textStyles:{body:{color:'#203b30',size:1,weight:'400',italic:false,highlight:false,highlightColor:'#dce9c8',highlightOpacity:40,radius:2},emphasis:{color:'#326348',size:1,weight:'700',italic:false,highlight:false,highlightColor:'#dce9c8',highlightOpacity:55,radius:2},secondary:{color:'#59685d',size:.96,weight:'400',italic:true,highlight:false,highlightColor:'#dce9c8',highlightOpacity:40,radius:2}}}},
{id:'starter-rose',name:'🌸 玫瑰旧笺',values:{blur:10,opacity:45,barOpacity:34,glassColor:'#ead5d8',font:'Noto Serif SC',customFont:'',uploadedFontId:'',uploadedFontName:'',lineHeight:1.85,paragraphSpacing:.8,textStyles:{body:{color:'#49353d',size:1,weight:'400',italic:false,highlight:false,highlightColor:'#f3dce2',highlightOpacity:45,radius:2},emphasis:{color:'#925c70',size:1,weight:'700',italic:false,highlight:false,highlightColor:'#f3dce2',highlightOpacity:55,radius:2},secondary:{color:'#79666e',size:.96,weight:'400',italic:true,highlight:false,highlightColor:'#f3dce2',highlightOpacity:45,radius:2}}}},
{id:'starter-midnight',name:'🌙 午夜星河',values:{blur:14,opacity:62,barOpacity:48,glassColor:'#252b3b',font:'serif',customFont:'',uploadedFontId:'',uploadedFontName:'',lineHeight:1.75,paragraphSpacing:.65,textStyles:{body:{color:'#edf0f7',size:1,weight:'400',italic:false,highlight:false,highlightColor:'#b9a5df',highlightOpacity:35,radius:2},emphasis:{color:'#b9a5df',size:1,weight:'700',italic:false,highlight:false,highlightColor:'#b9a5df',highlightOpacity:45,radius:2},secondary:{color:'#b5bdce',size:.96,weight:'400',italic:true,highlight:false,highlightColor:'#b9a5df',highlightOpacity:35,radius:2}}}}
];
const GLOBAL_KEYS=['blur','opacity','barOpacity','glassColor','font','customFont','uploadedFontId','uploadedFontName','lineHeight','paragraphSpacing'];
let settings,saveTimer,refreshTimer,observer,fontUrl=null,dbPromise=null;
const clone=v=>JSON.parse(JSON.stringify(v));
function mergeStyles(old){
 const out=clone(BASE.textStyles);
 if(old&&typeof old==='object')for(const k of ['body','emphasis','secondary'])if(old[k])out[k]={...out[k],...old[k]};
 return out;
}
function migrateValues(v){
 const n={...v};
 n.textStyles=mergeStyles(v.textStyles);
 if(!v.textStyles){
  if(v.bodyColor)n.textStyles.body.color=v.bodyColor;
  if(v.fontSize)n.textStyles.body.size=v.fontSize;
  if(v.fontWeight)n.textStyles.body.weight=v.fontWeight;
  if(v.italic!==undefined)n.textStyles.body.italic=v.italic;
  if(v.highlightEnabled!==undefined)n.textStyles.body.highlight=v.highlightEnabled;
  if(v.highlightColor)n.textStyles.body.highlightColor=v.highlightColor;
  if(v.highlightOpacity!==undefined)n.textStyles.body.highlightOpacity=v.highlightOpacity;
  if(v.secondaryColor)n.textStyles.secondary.color=v.secondaryColor;
  if(v.quoteColor)n.textStyles.emphasis.color=v.quoteColor;
 }
 return n;
}
function mergeDefaults(saved){
 const out=clone(BASE);
 if(saved&&typeof saved==='object'){
  for(const [k,v] of Object.entries(saved)){
   if(k==='regions'&&v){for(const [r,c] of Object.entries(v))if(out.regions[r]&&c)out.regions[r]={...out.regions[r],...c};}
   else if(k==='templates'&&Array.isArray(v))out.templates=v.map(t=>({...t,values:migrateValues(t.values||{})}));
   else if(k==='textStyles')out.textStyles=mergeStyles(v);
   else if(k in out)out[k]=v;
  }
  if(!saved.textStyles){
   const legacy=migrateValues(saved);
   out.textStyles=legacy.textStyles;
  }
 }
 if(!out.templatesInitialized){out.templates=out.templates.length?out.templates:clone(STARTERS);out.templatesInitialized=true;}
 out.regions.popups.enabled=false;out.regions.panels.enabled=false;
 return out;
}
function getSettings(){const c=SillyTavern.getContext();c.extensionSettings[MODULE]=mergeDefaults(c.extensionSettings[MODULE]);return c.extensionSettings[MODULE];}
function rgb(hex){let v=String(hex||'').replace('#','');if(!/^[\da-f]{6}$/i.test(v))v='e5edf2';return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));}
function rgba(hex,a){return `rgba(${rgb(hex).join(',')},${Math.max(0,Math.min(1,a))})`;}
function ensureStyle(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}return s;}
function markTargets(){
 document.querySelectorAll('[data-cgs2-region]').forEach(e=>e.removeAttribute('data-cgs2-region'));
 if(!settings.enabled)return;
 for(const [region,c] of Object.entries(settings.regions)){if(!c.enabled||!String(c.selector||'').trim())continue;try{document.querySelectorAll(c.selector).forEach(e=>e.setAttribute('data-cgs2-region',region));}catch(e){console.warn('[云雾玻璃] 无效选择器',region,e);}}
}
function unwrapBodyHighlights(){
 document.querySelectorAll('.mes_text .cgs2-body-inline').forEach(span=>{span.replaceWith(document.createTextNode(span.textContent||''));});
}
function wrapBodyHighlights(){
 if(!settings.enabled||!settings.textStyles.body.highlight){unwrapBodyHighlights();return;}
 const root=document.querySelector('#chat');if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
  if(!node.nodeValue||!node.nodeValue.trim()||node.parentElement?.closest('.cgs2-body-inline,strong,b,em,i,small,blockquote,code,pre,a,mark,script,style'))return NodeFilter.FILTER_REJECT;
  if(!node.parentElement?.closest('.mes_text'))return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
 }});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const span=document.createElement('span');span.className='cgs2-body-inline';node.parentNode?.replaceChild(span,node);span.appendChild(node);});
}
function setVar(el,k,v){el.style.setProperty(k,v);}
function applySettings(){
 const root=document.documentElement;
 if(!settings.enabled){
  root.classList.remove('cgs2-on');
  document.querySelectorAll('[data-cgs2-region]').forEach(e=>e.removeAttribute('data-cgs2-region'));
  unwrapBodyHighlights();
 }else{
  root.classList.add('cgs2-on');
  setVar(root,'--cgs2-blur',`${+settings.blur||0}px`);
  setVar(root,'--cgs2-fill',rgba(settings.glassColor,(+settings.opacity||0)/100));
  setVar(root,'--cgs2-bar-fill',rgba(settings.glassColor,(+settings.barOpacity||0)/100));
  const font=settings.font==='uploaded'?'CGSUploadedFont':(settings.font==='custom'?(settings.customFont.trim()||'serif'):settings.font);
  setVar(root,'--cgs2-font',`"${String(font).replace(/["\\]/g,'')}", "Noto Serif SC", serif`);
  setVar(root,'--cgs2-line-height',settings.lineHeight);
  setVar(root,'--cgs2-paragraph-spacing',`${settings.paragraphSpacing}em`);
  for(const kind of ['body','emphasis','secondary']){
   const st=settings.textStyles[kind],prefix=`--cgs2-${kind}-`;
   setVar(root,prefix+'color',st.color);setVar(root,prefix+'size',`${st.size}rem`);setVar(root,prefix+'weight',st.weight);setVar(root,prefix+'italic',st.italic?'italic':'normal');
   setVar(root,prefix+'highlight',st.highlight?rgba(st.highlightColor,st.highlightOpacity/100):'transparent');setVar(root,prefix+'highlight-radius',`${st.radius}px`);
   setVar(root,prefix+'highlight-on',st.highlight?'1':'0');
  }
  markTargets();wrapBodyHighlights();loadUploadedFont();
 }
 syncControls();
}
function fmt(k,v){if(k==='blur')return `${v} px`;if(['opacity','barOpacity'].includes(k)||k.endsWith('highlightOpacity'))return `${v}%`;if(k.endsWith('.radius'))return `${v}px`;if(k.endsWith('.size'))return `${Number(v).toFixed(2)} rem`;if(k==='lineHeight')return Number(v).toFixed(2);if(k==='paragraphSpacing')return `${Number(v).toFixed(2)} em`;return v;}
function syncControls(){
 const p=document.getElementById(ROOT_ID);if(!p)return;
 p.querySelectorAll('[data-cgs2-key]').forEach(el=>{const v=settings[el.dataset.cgs2Key];if(v!==undefined){if(document.activeElement!==el)el.value=v;}});
 p.querySelectorAll('[data-style-kind][data-style-key]').forEach(el=>{const v=settings.textStyles[el.dataset.styleKind][el.dataset.styleKey];if(el.type==='checkbox')el.checked=!!v;else if(document.activeElement!==el)el.value=v;const o=p.querySelector(`[data-style-output="${el.dataset.styleKind}.${el.dataset.styleKey}"]`);if(o)o.textContent=fmt(`${el.dataset.styleKind}.${el.dataset.styleKey}`,v);});
 const toggle=p.querySelector('[data-cgs2-enabled]');if(toggle)toggle.checked=!!settings.enabled;
 const body=p.querySelector('[data-cgs2-body]');if(body)body.classList.toggle('cgs2-disabled',!settings.enabled);
 const fontName=p.querySelector('[data-font-name]');if(fontName)fontName.textContent=settings.uploadedFontName||'未上传字体';
 renderTemplates();
}
function saveSoon(){const status=document.querySelector(`#${ROOT_ID} [data-cgs2-status]`);if(status)status.textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{SillyTavern.getContext().saveSettingsDebounced();if(status)status.textContent='已自动保存';},300);}
function updateControl(el){
 if(el.dataset.cgs2Key){const k=el.dataset.cgs2Key;settings[k]=el.type==='checkbox'?el.checked:(el.type==='range'?Number(el.value):el.value);}
 else if(el.dataset.styleKind){const kind=el.dataset.styleKind,key=el.dataset.styleKey;settings.textStyles[kind][key]=el.type==='checkbox'?el.checked:(el.type==='range'?Number(el.value):el.value);}
 applySettings();saveSoon();
}
function snapshot(){const values={};GLOBAL_KEYS.forEach(k=>values[k]=settings[k]);values.textStyles=clone(settings.textStyles);return values;}
function applyTemplate(id){const t=settings.templates.find(x=>x.id===id);if(!t||!t.values)return;const v=migrateValues(t.values);Object.assign(settings,v);settings.textStyles=mergeStyles(v.textStyles);applySettings();saveSoon();}
function renderTemplates(){const list=document.querySelector(`#${ROOT_ID} [data-cgs2-template-list]`);if(!list)return;list.replaceChildren();settings.templates.forEach(t=>{const row=document.createElement('div');row.className='cgs2-template-row';const name=document.createElement('span');name.textContent=t.name;const use=document.createElement('button');use.type='button';use.textContent='应用';use.dataset.applyTemplate=t.id;const ren=document.createElement('button');ren.type='button';ren.textContent='改名';ren.dataset.renameTemplate=t.id;const del=document.createElement('button');del.type='button';del.textContent='删除';del.dataset.deleteTemplate=t.id;row.append(name,use,ren,del);list.append(row);});}
function saveTemplate(){const name=prompt('给这套模板起个名字：');if(!name||!name.trim())return;settings.templates.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:name.trim(),values:snapshot()});renderTemplates();saveSoon();}

function openFontDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('cloud-glass-studio-fonts',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('fonts'))db.createObjectStore('fonts',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 return dbPromise;
}
async function storeFont(file){
 const ext=(file.name.split('.').pop()||'').toLowerCase();if(!['woff2','woff','ttf','otf'].includes(ext))throw new Error('仅支持 WOFF2、WOFF、TTF、OTF 字体文件');
 const id=`font-${Date.now()}`,buffer=await file.arrayBuffer(),db=await openFontDB();
 await new Promise((resolve,reject)=>{const tx=db.transaction('fonts','readwrite');tx.objectStore('fonts').put({id,name:file.name,buffer,format:ext});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
 settings.uploadedFontId=id;settings.uploadedFontName=file.name;settings.font='uploaded';await loadUploadedFont();applySettings();saveSoon();
}
async function loadUploadedFont(){
 if(!settings.uploadedFontId)return;
 try{const db=await openFontDB();const record=await new Promise((resolve,reject)=>{const req=db.transaction('fonts','readonly').objectStore('fonts').get(settings.uploadedFontId);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  if(!record)return;if(fontUrl)URL.revokeObjectURL(fontUrl);fontUrl=URL.createObjectURL(new Blob([record.buffer],{type:record.format==='woff2'?'font/woff2':record.format==='woff'?'font/woff':record.format==='ttf'?'font/ttf':'font/otf'}));
  const style=ensureStyle();style.textContent=`@font-face{font-family:"CGSUploadedFont";src:url("${fontUrl}") format("${record.format}");font-display:swap}`;
 }catch(e){console.warn('[云雾玻璃] 字体加载失败',e);}
}
function mountPanel(){
 const target=document.querySelector('#extensions_settings2')||document.querySelector('#extensions_settings');if(!target||document.getElementById(ROOT_ID))return;
 SillyTavern.getContext().renderExtensionTemplateAsync('third-party/cloud-glass-studio','settings').then(html=>{
  if(document.getElementById(ROOT_ID))return;target.insertAdjacentHTML('beforeend',html);const p=document.getElementById(ROOT_ID);if(!p)return;
  p.addEventListener('input',e=>{if(e.target.matches('[data-cgs2-key],[data-style-kind]'))updateControl(e.target);});
  p.addEventListener('change',e=>{if(e.target.matches('[data-cgs2-key],[data-style-kind]'))updateControl(e.target);});
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.applyTemplate)applyTemplate(b.dataset.applyTemplate);
   if(b.dataset.renameTemplate){const t=settings.templates.find(x=>x.id===b.dataset.renameTemplate);if(t){const n=prompt('修改模板名称：',t.name);if(n&&n.trim()){t.name=n.trim();renderTemplates();saveSoon();}}}
   if(b.dataset.deleteTemplate){const t=settings.templates.find(x=>x.id===b.dataset.deleteTemplate);if(t&&confirm(`删除模板“${t.name}”？`)){settings.templates=settings.templates.filter(x=>x.id!==t.id);renderTemplates();saveSoon();}}
   if(b.matches('[data-save-template]'))saveTemplate();
   if(b.matches('[data-font-remove]')){settings.uploadedFontId='';settings.uploadedFontName='';if(settings.font==='uploaded')settings.font='ChillHuoSong_F';applySettings();saveSoon();}
  });
  p.querySelector('[data-font-upload]')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{await storeFont(f);const msg=p.querySelector('[data-font-status]');if(msg)msg.textContent=`已载入：${f.name}`;}catch(err){alert(err.message);}});
  p.querySelector('[data-cgs2-enabled]')?.addEventListener('change',e=>{settings.enabled=e.target.checked;applySettings();saveSoon();});
  syncControls();
 }).catch(e=>console.error('[云雾玻璃] 面板加载失败',e));
}
function watchDom(){if(observer||!document.documentElement)return;observer=new MutationObserver(()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(settings?.enabled){markTargets();wrapBodyHighlights();}},220);});observer.observe(document.documentElement,{childList:true,subtree:true});}
function cleanupLegacyGlobalStyles(){
 const root=document.documentElement;
 root.classList.remove('cgs2-typography-on','cgs2-highlight-on');
 ['--SmartThemeBodyColor','--SmartThemeEmColor','--SmartThemeQuoteColor','--wx-text-primary','--wx-text-content','--wx-text-secondary','--wx-text-tertiary','--wx-text-quote','--wx-font-content','--wx-content-font-size'].forEach(k=>root.style.removeProperty(k));
}
function init(){try{cleanupLegacyGlobalStyles();settings=getSettings();applySettings();mountPanel();watchDom();console.info('[云雾玻璃控制台] 2.3.0 已加载');}catch(e){console.error('[云雾玻璃] 初始化失败',e);}}
if(window.jQuery)window.jQuery(init);else document.addEventListener('DOMContentLoaded',init,{once:true});
})();