const SlideShowWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'images', label: 'Изображения (JSON или через запятую)', type: 'textarea', rows: 2, placeholder: 'url1.jpg, url2.jpg, url3.jpg' },
            { key: 'interval', label: 'Интервал (сек)', type: 'number', default: 5 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-images', icon_type: 'icon', images: '', interval: 5 },
    template: `
        <div class="widget-v-card" :style="'overflow:hidden;position:relative;' + cardStyleStr" style="display:flex;align-items:center;justify-content:center">
            <img v-if="currentImage" :src="currentImage" style="width:100%;height:100%;object-fit:cover;transition:opacity .5s" :style="'opacity:' + (loaded ? 1 : 0)">
            <div v-else style="color:rgba(255,255,255,.3);font-size:.8rem">Нет изображений</div>
        </div>`,
    data() {
        return { currentIndex: 0, loaded: false, timer: null };
    },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            if (this.widget.height) s.height = this.widget.height + 'px';
            return s;
        },
        cardStyleStr() {
            const s = this.cardStyle;
            return Object.keys(s).map(k => k + ':' + s[k]).join(';');
        },
        images() {
            if (!this.widget.images) return [];
            try { return JSON.parse(this.widget.images); } catch { return this.widget.images.split(',').map(s => s.trim()).filter(Boolean); }
        },
        currentImage() { return this.images.length ? this.images[this.currentIndex] : null; }
    },
    mounted() {
        if (this.images.length > 1) {
            this.timer = setInterval(() => {
                this.loaded = false;
                this.currentIndex = (this.currentIndex + 1) % this.images.length;
                setTimeout(() => this.loaded = true, 50);
            }, (this.widget.interval || 5) * 1000);
        }
        setTimeout(() => this.loaded = true, 100);
    },
    beforeUnmount() {
        if (this.timer) clearInterval(this.timer);
    }
};
