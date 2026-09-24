const SliderButtonsWidget = {
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
            { key: 'min', label: 'field_min', type: 'number', default: 0, row: 'range' },
            { key: 'max', label: 'field_max', type: 'number', default: 100, row: 'range' },
            { key: 'step', label: 'field_step', type: 'number', default: 1, row: 'range' },
            { key: 'unit', label: 'field_unit', type: 'text', placeholder: 'ph_percent' },
            { key: 'prepend_icon', label: 'field_prepend_icon', type: 'icon_picker', placeholder: 'ph_fa_icon', row: 'icons', fallback: 'fas fa-minus' },
            { key: 'append_icon', label: 'field_append_icon', type: 'icon_picker', placeholder: 'ph_fa_icon', row: 'icons', fallback: 'fas fa-plus' },
            { key: 'round', label: 'field_round', type: 'checkbox', default: false },
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
    defaults: { icon: 'fas fa-plus-minus', icon_type: 'icon', property: 'level', min: 0, max: 100, step: 1, unit: '', round: false, prepend_icon: '', append_icon: '', height: 130 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_sliderbuttons') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;gap:10px;flex:1">
                    <button type="button" @click="stepDown" :disabled="aliveDisabled" :style="btnStyle" aria-label="-"><i v-if="widget.prepend_icon" :class="widget.prepend_icon"></i><template v-else>−</template></button>
                    <span style="flex:1;text-align:center;font-size:1.05rem;font-weight:600;color:var(--on-theme-high);white-space:nowrap">{{ value }} <span v-if="widget.unit" style="margin-left:4px">{{ widget.unit }}</span></span>
                    <button type="button" @click="stepUp" :disabled="aliveDisabled" :style="btnStyle" aria-label="+"><i v-if="widget.append_icon" :class="widget.append_icon"></i><template v-else>+</template></button>
                </div>
            </div>
        </div>`,
    data() {
        return { value: 0, loading: false, timer: null, isAlive: true, availTimer: null };
    },
    computed: {
        aliveDisabled() {
            return !!(this.widget.object_alive && this.widget.property_alive && this.isAlive === false);
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        btnStyle() {
            const base = 'width:44px;height:44px;flex-shrink:0;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.9);cursor:pointer;font-size:1.15rem;display:flex;align-items:center;justify-content:center;outline:none;';
            return this.widget.round ? base + 'border-radius:50%;' : base + 'border-radius:6px;';
        }
    },
    mounted() {
        this.load();
        if (this.widget.object && !window.__dpWsLive) this.timer = setInterval(() => this.load(), 5000);
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
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async load() {
            if (!this.widget.object) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property || 'level' }));
                if (!d.error && d.value !== undefined) this.value = parseFloat(d.value) || 0;
            } catch(e) {}
        },
        async onChange() {
            if (this.loading || !this.widget.object) return;
            this.loading = true;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property || 'level', value: String(this.value) }));
            } catch(e) {}
            this.loading = false;
        },
        stepDown() {
            if (this.aliveDisabled) return;
            const step = this.widget.step || 1;
            const min = this.widget.min || 0;
            this.value = Math.max(min, this.value - step);
            this.onChange();
        },
        stepUp() {
            if (this.aliveDisabled) return;
            const step = this.widget.step || 1;
            const max = this.widget.max || 100;
            this.value = Math.min(max, this.value + step);
            this.onChange();
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.sliderbuttons = SliderButtonsWidget;
