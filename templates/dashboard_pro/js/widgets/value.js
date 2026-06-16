const ValueWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
            { key: 'aliasLabels', label: 'Псевдонимы (JSON)', type: 'text', placeholder: '{"1":"Вкл","0":"Выкл"}' },
        ],
        advanced: [
            { key: 'object_info', label: 'Информация объекта', type: 'object' },
            { key: 'pre_info', label: 'Префикс информации', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'Постфикс информации', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-hashtag', aliasLabels: null, background: false, round: false },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Значение' }}</div>
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
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_info }));
                if (!d.error) this.infoValue = d.value;
            } catch (e) { /* silent */ }
            this.infoTimer = setInterval(() => {
                if (this.widget.object_info) {
                    dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_info }))
                        .then(d => { if (!d.error) this.infoValue = d.value; })
                        .catch(() => {});
                }
            }, 5000);
        }
    }
};