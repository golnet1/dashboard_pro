/* Окно цвета живёт вне компонента: виджет пересоздаётся при wsRev,
   и локальное состояние иначе сбрасывалось бы через несколько секунд. */
const KettleColorUi = {};

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
            { key: 'object_mode', label: 'field_kt_mode_object', type: 'object', row: 'kt_mode_row' },
            { key: 'property_mode', label: 'field_kt_mode', type: 'property', row: 'kt_mode_row' },
            { key: 'modes', label: 'field_kt_modes', type: 'text', placeholder: '1|kett_boil,2|kett_boil_heat,3|kett_heat,0|kett_off' },

            { key: 'object_status', label: 'field_kt_status_object', type: 'object', row: 'kt_status_row' },
            { key: 'property_status', label: 'field_kt_status', type: 'property', row: 'kt_status_row' },
            { key: 'object_gateway', label: 'field_kt_gateway_object', type: 'object', row: 'kt_gateway_row' },
            { key: 'property_gateway', label: 'field_kt_gateway', type: 'property', row: 'kt_gateway_row' },
            { key: 'object_light', label: 'field_kt_light_object', type: 'object', row: 'kt_light_row' },
            { key: 'property_light', label: 'field_kt_light', type: 'property', row: 'kt_light_row' },
            { key: 'object_backlight', label: 'field_kt_backlight_object', type: 'object', row: 'kt_backlight_row' },
            { key: 'property_backlight', label: 'field_kt_backlight', type: 'property', row: 'kt_backlight_row' },
            { key: 'object_beep', label: 'field_kt_beep_object', type: 'object', row: 'kt_beep_row' },
            { key: 'property_beep', label: 'field_kt_beep', type: 'property', row: 'kt_beep_row' },
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
            { key: 'object_power_kw', label: 'field_kt_power_kw_object', type: 'object', row: 'kt_power_kw_row' },
            { key: 'property_power_kw', label: 'field_kt_power_kw', type: 'property', row: 'kt_power_kw_row' },
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
                    <span v-if="hasMode" class="dp-kt__chip dp-kt__chip--mode" :class="{ 'dp-kt__chip--online': powerOn }">{{ modeLabel }}</span>
                    <span v-if="hasLight || hasBacklight" class="dp-kt__chip dp-kt__chip--lit" :class="{ 'dp-kt__chip--clickable': hasColor }" :title="hasColor ? t('kett_color_title') : ''" @click="openColor"><i :class="lightIcon"></i>{{ lightModeLabel }}</span>
                    <span v-if="statusLabel" class="dp-kt__chip" :class="kettleOnline ? 'dp-kt__chip--online' : 'dp-kt__chip--offline'">{{ statusLabel }}</span>
                    <span v-if="hasRssi && rssi !== null" class="dp-kt__chip dp-kt__chip--rssi"><i class="fas fa-wifi"></i>{{ rssi }}</span>
                </div>
                <div v-if="hasStats" class="dp-kt__stats">
                    <div v-if="count !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ countText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_count') }}</span></div>
                    <div v-if="workTime !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ workTimeText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_worktime') }}</span></div>
                    <div v-if="energy !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ energyText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_energy') }}</span></div>
                    <div v-if="powerKw !== null" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ powerKwText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_power') }}</span></div>
                    <div v-if="hasVolume" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ volumeText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_volume') }}</span></div>
                    <div v-if="hasVolumeLast" class="dp-kt__stat"><span class="dp-kt__stat-value">{{ volumeLastText }}</span><span class="dp-kt__stat-label">{{ t('kett_stat_volume_last') }}</span></div>
                </div>
                <div class="dp-kt__controls">
                    <button v-if="hasPower" type="button" class="dp-kt__btn dp-kt__btn--power" :class="{ 'is-on': powerOn }" :disabled="!online || busy" :title="powerOn ? t('kett_off') : t('kett_on')" @click="togglePower">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button v-if="hasBeep" type="button" class="dp-kt__btn dp-kt__btn--beep" :class="{ 'is-on': beepOn }" :disabled="!online || busy" :title="t('kett_beep')" @click="toggleBeep">
                        <i :class="beepOn ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
                    </button>
                    <button v-if="hasTempControls" type="button" class="dp-kt__btn dp-kt__btn--temp" :disabled="!online || target === null" :title="t('kett_less')" @pointerdown="startTempHold(-step, $event)" @click="onTempClick(-step)" @contextmenu.prevent>
                        <i class="fas fa-minus"></i>
                    </button>
                    <button v-if="hasMode" type="button" class="dp-kt__btn dp-kt__btn--mode" :disabled="!online || busy" :title="t('kett_mode')" @click="cycleMode">
                        <i :class="modeIcon"></i>
                    </button>
                    <button v-if="hasTempControls" type="button" class="dp-kt__btn dp-kt__btn--temp" :disabled="!online || target === null" :title="t('kett_more')" @pointerdown="startTempHold(step, $event)" @click="onTempClick(step)" @contextmenu.prevent>
                        <i class="fas fa-plus"></i>
                    </button>
                    <button v-if="hasBacklight" type="button" class="dp-kt__btn dp-kt__btn--backlight" :class="{ 'is-on': backlightOn }" :disabled="!online || busy" :title="t(backlightOn ? 'kett_backlight_off' : 'kett_backlight_on')" @click="toggleBacklight">
                        <i class="fas fa-lightbulb"></i>
                    </button>
                    <button v-if="hasLight" type="button" class="dp-kt__btn dp-kt__btn--light" :class="{ 'is-on': nightlightOn }" :disabled="!online || busy" :title="t(nightlightOn ? 'kett_nightlight_off' : 'kett_nightlight_on')" @click="toggleNightlight">
                        <i class="fas fa-moon"></i>
                    </button>
                    <button v-if="hasColor" type="button" class="dp-kt__btn dp-kt__btn--color" :disabled="!online || busy" :title="t('kett_color_title')" @click="openColor">
                        <i class="fas fa-palette"></i>
                    </button>
                </div>
                <div v-if="updatedAt && showUpdated" class="dp-kt__updated">{{ t('kett_updated') }} {{ updatedText }}</div>
            </div>
            <div v-if="colorOpen" class="dp-kt__modal" @click.self="closeColor">
                <div class="dp-kt__modal-card">
                    <div class="dp-kt__modal-head">
                        <span>{{ t('kett_color_title') }}</span>
                        <button type="button" class="dp-kt__modal-close" :disabled="!online" :title="t('kett_color_cancel')" @click="closeColor"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="dp-kt__modal-body">
                        <input type="color" v-model="colorDraft" class="dp-kt__color-input" :disabled="!online">
                        <div class="dp-kt__color-presets">
                            <button v-for="c in colorPresets" :key="c" type="button" class="dp-kt__color-preset" :class="{ 'is-active': colorDraft.toLowerCase() === c.toLowerCase() }" :style="{ background: c }" :disabled="!online" :title="c" @click="colorDraft = c"></button>
                        </div>
                        <p class="dp-kt__color-hint">{{ colorHint }}</p>
                    </div>
                    <div class="dp-kt__modal-foot">
                        <button type="button" :disabled="!online" @click="closeColor">{{ t('kett_color_cancel') }}</button>
                        <button type="button" class="dp-kt__modal-save" :disabled="!online || busy || !hasColor" @click="saveColor">{{ t('kett_color_save') }}</button>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        const ui = KettleColorUi[this.widget.id || this.widget.title || 'kettle'] || {};
        const st = (this.widget && window.__dpWidgetState[this.widget.id]) || {};
        return {
            /* Сохранение настроек увеличивает wsRev и пересоздаёт компонент.
               Без этого состояния на полсекунды появлялись «--», «Не в сети»
               и пустое кольцо, хотя чайник был подключён. */
            values: { ...(st.values || {}) }, busy: false,
            updatedAt: st.updatedAt || null, pollTimer: null, fastTimer: null, _allLoading: false,
            lastModeValue: st.lastModeValue !== undefined ? st.lastModeValue : null,
            lastTargetValue: st.lastTargetValue !== undefined ? st.lastTargetValue : null,
            tempHolding: false, tempClickHandled: false, holdDelayTimer: null, holdRepeatTimer: null,
            holdIntervalMs: 320, tempClickTimer: null, tempSyncTimer: null,
            colorOpen: !!ui.open, colorDraft: ui.draft || '#ffffff',
            colorPresets: ['#ffffff', '#ffd27a', '#ff4d4d', '#4ade80', '#60a5fa', '#c084fc', '#22d3ee', '#fb923c']
        };
    },
    watch: {
        colorOpen() { this.saveColorUi(); },
        colorDraft() { this.saveColorUi(); }
    },
    computed: {
        iconType() { return this.widget.icon_type || 'icon'; },
        showUpdated() {
            if (this.widget.show_updated === undefined || this.widget.show_updated === null || this.widget.show_updated === '') return true;
            return this.widget.show_updated === true || this.widget.show_updated === 'true' || this.widget.show_updated === '1' || this.widget.show_updated === 1;
        },
        cardStyle() {
            const s = {
                '--kt-accent': this.accent,
                '--kt-temp': this.temperatureColor || '#22d3ee',
                '--kt-rgb': this.rgbColor
            };
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
        /* Прошивка RK-M139S отдаёт heat_temp=0, когда чайник выключен, кипит
           или работает ночник: целевая температура есть только в режиме
           «подогрев». Показываем последнюю выбранную, а не этот ноль. */
        target() {
            const raw = this.numValue(this.widget.object_target, this.widget.property_target);
            if (raw !== null && raw > 34) return raw;
            if (this.lastTargetValue !== null) return this.lastTargetValue;
            let def = 85;
            if (this.minTemp !== null) def = Math.max(def, this.minTemp);
            if (this.maxTemp !== null) def = Math.min(def, this.maxTemp);
            return def;
        },
        rssi() { return this.numValue(this.widget.object_rssi, this.widget.property_rssi); },
        count() { return this.numValue(this.widget.object_count, this.widget.property_count); },
        workTime() { return this.numValue(this.widget.object_worktime, this.widget.property_worktime); },
        energy() { return this.numValue(this.widget.object_energy, this.widget.property_energy); },
        powerKw() { return this.numValue(this.widget.object_power_kw, this.widget.property_power_kw); },
        volume() { return this.numValue(this.widget.object_volume, this.widget.property_volume); },
        volumeLast() { return this.numValue(this.widget.object_volume_last, this.widget.property_volume_last); },
        /* Шлюз отдаёт -0.0/0.0, пока объём не рассчитан, — это отсутствие данных. */
        hasVolume() { return this.cfgPair('object_volume', 'property_volume') && this.volume > 0; },
        hasVolumeLast() { return this.cfgPair('object_volume_last', 'property_volume_last') && this.volumeLast > 0; },
        hasStats() {
            return [this.count, this.workTime, this.energy, this.powerKw].some(v => v !== null) || this.hasVolume || this.hasVolumeLast;
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
        powerKwText() { return this.powerKw === null ? '' : this.powerKw.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.t('kett_unit_kw'); },
        /* -0.0 и 0.0 шлюз отдаёт, пока объём не рассчитан (расчёт идёт только
           при кипячении). Показываем прочерк, а не «0 литров». */
        volumeText() {
            const v = this.volume;
            if (v === null || v <= 0) return '—';
            return v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.volumeUnit(v);
        },
        volumeLastText() {
            const v = this.volumeLast;
            if (v === null || v <= 0) return '—';
            return v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + this.volumeUnit(v);
        },
        /* Питанием управляет то же свойство, что и режимом: команда off
           выключает шлюз, команда режима — включает его в этом режиме. */
        hasPower() { return this.hasMode; },
        hasBacklight() { return this.cfgPair('object_backlight', 'property_backlight'); },
        hasLight() { return this.cfgPair('object_light', 'property_light'); },
        hasBeep() { return this.cfgPair('object_beep', 'property_beep'); },
        hasColor() { return this.cfgPair('object_rgb', 'property_rgb'); },
        colorHint() {
            if (this.lightModeValue === 'light') return this.t('kett_color_hint_light');
            return this.t(this.lightModeValue === 'night' ? 'kett_color_hint_on' : 'kett_color_hint_off');
        },
        hasMode() { return this.cfgPair('object_mode', 'property_mode') && this.modeOptions.length > 0; },
        hasTempControls() { return this.cfgPair('object_target', 'property_target') && this.step !== null; },
        hasStatus() { return this.cfgPair('object_status', 'property_status'); },
        hasRssi() { return this.cfgPair('object_rssi', 'property_rssi'); },
        powerOn() {
            const raw = this.readValue(this.widget.object_mode, this.widget.property_mode);
            if (raw === undefined || raw === null || String(raw).trim() === '') return false;
            /* hstate=cool — это включённый ночник, а не работа чайника. */
            return !this.sameValue(raw, 'off') && !this.sameValue(raw, 'cool');
        },
        backlightOn() { return this.hasBacklight && this.isOnRaw(this.widget.object_backlight, this.widget.property_backlight); },
        nightlightOn() { return this.hasLight && this.isOnRaw(this.widget.object_light, this.widget.property_light); },
        lightModeValue() {
            if (this.nightlightOn) return 'night';
            if (this.backlightOn) return 'light';
            return 'off';
        },
        lightModeLabel() {
            const parts = [];
            if (this.backlightOn) parts.push(this.t('kett_light_mode'));
            if (this.nightlightOn) parts.push(this.t('kett_light_night'));
            return parts.length ? parts.join(' + ') : this.t('kett_off');
        },
        lightIcon() { return this.nightlightOn ? 'fas fa-moon' : 'fas fa-lightbulb'; },
        lightOn() { return this.backlightOn || this.nightlightOn; },
        beepOn() { return this.isOnRaw(this.widget.object_beep, this.widget.property_beep); },
        statusLabel() {
            const raw = this.readValue(this.widget.object_status, this.widget.property_status);
            if (raw === undefined || raw === null || String(raw).trim() === '') return '';
            /* WebSocket иногда присылает булево false вместо строки offline. */
            const lower = String(raw).trim().toLowerCase();
            const s = raw === false || lower === 'false' || lower === '0' ? 'offline'
                : raw === true || lower === 'true' || lower === '1' ? 'online'
                : String(raw).trim();
            const key = 'kett_st_' + s.toLowerCase();
            const tr = this.t(key);
            return tr !== key ? tr : s;
        },
        kettleOnline() {
            return this.isOnlineValue(this.readValue(this.widget.object_status, this.widget.property_status));
        },
        gatewayOnline() {
            if (!this.cfgPair('object_gateway', 'property_gateway')) return null;
            return this.isOnlineValue(this.readValue(this.widget.object_gateway, this.widget.property_gateway));
        },
        online() {
            /* Точка в углу показывает доступность шлюза по Wi‑Fi.
               Текст «В сети / Не в сети» остаётся статусом самого чайника. */
            const gateway = this.gatewayOnline;
            return gateway !== null ? gateway : this.kettleOnline;
        },
        modeOptions() {
            return String(this.widget.modes || '').split(',').map(s => s.trim()).filter(Boolean).map(s => {
                const p = s.split('|').map(x => x.trim());
                return { value: p[0], label: p[1] || p[0] };
            /* Выключение — задача кнопки питания, в списке режимов его нет. */
            }).filter(o => o.value !== '' && !this.sameValue(o.value, 'off'));
        },
        rememberedModeValue() {
            if (this.lastModeValue) return String(this.lastModeValue);
            try {
                const key = this.modeStorageKey();
                return key ? (localStorage.getItem(key) || '') : '';
            } catch (e) { return ''; }
        },
        rememberedMode() {
            const value = this.rememberedModeValue;
            if (!value) return null;
            return this.modeOptions.find(o => this.sameValue(o.value, value)) || null;
        },
        currentMode() {
            const raw = this.readValue(this.widget.object_mode, this.widget.property_mode);
            const remembered = this.rememberedMode;
            if (raw === undefined || raw === null || String(raw).trim() === '' || this.sameValue(raw, 'off')) {
                return remembered || this.modeOptions[0] || null;
            }
            const value = String(raw).trim();
            /* Шлюз отдаёт hstate=auto и для «Кипячения», и для «Кипячения + подогрев».
               После нажатия помним, какую именно команду послали, чтобы подпись
               кнопки не прыгала на другую запись с тем же статусом шлюза. */
            if (value.toLowerCase() === 'auto' && remembered && ['boil', 'auto'].indexOf(String(remembered.value).toLowerCase()) >= 0) {
                return remembered;
            }
            return this.modeOptions.find(o => this.sameValue(value, o.value)) || remembered || this.modeOptions[0] || null;
        },
        modeLabel() {
            const m = this.currentMode;
            if (!m) return this.t('kett_unknown');
            const shortKey = m.label + '_short';
            const short = this.t(shortKey);
            if (short !== shortKey) return short;
            const tr = this.t(m.label);
            return tr !== m.label ? tr : m.label;
        },
        modeIcon() {
            if (!this.currentMode) return 'fas fa-question';
            const k = String(this.currentMode.label).toLowerCase();
            if (k.indexOf('off') >= 0 || k.indexOf('выкл') >= 0) return 'fas fa-power-off';
            if (k.indexOf('light') >= 0 || k.indexOf('подсвет') >= 0) return 'fas fa-lightbulb';
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
        /* Как у чайника: при включённой подсветке цвет кольца зависит от
           температуры воды — от холодного синего до красного у кипения. */
        temperatureColor() {
            const t = this.temp;
            if (t === null || !Number.isFinite(t)) return null;
            const stops = [
                { t: 20, c: [59, 130, 246] },
                { t: 40, c: [34, 211, 238] },
                { t: 60, c: [74, 222, 128] },
                { t: 80, c: [251, 191, 36] },
                { t: 100, c: [239, 68, 68] }
            ];
            let a = stops[0], b = stops[stops.length - 1];
            if (t <= a.t) b = a;
            else if (t >= b.t) a = b;
            else {
                for (let i = 0; i < stops.length - 1; i++) {
                    if (t >= stops[i].t && t <= stops[i + 1].t) { a = stops[i]; b = stops[i + 1]; break; }
                }
            }
            const p = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
            const rgb = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * p));
            return '#' + rgb.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
        },
        /* Выбранный цвет ночника — берётся из RGB всегда, независимо от того,
           включена подсветка или нет. */
        rgbColor() {
            let raw = String(this.readValue(this.widget.object_rgb, this.widget.property_rgb) || '').trim().replace(/^#/, '');
            /* Шлюз отдаёт цвет тройкой «r,g,b», старый объект — HEX. */
            const parts = raw.split(',').map(s => s.trim());
            if (parts.length === 3 && parts.every(s => /^\d{1,3}$/.test(s))) {
                return '#' + parts.map(s => Math.max(0, Math.min(255, Number(s))).toString(16).padStart(2, '0')).join('');
            }
            if (/^[0-9a-fA-F]{6}$/.test(raw)) return '#' + raw;
            return '#22d3ee';
        },
        accent() {
            /* Цвет по температуре — только у подсветки, когда ночник выключен. */
            if (this.lightModeValue === 'light' && this.temperatureColor) return this.temperatureColor;
            return this.rgbColor;
        },
        updatedText() {
            const d = new Date(this.updatedAt);
            return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
        }
    },
    created() {
        this.migrateLegacy();
        this.restoreTarget();
    },
    mounted() {
        this.loadAll();
        this.pollTimer = setInterval(() => this.loadAll(), window.__dpPollInterval(this.widget, 5));
        /* Температура, статус и питание должны меняться без полной
           перезагрузки: сервер не всегда рассылает эти свойства по WS. */
        this.fastTimer = setInterval(() => this.loadFast(), 1000);
        window.addEventListener('keydown', this.onKeydown);
    },
    beforeUnmount() {
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.fastTimer) clearInterval(this.fastTimer);
        if (this.tempSyncTimer) clearTimeout(this.tempSyncTimer);
        this.stopTempHold(null, false);
        window.removeEventListener('keydown', this.onKeydown);
    },
    methods: {
        isOnlineValue(raw) {
            if (raw === undefined || raw === null) return false;
            return ['1', 'true', 'on', 'online'].indexOf(String(raw).trim().toLowerCase()) >= 0;
        },
        /* 1 / on / true / вкл и 0 / off / false / выкл — одно и то же. */
        isOnRaw(object, property) { return this.sameValue(this.readValue(object, property), 'ON'); },
        cfg(k) {
            const v = this.widget[k];
            return v !== undefined && v !== null && String(v).trim() !== '';
        },
        cfgPair(objKey, propKey) { return this.cfg(objKey) && this.cfg(propKey); },
        migrateLegacy() {
            const w = this.widget;
            if (!w.object_light && w.object_light_set) w.object_light = w.object_light_set;
            if (!w.property_light && w.property_light_set) w.property_light = w.property_light_set;
            if (!w.object_beep && w.object_beep_set) w.object_beep = w.object_beep_set;
            if (!w.property_beep && w.property_beep_set) w.property_beep = w.property_beep_set;
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
        sameValue(a, b) {
            const x = String(a === undefined || a === null ? '' : a).trim();
            const y = String(b === undefined || b === null ? '' : b).trim();
            if (x.toLowerCase() === y.toLowerCase()) return true;
            /* ON/OFF, 1/0, true/false и вкл/выкл считаем одним и тем же. */
            const norm = s => {
                const l = s.toLowerCase();
                if (['1', 'on', 'true', 'вкл'].indexOf(l) >= 0) return '1';
                if (['0', 'off', 'false', 'выкл'].indexOf(l) >= 0) return '0';
                return null;
            };
            const nx = norm(x), ny = norm(y);
            if (nx !== null && ny !== null) return nx === ny;
            return x !== '' && y !== '' && !Number.isNaN(Number(x)) && !Number.isNaN(Number(y)) && Number(x) === Number(y);
        },
        persistState() {
            const id = this.widget && this.widget.id;
            if (!id) return;
            window.__dpWidgetState[id] = {
                values: { ...this.values },
                updatedAt: this.updatedAt,
                lastModeValue: this.lastModeValue,
                lastTargetValue: this.lastTargetValue
            };
        },
        async fetchPairs(pairs, fresh) {
            await Promise.all(pairs.filter(p => p[0] && p[1]).map(async p => {
                /* Пока кнопку удерживают, не затираем оптимистично набранную
                   температуру старым значением из MQTT. */
                if (this.tempHolding && p[0] === this.widget.object_target && p[1] === this.widget.property_target) return;
                try {
                    const d = await dpAPI(
                        'getProperty?' + new URLSearchParams({ object: p[0], property: p[1] }),
                        fresh ? { fresh: true } : undefined
                    );
                    if (d && !d.error && d.value !== undefined) this.values[p[0] + '.' + p[1]] = d.value;
                } catch (e) {}
            }));
            this.persistState();
        },
        async loadAll() {
            if (this._allLoading) return;
            this._allLoading = true;
            try {
                await this.fetchPairs([
                    [this.widget.object, this.widget.property],
                    [this.widget.object_target, this.widget.property_target],
                    [this.widget.object_mode, this.widget.property_mode],
                    [this.widget.object_status, this.widget.property_status],
                    [this.widget.object_gateway, this.widget.property_gateway],
                    [this.widget.object_light, this.widget.property_light],
                    [this.widget.object_backlight, this.widget.property_backlight],
                    [this.widget.object_beep, this.widget.property_beep],
                    [this.widget.object_rgb, this.widget.property_rgb],
                    [this.widget.object_rssi, this.widget.property_rssi],
                    [this.widget.object_count, this.widget.property_count],
                    [this.widget.object_worktime, this.widget.property_worktime],
                    [this.widget.object_energy, this.widget.property_energy],
                    [this.widget.object_power_kw, this.widget.property_power_kw],
                    [this.widget.object_volume, this.widget.property_volume],
                    [this.widget.object_volume_last, this.widget.property_volume_last]
                ], true);
                this.rememberTarget(this.numValue(this.widget.object_target, this.widget.property_target));
                this.updatedAt = Date.now();
                this.persistState();
            } finally {
                this._allLoading = false;
            }
        },
        /* Только «живые» поля: сервер шлёт их нерегулярно, поэтому опрашиваем
           чаще, чем остальную статистику. Кэш WS читается, если он свежий. */
        async loadFast() {
            if (this._allLoading) return;
            await this.fetchPairs([
                [this.widget.object, this.widget.property],
                [this.widget.object_status, this.widget.property_status],
                [this.widget.object_gateway, this.widget.property_gateway],
                [this.widget.object_mode, this.widget.property_mode],
                [this.widget.object_target, this.widget.property_target]
            ], false);
        },
        modeStorageKey() {
            const id = this.widget.id || this.widget.title || '';
            return id ? 'dp_kt_last_mode_' + id : '';
        },
        targetStorageKey() {
            const id = this.widget.id || this.widget.title || '';
            return id ? 'dp_kt_last_target_' + id : '';
        },
        restoreTarget() {
            try {
                const key = this.targetStorageKey();
                const raw = key ? localStorage.getItem(key) : null;
                const n = Number(raw);
                if (raw !== null && Number.isFinite(n) && n > 34) this.lastTargetValue = n;
            } catch (e) {}
        },
        rememberTarget(value) {
            const n = Number(value);
            if (!Number.isFinite(n) || n <= 34) return;
            this.lastTargetValue = n;
            try {
                const key = this.targetStorageKey();
                if (key) localStorage.setItem(key, String(n));
            } catch (e) {}
            this.persistState();
        },
        rememberMode(value) {
            this.lastModeValue = String(value);
            try {
                const key = this.modeStorageKey();
                if (key) localStorage.setItem(key, String(value));
            } catch (e) {}
            this.persistState();
        },
        colorUiKey() { return this.widget.id || this.widget.title || 'kettle'; },
        saveColorUi() {
            KettleColorUi[this.colorUiKey()] = { open: this.colorOpen, draft: this.colorDraft };
        },
        openColor() {
            if (!this.hasColor) return;
            this.colorDraft = this.accent;
            this.colorOpen = true;
            this.saveColorUi();
        },
        closeColor() {
            this.colorOpen = false;
            this.saveColorUi();
        },
        saveColor() {
            if (!this.hasColor) return;
            const hex = /^#[0-9a-fA-F]{6}$/.test(this.colorDraft) ? this.colorDraft : '#ffffff';
            const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
            this.write(this.widget.object_rgb, this.widget.property_rgb, rgb);
            this.colorOpen = false;
            this.saveColorUi();
        },
        onKeydown(e) {
            if (this.colorOpen && e.key === 'Escape') this.closeColor();
        },
        async write(object, property, value, lock = true, refresh = true) {
            if (!object || !property || this.online === false) return;
            this.values[object + '.' + property] = String(value);
            this.persistState();
            if (lock) this.busy = true;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({ object: object, property: property, value: String(value) }));
                if (refresh) setTimeout(() => this.loadAll(), 400);
            } catch (e) { console.error(e); }
            if (lock) setTimeout(() => { this.busy = false; }, 250);
        },
        togglePower() {
            if (this.powerOn) {
                this.write(this.widget.object_mode, this.widget.property_mode, 'off');
                return;
            }
            const mode = this.currentMode || this.modeOptions[0];
            if (!mode) return;
            this.rememberMode(mode.value);
            this.write(this.widget.object_mode, this.widget.property_mode, mode.value);
        },
        /* Подсветка и ночник — разные топики и разные кнопки. Пишем только
           изменившееся состояние: лишний OFF уходит командой «off» и сбрасывает
           нужную температуру. */
        toggleBacklight() {
            if (!this.hasBacklight) return;
            const target = this.backlightOn ? 'OFF' : 'ON';
            if (!this.sameValue(this.readValue(this.widget.object_backlight, this.widget.property_backlight), target)) {
                this.write(this.widget.object_backlight, this.widget.property_backlight, target);
            }
        },
        toggleNightlight() {
            if (!this.hasLight) return;
            const target = this.nightlightOn ? 'OFF' : 'ON';
            if (!this.sameValue(this.readValue(this.widget.object_light, this.widget.property_light), target)) {
                this.write(this.widget.object_light, this.widget.property_light, target);
            }
        },
        toggleBeep() {
            this.write(this.widget.object_beep, this.widget.property_beep, this.beepOn ? 'OFF' : 'ON');
        },
        /* Пультовый режим: короткое нажатие — один шаг, удержание — повтор
           с ускорением. Клик от pointer-события гасим, клавиатура работает как раньше. */
        onTempClick(delta) {
            if (this.tempClickHandled) return;
            this.changeTemp(delta);
        },
        startTempHold(delta, e) {
            if (!e || (e.isPrimary === false) || (e.button !== undefined && e.button !== 0)) return;
            if (this.target === null || this.step === null) return;
            if (e.pointerId !== undefined) {
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
            }
            this.tempHolding = true;
            this.tempClickHandled = true;
            this.holdIntervalMs = 320;
            this.changeTemp(delta);
            this.holdDelayTimer = setTimeout(() => this.scheduleTempRepeat(delta), 450);
            window.addEventListener('pointerup', this.stopTempHold);
            window.addEventListener('pointercancel', this.stopTempHold);
            window.addEventListener('blur', this.stopTempHold);
        },
        scheduleTempRepeat(delta) {
            this.holdRepeatTimer = setTimeout(() => {
                this.changeTemp(delta);
                this.holdIntervalMs = Math.max(70, this.holdIntervalMs - 30);
                this.scheduleTempRepeat(delta);
            }, this.holdIntervalMs);
        },
        stopTempHold(e, sync = true) {
            if (!this.tempHolding) return;
            this.tempHolding = false;
            if (this.holdDelayTimer) clearTimeout(this.holdDelayTimer);
            if (this.holdRepeatTimer) clearTimeout(this.holdRepeatTimer);
            this.holdDelayTimer = null;
            this.holdRepeatTimer = null;
            window.removeEventListener('pointerup', this.stopTempHold);
            window.removeEventListener('pointercancel', this.stopTempHold);
            window.removeEventListener('blur', this.stopTempHold);
            if (this.tempClickTimer) clearTimeout(this.tempClickTimer);
            this.tempClickTimer = setTimeout(() => { this.tempClickHandled = false; }, 0);
            if (sync) setTimeout(() => this.loadAll(), 500);
        },
        changeTemp(delta) {
            if (this.target === null || this.step === null) return;
            let v = this.target + delta;
            if (this.minTemp !== null) v = Math.max(this.minTemp, v);
            if (this.maxTemp !== null) v = Math.min(this.maxTemp, v);
            this.rememberTarget(v);
            /* Не блокируем кнопку и не дёргаем лишний опрос на каждом шаге. */
            this.write(this.widget.object_target, this.widget.property_target, v, false, false);
            if (this.tempSyncTimer) clearTimeout(this.tempSyncTimer);
            this.tempSyncTimer = setTimeout(() => this.loadAll(), 700);
        },
        cycleMode() {
            const opts = this.modeOptions;
            if (!opts.length) return;
            const base = this.currentMode || opts[0];
            const idx = opts.findIndex(o => this.sameValue(o.value, base.value));
            const next = opts[(idx + 1) % opts.length];
            this.rememberMode(next.value);
            /* Пока чайник выключен, кнопка только выбирает режим; команда
               шлюзу уходит при нажатии кнопки питания. */
            if (this.powerOn) this.write(this.widget.object_mode, this.widget.property_mode, next.value);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.kettle = KettleWidget;
