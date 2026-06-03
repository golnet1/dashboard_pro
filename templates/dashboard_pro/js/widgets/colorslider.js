const ColorSliderWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Цвет' }}</div>
                <div class="widget-v-card__spacer"></div>
                <span style="font-size:.75rem;font-family:monospace;color:rgba(255,255,255,.6)">{{ hexColor }}</span>
            </div>
            <div class="widget-v-card__body" style="padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:.72rem;color:rgba(255,255,255,.5);width:16px">R</span>
                    <input type="range" min="0" max="255" v-model.number="r" @input="updateColor" style="flex:1;accent-color:#ef4444">
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:.72rem;color:rgba(255,255,255,.5);width:16px">G</span>
                    <input type="range" min="0" max="255" v-model.number="g" @input="updateColor" style="flex:1;accent-color:#22c55e">
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:.72rem;color:rgba(255,255,255,.5);width:16px">B</span>
                    <input type="range" min="0" max="255" v-model.number="b" @input="updateColor" style="flex:1;accent-color:#3b82f6">
                </div>
                <div :style="'height:24px;border-radius:4px;background:' + hexColor + ';border:1px solid rgba(255,255,255,.15)'"></div>
            </div>
        </div>`,
    data() {
        return { r: 255, g: 255, b: 255, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        hexColor() { return '#' + [this.r,this.g,this.b].map(v => v.toString(16).padStart(2,'0')).join(''); }
    },
    mounted() {
        this.loadColor();
        if (this.widget.object) this.timer = setInterval(() => this.loadColor(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    methods: {
        async loadColor() {
            if (!this.widget.object) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: this.widget.object }));
                if (!d.error && d.value) {
                    let c = String(d.value).replace('#','');
                    if (c.length >= 6) {
                        this.r = parseInt(c.substring(0,2), 16) || 255;
                        this.g = parseInt(c.substring(2,4), 16) || 255;
                        this.b = parseInt(c.substring(4,6), 16) || 255;
                    }
                }
            } catch(e) {}
        },
        async updateColor() {
            if (!this.widget.object) return;
            try {
                const hex = this.r.toString(16).padStart(2,'0') + this.g.toString(16).padStart(2,'0') + this.b.toString(16).padStart(2,'0');
                await dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, value: hex }));
            } catch(e) {}
        }
    }
};
