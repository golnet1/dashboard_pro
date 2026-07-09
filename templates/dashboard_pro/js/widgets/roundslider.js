const RoundSliderWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
            { key: 'min', label: 'field_min', type: 'number', default: 0, row: 'range' },
            { key: 'max', label: 'field_max', type: 'number', default: 100, row: 'range' },
            { key: 'step', label: 'field_step', type: 'number', default: 1, row: 'range' },
            { key: 'unit', label: 'field_unit', type: 'text', placeholder: 'ph_percent' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-circle', icon_type: 'icon', min: 0, max: 100, step: 1, unit: '%' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_roundslider') }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px;overflow:hidden;position:relative">
                <canvas ref="canvas" style="width:100%;height:100%;cursor:pointer" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag"></canvas>
                <div style="position:absolute;font-size:1.2rem;font-weight:500;color:rgba(255,255,255,.87);pointer-events:none">{{ displayValue }}{{ widget.unit || '' }}</div>
            </div>
        </div>`,
    data() { return { currentValue: null, dragging: false, timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        min() { return this.widget.min !== undefined ? Number(this.widget.min) : 0; },
        max() { return this.widget.max !== undefined ? Number(this.widget.max) : 100; },
        step() { return this.widget.step !== undefined ? Number(this.widget.step) : 1; },
        displayValue() {
            if (this.currentValue === null) return '—';
            return Math.round(this.currentValue * 10) / 10;
        },
        pct() {
            if (this.currentValue === null) return 0;
            return ((this.currentValue - this.min) / (this.max - this.min)) * 100;
        }
    },
    mounted() {
        this.load();
        this.$nextTick(() => this.draw());
        const obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.load(), 5000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async load() {
            const obj = this.widget.object_value || this.widget.object;
            const prop = this.widget.property;
            if (!obj) { this.currentValue = this.widget.value !== undefined ? Number(this.widget.value) : 50; this.draw(); return; }
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop || 'level' }));
                if (!d.error && d.value !== undefined) { this.currentValue = Number(d.value); this.draw(); }
            } catch(e) { if (this.currentValue === null) this.currentValue = 50; this.draw(); }
        },
        draw() {
            const canvas = this.$refs.canvas;
            if (!canvas) return;
            const rect = this.$el.getBoundingClientRect();
            const size = Math.min(rect.width - 24, rect.height - 80);
            canvas.width = size * 2;
            canvas.height = size * 2;
            const ctx = canvas.getContext('2d');
            const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
            const pct = this.pct;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,.1)';
            ctx.lineWidth = 12;
            ctx.stroke();

            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (pct / 100) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(66,165,245,.8)';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.stroke();

            const ha = endAngle;
            ctx.beginPath();
            ctx.arc(cx + r * Math.cos(ha), cy + r * Math.sin(ha), 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(66,165,245,1)';
            ctx.fill();
        },
        getAngle(e) {
            const canvas = this.$refs.canvas;
            if (!canvas) return 0;
            const rect = canvas.getBoundingClientRect();
            const cx2 = rect.left + rect.width / 2, cy2 = rect.top + rect.height / 2;
            const dx = e.clientX - cx2, dy = e.clientY - cy2;
            let a = Math.atan2(dy, dx) + Math.PI / 2;
            if (a < 0) a += Math.PI * 2;
            return a;
        },
        startDrag(e) { this.dragging = true; this.onDrag(e); },
        onDrag(e) {
            if (!this.dragging) return;
            const a = this.getAngle(e);
            const pct = Math.max(0, Math.min(100, (a / (Math.PI * 2)) * 100));
            const val = this.min + (pct / 100) * (this.max - this.min);
            const stepped = Math.round(val / this.step) * this.step;
            this.currentValue = Math.max(this.min, Math.min(this.max, stepped));
            this.draw();
        },
        endDrag() {
            if (!this.dragging) return;
            this.dragging = false;
            const obj = this.widget.object_value || this.widget.object;
            const prop = this.widget.property;
            if (obj && prop && this.currentValue !== null) {
                dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: prop, value: String(this.currentValue) }));
            }
        }
    }
};
