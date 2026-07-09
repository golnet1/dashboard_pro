const StatusWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object_status', label: 'Объект статуса', type: 'object', row: 'status_row' },
            { key: 'property_status', label: 'Свойство (статус)', type: 'property', row: 'status_row' },
            { key: 'statuses', label: 'Статусы (JSON)', type: 'textarea', rows: 3, placeholder: '[{"status":"0","title":"Выкл","icon":"fas fa-power-off","color":"#ef4444"},{"status":"1","title":"Вкл","icon":"fas fa-check","color":"#22c55e"}]' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-info-circle', icon_type: 'icon', statuses: JSON.stringify([{status:'0',title:'Выкл',icon:'fas fa-power-off',color:'#ef4444'},{status:'1',title:'Вкл',icon:'fas fa-check',color:'#22c55e'}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Статус' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;gap:12px;padding:8px 12px;flex:1">
                <i v-if="statusIcon" :class="statusIcon" :style="'font-size:2rem;color:' + (statusColor || 'rgba(255,255,255,.6)')"></i>
                <div v-if="statusText" style="font-size:1.1rem;font-weight:500;color:rgba(255,255,255,.87)">{{ statusText }}</div>
                <div v-else style="font-size:.85rem;color:rgba(255,255,255,.5)">Нет данных</div>
            </div>
        </div>`,
    data() { return { value: null, timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        statuses() {
            try { return JSON.parse(this.widget.statuses || '[]'); } catch { return []; }
        },
        status() {
            if (this.value === null) return null;
            const v = parseFloat(this.value);
            return this.statuses.find(s => {
                const low = parseFloat(s.status);
                const high = s.status2 !== undefined && s.status2 !== '' ? parseFloat(s.status2) : NaN;
                if (!isNaN(high)) return v >= low && v <= high;
                return v >= low;
            }) || null;
        },
        statusIcon() { return this.status ? this.status.icon : (this.widget.icon || null); },
        statusColor() { return this.status ? this.status.color : null; },
        statusText() { return this.status ? this.status.title : (this.value !== null ? this.value : null); }
    },
    mounted() {
        this.load();
        const obj = this.widget.object_status || this.widget.object;
        if (obj) this.timer = setInterval(() => this.load(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load() {
            const obj = this.widget.object_status || this.widget.object;
            const prop = this.widget.property_status || this.widget.property;
            if (!obj) return;
            try {
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined) this.value = d.value;
            } catch(e) {}
        }
    }
};
