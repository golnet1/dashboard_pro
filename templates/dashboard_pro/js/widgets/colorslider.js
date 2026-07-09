const ColorSliderWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'Объект цвета', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-palette', icon_type: 'icon' },
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
                const params = this.widget.property ? { object: this.widget.object, property: this.widget.property } : { object: this.widget.object };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
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
                const params = this.widget.property ? { object: this.widget.object, property: this.widget.property, value: hex } : { object: this.widget.object, value: hex };
                await dpAPI('setProperty?' + new URLSearchParams(params));
            } catch(e) {}
        }
    }
};
