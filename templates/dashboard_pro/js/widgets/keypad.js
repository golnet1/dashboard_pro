const KeypadWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Клавиатура' }}</div>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;gap:6px">
                <div style="text-align:center;font-size:1.8rem;font-weight:300;color:rgba(255,255,255,.87);padding:4px 0;min-height:2.5rem;font-family:monospace">{{ display }}</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
                    <button v-for="k in keys" :key="k" @click="press(k)" style="padding:8px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.8);font-size:1rem;cursor:pointer;text-align:center" :style="k === 'OK' ? 'background:var(--primary);color:#fff;border-color:var(--primary)' : (k === 'C' ? 'background:rgba(239,68,68,.2);color:#ef4444;border-color:rgba(239,68,68,.3)' : '')">{{ k }}</button>
                </div>
            </div>
        </div>`,
    data() {
        return { display: '' };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        keys() { return ['1','2','3','4','5','6','7','8','9','C','0','OK']; }
    },
    methods: {
        press(k) {
            if (k === 'C') { this.display = ''; return; }
            if (k === 'OK') {
                if (this.widget.object && this.display) {
                    dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, property: this.widget.property || 'value', value: this.display }));
                }
                return;
            }
            if (this.display.length < 10) this.display += k;
        }
    }
};
