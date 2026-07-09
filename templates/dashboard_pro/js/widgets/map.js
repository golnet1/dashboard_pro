const MapWidget = {
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
            { key: 'lat', label: 'Широта', type: 'text', placeholder: '55.75', row: 'coord' },
            { key: 'lon', label: 'Долгота', type: 'text', placeholder: '37.62', row: 'coord' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-map-marker-alt', icon_type: 'icon', lat: '', lon: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Карта' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px;overflow:hidden">
                <canvas ref="canvas" style="width:100%;height:100%"></canvas>
                <div v-if="coordStr" style="position:absolute;bottom:8px;left:8px;right:8px;font-size:.75rem;color:rgba(255,255,255,.5);text-align:center;pointer-events:none">{{ coordStr }}</div>
            </div>
        </div>`,
    data() { return { lat: null, lon: null, timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        coordStr() {
            if (this.lat !== null && this.lon !== null) return this.lat.toFixed(4) + ', ' + this.lon.toFixed(4);
            if (this.widget.lat && this.widget.lon) return this.widget.lat + ', ' + this.widget.lon;
            return '';
        }
    },
    mounted() {
        this.load();
        const obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.load(), 30000);
        this.$nextTick(() => this.drawMap());
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async load() {
            const obj = this.widget.object_value || this.widget.object;
            const prop = this.widget.property;
            if (!obj) {
                this.lat = parseFloat(this.widget.lat) || null;
                this.lon = parseFloat(this.widget.lon) || null;
                this.drawMap();
                return;
            }
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop || 'coordinates' }));
                if (!d.error && d.value) {
                    const parts = String(d.value).split(/[,;:\s]+/);
                    if (parts.length >= 2) {
                        this.lat = parseFloat(parts[0]);
                        this.lon = parseFloat(parts[1]);
                        this.drawMap();
                    }
                }
            } catch(e) {}
        },
        drawMap() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const rect = this.$el.getBoundingClientRect();
            const w = (rect.width - 16) * 2, h = (rect.height - 16) * 2;
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            ctx.fillStyle = 'rgba(255,255,255,.06)';
            ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(255,255,255,.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const y = (h / 5) * (i + 1);
                const x = (w / 5) * (i + 1);
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }

            const lat = this.lat !== null ? this.lat : (parseFloat(this.widget.lat) || 55.75);
            const lon = this.lon !== null ? this.lon : (parseFloat(this.widget.lon) || 37.62);
            const cx = w / 2, cy = h / 2;

            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239,68,68,.8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(239,68,68,1)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '10px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,.5)';
            ctx.textAlign = 'center';
            ctx.fillText('● ' + lat.toFixed(2) + ', ' + lon.toFixed(2), cx, cy - 16);
        }
    }
};
