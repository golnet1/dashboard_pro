const ButtonWidget = {
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
            { key: 'buttonText', label: 'field_button_text', type: 'text', default: 'default_execute' },
            { key: 'value', label: 'field_value', type: 'text', default: '1' },
            { key: 'method', label: 'field_method', type: 'text', placeholder: 'method_name' },
            { key: 'command', label: 'field_command', type: 'text', placeholder: 'ph_command_optional' },
            { key: 'hold', label: 'field_hold', type: 'number', default: 1 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-play', icon_type: 'icon', buttonText: 'default_execute', hold: 1, value: '1', command: '', method: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_button') }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px">
                <button class="v-btn v-btn--is-elevated v-btn--has-bg theme--dark" style="min-width:120px" :class="{ 'v-btn--loading': loading }" @click="execute" :disabled="loading">
                    <span class="v-btn__content">
                        <i v-if="widget.icon" :class="widget.icon" style="margin-right:6px"></i>
                        {{ loading ? '...' : (widget.buttonText || t('default_execute')) }}
                    </span>
                </button>
            </div>
        </div>`,
    data() { return { loading: false }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async execute() {
            if (this.loading) return;
            this.loading = true;
            try {
                if (this.widget.method) {
                    const m = this.widget.method;
                    const p = m.includes('/') ? m.split('/') : [m, ''];
                    await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
                } else if (this.widget.object && this.widget.value !== undefined) {
                    const params = { object: this.widget.object, value: this.widget.value };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
                if (this.widget.command) {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: this.widget.command }));
                }
            } catch (e) { console.error(e); }
            if (this.widget.hold) {
                setTimeout(() => this.loading = false, (this.widget.hold || 1) * 1000);
            } else {
                this.loading = false;
            }
        }
    }
};