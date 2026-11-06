(() => {
'use strict';
const MODULE='cloud_glass_studio_universal', ROOT_ID='cloud-glass-studio-universal', STYLE_ID='cgs2-dynamic-region-style';
const DEFAULTS={
 enabled:true, blur:8, opacity:42, barOpacity:32, glassColor:'#e5edf2',
 font:'ChillHuoSong_F', customFont:'', fontSize:1, fontWeight:'400', italic:false,
 lineHeight:1.75, paragraphSpacing:0.65, highlightEnabled:false, highlightColor:'#f2e4a8', highlightOpacity:45,
 bodyColor:'#263744', secondaryColor:'#626d75', quoteColor:'#476c70',
 templates:[], templatesInitialized:false,
 regions:{
  chatCanvas:{enabled:true,selector:'#chat'},
  messages:{enabled:true,selector:'#chat .mes:not([is_system="true"])'},
  topbar:{enabled:true,selector:'#top-bar, #top-settings-holder'},
  composer:{enabled:true,selector:'#send_form'},
  popups:{enabled:false,selector:'.popup, .context-menu, .mes_buttons .dropdown-menu'},
  panels:{enabled:false,selector:'.drawer-content, #left-nav-panel, #right-nav-panel, #extensions_settings2 .inline-drawer-content, #extensions_settings .inline-drawer-content'}
 }
};
const KEYS=['blur','opacity','barOpacity','glassColor','font','customFont','fontSize','fontWeight','italic','lineHeight','paragraphSpacing','highlightEnabled','highlightColor','highlightOpacity','bodyColor','secondaryColor','quoteColor'];
const STARTERS=[
{id:'starter-sky',name:'☁️ 晴空云雾',values:{blur:9,opacity:38,barOpacity:30,glassColor:'#e5edf2',font:'ChillHuoSong_F',customFont:'',fontSize:1,fontWeight:'400',italic:false,lineHeight:1.75,paragraphSpacing:.65,highlightEnabled:false,highlightColor:'#f2e4a8',highlightOpacity:45,bodyColor:'#263744',secondaryColor:'#65727b',quoteColor:'#4c7180'}},
{id:'starter-forest',name:'🌿 森林手札',values:{blur:7,opacity:55,barOpacity:40,glassColor:'#c9ddce',font:'ChillHuoSong_F',customFont:'',fontSize:1,fontWeight:'400',italic:false,lineHeight:1.8,paragraphSpacing:.7,highlightEnabled:false,highlightColor:'#dce9c8',highlightOpacity:40,bodyColor:'#203b30',secondaryColor:'#59685d',quoteColor:'#326348'}},
{id:'starter-rose',name:'🌸 玫瑰旧笺',values:{blur:10,opacity:45,barOpacity:34,glassColor:'#ead5d8',font:'Noto Serif SC',customFont:'',fontSize:1,fontWeight:'400',italic:false,lineHeight:1.85,paragraphSpacing:.8,highlightEnabled:false,highlightColor:'#f3dce2',highlightOpacity:45,bodyColor:'#49353d',secondaryColor:'#79666e',quoteColor:'#925c70'}},
{id:'starter-midnight',name:'🌙 午夜星河',values:{blur:14,opacity:62,barOpacity:48,glassColor:'#252b3b',font:'serif',customFont:'',fontSize:1,fontWeight:'400',italic:false,lineHeight:1.75,paragraphSpacing:.65,highlightEnabled:false,highlightColor:'#b9a5df',highlightOpacity:35,bodyColor:'#edf0f7',secondaryColor:'#b5bdce',quoteColor:'#b9a5df'}}
];
let settings,saveTimer,refreshTimer,observer;
const clone=v=>JSON.parse(JSON.stringify(v));
function mergeDefaults(saved){
 const merged=clone(DEFAULTS);
 if(saved&&typeof saved==='object'){
  for(const [k,v] of Object.entries(saved)){
   if(k==='regions'&&v){for(const [r,c] of Object.entries(v))if(merged.regions[r]&&c)merged.regions[r]={...merged.regions[r],...c};}
   else if(k==='templates'&&Array.isArray(v))merged.templates=v;
   else if(k in merged)merged[k]=v;
  }
 }
 if(!merged.templatesInitialized){merged.templates=clone(STARTERS);merged.templatesInitialized=true;}
 merged.regions.popups.enabled=false;merged.regions.panels.enabled=false;
 return merged;
}
function getSettings(){const c=SillyTavern.getContext();c.extensionSettings[MODULE]=mergeDefaults(c.extensionSettings[MODULE]);return c.extensionSettings[MODULE];}
function rgb(hex){let v=String(hex||'').replace('#','');if(!/^[\da-f]{6}$/i.test(v))v='e5edf2';return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));}
function rgba(hex,a){return `rgba(${rgb(hex).join(',')},${Math.max(0,Math.min(1,a))})`;}
function ensureStyle(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s);}return s;}
function refreshTargets(){
 document.querySelectorAll('[data-cgs2-region]').forEach(e=>e.removeAttribute('data-cgs2-region'));
 if(!settings.enabled)return;
 for(const [region,c] of Object.entries(settings.regions)){if(!c.enabled||!String(c.selector||'').trim())continue;try{document.querySelectorAll(c.selector).forEach(e=>e.setAttribute('data-cgs2-region',region));}catch(e){console.warn('[云雾玻璃] 无效选择器',region,e);}}
}
function applySettings(){
 const root=document.documentElement;
 if(!settings.enabled){
  ['--cgs2-blur','--cgs2-fill','--cgs2-bar-fill','--cgs2-font','--cgs2-font-size','--cgs2-body-color','--cgs2-secondary-color','--cgs2-quote-color','--cgs2-font-weight','--cgs2-italic','--cgs2-line-height','--cgs2-paragraph-spacing','--cgs2-highlight','--SmartThemeBodyColor','--SmartThemeEmColor','--SmartThemeQuoteColor','--wx-text-primary','--wx-text-content','--wx-text-secondary','--wx-text-tertiary','--wx-text-quote','--wx-font-content','--wx-content-font-size'].forEach(k=>root.style.removeProperty(k));
  root.classList.remove('cgs2-typography-on','cgs2-highlight-on');
  document.querySelectorAll('[data-cgs2-region]').forEach(e=>e.removeAttribute('data-cgs2-region'));
 }else{
  const font=settings.font==='custom'?(settings.customFont.trim()||'serif'):settings.font;
  root.style.setProperty('--cgs2-blur',`${+settings.blur||0}px`);
  root.style.setProperty('--cgs2-fill',rgba(settings.glassColor,(+settings.opacity||0)/100));
  root.style.setProperty('--cgs2-bar-fill',rgba(settings.glassColor,(+settings.barOpacity||0)/100));
  root.style.setProperty('--cgs2-font',`"${String(font).replace(/["\\]/g,'')}", "Noto Serif SC", serif`);
  root.style.setProperty('--cgs2-font-size',`${+settings.fontSize||1}rem`);
  root.style.setProperty('--cgs2-body-color',settings.bodyColor);
  root.style.setProperty('--cgs2-secondary-color',settings.secondaryColor);
  root.style.setProperty('--cgs2-quote-color',settings.quoteColor);
  root.style.setProperty('--cgs2-font-weight',settings.fontWeight);
  root.style.setProperty('--cgs2-italic',settings.italic?'italic':'normal');
  root.style.setProperty('--cgs2-line-height',settings.lineHeight);
  root.style.setProperty('--cgs2-paragraph-spacing',`${settings.paragraphSpacing}em`);
  root.style.setProperty('--cgs2-highlight',rgba(settings.highlightColor,settings.highlightOpacity/100));
  root.style.setProperty('--SmartThemeBodyColor',settings.bodyColor);
  root.style.setProperty('--SmartThemeEmColor',settings.secondaryColor);
  root.style.setProperty('--SmartThemeQuoteColor',settings.quoteColor);
  root.style.setProperty('--wx-text-primary',settings.bodyColor);
  root.style.setProperty('--wx-text-content',settings.bodyColor);
  root.style.setProperty('--wx-text-secondary',settings.secondaryColor);
  root.style.setProperty('--wx-text-tertiary',settings.secondaryColor);
  root.style.setProperty('--wx-text-quote',settings.quoteColor);
  root.style.setProperty('--wx-font-content','var(--cgs2-font)');
  root.style.setProperty('--wx-content-font-size','var(--cgs2-font-size)');
  root.classList.toggle('cgs2-typography-on',true);
  root.classList.toggle('cgs2-highlight-on',!!settings.highlightEnabled);
  refreshTargets();
 }
 syncControls();
}
function syncControls(){
 const p=document.getElementById(ROOT_ID);if(!p)return;
 p.querySelectorAll('[data-cgs2-key]').forEach(el=>{const v=settings[el.dataset.cgs2Key];if(v===undefined||document.activeElement===el)return;if(el.type==='checkbox')el.checked=!!v;else el.value=v;const o=p.querySelector(`[data-cgs2-output="${el.dataset.cgs2Key}"]`);if(o)o.textContent=fmt(el.dataset.cgs2Key,v);});
 const toggle=p.querySelector('[data-cgs2-enabled]');if(toggle)toggle.checked=!!settings.enabled;
 const body=p.querySelector('[data-cgs2-body]');if(body)body.classList.toggle('cgs2-disabled',!settings.enabled);
 renderTemplates();
}
function fmt(k,v){if(k==='blur')return `${v} px`;if(['opacity','barOpacity','highlightOpacity'].includes(k))return `${v}%`;if(k==='fontSize')return `${Number(v).toFixed(2)} rem`;if(k==='lineHeight')return Number(v).toFixed(2);if(k==='paragraphSpacing')return `${Number(v).toFixed(2)} em`;return v;}
function saveSoon(){const status=document.querySelector(`#${ROOT_ID} [data-cgs2-status]`);if(status)status.textContent='正在保存…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{SillyTavern.getContext().saveSettingsDebounced();if(status)status.textContent='已自动保存';},300);}
function updateControl(el){const k=el.dataset.cgs2Key;if(!KEYS.includes(k))return;settings[k]=el.type==='checkbox'?el.checked:(el.type==='range'?Number(el.value):el.value);applySettings();saveSoon();}
function snapshot(){return Object.fromEntries(KEYS.map(k=>[k,settings[k]]));}
function applyTemplate(id){const t=settings.templates.find(x=>x.id===id);if(!t||!t.values)return;Object.assign(settings,t.values);applySettings();saveSoon();}
function renderTemplates(){
 const list=document.querySelector(`#${ROOT_ID} [data-cgs2-template-list]`);if(!list)return;list.replaceChildren();
 settings.templates.forEach(t=>{const row=document.createElement('div');row.className='cgs2-template-row';const name=document.createElement('span');name.textContent=t.name;const use=document.createElement('button');use.type='button';use.textContent='应用';use.dataset.applyTemplate=t.id;const rename=document.createElement('button');rename.type='button';rename.textContent='改名';rename.dataset.renameTemplate=t.id;const del=document.createElement('button');del.type='button';del.textContent='删除';del.dataset.deleteTemplate=t.id;row.append(name,use,rename,del);list.append(row);});
}
function saveTemplate(){const name=window.prompt('给这套模板起个名字：');if(!name||!name.trim())return;settings.templates.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:name.trim(),values:snapshot()});renderTemplates();saveSoon();}
function mountPanel(){
 const target=document.querySelector('#extensions_settings2')||document.querySelector('#extensions_settings');if(!target||document.getElementById(ROOT_ID))return;
 SillyTavern.getContext().renderExtensionTemplateAsync('third-party/cloud-glass-studio-universal','settings').then(html=>{
  if(document.getElementById(ROOT_ID))return;target.insertAdjacentHTML('beforeend',html);const p=document.getElementById(ROOT_ID);if(!p)return;
  p.addEventListener('input',e=>{if(e.target.matches('[data-cgs2-key]'))updateControl(e.target);});
  p.addEventListener('change',e=>{if(e.target.matches('[data-cgs2-key]'))updateControl(e.target);});
  p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.applyTemplate)applyTemplate(b.dataset.applyTemplate);
   if(b.dataset.renameTemplate){const t=settings.templates.find(x=>x.id===b.dataset.renameTemplate);if(t){const n=prompt('修改模板名称：',t.name);if(n&&n.trim()){t.name=n.trim();renderTemplates();saveSoon();}}}
   if(b.dataset.deleteTemplate){const t=settings.templates.find(x=>x.id===b.dataset.deleteTemplate);if(t&&confirm(`删除模板“${t.name}”？`)){settings.templates=settings.templates.filter(x=>x.id!==t.id);renderTemplates();saveSoon();}}
   if(b.matches('[data-save-template]'))saveTemplate();
  });
  const toggle=p.querySelector('[data-cgs2-enabled]');if(toggle)toggle.addEventListener('change',()=>{settings.enabled=toggle.checked;applySettings();saveSoon();});
  syncControls();
 }).catch(e=>console.error('[云雾玻璃] 面板加载失败',e));
}
function watchDom(){if(observer||!document.documentElement)return;observer=new MutationObserver(()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshTargets,180);});observer.observe(document.documentElement,{childList:true,subtree:true});}
function init(){try{settings=getSettings();applySettings();mountPanel();watchDom();console.info('[云雾玻璃控制台] 2.2.0 已加载');}catch(e){console.error('[云雾玻璃] 初始化失败',e);}}
if(window.jQuery)window.jQuery(init);else document.addEventListener('DOMContentLoaded',init,{once:true});
})();