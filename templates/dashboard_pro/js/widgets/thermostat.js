const ThermostatWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
            { key: 'object_switch_obj', label: 'field_switch_object', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_switch', label: 'field_switch_method', type: 'method', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_on_obj', label: 'field_on_object', type: 'method_object', parent: 'object_on', row: 'm_on' },
            { key: 'object_on', label: 'field_on_method', type: 'method', parent: 'object_on', row: 'm_on' },
            { key: 'object_off_obj', label: 'field_off_object', type: 'method_object', parent: 'object_off', row: 'm_off' },
            { key: 'object_off', label: 'field_off_method', type: 'method', parent: 'object_off', row: 'm_off' },
            { key: 'object_current', label: 'field_object_current', type: 'object', row: 'temp_current' },
            { key: 'property_current', label: 'field_property_current', type: 'property', row: 'temp_current' },
            { key: 'object_target', label: 'field_object_target', type: 'object', row: 'temp_target' },
            { key: 'property_target', label: 'field_property_target', type: 'property', row: 'temp_target' },
            { key: 'min', label: 'field_min', type: 'number', default: 5, row: 'range' },
            { key: 'max', label: 'field_max', type: 'number', default: 35, row: 'range' },
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
            { key: 'background', label: 'field_icon_bg', type: 'checkbox', row: 'icon_hl' },
            { key: 'round', label: 'field_icon_round', type: 'checkbox', row: 'icon_hl' },
        ],
    },
    defaults: { icon: 'fas fa-thermometer-half', icon_type: 'icon', min: 5, max: 35, background: false, round: false, height: 140 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" class="widget-v-card__icon" :class="[widget.icon, iconHlClass]" style="display:inline-flex;align-items:center;justify-content:center;width:35px;height:35px;padding:0"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_thermostat') }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" :style="aliveDisabled ? 'opacity:.4;pointer-events:none' : ''" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="display:flex;align-items:center;gap:16px">
                    <button @click="adjustTarget(-1)" :disabled="loading || aliveDisabled" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
                    <div style="text-align:center">
                        <div style="font-size:2.2rem;font-weight:300;color:rgba(255,255,255,.87)">{{ target }}</div>
                        <div style="font-size:.7rem;color:rgba(255,255,255,.4)">°C</div>
                    </div>
                    <button @click="adjustTarget(1)" :disabled="loading || aliveDisabled" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
                </div>
                <div v-if="currentTemp !== null" style="font-size:.8rem;color:rgba(255,255,255,.5)">{{ t('current_label') }} {{ currentTemp }}°C</div>
            </div>
            <div v-if="loading" class="widget-v-card__loading"><div class="v-progress-linear v-progress-linear--active"><div class="v-progress-linear__determinate" style="width:100%"></div></div></div>
        </div>`,
    data() {
        const st = (this.widget && window.__dpWidgetState[this.widget.id]) || {};
        return { target: st.target || 22, currentTemp: null, isOn: !!st.isOn, loading: false, timer: null, isAlive: true, availTimer: null, _toggleUntil: 0 };
    },
    computed: {
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        iconHlClass() {
            if (!this.widget.background || !this.isOn) return '';
            return this.widget.round ? 'widget-v-card__icon--hl widget-v-card__icon--hl--round' : 'widget-v-card__icon--hl';
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.poll();
        if (!window.__dpWsLive) this.timer = setInterval(() => this.poll(), 3000);
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.availTimer) clearInterval(this.availTimer);
    },
    methods: {
        uiState() {
            const id = this.widget && this.widget.id;
            if (!id) return null;
            return window.__dpWidgetState[id] || (window.__dpWidgetState[id] = {});
        },
        async poll() {
            this.loadState();
            this.loadTemp();
            if (this.widget.object_alive && this.widget.property_alive) this.checkAlive();
        },
        statusSource() {
            return {
                object: this.widget.object_value || this.widget.object || this.widget.object_status || '',
                property: this.widget.property || this.widget.property_status || 'status'
            };
        },
        async loadState() {
            const src = this.statusSource();
            if (!src.object) return;
            if (Date.now() < this._toggleUntil) return;
            try {
                const params = src.property ? { object: src.object, property: src.property } : { object: src.object };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined) {
                    const val = typeof d.value === 'string' ? d.value : String(d.value);
                    this.isOn = val === '1' || val === 'ON' || val === 'true';
                    const st = this.uiState();
                    if (st) st.isOn = this.isOn;
                }
            } catch(e) {}
        },
        async loadTemp() {
            if (this.widget.object_current) {
                try {
                    const params = this.widget.property_current ? { object: this.widget.object_current, property: this.widget.property_current } : { object: this.widget.object_current };
                    const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                    if (!d.error && d.value !== undefined) {
                        const v = parseFloat(d.value);
                        if (!isNaN(v)) this.currentTemp = v;
                    }
                } catch(e) {}
            }
            if (this.widget.object_target) {
                try {
                    const params = this.widget.property_target ? { object: this.widget.object_target, property: this.widget.property_target } : { object: this.widget.object_target };
                    const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                    if (!d.error && d.value !== undefined) {
                        this.target = parseFloat(d.value) || 22;
                        const st = this.uiState();
                        if (st) st.target = this.target;
                    }
                } catch(e) {}
            }
        },
        async toggle() {
            if (this.loading || this.aliveDisabled) return;
            this.loading = true;
            const next = !this.isOn;
            this._toggleUntil = window.__dpWsLive ? 0 : Date.now() + 4000;
            const src = this.statusSource();
            if (this.widget.object_switch) {
                const p = this.widget.object_switch.split('/');
                await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
            } else if (this.widget.object_on && this.widget.object_off) {
                const pon = this.widget.object_on.split('/');
                const poff = this.widget.object_off.split('/');
                const p = next ? pon : poff;
                await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
            } else {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: src.object, property: src.property || 'status', value: next ? '1' : '0'
                }));
            }
            this.isOn = next;
            const st = this.uiState();
            if (st) st.isOn = next;
            this.loading = false;
        },
        async adjustTarget(delta) {
            this.loading = true;
            const obj = this.widget.object_target;
            const prop = this.widget.property_target;
            if (obj) {
                this.target = Math.round(Math.min(Math.max(this.target + delta, this.widget.min || 5), this.widget.max || 35));
                try {
                    const params = prop ? { object: obj, property: prop, value: String(this.target) } : { object: obj, value: String(this.target) };
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                    const st = this.uiState();
                    if (st) st.target = this.target;
                } catch(e) {}
            }
            this.loading = false;
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.thermostat = ThermostatWidget;