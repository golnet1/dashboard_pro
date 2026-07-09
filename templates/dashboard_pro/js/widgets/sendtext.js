const SendTextWidget = {
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
            { key: 'url', label: 'URL (используйте {text})', type: 'text', placeholder: '/command.php?qry=<text>' },
            { key: 'autosend', label: 'Отправлять после голоса', type: 'checkbox' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-paper-plane', icon_type: 'icon', url: '', autosend: false },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Отправить' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;flex-direction:column;gap:8px;padding:8px 12px">
                <div style="display:flex;gap:6px">
                    <input v-model="text" :placeholder="widget.placeholder || 'Введите текст'" style="flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:8px 10px;color:#fff;font-size:.9rem;outline:none" @keyup.enter="send">
                    <button class="icon-btn" @click="send" title="Отправить" style="margin-top:0"><i class="fas fa-paper-plane"></i></button>
                </div>
                <div v-if="response" style="font-size:.8rem;color:rgba(255,255,255,.6);word-break:break-all">{{ response }}</div>
            </div>
        </div>`,
    data() { return { text: '', response: '', sending: false }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async send() {
            if (!this.text || this.sending) return;
            this.sending = true;
            this.response = '';
            try {
                const url = (this.widget.url || '').replace('<text>', encodeURIComponent(this.text));
                if (url) {
                    const r = await fetch(url);
                    const t = await r.text();
                    this.response = t.substring(0, 200);
                } else if (this.widget.object && this.widget.property) {
                    await dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, value: this.text }));
                    this.response = 'OK';
                }
            } catch(e) { this.response = 'Ошибка: ' + e.message; }
            this.sending = false;
            if (!this.widget.url && !this.widget.object) this.response = '';
        }
    }
};
