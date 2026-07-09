const SliderWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
            { key: 'min', label: 'Мин', type: 'number', row: 'range' },
            { key: 'max', label: 'Макс', type: 'number', row: 'range' },
            { key: 'step', label: 'Шаг', type: 'number', step: 'any', row: 'range' },
            { key: 'prepend_icon', label: 'Иконка слева', type: 'icon_picker', placeholder: 'fas fa-minus', row: 'icons' },
            { key: 'append_icon', label: 'Иконка справа', type: 'icon_picker', placeholder: 'fas fa-plus', row: 'icons' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-sliders-h', icon_type: 'icon', property: 'level', min: 0, max: 100, step: 1, prepend_icon: '', append_icon: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Слайдер' }}</div>
                <div class="widget-v-card__spacer"></div>
                <div class="widget-v-card__value-text" style="font-size:1rem;font-weight:600">{{ currentValue }}<span v-if="widget.unit" style="font-size:.75rem;opacity:.6;margin-left:2px">{{ widget.unit }}</span></div>
            </div>
            <div class="widget-v-card__body" style="padding:0 12px 12px">
                <div class="v-slider theme--dark" style="width:100%">
                    <i v-if="widget.prepend_icon" :class="widget.prepend_icon" style="font-size:.85rem;color:rgba(255,255,255,.5);margin-right:4px;cursor:pointer" @click="down"></i>
                    <input type="range" class="v-slider__input" :min="min" :max="max" :step="step" v-model.number="currentValue" @input="onInput" @change="onChange" :disabled="loading">
                    <div class="v-slider__track"><div class="v-slider__track-fill" :style="{width: fillPercent + '%'}"></div></div>
                    <div class="v-slider__thumb-container" :style="{left: fillPercent + '%'}"><div class="v-slider__thumb"></div></div>
                    <i v-if="widget.append_icon" :class="widget.append_icon" style="font-size:.85rem;color:rgba(255,255,255,.5);margin-left:4px;cursor:pointer" @click="up"></i>
                </div>
            </div>
        </div>`,
    data() {
        return { currentValue: 0, loading: false, timer: null, min: 0, max: 100, step: 1 };
    },
    mounted() {
        this.min = this.widget.min != null ? Number(this.widget.min) : 0;
        this.max = this.widget.max != null ? Number(this.widget.max) : 100;
        this.step = this.widget.step != null ? Number(this.widget.step) : 1;
        this.loadValue();
        let obj = this.widget.object_value || this.widget.object;
        let prop = this.widget.property;
        if (obj && prop) this.timer = setInterval(() => this.loadValue(), 5000);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    },
    computed: {
        fillPercent() {
            const range = this.max - this.min;
            if (range === 0) return 0;
            return ((this.currentValue - this.min) / range) * 100;
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
                    this.currentValue = Number(d.value);
                }
            } catch (e) { /* silent */ }
        },
        onInput() {
        },
        async onChange() {
            if (this.loading) return;
            this.loading = true;
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            try {
                await dpAPI('setProperty?' + new URLSearchParams({
                    object: obj, property: prop || 'level', value: String(this.currentValue)
                }));
            } catch (e) { /* silent */ }
            this.loading = false;
        },
        up() {
            this.currentValue = Math.min(this.max, this.currentValue + this.step);
            this.onChange();
        },
        down() {
            this.currentValue = Math.max(this.min, this.currentValue - this.step);
            this.onChange();
        }
    }
};