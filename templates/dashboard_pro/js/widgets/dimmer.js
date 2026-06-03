const DimmerWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :class="{ 'widget-v-card--on': isOn }" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon" :style="isOn ? 'color:var(--primary)' : ''"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Диммер' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="v-input--switch" :class="{ 'input--is-checked': isOn }" @click.stop="toggle">
                    <div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div>
                </div>
            </div>
            <div class="widget-v-card__body" style="padding:0 12px 12px">
                <div class="v-slider theme--dark" style="width:100%">
                    <input type="range" class="v-slider__input" :min="min" :max="max" :step="step" v-model.number="level" @change="onChange" :disabled="loading">
                    <div class="v-slider__track"><div class="v-slider__track-fill" :style="{width: levelPerc + '%'}"></div></div>
                    <div class="v-slider__thumb-container" :style="{left: levelPerc + '%'}"><div class="v-slider__thumb"></div></div>
                </div>
                <div style="text-align:center;font-size:.85rem;margin-top:4px;color:rgba(255,255,255,.6)">{{ level }}{{ widget.unit || '%' }}</div>
            </div>
        </div>`,
    data() {
        return { isOn: false, level: 0, loading: false, timer: null, min: 0, max: 100, step: 1 };
    },
    mounted() {
        this.min = this.widget.level_min != null ? Number(this.widget.level_min) : 0;
        this.max = this.widget.level_max != null ? Number(this.widget.level_max) : 100;
        this.step = this.widget.level_step != null ? Number(this.widget.level_step) : 1;
        this.loadState();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) this.timer = setInterval(() => this.loadState(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        levelPerc() {
            const range = this.max - this.min;
            if (range === 0) return 0;
            return ((this.level - this.min) / range) * 100;
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadState() {
            let obj = this.widget.object_value || this.widget.object;
            let levelProp = this.widget.property || 'level';
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: levelProp }));
                if (!d.error && d.value !== undefined) {
                    const val = Number(d.value);
                    this.level = isNaN(val) ? 0 : Math.min(this.max, Math.max(this.min, val));
                    this.isOn = this.level > 0;
                }
            } catch (e) { /* silent */ }
        },
        async toggle() {
            if (this.loading) return;
            this.loading = true;
            const next = !this.isOn;
            let obj = this.widget.object_value || this.widget.object;
            try {
                if (this.widget.object_switch) {
                    await dpAPI('method/' + this.widget.object_switch);
                } else {
                    await dpAPI('setProperty?' + new URLSearchParams({
                        object: obj, property: this.widget.property || 'status', value: next ? '1' : '0'
                    }));
                }
                this.isOn = next;
                if (next && this.level === 0) this.level = Math.round((this.max - this.min) / 2);
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        async onChange() {
            if (this.loading) return;
            this.loading = true;
            let obj = this.widget.object_value || this.widget.object;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: this.widget.property || 'level', value: String(this.level)
                }));
                this.isOn = this.level > 0;
            } catch (e) { /* silent */ }
            this.loading = false;
        }
    }
};