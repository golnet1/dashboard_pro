const GaugeWidget = {
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
            { key: 'minValue', label: 'Мин', type: 'number', row: 'range' },
            { key: 'maxValue', label: 'Макс', type: 'number', row: 'range' },
            { key: 'round', label: 'Округление', type: 'number', placeholder: '0' },
            { key: 'doughnut', label: 'Пончик (кольцо)', type: 'checkbox' },
            { key: 'colors', label: 'Цвета градиента (JSON)', type: 'textarea', rows: 2, placeholder: '[{"color":"#a9d70b"},{"color":"#f9c802"},{"color":"#ff0000"}]' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-gauge-high', icon_type: 'icon', minValue: 0, maxValue: 100, round: 0, doughnut: false, colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
            <svg viewBox="0 0 120 120" style="width:80%;max-width:200px;flex:1">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="10"/>
                <circle cx="60" cy="60" r="50" fill="none" :stroke="gaugeColor" stroke-width="10" stroke-linecap="round"
                    :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset"
                    transform="rotate(-90, 60, 60)" style="transition: stroke-dashoffset .5s"/>
                <text x="60" y="55" text-anchor="middle" fill="rgba(255,255,255,.87)" font-size="14" font-weight="700">{{ displayValue }}</text>
                <text x="60" y="72" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="6" v-if="widget.unit">{{ widget.unit }}</text>
            </svg>
            <div v-if="widget.title" style="font-size:.8rem;color:rgba(255,255,255,.6);margin-top:2px;text-align:center">{{ widget.title }}</div>
        </div>`,
    data() {
        return { value: null, timer: null, circumference: 2 * Math.PI * 50 };
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        displayValue() {
            if (this.value === null) return '—';
            const r = this.widget.round != null ? Number(this.widget.round) : 0;
            return Number(this.value).toFixed(r);
        },
        minVal() { return this.widget.minValue != null ? Number(this.widget.minValue) : 0; },
        maxVal() { return this.widget.maxValue != null ? Number(this.widget.maxValue) : 100; },
        fraction() {
            if (this.value === null) return 0;
            const range = this.maxVal - this.minVal;
            if (range === 0) return 0;
            return Math.min(1, Math.max(0, (this.value - this.minVal) / range));
        },
        dashOffset() {
            return this.circumference * (1 - this.fraction);
        },
        gaugeColor() {
            if (this.widget.colors) {
                try {
                    const colors = typeof this.widget.colors === 'string' ? JSON.parse(this.widget.colors) : this.widget.colors;
                    if (Array.isArray(colors) && colors.length) {
                        const idx = Math.min(Math.floor(this.fraction * colors.length), colors.length - 1);
                        return colors[idx].color || 'var(--primary)';
                    }
                } catch(e) {}
            }
            return 'var(--primary)';
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    this.value = Number(d.value);
                }
            } catch (e) { /* silent */ }
        }
    }
};