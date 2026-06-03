const TableWidget = {
    props: ['widget'],
    fields: {
        main: [
            { key: 'url', label: 'URL (JSON)', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'query', label: 'Запрос', type: 'textarea', rows: 5, placeholder: 'SQL-запрос или JSONPath' },
        ],
        columns: [
            { key: 'info', label: 'Информация', type: 'text' },
            { key: 'data_name', label: 'Имя колонки с данными', type: 'text' },
            { key: 'align', label: 'Выравнивание', type: 'select', options: [
                { value: 'start', title: 'Left' },
                { value: 'center', title: 'Center' },
                { value: 'end', title: 'Right' },
            ]},
            { key: 'width', label: 'Ширина', type: 'text' },
            { key: 'sortable', label: 'Разрешить сортировку', type: 'checkbox' },
            { key: 'separator', label: 'Разделитель', type: 'checkbox' },
            { key: 'data_type', label: 'Тип данных', type: 'select', options: [] },
            { key: 'color_column', label: 'Имя колонки с цветом', type: 'text' },
        ],
    },
    defaults: { icon: 'fas fa-table', url: '', query: '', refresh: 60, columns: '[]' },
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
