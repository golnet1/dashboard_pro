const KettleWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'kt_icon_row', options: [{value:'icon',label:'opt_icon'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'kt_icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'kt_icon_row', showIf: { icon_type: 'url' } },
            { key: 'kt_help', type: 'info', text: 'help_kt_common' },

            { key: 'object', label: 'field_send_object', type: 'object', row: 'kt_temp_row' },
            { key: 'property', label: 'field_kt_temp', type: 'property', row: 'kt_temp_row' },
            { key: 'object_target', label: 'field_kt_target_object', type: 'object', row: 'kt_target_row' },
            { key: 'property_target', label: 'field_kt_target', type: 'property', row: 'kt_target_row' },
            { key: 'object_power', label: 'field_kt_power_object', type: 'object', row: 'kt_power_row' },
            { key: 'property_power', label: 'field_kt_power', type: 'property', row: 'kt_power_row' },
            { key: 'power_values', label: 'field_kt_power_values', type: 'text', placeholder: 'on|1,off|0' },
            { key: 'object_mode', label: 'field_kt_mode_object', type: 'object', row: 'kt_mode_row' },
            { key: 'property_mode', label: 'field_kt_mode', type: 'property', row: 'kt_mode_row' },
            { key: 'modes', label: 'field_kt_modes', type: 'text', placeholder: '1|kett_boil,2|kett_boil_heat,3|kett_heat,0|kett_off' },

            { key: 'object_status', label: 'field_kt_status_object', type: 'object', row: 'kt_status_row' },
            { key: 'property_status', label: 'field_kt_status', type: 'property', row: 'kt_status_row' },
            { key: 'object_light', label: 'field_kt_light_object', type: 'object', row: 'kt_light_row' },
            { key: 'property_light', label: 'field_kt_light', type: 'property', row: 'kt_light_row' },
            { key: 'light_values', label: 'field_kt_light_values', type: 'text', placeholder: 'on|1,off|0' },
            { key: 'object_beep', label: 'field_kt_beep_object', type: 'object', row: 'kt_beep_row' },
            { key: 'property_beep', label: 'field_kt_beep', type: 'property', row: 'kt_beep_row' },
            { key: 'beep_values', label: 'field_kt_beep_values', type: 'text', placeholder: 'on|1,off|0' },
            { key: 'object_rgb', label: 'field_kt_rgb_object', type: 'object', row: 'kt_rgb_row' },
            { key: 'property_rgb', label: 'field_kt_rgb', type: 'property', row: 'kt_rgb_row' },
            { key: 'object_rssi', label: 'field_kt_rssi_object', type: 'object', row: 'kt_rssi_row' },
            { key: 'property_rssi', label: 'field_kt_rssi', type: 'property', row: 'kt_rssi_row' },

            { key: 'object_count', label: 'field_kt_count_object', type: 'object', row: 'kt_count_row' },
            { key: 'property_count', label: 'field_kt_count', type: 'property', row: 'kt_count_row' },
            { key: 'object_worktime', label: 'field_kt_worktime_object', type: 'object', row: 'kt_worktime_row' },
            { key: 'property_worktime', label: 'field_kt_worktime', type: 'property', row: 'kt_worktime_row' },
            { key: 'object_energy', label: 'field_kt_energy_object', type: 'object', row: 'kt_energy_row' },
            { key: 'property_energy', label: 'field_kt_energy', type: 'property', row: 'kt_energy_row' },
            { key: 'object_volume', label: 'field_kt_volume_object', type: 'object', row: 'kt_volume_row' },
            { key: 'property_volume', label: 'field_kt_volume', type: 'property', row: 'kt_volume_row' },
            { key: 'object_volume_last', label: 'field_kt_volume_last_object', type: 'object', row: 'kt_volume_last_row' },
            { key: 'property_volume_last', label: 'field_kt_volume_last', type: 'property', row: 'kt_volume_last_row' },

            { key: 'temp_min', label: 'field_kt_min', type: 'number', step: 1, row: 'kt_range_row' },
            { key: 'temp_max', label: 'field_kt_max', type: 'number', step: 1, row: 'kt_range_row' },
            { key: 'temp_step', label: 'field_kt_step', type: 'number', step: 1, row: 'kt_range_row' },
        ],
        advanced: [
            { key: 'refresh_interval', label: 'field_refresh_interval', type: 'number', row: 'refresh_row', step: 1 },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'show_updated', label: 'kt_field_show_updated', type: 'checkbox', default: true },
        ],
    },
    defaults: {
        icon: 'fas fa-mug-hot',
        icon_type: 'icon',
        power_values: 'on|1,off|0',
        modes: '1|kett_boil,2|kett_boil_heat,3|kett_heat,0|kett_off',
        show_updated: true,
        width: 300, height: 300, minWidth: 250, minHeight: 250
    },
    template: `
        <div class="widget-v-card widget-v-card--kettle" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <img v-if="iconType === 'url' && widget.icon_url" class="widget-v-card__icon widget-v-card__icon--img" :src="widget.icon_url" alt="">
                <i v-else-if="widget.icon" :class="widget.icon" class="widget-v-card__icon dp-kt__header-icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_kettle') }}</div>
                <span v-if="hasStatus" class="dp-kt__online" :class="online ? 'dp-kt__online--on' : 'dp-kt__online--off'" :title="online ? t('kett_online') : t('kett_offline')"></span>
            </div>
            <div class="widget-v-card__body dp-kt__body">
                <div class="dp-kt__stage">
                    <div v-if="steaming" class="dp-kt__steam" aria-hidden="true"><i></i><i></i><i></i></div>
                    <svg class="dp-kt__ring" viewBox="0 0 120 120" aria-hidden="true">
                        <circle class="dp-kt__ring-track" cx="60" cy="60" r="50"></circle>
                        <circle class="dp-kt__ring-value" cx="60" cy="60" r="50" :stroke="accent" :stroke-dasharray="ringDash" transform="rotate(-90 60 60)"></circle>
                    </svg>
                    <div class="dp-kt__center">
                        <div class="dp-kt__temp">{{ temp === null ? '--' : Math.round(temp) }}<span>°</span></div>
                        <div v-if="cfgPair('object_target', 'property_target')" class="dp-kt__target">{{ t('kett_target') }} {{ target === null ? '--' : target }}°</div>
                    </div>
                </div>
                <div class="dp-kt__chips">
                    <span v-if="hasMode" class="dp-kt__chip dp-kt__chip--mode"><i :class="modeIcon"></i>{{ modeLabel }}</span>
                    <span v-if="statusLabel" class="dp-kt__chip">{{ statusLabel }}</span>
                    <span v-if="hasRssi && rssi !== null" class="dp-kt__chip dp-kt__chip--rssi"><i class="fas fa-wifi"></i>{{ rssi }}</span>
                    <button v-if="hasBeep" type="button" class="dp-kt__chip-btn dp-kt__chip-btn--beep" :class="{ 'is-on': beepOn }" :disabled="busy" :title="t('kett_beep')" @click="toggleBeep">
                        <i :class="beepOn ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
                    </button>
                    <button v-if="hasLight" type="button" class="dp-kt__chip-btn dp-kt__chip-btn--light" :class="{ 'is-on': lightOn }" :disabled="busy" :title="t('kett_light')" @click="toggleLight">
                        <i class="fas fa-lightbulb"></i>
                    </button>
                </div>
                <div v-if="hasStats" class="dp-kt__stats">
                    <div v-if="count !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ countText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_count') }}</span></div>
                    <div v-if="workTime !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ workTimeText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_worktime') }}</span></div>
                    <div v-if="energy !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ energyText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_energy') }}</span></div>
                    <div v-if="volume !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ volumeText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_volume') }}</span></div>
                    <div v-if="volumeLast !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ volumeLastText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_volume_last') }}</span></div>
                </div>
                <div class="dp-kt__controls">
                    <button v-if="hasPower" type="button" class="dp-kt__btn dp-kt__btn--power" :class="{ 'is-on': powerOn }" :disabled="busy" :title="t('kett_power')" @click="togglePower">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button v-if="hasTempControls" type="button" class="dp-kt__btn" :disabled="busy || target === null" :title="t('kett_less')" @click="changeTemp(-step)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button v-if="hasMode" type="button" class="dp-kt__btn dp-kt__btn--mode" :disabled="busy" :title="t('kett_mode')" @click="cycleMode">
                        <i :class="modeIcon"></i><span>{{ modeLabel }}</span>
                    </button>
                    <button v-if="hasTempControls" type="button" class="dp-kt__btn" :disabled="busy || target === null" :title="t('kett_more')" @click="changeTemp(step)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div v-if="updatedAt && showUpdated" class="dp-kt__updated">{{ t('kett_updated') }} {{ updatedText }}</div>
            </div>
        </div>`,
    data() {
        return { values: {}, busy: false, updatedAt: null, pollTimer: null };
    },
    computed: {
        iconType() { return this.widget.icon_type || 'icon'; },
        showUpdated() {
            if (this.widget.show_updated === undefined || this.widget.show_updated === null || this.widget.show_updated === '') return true;
            return this.widget.show_updated === true || this.widget.show_updated === 'true' || this.widget.show_updated === '1' || this.widget.show_updated === 1;
        },
        cardStyle() {
            const s = { '--kt-accent': this.accent };
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        minTemp() {
            const n = Number(this.widget.temp_min);
            return this.widget.temp_min === undefined || this.widget.temp_min === '' || !Number.isFinite(n) ? null : n;
        },
        maxTemp() {
            const n = Number(this.widget.temp_max);
            return this.widget.temp_max === undefined || this.widget.temp_max === '' || !Number.isFinite(n) ? null : n;
        },
        step() {
            const n = Number(this.widget.temp_step);
            return n > 0 ? n : null;
        },
        temp() { return this.numValue(this.widget.object, this.widget.property); },
        target() { return this.numValue(this.widget.object_target, this.widget.property_target); },
        rssi() { return this.numValue(this.widget.object_rssi, this.widget.property_rssi); },
        count() { return this.numValue(this.widget.object_count, this.widget.property_count); },
        workTime() { return this.numValue(this.widget.object_worktime, this.widget.property_worktime); },
        energy() { return this.numValue(this.widget.object_energy, this.widget.property_energy); },
        volume() { return this.numValue(this.widget.object_volume, this.widget.property_volume); },
        volumeLast() { return this.numValue(this.widget.object_volume_last, this.widget.property_volume_last); },
        hasStats() {
            return [this.count, this.workTime, this.energy, this.volume, this.volumeLast].some(v => v !== null);
        },
        countText() { return this.count === null ? '' : Math.round(this.count).toLocaleString('ru-RU'); },
        workTimeText() {
            if (this.workTime === null) return '';
            const s = Math.round(this.workTime);
            if (s >= 3600) return Math.floor(s / 3600) + ' ' + this.t('kett_hours') + ' ' + Math.round((s % 3600) / 60) + ' ' + this.t('kett_minutes');
            if (s >= 60) return Math.round(s / 60) + ' ' + this.t('kett_minutes');
            return s + ' ' + this.t('kett_seconds');
        },
        energyText() { return this.energy === null ? '' : this.energy.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.t('kett_unit_kw'); },
        volumeText() { return this.volume === null ? '' : (this.volume === 0 ? 0 : this.volume).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.volumeUnit(this.volume); },
        volumeLastText() { return this.volumeLast === null ? '' : (this.volumeLast === 0 ? 0 : this.volumeLast).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.volumeUnit(this.volumeLast); },
        hasPower() { return this.cfgPair('object_power', 'property_power') && this.powerPairs.length > 0; },
        hasLight() { return this.cfgPair('object_light', 'property_light') && this.lightPairs.length > 0; },
        hasBeep() { return this.cfgPair('object_beep', 'property_beep') && this.beepPairs.length > 0; },
        hasMode() { return this.cfgPair('object_mode', 'property_mode') && this.modeOptions.length > 0; },
        hasTempControls() { return this.cfgPair('object_target', 'property_target') && this.step !== null; },
        hasStatus() { return this.cfgPair('object_status', 'property_status'); },
        hasRssi() { return this.cfgPair('object_rssi', 'property_rssi'); },
        powerPairs() { return this.parsePairs(this.widget.power_values || ''); },
        lightPairs() { return this.parsePairs(this.widget.light_values || ''); },
        beepPairs() { return this.parsePairs(this.widget.beep_values || ''); },
        powerOn() {
            const raw = this.readValue(this.widget.object_power, this.widget.property_power);
            if (raw === undefined || raw === null || String(raw).trim() === '') return false;
            const on = this.powerPairs.find(p => p.key === 'on');
            return on ? this.sameValue(raw, on.value) : ['1', 'true', 'on'].indexOf(String(raw).trim().toLowerCase()) >= 0;
        },
        lightOn() {
            const raw = this.readValue(this.widget.object_light, this.widget.property_light);
            if (raw === undefined || raw === null || String(raw).trim() === '') return null;
            return ['1', 'true', 'on', 'вкл'].indexOf(String(raw).trim().toLowerCase()) >= 0;
        },
        beepOn() {
            const raw = this.readValue(this.widget.object_beep, this.widget.property_beep);
            if (raw === undefined || raw === null || String(raw).trim() === '') return null;
            const on = this.beepPairs.find(p => p.key === 'on');
            if (on) return this.sameValue(raw, on.value);
            return ['0', 'false', 'off', 'выкл'].indexOf(String(raw).trim().toLowerCase()) >= 0;
        },
        statusLabel() {
            const raw = this.readValue(this.widget.object_status, this.widget.property_status);
            if (raw === undefined || raw === null || String(raw).trim() === '') return '';
            const s = String(raw).trim();
            const key = 'kett_st_' + s.toLowerCase();
            const tr = this.t(key);
            return tr !== key ? tr : s;
        },
        online() {
            const raw = this.readValue(this.widget.object_status, this.widget.property_status);
            if (raw === undefined || raw === null) return false;
            return ['1', 'true', 'on', 'online'].indexOf(String(raw).trim().toLowerCase()) >= 0;
        },
        modeOptions() {
            return String(this.widget.modes || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
                const p = s.split('|').map(x => x.trim());
                return { value: p[0], label: p[1] || p[0] };
            }).filter(o => o.value !== '');
        },
        currentMode() {
            const raw = this.readValue(this.widget.object_mode, this.widget.property_mode);
            if (raw === undefined || raw === null || String(raw).trim() === '') return null;
            return this.modeOptions.find(o => this.sameValue(raw, o.value)) || null;
        },
        modeLabel() {
            const m = this.currentMode;
            if (!m) return this.t('kett_unknown');
            const tr = this.t(m.label);
            return tr !== m.label ? tr : m.label;
        },
        modeIcon() {
            if (!this.currentMode) return 'fas fa-question';
            const k = String(this.currentMode.label).toLowerCase();
            if (k.indexOf('off') >= 0 || k.indexOf('выкл') >= 0) return 'fas fa-power-off';
            if (k.indexOf('heat') >= 0 || k.indexOf('подогрев') >= 0) return 'fas fa-thermometer-half';
            return 'fas fa-fire';
        },
        steaming() { return this.powerOn && !!this.currentMode && this.modeIcon === 'fas fa-fire'; },
        percent() {
            if (this.temp === null || this.minTemp === null || this.maxTemp === null) return 0;
            const span = this.maxTemp - this.minTemp;
            if (span <= 0) return 0;
            return Math.max(0, Math.min(100, (this.temp - this.minTemp) / span * 100));
        },
        ringDash() {
            const c = 2 * Math.PI * 50;
            return (this.percent / 100 * c).toFixed(1) + ' ' + c.toFixed(1);
        },
        accent() {
            const raw = String(this.readValue(this.widget.object_rgb, this.widget.property_rgb) || '').trim().replace(/^#/, '');
            if (/^[0-9a-fA-F]{6}$/.test(raw)) return '#' + raw;
            return '#22d3ee';
        },
        updatedText() {
            const d = new Date(this.updatedAt);
            return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
        }
    },
    created() {
        this.migrateLegacy();
    },
    mounted() {
        this.loadAll();
        this.pollTimer = setInterval(() => this.loadAll(), window.__dpPollInterval(this.widget, 5));
    },
    beforeUnmount() {
        if (this.pollTimer) clearInterval(this.pollTimer);
    },
    methods: {
        cfg(k) {
            const v = this.widget[k];
            return v !== undefined && v !== null && String(v).trim() !== '';
        },
        cfgPair(objKey, propKey) { return this.cfg(objKey) && this.cfg(propKey); },
        migrateLegacy() {
            const w = this.widget;
            if (!w.object_light && w.object_light_set) w.object_light = w.object_light_set;
            if (!w.property_light && w.property_light_set) w.property_light = w.property_light_set;
            if (!this.cfg('light_values') && this.cfgPair('object_light', 'property_light')) w.light_values = 'on|1,off|0';
            if (!w.object_beep && w.object_beep_set) w.object_beep = w.object_beep_set;
            if (!w.property_beep && w.property_beep_set) w.property_beep = w.property_beep_set;
            if (!this.cfg('beep_values') && this.cfgPair('object_beep', 'property_beep')) w.beep_values = 'on|0,off|1';
        },
        readValue(object, property) {
            if (!object || !property) return undefined;
            return this.values[object + '.' + property];
        },
        numValue(object, property) {
            const raw = this.readValue(object, property);
            if (raw === undefined || raw === null || String(raw).trim() === '') return null;
            const n = Number(raw);
            return Number.isFinite(n) ? n : null;
        },
        volumeUnit(value) {
            const n = Math.abs(Number(value));
            if (!Number.isFinite(n)) return this.t('kett_unit_l');
            if (!Number.isInteger(n)) return this.t('kett_unit_l_few');
            const mod100 = n % 100;
            const mod10 = n % 10;
            if (mod100 >= 11 && mod100 <= 14) return this.t('kett_unit_l_many');
            if (mod10 === 1) return this.t('kett_unit_l_one');
            if (mod10 >= 2 && mod10 <= 4) return this.t('kett_unit_l_few');
            return this.t('kett_unit_l_many');
        },
        parsePairs(str) {
            return String(str || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
                const p = s.split('|').map(x => x.trim());
                return { key: p[0] || '', value: p[1] !== undefined ? p[1] : p[0], label: p[2] || p[0] };
            }).filter(o => o.key !== '');
        },
        sameValue(a, b) {
            const x = String(a === undefined || a === null ? '' : a).trim();
            const y = String(b === undefined || b === null ? '' : b).trim();
            if (x === y) return true;
            return x !== '' && y !== '' && !Number.isNaN(Number(x)) && !Number.isNaN(Number(y)) && Number(x) === Number(y);
        },
        async loadAll() {
            const pairs = [
                [this.widget.object, this.widget.property],
                [this.widget.object_target, this.widget.property_target],
                [this.widget.object_power, this.widget.property_power],
                [this.widget.object_mode, this.widget.property_mode],
                [this.widget.object_status, this.widget.property_status],
                [this.widget.object_light, this.widget.property_light],
                [this.widget.object_beep, this.widget.property_beep],
                [this.widget.object_rgb, this.widget.property_rgb],
                [this.widget.object_rssi, this.widget.property_rssi],
                [this.widget.object_count, this.widget.property_count],
                [this.widget.object_worktime, this.widget.property_worktime],
                [this.widget.object_energy, this.widget.property_energy],
                [this.widget.object_volume, this.widget.property_volume],
                [this.widget.object_volume_last, this.widget.property_volume_last]
            ];
            await Promise.all(pairs.filter(p => p[0] && p[1]).map(async p => {
                try {
                    const d = await dpAPI('getProperty?' + new URLSearchParams({ object: p[0], property: p[1] }));
                    if (d && !d.error && d.value !== undefined) this.values[p[0] + '.' + p[1]] = d.value;
                } catch (e) {}
            }));
            this.updatedAt = Date.now();
        },
        async write(object, property, value) {
            if (!object || !property) return;
            this.busy = true;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: object, property: property, value: String(value) }));
                setTimeout(() => this.loadAll(), 400);
            } catch (e) { console.error(e); }
            setTimeout(() => { this.busy = false; }, 250);
        },
        togglePower() {
            const pair = this.powerPairs.find(p => p.key === (this.powerOn ? 'off' : 'on'));
            if (!pair) return;
            this.write(this.widget.object_power, this.widget.property_power, pair.value);
        },
        toggleLight() {
            const pair = this.lightPairs.find(p => p.key === (this.lightOn ? 'off' : 'on'));
            if (!pair) return;
            this.write(this.widget.object_light, this.widget.property_light, pair.value);
        },
        toggleBeep() {
            const pair = this.beepPairs.find(p => p.key === (this.beepOn ? 'off' : 'on'));
            if (!pair) return;
            this.write(this.widget.object_beep, this.widget.property_beep, pair.value);
        },
        changeTemp(delta) {
            if (this.target === null || this.step === null) return;
            let v = this.target + delta;
            if (this.minTemp !== null) v = Math.max(this.minTemp, v);
            if (this.maxTemp !== null) v = Math.min(this.maxTemp, v);
            this.write(this.widget.object_target, this.widget.property_target, v);
        },
        cycleMode() {
            const opts = this.modeOptions;
            if (!opts.length) return;
            const raw = this.readValue(this.widget.object_mode, this.widget.property_mode);
            const idx = opts.findIndex(o => this.sameValue(raw, o.value));
            const next = opts[(idx + 1) % opts.length];
            this.write(this.widget.object_mode, this.widget.property_mode, next.value);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.kettle = KettleWidget;
