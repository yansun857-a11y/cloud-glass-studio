(() => {
'use strict';

const MODULE = 'cloud_glass_studio_universal';
const ROOT_ID = 'cloud-glass-studio-universal';
const STYLE_ID = 'cgs2-dynamic-region-style';

const DEFAULTS = {
    blur: 8,
    opacity: 42,
    barOpacity: 32,
    glassColor: '#e5edf2',
    font: 'ChillHuoSong_F',
    fontSize: 1,
    bodyColor: '#263744',
    secondaryColor: '#626d75',
    quoteColor: '#476c70',
    templates: [],
    templatesInitialized: false,
    regions: {
        chatCanvas: { enabled: true, selector: '#chat' },
        messages: { enabled: true, selector: '#chat .mes:not([is_system="true"])' },
        topbar: { enabled: true, selector: '#top-bar, #top-settings-holder' },
        composer: { enabled: true, selector: '#send_form' },
        popups: { enabled: false, selector: '.popup, .context-menu, .mes_buttons .dropdown-menu' },
        panels: { enabled: false, selector: '.drawer-content, #left-nav-panel, #right-nav-panel, #extensions_settings2 .inline-drawer-content, #extensions_settings .inline-drawer-content' }
    }
};

const STARTER_TEMPLATES = [
    { id: 'starter-sky', name: '☁️ 晴空云雾', values: { blur: 9, opacity: 38, barOpacity: 30, glassColor: '#e5edf2', font: 'ChillHuoSong_F', fontSize: 1, bodyColor: '#263744', secondaryColor: '#65727b', quoteColor: '#4c7180' } },
    { id: 'starter-forest', name: '🌿 森林手札', values: { blur: 7, opacity: 55, barOpacity: 40, glassColor: '#c9ddce', font: 'ChillHuoSong_F', fontSize: 1, bodyColor: '#203b30', secondaryColor: '#59685d', quoteColor: '#326348' } },
    { id: 'starter-rose', name: '🌸 玫瑰旧笺', values: { blur: 10, opacity: 45, barOpacity: 34, glassColor: '#ead5d8', font: 'ChillHuoSong_F', fontSize: 1, bodyColor: '#49353d', secondaryColor: '#79666e', quoteColor: '#925c70' } },
    { id: 'starter-midnight', name: '🌙 午夜星河', values: { blur: 14, opacity: 62, barOpacity: 48, glassColor: '#252b3b', font: 'ChillHuoSong_F', fontSize: 1, bodyColor: '#edf0f7', secondaryColor: '#b5bdce', quoteColor: '#b9a5df' } }
];

const KEYS = ['blur', 'opacity', 'barOpacity', 'glassColor', 'font', 'fontSize', 'bodyColor', 'secondaryColor', 'quoteColor'];
let settings;
let saveTimer;
let refreshTimer;
let observer;

const clone = value => JSON.parse(JSON.stringify(value));

function mergeDefaults(saved) {
    const merged = clone(DEFAULTS);
    if (saved && typeof saved === 'object') {
        for (const [key, value] of Object.entries(saved)) {
            if (key === 'regions' && value && typeof value === 'object') {
                for (const [region, config] of Object.entries(value)) {
                    if (merged.regions[region] && config && typeof config === 'object') {
                        merged.regions[region] = { ...merged.regions[region], ...config };
                    }
                }
            } else if (key in merged && key !== 'templates' && key !== 'templatesInitialized') {
                merged[key] = value;
            }
        }
        if (Array.isArray(saved.templates)) merged.templates = saved.templates;
        if (saved.templatesInitialized === true) merged.templatesInitialized = true;
    }
    // Seed starter templates only once; deleting all templates must remain possible.
    if (!merged.templatesInitialized) {
        merged.templates = clone(STARTER_TEMPLATES);
        merged.templatesInitialized = true;
    }
    // Avoid applying backdrop-filter to popup and drawer wrappers on mobile.
    merged.regions.popups.enabled = false;
    merged.regions.panels.enabled = false;
    return merged;
}

function getSettings() {
    const context = SillyTavern.getContext();
    context.extensionSettings[MODULE] = mergeDefaults(context.extensionSettings[MODULE]);
    return context.extensionSettings[MODULE];
}

function hexToRgb(hex) {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return { r: 229, g: 237, b: 242 };
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16)
    };
}

function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function ensureDynamicStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }
    return style;
}

function applySettings() {
    const root = document.documentElement;
    root.style.setProperty('--cgs2-blur', `${Number(settings.blur)}px`);
    root.style.setProperty('--cgs2-fill', rgba(settings.glassColor, Number(settings.opacity) / 100));
    root.style.setProperty('--cgs2-bar-fill', rgba(settings.glassColor, Number(settings.barOpacity) / 100));
    root.style.setProperty('--cgs2-font', `"${String(settings.font).replace(/["\\]/g, '')}", "Noto Serif SC", serif`);
    root.style.setProperty('--cgs2-font-size', `${Number(settings.fontSize)}rem`);
    root.style.setProperty('--cgs2-body-color', settings.bodyColor);
    root.style.setProperty('--cgs2-secondary-color', settings.secondaryColor);
    root.style.setProperty('--cgs2-quote-color', settings.quoteColor);
    root.style.setProperty('--SmartThemeBodyColor', settings.bodyColor);
    root.style.setProperty('--SmartThemeEmColor', settings.secondaryColor);
    root.style.setProperty('--SmartThemeQuoteColor', settings.quoteColor);
    root.style.setProperty('--wx-text-primary', settings.bodyColor);
    root.style.setProperty('--wx-text-content', settings.bodyColor);
    root.style.setProperty('--wx-text-secondary', settings.secondaryColor);
    root.style.setProperty('--wx-text-tertiary', settings.secondaryColor);
    root.style.setProperty('--wx-text-quote', settings.quoteColor);
    root.style.setProperty('--wx-font-content', 'var(--cgs2-font)');
    root.style.setProperty('--wx-content-font-size', 'var(--cgs2-font-size)');
    refreshTargets();
    syncControls();
}

