(() => {
    'use strict';

    const MODULE = 'cloud_glass_studio';
    const ROOT_ID = 'cloud-glass-studio';
    const DEFAULTS = {
        blur: 3,
        opacity: 20,
        barOpacity: 28,
        glassColor: '#f5f8f4',
        drawerColor: '#dce8dc',
        drawerOpacity: 82,
        menuColor: '#dce8dc',
        menuOpacity: 96,
        inputColor: '#dce8dc',
        inputOpacity: 90,
        font: 'ChillHuoSong_F',
        fontSize: 1,
        bodyColor: '#163040',
        secondaryColor: '#52605d',
        quoteColor: '#1c5330'
    };

    const PRESETS = {
        cloud: {
            ...DEFAULTS, blur: 7, opacity: 19, barOpacity: 24,
            glassColor: '#e8f2f7', drawerColor: '#e6f0f2', drawerOpacity: 72,
            menuColor: '#edf5f6', menuOpacity: 91, inputColor: '#e5eff2', inputOpacity: 78,
            bodyColor: '#203746', secondaryColor: '#627780', quoteColor: '#477b88'
        },
        forest: {
            ...DEFAULTS, blur: 5, opacity: 32, barOpacity: 42,
            glassColor: '#dce8dc', drawerColor: '#c7d9c9', drawerOpacity: 93,
            menuColor: '#d4e2d4', menuOpacity: 98, inputColor: '#c8dbc9', inputOpacity: 94,
            bodyColor: '#17382e', secondaryColor: '#53675b', quoteColor: '#276344'
        },
        dusk: {
            ...DEFAULTS, blur: 10, opacity: 28, barOpacity: 35,
            glassColor: '#eadbd8', drawerColor: '#e7d4d1', drawerOpacity: 88,
            menuColor: '#f0dfdc', menuOpacity: 97, inputColor: '#e4cfcb', inputOpacity: 91,
            bodyColor: '#40313d', secondaryColor: '#79656c', quoteColor: '#98606b'
        },
        original: {
            ...DEFAULTS, blur: 0, opacity: 0, barOpacity: 0,
            glassColor: '#ffffff', drawerColor: '#ffffff', drawerOpacity: 0,
            menuColor: '#ffffff', menuOpacity: 0, inputColor: '#ffffff', inputOpacity: 0,
            bodyColor: '#163040', secondaryColor: '#676767', quoteColor: '#4b714d'
        }
    };

    let settings;
    let saveTimer;

    function getSettings() {
        const ctx = SillyTavern.getContext();
        ctx.extensionSettings[MODULE] = {
            ...DEFAULTS,
            ...(ctx.extensionSettings[MODULE] || {})
        };
        return ctx.extensionSettings[MODULE];
    }

    function hexToRgb(hex) {
        const value = String(hex || '').replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(value)) return { r: 245, g: 248, b: 244 };
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

    function applySettings() {
        const root = document.documentElement;
        root.style.setProperty('--cgs-blur', `${Number(settings.blur)}px`);
        root.style.setProperty('--cgs-card-fill', rgba(settings.glassColor, Number(settings.opacity) / 100));
        root.style.setProperty('--cgs-bar-fill', rgba(settings.glassColor, Number(settings.barOpacity) / 100));
        root.style.setProperty('--cgs-drawer-fill', rgba(settings.drawerColor, Number(settings.drawerOpacity) / 100));
        root.style.setProperty('--cgs-menu-fill', rgba(settings.menuColor, Number(settings.menuOpacity) / 100));
        root.style.setProperty('--cgs-input-fill', rgba(settings.inputColor, Number(settings.inputOpacity) / 100));
        root.style.setProperty('--cgs-font', `"${String(settings.font).replace(/["\\]/g, '')}", "Noto Serif SC", serif`);
        root.style.setProperty('--cgs-font-size', `${Number(settings.fontSize)}rem`);
        root.style.setProperty('--SmartThemeBodyColor', settings.bodyColor);
        root.style.setProperty('--SmartThemeEmColor', settings.secondaryColor);
        root.style.setProperty('--SmartThemeQuoteColor', settings.quoteColor);
        root.style.setProperty('--wx-text-primary', settings.bodyColor);
        root.style.setProperty('--wx-text-content', settings.bodyColor);
        root.style.setProperty('--wx-text-secondary', settings.secondaryColor);
        root.style.setProperty('--wx-text-tertiary', settings.secondaryColor);
        root.style.setProperty('--wx-text-quote', settings.quoteColor);
        root.style.setProperty('--wx-font-content', `var(--cgs-font)`);
        root.style.setProperty('--wx-content-font-size', `var(--cgs-font-size)`);
        syncControls();
    }

    function syncControls() {
        const panel = document.getElementById(ROOT_ID);
        if (!panel) return;
        for (const [key, value] of Object.entries(settings)) {
            const control = panel.querySelector(`[data-cgs-key="${key}"]`);
            if (control && document.activeElement !== control) control.value = value;
            const output = panel.querySelector(`[data-cgs-output="${key}"]`);
            if (output) {
                if (key === 'blur') output.textContent = `${value} px`;
                else if (['opacity', 'barOpacity', 'drawerOpacity', 'menuOpacity', 'inputOpacity'].includes(key)) output.textContent = `${value}%`;
                else if (key === 'fontSize') output.textContent = `${Number(value).toFixed(2)} rem`;
            }
        }
    }

    function saveSoon() {
        const status = document.querySelector(`#${ROOT_ID} [data-cgs-status]`);
        if (status) status.textContent = '正在保存…';
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            SillyTavern.getContext().saveSettingsDebounced();
            if (status) status.textContent = '已自动保存';
        }, 250);
    }

    function updateFromControl(control) {
        const key = control.dataset.cgsKey;
        if (!key || !(key in DEFAULTS)) return;
        const value = (control.type === 'range' || key === 'fontSize')
            ? Number(control.value)
            : control.value;
        settings[key] = value;
        applySettings();
        saveSoon();
    }

    function setPreset(name) {
        if (!PRESETS[name]) return;
        settings = { ...settings, ...PRESETS[name] };
        applySettings();
        saveSoon();
    }

    async function mountPanel() {
        const target = document.querySelector('#extensions_settings2') || document.querySelector('#extensions_settings');
        if (!target || document.getElementById(ROOT_ID)) return;

        const html = await SillyTavern.getContext().renderExtensionTemplateAsync(
            'third-party/cloud-glass-studio',
            'settings'
        );
        target.insertAdjacentHTML('beforeend', html);

        const panel = document.getElementById(ROOT_ID);
        if (!panel) return;

        panel.addEventListener('input', event => {
            if (event.target.matches('[data-cgs-key]')) updateFromControl(event.target);
        });
        panel.addEventListener('change', event => {
            if (event.target.matches('[data-cgs-key]')) updateFromControl(event.target);
        });
        panel.addEventListener('click', event => {
            const preset = event.target.closest('[data-cgs-preset]');
            if (preset) setPreset(preset.dataset.cgsPreset);
            if (event.target.closest('[data-cgs-reset]')) {
                settings = { ...DEFAULTS };
                applySettings();
                saveSoon();
            }
        });

        syncControls();
    }

    async function init() {
        try {
            settings = getSettings();
            applySettings();
            await mountPanel();
            console.info('[云雾玻璃控制台] 已加载');
        } catch (error) {
            console.error('[云雾玻璃控制台] 初始化失败', error);
        }
    }

    if (window.jQuery) {
        window.jQuery(init);
    } else {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    }
})();
