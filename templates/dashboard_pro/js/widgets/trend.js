const TrendWidget = {
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
            { key: 'interval', label: 'Интервал обновления (сек)', type: 'number', default: 30 },
            { key: 'round', label: 'Округление', type: 'number', placeholder: '1' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-chart-line', icon_type: 'icon', property: 'value', interval: 30, round: 1 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Тренд' }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px;display:flex;align-items:center;gap:12px;flex:1">
                <div style="text-align:center;flex:1">
                    <div :style="'font-size:2rem;font-weight:300;color:' + trendColor">{{ displayValue }}</div>
                    <div style="font-size:.7rem;color:rgba(255,255,255,.4)">{{ widget.object || '' }}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <i v-if="trend === 'up'" class="fas fa-arrow-up" style="color:#22c55e;font-size:1.5rem"></i>
                    <i v-else-if="trend === 'down'" class="fas fa-arrow-down" style="color:#ef4444;font-size:1.5rem"></i>
                    <i v-else class="fas fa-minus" style="color:#64748b;font-size:1.2rem"></i>
                    <span v-if="change !== null" :style="'font-size:.75rem;' + (change >= 0 ? 'color:#22c55e' : 'color:#ef4444')">{{ change >= 0 ? '+' : '' }}{{ change.toFixed(1) }}</span>
                </div>
            </div>
            <canvas ref="sparkline" style="height:40px;width:100%;margin-top:auto"></canvas>
        </div>`,
    data() {
        return { value: null, prevValue: null, history: [], timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        displayValue() {
            if (this.value === null) return '--';
            const n = parseFloat(this.value);
            if (!isNaN(n)) return this.widget.round !== undefined ? n.toFixed(this.widget.round) : n.toFixed(1);
            return this.value;
        },
        trend() {
            if (this.value === null || this.prevValue === null) return 'flat';
            const diff = parseFloat(this.value) - parseFloat(this.prevValue);
            if (diff > 0.5) return 'up';
            if (diff < -0.5) return 'down';
            return 'flat';
        },
        change() {
            if (this.value === null || this.prevValue === null) return null;
            return parseFloat(this.value) - parseFloat(this.prevValue);
        },
        trendColor() {
            if (this.trend === 'up') return '#22c55e';
            if (this.trend === 'down') return '#ef4444';
            return 'rgba(255,255,255,.87)';
        }
    },
    mounted() {
        this.load();
        if (this.widget.object) this.timer = setInterval(() => this.load(), (this.widget.interval || 30) * 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async load() {
            if (!this.widget.object) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property || 'value' }));
                if (!d.error && d.value !== undefined) {
                    if (this.value !== null) this.prevValue = this.value;
                    this.value = parseFloat(d.value);
                    this.history.push(this.value);
                    if (this.history.length > 30) this.history.shift();
                    this.draw();
                }
            } catch(e) {}
        },
        draw() {
            const canvas = this.$refs.sparkline;
            if (!canvas || this.history.length < 2) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.offsetWidth, h = canvas.offsetHeight;
            canvas.width = w; canvas.height = h;
            const min = Math.min(...this.history), max = Math.max(...this.history);
            const range = max - min || 1;
            ctx.clearRect(0, 0, w, h);
            ctx.beginPath();
            ctx.strokeStyle = this.trendColor;
            ctx.lineWidth = 1.5;
            this.history.forEach((v, i) => {
                const x = (i / (this.history.length - 1)) * w;
                const y = h - ((v - min) / range) * (h - 4) - 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
    }
};
