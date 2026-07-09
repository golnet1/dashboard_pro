const SendTextWidget = {
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
            { key: 'url', label: 'URL (используйте {text})', type: 'text', placeholder: '/command.php?qry=<text>' },
            { key: 'autosend', label: 'Отправлять после голоса', type: 'checkbox' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
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
