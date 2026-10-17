const GaugeWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
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
            { key: 'minValue', label: 'field_min', type: 'number', row: 'range' },
            { key: 'maxValue', label: 'field_max', type: 'number', row: 'range' },
            { key: 'round', label: 'field_rounding', type: 'number', placeholder: '0' },
            { key: 'unit', label: 'field_unit', type: 'text', placeholder: 'ph_percent' },
            { key: 'thickness', label: 'field_thickness', type: 'number', step: 'any', placeholder: '10' },
            { key: 'colors', label: 'field_gradient_colors', type: 'textarea', rows: 2, placeholder: '[{"color":"#a9d70b"},{"color":"#f9c802"},{"color":"#ff0000"}]' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-gauge-high', icon_type: 'icon', minValue: 0, maxValue: 100, round: 0, height: 180, unit: '', thickness: 10, colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]) },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column;align-items:center">
            <div v-if="showIcon || widget.title" class="widget-v-card__header" style="align-self:stretch;justify-content:center">
                <img v-if="iconSrc" class="widget-v-card__icon widget-v-card__icon--img" :src="iconSrc" alt="">
                <i v-else-if="showIcon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div v-if="widget.title" class="widget-v-card__title">{{ widget.title }}</div>
            </div>
            <div class="widget-v-card__body" style="align-items:center;justify-content:center;min-height:0" :style="bodyStyle">
                <svg viewBox="4 4 112 112" style="flex:1;width:100%;height:100%">
                    <circle cx="60" cy="60" :r="ringRadius" fill="none" stroke="rgba(255,255,255,.1)" :stroke-width="strokeWidth"/>
                    <circle cx="60" cy="60" :r="ringRadius" fill="none" :stroke="gaugeColor" :stroke-width="strokeWidth" stroke-linecap="round"
                        :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset"
                        transform="rotate(-90, 60, 60)" style="transition: stroke-dashoffset .5s"/>
                    <text x="60" :y="valueY" text-anchor="middle" fill="rgba(255,255,255,.87)" font-size="14" font-weight="700">{{ displayValue }}</text>
                    <text x="60" :y="unitY" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" v-if="widget.unit">{{ widget.unit }}</text>
                </svg>
            </div>
        </div>`,
    data() {
        return { value: null, timer: null };
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        if (obj && !window.__dpWsLive) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        /* The icon stands in front of the title: a Font Awesome class when the type
           is "icon", or the picture the mixin resolved from a url or a property. */
        showIcon() {
            return this.iconType === 'icon' ? !!this.widget.icon : !!this.iconSrc;
        },
        /* The card body is a flex item, and its automatic minimum size would be the
           height the square ring asks for, so with "flex:1" alone the ring grew past
           the card and was cut by "overflow:hidden" (200 px tall in a 180 px card).
           min-height:0 (set in the template) keeps the body inside the card, the svg
           fills the body, and the ring takes the smaller side of it. The viewBox is
           tightened to the outer edge of the band (55 units from the centre, whatever
           the thickness) so that the ring reaches the edge of the widget instead of
           the 8 percent that the old 0 0 120 120 box left around it. The number and
           the unit are drawn in viewBox units, so they scale together with the ring. */
        bodyStyle() {
            return (this.showIcon || this.widget.title) ? { padding: '0 12px 12px' } : { padding: '0' };
        },
        /* The band keeps its outer edge in place: a thicker ring grows inwards, so the
           outer size of the gauge and the text inside it do not change. The radius
           that is left for the hole is 55 - thickness, hence the cap: past 30 the
           number and the unit would run into the band. */
        strokeWidth() {
            const v = Number(this.widget.thickness);
            if (!isFinite(v) || v <= 0) return 10;
            return Math.min(30, Math.max(2, v));
        },
        ringRadius() {
            return 55 - this.strokeWidth / 2;
        },
        circumference() {
            return 2 * Math.PI * this.ringRadius;
        },
        /* The number and the unit sit in the middle of the circle, the unit right
           under the number. The title no longer goes inside the circle: it is drawn
           above it, so the value is centred on the ring and not pushed down. */
        valueY() {
            return this.widget.unit ? 58 : 65;
        },
        unitY() {
            return 70;
        },
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

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.gauge = GaugeWidget;
