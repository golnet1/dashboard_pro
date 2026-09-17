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
        ],
    },
    defaults: { icon: 'fas fa-tv', icon_type: 'icon', property: 'value', send_mode: 'property', codes: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_tvremote') }}</div>
            </div>
            <div class="widget-v-card__body dp-remote__body">
                <button class="dp-remote__power" @click="press('power')" :title="t('rc_power')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5v8"/><path d="M6.4 7.2a8 8 0 1 0 11.2 0"/></svg></button>
                <div class="dp-remote__row">
                    <button v-for="k in ['menu','home','input']" :key="'fn'+k" class="dp-remote__key dp-remote__key--small" @click="press(k)">{{ t('rc_' + k) }}</button>
                </div>
                <div class="dp-remote__numgrid">
                    <button v-for="n in ['1','2','3','4','5','6','7','8','9']" :key="n" class="dp-remote__key dp-remote__key--num" @click="press(n)">{{ n }}</button>
                    <button class="dp-remote__key dp-remote__key--num" @click="press('mute')">{{ t('rc_mute') }}</button>
                    <button class="dp-remote__key dp-remote__key--num" @click="press('0')">0</button>
                    <button class="dp-remote__key dp-remote__key--num dp-remote__key--center" @click="press('ok')">{{ t('rc_ok') }}</button>
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
                        <button class="dp-remote__key dp-remote__key--big" @click="press('vol+')">{{ t('rc_vol_up') }}</button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('vol-')">{{ t('rc_vol_down') }}</button>
                    </div>
                    <div class="dp-remote__col">
                        <button class="dp-remote__key dp-remote__key--big" @click="press('ch+')">{{ t('rc_ch_up') }}</button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('ch-')">{{ t('rc_ch_down') }}</button>
                    </div>
                    <div class="dp-remote__col">
                        <button class="dp-remote__key dp-remote__key--big" @click="press('back')">{{ t('rc_back') }}</button>
                        <button class="dp-remote__key dp-remote__key--big" @click="press('info')">{{ t('rc_info') }}</button>
                    </div>
                </div>
            </div>
        </div>`,
    data() { return {}; },
    computed: {
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
        codeFor(k) {
            const v = this.codeMap[k];
            if (v !== undefined && v !== null && v !== '') return String(v);
            const tv = { power: 'Power', info: 'Info', menu: 'Menu', home: 'Home', input: 'Source', back: 'Back', ok: 'Confirm', up: 'CursorUp', down: 'CursorDown', left: 'CursorLeft', right: 'CursorRight', mute: 'Mute', 'vol+': 'VolumeUp', 'vol-': 'VolumeDown', 'ch+': 'ChannelStepUp', 'ch-': 'ChannelStepDown', '0': 'Digit0', '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4', '5': 'Digit5', '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9' };
            return tv[k] || k;
        },
        async press(k) {
            const code = this.codeFor(k);
            try {
                if (this.widget.send_mode === 'script') {
                    await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: code }));
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