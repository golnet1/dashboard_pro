const DimmerWidget = {
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
            { key: 'object_switch_obj', label: 'field_switch_object', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_switch', label: 'field_switch_method', type: 'method', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_on_obj', label: 'field_on_object', type: 'method_object', parent: 'object_on', row: 'm_on' },
            { key: 'object_on', label: 'field_on_method', type: 'method', parent: 'object_on', row: 'm_on' },
            { key: 'object_off_obj', label: 'field_off_object', type: 'method_object', parent: 'object_off', row: 'm_off' },
            { key: 'object_off', label: 'field_off_method', type: 'method', parent: 'object_off', row: 'm_off' },
            { key: 'object_level', label: 'field_level_object', type: 'object', row: 'level_prop' },
            { key: 'property_level', label: 'field_level_property', type: 'property', row: 'level_prop' },
            { key: 'help', type: 'info', text: 'help_brightness_params' },
            { key: 'level_min', label: 'field_min', type: 'number', row: 'range' },
            { key: 'level_max', label: 'field_max', type: 'number', row: 'range' },
            { key: 'level_step', label: 'field_step', type: 'number', row: 'range' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
            { key: 'object_info', label: 'field_object_info', type: 'object', row: 'info_row' },
            { key: 'property_info', label: 'field_info_property', type: 'property', row: 'info_row' },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-lightbulb', icon_type: 'icon', property: 'level', level_min: 0, level_max: 100, level_step: 1, background: false, round: false },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_dimmer') }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" :style="aliveDisabled ? 'opacity:.4;pointer-events:none' : ''" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div v-if="widget.object_info && infoValue" class="widget-v-card__info">
                <span v-if="widget.pre_info">{{ widget.pre_info }}</span>{{ infoDisplay }}<span v-if="widget.pos_info">{{ widget.pos_info }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:0 12px 12px">
                <div class="v-slider theme--dark" style="width:100%">
                    <input type="range" class="v-slider__input" :min="min" :max="max" :step="step" v-model.number="level" @change="onChange" :disabled="loading">
                    <div class="v-slider__track"><div class="v-slider__track-fill" :style="{width: levelPerc + '%'}"></div></div>
                    <div class="v-slider__thumb-container" :style="{left: levelPerc + '%'}"><div class="v-slider__thumb"></div></div>
                </div>
                <div style="text-align:center;font-size:.85rem;margin-top:4px;color:rgba(255,255,255,.6)">{{ level }}{{ widget.unit || '%' }}</div>
            </div>
        </div>`,
    data() {
        return { isOn: false, level: 0, loading: false, timer: null, infoTimer: null, infoValue: '', isAlive: true, min: 0, max: 100, step: 1, infoTick: 0, secTimer: null };
    },
    mounted() {
        this.min = this.widget.level_min != null ? Number(this.widget.level_min) : 0;
        this.max = this.widget.level_max != null ? Number(this.widget.level_max) : 100;
        this.step = this.widget.level_step != null ? Number(this.widget.level_step) : 1;
        this.loadState();
        let obj = this.levelObject();
        if (obj) this.timer = setInterval(() => this.loadState(), 5000);
        if (this.widget.object_alive && this.widget.property_alive) this.checkAlive();
        if (this.widget.object_info) this.loadInfo();
        this.secTimer = setInterval(() => { if (this.infoValue) this.infoTick++; }, 1000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.infoTimer) clearInterval(this.infoTimer);
        if (this.secTimer) clearInterval(this.secTimer);
    },
    computed: {
        infoDisplay() {
            if (!this.infoValue) return '';
            void this.infoTick;
            return dpInfoDisplay(this.infoValue);
        },
        levelPerc() {
            const range = this.max - this.min;
            if (range === 0) return 0;
            return ((this.level - this.min) / range) * 100;
        },
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        levelObject() {
            return this.widget.object_level || this.widget.object_value || this.widget.object;
        },
        levelProperty() {
            return this.widget.property_level || this.widget.property || 'level';
        },
        async loadState() {
            const obj = this.levelObject();
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: this.levelProperty() }));
                if (!d.error && d.value !== undefined) {
                    const val = Number(d.value);
                    this.level = isNaN(val) ? 0 : Math.min(this.max, Math.max(this.min, val));
                    this.isOn = this.level > 0;
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading || this.aliveDisabled) return;
            this.loading = true;
            const next = !this.isOn;
            try {
                if (this.widget.object_switch) {
                    const p = this.widget.object_switch.split('/');
                    await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
                } else if (this.widget.object_on && this.widget.object_off) {
                    const pon = this.widget.object_on.split('/');
                    const poff = this.widget.object_off.split('/');
                    const p = next ? pon : poff;
                    await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
                } else {
                    const obj = this.levelObject();
                    await dpAPI('setProperty?' + new URLSearchParams({
                        object: obj, property: this.widget.property || 'status', value: next ? '1' : '0'
                    }));
                }
                this.isOn = next;
                if (next && this.level === 0) this.level = Math.round((this.max - this.min) / 2);
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        async onChange() {
            if (this.loading) return;
            this.loading = true;
            const obj = this.levelObject();
            try {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: this.levelProperty(), value: String(this.level)
                }));
                this.isOn = this.level > 0;
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async loadInfo() {
            if (!this.widget.object_info) return;
            try {
                const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error) this.infoValue = d.value;
            } catch (e) { /* silent */ }
            this.infoTimer = setInterval(() => {
                if (this.widget.object_info) {
                    const params = this.widget.property_info ? { object: this.widget.object_info, property: this.widget.property_info } : { object: this.widget.object_info };
                    dpAPI('getProperty?' + new URLSearchParams(params))
                        .then(d => { if (!d.error) this.infoValue = d.value; })
                        .catch(() => {});
                }
            }, 5000);
        }
    }
};