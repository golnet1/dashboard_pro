const BarGraphWidget = {
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
            { key: 'days', label: 'Дней истории', type: 'number', default: 1 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-chart-bar', icon_type: 'icon', days: 1 },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Бар-график' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:4px;overflow:hidden">
                <canvas ref="canvas" style="width:100%;height:100%"></canvas>
            </div>
        </div>`,
    data() { return { points: [], timer: null, loading: false }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.fetchData();
        this.timer = setInterval(() => this.fetchData(), 60000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async fetchData() {
            const obj = this.widget.object_value || this.widget.object;
            if (!obj || this.loading) return;
            this.loading = true;
            try {
                const days = this.widget.days || 1;
                const d = await dpAPI('history?' + new URLSearchParams({ object: obj, days: String(days) }));
                if (!d.error && Array.isArray(d.data)) {
                    const buckets = {};
                    d.data.forEach(p => {
                        const h = new Date(p.timestamp * 1000).getHours();
                        buckets[h] = (buckets[h] || 0) + parseFloat(p.value);
                    });
                    const keys = Object.keys(buckets).sort((a,b) => a - b);
                    this.points = keys.map(k => ({ label: k + 'h', value: buckets[k] / (d.data.filter(p => new Date(p.timestamp * 1000).getHours() === Number(k)).length || 1) }));
                    this.draw();
                }
            } catch(e) {}
            this.loading = false;
        },
        draw() {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.points.length) return;
            const rect = this.$el.getBoundingClientRect();
            canvas.width = (rect.width - 8) * 2;
            canvas.height = (rect.height - 8) * 2;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const values = this.points.map(p => p.value);
            const max = Math.max(...values) || 1;
            const pad = 20, gap = 4;
            const barW = (w - pad * 2) / this.points.length - gap;

            this.points.forEach((p, i) => {
                const x = pad + i * ((w - pad * 2) / this.points.length) + gap / 2;
                const bh = ((p.value || 0) / max) * (h - pad * 2);
                ctx.fillStyle = 'rgba(66,165,245,.7)';
                ctx.fillRect(x, h - pad - bh, barW, bh);
                ctx.fillStyle = 'rgba(255,255,255,.4)';
                ctx.font = Math.round(barW * 0.4) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.label, x + barW / 2, h - 4);
            });
        }
    }
};
