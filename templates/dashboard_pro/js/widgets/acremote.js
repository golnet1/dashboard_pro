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
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
            { key: 'remember', label: 'field_remember_state', type: 'checkbox' },
        ],
    },
    defaults: { icon: 'fas fa-snowflake', icon_type: 'icon', property: 'value', send_mode: 'property', codes: '', remember: false, width: 300, height: 380, minWidth: 280, minHeight: 356 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_acremote') }}</div>
            </div>
            <div class="widget-v-card__body dp-remote__ac-body">
                <div class="dp-remote__display">
                    <template v-if="on">{{ modeName }}<span v-if="swingOn" class="dp-remote__disp-swing">&#x2195;</span></template>
                    <template v-else>--</template>
                    <small>{{ t('rc_fan') }}:&nbsp;<b v-if="fan === 0" style="font-weight:800">A</b><svg v-else viewBox="0 0 20 16" width="15" height="12" fill="currentColor" style="vertical-align:middle"><rect x="0" y="9" width="3" height="7" rx="1"/><rect v-if="fan >= 2" x="5.5" y="6" width="3" height="10" rx="1"/><rect v-if="fan >= 3" x="11" y="3" width="3" height="13" rx="1"/><rect v-if="fan >= 4" x="16.5" y="0" width="3" height="16" rx="1"/></svg>&nbsp;&middot;&nbsp;{{ temp }}&#x00B0;</small>
                </div>
                <button class="dp-remote__power" @click="togglePower" :title="t('rc_power')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5v8"/><path d="M6.4 7.2a8 8 0 1 0 11.2 0"/></svg></button>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === 'auto' }" @click="setMode('auto')" :title="t('rc_auto')"><span style="font-weight:800;font-size:1.15rem;line-height:1">A</span></button>
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === 'cool' }" @click="setMode('cool')" :title="t('rc_cool')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M4.2 6.6l15.6 10.8M19.8 6.6L4.2 17.4"/><path d="M12 6.5l-3-3M12 6.5l3-3M12 17.5l-3 3M12 17.5l3 3"/><path d="M5.6 10.2L2 9M5.6 13.8L2 15M18.4 10.2L22 9M18.4 13.8L22 15"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === 'heat' }" @click="setMode('heat')" :title="t('rc_heat')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M19.6 4.4L17.5 6.5M6.5 17.5l-2.1 2.1"/></svg></button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === 'dry' }" @click="setMode('dry')" :title="t('rc_dry')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2c-5 5.5-8 9-8 13a8 8 0 0 0 16 0c0-4-3-7.5-8-13z"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && mode === 'fan' }" @click="setMode('fan')" :title="t('rc_fan')"><i class="fas fa-fan"></i></button>
                    <button class="dp-remote__key dp-remote__key--mode" :class="{ 'dp-remote__key--active': on && swingOn }" @click="toggleSwing()" :title="t('rc_swing')"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l4 5h-3v6h3l-4 5-4-5h3v-6H8z"/></svg></button>
                </div>
                <div class="dp-remote__temp">
                    <button class="dp-remote__key" @click="tempDown" :title="t('rc_temp_down')"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 7h16l-8 13z"/></svg></button>
                    <div style="text-align:center;min-width:56px">
                        <div style="font-size:1.05rem;font-weight:800">{{ temp }}&#x00B0;</div>
                        <div style="font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.55)">{{ t('rc_temp') }}</div>
                    </div>
                    <button class="dp-remote__key" @click="tempUp" :title="t('rc_temp_up')"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 4L4 17h16z"/></svg></button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" @click="cycleFan" :title="t('rc_fan')"><i class="fas fa-fan"></i></button>
                </div>
            </div>
        </div>`,
    data() { return { mode: '', on: false, temp: 22, swingOn: false, fan: 0, isAlive: true, availTimer: null }; },
    mounted() {
        if (this.widget.remember) this.restoreState();
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
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        codeFor(k) {
            const v = this.codeMap[k];
            return v !== undefined && v !== null && v !== '' ? String(v) : k;
        },
        async send(code) {
            try {
                if (this.widget.send_mode === 'script') {
                    let params;
                    try { params = JSON.parse(code); } catch (e) { params = null; }
                    if (params && typeof params === 'object') {
                        const qs = new URLSearchParams(params);
                        const url = '/api.php/script/' + encodeURIComponent(this.widget.script) + (qs.toString() ? '?' + qs.toString() : '');
                        const res = await fetch(url);
                        if (!res.ok) console.error('scriptRun failed:', res.status);
                    } else {
                        await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: code }));
                    }
                } else if (this.widget.send_mode === 'command') {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: (this.widget.command_prefix || '') + code }));
                } else if (this.widget.object) {
                    const params = { object: this.widget.object, value: code };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
            } catch (e) { console.error(e); }
        },
        async togglePower() {
            this.on = !this.on;
            if (this.on && !this.mode) this.mode = 'auto';
            this.send(this.stateJSON());
            this.saveState();
        },
        setMode(m) {
            if (!this.on) return;
            this.mode = this.mode === m ? '' : m;
            if (!this.mode) this.mode = 'auto';
            this.send(this.stateJSON());
            this.saveState();
        },
        toggleSwing() {
            if (!this.on) return;
            this.swingOn = !this.swingOn;
            this.send(this.stateJSON());
            this.saveState();
        },
        tempUp() {
            if (!this.on) return;
            if (this.temp < 32) this.temp++;
            this.send(this.stateJSON());
            this.saveState();
        },
        tempDown() {
            if (!this.on) return;
            if (this.temp > 16) this.temp--;
            this.send(this.stateJSON());
            this.saveState();
        },
        cycleFan() {
            if (!this.on) return;
            this.fan = (this.fan + 1) % 5;
            this.send(this.stateJSON());
            this.saveState();
        },
        stateJSON() {
            return JSON.stringify({
                on: this.on ? 1 : 0,
                mode: this.mode || 'auto',
                temp: this.temp,
                swing: this.swingOn ? 1 : 0,
                fan: this.fan
            });
        },
        saveState() {
            if (!this.widget.remember) return;
            try {
                localStorage.setItem('dp_ac_' + this.widget.id, JSON.stringify({
                    mode: this.mode, on: this.on, temp: this.temp, swingOn: this.swingOn, fan: this.fan
                }));
            } catch (e) { /* storage unavailable */ }
        },
        restoreState() {
            try {
                const s = JSON.parse(localStorage.getItem('dp_ac_' + this.widget.id) || 'null');
                if (!s) return;
                if (typeof s.mode === 'string') this.mode = s.mode;
                if (typeof s.on === 'boolean') this.on = s.on;
                if (typeof s.temp === 'number') this.temp = s.temp;
                if (typeof s.swingOn === 'boolean') this.swingOn = s.swingOn;
                if (typeof s.fan === 'number') this.fan = s.fan;
            } catch (e) { /* ignore corrupted state */ }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.acremote = AcRemoteWidget;