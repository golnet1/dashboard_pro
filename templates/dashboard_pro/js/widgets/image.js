const ImageWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
            { key: 'url', label: 'field_image_url', type: 'text', placeholder: 'https://example.com/image.jpg' },
            { key: 'help', type: 'info', text: 'help_url_value' },
            { key: 'timeout', label: 'field_timeout', type: 'number', default: 0, placeholder: 'ph_no_update' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
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
                <span style="font-size:.85rem">{{ widget.title || t('widget_image') }}</span>
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