const SelectWidget = {
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
            { key: 'help', type: 'info', text: 'Формат: [{"label":"...", "value":"...", "icon":"..."}]' },
            { key: 'options', label: 'Варианты (JSON)', type: 'textarea', rows: 4, placeholder: '[{"label":"Вкл","value":"1","icon":"fas fa-check"}]' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-list', icon_type: 'icon', options: JSON.stringify([{label:'Вкл',value:'1'},{label:'Выкл',value:'0'}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Выбор' }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px;flex:1;display:flex;flex-direction:column;gap:6px">
                <div v-for="opt in options" :key="opt.value" class="v-btn v-btn--outlined theme--dark" :class="{ 'primary': currentValue == opt.value }" :style="{background: currentValue == opt.value ? 'var(--primary)' : 'transparent', borderColor: currentValue == opt.value ? 'var(--primary)' : 'rgba(255,255,255,.23)'}" @click="select(opt.value)">
                    <span class="v-btn__content" style="font-size:.8rem;gap:6px">
                        <i v-if="opt.icon" :class="opt.icon"></i>
                        {{ opt.label }}
                    </span>
                </div>
            </div>
        </div>`,
    data() {
        return { currentValue: null, loading: false, timer: null };
    },
    computed: {
        options() {
            if (!this.widget.options) return [];
            try {
                const opts = typeof this.widget.options === 'string' ? JSON.parse(this.widget.options) : this.widget.options;
                return Array.isArray(opts) ? opts : [];
            } catch(e) { return []; }
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        let prop = this.widget.property;
        if (obj && prop) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async loadValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (!d.error && d.value !== undefined) this.currentValue = d.value;
            } catch (e) { /* silent */ }
        },
        async select(val) {
            if (this.loading || this.currentValue == val) return;
            this.loading = true;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: prop || 'status', value: String(val) }));
                this.currentValue = val;
            } catch (e) { /* silent */ }
            this.loading = false;
        }
    }
};