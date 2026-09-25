const TimePickerWidget = {
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
            { key: 'format', label: 'field_time_format', type: 'select', options: [{value:'HH:MM',label:'HH:MM'},{value:'HH:MM:SS',label:'HH:MM:SS'},{value:'h:mm a',label:'h:mm AM/PM'}] },
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
    defaults: { icon: 'fas fa-clock', icon_type: 'icon', property: 'value', format: 'HH:MM', height: 130 },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_timepicker') }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:4px 12px 12px;gap:4px">
                <div class="dp-picker-field" @click.stop="openPopup" :class="{ 'dp-picker-field--empty': !displayValue }">
                    <i class="fas fa-clock" style="font-size:.85rem"></i>
                    <span>{{ displayValue || t('field_pick_time') }}</span>
                    <i class="fas fa-chevron-down" style="font-size:.7rem;margin-left:auto"></i>
                </div>
            </div>
            <div v-if="open" class="dp-picker-popup" :style="popupStyle" @click.stop>
                <div style="text-align:center;padding:6px 8px;font-size:1.4rem;letter-spacing:2px;color:#fff;font-weight:300">{{ displayTime }}</div>
                <div style="display:flex;gap:8px;padding:0 8px 6px;height:150px">
                    <div class="dp-picker-wheel">
                        <div v-for="h in hours" :key="'h'+h" class="dp-picker-wheel__item" :class="{ 'dp-picker-wheel__item--active': selHour === h }" @click="selHour = h">{{ pad(h) }}</div>
                    </div>
                    <div class="dp-picker-wheel">
                        <div v-for="m in minutes" :key="'m'+m" class="dp-picker-wheel__item" :class="{ 'dp-picker-wheel__item--active': selMinute === m }" @click="selMinute = m">{{ pad(m) }}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px">
                    <button class="dp-picker-popup__link" @click="pickNow" v-if="widget.format === 'h:mm a'">{{ t('now') }}</button>
                    <span v-else></span>
                    <button class="dp-picker-popup__link" @click="pick" style="color:var(--primary,#1976d2)">{{ t('apply') }}</button>
                </div>
            </div>
        </div>`,
    data() {
        const st = (this.widget && window.__dpWidgetState[this.widget.id]) || {};
        return {
            value: st.value != null ? st.value : null,
            open: false,
            popup: { top: 0, left: 0, width: 0 },
            selHour: null,
            selMinute: null,
            isAlive: true, loading: false, timer: null, availTimer: null
        };
    },
    computed: {
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
            const fmt = this.widget.format || 'HH:MM';
            return this.formatTime(this.value, fmt);
        },
        displayTime() {
            return this.pad(this.selHour) + ':' + this.pad(this.selMinute);
        },
        popupStyle() {
            return { position: 'fixed', top: this.popup.top + 'px', left: this.popup.left + 'px', minWidth: this.popup.width ? this.popup.width + 'px' : '' };
        },
        hours() {
            const arr = [];
            for (let i = 0; i < 24; i++) arr.push(i);
            return arr;
        },
        minutes() {
            const arr = [];
            for (let i = 0; i < 60; i++) arr.push(i);
            return arr;
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
        pad(n) { return String(n).padStart(2, '0'); },
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
            const w = Math.max(rect.width, 220);
            const estH = 230;
            const top = (rect.bottom + estH + 8 > window.innerHeight) ? Math.max(4, rect.top - estH - 6) : rect.bottom + 4;
            const left = Math.min(rect.left, Math.max(4, window.innerWidth - Math.max(rect.width, 240) - 8));
            this.popup = { top: top, left: left, width: w };
            const t = this.parseTime(this.value);
            if (t) { this.selHour = t.h; this.selMinute = t.m; }
            else { const now = new Date(); this.selHour = now.getHours(); this.selMinute = now.getMinutes(); }
            this.open = true;
            this.$nextTick(() => this.scrollToActive());
        },
        parseTime(s) {
            if (!s) return null;
            const str = String(s).trim();
            const m = str.match(/^(\d{1,2})[:\s,](\d{1,2})(?:[:\s,.](\d{1,2}))?\s*(am|pm)?$/i);
            if (!m) return null;
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            if (m[4] && /pm/i.test(m[4]) && h < 12) h += 12;
            if (m[4] && /am/i.test(m[4]) && h === 12) h = 0;
            if (h > 23 || min > 59) return null;
            return { h: h, m: min };
        },
        formatTime(s, fmt) {
            const t = this.parseTime(s);
            if (!t) return String(s);
            if (fmt === 'HH:MM:SS') return this.pad(t.h) + ':' + this.pad(t.m) + ':00';
            if (fmt === 'h:mm a') {
                const ap = t.h < 12 ? 'am' : 'pm';
                const h = t.h % 12 || 12;
                return h + ':' + this.pad(t.m) + ' ' + ap;
            }
            return this.pad(t.h) + ':' + this.pad(t.m);
        },
        toValue(t, fmt) {
            if (fmt === 'HH:MM:SS') return this.pad(t.h) + ':' + this.pad(t.m) + ':00';
            if (fmt === 'h:mm a') {
                const ap = t.h < 12 ? 'am' : 'pm';
                const h = t.h % 12 || 12;
                return h + ':' + this.pad(t.m) + ' ' + ap;
            }
            return this.pad(t.h) + ':' + this.pad(t.m);
        },
        scrollToActive() {
            const wheels = this.$el && this.$el.querySelectorAll('.dp-picker-wheel');
            if (!wheels || !wheels.length) return;
            const idx = [this.selHour, this.selMinute];
            wheels.forEach((wh, wi) => {
                const items = wh.querySelectorAll('.dp-picker-wheel__item');
                const el = items[idx[wi]];
                if (el && wh.scrollTop != null) {
                    wh.scrollTop = Math.max(0, el.offsetTop - wh.clientHeight / 2 + el.offsetHeight / 2);
                }
            });
        },
        pick() {
            const fmt = this.widget.format || 'HH:MM';
            const val = this.toValue({ h: this.selHour, m: this.selMinute }, fmt);
            this.value = val;
            const st = this.uiState();
            if (st) st.value = val;
            this.save(val);
            this.open = false;
        },
        pickNow() {
            const now = new Date();
            let val;
            const fmt = this.widget.format || 'HH:MM';
            if (fmt === 'HH:MM:SS') val = this.pad(now.getHours()) + ':' + this.pad(now.getMinutes()) + ':' + this.pad(now.getSeconds());
            else if (fmt === 'h:mm a') {
                const ap = now.getHours() < 12 ? 'am' : 'pm';
                const h = now.getHours() % 12 || 12;
                val = h + ':' + this.pad(now.getMinutes()) + ' ' + ap;
            } else {
                val = this.pad(now.getHours()) + ':' + this.pad(now.getMinutes());
            }
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
window.DpWidgets.timepicker = TimePickerWidget;