const GraphWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'days', label: 'Дней истории', type: 'number', default: 1 },
        ],
    },
    defaults: { icon: 'fas fa-chart-line', days: 1 },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'График' }}</div>
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
                    this.points = d.data.slice(-100);
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

            const values = this.points.map(p => parseFloat(p.value)).filter(v => !isNaN(v));
            if (!values.length) return;
            const min = Math.min(...values), max = Math.max(...values);
            const range = max - min || 1;
            const pad = 20;

            ctx.strokeStyle = 'rgba(66,165,245,.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            values.forEach((v, i) => {
                const x = pad + (i / (values.length - 1)) * (w - pad * 2);
                const y = h - pad - ((v - min) / range) * (h - pad * 2);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            ctx.fillStyle = 'rgba(66,165,245,.1)';
            ctx.lineTo(pad + (w - pad * 2), h - pad);
            ctx.lineTo(pad, h - pad);
            ctx.closePath();
            ctx.fill();
        }
    }
};
