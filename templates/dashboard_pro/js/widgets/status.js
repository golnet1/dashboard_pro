const StatusWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'statuses', label: 'tab_statuses' },
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
            { key: 'object_status', label: 'field_status_object', type: 'object', row: 'status_row' },
            { key: 'property_status', label: 'field_status_property', type: 'property', row: 'status_row' },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'object_info', label: 'field_info_object', type: 'object', row: 'info_row' },
            { key: 'property_info', label: 'field_info_property', type: 'property', row: 'info_row' },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
        ],
        statuses: [],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
        ],
    },
    defaults: () => ({ icon: 'fas fa-info-circle', icon_type: 'icon', height: 130, pre_info: '', pos_info: '', statuses: JSON.stringify([
        { key: 'st1', status: '0', title: window.__t('default_off'), icon: 'fas fa-power-off', color: '#ef4444', exec_type: 'empty' },
        { key: 'st2', status: '1', title: window.__t('default_on'), icon: 'fas fa-check', color: '#22c55e', exec_type: 'empty' },
    ]) }),
    /* Название, если оно вписано, идёт строкой над иконкой; шапки с иконкой у
       карточки нет. Ниже строка: иконка состояния в начале карточки, а надписи
       справа от неё (текст состояния, под ним строка информации). Направление
       строки задаём явно: у .widget-v-card__body в CSS стоит column. */
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" @click="runAction">
            <div v-if="widget.title" class="widget-v-card__title" style="padding:8px 12px 0;min-width:0">{{ widget.title }}</div>
            <div class="widget-v-card__body" style="display:flex;flex-direction:row;align-items:center;gap:12px;padding:10px 12px;flex:1;min-width:0">
                <i v-if="statusIcon" :class="statusIcon" :style="'font-size:2rem;flex-shrink:0;color:' + (statusColor || 'rgba(255,255,255,.6)')"></i>
                <div style="min-width:0;flex:1">
                    <div v-if="statusText" style="font-size:1.1rem;font-weight:500;color:rgba(255,255,255,.87)">{{ statusText }}</div>
                    <div v-else-if="value !== null" style="font-size:1.1rem;font-weight:500;color:rgba(255,255,255,.6)">{{ value }}</div>
                    <div v-else style="font-size:.85rem;color:rgba(255,255,255,.5)">{{ t('no_status') }}</div>
                    <div v-if="infoDisplay" style="font-size:.75rem;color:rgba(255,255,255,.45);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span v-if="widget.pre_info">{{ widget.pre_info }}</span>{{ infoDisplay }}<span v-if="widget.pos_info">{{ widget.pos_info }}</span></div>
                </div>
            </div>
        </div>`,
    data() {
        return {
            value: null,
            info: (this.widget && window.__dpInfoCache[this.widget.id]) || '',
            isAlive: true,
            timer: null,
            aliveTimer: null,
            infoTimer: null,
            secTimer: null,
            infoTick: 0,
            _infoRetry: []
        };
    },
    computed: {
        statuses() {
            try {
                const raw = typeof this.widget.statuses === 'string' ? JSON.parse(this.widget.statuses || '[]') : this.widget.statuses;
                return Array.isArray(raw) ? raw : [];
            } catch (e) { return []; }
        },
        current() {
            if (this.value === null || this.value === undefined) return null;
            const v = parseFloat(this.value);
            const exact = this.statuses.find(s => String(s.status) === String(this.value));
            if (exact) return exact;
            return this.statuses.find(s => {
                const from = parseFloat(s.status);
                const to = parseFloat(s.status2);
                return !isNaN(from) && !isNaN(to) && v >= from && v <= to;
            }) || null;
        },
        statusIcon() { return this.current && this.current.icon ? this.current.icon : (this.widget.icon || null); },
        statusColor() { return this.current ? (this.current.color || null) : null; },
        statusText() { return this.current ? this.current.title : ''; },
        /* так же, как у «Реле»: значение свойства информации разбирается общей
           функцией (метка времени превращается в «N сек назад»), а счётчик
           секунд заставляет строку пересчитываться, пока виджет на экране */
        infoDisplay() {
            if (!this.info) return '';
            void this.infoTick;
            return dpInfoDisplay(this.info);
        },
        aliveDisabled() { return !!(this.widget.object_alive && this.widget.property_alive) && this.isAlive === false; },
        hasAction() { return !this.aliveDisabled && !!(this.current && this.current.exec_type && this.current.exec_type !== 'empty'); },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            if (this.hasAction) s.cursor = 'pointer';
            return s;
        }
    },
    mounted() {
        this.load();
        const obj = this.widget.object_status || this.widget.object;
        if (obj && !window.__dpWsLive) this.timer = setInterval(() => this.load(), 5000);
        if (this.widget.object_info) this.loadInfo();
        this.secTimer = setInterval(() => { if (this.info) this.infoTick++; }, 1000);
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.aliveTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.aliveTimer) clearInterval(this.aliveTimer);
        if (this.infoTimer) clearInterval(this.infoTimer);
        if (this.secTimer) clearInterval(this.secTimer);
        (this._infoRetry || []).forEach(t => clearTimeout(t));
        this._infoRetry = [];
    },
    methods: {
        async load() {
            const obj = this.widget.object_status || this.widget.object;
            if (!obj) return;
            try {
                const prop = this.widget.property_status || this.widget.property;
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined) this.value = d.value;
            } catch (e) { /* silent */ }
        },
        setInfo(v) {
            if (v === undefined || v === null || v === '') return;
            this.info = v;
            if (this.widget && this.widget.id) window.__dpInfoCache[this.widget.id] = v;
        },
        async refreshInfo() {
            if (!this.widget.object_info) return;
            try {
                const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                const d = await dpHttp('getProperty?' + new URLSearchParams(params));
                if (d && !d.error) this.setInfo(d.value);
            } catch (e) { /* silent */ }
        },
        scheduleInfoRefresh() {
            if (!this.widget.object_info) return;
            this.refreshInfo();
            (this._infoRetry || []).forEach(t => clearTimeout(t));
            this._infoRetry = [setTimeout(() => this.refreshInfo(), 400), setTimeout(() => this.refreshInfo(), 1500)];
        },
        async loadInfo() {
            if (!this.widget.object_info) return;
            await this.refreshInfo();
            this.infoTimer = setInterval(() => this.refreshInfo(), 5000);
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async runAction() {
            const s = this.current;
            if (!s || !s.exec_type || s.exec_type === 'empty') return;
            if (s.exec_type === 'script' && s.script) {
                await dpAPI('scriptRun?' + new URLSearchParams(s.exec_param ? { script: s.script, value: s.exec_param } : { script: s.script }));
            } else if (s.exec_type === 'method' && s.method) {
                const p = String(s.method).split('/');
                const base = 'method/' + p[0] + (p[1] ? '/' + p[1] : '');
                await dpAPI(base + (s.exec_param ? '?value=' + encodeURIComponent(s.exec_param) : ''));
            }
            this.load();
            this.scheduleInfoRefresh();
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.status = StatusWidget;
