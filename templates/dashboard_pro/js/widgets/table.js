const TableWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'main' },
        { key: 'params', label: 'tab_params', fields: 'params' },
        { key: 'columns', label: 'tab_columns', fields: 'columns' },
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
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
        main: [
            { key: 'url', label: 'field_url_json', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'query', label: 'Запрос', type: 'textarea', rows: 5, placeholder: 'SQL-запрос или JSONPath' },
        ],
        columns: [
            { key: 'info', label: 'field_info_data', type: 'text' },
            { key: 'data_name', label: 'field_column_name', type: 'text' },
            { key: 'align', label: 'field_align', type: 'select', options: [
                { value: 'start', title: 'Left' },
                { value: 'center', title: 'Center' },
                { value: 'end', title: 'Right' },
            ]},
            { key: 'width', label: 'field_width', type: 'text' },
            { key: 'sortable', label: 'field_sortable', type: 'checkbox' },
            { key: 'separator', label: 'field_separator', type: 'checkbox' },
            { key: 'data_type', label: 'field_data_type', type: 'select', options: [] },
            { key: 'color_column', label: 'field_color_column', type: 'text' },
        ],
    },
    defaults: { icon: 'fas fa-table', icon_type: 'icon', url: '', query: '', refresh: 60, columns: '[]' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Таблица' }}</div>
            </div>
            <div class="widget-v-card__body" style="flex:1;padding:0;overflow:auto">
                <table v-if="rows.length" style="width:100%;border-collapse:collapse;font-size:.8rem">
                    <thead>
                        <tr style="background:rgba(255,255,255,.06)">
                            <th v-for="col in cols" :key="col" style="padding:6px 8px;text-align:left;color:rgba(255,255,255,.6);font-weight:500;white-space:nowrap">{{ col }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, ri) in rows" :key="ri" style="border-top:1px solid rgba(255,255,255,.06)">
                            <td v-for="(cell, ci) in row" :key="ci" style="padding:4px 8px;color:rgba(255,255,255,.8);white-space:nowrap">{{ cell }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else style="text-align:center;padding:16px;color:rgba(255,255,255,.35);font-size:.8rem">Нет данных</div>
            </div>
        </div>`,
    data() { return { items: [], timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        cols() {
            if (!this.items.length) return [];
            return Object.keys(this.items[0]);
        },
        rows() {
            return this.items.map(item => this.cols.map(c => item[c]));
        }
    },
    mounted() {
        this.load();
        const url = this.widget.url || '';
        if (url) this.timer = setInterval(() => this.load(), 30000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async load() {
            const url = this.widget.url || '';
            const obj = this.widget.object;
            if (url && url.startsWith('http')) {
                try {
                    const r = await fetch(url);
                    const d = await r.json();
                    if (Array.isArray(d)) this.items = d.slice(0, 50);
                } catch(e) {}
            } else if (obj) {
                try {
                    const d = await dpAPI('getProperties?' + new URLSearchParams({ object: obj }));
                    if (!d.error && Array.isArray(d.properties)) {
                        this.items = d.properties.slice(0, 50).map(p => ({ property: p.name, value: p.value }));
                    }
                } catch(e) {}
            }
        }
    }
};
