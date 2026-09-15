const GroupWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'widgets', label: 'tab_widgets', fields: 'widgets' },
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
            { key: 'hide_title', label: 'field_hide_title', type: 'checkbox', row: 'hide_row' },
            { key: 'hide_icon', label: 'field_hide_icon', type: 'checkbox', row: 'hide_row' },
            { key: 'hide_count', label: 'field_hide_count', type: 'checkbox', row: 'toggles_row' },
            { key: 'dividers', label: 'field_dividers', type: 'checkbox', row: 'toggles_row' },
            { key: 'columns', label: 'field_group_columns', type: 'slider', min: 1, max: 4, step: 1 },
        ],
        widgets: [],
        advanced: [
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-layer-group', icon_type: 'icon', hide_title: false, hide_icon: false, hide_count: false, dividers: false, columns: 2, children: [] },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--disabled': !available }" :style="cardStyle">
            <div class="widget-v-card__header" v-if="!widget.hide_title || !widget.hide_icon">
                <i v-if="widget.icon && !widget.hide_icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title" v-if="!widget.hide_title">{{ widget.title || t('widget_group') }}</div>
                <i v-if="!available" class="fas fa-ban widget-v-card__locked-icon"></i>
                <span v-else-if="count && !widget.hide_count" class="widget-v-card__count">{{ count }} {{ t('units_widgets') }}</span>
            </div>
            <div v-if="widget.children && widget.children.length" class="group-widgets-grid" :class="{ 'group-widgets-grid--dividers': widget.dividers }" :style="gridStyle">
                <div v-for="child in widget.children" :key="child.id" class="group-widgets-grid__cell" :style="cellStyle(child)">
                    <component :is="childWidgetComponent(child.type)" :widget="child"></component>
                </div>
            </div>
            <div v-else class="widget-v-card__body group-widgets-grid group-widgets-grid--empty">
                <div>
                    <i class="fas fa-layer-group" :style="emptyIconStyle"></i>
                    {{ t('widget_group_empty') }}
                </div>
            </div>
        </div>`,
    data() {
        return { cols: 2, available: true, availTimer: null };
    },
    mounted() {
        this.checkAvailable();
        this.availTimer = setInterval(() => this.checkAvailable(), 3000);
    },
    beforeUnmount() { if (this.availTimer) clearInterval(this.availTimer); },
    computed: {
        count() { return this.widget.children ? this.widget.children.length : 0; },
        columns() {
            const c = Number(this.widget.columns);
            return (c >= 1 && c <= 4) ? c : 2;
        },
        gridStyle() {
            if (!this.widget.children || !this.widget.children.length) return {};
            return {
                gridTemplateColumns: 'repeat(' + this.columns + ', minmax(0, 1fr))',
                '--group-cols': this.columns
            };
        },
        emptyIconStyle() { return { fontSize: '1.5rem', display: 'block', marginBottom: '6px', color: 'var(--on-theme-dim)' }; },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async checkAvailable() {
            const obj = this.widget.object_alive;
            const prop = this.widget.property_alive;
            if (!obj || !prop) { this.available = true; return; }
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop }));
                this.available = !d.error && String(d.value) !== '0' && String(d.value).toLowerCase() !== 'false';
            } catch (e) { /* keep last state on transient error */ }
        },
        cellStyle(child) {
            const span = Math.min(this.columns, Math.max(1, Number(child.span) || 1));
            return { gridColumn: 'span ' + span };
        },
        childWidgetComponent(type) {
            if (typeof registerWidgetComponent === 'function') return registerWidgetComponent(type);
            return null;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.group = GroupWidget;