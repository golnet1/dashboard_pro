const RoomInfoWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'help', type: 'info', text: 'help_sensors_format' },
            { key: 'sensors', label: 'field_sensors_json', type: 'textarea', rows: 4 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-home', icon_type: 'icon', sensors: JSON.stringify([{object:'',label:'',icon:'',suffix:''}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_roominfo') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-wrap:wrap;gap:8px">
                <div v-for="(item,i) in items" :key="i" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(255,255,255,.08);border-radius:6px">
                    <i v-if="item.icon" :class="item.icon" style="font-size:.85rem;color:rgba(255,255,255,.5)"></i>
                    <span style="font-size:.75rem;color:rgba(255,255,255,.5)">{{ item.label }}</span>
                    <span style="font-size:.85rem;font-weight:500;color:rgba(255,255,255,.87)">{{ item.value || '--' }}</span>
                </div>
                <div v-if="items.length === 0" style="color:rgba(255,255,255,.3);font-size:.8rem;width:100%;text-align:center"{{ t('no_data') }}</div>
            </div>
        </div>`,
    data() {
        return { values: {}, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        sensors() {
            try { return JSON.parse(this.widget.sensors || '[]'); } catch { return []; }
        },
        items() {
            return this.sensors.map(s => ({
                icon: s.icon,
                label: s.label || s.object,
                value: this.values[s.object] !== undefined ? this.values[s.object] + (s.suffix || '') : null
            }));
        }
    },
    mounted() {
        this.loadAll();
        this.timer = setInterval(() => this.loadAll(), 10000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load(sensor) {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: sensor.object, property: sensor.property || 'value' }));
                if (!d.error) this.values[sensor.object] = d.value;
            } catch(e) {}
        },
        async loadAll() {
            for (const s of this.sensors) await this.load(s);
        }
    }
};
