(() => {
    'use strict';

    const MODULE = 'cloud_glass_studio';
    const ROOT_ID = 'cloud-glass-studio';
    const DEFAULTS = {
        blur: 3,
        opacity: 20,
        barOpacity: 28,
        glassColor: '#f5f8f4',
        font: 'ChillHuoSong_F',
        fontSize: 1,
        bodyColor: '#163040',
        secondaryColor: '#373b3d',
        quoteColor: '#1c5330'
    };

    const PRESETS = {
        cloud: { ...DEFAULTS, blur: 3, opacity: 20, barOpacity: 28, glassColor: '#f5f8f4', bodyColor: '#163040', secondaryColor: '#373b3d', quoteColor: '#1c5330' },
        forest: { ...DEFAULTS, blur: 4, opacity: 27, barOpacity: 35, glassColor: '#e5eee3', bodyColor: '#18352e', secondaryColor: '#424b43', quoteColor: '#245b39' },
        dusk: { ...DEFAULTS, blur: 5, opacity: 30, barOpacity: 38, glassColor: '#eee7e2', bodyColor: '#303342', secondaryColor: '#55515a', quoteColor: '#76504c' },
        original: { ...DEFAULTS, blur: 0, opacity: 0, barOpacity: 0, glassColor: '#ffffff', bodyColor: '#163040', secondaryColor: '#676767', quoteColor: '#4b714d' }
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
                else if (key === 'opacity' || key === 'barOpacity') output.textContent = `${value}%`;
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
