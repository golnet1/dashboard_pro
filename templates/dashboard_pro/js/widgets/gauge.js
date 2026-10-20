const GaugeWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'colors', label: 'tab_colors' },
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
            { key: 'round', label: 'field_rounding', type: 'number', row: 'round_unit_thick', placeholder: '0' },
            { key: 'unit', label: 'field_unit', type: 'text', row: 'round_unit_thick', placeholder: 'ph_percent' },
            { key: 'thickness', label: 'field_thickness', type: 'number', step: 'any', row: 'round_unit_thick', placeholder: '10' },
            { key: 'donut', label: 'field_donut', type: 'switch', default: true },
            /* The gradient of the arc lives in the system "colours" section: the tab
               above carries its key and nothing else, and the core edits the "colors"
               property of the widget (the palette is kept in the defaults below). */
        ],
        advanced: [
            { key: 'refresh_interval', label: 'field_refresh_interval', type: 'number', row: 'refresh_row', step: 1 },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            /* «Открывать историю» — как в Mboard: клик по виджету открывает общий
               диалог истории значения (см. window.dpHistory в js/dpdialog.js).
               Цвет линии нужен только при включённом выключателе, поэтому он
               показывается по showIf, но остаётся в том же ряду. */
            { key: 'view_history', label: 'field_view_history', type: 'switch', row: 'hist_row', default: false },
            { key: 'history_color', label: 'field_history_color', type: 'color', row: 'hist_row', showIf: { view_history: true } },
        ],
    },
    defaults: { icon: 'fas fa-gauge-high', icon_type: 'icon', minValue: 0, maxValue: 100, round: 0, height: 180, unit: '', thickness: 10, donut: true, view_history: false, history_color: '#1976d2', colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]) },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--clickable': widget.view_history }" :style="cardStyle" @click="onCardClick" style="display:flex;flex-direction:column;align-items:center">
            <div v-if="showIcon || widget.title" class="widget-v-card__header" style="align-self:stretch;justify-content:center">
                <img v-if="iconSrc" class="widget-v-card__icon widget-v-card__icon--img" :src="iconSrc" alt="">
                <i v-else-if="showIcon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div v-if="widget.title" class="widget-v-card__title">{{ widget.title }}</div>
            </div>
            <div class="widget-v-card__body" style="align-items:center;justify-content:center;min-height:0" :style="bodyStyle">
                <svg :viewBox="viewBox" style="flex:1;width:100%;height:100%">
                    <circle cx="60" cy="60" :r="ringRadius" fill="none" stroke="rgba(255,255,255,.1)" :stroke-width="strokeWidth"
                        :stroke-dasharray="backgroundDash" :transform="ringRotation"/>
                    <circle cx="60" cy="60" :r="ringRadius" fill="none" :stroke="gaugeColor" :stroke-width="strokeWidth" :stroke-linecap="ringCap"
                        :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset"
                        :transform="ringRotation" style="transition: stroke-dashoffset .5s"/>
                    <text x="60" :y="valueY" text-anchor="middle" fill="rgba(255,255,255,.87)" font-size="14" font-weight="700">{{ displayValue }}</text>
                    <text x="60" :y="unitY" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" v-if="widget.unit && isDonut">{{ widget.unit }}</text>
                    <text :x="scaleMinX" :y="scaleY" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" v-if="!isDonut">{{ minLabel }}</text>
                    <text x="60" :y="scaleY" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" v-if="!isDonut && widget.unit">{{ widget.unit }}</text>
                    <text :x="scaleMaxX" :y="scaleY" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" v-if="!isDonut">{{ maxLabel }}</text>
                </svg>
            </div>
        </div>`,
    data() {
        return { value: null, timer: null };
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadValue(), window.__dpPollInterval(this.widget, 5));
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
        /* The «Пончик» switch keeps the full ring when it is on (the old look) and
           leaves only the upper half when it is off, from nine to three o'clock.
           Widgets saved before the switch existed have no "donut" key at all, and a
           key saved as 0 or an empty string must not halve the ring either: only an
           explicit "off" does. */
        isDonut() {
            const v = this.widget.donut;
            return !(v === false || v === 0 || v === '0' || v === 'false');
        },
        /* The end of the arc: a full ring is capped round at both ends, the way it
           always was, while a half ring is cut flat. A round cap would hang below the
           nine and three o'clock points (it is a half disc of the thickness, centred
           on the end of the path), and the coloured part would then stick out past
           the flat end of the background band. The flat cut is perpendicular to the
           path, so at those two points, where the tangent is vertical, it lies right
           on the base line. */
        ringCap() {
            return this.isDonut ? 'round' : 'butt';
        },
        /* The share of the circle the band covers: all of it, or the upper half. */
        arcSpan() {
            return this.isDonut ? 1 : 0.5;
        },
        /* A full ring starts at twelve o'clock and is filled clockwise; a half ring
           starts at nine o'clock so that the arc opens upwards. */
        ringRotation() {
            return this.isDonut ? 'rotate(-90, 60, 60)' : 'rotate(-180, 60, 60)';
        },
        /* The background is the same band, drawn only for the covered share. */
        backgroundDash() {
            return this.circumference * this.arcSpan;
        },
        /* A half ring takes a shorter box: only the band above the base line, whose
           ends are cut flat, plus the room the scale line needs under it. */
        viewBox() {
            return this.isDonut ? '4 4 112 112' : '4 4 112 70';
        },
        /* The scale line under the half ring: the numbers sit under the middle of the
           band's cut at either end — the flat bottom of the ring runs from the outer
           edge (x = 5) inwards by the thickness, so the number is centred on that stub
           — and the unit keeps the middle of the line. */
        scaleY() {
            return 70;
        },
        scaleMinX() {
            return 5 + this.strokeWidth / 2;
        },
        scaleMaxX() {
            return 115 - this.strokeWidth / 2;
        },
        minLabel() {
            return String(this.minVal);
        },
        maxLabel() {
            return String(this.maxVal);
        },
        /* In the full ring the number and the unit sit in the middle of the ring, the
           unit right under the number; the value is moved up by a couple of units so
           that the pair looks centred. In the half ring the unit has moved to the scale
           line under the ring, so the number stands alone and is put low, just above
           the flat bottom — level with the points where the band begins and ends. The
           title no longer goes inside the circle: it is drawn above it. */
        valueY() {
            if (this.isDonut) return this.widget.unit ? 58 : 65;
            return 58;
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
            return this.circumference * (1 - this.arcSpan * this.fraction);
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
        },
        /* История значения — только при включённом выключателе «Открывать историю».
           В режиме правки панели клик по карточке двигает виджет, поэтому там диалог
           не открывается. Сам диалог и запрос данных живут в js/dpdialog.js. */
        onCardClick() {
            if (!this.widget.view_history) return;
            if (document.querySelector('.main.edit-mode')) return;
            if (typeof window.dpHistory !== 'function') return;
            const object = this.widget.object_value || this.widget.object;
            const property = this.widget.property;
            if (!object) return;
            window.dpHistory({
                object: object,
                property: property,
                title: this.widget.title || (object + (property ? '.' + property : '')),
                color: this.widget.history_color || '#1976d2',
                unit: this.widget.unit || '',
                round: this.widget.round != null ? Number(this.widget.round) : 2
            });
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.gauge = GaugeWidget;
