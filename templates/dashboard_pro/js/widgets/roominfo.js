const RoomInfoWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'help', type: 'info', text: 'Укажите датчики в формате JSON: [{"object":"obj1","label":"Темп.","icon":"fas fa-thermometer-half","suffix":"°C"},{"object":"obj2","label":"Влажность","icon":"fas fa-tint","suffix":"%"}]' },
            { key: 'sensors', label: 'Датчики (JSON)', type: 'textarea', rows: 4 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-home', icon_type: 'icon', sensors: JSON.stringify([{object:'',label:'',icon:'',suffix:''}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Помещение' }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-wrap:wrap;gap:8px">
                <div v-for="(item,i) in items" :key="i" style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(255,255,255,.08);border-radius:6px">
                    <i v-if="item.icon" :class="item.icon" style="font-size:.85rem;color:rgba(255,255,255,.5)"></i>
                    <span style="font-size:.75rem;color:rgba(255,255,255,.5)">{{ item.label }}</span>
                    <span style="font-size:.85rem;font-weight:500;color:rgba(255,255,255,.87)">{{ item.value || '--' }}</span>
                </div>
                <div v-if="items.length === 0" style="color:rgba(255,255,255,.3);font-size:.8rem;width:100%;text-align:center">Настройте объекты</div>
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
