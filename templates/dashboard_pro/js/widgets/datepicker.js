const DatePickerWidget = {
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
        ],
        advanced: [
            { key: 'format', label: 'field_date_format', type: 'select', options: [{value:'YYYY-MM-DD',label:'YYYY-MM-DD'},{value:'DD.MM.YYYY',label:'DD.MM.YYYY'},{value:'MM/DD/YYYY',label:'MM/DD/YYYY'}] },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
        ],
    },
    defaults: { icon: 'fas fa-calendar-alt', icon_type: 'icon', property: 'value', format: 'YYYY-MM-DD', height: 130 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_datepicker') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:4px 12px 12px;gap:4px">
                <div class="dp-picker-field" @click.stop="openPopup" :class="{ 'dp-picker-field--empty': !displayValue }">
                    <i class="fas fa-calendar-alt" style="font-size:.85rem"></i>
                    <span>{{ displayValue || t('field_pick_date') }}</span>
                    <i class="fas fa-chevron-down" style="font-size:.7rem;margin-left:auto"></i>
                </div>
            </div>
            <div v-if="open" class="dp-picker-popup" :style="popupStyle" @click.stop>
                <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px">
                    <button class="dp-picker-popup__nav" @click="prevMonth">&lsaquo;</button>
                    <span class="dp-picker-popup__title">{{ monthName }} {{ year }}</span>
                    <button class="dp-picker-popup__nav" @click="nextMonth">&rsaquo;</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:.72rem;padding:0 8px">
                    <div v-for="d in dayHead" :key="'h'+d" style="color:rgba(255,255,255,.4);padding:2px 0">{{ d }}</div>
                    <div v-for="(day,i) in days" :key="'d'+i"
                        :class="dayCls(day)"
                        @click="day ? pick(day) : null">{{ day ? day.d : '' }}</div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px">
                    <button class="dp-picker-popup__link" @click="pickToday">{{ t('today') }}</button>
                    <button class="dp-picker-popup__link" @click="open = false" style="color:rgba(255,255,255,.5)">{{ t('close') }}</button>
                </div>
            </div>
        </div>`,
    data() {
        const st = (this.widget && window.__dpWidgetState[this.widget.id]) || {};
        return {
            value: st.value != null ? st.value : null,
            open: false,
            popup: { top: 0, left: 0, width: 0 },
            year: 0, month: 0,
            days: [],
            isAlive: true, loading: false, timer: null, availTimer: null
        };
    },
    computed: {
        dayHead() {
            return [this.t('day_short_mon'),this.t('day_short_tue'),this.t('day_short_wed'),this.t('day_short_thu'),this.t('day_short_fri'),this.t('day_short_sat'),this.t('day_short_sun')];
        },
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        obj() { return this.widget.object_value || this.widget.object; },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        displayValue() {
            if (!this.value) return '';
            const fmt = this.widget.format || 'YYYY-MM-DD';
            return this.formatDate(this.value, fmt);
        },
        popupStyle() {
            return { position: 'fixed', top: this.popup.top + 'px', left: this.popup.left + 'px', minWidth: this.popup.width ? this.popup.width + 'px' : '' };
        },
        monthName() {
            const m = [this.t('month_jan'),this.t('month_feb'),this.t('month_mar'),this.t('month_apr'),this.t('month_may'),this.t('month_jun'),this.t('month_jul'),this.t('month_aug'),this.t('month_sep'),this.t('month_oct'),this.t('month_nov'),this.t('month_dec')];
            return m[this.month];
        }
    },
    mounted() {
        this.loadValue();
        let obj = this.obj;
        if (obj && !window.__dpWsLive) this.timer = setInterval(() => this.loadValue(), 5000);
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
        document.addEventListener('click', this.onDocClick);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.availTimer) clearInterval(this.availTimer);
        document.removeEventListener('click', this.onDocClick);
    },
    methods: {
        uiState() {
            const id = this.widget && this.widget.id;
            if (!id) return null;
            return window.__dpWidgetState[id] || (window.__dpWidgetState[id] = {});
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async loadValue() {
            const obj = this.obj;
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: this.widget.property || 'value' }));
                if (!d.error && d.value !== undefined && d.value !== null && d.value !== '') {
                    this.value = d.value;
                    const st = this.uiState();
                    if (st) st.value = d.value;
                }
            } catch (e) { /* silent */ }
        },
        onDocClick() { this.open = false; },
        openPopup(e) {
            if (this.aliveDisabled) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const w = Math.max(rect.width, 260);
            const estH = 300;
            const top = (rect.bottom + estH + 8 > window.innerHeight) ? Math.max(4, rect.top - estH - 6) : rect.bottom + 4;
            const left = Math.min(rect.left, Math.max(4, window.innerWidth - w - 8));
            this.popup = { top: top, left: left, width: w };
            this.open = true;
            const v = this.value && this.parseDate(this.value);
            const base = v || new Date();
            this.renderMonth(base);
        },
        parseDate(s) {
            const str = String(s).trim();
            let y, m, d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                const p = str.split('-'); y = +p[0]; m = +p[1]; d = +p[2];
            } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
                const p = str.split('.'); d = +p[0]; m = +p[1]; y = +p[2];
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
                const p = str.split('/'); m = +p[0]; d = +p[1]; y = +p[2];
            } else {
                const t = new Date(str);
                if (isNaN(t)) return null;
                y = t.getFullYear(); m = t.getMonth() + 1; d = t.getDate();
            }
            if (!y || !m || !d) return null;
            return { y: y, m: m, d: d };
        },
        formatDate(s, fmt) {
            const p = this.parseDate(s);
            if (!p) return String(s);
            const pad = n => String(n).padStart(2, '0');
            if (fmt === 'DD.MM.YYYY') return pad(p.d) + '.' + pad(p.m) + '.' + p.y;
            if (fmt === 'MM/DD/YYYY') return pad(p.m) + '/' + pad(p.d) + '/' + p.y;
            return p.y + '-' + pad(p.m) + '-' + pad(p.d);
        },
        toValue(p, fmt) {
            const pad = n => String(n).padStart(2, '0');
            if (fmt === 'DD.MM.YYYY') return pad(p.d) + '.' + pad(p.m) + '.' + p.y;
            if (fmt === 'MM/DD/YYYY') return pad(p.m) + '/' + pad(p.d) + '/' + p.y;
            return p.y + '-' + pad(p.m) + '-' + pad(p.d);
        },
        renderMonth(base) {
            this.year = base.getFullYear();
            this.month = base.getMonth();
            const v = this.value && this.parseDate(this.value);
            const now = new Date();
            const first = new Date(this.year, this.month, 1).getDay() || 7;
            const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
            const arr = [];
            for (let i = 1; i < first; i++) arr.push(null);
            for (let i = 1; i <= daysInMonth; i++) {
                arr.push({
                    d: i,
                    selected: !!(v && v.y === this.year && v.m === this.month + 1 && v.d === i),
                    today: (now.getFullYear() === this.year && now.getMonth() === this.month && i === now.getDate())
                });
            }
            this.days = arr;
        },
        dayCls(day) {
            if (!day) return 'dp-picker-popup__cell dp-picker-popup__cell--empty';
            let c = 'dp-picker-popup__cell';
            if (day.today) c += ' dp-picker-popup__cell--today';
            if (day.selected) c += ' dp-picker-popup__cell--selected';
            return c;
        },
        prevMonth() { this.renderMonth(new Date(this.year, this.month - 1, 1)); },
        nextMonth() { this.renderMonth(new Date(this.year, this.month + 1, 1)); },
        pick(day) {
            const fmt = this.widget.format || 'YYYY-MM-DD';
            const val = this.toValue({ y: this.year, m: this.month + 1, d: day.d }, fmt);
            this.value = val;
            const st = this.uiState();
            if (st) st.value = val;
            this.save(val);
            this.open = false;
        },
        pickToday() {
            const now = new Date();
            this.renderMonth(now);
            const fmt = this.widget.format || 'YYYY-MM-DD';
            const val = this.toValue({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }, fmt);
            this.value = val;
            const st = this.uiState();
            if (st) st.value = val;
            this.save(val);
            this.open = false;
        },
        async save(val) {
            const obj = this.obj;
            if (!obj) return;
            if (this.loading) return;
            this.loading = true;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: obj, property: this.widget.property || 'value', value: val }));
            } catch (e) { /* silent */ }
            this.loading = false;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.datepicker = DatePickerWidget;