const DimmerWidget = {
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
            { key: 'object_switch_obj', label: 'field_switch_object', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_switch', label: 'field_switch_method', type: 'method', parent: 'object_switch', row: 'm_switch' },
            { key: 'help', type: 'info', text: 'Параметры уровня яркости' },
            { key: 'level_min', label: 'Мин', type: 'number', row: 'range' },
            { key: 'level_max', label: 'Макс', type: 'number', row: 'range' },
            { key: 'level_step', label: 'field_step', type: 'number', row: 'range' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-lightbulb', icon_type: 'icon', property: 'level', level_min: 0, level_max: 100, level_step: 1, background: false, round: false },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Диммер' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
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
        return { isOn: false, level: 0, loading: false, timer: null, min: 0, max: 100, step: 1 };
    },
    mounted() {
        this.min = this.widget.level_min != null ? Number(this.widget.level_min) : 0;
        this.max = this.widget.level_max != null ? Number(this.widget.level_max) : 100;
        this.step = this.widget.level_step != null ? Number(this.widget.level_step) : 1;
        this.loadState();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadState(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        levelPerc() {
            const range = this.max - this.min;
            if (range === 0) return 0;
            return ((this.level - this.min) / range) * 100;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadState() {
            let obj = this.widget.object_value || this.widget.object;
            let levelProp = this.widget.property || 'level';
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: levelProp }));
                if (!d.error && d.value !== undefined) {
                    const val = Number(d.value);
                    this.level = isNaN(val) ? 0 : Math.min(this.max, Math.max(this.min, val));
                    this.isOn = this.level > 0;
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading) return;
            this.loading = true;
            const next = !this.isOn;
            let obj = this.widget.object_value || this.widget.object;
            try {
                if (this.widget.object_switch) {
                    const p = this.widget.object_switch.split('/');
                    await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
                } else {
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
            let obj = this.widget.object_value || this.widget.object;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: this.widget.property || 'level', value: String(this.level)
                }));
                this.isOn = this.level > 0;
            } catch (e) { /* silent */ }
            this.loading = false;
        }
    }
};