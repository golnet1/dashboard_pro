const VacuumWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'vc_commands', label: 'tab_vc_commands' },
        { key: 'vc_metrics', label: 'tab_vc_metrics' },
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
            { key: 'vc_help', type: 'info', text: 'help_vc_common' },
            { key: 'object', label: 'field_send_object', type: 'object', row: 'vc_main_obj' },
            { key: 'property', label: 'field_property', type: 'property', row: 'vc_main_obj' },
            { key: 'send_mode', label: 'field_send_mode', type: 'select', row: 'vc_send_mode', options: [{value:'property',label:'opt_set_property'},{value:'command',label:'opt_command'},{value:'method',label:'opt_method'},{value:'script',label:'opt_script'}] },
            { key: 'command_prefix', label: 'field_command_prefix', type: 'text', row: 'vc_send_mode', showIf: { send_mode: 'command' }, placeholder: 'ph_command_prefix' },
            { key: 'script', label: 'field_script', type: 'script', showIf: { send_mode: 'script' } },
            { key: 'object_status', label: 'field_vc_status_object', type: 'object', row: 'vc_status_row' },
            { key: 'property_status', label: 'field_vc_status_property', type: 'property', row: 'vc_status_row' },
            { key: 'object_battery', label: 'field_vc_battery_object', type: 'object', row: 'vc_battery_row' },
            { key: 'property_battery', label: 'field_vc_battery_property', type: 'property', row: 'vc_battery_row' },
            { key: 'object_error', label: 'field_vc_error_object', type: 'object', row: 'vc_error_row' },
            { key: 'property_error', label: 'field_vc_error_property', type: 'property', row: 'vc_error_row' },
            { key: 'status_cleaning_values', label: 'field_vc_clean_values', type: 'text' },
            { key: 'status_error_values', label: 'field_vc_error_values', type: 'text' },
        ],
        advanced: [
            { key: 'refresh_interval', label: 'field_refresh_interval', type: 'number', row: 'refresh_row', step: 1 },
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
    defaults: {
        icon: 'fas fa-robot',
        icon_type: 'icon',
        send_mode: 'property',
        property: 'value',
        property_status: 'status',
        property_battery: 'battery',
        property_error: 'error',
        status_cleaning_values: 'cleaning,clean,running,5,7,11,17,18,101,105',
        status_error_values: 'error,failed,9,12',
        codes: JSON.stringify([
            { key: 'start', code: 'start', label: 'vc_start', icon: 'fas fa-play' },
            { key: 'pause', code: 'pause', label: 'vc_pause', icon: 'fas fa-pause' },
            { key: 'stop', code: 'stop', label: 'vc_stop', icon: 'fas fa-stop' },
            { key: 'home', code: 'home', label: 'vc_home', icon: 'fas fa-house' },
            { key: 'spot', code: 'spot', label: 'vc_spot', icon: 'fas fa-crosshairs' },
            { key: 'edge', code: 'edge', label: 'vc_edge', icon: 'fas fa-border-style' },
            { key: 'find', code: 'find', label: 'vc_find', icon: 'fas fa-magnifying-glass' },
            { key: 'fan_down', code: 'fanDown', label: 'vc_fan_down', icon: 'fas fa-minus' },
            { key: 'fan_up', code: 'fanUp', label: 'vc_fan_up', icon: 'fas fa-plus' },
            { key: 'mode_next', code: 'modeNext', label: 'vc_mode_next', icon: 'fas fa-repeat' }
        ]),
        metrics: JSON.stringify([
            { object: '', property: 'mode', label: 'vc_mode', icon: 'fas fa-broom', suffix: '' },
            { object: '', property: 'fan_power', label: 'vc_suction', icon: 'fas fa-wind', suffix: '' },
            { object: '', property: 'clean_area', label: 'vc_area', icon: 'fas fa-draw-polygon', suffix: ' м²' },
            { object: '', property: 'clean_time', label: 'vc_time', icon: 'fas fa-clock', suffix: ' мин' },
            { object: '', property: 'main_brush', label: 'vc_main_brush', icon: 'fas fa-circle-notch', suffix: '%' },
            { object: '', property: 'side_brush', label: 'vc_side_brush', icon: 'fas fa-spinner', suffix: '%' },
            { object: '', property: 'water_consumption', label: 'vc_water_consumption', icon: 'fas fa-tint', suffix: ' мл' },
            { object: '', property: 'water_level', label: 'vc_water', icon: 'fas fa-tint', suffix: '%' },
            { object: '', property: 'dustbin', label: 'vc_dustbin', icon: 'fas fa-trash', suffix: '%' },
            { object: '', property: 'filter', label: 'vc_filter', icon: 'fas fa-filter', suffix: '%' },
            { object: '', property: 'room', label: 'vc_room', icon: 'fas fa-map-marker-alt', suffix: '' }
        ]),
        width: 320, height: 330, minWidth: 260, minHeight: 280
    },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': aliveDisabled }" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_vacuum') }}</div>
                <span class="dp-vac__online" :class="isAlive ? 'dp-vac__online--ok' : 'dp-vac__online--bad'" :title="isAlive ? t('vc_online') : t('vc_offline')"></span>
            </div>
            <div class="widget-v-card__body dp-vac__body">
                <div class="dp-vac__summary">
                    <div class="dp-vac__status"><span class="dp-vac__dot" :class="statusClass"></span>{{ statusText }}</div>
                    <div class="dp-vac__battery" :title="t('vc_battery')">
                        <span class="dp-vac__battery-num"><i class="fas fa-battery-three-quarters"></i> {{ battery === null ? '--' : battery + '%' }}</span>
                        <span class="dp-vac__battery-track"><span class="dp-vac__battery-fill" :class="batteryClass" :style="batteryStyle"></span></span>
                    </div>
                </div>
                <div v-if="errorText" class="dp-vac__error"><i class="fas fa-triangle-exclamation"></i><span>{{ errorText }}</span></div>
                <div v-if="metricItems.length" class="dp-vac__metrics">
                    <div v-for="(m, i) in metricItems" :key="i" class="dp-vac__metric">
                        <div class="dp-vac__metric-top">
                            <i v-if="m.icon" :class="m.icon" class="dp-vac__metric-icon"></i>
                            <span class="dp-vac__metric-value">{{ m.value }}</span>
                        </div>
                        <span class="dp-vac__metric-label">{{ m.label }}</span>
                    </div>
                </div>
                <div v-else class="dp-vac__empty">{{ t('vc_no_data') }}</div>
                <div v-if="targetButtons.length" class="dp-vac__settings">
                    <button v-for="b in targetButtons" :key="b.key" type="button" class="dp-vac__chip" :disabled="sending || aliveDisabled" :title="t(b.label)" @click="sendAction(b.key)">{{ t(b.label) }}</button>
                </div>
                <div class="dp-vac__controls">
                    <button type="button" class="dp-vac__main" :class="{ 'dp-vac__main--busy': sending }" :disabled="sending || aliveDisabled" @click="sendAction(mainAction)">
                        <i :class="isCleaning ? 'fas fa-pause' : 'fas fa-play'"></i>{{ t(mainAction === 'pause' ? 'vc_pause' : 'vc_start') }}
                    </button>
                    <div class="dp-vac__grid">
                        <button v-for="b in quickButtons" :key="b.key" type="button" class="dp-vac__key" :disabled="sending || aliveDisabled" :title="t(b.label)" @click="sendAction(b.key)">
                            <i :class="b.icon"></i><span>{{ t(b.label) }}</span>
                        </button>
                    </div>
                </div>
                <div v-if="updatedAt" class="dp-vac__updated">{{ t('vc_updated') }} {{ updatedText }}</div>
            </div>
        </div>`,
    data() {
        return {
            values: {}, isAlive: true, availTimer: null, pollTimer: null,
            sending: false, updatedAt: null
        };
    },
    computed: {
        aliveDisabled() {
            return !!(this.widget.object_alive && this.widget.property_alive && this.isAlive === false);
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            if (this.widget.bg_image) s.backgroundImage = 'url("' + this.widget.bg_image + '")';
            return s;
        },
        commandItems() {
            let raw;
            try { raw = JSON.parse(this.widget.codes || '[]'); } catch (e) { return []; }
            if (!Array.isArray(raw)) return [];
            return raw.filter(c => c && c.key).map(c => ({
                key: String(c.key),
                code: c.code === undefined || c.code === null ? '' : String(c.code),
                label: c.label || '',
                icon: c.icon || '',
                target: c.target ? String(c.target) : ''
            }));
        },
        codeMap() {
            let raw;
            try { raw = JSON.parse(this.widget.codes || '{}'); } catch (e) { return {}; }
            /* Old widgets stored a plain «key: code» object; new ones keep the same
               data as rows so it can be edited in the Commands tab. Read both. */
            if (Array.isArray(raw)) {
                const map = {};
                raw.forEach(c => {
                    if (c && c.key) map[String(c.key)] = (c.code === undefined || c.code === null) ? '' : String(c.code);
                });
                return map;
            }
            return raw && typeof raw === 'object' ? raw : {};
        },
        metricDefs() {
            try {
                const list = JSON.parse(this.widget.metrics || '[]');
                return Array.isArray(list) ? list : [];
            } catch (e) { return []; }
        },
        /* A metric only makes sense when its property (and an object to read it
           from) is configured. Unconfigured rows stay in the editor but are
           neither polled nor rendered. */
        activeMetricDefs() {
            return this.metricDefs.filter(m => m && m.property && (m.object || this.widget.object));
        },
        quickButtons() {
            const legacy = {
                stop: { label: 'vc_stop', icon: 'fas fa-stop' },
                home: { label: 'vc_home', icon: 'fas fa-house' },
                spot: { label: 'vc_spot', icon: 'fas fa-crosshairs' },
                edge: { label: 'vc_edge', icon: 'fas fa-border-style' },
                find: { label: 'vc_find', icon: 'fas fa-magnifying-glass' },
                fan_down: { label: 'vc_fan_down', icon: 'fas fa-minus' },
                fan_up: { label: 'vc_fan_up', icon: 'fas fa-plus' },
                mode_next: { label: 'vc_mode_next', icon: 'fas fa-repeat' }
            };
            /* Without rows (an older saved widget) keep the original button set. */
            const items = this.commandItems;
            if (!items.length) return Object.keys(legacy).map(key => Object.assign({ key: key }, legacy[key]));
            return items
                .filter(c => !c.target && c.key !== 'start' && c.key !== 'pause')
                .map(c => ({
                    key: c.key,
                    label: c.label || (legacy[c.key] && legacy[c.key].label) || c.key,
                    icon: c.icon || (legacy[c.key] && legacy[c.key].icon) || 'fas fa-circle'
                }));
        },
        /* Commands with a target are settings (suction power, water flow), not
           device actions. They get their own compact strip under the metrics. */
        targetButtons() {
            return this.commandItems.filter(c => c.target);
        },
        statusRaw() {
            return this.readValue(this.widget.object_status || this.widget.object, this.widget.property_status || 'status');
        },
        normalizedStatus() {
            return String(this.statusRaw === undefined || this.statusRaw === null ? '' : this.statusRaw).trim().toLowerCase();
        },
        statusTokens() {
            return String(this.widget.status_cleaning_values || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        },
        errorTokens() {
            return String(this.widget.status_error_values || '')
                .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        },
        isCleaning() {
            const s = this.normalizedStatus;
            return !!s && this.statusTokens.indexOf(s) !== -1;
        },
        isError() {
            const s = this.normalizedStatus;
            return !!s && this.errorTokens.indexOf(s) !== -1;
        },
        statusClass() {
            if (this.isError) return 'dp-vac__dot--error';
            if (this.isCleaning) return 'dp-vac__dot--cleaning';
            if (this.normalizedStatus && this.normalizedStatus !== '0') return 'dp-vac__dot--idle';
            return 'dp-vac__dot--unknown';
        },
        statusText() {
            const s = this.normalizedStatus;
            if (!s || s === '0') return this.t('vc_st_unknown');
            /* The configured lists win: they describe this particular device. */
            if (this.statusTokens.indexOf(s) !== -1) return this.t('vc_st_cleaning');
            if (this.errorTokens.indexOf(s) !== -1) return this.t('vc_st_error');
            const map = {};
            map.cleaning = 'vc_st_cleaning'; map.clean = 'vc_st_cleaning'; map.running = 'vc_st_cleaning';
            map['4'] = 'vc_st_cleaning'; map['5'] = 'vc_st_cleaning'; map['7'] = 'vc_st_cleaning';
            map['11'] = 'vc_st_cleaning'; map['17'] = 'vc_st_cleaning'; map['18'] = 'vc_st_cleaning';
            map['101'] = 'vc_st_cleaning'; map['105'] = 'vc_st_cleaning';
            map.pause = 'vc_st_paused'; map.paused = 'vc_st_paused'; map['10'] = 'vc_st_paused';
            map.idle = 'vc_st_idle'; map.standby = 'vc_st_idle';
            map['1'] = 'vc_st_idle'; map['2'] = 'vc_st_idle'; map['3'] = 'vc_st_idle';
            map.charging = 'vc_st_charging'; map.charge = 'vc_st_charging'; map['8'] = 'vc_st_charging';
            map.docking = 'vc_st_docking'; map.dock = 'vc_st_docking'; map.returning = 'vc_st_docking';
            map['6'] = 'vc_st_docking'; map['15'] = 'vc_st_docking'; map['16'] = 'vc_st_docking';
            map.error = 'vc_st_error'; map.failed = 'vc_st_error'; map['9'] = 'vc_st_error'; map['12'] = 'vc_st_error';
            return this.t(map[s] || 'vc_st_unknown');
        },
        battery() {
            const raw = this.readValue(this.widget.object_battery || this.widget.object, this.widget.property_battery || 'battery');
            if (raw === undefined || raw === null || raw === '') return null;
            let n = parseFloat(String(raw).replace('%', '').trim());
            if (!isFinite(n)) return null;
            if (n > 0 && n <= 1) n = n * 100;
            return Math.round(Math.max(0, Math.min(100, n)));
        },
        batteryStyle() {
            return { width: (this.battery === null ? 0 : this.battery) + '%' };
        },
        batteryClass() {
            const v = this.battery;
            if (v === null) return '';
            if (v <= 15) return 'dp-vac__battery-fill--low';
            if (v <= 35) return 'dp-vac__battery-fill--mid';
            return '';
        },
        errorText() {
            const raw = this.readValue(this.widget.object_error || this.widget.object, this.widget.property_error || 'error');
            if (raw === undefined || raw === null || raw === '') return '';
            const s = String(raw).trim();
            if (s === '0' || s.toLowerCase() === 'none' || s.toLowerCase() === 'ok') return '';
            return s;
        },
        metricItems() {
            const self = this;
            return this.activeMetricDefs.map(m => {
                const obj = m.object || self.widget.object;
                const prop = m.property;
                const key = obj + '.' + prop;
                const raw = self.values[key];
                const hasValue = raw !== undefined && raw !== null && raw !== '';
                return {
                    icon: m.icon || '',
                    label: String(m.label || prop).indexOf('vc_') === 0 ? self.t(m.label) : (m.label || prop),
                    value: hasValue ? self.formatMetricValue(m, raw) : '--'
                };
            });
        },
        updatedText() {
            if (!this.updatedAt) return '';
            const d = new Date(this.updatedAt);
            return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
        },
        mainAction() { return this.isCleaning ? 'pause' : 'start'; }
    },
    mounted() {
        this.loadAll();
        this.pollTimer = setInterval(() => this.loadAll(), window.__dpPollInterval(this.widget, 5));
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.availTimer) clearInterval(this.availTimer);
    },
    methods: {
        /* Raw miIO values are not meant to be shown as-is: 33345 seconds and
           a bare "Standard" say nothing. Keep the formatting generic enough
           to stay useful for other vacuum objects too. */
        formatMetricValue(m, raw) {
            let s = String(raw);
            const prop = String(m.property || '');
            const valueWords = {
                Silent: 'vc_val_silent', Standard: 'vc_val_standard',
                Medium: 'vc_val_medium', Turbo: 'vc_val_turbo',
                Low: 'vc_val_low', High: 'vc_val_high'
            };
            /* miIO keeps numeric mode/water values in the property right after a
               button press, until the device answers the poll. Show the same words. */
            const modeWords = ['vc_val_silent', 'vc_val_standard', 'vc_val_medium', 'vc_val_turbo'];
            const waterWords = { 1: 'vc_val_low', 2: 'vc_val_medium', 3: 'vc_val_high' };
            if (valueWords[s]) s = this.t(valueWords[s]);
            else if (prop === 'mode' && /^[0-3]$/.test(s)) s = this.t(modeWords[parseInt(s, 10)]);
            else if (prop === 'water_grade' && waterWords[s]) s = this.t(waterWords[s]);
            else if (prop === 'clean_time' && /^\d+$/.test(s)) {
                const total = parseInt(s, 10);
                const h = Math.floor(total / 3600);
                const min = Math.round((total % 3600) / 60);
                s = h ? h + ' ' + this.t('vc_hours') + ' ' + min + ' ' + this.t('vc_minutes')
                      : min + ' ' + this.t('vc_minutes');
            } else if (/^(clean_area|clean_times)$/.test(prop) && /^\d+$/.test(s)) {
                s = parseInt(s, 10).toLocaleString('ru-RU');
            }
            return s + (m.suffix || '');
        },
        readValue(object, property) {
            if (!object || !property) return undefined;
            return this.values[object + '.' + property];
        },
        async loadValue(object, property) {
            if (!object || !property) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: object, property: property }));
                if (d && !d.error && d.value !== undefined) {
                    this.values[object + '.' + property] = d.value;
                }
            } catch (e) {}
        },
        async loadAll() {
            await Promise.all([
                this.loadValue(this.widget.object_status || this.widget.object, this.widget.property_status || 'status'),
                this.loadValue(this.widget.object_battery || this.widget.object, this.widget.property_battery || 'battery'),
                this.loadValue(this.widget.object_error || this.widget.object, this.widget.property_error || 'error'),
                ...this.activeMetricDefs.map(m => this.loadValue(m.object || this.widget.object, m.property))
            ]);
            this.updatedAt = Date.now();
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) {}
        },
        codeFor(k) {
            const v = this.codeMap[k];
            if (v !== undefined && v !== null && v !== '') return String(v);
            const defaults = {
                start: 'start', pause: 'pause', stop: 'stop', home: 'home',
                spot: 'spot', edge: 'edge', find: 'find',
                fan_up: 'fanUp', fan_down: 'fanDown', mode_next: 'modeNext'
            };
            return defaults[k] || k;
        },
        async sendAction(k) {
            if (this.sending || this.aliveDisabled) return;
            const code = this.codeFor(k);
            this.sending = true;
            try {
                const mode = this.widget.send_mode || 'property';
                if (mode === 'method') {
                    const parts = String(code).split('/');
                    const base = 'method/' + parts[0] + (parts[1] ? '/' + parts[1] : '');
                    await dpAPI(base);
                } else if (mode === 'script') {
                    await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script || '', key: code }));
                } else if (mode === 'command') {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: (this.widget.command_prefix || '') + code }));
                } else if (this.widget.object) {
                    const item = this.commandItems.find(c => c.key === k);
                    const params = { object: this.widget.object, value: code };
                    if (item && item.target) params.property = item.target;
                    else if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
                setTimeout(() => this.loadAll(), 400);
            } catch (e) { console.error(e); }
            setTimeout(() => { this.sending = false; }, 250);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.vacuum = VacuumWidget;
