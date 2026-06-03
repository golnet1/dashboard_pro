const ButtonWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Кнопка' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;align-items:center;justify-content:center;flex:1;padding:8px">
                <button class="v-btn v-btn--is-elevated v-btn--has-bg theme--dark" style="min-width:120px" :class="{ 'v-btn--loading': loading }" @click="execute" :disabled="loading">
                    <span class="v-btn__content">
                        <i v-if="widget.icon" :class="widget.icon" style="margin-right:6px"></i>
                        {{ loading ? '...' : (widget.buttonText || 'Выполнить') }}
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
                    await dpAPI('setProperty?' + new URLSearchParams({
                        object: this.widget.object, value: this.widget.value
                    }));
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