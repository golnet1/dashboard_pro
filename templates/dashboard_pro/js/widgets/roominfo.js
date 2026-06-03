const RoomInfoWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'help', type: 'info', text: 'Укажите датчики в формате JSON: [{"object":"obj1","label":"Темп.","icon":"fas fa-thermometer-half","suffix":"°C"},{"object":"obj2","label":"Влажность","icon":"fas fa-tint","suffix":"%"}]' },
            { key: 'sensors', label: 'Датчики (JSON)', type: 'textarea', rows: 4 },
        ],
    },
    defaults: { icon: 'fas fa-home', sensors: JSON.stringify([{object:'',label:'',icon:'',suffix:''}]) },
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
