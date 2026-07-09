const SlideShowWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'images', label: 'Изображения (JSON или через запятую)', type: 'textarea', rows: 2, placeholder: 'url1.jpg, url2.jpg, url3.jpg' },
            { key: 'interval', label: 'Интервал (сек)', type: 'number', default: 5 },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
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
