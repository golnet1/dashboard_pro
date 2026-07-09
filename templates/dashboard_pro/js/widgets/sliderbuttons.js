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
            { key: 'min', label: 'Мин', type: 'number', default: 0, row: 'range' },
            { key: 'max', label: 'Макс', type: 'number', default: 100, row: 'range' },
            { key: 'step', label: 'field_step', type: 'number', default: 1, row: 'range' },
            { key: 'unit', label: 'Единица', type: 'text', placeholder: '%' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-plus-minus', icon_type: 'icon', property: 'level', min: 0, max: 100, step: 1, unit: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Слайдер' }}</div>
                <div class="widget-v-card__spacer"></div>
                <span style="font-size:.85rem;font-weight:500;color:rgba(255,255,255,.87)">{{ displayValue }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px">
                <input type="range" :min="widget.min || 0" :max="widget.max || 100" :step="widget.step || 1" v-model.number="value" @input="onChange" style="width:100%;accent-color:var(--primary)">
                <div style="display:flex;gap:8px">
                    <button @click="stepDown" style="flex:1;padding:6px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);cursor:pointer;font-size:1.1rem">−</button>
                    <button @click="stepUp" style="flex:1;padding:6px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);cursor:pointer;font-size:1.1rem">+</button>
                </div>
            </div>
        </div>`,
    data() {
        return { value: 0, loading: false, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        displayValue() {
            const v = this.value;
            return this.widget.unit ? v + this.widget.unit : v;
        }
    },
    mounted() {
        this.load();
        if (this.widget.object) this.timer = setInterval(() => this.load(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
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
            const step = this.widget.step || 1;
            const min = this.widget.min || 0;
            this.value = Math.max(min, this.value - step);
            this.onChange();
        },
        stepUp() {
            const step = this.widget.step || 1;
            const max = this.widget.max || 100;
            this.value = Math.min(max, this.value + step);
            this.onChange();
        }
    }
};
