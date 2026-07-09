const AnalogClockWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-clock', icon_type: 'icon' },
    template: `
        <div class="widget-v-card" :style="cardStyle" ref="clockWrap">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Часы' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px;overflow:hidden">
                <canvas ref="canvas" style="width:100%;height:100%"></canvas>
            </div>
        </div>`,
    data() { return { timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.draw();
        this.timer = setInterval(() => this.draw(), 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        draw() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const rect = this.$el.getBoundingClientRect();
            const size = Math.min(rect.width - 24, rect.height - 80);
            canvas.width = size * 2;
            canvas.height = size * 2;
            const ctx = canvas.getContext('2d');
            const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            for (let i = 0; i < 12; i++) {
                const a = (i * 30 - 90) * Math.PI / 180;
                const inner = i % 3 === 0 ? r * 0.85 : r * 0.92;
                ctx.beginPath();
                ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
                ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
                ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)';
                ctx.lineWidth = i % 3 === 0 ? 3 : 1;
                ctx.stroke();
            }

            const now = new Date();
            const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
            const ha = (h * 30 + m * 0.5 - 90) * Math.PI / 180;
            const ma = (m * 6 + s * 0.1 - 90) * Math.PI / 180;
            const sa = (s * 6 - 90) * Math.PI / 180;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * 0.5 * Math.cos(ha), cy + r * 0.5 * Math.sin(ha));
            ctx.strokeStyle = 'rgba(255,255,255,.85)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * 0.7 * Math.cos(ma), cy + r * 0.7 * Math.sin(ma));
            ctx.strokeStyle = 'rgba(255,255,255,.65)';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + r * 0.8 * Math.cos(sa), cy + r * 0.8 * Math.sin(sa));
            ctx.strokeStyle = 'rgba(255,100,100,.7)';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,.85)';
            ctx.fill();
        }
    }
};
