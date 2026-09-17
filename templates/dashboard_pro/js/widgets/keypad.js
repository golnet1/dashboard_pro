const KeypadWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'field_send_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
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
    defaults: { icon: 'fas fa-th', icon_type: 'icon', property: 'value' },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_keypad') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;gap:6px">
                <div style="text-align:center;font-size:1.8rem;font-weight:300;color:rgba(255,255,255,.87);padding:4px 0;min-height:2.5rem;font-family:monospace">{{ display }}</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
                    <button v-for="k in keys" :key="k" @click="press(k)" :disabled="aliveDisabled" style="padding:8px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1rem;cursor:pointer;text-align:center" :style="k === 'OK' ? 'background:var(--primary);color:#fff;border-color:var(--primary)' : (k === 'C' ? 'background:rgba(239,68,68,.2);color:#ef4444;border-color:rgba(239,68,68,.3)' : '')">{{ k }}</button>
                </div>
            </div>
        </div>`,
    data() {
        return { display: '', isAlive: true, availTimer: null };
    },
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
        keys() { return ['1','2','3','4','5','6','7','8','9','C','0','OK']; }
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        press(k) {
            if (k === 'C') { this.display = ''; return; }
            if (k === 'OK') {
                if (this.widget.object && this.display) {
                    dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property || 'value', value: this.display }));
                }
                return;
            }
            if (this.display.length < 10) this.display += k;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.keypad = KeypadWidget;
