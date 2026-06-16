const RelayWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
            { key: 'object_switch_obj', label: 'Объект (перекл)', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_switch', label: 'Метод (перекл)', type: 'method', parent: 'object_switch', row: 'm_switch' },
            { key: 'object_on_obj', label: 'Объект (вкл)', type: 'method_object', parent: 'object_on', row: 'm_on' },
            { key: 'object_on', label: 'Метод (вкл)', type: 'method', parent: 'object_on', row: 'm_on' },
            { key: 'object_off_obj', label: 'Объект (выкл)', type: 'method_object', parent: 'object_off', row: 'm_off' },
            { key: 'object_off', label: 'Метод (выкл)', type: 'method', parent: 'object_off', row: 'm_off' },
        ],
        advanced: [
            { key: 'object_alive', label: 'Признак доступности', type: 'object' },
            { key: 'alive_timeout', label: 'Таймаут (сек)', type: 'number', step: 1 },
            { key: 'object_info', label: 'Информация объекта', type: 'object' },
            { key: 'pre_info', label: 'Префикс информации', type: 'text', row: 'info_affix' },
            { key: 'pos_info', label: 'Постфикс информации', type: 'text', row: 'info_affix' },
        ],
    },
    defaults: { icon: 'fas fa-power-off', background: false, round: false },
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Реле' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div v-if="widget.object_info && infoValue" class="widget-v-card__info">
                <span v-if="widget.pre_info">{{ widget.pre_info }}</span>{{ infoValue }}<span v-if="widget.pos_info">{{ widget.pos_info }}</span>
            </div>
            <div v-if="loading" class="widget-v-card__loading"><div class="v-progress-linear v-progress-linear--active"><div class="v-progress-linear__determinate" style="width:100%"></div></div></div>
        </div>`,
    data() {
        return { isOn: false, loading: false, infoValue: '', timer: null, infoTimer: null, aliveTimer: null, isAlive: true };
    },
    mounted() {
        this.loadState();
        if (this.widget.object_value || this.widget.object) this.timer = setInterval(() => this.loadState(), 3000);
        if (this.widget.object_info) this.loadInfo();
        if (this.widget.object_alive) this.checkAlive();
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.infoTimer) clearInterval(this.infoTimer);
        if (this.aliveTimer) clearInterval(this.aliveTimer);
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadState() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error) {
                    const val = typeof d.value === 'string' ? d.value : String(d.value);
                    this.isOn = val === '1' || val === 'ON' || val === 'true';
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading) return;
            this.loading = true;
            const next = !this.isOn;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (this.widget.object_switch) {
                const p = this.widget.object_switch.split('/');
                await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
            } else if (this.widget.object_on && this.widget.object_off) {
                const pon = this.widget.object_on.split('/');
                const poff = this.widget.object_off.split('/');
                const p = next ? pon : poff;
                await dpAPI('method/' + p[0] + (p[1] ? '?' + p[1] : ''));
            } else {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: prop || 'status', value: next ? '1' : '0'
                }));
            }
            this.isOn = next;
            this.loading = false;
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
        },
        async checkAlive() {
            if (!this.widget.object_alive) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive }));
                this.isAlive = !d.error;
            } catch (e) { this.isAlive = false; }
            this.aliveTimer = setInterval(async () => {
                try {
                    const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive }));
                    this.isAlive = !d.error;
                } catch (e) { this.isAlive = false; }
            }, (this.widget.alive_timeout || 60) * 1000);
        }
    }
};