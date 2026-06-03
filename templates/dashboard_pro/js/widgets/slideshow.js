const SlideShowWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'images', label: 'Изображения (JSON или через запятую)', type: 'textarea', rows: 2, placeholder: 'url1.jpg, url2.jpg, url3.jpg' },
            { key: 'interval', label: 'Интервал (сек)', type: 'number', default: 5 },
        ],
    },
    defaults: { icon: 'fas fa-images', images: '', interval: 5 },
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
