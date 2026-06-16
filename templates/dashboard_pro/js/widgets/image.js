const ImageWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'object', label: 'Объект', type: 'object' },
            { key: 'url', label: 'URL изображения', type: 'text', placeholder: 'https://example.com/image.jpg' },
            { key: 'help', type: 'info', text: 'Можно использовать {value} в URL — подставится значение объекта' },
            { key: 'timeout', label: 'Обновление (сек)', type: 'number', default: 0, placeholder: '0 — без обновления' },
        ],
    },
    defaults: { icon: 'fas fa-image', url: '', timeout: 0 },
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
            if (!obj) return;
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj }));
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