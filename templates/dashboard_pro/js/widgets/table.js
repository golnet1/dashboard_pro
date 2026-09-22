const TableWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'main' },
        { key: 'columns', label: 'tab_columns', fields: 'columns' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        main: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'query', label: 'field_query', type: 'textarea', rows: 5 },
            { key: 'timeout', label: 'field_refresh_period', type: 'number', default: 0 },
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
        advanced: [
            { key: 'callback_type', label: 'field_callback_type', type: 'select', options: [{value:'none',label:'opt_none'},{value:'property',label:'opt_property'},{value:'method',label:'opt_method'},{value:'script',label:'opt_script'}] },
            { key: 'object', label: 'field_object', type: 'object', row: 'cb_obj_prop', showIf: { callback_type: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'cb_obj_prop', showIf: { callback_type: 'property' } },
            { key: 'callback_method_obj', label: 'field_method_object', type: 'method_object', parent: 'callback_method', row: 'cb_method', showIf: { callback_type: 'method' } },
            { key: 'callback_method', label: 'field_method', type: 'method', parent: 'callback_method', row: 'cb_method', showIf: { callback_type: 'method' } },
            { key: 'script', label: 'field_script', type: 'script', showIf: { callback_type: 'script' } },
        ],
    },
    defaults: { icon: 'fas fa-table', icon_type: 'icon', query: '', timeout: 0, columns: '[]', height: 200, callback_type: 'none', script: '', callback_method: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_table') }}</div>
                <div class="graph-toolbar table-toolbar">
                    <button type="button" :title="t('refresh')" @click.stop="updateData"><i class="fas fa-sync"></i></button>
                </div>
            </div>
            <div class="widget-v-card__body" style="flex:1;padding:0;overflow:auto">
                <div v-if="loading" style="text-align:center;padding:16px;color:rgba(255,255,255,.35);font-size:.8rem">{{ t('loading') }}</div>
                <table v-else-if="rows.length" class="dp-table" :style="'height:' + (widget.height || 200) + 'px'">
                    <thead>
                        <tr>
                            <th v-for="(col, ci) in cols" :key="ci"
                                v-if="col"
                                :style="thStyle(col)"
                                :class="col.sortable ? 'dp-sortable' : ''"
                                @click="col.sortable !== false && sortBy(ci)">
                                {{ col.info || col.data_name || t('column') + (ci+1) }}
                                <i v-if="col.sortable !== false" class="fas" :class="sortCol === ci ? (sortAsc ? 'fa-caret-up' : 'fa-caret-down') : 'fa-sort'" style="opacity:.5;font-size:.7rem;margin-left:4px"></i>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, ri) in rows" :key="ri" style="border-top:1px solid rgba(255,255,255,.06)">
                            <td v-for="(col, ci) in cols" :key="ci" v-if="col" :class="'text-' + (col.align || 'start')" :style="tdStyle(col)">
                                <div v-if="col.type === 'checkbox'">
                                    <span v-if="getBoolean(item[col.data_name])" style="color:#66bb6a"><i class="fas fa-check"></i></span>
                                    <span v-else style="color:rgba(255,255,255,.3)"><i class="fas fa-times"></i></span>
                                </div>
                                <div v-else-if="col.type === 'chip'">
                                    <span class="dp-chip" :style="{ background: item[col.color_column] || col.color || 'rgba(255,255,255,.15)' }" style="padding:2px 10px;border-radius:12px;display:inline-block;white-space:nowrap">
                                        {{ col.pre }}<a :style="{color: getChipText(item[col.color_column])}">{{ item[col.data_name] }}</a>{{ col.pos }}
                                    </span>
                                </div>
                                <div v-else-if="col.type === 'icon'" :style="{ color: item[col.color_column] || '#fff' }">
                                    <i :class="item[col.data_name] || ''"></i>
                                </div>
                                <div v-else-if="col.type === 'progressbar'" style="width:100%;min-width:120px">
                                    <div style="display:flex;align-items:center;gap:6px">
                                        <div class="dp-progress" :style="{ background: (item[col.color_column] || '#1976d2') } + ''">
                                            <div :style="{ width: Math.max(0, Math.min(100, Number(item[col.data_name]) || 0)) + '%', height: '100%', backgroundColor: item[col.color_column] || '#1976d2', borderRadius: col.striped ? '0' : (col.rounded ? '4px' : '0'), backgroundImage: col.striped ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.3) 0 6px, transparent 6px 12px)' : 'none' }"></div>
                                        </div>
                                        <span style="font-size:.75rem;white-space:nowrap">{{ col.pre }}<a style="color:rgba(255,255,255,.9)">{{ item[col.data_name] }}</a>{{ col.pos }}</span>
                                    </div>
                                </div>
                                <div v-else-if="col.type === 'button'">
                                    <button type="button" class="dp-btn" :style="{ background: item[col.color_column] || col.color || 'rgba(255,255,255,.15)' }" @click.stop="btnClick(item, col)">
                                        <i v-if="item[col.icon_value]" :class="item[col.icon_value]" style="margin-right:4px"></i>
                                        {{ col.pre }}{{ item[col.data_name] }}{{ col.pos }}
                                    </button>
                                </div>
                                <div v-else>
                                    {{ col.pre }}{{ item[col.data_name] }}{{ col.pos }}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else style="text-align:center;padding:16px;color:rgba(255,255,255,.35);font-size:.8rem">{{ t('no_data') }}</div>
            </div>
        </div>`,
    data() { return { items: [], timer: null, loading: false, sortCol: -1, sortAsc: true, queryError: '' }; },
    computed: {
        cardStyle() {
            const s = {};
            const mode = this.widget.bg_mode || (this.widget.color ? 'color' : 'default');
            if (mode === 'color' && this.widget.color) s.backgroundColor = this.widget.color;
            else if (mode === 'image' && this.widget.bg_image) {
                s.backgroundImage = 'url(' + this.widget.bg_image + ')';
                s.backgroundSize = 'cover';
                s.backgroundPosition = 'center';
            }
            return s;
        },
        cols() {
            let arr = [];
            try {
                const p = JSON.parse(this.widget.columns || '[]');
                if (Array.isArray(p)) arr = p;
            } catch(e) {}
            if (!arr.length && this.items.length) {
                arr = Object.keys(this.items[0]).map(k => ({ info: k, data_name: k, type: 'string', align: 'start', sortable: true }));
            }
            return arr;
        },
        rows() {
            let r = this.items;
            if (this.sortCol >= 0 && this.cols[this.sortCol]) {
                const c = this.cols[this.sortCol];
                r = [...r].sort((a, b) => {
                    const av = a[c.data_name], bv = b[c.data_name];
                    const an = Number(av), bn = Number(bv);
                    const cmp = (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') ? (an - bn) : String(av).localeCompare(String(bv));
                    return this.sortAsc ? cmp : -cmp;
                });
            }
            return r;
        }
    },
    mounted() {
        this.updateData();
        const timeout = parseInt(this.widget.timeout, 10);
        if (timeout > 0) this.timer = setInterval(() => this.updateData(), timeout * 1000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        thStyle(col) {
            const s = { padding: '6px 8px', textAlign: (col.align === 'center' ? 'center' : col.align === 'end' ? 'right' : 'left'), color: 'rgba(255,255,255,.6)', fontWeight: 500, whiteSpace: 'nowrap', fontSize: '.8rem' };
            if (col.sortable !== false) s.cursor = 'pointer';
            if (col.width) s.width = col.width;
            return s;
        },
        tdStyle(col) {
            const s = { padding: (col.separator ? '4px 8px' : '4px 4px'), color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', fontSize: '.8rem', borderRight: col.separator ? '1px solid rgba(255,255,255,.08)' : 'none', textAlign: (col.align === 'center' ? 'center' : col.align === 'end' ? 'right' : 'left') };
            if (col.width) s.minWidth = col.width;
            return s;
        },
        getBoolean(e) { return 'true' === e || 1 == e || !!e; },
        getChipText(color) {
            if (!color) return '#fff';
            const hex = String(color).replace('#', '');
            if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#fff';
            const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#000' : '#fff';
        },
        sortBy(ci) {
            if (this.sortCol === ci) this.sortAsc = !this.sortAsc;
            else { this.sortCol = ci; this.sortAsc = true; }
        },
        btnClick(item, col) {
            if (this.widget.callback_type === 'property' && this.widget.object && this.widget.property) {
                dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property, value: String(item[col.data_name]) }));
            } else if (this.widget.callback_type === 'method' && this.widget.callback_method) {
                const p = String(this.widget.callback_method).split('/');
                dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : '') + '?param=' + encodeURIComponent(JSON.stringify(item)));
            } else if (this.widget.callback_type === 'script' && this.widget.script) {
                dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: JSON.stringify(item) }));
            }
        },
        async updateData() {
            const query = (this.widget.query || '').trim();
            if (!query) { this.items = []; return; }
            this.loading = true;
            this.queryError = '';
            try {
                const d = await dpAPI('query?' + new URLSearchParams({ query }));
                this.items = (d && !d.error && Array.isArray(d.data)) ? d.data : [];
                if (d && d.error) this.queryError = d.error;
                this.loading = false;
            } catch(e) {
                this.items = [];
                this.queryError = 'fetch failed';
                this.loading = false;
            }
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.table = TableWidget;