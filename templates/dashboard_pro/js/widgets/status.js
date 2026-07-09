const StatusWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object_status', label: 'Объект статуса', type: 'object', row: 'status_row' },
            { key: 'property_status', label: 'Свойство (статус)', type: 'property', row: 'status_row' },
            { key: 'statuses', label: 'Статусы (JSON)', type: 'textarea', rows: 3, placeholder: '[{"status":"0","title":"Выкл","icon":"fas fa-power-off","color":"#ef4444"},{"status":"1","title":"Вкл","icon":"fas fa-check","color":"#22c55e"}]' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
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
