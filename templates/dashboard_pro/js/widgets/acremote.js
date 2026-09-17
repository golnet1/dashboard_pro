const AcRemoteWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'send_mode', label: 'field_send_mode', type: 'select', row: 'send_row', options: [{value:'property',label:'opt_set_property'},{value:'command',label:'opt_command'},{value:'script',label:'opt_script'}] },
            { key: 'object', label: 'field_send_object', type: 'object', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'command_prefix', label: 'field_command_prefix', type: 'text', row: 'obj_prop', showIf: { send_mode: 'command' }, placeholder: 'ph_command_prefix' },
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
    defaults: { icon: 'fas fa-snowflake', icon_type: 'icon', property: 'value', send_mode: 'property', codes: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_acremote') }}</div>
            </div>
            <div class="widget-v-card__body dp-remote__ac-body">
                <div class="dp-remote__display">
                    <template v-if="on">{{ modeName }}<span v-if="swingOn" class="dp-remote__disp-swing">&#x2195;</span></template>
                    <template v-else>--</template>
                    <small>{{ t('rc_fan') }}:&nbsp;{{ fanName }}&nbsp;&middot;&nbsp;{{ temp }}&#x00B0;</small>
                </div>
                <button class="dp-remote__power" @click="togglePower" :title="t('rc_power')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5v8"/><path d="M6.4 7.2a8 8 0 1 0 11.2 0"/></svg></button>
                <div class="dp-remote__row">
                    <button v-for="m in ['auto','cool','heat']" :key="m" class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === m }" @click="setMode(m)">{{ t('rc_' + m) }}</button>
                </div>
                <div class="dp-remote__row">
                    <button v-for="m in ['dry','fan','swing']" :key="m" class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && (m === 'swing' ? swingOn : mode === m) }" @click="m === 'swing' ? toggleSwing() : setMode(m)">{{ t(m === 'swing' ? 'rc_swing' : 'rc_' + m) }}</button>
                </div>
                <div class="dp-remote__temp">
                    <button class="dp-remote__key" @click="tempDown" :title="t('rc_temp_down')">&#x2796;</button>
                    <div style="text-align:center;min-width:56px">
                        <div style="font-size:1.05rem;font-weight:800">{{ temp }}&#x00B0;</div>
                        <div style="font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.55)">{{ t('rc_temp') }}</div>
                    </div>
                    <button class="dp-remote__key" @click="tempUp" :title="t('rc_temp_up')">&#x2795;</button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" @click="cycleFan">{{ t('rc_fan') }}:&nbsp;{{ fanName }}</button>
                </div>
            </div>
        </div>`,
    data() { return { mode: '', on: false, temp: 22, swingOn: false, fan: 0 }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        codeMap() {
            try { return JSON.parse(this.widget.codes || '{}'); } catch (e) { return {}; }
        },
        modeName() {
            if (!this.mode) return this.t('rc_auto');
            return this.t('rc_' + this.mode);
        },
        fanName() {
            return this.t(['rc_fan_auto', 'rc_fan_low', 'rc_fan_med', 'rc_fan_high', 'rc_fan_max'][this.fan]);
        }
    },
    methods: {
        codeFor(k) {
            const v = this.codeMap[k];
            return v !== undefined && v !== null && v !== '' ? String(v) : k;
        },
        async send(code) {
            try {
                if (this.widget.send_mode === 'script') {
                    await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: code }));
                } else if (this.widget.send_mode === 'command') {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: (this.widget.command_prefix || '') + code }));
                } else if (this.widget.object) {
                    const params = { object: this.widget.object, value: code };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
            } catch (e) { console.error(e); }
        },
        togglePower() {
            this.on = !this.on;
            this.send(this.codeFor('power'));
        },
        setMode(m) {
            this.mode = this.mode === m ? '' : m;
            this.swingOn = false;
            this.send(this.codeFor(this.mode || 'mode'));
        },
        toggleSwing() {
            this.swingOn = !this.swingOn;
            this.send(this.codeFor('swing'));
        },
        tempUp() {
            if (this.temp < 32) this.temp++;
            this.send(this.codeFor('temp+'));
        },
        tempDown() {
            if (this.temp > 16) this.temp--;
            this.send(this.codeFor('temp-'));
        },
        cycleFan() {
            this.fan = (this.fan + 1) % 5;
            this.send(this.codeFor('fan') + ' ' + this.fanName);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.acremote = AcRemoteWidget;