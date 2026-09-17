const TvRemoteWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'send_mode', label: 'field_send_mode', type: 'select', row: 'send_row', options: [{value:'property',label:'opt_set_property'},{value:'command',label:'opt_command'},{value:'tv',label:'opt_tv'},{value:'script',label:'opt_script'}] },
            { key: 'object', label: 'field_send_object', type: 'object', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'command_prefix', label: 'field_command_prefix', type: 'text', row: 'obj_prop', showIf: { send_mode: 'command' }, placeholder: 'ph_command_prefix' },
            { key: 'tv_ip', label: 'field_tv_ip', type: 'text', row: 'obj_prop', showIf: { send_mode: 'tv' }, placeholder: 'ph_tv_ip' },
            { key: 'tv_port', label: 'field_tv_port', type: 'text', row: 'obj_prop', showIf: { send_mode: 'tv' }, placeholder: '1925' },
            { key: 'script', label: 'field_script', type: 'text', row: 'obj_prop', showIf: { send_mode: 'script' }, placeholder: 'ph_script' },
            { key: 'codes', label: 'field_codes', type: 'textarea', rows: 6, placeholder: 'ph_codes' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
        ],
    },
    defaults: { icon: 'fas fa-tv', icon_type: 'icon', property: 'value', send_mode: 'property', codes: '', width: 300, height: 540, minWidth: 280, minHeight: 520 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_tvremote') }}</div>
            </div>
            <div class="widget-v-card__body dp-remote__body">
                <button class="dp-remote__power" @click="press('power')" :title="t('rc_power')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5v8"/><path d="M6.4 7.2a8 8 0 1 0 11.2 0"/></svg></button>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--small" @click="press('menu')" :title="t('rc_menu')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="3" y="5" width="18" height="2.2" rx="1"/><rect x="3" y="11" width="18" height="2.2" rx="1"/><rect x="3" y="17" width="18" height="2.2" rx="1"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--small" @click="press('home')" :title="t('rc_home')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 10.5L12 3l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V10.5z"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--small" @click="press('info')" :title="t('rc_info')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="17"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></svg></button>
                </div>
                <div class="dp-remote__numgrid">
                    <button v-for="n in ['1','2','3','4','5','6','7','8','9']" :key="n" class="dp-remote__key dp-remote__key--num" @click="press(n)">{{ n }}</button>
                    <button class="dp-remote__key dp-remote__key--num" @click="press('input')" :title="t('rc_input')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="2" y="4" width="20" height="14" rx="2"/><rect x="8" y="20" width="8" height="1"/><rect x="11" y="18" width="2" height="2"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--num" @click="press('0')">0</button>
                    <button class="dp-remote__key dp-remote__key--num" @click="press('settings')" :title="t('rc_settings')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-2.53l-1.22-.4a7.1 7.1 0 0 0-.63-1.5l.76-1.01a.75.75 0 0 0-.12-.95l-2.12-2.12a.75.75 0 0 0-.95-.12l-1.01.76a7.1 7.1 0 0 0-1.5-.63l-.4-1.22a.75.75 0 0 0-.72-.52h-3a.75.75 0 0 0-.72.52l-.4 1.22a7.1 7.1 0 0 0-1.5.63l-1.01-.76a.75.75 0 0 0-.95.12L4.91 8.92a.75.75 0 0 0-.12.95l.76 1.01a7.1 7.1 0 0 0-.63 1.5l-1.22.4a.75.75 0 0 0-.52.72v3a.75.75 0 0 0 .52.72l1.22.4c.16.52.37.99.63 1.5l-.76 1.01a.75.75 0 0 0 .12.95l2.12 2.12a.75.75 0 0 0 .95.12l1.01-.76c.51.26.98.47 1.5.63l.4 1.22a.75.75 0 0 0 .72.52h3c.35 0 .65-.23.72-.52l.4-1.22c.52-.16.99-.37 1.5-.63l1.01.76a.75.75 0 0 0 .95-.12l2.12-2.12a.75.75 0 0 0 .12-.95l-.76-1.01c.26-.51.47-.98.63-1.5l1.22-.4a.75.75 0 0 0 .52-.72v-3a.75.75 0 0 0-.52-.72z"/></svg></button>
                </div>
                <div class="dp-remote__dpad">
                    <span></span>
                    <button class="dp-remote__key dp-remote__key--arrow" @click="press('up')">&#x25B2;</button>
                    <span></span>
                    <button class="dp-remote__key dp-remote__key--arrow" @click="press('left')">&#x25C0;</button>
                    <button class="dp-remote__key dp-remote__key--center" @click="press('ok')">{{ t('rc_ok') }}</button>
                    <button class="dp-remote__key dp-remote__key--arrow" @click="press('right')">&#x25B6;</button>
                    <span></span>
                    <button class="dp-remote__key dp-remote__key--arrow" @click="press('down')">&#x25BC;</button>
                    <span></span>
                </div>
                <div class="dp-remote__cols">
                    <div class="dp-remote__col">
                        <button class="dp-remote__key dp-remote__key--big" @click="press('vol+')" :title="t('rc_vol_up')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 9h3l4-4v14l-4-4H4V9z"/><rect x="13" y="11" width="7" height="2" rx="1"/><rect x="15.5" y="8.5" width="2" height="7" rx="1"/></svg></button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('vol-')" :title="t('rc_vol_down')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 9h3l4-4v14l-4-4H4V9z"/><rect x="13" y="11" width="7" height="2" rx="1"/></svg></button>
                    </div>
                    <div class="dp-remote__col">
                        <button class="dp-remote__key dp-remote__key--big" @click="press('mute')" :title="t('rc_mute')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 9h3l4-4v14l-4-4H4V9z"/><path d="M14 9.5l5.5 5.5M19.5 9.5L14 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('back')" :title="t('rc_back')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
                    </div>
                    <div class="dp-remote__col">
                        <button class="dp-remote__key dp-remote__key--big" @click="press('ch+')" :title="t('rc_ch_up')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg></button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('ch-')" :title="t('rc_ch_down')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg></button>
                    </div>
                </div>
            </div>
        </div>`,
    data() { return { isAlive: true, availTimer: null }; },
    mounted() {
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() { if (this.availTimer) clearInterval(this.availTimer); },
    computed: {
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        codeMap() {
            try { return JSON.parse(this.widget.codes || '{}'); } catch (e) { return {}; }
        }
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        codeFor(k) {
            const v = this.codeMap[k];
            if (v !== undefined && v !== null && v !== '') return String(v);
            const tv = { power: 'Power', info: 'Info', settings: 'Settings', menu: 'Menu', home: 'Home', input: 'Source', back: 'Back', ok: 'Confirm', up: 'CursorUp', down: 'CursorDown', left: 'CursorLeft', right: 'CursorRight', mute: 'Mute', 'vol+': 'VolumeUp', 'vol-': 'VolumeDown', 'ch+': 'ChannelStepUp', 'ch-': 'ChannelStepDown', '0': 'Digit0', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4', '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9' };
            return tv[k] || k;
        },
        async press(k) {
            const code = this.codeFor(k);
            try {
                if (this.widget.send_mode === 'script') {
                    const url = '/api.php/script/' + encodeURIComponent(this.widget.script) + '?' + new URLSearchParams({ key: code });
                    const res = await fetch(url);
                    if (!res.ok) console.error('scriptRun failed:', res.status);
                } else if (this.widget.send_mode === 'tv') {
                    const ip = (this.widget.tv_ip || '').trim();
                    if (!ip) return;
                    await dpAPI('tvKey?' + new URLSearchParams({ ip: ip, port: (this.widget.tv_port || '1925').trim(), key: code }));
                } else if (this.widget.send_mode === 'command') {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: (this.widget.command_prefix || '') + code }));
                } else if (this.widget.object) {
                    const params = { object: this.widget.object, value: code };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
            } catch (e) { console.error(e); }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.tvremote = TvRemoteWidget;