function refreshTargets() {
    document.querySelectorAll('[data-cgs2-region]').forEach(element => element.removeAttribute('data-cgs2-region'));
    for (const [region, config] of Object.entries(settings.regions)) {
        if (!config.enabled || !String(config.selector || '').trim()) continue;
        try {
            document.querySelectorAll(config.selector).forEach(element => element.setAttribute('data-cgs2-region', region));
        } catch (error) {
            console.warn(`[云雾玻璃控制台] ${region} 选择器无效：`, error);
        }
    }
    ensureDynamicStyle().textContent = '';
}

function syncControls() {
    const panel = document.getElementById(ROOT_ID);
    if (!panel) return;
    panel.querySelectorAll('[data-cgs2-key]').forEach(control => {
        const value = settings[control.dataset.cgs2Key];
        if (value === undefined || document.activeElement === control) return;
        control.value = value;
        const output = panel.querySelector(`[data-cgs2-output="${control.dataset.cgs2Key}"]`);
        if (output) {
            const key = control.dataset.cgs2Key;
            if (key === 'blur') output.textContent = `${value} px`;
            else if (key === 'opacity' || key === 'barOpacity') output.textContent = `${value}%`;
            else if (key === 'fontSize') output.textContent = `${Number(value).toFixed(2)} rem`;
        }
    });
    renderTemplates();
}

function saveSoon() {
    const status = document.querySelector(`#${ROOT_ID} [data-cgs2-status]`);
    if (status) status.textContent = '正在保存…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        SillyTavern.getContext().saveSettingsDebounced();
        if (status) status.textContent = '已自动保存';
    }, 300);
}

function updateControl(control) {
    const key = control.dataset.cgs2Key;
    if (!KEYS.includes(key)) return;
    settings[key] = control.type === 'range' ? Number(control.value) : control.value;
    applySettings();
    saveSoon();
}

function snapshot() {
    return Object.fromEntries(KEYS.map(key => [key, settings[key]]));
}

function applyTemplate(id) {
    const template = settings.templates.find(item => item.id === id);
    if (!template || !template.values) return;
    Object.assign(settings, template.values);
    applySettings();
    saveSoon();
}

function renderTemplates() {
    const list = document.querySelector(`#${ROOT_ID} [data-cgs2-template-list]`);
    if (!list) return;
    list.replaceChildren();
    settings.templates.forEach(template => {
        const row = document.createElement('div');
        row.className = 'cgs2-template-row';
        const name = document.createElement('span');
        name.textContent = template.name;
        const apply = document.createElement('button');
        apply.type = 'button';
        apply.textContent = '应用';
        apply.dataset.applyTemplate = template.id;
        const rename = document.createElement('button');
        rename.type = 'button';
        rename.textContent = '改名';
        rename.dataset.renameTemplate = template.id;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '删除';
        remove.dataset.deleteTemplate = template.id;
        row.append(name, apply, rename, remove);
        list.appendChild(row);
    });
}

function saveTemplate() {
    const name = window.prompt('给这套模板起个名字：');
    if (!name || !name.trim()) return;
    settings.templates.push({
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        values: snapshot()
    });
    renderTemplates();
    saveSoon();
}

function mountPanel() {
    const target = document.querySelector('#extensions_settings2') || document.querySelector('#extensions_settings');
    if (!target || document.getElementById(ROOT_ID)) return;
    SillyTavern.getContext().renderExtensionTemplateAsync(
        'third-party/cloud-glass-studio-universal',
        'settings'
    ).then(html => {
        if (document.getElementById(ROOT_ID)) return;
        target.insertAdjacentHTML('beforeend', html);
        const panel = document.getElementById(ROOT_ID);
        if (!panel) return;
        panel.addEventListener('input', event => {
            if (event.target.matches('[data-cgs2-key]')) updateControl(event.target);
        });
        panel.addEventListener('change', event => {
            if (event.target.matches('[data-cgs2-key]')) updateControl(event.target);
        });
        panel.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;
            if (button.dataset.applyTemplate) applyTemplate(button.dataset.applyTemplate);
            if (button.dataset.renameTemplate) {
                const item = settings.templates.find(t => t.id === button.dataset.renameTemplate);
                if (item) {
                    const name = window.prompt('修改模板名称：', item.name);
                    if (name && name.trim()) {
                        item.name = name.trim();
                        renderTemplates();
                        saveSoon();
                    }
                }
            }
            if (button.dataset.deleteTemplate) {
                const item = settings.templates.find(t => t.id === button.dataset.deleteTemplate);
                if (item && window.confirm(`删除模板“${item.name}”？`)) {
                    settings.templates = settings.templates.filter(t => t.id !== item.id);
                    renderTemplates();
                    saveSoon();
                }
            }
            if (button.matches('[data-save-template]')) saveTemplate();
            if (button.matches('[data-cgs2-preset]')) applyTemplate(button.dataset.cgs2Preset);
        });
        syncControls();
    }).catch(error => console.error('[云雾玻璃控制台] 面板加载失败', error));
}

function watchDom() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(() => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshTargets, 180);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

async function init() {
    try {
        settings = getSettings();
        applySettings();
        mountPanel();
        watchDom();
        console.info('[云雾玻璃控制台] 2.1.2 已加载');
    } catch (error) {
        console.error('[云雾玻璃控制台] 初始化失败', error);
    }
}

if (window.jQuery) window.jQuery(init);
else document.addEventListener('DOMContentLoaded', init, { once: true });
})();