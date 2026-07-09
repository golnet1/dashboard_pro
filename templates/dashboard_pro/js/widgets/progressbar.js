const ProgressBarWidget = {
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
            { key: 'level_min', label: 'field_min', type: 'number', row: 'range' },
            { key: 'level_max', label: 'field_max', type: 'number', row: 'range' },
            { key: 'striped', label: 'field_striped', type: 'checkbox' },
            { key: 'rounded', label: 'field_rounded', type: 'checkbox' },
            { key: 'color_progress', label: 'field_progress_color', type: 'text', default: 'primary', placeholder: 'ph_color_value' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-chart-bar', icon_type: 'icon', level_min: 0, level_max: 100, striped: false, rounded: false, color_progress: 'primary' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header" v-if="widget.title || widget.icon">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_progressbar') }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;padding:8px 12px;flex:1">
                <div style="width:100%">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px" v-if="value !== null">
                        <span style="font-size:.8rem;color:rgba(255,255,255,.6)">{{ widget.pre_info || '' }}</span>
                        <span style="font-size:.8rem;color:rgba(255,255,255,.6)">{{ value }}{{ widget.unit || '' }}</span>
                        <span style="font-size:.8rem;color:rgba(255,255,255,.6)">{{ widget.pos_info || '' }}</span>
                    </div>
                    <div class="v-progress-linear" :class="{ 'v-progress-linear--striped': widget.striped, 'v-progress-linear--rounded': widget.rounded }" :style="{height: '24px', background: 'rgba(255,255,255,.12)', borderRadius: widget.rounded ? '12px' : '4px', overflow: 'hidden'}">
                        <div class="v-progress-linear__determinate" :style="{width: percent + '%', background: progressColor, height: '100%', transition: 'width .3s', borderRadius: widget.rounded ? '12px' : '4px'}"></div>
                    </div>
                </div>
            </div>
        </div>`,
    data() {
        return { value: null, timer: null, min: 0, max: 100 };
    },
    mounted() {
        this.min = this.widget.level_min != null ? Number(this.widget.level_min) : 0;
        this.max = this.widget.level_max != null ? Number(this.widget.level_max) : 100;
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        percent() {
            if (this.value === null) return 0;
            const range = this.max - this.min;
            if (range === 0) return 0;
            return Math.min(100, Math.max(0, ((this.value - this.min) / range) * 100));
        },
        progressColor() {
            if (this.widget.color_progress) return this.widget.color_progress;
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