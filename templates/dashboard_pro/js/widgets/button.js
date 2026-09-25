const ButtonWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon', label: 'field_icon', type: 'icon_picker' },
            { key: 'button_type', label: 'field_button_type', type: 'select', default: 'script', options: [{value:'script',label:'opt_script'},{value:'method',label:'opt_method'},{value:'panel',label:'opt_panel'}] },
            { key: 'method_obj', label: 'field_method_object', type: 'method_object', parent: 'method', showIf: { button_type: 'method' }, row: 'm_row' },
            { key: 'method', label: 'field_method', type: 'method', parent: 'method', showIf: { button_type: 'method' }, row: 'm_row' },
            { key: 'script', label: 'field_script', type: 'script', showIf: { button_type: 'script' } },
            { key: 'param', label: 'field_param', type: 'text', showIf: { button_type: ['script', 'method'] } },
            { key: 'panel', label: 'field_panel', type: 'panel_select', showIf: { button_type: 'panel' } },
            { key: 'object_alive', label: 'field_alive_flag', type: 'object', row: 'alive_row' },
            { key: 'property_alive', label: 'field_alive_property', type: 'property', row: 'alive_row' },
            { key: 'alive_timeout', label: 'field_alive_timeout', type: 'number', step: 1 },
            { key: 'color', label: 'field_color', type: 'color' },
        ],
    },
    defaults: { icon: 'fas fa-play', button_type: 'script', script: '', method: '', panel: '', param: '', color: '#1565c0', height: 90 },
    template: `
        <div class="widget-v-card widget-v-card--button" :style="cardStyle">
            <button type="button" class="dp-button dp-button--cover" @click="execute">
                <i v-if="widget.icon" :class="widget.icon" class="dp-button__icon"></i>
                <span v-if="widget.title" class="dp-button__title">{{ widget.title }}</span>
            </button>
            <div v-if="aliveDisabled" class="dp-button--dead-overlay"></div>
        </div>`,
    data() { return { loading: false, isAlive: true, availTimer: null }; },
    mounted() {
        if (this.widget.object_alive && this.widget.property_alive) {
            this.checkAlive();
            this.availTimer = setInterval(() => this.checkAlive(), (this.widget.alive_timeout || 3) * 1000);
        }
    },
    beforeUnmount() { if (this.availTimer) clearInterval(this.availTimer); },
    computed: {
        aliveDisabled() {
            return this.widget.object_alive && this.widget.property_alive && this.isAlive === false;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async checkAlive() {
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object_alive, property: this.widget.property_alive }));
                this.isAlive = !d.error && String(d.value) !== '0';
            } catch (e) { /* keep current state on transient error */ }
        },
        async execute() {
            if (this.loading || this.aliveDisabled) return;
            this.loading = true;
            try {
                if (this.widget.button_type === 'panel' && this.widget.panel) {
                    const vm = window.__dp_vm;
                    if (vm && vm.panels) {
                        const p = vm.panels.find(p => p.name === this.widget.panel);
                        if (p && vm.selectPanel) vm.selectPanel(p);
                    }
                } else if (this.widget.button_type === 'script' && this.widget.script) {
                    if (this.widget.param) {
                        await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: this.widget.param }));
                    } else {
                        await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script }));
                    }
                } else if (this.widget.button_type === 'method' && this.widget.method) {
                    const p = this.widget.method.split('/');
                    const base = 'method/' + p[0] + (p[1] ? '/' + p[1] : '');
                    await dpAPI(base + (this.widget.param ? '?param=' + encodeURIComponent(this.widget.param) : ''));
                } else if (this.widget.method) {
                    const p = this.widget.method.split('/');
                    await dpAPI('method/' + p[0] + (p[1] ? '/' + p[1] : ''));
                } else if (this.widget.object && this.widget.value !== undefined && this.widget.value !== null && this.widget.value !== '') {
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

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.button = ButtonWidget;