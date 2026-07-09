const ValueWidget = {
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
            { key: 'aliasLabels', label: 'field_alias_labels', type: 'text', placeholder: '{"1":"'+t('default_on')+'","0":"'+t('default_off')+'"}' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'object_info', label: 'field_object_info', type: 'object', row: 'info_row' },
            { key: 'property_info', label: 'field_info_property', type: 'property', row: 'info_row' },
            { key: 'pre_info', label: 'field_info_prefix', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'field_info_postfix', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-hashtag', icon_type: 'icon', aliasLabels: null, background: false, round: false },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_value') }}</div>
                <div class="widget-v-card__spacer"></div>
                <div v-if="widget.object_info && infoValue" class="widget-v-card__info" style="padding:0;font-size:.75rem">
                    <span v-if="widget.pre_info">{{ widget.pre_info }}</span>{{ infoValue }}<span v-if="widget.pos_info">{{ widget.pos_info }}</span>
                </div>
            </div>
            <div class="widget-v-card__value">
                <span class="widget-v-card__value-text">{{ displayValue }}</span>
                <span class="widget-v-card__unit" v-if="widget.unit">{{ widget.unit }}</span>
            </div>
        </div>`,
    data() {
        return { value: null, timer: null, infoValue: '', infoTimer: null };
    },
    mounted() {
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        let prop = this.widget.property;
        if (obj && prop) this.timer = setInterval(() => this.loadValue(), 5000);
        if (this.widget.object_info) this.loadInfo();
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.infoTimer) clearInterval(this.infoTimer);
    },
    computed: {
        displayValue() {
            if (this.value === null) return '—';
            return this.value;
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
            if (!obj || !prop) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    let val = d.value;
                    if (typeof val === 'number' && !Number.isInteger(val))
                        val = val.toFixed(1);
                    if (this.widget.aliasLabels) {
                        try {
                            const labels = typeof this.widget.aliasLabels === 'string' ? JSON.parse(this.widget.aliasLabels) : this.widget.aliasLabels;
                            if (labels && labels[val] !== undefined) val = labels[val];
                        } catch(e) {}
                    }
                    this.value = val;
                }
            } catch (e) { /* silent */ }
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