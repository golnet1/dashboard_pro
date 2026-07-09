const ThermostatWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
            { key: 'object_current', label: 'Объект текущей температуры', type: 'object', row: 'temp_current' },
            { key: 'property_current', label: 'Свойство (текущ)', type: 'property', row: 'temp_current' },
            { key: 'object_target', label: 'Объект целевой температуры', type: 'object', row: 'temp_target' },
            { key: 'property_target', label: 'Свойство (цель)', type: 'property', row: 'temp_target' },
            { key: 'object_status', label: 'Объект статуса', type: 'object', row: 'temp_status' },
            { key: 'property_status', label: 'Свойство (статус)', type: 'property', row: 'temp_status' },
            { key: 'min', label: 'Мин', type: 'number', default: 5, row: 'range' },
            { key: 'max', label: 'Макс', type: 'number', default: 35, row: 'range' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-thermometer-half', icon_type: 'icon', min: 5, max: 35 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Термостат' }}</div>
                <div class="widget-v-card__spacer"></div>
                <span :style="'font-size:.72rem;padding:2px 8px;border-radius:10px;' + (isOn ? 'background:rgba(239,68,68,.2);color:#ef4444' : 'background:rgba(100,116,139,.2);color:#64748b')">{{ isOn ? 'ON' : 'OFF' }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="display:flex;align-items:center;gap:16px">
                    <button @click="adjustTarget(-1)" :disabled="loading" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
                    <div style="text-align:center">
                        <div style="font-size:2.2rem;font-weight:300;color:rgba(255,255,255,.87)">{{ target }}</div>
                        <div style="font-size:.7rem;color:rgba(255,255,255,.4)">°C</div>
                    </div>
                    <button @click="adjustTarget(1)" :disabled="loading" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
                </div>
                <div v-if="currentTemp !== null" style="font-size:.8rem;color:rgba(255,255,255,.5)">Сейчас: {{ currentTemp }}°C</div>
            </div>
        </div>`,
    data() {
        return { target: 22, currentTemp: null, isOn: false, loading: false, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.load();
        this.timer = setInterval(() => this.load(), 10000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load() {
            if (this.widget.object_current) {
                try {
                    const params = this.widget.property_current ? { object: this.widget.object_current, property: this.widget.property_current } : { object: this.widget.object_current };
                    const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                    if (!d.error && d.value !== undefined) this.currentTemp = parseFloat(d.value);
                } catch(e) {}
            }
            if (this.widget.object_target) {
                try {
                    const params = this.widget.property_target ? { object: this.widget.object_target, property: this.widget.property_target } : { object: this.widget.object_target };
                    const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                    if (!d.error && d.value !== undefined) this.target = parseFloat(d.value) || 22;
                } catch(e) {}
            }
            if (this.widget.object_status) {
                try {
                    const params = this.widget.property_status ? { object: this.widget.object_status, property: this.widget.property_status } : { object: this.widget.object_status };
                    const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                    if (!d.error) this.isOn = String(d.value) === '1' || String(d.value) === 'ON';
                } catch(e) {}
            }
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
                } catch(e) {}
            }
            this.loading = false;
        }
    }
};
