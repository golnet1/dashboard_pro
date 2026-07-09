const ImageWidget = {
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
            { key: 'url', label: 'URL изображения', type: 'text', placeholder: 'https://example.com/image.jpg' },
            { key: 'help', type: 'info', text: 'Можно использовать {value} в URL — подставится значение объекта' },
            { key: 'timeout', label: 'Обновление (сек)', type: 'number', default: 0, placeholder: '0 — без обновления' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-image', icon_type: 'icon', url: '', timeout: 0 },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="padding:0;overflow:hidden">
            <div v-if="loading" style="display:flex;align-items:center;justify-content:center;height:100%">
                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:rgba(255,255,255,.3)"></i>
            </div>
            <img v-show="!loading" :src="imageUrl" @load="loading=false" @error="loading=false;error=true"
                style="width:100%;height:100%;object-fit:contain" :style="{display: error ? 'none' : 'block'}"/>
            <div v-if="error && !loading" style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.3);flex-direction:column;gap:8px">
                <i class="fas fa-image" style="font-size:2rem"></i>
                <span style="font-size:.85rem">{{ widget.title || 'Изображение' }}</span>
            </div>
        </div>`,
    data() {
        return { imageUrl: '', loading: true, error: false, timer: null, valueTimer: null, objValue: null };
    },
    mounted() {
        this.updateUrl();
        let obj = this.widget.object_value || this.widget.object;
        if (obj) {
            this.loadObjValue();
            this.valueTimer = setInterval(() => this.loadObjValue(), 3000);
        }
        if (this.widget.timeout && this.widget.timeout > 0) {
            this.timer = setInterval(() => this.updateUrl(), this.widget.timeout * 1000);
        }
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
        if (this.valueTimer) clearInterval(this.valueTimer);
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async loadObjValue() {
            let obj = this.widget.object_value || this.widget.object;
            let prop = this.widget.property;
            if (!obj) return;
            try {
                const params = prop ? { object: obj, property: prop } : { object: obj };
                const d = await dpAPI('getProperty?' + new URLSearchParams(params));
                if (!d.error && d.value !== undefined) {
                    this.objValue = d.value;
                    this.updateUrl();
                }
            } catch (e) { /* silent */ }
        },
        updateUrl() {
            let url = this.widget.url || '';
            if (this.objValue && url.includes('{value}')) {
                url = url.replace(/\{value\}/g, this.objValue);
            } else if (this.objValue && !url) {
                url = this.objValue;
            }
            if (url) {
                const ts = '?ts=' + Date.now();
                this.imageUrl = url.includes('?') ? url + '&ts=' + Date.now() : url + ts;
            } else {
                this.imageUrl = '';
            }
            this.loading = true;
            this.error = false;
        }
    }
};